"use client";

import { useState, useEffect } from "react";
import {
    Package, Plus, Search, Pencil, Trash2, X,
    Tag, DollarSign, AlertCircle, Loader2,
    ImageIcon, Camera,
} from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import { useProducts } from "@/hooks/useProducts";
import { useCategories, useProductsMaestro } from "@/hooks/useMaestros";
import { uploadImagesToCloudinary } from "./utils/cloudinary";
import styles from "./Producto.module.css";

/* ─── Helpers ─── */
const fmt = (n) => n != null ? `Q${Number(n).toFixed(2)}` : "—";

// Componente helper para escanear códigos de barras
// Componente helper para escanear códigos de barras
export function BarcodeScannerOverlay({ open, onScan, onClose }) {
    const [scanError, setScanError] = useState("");

    useEffect(() => {
        if (!open) return;

        let html5QrCode;
        let active = true;

        const startScanner = async () => {
            try {
                // Importación dinámica para prevenir errores SSR en Next.js
                const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
                if (!active) return;

                // Definir formatos específicos para acelerar y mejorar el escaneo de códigos de barra
                const formatsToSupport = [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.ITF,
                    Html5QrcodeSupportedFormats.QR_CODE
                ];

                html5QrCode = new Html5Qrcode("barcode-scanner-viewport", {
                    formatsToSupport: formatsToSupport,
                    useBarCodeDetectorIfSupported: true
                });

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,             // 10 fps es ideal para procesamiento estable en móviles
                        qrbox: (width, height) => {
                            // Un recuadro más ancho y delgado optimizado para códigos de barra de productos
                            const boxWidth = Math.min(width - 40, 280);
                            const boxHeight = Math.min(height - 40, 130);
                            return { width: boxWidth, height: boxHeight };
                        },
                        aspectRatio: 1.777778, // 16:9 aspecto estándar
                        disableFlip: true      // No voltear horizontalmente para mantener legibilidad de códigos de barras
                    },
                    (decodedText) => {
                        onScan(decodedText);
                        onClose();
                    },
                    (errorMessage) => {
                        // Ignorar errores repetitivos de escaneo fallido
                    }
                );
            } catch (err) {
                console.error("Scanner error", err);
                if (active) {
                    setScanError("No se pudo iniciar la cámara. Verifica los permisos.");
                }
            }
        };

        const timer = setTimeout(startScanner, 300);

        return () => {
            active = false;
            clearTimeout(timer);
            if (html5QrCode) {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop()
                        .catch(err => console.error("Error stopping scanner on unmount", err));
                }
            }
        };
    }, [open, onScan, onClose]);

    if (!open) return null;

    return (
        <div className={styles.scannerOverlay}>
            <div className={styles.scannerModal}>
                <div className={styles.scannerHeader}>
                    <h3>Escanear Código de Barras</h3>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.scannerBody}>
                    {scanError ? (
                        <p className={styles.scannerError}>{scanError}</p>
                    ) : (
                        <div className={styles.scannerViewportContainer}>
                            <div id="barcode-scanner-viewport" className={styles.scannerViewport}></div>
                            <div className={styles.scannerLaser}></div>
                        </div>
                    )}
                    <p className={styles.scannerInstruction}>
                        Apunta la cámara al código de barras del producto.
                    </p>
                </div>
                <div className={styles.scannerActions}>
                    <button type="button" onClick={onClose} className={styles.btnSecondary}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

// 2. Retornamos el objeto completo
const EMPTY_FORM = {
    nombre: "",
    descripcion: "",
    categoriaId: "",
    fotoPrincipal: "",
    codigoBarras: "",
    esVariacion: false,

    // PRECIOS
    precioCompra: "",
    precioNormal: "",
    precioConDescuento: "",

    stockInicial: "",
    variacionNombre: "",
    variaciones: [],
    presentaciones: [],
    productoMaestroId: "",
};

const ProductFormMode = {
    PRODUCTO: 'PRODUCTO',
    PRODUCTO_MAESTRO: 'PRODUCTO_MAESTRO',
    AGREGAR_VARIACIONES: 'AGREGAR_VARIACIONES'
};


/* ─── Card de producto ─── */
function ProductoCard({ producto, onEdit, onDelete, onAddVariations }) {
    const isMaster = producto.esProductoMaestro || producto.esMaestro || producto.esMaster || (producto.esVariacion && !producto.parentId);
    return (
        <article className={styles.card} id={`prod-card-${producto.id}`}>
            {/* Imagen */}
            <div className={styles.cardThumb}>
                {producto.fotoPrincipal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={producto.fotoPrincipal} alt={producto.nombre} className={styles.thumbImg} />
                ) : (
                    <Package size={28} strokeWidth={1.4} className={styles.thumbPlaceholder} />
                )}
                {producto.activo === false && (
                    <span className={styles.inactiveBadge}>Inactivo</span>
                )}
                {isMaster && (
                    <span className={styles.masterBadge}>Maestro</span>
                )}
            </div>

            {/* Info */}
            <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                    <div>
                        <h3 className={styles.cardName}>
                            {producto.nombre}
                        </h3>
                        {producto.descripcion && (
                            <p className={styles.cardDesc}>{producto.descripcion}</p>
                        )}
                    </div>
                    <div className={styles.cardActions}>
                        <button
                            id={`btn-edit-prod-${producto.id}`}
                            className={styles.actionBtn}
                            onClick={() => onEdit(producto)}
                            title="Editar producto"
                        >
                            <Pencil size={15} strokeWidth={1.8} />
                        </button>
                        <button
                            id={`btn-delete-prod-${producto.id}`}
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => onDelete(producto)}
                            title="Eliminar producto"
                        >
                            <Trash2 size={15} strokeWidth={1.8} />
                        </button>
                    </div>
                </div>

                <div className={styles.cardPrices}>
                    <span className={styles.pricePrincipal}>
                        {fmt(producto.presentaciones?.reduce((actual, min) => parseFloat(actual.precioVenta) < parseFloat(min.precioVenta) ? actual : min)?.precioVenta)}
                    </span>
                    {producto.precioConDescuento && (
                        <span className={styles.priceDiscount}>{fmt(producto.precioConDescuento)}</span>
                    )}
                    {producto.precioNormal && (
                        <span className={styles.priceNormal}>{fmt(producto.precioNormal)}</span>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {producto.categoriaId && (
                        <span className={styles.chip}>
                            <Tag size={11} strokeWidth={2} /> {producto.categoriaId}
                        </span>
                    )}
                    {producto.slug && (
                        <span className={styles.chipGray}>/{producto.slug}</span>
                    )}
                </div>
            </div>
        </article>
    );
}

/* ─── Helper: campo de formulario ─── */
function Field({ label, htmlFor, children }) {
    return (
        <div className={styles.field}>
            <label htmlFor={htmlFor} className={styles.label}>{label}</label>
            {children}
        </div>
    );
}

/* ─── Modal crear/editar ─── */
function ProductoModal({ open, onClose, onSaved, initial, usuario, modalMode = ProductFormMode.PRODUCTO }) {
    const isEdit = !!initial?.id;
    const [currentMode, setCurrentMode] = useState(modalMode);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { categories, isLoading: catLoading } = useCategories();
    const { maestros, isLoading: maestrosLoading } = useProductsMaestro();
    const [scanner, setScanner] = useState(null); // { onScan: (code) => void } | null

    const startScan = (onScan) => {
        setScanner({ onScan });
    };

    const stopScan = () => {
        setScanner(null);
    };

    /* Pre-llenado */
    useEffect(() => {
        if (!open) return;
        setError("");

        if (modalMode === ProductFormMode.AGREGAR_VARIACIONES) {
            setCurrentMode(ProductFormMode.AGREGAR_VARIACIONES);
            setForm({
                ...EMPTY_FORM,
                nombre: initial?.nombre ?? "",
                descripcion: initial?.descripcion ?? "",
                categoriaId: initial?.categoriaId ?? "",
                variacionNombre: initial?.variacionNombre ?? "",
                productoMaestroId: initial?.id ?? "",
                variaciones: [
                    {
                        idTemp: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        valor: "",
                        codigoBarras: "",
                        fotoPrincipal: "",
                        stockInicial: "",
                        precioCompra: ""
                    }
                ],
                presentaciones: []
            });
        } else if (isEdit) {
            const isMaster = initial?.esMaestro || initial?.esMaster || (initial?.esVariacion && !initial?.parentId);
            const initialMode = isMaster ? ProductFormMode.PRODUCTO_MAESTRO : ProductFormMode.PRODUCTO;
            setCurrentMode(initialMode);

            const mappedVar = (initial.variaciones ?? []).map(v => ({
                idTemp: v.id || v.idTemp || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                valor: v.valor || v.valorVariacion || "",
                codigoBarras: v.codigoBarras || v.codigo || "",
                fotoPrincipal: v.fotoPrincipal || "",
                stockInicial: (v.stockInicial !== undefined && v.stockInicial !== null) ? v.stockInicial : "",
                precioCompra: (v.precioCompra !== undefined && v.precioCompra !== null) ? v.precioCompra : ""
            }));

            const mappedPres = (initial.presentaciones ?? []).map(p => ({
                nombre: p.nombre || p.nombrePresentacion || "",
                factorConversion: (p.factorConversion !== undefined && p.factorConversion !== null) ? p.factorConversion : "",
                precioVenta: (p.precioVenta !== undefined && p.precioVenta !== null) ? p.precioVenta : ""
            }));

            setForm({
                nombre: initial.nombre ?? "",
                descripcion: initial.descripcion ?? "",
                categoriaId: initial.categoriaId ?? "",
                fotoPrincipal: initial.fotoPrincipal ?? "",
                esVariacion: isMaster,
                precioCompra: initial.precioCompra ?? "",
                precioNormal: initial.precioNormal ?? "",
                precioConDescuento: initial.precioConDescuento ?? "",
                stockInicial: initial.stockInicial ?? "",
                codigoBarras: initial.codigo_barras || initial.codigoBarras || initial.codigo || "",
                variacionNombre: initial.variacionNombre ?? "",
                variaciones: mappedVar,
                presentaciones: mappedPres,
            });
        } else {
            setCurrentMode(modalMode);
            setForm({
                ...EMPTY_FORM,
                variaciones: modalMode === ProductFormMode.PRODUCTO_MAESTRO ? [
                    {
                        idTemp: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        valor: "",
                        codigoBarras: "",
                        fotoPrincipal: "",
                        stockInicial: "",
                        precioCompra: ""
                    }
                ] : [],
                presentaciones: modalMode === ProductFormMode.PRODUCTO_MAESTRO ? [
                    {
                        nombre: "Unidad",
                        factorConversion: 1,
                        precioVenta: ""
                    }
                ] : []
            });
        }
    }, [open, initial, isEdit, modalMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleModeChange = (newMode) => {
        if (isEdit) return;
        setCurrentMode(newMode);
        setForm(prev => {
            const next = { ...prev };
            if (newMode === ProductFormMode.PRODUCTO_MAESTRO) {
                next.esVariacion = true;
                if (next.variaciones.length === 0) {
                    next.variaciones = [{
                        idTemp: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        valor: "",
                        codigoBarras: "",
                        fotoPrincipal: "",
                        stockInicial: "",
                        precioCompra: ""
                    }];
                }
                if (next.presentaciones.length === 0) {
                    next.presentaciones = [{
                        nombre: "Unidad",
                        factorConversion: 1,
                        precioVenta: ""
                    }];
                }
            } else if (newMode === ProductFormMode.AGREGAR_VARIACIONES) {
                next.esVariacion = false;
                next.productoMaestroId = "";
                if (next.variaciones.length === 0) {
                    next.variaciones = [{
                        idTemp: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        valor: "",
                        codigoBarras: "",
                        fotoPrincipal: "",
                        stockInicial: "",
                        precioCompra: ""
                    }];
                }
            } else {
                next.esVariacion = false;
            }
            return next;
        });
    };

    /* Presentaciones handlers */
    const handleAddPresentation = () => {
        setForm(prev => ({
            ...prev,
            presentaciones: [
                ...prev.presentaciones,
                { nombre: "", factorConversion: "", precioVenta: "" }
            ]
        }));
    };

    const handlePresentationChange = (index, field, value) => {
        setForm(prev => {
            const next = [...prev.presentaciones];
            next[index] = { ...next[index], [field]: value };
            return { ...prev, presentaciones: next };
        });
    };

    const handleRemovePresentation = (index) => {
        setForm(prev => ({
            ...prev,
            presentaciones: prev.presentaciones.filter((_, idx) => idx !== index)
        }));
    };

    /* Variaciones handlers */
    const handleAddVariacion = () => {
        setForm(prev => ({
            ...prev,
            variaciones: [
                ...prev.variaciones,
                {
                    idTemp: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    valor: "",
                    codigoBarras: "",
                    fotoPrincipal: "",
                    stockInicial: "",
                    precioCompra: ""
                }
            ]
        }));
    };

    const handleVariacionChange = (idTemp, field, value) => {
        setForm(prev => ({
            ...prev,
            variaciones: prev.variaciones.map(v =>
                v.idTemp === idTemp ? { ...v, [field]: value } : v
            )
        }));
    };

    const handleRemoveVariacion = (idTemp) => {
        setForm(prev => ({
            ...prev,
            variaciones: prev.variaciones.filter(v => v.idTemp !== idTemp)
        }));
    };

    const getTitle = () => {
        if (currentMode === ProductFormMode.AGREGAR_VARIACIONES) {
            return `Agregar Variaciones a ${form.nombre}`;
        }
        if (isEdit) {
            return currentMode === ProductFormMode.PRODUCTO_MAESTRO
                ? "Editar Producto Maestro"
                : "Editar Producto";
        }
        return currentMode === ProductFormMode.PRODUCTO_MAESTRO
            ? "Nuevo Producto Maestro"
            : "Nuevo Producto";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const estId = usuario?.establecimiento?.id ?? usuario?.establecimientoId ?? "";
        if (!estId) { setError("No se detectó el establecimiento del usuario."); return; }
        const usrId = usuario?.id ?? usuario?.usuarioId ?? "";

        let payload = {};

        if (currentMode === ProductFormMode.PRODUCTO) {
            // Validaciones
            if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
            if (!form.categoriaId.toString().trim()) { setError("La categoría es requerida."); return; }
            if (form.precioCompra === "" || isNaN(Number(form.precioCompra))) { setError("El precio de compra es requerido."); return; }
            if (!form.codigoBarras.trim()) { setError("El código de barras es requerido."); return; }
            if (form.presentaciones.length === 0) { setError("Debes agregar al menos una presentación."); return; }

            // Validar presentaciones (con nombrePresentacion)
            const presList = [];
            for (let i = 0; i < form.presentaciones.length; i++) {
                const p = form.presentaciones[i];
                if (!p.nombre.trim()) { setError(`La presentación #${i + 1} debe tener nombre.`); return; }
                if (p.factorConversion === "" || isNaN(Number(p.factorConversion))) { setError(`La presentación #${i + 1} debe tener un factor de conversión válido.`); return; }
                if (p.precioVenta === "" || isNaN(Number(p.precioVenta))) { setError(`La presentación #${i + 1} debe tener un precio de venta válido.`); return; }
                presList.push({
                    nombrePresentacion: p.nombre.trim(),
                    factorConversion: Number(p.factorConversion),
                    precioVenta: Number(p.precioVenta)
                });
            }

            // Construir payload
            payload = {
                nombre: form.nombre.trim(),
                categoriaId: form.categoriaId.toString().trim(),
                activo: true,
                usuarioId: usrId,
                establecimientoId: estId,
                precioCompra: Number(form.precioCompra),
                codigo_barras: form.codigoBarras.trim(),
                presentaciones: presList,
            };

            if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();
            if (form.fotoPrincipal.trim()) payload.fotoPrincipal = form.fotoPrincipal.trim();

            if (form.precioNormal !== "" && !isNaN(Number(form.precioNormal))) payload.precioNormal = Number(form.precioNormal);
            if (form.precioConDescuento !== "" && !isNaN(Number(form.precioConDescuento))) payload.precioConDescuento = Number(form.precioConDescuento);
            if (form.stockInicial !== "" && !isNaN(Number(form.stockInicial))) payload.stockInicial = Number(form.stockInicial);
        }
        else if (currentMode === ProductFormMode.PRODUCTO_MAESTRO) {
            // Validaciones
            if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
            if (!form.categoriaId.toString().trim()) { setError("La categoría es requerida."); return; }
            if (!form.variacionNombre.trim()) { setError("El tipo de variación (Ej. Sabor, Color, Talla) es requerido."); return; }
            if (form.variaciones.length === 0) { setError("Debes agregar al menos una variación."); return; }

            // Validar presentaciones
            const presList = [];
            for (let i = 0; i < form.presentaciones.length; i++) {
                const p = form.presentaciones[i];
                if (!p.nombre.trim()) { setError(`La presentación #${i + 1} debe tener nombre.`); return; }
                if (p.factorConversion === "" || isNaN(Number(p.factorConversion))) { setError(`La presentación #${i + 1} debe tener un factor de conversión válido.`); return; }
                if (p.precioVenta === "" || isNaN(Number(p.precioVenta))) { setError(`La presentación #${i + 1} debe tener un precio de venta válido.`); return; }
                presList.push({
                    nombre: p.nombre.trim(),
                    factorConversion: Number(p.factorConversion),
                    precioVenta: Number(p.precioVenta)
                });
            }

            // Validar variaciones
            const varList = [];
            for (let i = 0; i < form.variaciones.length; i++) {
                const v = form.variaciones[i];
                if (!v.valor.trim()) { setError(`La variación #${i + 1} debe tener un valor (Ej. Res, M).`); return; }
                if (!v.codigoBarras.trim()) { setError(`La variación #${i + 1} debe tener código de barras.`); return; }
                varList.push({
                    valor: v.valor.trim(),
                    codigoBarras: v.codigoBarras.trim(),
                    fotoPrincipal: v.fotoPrincipal.trim() || undefined,
                    stockInicial: v.stockInicial !== "" ? Number(v.stockInicial) : 0,
                    precioCompra: v.precioCompra !== "" && !isNaN(Number(v.precioCompra)) ? Number(v.precioCompra) : undefined
                });
            }

            payload = {
                nombre: form.nombre.trim(),
                categoriaId: form.categoriaId.toString().trim(),
                activo: false,
                usuarioId: usrId,
                establecimientoId: estId,
                variacionNombre: form.variacionNombre.trim(),
                presentaciones: presList,
                variaciones: varList,
            };

            if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();
            if (form.precioCompra !== "" && !isNaN(Number(form.precioCompra))) payload.precioCompra = Number(form.precioCompra);
            if (form.precioNormal !== "" && !isNaN(Number(form.precioNormal))) payload.precioNormal = Number(form.precioNormal);
            if (form.precioConDescuento !== "" && !isNaN(Number(form.precioConDescuento))) payload.precioConDescuento = Number(form.precioConDescuento);
        }
        else if (currentMode === ProductFormMode.AGREGAR_VARIACIONES) {
            // Validaciones
            const targetId = form.productoMaestroId || initial?.id;
            if (!targetId) { setError("Debes seleccionar un producto maestro."); return; }
            if (form.variaciones.length === 0) { setError("Debes agregar al menos una variación."); return; }

            // Validar variaciones
            const varList = [];
            for (let i = 0; i < form.variaciones.length; i++) {
                const v = form.variaciones[i];
                if (!v.valor.trim()) { setError(`La variación #${i + 1} debe tener un valor (Ej. Res, M).`); return; }
                if (!v.codigoBarras.trim()) { setError(`La variación #${i + 1} debe tener código de barras.`); return; }
                varList.push({
                    valor: v.valor.trim(),
                    codigoBarras: v.codigoBarras.trim(),
                    fotoPrincipal: v.fotoPrincipal.trim() || undefined,
                    stockInicial: v.stockInicial !== "" ? Number(v.stockInicial) : 0,
                    precioCompra: v.precioCompra !== "" && !isNaN(Number(v.precioCompra)) ? Number(v.precioCompra) : undefined
                });
            }

            payload = {
                usuarioId: usrId,
                establecimientoId: estId,
                variaciones: varList
            };
        }
        console.log({ payload });

        setLoading(true);
        try {
            let saved;
            if (currentMode === ProductFormMode.AGREGAR_VARIACIONES) {
                const targetId = form.productoMaestroId || initial?.id;
                saved = await Api.post(`/products/${targetId}/variaciones`, payload);
            } else if (isEdit) {
                saved = await Api.patch(`/products/${initial.id}`, payload);
            } else {
                if (currentMode === ProductFormMode.PRODUCTO) {
                    saved = await Api.post("/products", payload);
                } else {
                    saved = await Api.post("/products/maestro", payload);
                }
            }
            onSaved(saved, isEdit && currentMode !== ProductFormMode.AGREGAR_VARIACIONES);
            onClose();
        } catch (err) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title-prod">
                <div className={styles.modalHeader}>
                    <h2 id="modal-title-prod" className={styles.modalTitle}>
                        {getTitle()}
                    </h2>
                    <button id="btn-close-prod-modal" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.formError}>
                            <AlertCircle size={15} strokeWidth={2} /> {error}
                        </div>
                    )}

                    {/* Selector de modo (Solo al crear nuevo producto) */}
                    {
                        !isEdit && (
                            <div className={styles.modeSelector}>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${currentMode === ProductFormMode.PRODUCTO ? styles.modeTabActive : ""}`}
                                    onClick={() => handleModeChange(ProductFormMode.PRODUCTO)}
                                >
                                    Producto Individual
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${currentMode === ProductFormMode.PRODUCTO_MAESTRO ? styles.modeTabActive : ""}`}
                                    onClick={() => handleModeChange(ProductFormMode.PRODUCTO_MAESTRO)}
                                >
                                    Producto Maestro
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${currentMode === ProductFormMode.AGREGAR_VARIACIONES ? styles.modeTabActive : ""}`}
                                    onClick={() => handleModeChange(ProductFormMode.AGREGAR_VARIACIONES)}
                                >
                                    Agregar Variación
                                </button>
                            </div>
                        )
                    }

                    {/* Selector de Producto Maestro (Solo al agregar variaciones) */}
                    {
                        currentMode === ProductFormMode.AGREGAR_VARIACIONES && (
                            <Field label="Producto Maestro *" htmlFor="prod-maestroId">
                                <select
                                    id="prod-maestroId"
                                    name="productoMaestroId"
                                    className={styles.input}
                                    value={form.productoMaestroId}
                                    onChange={handleChange}
                                    disabled={maestrosLoading || !!initial?.id}
                                >
                                    <option value="">— Selecciona un Producto Maestro —</option>
                                    {maestros.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.nombre} {m.variacionNombre ? `(${m.variacionNombre})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {maestrosLoading && <span className={styles.loadingTextSmall}>Cargando maestros...</span>}
                            </Field>
                        )
                    }

                    {/* Encabezado informativo para agregar variaciones */}
                    {
                        currentMode === ProductFormMode.AGREGAR_VARIACIONES && form.productoMaestroId && (
                            (() => {
                                const selectedMaestro = maestros.find(m => String(m.id) === String(form.productoMaestroId)) || initial;
                                if (!selectedMaestro) return null;
                                return (
                                    <div className={styles.readOnlyHeader}>
                                        <h3>{selectedMaestro.nombre}</h3>
                                        {selectedMaestro.descripcion && <p>{selectedMaestro.descripcion}</p>}
                                        <span className={styles.readOnlyLabel}>
                                            Variación heredada: {selectedMaestro.variacionNombre || "—"}
                                        </span>
                                    </div>
                                );
                            })()
                        )
                    }

                    {/* ── Campos generales (Ocultos al agregar variaciones) ── */}
                    {
                        currentMode !== ProductFormMode.AGREGAR_VARIACIONES && (
                            <>
                                <Field label="Nombre *" htmlFor="prod-nombre">
                                    <input
                                        id="prod-nombre" name="nombre" type="text"
                                        className={styles.input} placeholder="Ej. Arroz Diana 5lb"
                                        value={form.nombre} onChange={handleChange} autoFocus
                                    />
                                </Field>

                                <Field label="Descripción" htmlFor="prod-descripcion">
                                    <textarea
                                        id="prod-descripcion" name="descripcion"
                                        className={styles.textarea} placeholder="Descripción del producto…"
                                        value={form.descripcion} onChange={handleChange} rows={2}
                                    />
                                </Field>

                                <div className={styles.row2}>
                                    <Field label="Categoría *" htmlFor="prod-categoriaId">
                                        <select
                                            id="prod-categoriaId"
                                            name="categoriaId"
                                            className={styles.input}
                                            value={form.categoriaId}
                                            onChange={handleChange}
                                            disabled={catLoading}
                                        >
                                            <option value="">— Selecciona una categoría —</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        {catLoading && <span className={styles.loadingTextSmall}>Cargando...</span>}
                                    </Field>

                                    <Field label="Precio de compra *" htmlFor="prod-precioCompra">
                                        <input
                                            id="prod-precioCompra" name="precioCompra" type="number" step="0.01" min="0"
                                            className={styles.input} placeholder="0.00"
                                            value={form.precioCompra} onChange={handleChange}
                                        />
                                    </Field>
                                </div>

                                <div className={styles.row2}>
                                    <Field label="Precio normal" htmlFor="prod-precioNormal">
                                        <input id="prod-precioNormal" name="precioNormal" type="number" step="0.01" min="0"
                                            className={styles.input} placeholder="0.00"
                                            value={form.precioNormal} onChange={handleChange} />
                                    </Field>
                                    <Field label="Precio con descuento" htmlFor="prod-precioConDescuento">
                                        <input id="prod-precioConDescuento" name="precioConDescuento" type="number" step="0.01" min="0"
                                            className={styles.input} placeholder="0.00"
                                            value={form.precioConDescuento} onChange={handleChange} />
                                    </Field>
                                </div>
                            </>
                        )
                    }

                    {/* ── Sección de Presentaciones (Producto Maestro y Producto Individual) ── */}
                    {
                        (currentMode === ProductFormMode.PRODUCTO_MAESTRO || currentMode === ProductFormMode.PRODUCTO) && (
                            <div className={styles.presentationsSection}>
                                <h3 className={styles.sectionTitle}>Presentaciones de Venta</h3>
                                <p className={styles.infoText}>Define cómo se venderá este producto (Unidades, Cajas, etc.)</p>

                                <table className={styles.presTable}>
                                    <thead>
                                        <tr>
                                            <th>Nombre *</th>
                                            <th>Factor *</th>
                                            <th>Precio Venta *</th>
                                            <th style={{ width: '40px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.presentaciones.map((p, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.tableInput}
                                                        value={p.nombre}
                                                        placeholder="Ej. Unidad, Caja x12"
                                                        onChange={(e) => handlePresentationChange(idx, "nombre", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className={styles.tableInput}
                                                        value={p.factorConversion}
                                                        placeholder="Ej. 12"
                                                        onChange={(e) => handlePresentationChange(idx, "factorConversion", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className={styles.tableInput}
                                                        value={p.precioVenta}
                                                        placeholder="Ej. 5.00"
                                                        onChange={(e) => handlePresentationChange(idx, "precioVenta", e.target.value)}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemovePresentation(idx)}
                                                        className={styles.btnRemoveVar}
                                                        title="Eliminar presentación"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <button
                                    type="button"
                                    onClick={handleAddPresentation}
                                    className={styles.btnAddVar}
                                    style={{ marginTop: '0.75rem' }}
                                >
                                    <Plus size={14} /> Agregar Presentación
                                </button>
                            </div>
                        )
                    }

                    {/* ── Sección de Variaciones (Producto Maestro y Agregar Variaciones) ── */}
                    {
                        (currentMode === ProductFormMode.PRODUCTO_MAESTRO || currentMode === ProductFormMode.AGREGAR_VARIACIONES) && (
                            <div className={styles.advancedSection}>
                                <h3 className={styles.sectionTitle}>Variaciones del Producto</h3>
                                <p className={styles.infoText}>Agrega todas las combinaciones que tengas disponibles.</p>

                                {currentMode === ProductFormMode.PRODUCTO_MAESTRO && (
                                    <Field label="Nombre del Atributo/Variación (Ej. Sabor, Color, Talla) *">
                                        <input
                                            type="text"
                                            className={styles.input}
                                            name="variacionNombre"
                                            placeholder="Ej. Sabor"
                                            value={form.variacionNombre}
                                            onChange={handleChange}
                                        />
                                    </Field>
                                )}

                                {form.variaciones.map((variacion, index) => (
                                    <div key={variacion.idTemp} className={styles.variacionCard}>
                                        <div className={styles.variacionHeader}>
                                            <h4>Variación #{index + 1}</h4>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariacion(variacion.idTemp)}
                                                className={styles.btnRemoveVar}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className={styles.row2}>
                                            <Field label="Valor (Ej. S, Rojo, Res) *">
                                                <input
                                                    type="text" className={styles.input}
                                                    value={variacion.valor}
                                                    placeholder="Ej. Res"
                                                    onChange={e => handleVariacionChange(variacion.idTemp, 'valor', e.target.value)}
                                                />
                                            </Field>
                                            <Field label="Código de Barras *">
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="text" className={styles.input}
                                                        value={variacion.codigoBarras}
                                                        placeholder="Ej. 111"
                                                        onChange={e => handleVariacionChange(variacion.idTemp, 'codigoBarras', e.target.value)}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className={styles.btnSecondary}
                                                        title="Escanear código de barras"
                                                        onClick={() => startScan((code) => handleVariacionChange(variacion.idTemp, 'codigoBarras', code))}
                                                        style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Camera size={16} />
                                                    </button>
                                                </div>
                                            </Field>
                                        </div>
                                        <div className={styles.row2}>
                                            <Field label="Stock Inicial">
                                                <input
                                                    type="number" className={styles.input}
                                                    value={variacion.stockInicial}
                                                    placeholder="0"
                                                    onChange={e => handleVariacionChange(variacion.idTemp, 'stockInicial', e.target.value)}
                                                />
                                            </Field>
                                            <Field label="Precio de Compra">
                                                <input
                                                    type="number" step="0.01" className={styles.input}
                                                    value={variacion.precioCompra}
                                                    placeholder="0.00"
                                                    onChange={e => handleVariacionChange(variacion.idTemp, 'precioCompra', e.target.value)}
                                                />
                                            </Field>
                                        </div>
                                        <Field label="URL Foto Principal o subir">
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input
                                                    type="url" className={styles.input}
                                                    placeholder="https://..."
                                                    value={variacion.fotoPrincipal}
                                                    onChange={e => handleVariacionChange(variacion.idTemp, 'fotoPrincipal', e.target.value)}
                                                />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id={`upload-var-${variacion.idTemp}`}
                                                    onChange={async (e) => {
                                                        if (e.target.files && e.target.files.length > 0) {
                                                            try {
                                                                const urls = await uploadImagesToCloudinary(Array.from(e.target.files));
                                                                if (urls && urls.length > 0) {
                                                                    handleVariacionChange(variacion.idTemp, 'fotoPrincipal', urls[0]);
                                                                }
                                                            } catch (err) {
                                                                alert("Error subiendo imagen a Cloudinary");
                                                            }
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`upload-var-${variacion.idTemp}`} className={styles.btnSecondary} style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', margin: 0, whiteSpace: 'nowrap' }}>
                                                    Subir
                                                </label>
                                            </div>
                                        </Field>
                                    </div>
                                ))}

                                <button type="button" onClick={handleAddVariacion} className={styles.btnAddVar}>
                                    <Plus size={16} /> Agregar Combinación
                                </button>
                            </div>
                        )
                    }

                    {/* ── Sección de Producto Individual (Foto principal, Código de barras y Stock) ── */}
                    {
                        currentMode === ProductFormMode.PRODUCTO && (
                            <div className={styles.advancedSection}>
                                <h3 className={styles.sectionTitle}>Detalles de Producto Individual</h3>

                                <Field label="URL foto principal o subir imagen" htmlFor="prod-fotoPrincipal">
                                    <div className={styles.inputWithIcon} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <ImageIcon size={15} className={styles.inputIcon} strokeWidth={2} />
                                        <input
                                            id="prod-fotoPrincipal" name="fotoPrincipal" type="url"
                                            className={`${styles.input} ${styles.inputPadIcon}`}
                                            placeholder="https://ejemplo.com/imagen.jpg"
                                            value={form.fotoPrincipal} onChange={handleChange}
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            id="upload-fotoPrincipal"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    try {
                                                        const urls = await uploadImagesToCloudinary(Array.from(e.target.files));
                                                        if (urls && urls.length > 0) {
                                                            setForm(prev => ({ ...prev, fotoPrincipal: urls[0] }));
                                                        }
                                                    } catch (err) {
                                                        alert("Error subiendo imagen a Cloudinary");
                                                    }
                                                }
                                            }}
                                        />
                                        <label htmlFor="upload-fotoPrincipal" className={styles.btnSecondary} style={{ cursor: 'pointer', padding: '0.4rem 0.8rem', margin: 0, whiteSpace: 'nowrap' }}>
                                            Subir
                                        </label>
                                    </div>
                                </Field>

                                <div className={styles.row2}>
                                    <Field label="Código de barras *" htmlFor="prod-codigoBarras">
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                id="prod-codigoBarras" name="codigoBarras" type="text"
                                                className={styles.input} placeholder="Ej. 740101561234"
                                                value={form.codigoBarras} onChange={handleChange}
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                className={styles.btnSecondary}
                                                title="Escanear código de barras"
                                                onClick={() => startScan((code) => setForm(prev => ({ ...prev, codigoBarras: code })))}
                                                style={{ padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Camera size={16} />
                                            </button>
                                        </div>
                                    </Field>
                                    <Field label="Stock inicial" htmlFor="prod-stockInicial">
                                        <input
                                            id="prod-stockInicial" name="stockInicial" type="number" min="0"
                                            className={styles.input} placeholder="0"
                                            value={form.stockInicial} onChange={handleChange}
                                        />
                                    </Field>
                                </div>
                            </div>
                        )
                    }

                    {/* Info: campos auto-llenados */}
                    <div className={styles.infoBox}>
                        <span className={styles.infoLabel}>
                            🏪 Establecimiento: <strong>{usuario?.establecimiento?.nombre ?? usuario?.establecimientoId ?? "—"}</strong>
                        </span>
                        <span className={styles.infoLabel}>
                            👤 Usuario: <strong>{usuario?.nombre ?? usuario?.id ?? "—"}</strong>
                        </span>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" id="btn-prod-cancel" className={styles.btnSecondary} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" id="btn-prod-submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? <Loader2 size={16} className={styles.spin} /> : null}
                            {loading ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
                        </button>
                    </div>
                </form >
            </div >
            <BarcodeScannerOverlay
                open={!!scanner}
                onScan={scanner?.onScan}
                onClose={stopScan}
            />
        </div >
    );
}

/* ─── Modal eliminar ─── */
function DeleteConfirmModal({ open, onClose, onConfirm, producto, loading }) {
    if (!open || !producto) return null;
    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title-del-prod">
                <div className={styles.modalHeader}>
                    <h2 id="modal-title-del-prod" className={styles.modalTitle}>Eliminar producto</h2>
                    <button id="btn-close-del-prod-modal" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>
                <div className={styles.deleteBody}>
                    <div className={styles.deleteIcon}><Trash2 size={32} strokeWidth={1.5} /></div>
                    <p className={styles.deleteText}>
                        ¿Estás seguro de eliminar <strong>{producto.nombre}</strong>? Esta acción no se puede deshacer.
                    </p>
                </div>
                <div className={styles.formActions}>
                    <button id="btn-del-prod-cancel" type="button" className={styles.btnSecondary} onClick={onClose}>
                        Cancelar
                    </button>
                    <button id="btn-del-prod-confirm" type="button" className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={onConfirm} disabled={loading}>
                        {loading ? <Loader2 size={16} className={styles.spin} /> : null}
                        {loading ? "Eliminando…" : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Componente principal ─── */
const Producto = () => {
    const usuario = getUsuario();
    const { products: list, isLoading: fetchLoading, isError: fetchError, mutate } = useProducts();
    const { mutate: mutateMaestros } = useProductsMaestro();

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [modalMode, setModalMode] = useState(ProductFormMode.PRODUCTO);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Búsqueda por ID
    const [searchId, setSearchId] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    /* ── Carga inicial (Ahora manejada por SWR) ── */
    const loadAll = () => mutate();

    /* ── Handlers modal ── */
    const openCreate = () => {
        setEditTarget(null);
        setModalMode(ProductFormMode.PRODUCTO);
        setModalOpen(true);
    };

    const openEdit = (p) => {
        setEditTarget(p);
        const isMaster = p.esProductoMaestro || p.esMaestro || p.esMaster || (p.esVariacion && !p.parentId);
        setModalMode(isMaster ? ProductFormMode.PRODUCTO_MAESTRO : ProductFormMode.PRODUCTO);
        setModalOpen(true);
    };

    const openAddVariations = (p) => {
        setEditTarget(p);
        setModalMode(ProductFormMode.AGREGAR_VARIACIONES);
        setModalOpen(true);
    };

    const handleSaved = () => {
        mutate();
        mutateMaestros();
    };

    /* ── Handlers eliminar ── */
    const openDelete = (p) => { setDeleteTarget(p); setDeleteOpen(true); };
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await Api.delete(`/products/${deleteTarget.id}`);
            mutate(); // Re-validar lista después de eliminar
            if (searchResult?.id === deleteTarget.id) setSearchResult(null);
            setDeleteOpen(false);
            setDeleteTarget(null);
        } catch (err) {
            alert(err.message || "No se pudo eliminar.");
        } finally {
            setDeleteLoading(false);
        }
    };

    /* ── Búsqueda por ID ── */
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        setSearchLoading(true);
        setSearchError("");
        setSearchResult(null);
        try {
            const data = await Api.get(`/products/${searchId.trim()}`);
            setSearchResult(data);
        } catch (err) {
            setSearchError(err.status === 404 ? "No se encontró ningún producto con ese ID." : err.message);
        } finally {
            setSearchLoading(false);
        }
    };

    /* ── Render ── */
    return (
        <div className={styles.page}>
            {/* ── Encabezado ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>
                    <div className={styles.pageTitleIcon}><Package size={24} strokeWidth={1.8} /></div>
                    <div>
                        <h1 className={styles.h1}>Productos</h1>
                        <p className={styles.subtitle}>Administra el catálogo de productos</p>
                    </div>
                </div>
                <button id="btn-new-producto" className={styles.btnPrimary} onClick={openCreate}>
                    <Plus size={18} strokeWidth={2} /> Nuevo
                </button>
            </div>

            {/* ── Búsqueda por ID ── */}
            <section className={styles.searchSection}>
                <form onSubmit={handleSearch} className={styles.searchForm} id="form-search-prod">
                    <div className={styles.searchInputWrap}>
                        <Search size={16} className={styles.searchIcon} strokeWidth={2} />
                        <input
                            id="input-search-prod-id"
                            type="text"
                            className={styles.searchInput}
                            placeholder="Buscar producto por ID…"
                            value={searchId}
                            onChange={(e) => { setSearchId(e.target.value); setSearchResult(null); setSearchError(""); }}
                        />
                    </div>
                    <button id="btn-search-prod" type="submit" className={styles.btnSearch} disabled={searchLoading}>
                        {searchLoading ? <Loader2 size={16} className={styles.spin} /> : <Search size={16} strokeWidth={2} />}
                    </button>
                </form>

                {searchError && <p className={styles.errorMsg}><AlertCircle size={14} /> {searchError}</p>}
                {searchResult && (
                    <div className={styles.searchResultWrap}>
                        <p className={styles.searchResultLabel}>Resultado de búsqueda</p>
                        <ProductoCard
                            producto={searchResult}
                            onEdit={openEdit}
                            onDelete={openDelete}
                            onAddVariations={openAddVariations}
                        />
                    </div>
                )}
            </section>

            {/* ── Lista ── */}
            <section>
                <div className={styles.listHeader}>
                    <h2 className={styles.sectionTitle}>Todos los productos</h2>
                    <span className={styles.badge}>{list.length}</span>
                </div>

                {fetchLoading && (
                    <div className={styles.centerMsg}>
                        <Loader2 size={28} className={styles.spin} />
                        <span>Cargando…</span>
                    </div>
                )}

                {fetchError && !fetchLoading && (
                    <div className={styles.centerMsg}>
                        <AlertCircle size={20} className={styles.errorColor} />
                        <span className={styles.errorColor}>{fetchError instanceof Error ? fetchError.message : String(fetchError)}</span>
                        <button className={styles.btnRetry} onClick={loadAll}>Reintentar</button>
                    </div>
                )}

                {!fetchLoading && !fetchError && list.length === 0 && (
                    <div className={styles.emptyState}>
                        <Package size={48} strokeWidth={1} className={styles.emptyIcon} />
                        <p className={styles.emptyText}>Aún no hay productos registrados.</p>
                        <button className={styles.btnPrimary} onClick={openCreate}>
                            <Plus size={16} strokeWidth={2} /> Crear el primero
                        </button>
                    </div>
                )}

                {!fetchLoading && !fetchError && list.length > 0 && (
                    <div className={styles.grid}>
                        {list.map((p) => (
                            <ProductoCard
                                key={p.id}
                                producto={p}
                                onEdit={openEdit}
                                onDelete={openDelete}
                                onAddVariations={openAddVariations}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Modales ── */}
            <ProductoModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
                initial={editTarget}
                usuario={usuario}
                modalMode={modalMode}
            />
            <DeleteConfirmModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                producto={deleteTarget}
                loading={deleteLoading}
            />
        </div>
    );
};

export default Producto;