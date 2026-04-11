"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Package, Plus, Search, Pencil, Trash2, X,
    Tag, DollarSign, AlertCircle, Loader2,
    ImageIcon, ToggleLeft, ToggleRight, ChevronDown,
} from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import styles from "./Producto.module.css";

/* ─── Helpers ─── */
const fmt = (n) => n != null ? `Q${Number(n).toFixed(2)}` : "—";

// 2. Retornamos el objeto completo
const EMPTY_FORM = {
    // Paso A: Datos Generales
    nombre: "",
    descripcion: "",
    categoriaId: "",
    fotoPrincipal: "",
    fotos: "",
    esVariacion: false,

    // PRECIOS
    precio: "",
    precioCompra: "",
    precioNormal: "",
    precioConDescuento: "",
    unidadesCaja: "",

    stockInicial: "",
    variaciones: [],
};
;


/* ─── Card de producto ─── */
function ProductoCard({ producto, onEdit, onDelete }) {
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
            </div>

            {/* Info */}
            <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                    <div>
                        <h3 className={styles.cardName}>{producto.nombre}</h3>
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
                        <DollarSign size={12} strokeWidth={2} />{fmt(producto.precio)}
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
function ProductoModal({ open, onClose, onSaved, initial, usuario }) {
    const isEdit = !!initial?.id;
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    /* Pre-llenado */
    useEffect(() => {
        if (!open) return;
        setError("");
        setShowAdvanced(false);
        if (isEdit) {
            setForm({
                nombre: initial.nombre ?? "",
                descripcion: initial.descripcion ?? "",
                categoriaId: initial.categoriaId ?? "",
                fotoPrincipal: initial.fotoPrincipal ?? "",
                fotos: Array.isArray(initial.fotos) ? initial.fotos.join(", ") : (initial.fotos ?? ""),

                esVariacion: initial.esVariacion || false,

                precio: initial.precio ?? "",
                precioCompra: initial.precioCompra ?? "",
                precioNormal: initial.precioNormal ?? "",
                precioConDescuento: initial.precioConDescuento ?? "",
                unidadesCaja: initial.unidadesCaja ?? "",
                stockInicial: initial.stockInicial ?? "",

                variaciones: initial.variaciones ?? [],
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [open, initial, isEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleAddVariacion = () => {
        setForm(prev => ({
            ...prev,
            variaciones: [
                ...prev.variaciones,
                {
                    idTemp: Date.now().toString(),
                    variacionNombre: "",
                    valorVariacion: "",
                    stockInicial: "",
                    fotoPrincipal: "",
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validaciones Paso A
        if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
        if (!form.categoriaId.trim()) { setError("La categoría ID es requerida."); return; }

        if (form.esVariacion && form.variaciones.length === 0) {
            setError("Debes agregar al menos una variación si indicas que el producto tiene variaciones.");
            return;
        }

        const estId = usuario?.establecimiento?.id ?? usuario?.establecimientoId ?? "";
        if (!estId) { setError("No se detectó el establecimiento del usuario."); return; }

        if (form.precio === "" || isNaN(Number(form.precio))) { setError("El precio es requerido."); return; }
        if (form.precioCompra === "" || isNaN(Number(form.precioCompra))) { setError("El precio de compra es requerido."); return; }

        // Construir payload
        const payload = {
            nombre: form.nombre.trim(),
            categoriaId: form.categoriaId.trim(),
            activo: true,
            usuarioId: usuario?.id ?? usuario?.usuarioId ?? "",
            establecimientoId: estId,
            esVariacion: form.esVariacion,
            precio: Number(form.precio),
            precioCompra: Number(form.precioCompra),
        };

        if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();
        if (form.fotoPrincipal.trim()) payload.fotoPrincipal = form.fotoPrincipal.trim();
        if (form.fotos.trim()) payload.fotos = form.fotos.split(",").map((u) => u.trim()).filter(Boolean);

        if (form.precioNormal !== "") payload.precioNormal = Number(form.precioNormal);
        if (form.precioConDescuento !== "") payload.precioConDescuento = Number(form.precioConDescuento);
        if (form.unidadesCaja !== "") payload.unidadesCaja = Number(form.unidadesCaja);

        if (!form.esVariacion) {
            // Producto SIN variaciones
            payload.establecimientoId = estId;
            if (form.stockInicial !== "") payload.stockInicial = Number(form.stockInicial);
        } else {
            // Producto CON variaciones
            const varList = [];
            for (let i = 0; i < form.variaciones.length; i++) {
                const v = form.variaciones[i];
                if (!v.variacionNombre.trim() || !v.valorVariacion.trim()) {
                    setError(`La variación #${i + 1} debe tener Tipo (Ej. Color) y Valor (Ej. Rojo).`);
                    return;
                }

                varList.push({
                    variacionNombre: v.variacionNombre.trim(),
                    valorVariacion: v.valorVariacion.trim(),
                    stockInicial: v.stockInicial !== "" ? Number(v.stockInicial) : 0,
                    fotoPrincipal: v.fotoPrincipal.trim() || undefined
                });
            }
            payload.variaciones = varList;
        }

        setLoading(true);
        try {
            let saved;
            if (isEdit) {
                // TODO: Verificar endpoint PATCH para variaciones si aplica
                saved = await Api.patch(`/products/${initial.id}`, payload);
            } else {
                saved = await Api.post("/products", payload);
            }
            onSaved(saved, isEdit);
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
                        {isEdit ? "Editar producto" : "Nuevo producto"}
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

                    {/* ── Campos principales ── */}
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

                    <Field label="Categoría ID *" htmlFor="prod-categoriaId">
                        <input
                            id="prod-categoriaId" name="categoriaId" type="text"
                            className={styles.input} placeholder="UUID de la categoría"
                            value={form.categoriaId} onChange={handleChange}
                        />
                    </Field>

                    <Field label="URL foto principal" htmlFor="prod-fotoPrincipal">
                        <div className={styles.inputWithIcon}>
                            <ImageIcon size={15} className={styles.inputIcon} strokeWidth={2} />
                            <input
                                id="prod-fotoPrincipal" name="fotoPrincipal" type="url"
                                className={`${styles.input} ${styles.inputPadIcon}`}
                                placeholder="https://ejemplo.com/imagen.jpg"
                                value={form.fotoPrincipal} onChange={handleChange}
                            />
                        </div>
                    </Field>

                    <Field label="URLs de fotos adicionales (separadas por coma)" htmlFor="prod-fotos">
                        <textarea id="prod-fotos" name="fotos"
                            className={styles.textarea}
                            placeholder="https://img1.com/a.jpg, https://img2.com/b.jpg"
                            value={form.fotos} onChange={handleChange} rows={2} />
                    </Field>

                    <div className={styles.row2}>
                        <Field label="Precio de venta *" htmlFor="prod-precio">
                            <input
                                id="prod-precio" name="precio" type="number" step="0.01" min="0"
                                className={styles.input} placeholder="0.00"
                                value={form.precio} onChange={handleChange}
                            />
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

                    <div className={styles.row2}>
                        <Field label="Unidades por caja" htmlFor="prod-unidadesCaja">
                            <input id="prod-unidadesCaja" name="unidadesCaja" type="number" min="0"
                                className={styles.input} placeholder="0"
                                value={form.unidadesCaja} onChange={handleChange} />
                        </Field>
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.variationToggle}>
                        <label className={styles.switchLabel}>
                            <input
                                type="checkbox"
                                name="esVariacion"
                                checked={form.esVariacion}
                                onChange={handleChange}
                            />
                            <strong>¿Este producto tiene variaciones?</strong> (Talla, Color, Sabor, etc.)
                        </label>
                    </div>

                    {!form.esVariacion ? (
                        /* =========================================
                           PASO B: SIN VARIACIONES (PRODUCTO ÚNICO)
                           ========================================= */
                        <div className={styles.advancedSection}>
                            <h3 className={styles.sectionTitle}>Stock</h3>
                            <div className={styles.row2}>
                                <Field label="Stock inicial" htmlFor="prod-stockInicial">
                                    <input id="prod-stockInicial" name="stockInicial" type="number" min="0"
                                        className={styles.input} placeholder="0"
                                        value={form.stockInicial} onChange={handleChange} />
                                </Field>
                            </div>
                        </div>
                    ) : (
                        /* =========================================
                           PASO B: CON VARIACIONES (PRODUCTO PADRE + HIJOS)
                           ========================================= */
                        <div className={styles.advancedSection}>
                            <h3 className={styles.sectionTitle}>Variaciones del Producto</h3>
                            <p className={styles.infoText}>Agrega todas las combinaciones que tengas disponibles.</p>

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
                                        <Field label="Tipo (Ej. Talla, Color) *">
                                            <input
                                                type="text" className={styles.input}
                                                value={variacion.variacionNombre}
                                                onChange={e => handleVariacionChange(variacion.idTemp, 'variacionNombre', e.target.value)}
                                            />
                                        </Field>
                                        <Field label="Valor (Ej. S, Rojo) *">
                                            <input
                                                type="text" className={styles.input}
                                                value={variacion.valorVariacion}
                                                onChange={e => handleVariacionChange(variacion.idTemp, 'valorVariacion', e.target.value)}
                                            />
                                        </Field>
                                    </div>
                                    <div className={styles.row2}>
                                        <Field label="URL Foto Principal (opcional)">
                                            <input
                                                type="url" className={styles.input}
                                                placeholder="https://..."
                                                value={variacion.fotoPrincipal}
                                                onChange={e => handleVariacionChange(variacion.idTemp, 'fotoPrincipal', e.target.value)}
                                            />
                                        </Field>
                                        <Field label="Stock Inicial">
                                            <input
                                                type="number" className={styles.input}
                                                value={variacion.stockInicial}
                                                onChange={e => handleVariacionChange(variacion.idTemp, 'stockInicial', e.target.value)}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={handleAddVariacion} className={styles.btnAddVar}>
                                <Plus size={16} /> Agregar Combinación
                            </button>
                        </div>
                    )}

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
                </form>
            </div>
        </div>
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

    const [list, setList] = useState([]);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Búsqueda por ID
    const [searchId, setSearchId] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    /* ── Carga inicial ── */
    const loadAll = useCallback(async () => {
        setFetchLoading(true);
        setFetchError("");
        try {
            const data = await Api.get("/products");
            setList(Array.isArray(data) ? data : []);
        } catch (err) {
            setFetchError(err.message || "No se pudo cargar la lista.");
        } finally {
            setFetchLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    /* ── Handlers modal ── */
    const openCreate = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit = (p) => { setEditTarget(p); setModalOpen(true); };

    const handleSaved = (saved, isEdit) => {
        if (isEdit) {
            setList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            if (searchResult?.id === saved.id) setSearchResult(saved);
        } else {
            setList((prev) => [saved, ...prev]);
        }
    };

    /* ── Handlers eliminar ── */
    const openDelete = (p) => { setDeleteTarget(p); setDeleteOpen(true); };
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await Api.delete(`/products/${deleteTarget.id}`);
            setList((prev) => prev.filter((p) => p.id !== deleteTarget.id));
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
                        <ProductoCard producto={searchResult} onEdit={openEdit} onDelete={openDelete} />
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
                        <span className={styles.errorColor}>{fetchError}</span>
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
                            <ProductoCard key={p.id} producto={p} onEdit={openEdit} onDelete={openDelete} />
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