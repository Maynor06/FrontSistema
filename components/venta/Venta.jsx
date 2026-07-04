"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ShoppingCart, Search, Plus, Minus, Trash2,
    CheckCircle, X, AlertCircle, Loader2, Package,
    Clock, CalendarDays, RefreshCw, Tag, Camera,
} from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import { useProducts } from "@/hooks/useProducts";
import { BarcodeScannerOverlay } from "../Producto/Producto";
import styles from "./Venta.module.css";

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

/** Parsea fechas de forma segura y devuelve HH:MM o "—" */
function formatHora(raw) {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
}

function estadoColor(nombre) {
    if (!nombre) return styles.chipDefault;
    const n = nombre.toLowerCase();
    if (n.includes("pend")) return styles.chipPendiente;
    if (n.includes("complet") || n.includes("entregad")) return styles.chipCompletado;
    if (n.includes("cancel")) return styles.chipCancelado;
    if (n.includes("proceso") || n.includes("prepara")) return styles.chipEnProceso;
    return styles.chipDefault;
}

/* ══════════════════════════════════════════════════════════════
   SECCIÓN: CARD ORDEN DEL DÍA
══════════════════════════════════════════════════════════════ */
function OrdenCard({ orden, onClick }) {
    const detalles = orden.ventas ?? orden.detalles_orden ?? orden.detalleOrden ?? orden.detallesOrden ?? [];
    const total = detalles.length > 0
        ? detalles.reduce((s, d) => s + (Number(d.precioUnitario) * Number(d.cantidad)), 0)
        : Number(orden.total ?? 0);

    return (
        <article
            className={styles.ordenCard}
            id={`orden-card-${orden.id}`}
            onClick={() => onClick && onClick(orden)}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className={styles.ordenCardHeader}>
                <span className={styles.ordenId}>#{String(orden.id).slice(-6).toUpperCase()}</span>
                <span className={`${styles.ordenChip} ${estadoColor(orden.estadoOrden?.nombre)}`}>
                    {orden.estadoOrden?.nombre ?? "—"}
                </span>
            </div>
            <div className={styles.ordenCardBody}>
                <div className={styles.ordenRow}>
                    <Package size={12} strokeWidth={2} className={styles.ordenIcon} />
                    <span>{detalles.length} producto(s)</span>
                </div>
            </div>
            <div className={styles.ordenCardFooter}>
                <span className={styles.ordenTotal}>Q {Number(total).toFixed(2)}</span>
                <span className={styles.ordenHora}>
                    <Clock size={11} strokeWidth={2} />
                    {formatHora(orden.fechaCreada ?? orden.createdAt ?? orden.fecha)}
                </span>
            </div>
        </article>
    );
}

/* ══════════════════════════════════════════════════════════════
   SECCIÓN: ITEM DEL CARRITO
══════════════════════════════════════════════════════════════ */
function CartItem({ item, onAdd, onRemove, onDelete, onToggleDescuento, onChangePresentation, onSetCantidad }) {
    const isUnidad = item.selectedPresentation.factorConversion === 1;
    const rawPrice = (isUnidad && item.usandoDescuento && item.precioConDescuento != null)
        ? item.precioConDescuento
        : item.selectedPresentation.precioVenta;
    const subtotal = rawPrice * item.cantidad;
    const tieneDescuento = item.precioConDescuento != null && Number(item.precioConDescuento) > 0;

    return (
        <div className={styles.cartItem} id={`cart-item-${item.productoId}-${item.selectedPresentation.id}`}>
            <div className={styles.cartItemInfo}>
                <p className={styles.cartItemName}>
                    {item.nombre}
                    {item.valorVariacion && !item.nombre.toLowerCase().includes(item.valorVariacion.toLowerCase()) ? ` (${item.valorVariacion})` : ""}
                    {" - "}{item.selectedPresentation.nombrePresentacion}
                </p>

                {/* Badges para los tipos de presentaciones */}
                <div className={styles.presBadgesRow}>
                    {item.variacionesDisponibles.map((pres) => (
                        <button
                            key={pres.id}
                            type="button"
                            className={`${styles.presBadge} ${item.selectedPresentation.id === pres.id ? styles.presBadgeActive : ""}`}
                            onClick={() => onChangePresentation(item.productoId, item.selectedPresentation.id, pres)}
                        >
                            {pres.nombrePresentacion} (Q {Number(pres.precioVenta).toFixed(2)})
                        </button>
                    ))}
                </div>

                <div className={styles.cartPriceRow}>
                    <p className={`${styles.cartItemPrice} ${item.usandoDescuento && isUnidad ? styles.precioTachado : ""}`}>
                        Q {Number(item.selectedPresentation.precioVenta).toFixed(2)}
                    </p>
                    {tieneDescuento && isUnidad && (
                        <label className={styles.descCheckLabel} htmlFor={`chk-desc-${item.productoId}-${item.selectedPresentation.id}`}>
                            <input
                                type="checkbox"
                                id={`chk-desc-${item.productoId}-${item.selectedPresentation.id}`}
                                checked={item.usandoDescuento}
                                onChange={() => onToggleDescuento(item.productoId, item.selectedPresentation.id)}
                                className={styles.descCheck}
                            />
                            <span className={styles.descCheckCustom} />
                            <Tag size={11} strokeWidth={2} />
                            <span>Descuento: Q {Number(item.precioConDescuento).toFixed(2)}</span>
                        </label>
                    )}
                </div>
            </div>

            <div className={styles.cartItemControls}>
                <button id={`btn-minus-${item.productoId}-${item.selectedPresentation.id}`} className={styles.qtyBtn}
                    onClick={() => onRemove(item.productoId, item.selectedPresentation.id)} title="Quitar unidad">
                    <Minus size={13} strokeWidth={2.5} />
                </button>
                <input
                    type="number"
                    min="1"
                    className={styles.qtyInput}
                    value={item.cantidad}
                    onChange={(e) => onSetCantidad(item.productoId, item.selectedPresentation.id, e.target.value)}
                />
                <button id={`btn-plus-${item.productoId}-${item.selectedPresentation.id}`} className={`${styles.qtyBtn} ${styles.qtyBtnAdd}`}
                    onClick={() => onAdd(item.productoId, item.selectedPresentation.id)} title="Agregar unidad">
                    <Plus size={13} strokeWidth={2.5} />
                </button>
            </div>

            <div className={styles.cartItemRight}>
                <span className={styles.cartItemSubtotal}>Q {subtotal.toFixed(2)}</span>
                <button id={`btn-del-${item.productoId}-${item.selectedPresentation.id}`} className={styles.cartItemDel}
                    onClick={() => onDelete(item.productoId, item.selectedPresentation.id)} title="Eliminar">
                    <Trash2 size={13} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: ÓRDENES CONFIRMADA
══════════════════════════════════════════════════════════════ */
function SuccessModal({ open, orden, onClose }) {
    if (!open || !orden) return null;
    return (
        <div className={styles.overlay}>
            <div className={styles.successModal}>
                <div className={styles.successIcon}><CheckCircle size={48} strokeWidth={1.5} /></div>
                <h2 className={styles.successTitle}>¡Orden confirmada!</h2>
                <p className={styles.successId}>#{String(orden.id).slice(-8).toUpperCase()}</p>
                <p className={styles.successSub}>La orden fue registrada correctamente.</p>
                <button id="btn-success-close" className={styles.btnConfirm} style={{ marginTop: "0.5rem" }} onClick={onClose}>
                    Continuar
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: DETALLES DE ORDEN
══════════════════════════════════════════════════════════════ */
function OrdenDetalleModal({ open, orden, onClose }) {
    if (!open || !orden) return null;
    const detalles = orden.ventas ?? orden.detalles_orden ?? orden.detalleOrden ?? orden.detallesOrden ?? [];
    const total = detalles.length > 0
        ? detalles.reduce((s, d) => s + (Number(d.precioUnitario) * Number(d.cantidad)), 0)
        : Number(orden.total ?? 0);

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.successModal} style={{ width: '400px', maxWidth: '90%', alignItems: 'stretch', textAlign: 'left', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#1e293b' }}>Detalle de Orden</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <p style={{ margin: 0 }}><strong>ID:</strong> #{String(orden.id).slice(-8).toUpperCase()}</p>
                    <p style={{ margin: 0 }}><strong>Estado:</strong> {orden.estoOrden?.nombre ?? "—"}</p>
                    <p style={{ margin: 0 }}><strong>Fecha:</strong> {new Date(orden.fechaCreada ?? orden.createdAt ?? orden.fecha).toLocaleString()}</p>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0', color: '#1e293b' }}>Productos ({detalles.length})</h3>
                <div style={{ maxHeight: '250px', overflowY: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginBottom: '1rem' }}>
                    {detalles.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No se encontraron detalles para esta orden.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {detalles.map((d, idx) => (
                                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                                        <div style={{ fontWeight: 600, color: '#334155' }}>{d.producto?.nombre || `Producto #${d.productoId}`}</div>
                                        <div style={{ color: '#64748b', marginTop: '0.1rem' }}>{d.cantidad} unid. x Q {Number(d.precioUnitario).toFixed(2)}</div>
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center' }}>
                                        Q {(Number(d.cantidad) * Number(d.precioUnitario)).toFixed(2)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '1.1rem', color: '#0f172a' }}>
                    <span>Total</span>
                    <span style={{ color: '#6366f1' }}>Q {Number(total).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export const Venta = () => {
    const usuario = getUsuario();

    // Datos auto-poblados del usuario logueado
    const establecimientoId = String(
        usuario?.establecimientoId ?? usuario?.establecimiento?.id ?? ""
    );
    const usuarioId = String(usuario?.id ?? "");

    // Estado de la orden se obtiene del fetch, pero no se muestra al usuario
    const [estadoOrdenId, setEstadoOrdenId] = useState("");

    /* ── Productos (Usando SWR para optimizar llamados) ── */
    const { products: productos, isLoading: prodLoading, mutate: mutateProducts } = useProducts();

    /* ── Búsqueda ── */
    const [busqueda, setBusqueda] = useState("");
    const [sugerencias, setSugerencias] = useState([]);
    const searchRef = useRef(null);
    const [showSug, setShowSug] = useState(false);
    const [showCameraScanner, setShowCameraScanner] = useState(false);

    /* ── Carrito ── */
    const [carrito, setCarrito] = useState([]);

    /* ── Órdenes de hoy ── */
    const [ordenesHoy, setOrdenesHoy] = useState([]);
    const [ordenesLoading, setOrdenesLoading] = useState(true);
    const [ordenesError, setOrdenesError] = useState("");

    /* ── Confirmación y Detalle ── */
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmError, setConfirmError] = useState("");
    const [successModalData, setSuccessModalData] = useState(null);
    const [detalleModalOpen, setDetalleModalOpen] = useState(null);

    /* ── Tabs móvil ── */
    const [mobileTab, setMobileTab] = useState("caja");

    /* ──────────────────────────────────────────────
       Carga inicial
    ────────────────────────────────────────────── */
    const loadMaestros = useCallback(async () => {
        try {
            const estados = await Api.get("/estado-orden");
            const list = Array.isArray(estados) ? estados : [];
            if (list.length > 0) setEstadoOrdenId(String(list[0].id));
        } catch (_) { }
    }, []);

    const loadOrdenesHoy = useCallback(async () => {
        setOrdenesLoading(true);
        setOrdenesError("");
        try {
            const data = await Api.get("/orden/hoy");
            setOrdenesHoy(Array.isArray(data) ? data : []);
        } catch (err) {
            setOrdenesError(err.message || "No se pudieron cargar las órdenes de hoy.");
        } finally {
            setOrdenesLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMaestros();
        loadOrdenesHoy();
    }, [loadMaestros, loadOrdenesHoy]);

    /* ──────────────────────────────────────────────
       Autocomplete de productos
    ────────────────────────────────────────────── */
    useEffect(() => {
        if (!busqueda.trim()) { setSugerencias([]); setShowSug(false); return; }
        const q = busqueda.toLowerCase();
        const found = productos
            .filter(p => {
                const cod = (p.codigo_barras || p.codigo || p.codigoBarras || "").toLowerCase();
                return (
                    p.nombre?.toLowerCase().includes(q) ||
                    p.slug?.toLowerCase().includes(q) ||
                    cod.includes(q)
                );
            })
            .slice(0, 8);
        setSugerencias(found);
        setShowSug(found.length > 0);
    }, [busqueda, productos]);

    // Lógica para detectar código de barras de manera automática y agregarlo al carrito
    useEffect(() => {
        const term = busqueda.trim().toLowerCase();
        if (term.length < 8) return; // Evitar coincidencia prematura con códigos cortos manuales

        const exactMatch = productos.find(p => {
            const cod = (p.codigo_barras || p.codigo || p.codigoBarras || "").toLowerCase();
            return cod === term;
        });

        if (exactMatch) {
            agregarProducto(exactMatch);
            setBusqueda("");
            setShowSug(false);
        }
    }, [busqueda, productos]);

    // Manejador de teclado para cuando se presiona Enter (soporta scanners físicos USB y búsquedas rápidas)
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const term = busqueda.trim().toLowerCase();
            if (!term) return;

            // Primero buscamos si hay una coincidencia exacta de código de barras
            const exactMatch = productos.find(p => {
                const cod = (p.codigo_barras || p.codigo || p.codigoBarras || "").toLowerCase();
                return cod === term;
            });

            if (exactMatch) {
                agregarProducto(exactMatch);
                setBusqueda("");
                setShowSug(false);
                return;
            }

            // Si no hay coincidencia exacta pero tenemos sugerencias en la lista, agregamos la primera
            if (sugerencias.length > 0) {
                agregarProducto(sugerencias[0]);
                setBusqueda("");
                setShowSug(false);
            }
        }
    };

    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSug(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ──────────────────────────────────────────────
       Carrito
    ────────────────────────────────────────────── */
    const agregarProducto = (prod) => {
        setBusqueda("");
        setShowSug(false);
        setCarrito(prev => {
            const presentations = Array.isArray(prod.presentaciones) && prod.presentaciones.length > 0
                ? prod.presentaciones.map(p => ({
                    id: String(p.id),
                    nombrePresentacion: p.nombrePresentacion || p.nombre || "Unidad",
                    factorConversion: Number(p.factorConversion) || 1,
                    precioVenta: Number(p.precioVenta) || 0
                }))
                : [{ id: "default", nombrePresentacion: "Unidad", factorConversion: 1, precioVenta: Number(prod.precioNormal || prod.precio || 0) }];

            const defaultPres = presentations.find(p => p.factorConversion === 1) || presentations[0];

            const existe = prev.find(i => i.productoId === String(prod.id) && i.selectedPresentation.id === defaultPres.id);
            if (existe) {
                return prev.map(i => (i.productoId === String(prod.id) && i.selectedPresentation.id === defaultPres.id)
                    ? { ...i, cantidad: i.cantidad + 1 }
                    : i
                );
            }

            const precioConDescuento = prod.precioConDescuento != null && Number(prod.precioConDescuento) > 0
                ? Number(prod.precioConDescuento)
                : null;

            return [
                {
                    productoId: String(prod.id),
                    nombre: prod.nombre,
                    valorVariacion: prod.valorVariacion || "",
                    variacionesDisponibles: presentations,
                    selectedPresentation: defaultPres,
                    precioConDescuento,
                    usandoDescuento: false,
                    cantidad: 1,
                },
                ...prev
            ];
        });
    };

    const incrementar = (productoId, presentationId) =>
        setCarrito(prev => prev.map(i => (i.productoId === productoId && i.selectedPresentation.id === presentationId) ? { ...i, cantidad: i.cantidad + 1 } : i));

    const decrementar = (productoId, presentationId) =>
        setCarrito(prev => {
            const item = prev.find(i => i.productoId === productoId && i.selectedPresentation.id === presentationId);
            if (!item) return prev;
            if (item.cantidad <= 1) return prev.filter(i => !(i.productoId === productoId && i.selectedPresentation.id === presentationId));
            return prev.map(i => (i.productoId === productoId && i.selectedPresentation.id === presentationId) ? { ...i, cantidad: i.cantidad - 1 } : i);
        });

    const setCantidad = (productoId, presentationId, value) => {
        const val = parseInt(value, 10);
        if (isNaN(val) || val < 1) return;
        setCarrito(prev => prev.map(i => (i.productoId === productoId && i.selectedPresentation.id === presentationId) ? { ...i, cantidad: val } : i));
    };

    const eliminarDelCarrito = (productoId, presentationId) =>
        setCarrito(prev => prev.filter(i => !(i.productoId === productoId && i.selectedPresentation.id === presentationId)));

    const toggleDescuento = (productoId, presentationId) => {
        setCarrito(prev => prev.map(i => {
            if (i.productoId !== productoId || i.selectedPresentation.id !== presentationId) return i;
            const usandoDescuento = !i.usandoDescuento;
            return {
                ...i,
                usandoDescuento,
            };
        }));
    };

    const changePresentation = (productoId, currentPresentationId, newPresentation) => {
        setCarrito(prev => {
            const alreadyExists = prev.find(i => i.productoId === productoId && i.selectedPresentation.id === newPresentation.id);
            const targetItem = prev.find(i => i.productoId === productoId && i.selectedPresentation.id === currentPresentationId);

            if (!targetItem) return prev;

            if (alreadyExists && currentPresentationId !== newPresentation.id) {
                return prev.map(i => {
                    if (i.productoId === productoId && i.selectedPresentation.id === newPresentation.id) {
                        return {
                            ...i,
                            cantidad: i.cantidad + targetItem.cantidad
                        };
                    }
                    return i;
                }).filter(i => !(i.productoId === productoId && i.selectedPresentation.id === currentPresentationId));
            }

            return prev.map(i => {
                if (i.productoId === productoId && i.selectedPresentation.id === currentPresentationId) {
                    return {
                        ...i,
                        selectedPresentation: newPresentation,
                        usandoDescuento: false
                    };
                }
                return i;
            });
        });
    };

    const limpiarCarrito = () => {
        setCarrito([]);
        setConfirmError("");
    };

    const total = carrito.reduce((s, i) => {
        const isUnidad = i.selectedPresentation.factorConversion === 1;
        const rawPrice = (isUnidad && i.usandoDescuento && i.precioConDescuento != null)
            ? i.precioConDescuento
            : i.selectedPresentation.precioVenta;
        return s + (rawPrice * i.cantidad);
    }, 0);

    /* ──────────────────────────────────────────────
       Confirmar orden
    ────────────────────────────────────────────── */
    const confirmarOrden = async () => {
        setConfirmError("");
        if (carrito.length === 0) { setConfirmError("Agrega al menos un producto."); return; }
        if (!estadoOrdenId) { setConfirmError("No se pudo obtener el estado de orden del servidor."); return; }
        if (!establecimientoId) { setConfirmError("El usuario no tiene establecimiento asignado."); return; }

        const payload = {
            clienteId: "1",
            establecimientoId,
            estadoOrdenId,
            usuarioId,
            nitFacturacion: "CF",
            nombreFacturacion: "sistema",
            detalles: carrito.map(i => {
                const isUnidad = i.selectedPresentation.factorConversion === 1;
                let cantidadFinal = i.cantidad;
                let precioUnitarioFinal = i.selectedPresentation.precioVenta;

                if (isUnidad && i.usandoDescuento && i.precioConDescuento != null) {
                    precioUnitarioFinal = i.precioConDescuento;
                } else {
                    const factor = i.selectedPresentation.factorConversion || 1;
                    cantidadFinal = i.cantidad * factor;
                    precioUnitarioFinal = i.selectedPresentation.precioVenta / factor;
                }

                return {
                    productoId: i.productoId,
                    cantidad: cantidadFinal,
                    precioUnitario: precioUnitarioFinal,
                };
            }),
        };

        setConfirmLoading(true);
        try {
            const orden = await Api.post("/orden", payload);
            setSuccessModalData(orden);
            limpiarCarrito();
            loadOrdenesHoy();
            mutateProducts();
        } catch (err) {
            setConfirmError(err.message || "No se pudo crear la orden.");
        } finally {
            setConfirmLoading(false);
        }
    };

    /* ──────────────────────────────────────────────
       RENDER
    ────────────────────────────────────────────── */
    return (
        <div className={styles.root}>
            {/* ─── TABS MÓVIL ─── */}
            <div className={styles.mobileTabs}>
                <button id="tab-caja"
                    className={`${styles.mobileTab} ${mobileTab === "caja" ? styles.mobileTabActive : ""}`}
                    onClick={() => setMobileTab("caja")}>
                    <ShoppingCart size={15} strokeWidth={2} /> Caja
                </button>
                <button id="tab-historial"
                    className={`${styles.mobileTab} ${mobileTab === "historial" ? styles.mobileTabActive : ""}`}
                    onClick={() => setMobileTab("historial")}>
                    <CalendarDays size={15} strokeWidth={2} /> Hoy ({ordenesHoy.length})
                </button>
            </div>

            <div className={styles.layout}>
                {/* ════════════════════
                    PANEL IZQUIERDO
                ════════════════════ */}
                <section
                    className={`${styles.panelLeft} ${mobileTab !== "caja" ? styles.panelHiddenMobile : ""}`}
                    aria-label="Nueva orden"
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitleRow}>
                            <ShoppingCart size={20} strokeWidth={1.8} className={styles.panelIcon} />
                            <h1 className={styles.panelTitle}>Nueva orden</h1>
                        </div>
                        {establecimientoId && (
                            <span className={styles.estChip}>Est. {establecimientoId}</span>
                        )}
                    </div>

                    {/* ── Buscador ── */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Buscar producto</p>
                        <div className={styles.searchWrap} ref={searchRef}>
                            <div className={styles.searchBox}>
                                <Search size={15} className={styles.searchIco} strokeWidth={2} />
                                <input
                                    id="input-buscar-producto"
                                    type="text"
                                    placeholder={prodLoading ? "Cargando productos…" : "Nombre, slug o código de barras…"}
                                    className={styles.searchInput}
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    onFocus={() => sugerencias.length > 0 && setShowSug(true)}
                                    onKeyDown={handleSearchKeyDown}
                                    disabled={prodLoading}
                                    autoComplete="off"
                                />
                                {prodLoading ? (
                                    <Loader2 size={14} className={`${styles.searchIcoRight} ${styles.spin}`} />
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.btnScanCamera}
                                        title="Escanear código de barras con la cámara"
                                        onClick={() => setShowCameraScanner(true)}
                                    >
                                        <Camera size={15} />
                                    </button>
                                )}
                            </div>

                            {showSug && (
                                <ul className={styles.dropdown} id="dropdown-products">
                                    {console.log({ sugerencias })}
                                    {sugerencias.map(p => {
                                        const presentations = Array.isArray(p.presentaciones) ? p.presentaciones : [];
                                        const unidadPres = presentations.find(x => String(x.nombrePresentacion || "").toLowerCase() === "unidad" || Number(x.factorConversion) === 1) || presentations[0];
                                        const precio = Number(unidadPres?.precioVenta || p.precioNormal || p.precio || 0);
                                        const descuento = p.precioConDescuento != null && Number(p.precioConDescuento) > 0
                                            ? Number(p.precioConDescuento) : null;
                                        return (
                                            <li key={p.id}>
                                                <button id={`sug-${p.id}`} className={styles.dropdownItem}
                                                    onClick={() => agregarProducto(p)} type="button">
                                                    <div className={styles.dropdownIcon}>
                                                        <Package size={14} strokeWidth={1.8} />
                                                    </div>
                                                    <div className={styles.dropdownInfo}>
                                                        <span className={styles.dropdownName}>{p.nombre}</span>
                                                        {p.slug && <span className={styles.dropdownSlug}>/{p.slug}</span>}
                                                    </div>
                                                    <div className={styles.dropdownPrices}>
                                                        <span className={styles.dropdownPrice}>Q {precio.toFixed(2)}</span>
                                                        {descuento && (
                                                            <span className={styles.dropdownDescuento}>
                                                                <Tag size={10} strokeWidth={2} /> Q {descuento.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Plus size={14} strokeWidth={2.5} className={styles.dropdownPlus} />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                    {/* ── Carrito ── */}
                    <div className={`${styles.section} ${styles.sectionFlex}`}>
                        <div className={styles.sectionLabelRow}>
                            <p className={styles.sectionLabel}>Productos en la orden</p>
                            {carrito.length > 0 && (
                                <button id="btn-limpiar-carrito" className={styles.btnClear} onClick={limpiarCarrito}>
                                    <X size={12} strokeWidth={2.5} /> Limpiar
                                </button>
                            )}
                        </div>

                        {carrito.length === 0 ? (
                            <div className={styles.cartEmpty}>
                                <ShoppingCart size={32} strokeWidth={1} className={styles.cartEmptyIcon} />
                                <p>Busca y agrega productos</p>
                            </div>
                        ) : (
                            <div className={styles.cartList}>
                                {carrito.map(item => (
                                    <CartItem
                                        key={`${item.productoId}-${item.selectedPresentation.id}`}
                                        item={item}
                                        onAdd={incrementar}
                                        onRemove={decrementar}
                                        onDelete={eliminarDelCarrito}
                                        onToggleDescuento={toggleDescuento}
                                        onChangePresentation={changePresentation}
                                        onSetCantidad={setCantidad}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Resumen + Confirmar ── */}
                    <div className={styles.orderSummary}>
                        {confirmError && (
                            <div className={styles.errorMsg}>
                                <AlertCircle size={14} strokeWidth={2} /> {confirmError}
                            </div>
                        )}
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Artículos</span>
                            <span className={styles.summaryVal}>{carrito.reduce((s, i) => s + i.cantidad, 0)}</span>
                        </div>
                        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                            <span>Total</span>
                            <span>Q {total.toFixed(2)}</span>
                        </div>
                        <button
                            id="btn-confirmar-orden"
                            className={styles.btnConfirm}
                            onClick={confirmarOrden}
                            disabled={confirmLoading || carrito.length === 0}
                        >
                            {confirmLoading
                                ? <><Loader2 size={18} className={styles.spin} /> Procesando…</>
                                : <><CheckCircle size={18} strokeWidth={2} /> Confirmar orden</>
                            }
                        </button>
                    </div>
                </section>

                {/* ════════════════════
                    PANEL DERECHO
                ════════════════════ */}
                <section
                    className={`${styles.panelRight} ${mobileTab !== "historial" ? styles.panelHiddenMobile : ""}`}
                    aria-label="Órdenes de hoy"
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitleRow}>
                            <CalendarDays size={20} strokeWidth={1.8} className={styles.panelIconAlt} />
                            <h2 className={styles.panelTitle}>Órdenes de hoy</h2>
                        </div>
                        <button id="btn-refresh-ordenes" className={styles.btnRefresh}
                            onClick={loadOrdenesHoy} title="Actualizar" disabled={ordenesLoading}>
                            <RefreshCw size={15} strokeWidth={2} className={ordenesLoading ? styles.spin : ""} />
                        </button>
                    </div>

                    {/* Resumen */}
                    {ordenesHoy.length > 0 && (
                        <div className={styles.todaySummary}>
                            <div className={styles.todayStat}>
                                <span className={styles.todayStatNum}>{ordenesHoy.length}</span>
                                <span className={styles.todayStatLabel}>Órdenes</span>
                            </div>
                            <div className={styles.todayStatDivider} />
                            <div className={styles.todayStat}>
                                <span className={styles.todayStatNum}>
                                    Q {ordenesHoy.reduce((s, o) => {
                                        const t = o.detalles?.reduce(
                                            (a, d) => a + Number(d.precioUnitario) * Number(d.cantidad), 0
                                        ) ?? Number(o.total ?? 0);
                                        return s + t;
                                    }, 0).toFixed(2)}
                                </span>
                                <span className={styles.todayStatLabel}>Total del día</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.ordenesScroll}>
                        {ordenesLoading ? (
                            <div className={styles.centerMsg}>
                                <Loader2 size={22} className={styles.spin} />
                                <span>Cargando…</span>
                            </div>
                        ) : ordenesError ? (
                            <div className={styles.centerMsg}>
                                <AlertCircle size={18} className={styles.errorColor} />
                                <span className={styles.errorColor}>{ordenesError}</span>
                                <button className={styles.btnRetry} onClick={loadOrdenesHoy}>Reintentar</button>
                            </div>
                        ) : ordenesHoy.length === 0 ? (
                            <div className={styles.emptyHoy}>
                                <CalendarDays size={36} strokeWidth={1} className={styles.emptyIcon} />
                                <p>Sin órdenes hoy aún</p>
                            </div>
                        ) : (
                            <div className={styles.ordenesGrid}>
                                {[...ordenesHoy].reverse().map(o => (
                                    <OrdenCard
                                        key={o.id}
                                        orden={o}
                                        onClick={(ord) => setDetalleModalOpen(ord)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <SuccessModal
                open={!!successModalData}
                orden={successModalData}
                onClose={() => setSuccessModalData(null)}
            />
            <OrdenDetalleModal
                open={!!detalleModalOpen}
                orden={detalleModalOpen}
                onClose={() => setDetalleModalOpen(null)}
            />
            <BarcodeScannerOverlay
                open={showCameraScanner}
                onScan={(code) => {
                    const match = productos.find(p => {
                        const cod = (p.codigo_barras || p.codigo || p.codigoBarras || "").toLowerCase();
                        return cod === code.trim().toLowerCase();
                    });
                    if (match) {
                        agregarProducto(match);
                    } else {
                        setBusqueda(code);
                        alert(`Código escaneado: "${code}", pero no coincide con ningún producto de la tienda.`);
                    }
                    setShowCameraScanner(false);
                }}
                onClose={() => setShowCameraScanner(false)}
            />
        </div>
    );
};

export default Venta;