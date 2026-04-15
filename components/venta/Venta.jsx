"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ShoppingCart, Search, Plus, Minus, Trash2,
    CheckCircle, X, AlertCircle, Loader2, Package,
    Clock, CalendarDays, RefreshCw, Tag,
} from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import { useProducts } from "@/hooks/useProducts";
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
function OrdenCard({ orden }) {
    const total = orden.detalles?.reduce(
        (s, d) => s + (Number(d.precioUnitario) * Number(d.cantidad)), 0
    ) ?? Number(orden.total ?? 0);

    return (
        <article className={styles.ordenCard} id={`orden-card-${orden.id}`}>
            <div className={styles.ordenCardHeader}>
                <span className={styles.ordenId}>#{String(orden.id).slice(-6).toUpperCase()}</span>
                <span className={`${styles.ordenChip} ${estadoColor(orden.estadoOrden?.nombre)}`}>
                    {orden.estadoOrden?.nombre ?? "—"}
                </span>
            </div>
            <div className={styles.ordenCardBody}>
                <div className={styles.ordenRow}>
                    <Package size={12} strokeWidth={2} className={styles.ordenIcon} />
                    <span>{orden.detalles?.length ?? 0} producto(s)</span>
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
function CartItem({ item, onAdd, onRemove, onDelete, onToggleDescuento, onToggleCaja, onSetCantidad }) {
    const isCaja = item.porCaja;
    // Si es por caja, usamos el precioCaja configurado.
    const rawPrice = isCaja ? item.precioCaja : item.precioUnitario;
    const subtotal = rawPrice * item.cantidad;
    const tieneDescuento = item.precioConDescuento != null && Number(item.precioConDescuento) > 0;
    const tieneCaja = item.precioCaja != null && Number(item.precioCaja) > 0 && item.unidadesCaja > 1;

    return (
        <div className={styles.cartItem} id={`cart-item-${item.productoId}`}>
            <div className={styles.cartItemInfo}>
                <p className={styles.cartItemName}>{item.nombre}</p>
                <div className={styles.cartPriceRow}>
                    <p className={`${styles.cartItemPrice} ${item.usandoDescuento && !isCaja ? styles.precioTachado : ""}`}>
                        {isCaja ? `Q ${Number(item.precioCaja).toFixed(2)} / caja` : `Q ${Number(item.precioOriginal).toFixed(2)}`}
                    </p>
                    {tieneDescuento && !isCaja && (
                        <label className={styles.descCheckLabel} htmlFor={`chk-desc-${item.productoId}`}>
                            <input
                                type="checkbox"
                                id={`chk-desc-${item.productoId}`}
                                checked={item.usandoDescuento}
                                onChange={() => onToggleDescuento(item.productoId)}
                                className={styles.descCheck}
                            />
                            <span className={styles.descCheckCustom} />
                            <Tag size={11} strokeWidth={2} />
                            <span>Q {Number(item.precioConDescuento).toFixed(2)}</span>
                        </label>
                    )}
                    {tieneCaja && (
                        <label className={styles.cajaCheckLabel} htmlFor={`chk-caja-${item.productoId}`}>
                            <input
                                type="checkbox"
                                id={`chk-caja-${item.productoId}`}
                                checked={item.porCaja}
                                onChange={() => onToggleCaja(item.productoId)}
                                className={styles.descCheck}
                            />
                            <span className={styles.descCheckCustom} />
                            <Package size={11} strokeWidth={2} />
                            <span>Por Caja ({item.unidadesCaja} unid.)</span>
                        </label>
                    )}
                </div>
            </div>

            <div className={styles.cartItemControls}>
                <button id={`btn-minus-${item.productoId}`} className={styles.qtyBtn}
                    onClick={() => onRemove(item.productoId)} title="Quitar unidad">
                    <Minus size={13} strokeWidth={2.5} />
                </button>
                <input 
                    type="number"
                    min="1"
                    className={styles.qtyInput}
                    value={item.cantidad}
                    onChange={(e) => onSetCantidad(item.productoId, e.target.value)}
                />
                <button id={`btn-plus-${item.productoId}`} className={`${styles.qtyBtn} ${styles.qtyBtnAdd}`}
                    onClick={() => onAdd(item.productoId)} title="Agregar unidad">
                    <Plus size={13} strokeWidth={2.5} />
                </button>
            </div>

            <div className={styles.cartItemRight}>
                <span className={styles.cartItemSubtotal}>Q {subtotal.toFixed(2)}</span>
                <button id={`btn-del-${item.productoId}`} className={styles.cartItemDel}
                    onClick={() => onDelete(item.productoId)} title="Eliminar">
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

    /* ── Carrito ── */
    const [carrito, setCarrito] = useState([]);

    /* ── Órdenes de hoy ── */
    const [ordenesHoy, setOrdenesHoy] = useState([]);
    const [ordenesLoading, setOrdenesLoading] = useState(true);
    const [ordenesError, setOrdenesError] = useState("");

    /* ── Confirmación ── */
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmError, setConfirmError] = useState("");
    const [successModalData, setSuccessModalData] = useState(null);

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
            .filter(p => p.nombre?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q))
            .slice(0, 8);
        setSugerencias(found);
        setShowSug(found.length > 0);
    }, [busqueda, productos]);

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
            const existe = prev.find(i => i.productoId === String(prod.id));
            if (existe) {
                return prev.map(i => i.productoId === String(prod.id)
                    ? { ...i, cantidad: i.cantidad + 1 }
                    : i
                );
            }
            const precioOriginal = Number(prod.precio ?? prod.precioNormal ?? 0);
            const precioConDescuento = prod.precioConDescuento != null && Number(prod.precioConDescuento) > 0
                ? Number(prod.precioConDescuento)
                : null;
            return [...prev, {
                productoId: String(prod.id),
                nombre: prod.nombre,
                precioOriginal,
                precioConDescuento,
                precioUnitario: precioOriginal, // precio activo si no es caja
                precioCaja: Number(prod.precioCaja) || 0,
                unidadesCaja: Number(prod.unidadesCaja) || 1,
                usandoDescuento: false,
                porCaja: false,
                cantidad: 1,
            }];
        });
    };

    const incrementar = (productoId) =>
        setCarrito(prev => prev.map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1 } : i));

    const decrementar = (productoId) =>
        setCarrito(prev => {
            const item = prev.find(i => i.productoId === productoId);
            if (!item) return prev;
            if (item.cantidad <= 1) return prev.filter(i => i.productoId !== productoId);
            return prev.map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1 } : i);
        });

    const setCantidad = (productoId, value) => {
        const val = parseInt(value, 10);
        if (isNaN(val) || val < 1) return;
        setCarrito(prev => prev.map(i => i.productoId === productoId ? { ...i, cantidad: val } : i));
    };

    const eliminarDelCarrito = (productoId) =>
        setCarrito(prev => prev.filter(i => i.productoId !== productoId));

    /** Toggle precio con descuento por producto */
    const toggleDescuento = (productoId) => {
        setCarrito(prev => prev.map(i => {
            if (i.productoId !== productoId) return i;
            const usandoDescuento = !i.usandoDescuento;
            return {
                ...i,
                usandoDescuento,
                porCaja: false, // quitar caja si se activa descuento unidad
                precioUnitario: usandoDescuento && i.precioConDescuento
                    ? i.precioConDescuento
                    : i.precioOriginal,
            };
        }));
    };

    /** Toggle por caja */
    const toggleCaja = (productoId) => {
        setCarrito(prev => prev.map(i => {
            if (i.productoId !== productoId) return i;
            const porCaja = !i.porCaja;
            return {
                ...i,
                porCaja,
                usandoDescuento: porCaja ? false : i.usandoDescuento, // quitar descuento si es caja
                precioUnitario: i.usandoDescuento && !porCaja && i.precioConDescuento
                    ? i.precioConDescuento
                    : i.precioOriginal,
            };
        }));
    };

    const limpiarCarrito = () => {
        setCarrito([]);
        setConfirmError("");
    };

    const total = carrito.reduce((s, i) => s + (i.porCaja ? i.precioCaja : i.precioUnitario) * i.cantidad, 0);

    /* ──────────────────────────────────────────────
       Confirmar orden
    ────────────────────────────────────────────── */
    const confirmarOrden = async () => {
        setConfirmError("");
        if (carrito.length === 0) { setConfirmError("Agrega al menos un producto."); return; }
        if (!estadoOrdenId) { setConfirmError("No se pudo obtener el estado de orden del servidor."); return; }
        if (!establecimientoId) { setConfirmError("El usuario no tiene establecimiento asignado."); return; }

        const payload = {
            clienteId: "1",           // siempre cliente genérico del sistema
            establecimientoId,
            estadoOrdenId,
            usuarioId,
            nitFacturacion: "CF",
            nombreFacturacion: "sistema",
            detalles: carrito.map(i => {
                let cantidadFinal = i.cantidad;
                let precioUnitarioFinal = i.precioUnitario;
                if (i.porCaja && i.unidadesCaja > 0) {
                    cantidadFinal = i.cantidad * i.unidadesCaja;
                    precioUnitarioFinal = i.precioCaja / i.unidadesCaja;
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
            mutateProducts(); // Actualizar productos después de la venta (stock)
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
                                    placeholder={prodLoading ? "Cargando productos…" : "Nombre o slug del producto…"}
                                    className={styles.searchInput}
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    onFocus={() => sugerencias.length > 0 && setShowSug(true)}
                                    disabled={prodLoading}
                                    autoComplete="off"
                                />
                                {prodLoading && <Loader2 size={14} className={`${styles.searchIcoRight} ${styles.spin}`} />}
                            </div>

                            {showSug && (
                                <ul className={styles.dropdown} id="dropdown-products">
                                    {sugerencias.map(p => {
                                        const precio = Number(p.precio ?? p.precioNormal ?? 0);
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
                                        key={item.productoId}
                                        item={item}
                                        onAdd={incrementar}
                                        onRemove={decrementar}
                                        onDelete={eliminarDelCarrito}
                                        onToggleDescuento={toggleDescuento}
                                        onToggleCaja={toggleCaja}
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
                                    <OrdenCard key={o.id} orden={o} />
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
        </div>
    );
};

export default Venta;