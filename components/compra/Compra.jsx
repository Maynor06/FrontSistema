"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ShoppingBag, Plus, Minus, Trash2, X, AlertCircle,
    Loader2, CheckCircle, Search, Package, Truck,
    FileText, Hash, RefreshCw,
} from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import styles from "./Compra.module.css";

/* ══════════════════════════════════════════════
   ITEM DEL CARRITO DE COMPRA
══════════════════════════════════════════════ */
function CompraItem({ item, onAdd, onRemove, onDelete, onPrecioChange, onToggleCaja }) {
    const isCaja = item.porCaja;
    const qty = isCaja ? item.cajas : item.cantidad;
    const precio = isCaja ? item.precioCompraCaja : item.precioCompra;
    const subtotal = precio * qty;

    return (
        <div className={styles.cartItem} id={`compra-item-${item.productoId}`}>
            <div className={styles.cartItemInfo}>
                <p className={styles.cartItemName}>{item.nombre}</p>
                <div className={styles.precioWrap}>
                    <span className={styles.precioLabel}>Precio {isCaja ? "por caja" : "compra"}:</span>
                    <div className={styles.precioInputWrap}>
                        <span className={styles.precioPrefix}>Q</span>
                        <input
                            id={`precio-${item.productoId}`}
                            type="number"
                            step="0.01"
                            min="0.01"
                            className={styles.precioInput}
                            value={precio}
                            onChange={e => onPrecioChange(item.productoId, e.target.value)}
                        />
                    </div>
                </div>
                {item.unidadesCaja > 0 && (
                    <label className={styles.cajaCheck} htmlFor={`caja-${item.productoId}`}>
                        <input 
                            type="checkbox" 
                            id={`caja-${item.productoId}`} 
                            checked={isCaja} 
                            onChange={() => onToggleCaja(item.productoId)} 
                        />
                        Comprar por caja ({item.unidadesCaja} uds)
                    </label>
                )}
                {isCaja && (
                    <p className={styles.cajaInfo}>
                        Total: {qty * item.unidadesCaja} unidades a Q {(precio / item.unidadesCaja).toFixed(2)} c/u
                    </p>
                )}
            </div>

            <div className={styles.cartItemControls}>
                <button id={`btn-minus-c-${item.productoId}`} className={styles.qtyBtn}
                    onClick={() => onRemove(item.productoId)} title="Quitar">
                    <Minus size={13} strokeWidth={2.5} />
                </button>
                <span className={styles.qtyNum}>{qty}</span>
                <button id={`btn-plus-c-${item.productoId}`} className={`${styles.qtyBtn} ${styles.qtyBtnAdd}`}
                    onClick={() => onAdd(item.productoId)} title="Agregar">
                    <Plus size={13} strokeWidth={2.5} />
                </button>
            </div>

            <div className={styles.cartItemRight}>
                <span className={styles.cartSubtotal}>Q {subtotal.toFixed(2)}</span>
                <button id={`btn-del-c-${item.productoId}`} className={styles.cartItemDel}
                    onClick={() => onDelete(item.productoId)} title="Eliminar">
                    <Trash2 size={13} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   MODAL ÉXITO
══════════════════════════════════════════════ */
function SuccessModal({ open, onClose }) {
    if (!open) return null;
    return (
        <div className={styles.overlay}>
            <div className={styles.successModal}>
                <div className={styles.successIcon}><CheckCircle size={44} strokeWidth={1.5} /></div>
                <h2 className={styles.successTitle}>¡Compra registrada!</h2>
                <p className={styles.successSub}>La compra fue guardada correctamente.</p>
                <button id="btn-compra-ok" className={styles.btnConfirm} onClick={onClose}>
                    Continuar
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   CARD — compra del historial
══════════════════════════════════════════════ */
function CompraCard({ compra }) {
    const total = compra.detalles?.reduce(
        (s, d) => s + Number(d.precioCompra) * Number(d.cantidad), 0
    ) ?? Number(compra.total ?? 0);

    return (
        <article className={styles.compraCard} id={`compra-card-${compra.id}`}>
            <div className={styles.compraCardHeader}>
                <span className={styles.compraId}>#{String(compra.id).slice(-6).toUpperCase()}</span>
                <span className={styles.compraTotal}>Q {Number(total).toFixed(2)}</span>
            </div>
            <div className={styles.compraCardBody}>
                <div className={styles.compraRow}>
                    <Truck size={12} strokeWidth={2} className={styles.compraIcon} />
                    <span>{compra.proveedor?.nombre ?? "—"}</span>
                </div>
                <div className={styles.compraRow}>
                    <Package size={12} strokeWidth={2} className={styles.compraIcon} />
                    <span>{compra.detalles?.length ?? 0} producto(s)</span>
                </div>
                {compra.numeroDocumento && (
                    <div className={styles.compraRow}>
                        <Hash size={12} strokeWidth={2} className={styles.compraIcon} />
                        <span>{compra.numeroDocumento}</span>
                    </div>
                )}
            </div>
        </article>
    );
}

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */
export const Compra = () => {
    const usuario = getUsuario();
    const usuarioId = String(usuario?.id ?? "");
    const establecimientoId = String(
        usuario?.establecimientoId ?? usuario?.establecimiento?.id ?? ""
    );

    /* ── Maestros ── */
    const [productos, setProductos] = useState([]);
    const [prodLoading, setProdLoading] = useState(true);
    const [proveedores, setProveedores] = useState([]);
    const [provLoading, setProvLoading] = useState(true);

    /* ── Búsqueda de productos ── */
    const [busqueda, setBusqueda] = useState("");
    const [sugerencias, setSugerencias] = useState([]);
    const [showSug, setShowSug] = useState(false);
    const searchRef = useRef(null);

    /* ── Carrito de compra ── */
    const [carrito, setCarrito] = useState([]);

    /* ── Datos de la compra ── */
    const [proveedorId, setProveedorId] = useState("");
    const [documento, setDocumento] = useState("");
    const [numeroDocumento, setNumeroDocumento] = useState("");

    /* ── Estados ── */
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    /* ── Historial ── */
    const [compras, setCompras] = useState([]);
    const [histLoading, setHistLoading] = useState(true);
    const [histError, setHistError] = useState("");

    /* ── Tabs móvil ── */
    const [mobileTab, setMobileTab] = useState("nueva");

    /* ────────────────── Carga ────────────────── */
    const loadMaestros = useCallback(async () => {
        const [prods, provs] = await Promise.allSettled([
            Api.get("/products"),
            Api.get("/proveedor"),
        ]);
        if (prods.status === "fulfilled") setProductos(Array.isArray(prods.value) ? prods.value : []);
        if (provs.status === "fulfilled") setProveedores(Array.isArray(provs.value) ? provs.value : []);
        setProdLoading(false);
        setProvLoading(false);
    }, []);

    const loadCompras = useCallback(async () => {
        setHistLoading(true);
        setHistError("");
        try {
            const data = await Api.get("/compra");
            setCompras(Array.isArray(data) ? data : []);
        } catch (err) {
            setHistError(err.message || "No se pudo cargar el historial.");
        } finally {
            setHistLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMaestros();
        loadCompras();
    }, [loadMaestros, loadCompras]);

    /* ── Autocomplete ── */
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

    /* ── Carrito ── */
    const agregarProducto = (prod) => {
        setBusqueda("");
        setShowSug(false);
        setCarrito(prev => {
            const existe = prev.find(i => i.productoId === String(prod.id));
            if (existe) {
                return prev.map(i => {
                    if (i.productoId === String(prod.id)) {
                        if (i.porCaja) return { ...i, cajas: i.cajas + 1 };
                        return { ...i, cantidad: i.cantidad + 1 };
                    }
                    return i;
                });
            }
            
            const precioBase = Number(prod.precioCompra ?? prod.precio ?? 0);
            const udsCaja = Number(prod.unidadesCaja ?? 0);
            
            return [...prev, {
                productoId: String(prod.id),
                nombre: prod.nombre,
                precioCompra: precioBase,
                cantidad: 1,
                unidadesCaja: udsCaja,
                porCaja: false,
                cajas: 1,
                precioCompraCaja: precioBase * (udsCaja > 0 ? udsCaja : 1),
            }];
        });
    };

    const incrementar = (id) => setCarrito(p => p.map(i => {
        if (i.productoId === id) {
            if (i.porCaja) return { ...i, cajas: i.cajas + 1 };
            return { ...i, cantidad: i.cantidad + 1 };
        }
        return i;
    }));
    
    const decrementar = (id) => setCarrito(p => {
        const item = p.find(i => i.productoId === id);
        if (!item) return p;
        if (item.porCaja) {
            if (item.cajas <= 1) return p.filter(i => i.productoId !== id);
            return p.map(i => i.productoId === id ? { ...i, cajas: i.cajas - 1 } : i);
        } else {
            if (item.cantidad <= 1) return p.filter(i => i.productoId !== id);
            return p.map(i => i.productoId === id ? { ...i, cantidad: i.cantidad - 1 } : i);
        }
    });

    const eliminar = (id) => setCarrito(p => p.filter(i => i.productoId !== id));
    
    const cambiarPrecio = (id, val) => setCarrito(p => p.map(i => {
        if (i.productoId === id) {
            if (i.porCaja) return { ...i, precioCompraCaja: val === "" ? "" : Number(val) };
            return { ...i, precioCompra: val === "" ? "" : Number(val) };
        }
        return i;
    }));

    const toggleCaja = (id) => setCarrito(p => p.map(i => i.productoId === id ? { ...i, porCaja: !i.porCaja } : i));

    const limpiar = () => {
        setCarrito([]);
        setProveedorId("");
        setDocumento("");
        setNumeroDocumento("");
        setFormError("");
    };

    const total = carrito.reduce((s, i) => {
        const qty = i.porCaja ? i.cajas : i.cantidad;
        const precio = i.porCaja ? Number(i.precioCompraCaja) : Number(i.precioCompra);
        return s + (precio || 0) * qty;
    }, 0);

    /* ── Confirmar ── */
    const confirmar = async () => {
        setFormError("");
        if (carrito.length === 0) { setFormError("Agrega al menos un producto."); return; }
        if (!proveedorId) { setFormError("Selecciona un proveedor."); return; }
        if (carrito.some(i => !i.precioCompra || Number(i.precioCompra) <= 0)) {
            setFormError("Todos los productos deben tener un precio de compra válido."); return;
        }
        if (!establecimientoId) { setFormError("El usuario no tiene establecimiento asignado."); return; }

        const payload = {
            usuarioId,
            establecimientoId,
            proveedorId,
            detalles: carrito.map(i => {
                let finalCantidad = i.cantidad;
                let finalPrecio = Number(i.precioCompra);
                
                if (i.porCaja && i.unidadesCaja > 0) {
                    finalCantidad = i.cajas * i.unidadesCaja;
                    finalPrecio = Number(i.precioCompraCaja) / i.unidadesCaja;
                }
                
                return {
                    productoId: i.productoId,
                    cantidad: finalCantidad,
                    precioCompra: finalPrecio,
                };
            }),
        };
        if (documento.trim()) payload.documento = documento.trim();
        if (numeroDocumento.trim()) payload.numeroDocumento = numeroDocumento.trim();

        setFormLoading(true);
        try {
            await Api.post("/compra", payload);
            limpiar();
            setShowSuccess(true);
            loadCompras();
        } catch (err) {
            setFormError(err.message || "No se pudo registrar la compra.");
        } finally {
            setFormLoading(false);
        }
    };

    /* ──────────────── RENDER ──────────────── */
    return (
        <div className={styles.root}>
            {/* ── Tabs móvil ── */}
            <div className={styles.mobileTabs}>
                <button id="tab-compra-nueva"
                    className={`${styles.mobileTab} ${mobileTab === "nueva" ? styles.mobileTabActive : ""}`}
                    onClick={() => setMobileTab("nueva")}>
                    <Plus size={14} strokeWidth={2} /> Nueva compra
                </button>
                <button id="tab-compra-hist"
                    className={`${styles.mobileTab} ${mobileTab === "hist" ? styles.mobileTabActive : ""}`}
                    onClick={() => setMobileTab("hist")}>
                    <ShoppingBag size={14} strokeWidth={2} /> Historial ({compras.length})
                </button>
            </div>

            <div className={styles.layout}>
                {/* ════════════════════
                    PANEL IZQUIERDO
                ════════════════════ */}
                <section
                    className={`${styles.panelLeft} ${mobileTab !== "nueva" ? styles.panelHiddenMobile : ""}`}
                    aria-label="Nueva compra"
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitleRow}>
                            <ShoppingBag size={20} strokeWidth={1.8} className={styles.panelIcon} />
                            <h1 className={styles.panelTitle}>Nueva compra</h1>
                        </div>
                    </div>

                    {/* ── Buscador de productos ── */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Agregar producto</p>
                        <div className={styles.searchWrap} ref={searchRef}>
                            <div className={styles.searchBox}>
                                <Search size={15} className={styles.searchIco} strokeWidth={2} />
                                <input
                                    id="input-buscar-prod-compra"
                                    type="text"
                                    placeholder={prodLoading ? "Cargando…" : "Nombre o slug del producto…"}
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
                                <ul className={styles.dropdown} id="dropdown-compra-products">
                                    {sugerencias.map(p => (
                                        <li key={p.id}>
                                            <button id={`sug-c-${p.id}`} className={styles.dropdownItem}
                                                onClick={() => agregarProducto(p)} type="button">
                                                <div className={styles.dropdownIcon}>
                                                    <Package size={14} strokeWidth={1.8} />
                                                </div>
                                                <div className={styles.dropdownInfo}>
                                                    <span className={styles.dropdownName}>{p.nombre}</span>
                                                    {p.slug && <span className={styles.dropdownSlug}>/{p.slug}</span>}
                                                </div>
                                                <Plus size={14} strokeWidth={2.5} className={styles.dropdownPlus} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* ── Carrito ── */}
                    <div className={`${styles.section} ${styles.sectionFlex}`}>
                        <div className={styles.sectionLabelRow}>
                            <p className={styles.sectionLabel}>Productos a comprar</p>
                            {carrito.length > 0 && (
                                <button id="btn-limpiar-compra" className={styles.btnClear} onClick={limpiar}>
                                    <X size={12} strokeWidth={2.5} /> Limpiar
                                </button>
                            )}
                        </div>
                        {carrito.length === 0 ? (
                            <div className={styles.cartEmpty}>
                                <ShoppingBag size={32} strokeWidth={1} className={styles.cartEmptyIcon} />
                                <p>Agrega productos para iniciar la compra</p>
                            </div>
                        ) : (
                            <div className={styles.cartList}>
                                {carrito.map(item => (
                                    <CompraItem
                                        key={item.productoId}
                                        item={item}
                                        onAdd={incrementar}
                                        onRemove={decrementar}
                                        onDelete={eliminar}
                                        onPrecioChange={cambiarPrecio}
                                        onToggleCaja={toggleCaja}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Datos de la compra ── */}
                    <div className={styles.section}>
                        <p className={styles.sectionLabel}>Datos de la compra</p>
                        <div className={styles.orderFields}>

                            {/* Proveedor */}
                            <div className={styles.field}>
                                <label htmlFor="sel-proveedor" className={styles.fieldLabel}>
                                    <Truck size={12} strokeWidth={2} /> Proveedor *
                                </label>
                                {provLoading ? (
                                    <div className={styles.loadingRow}>
                                        <Loader2 size={14} className={styles.spin} /> Cargando…
                                    </div>
                                ) : (
                                    <select id="sel-proveedor" className={styles.select}
                                        value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
                                        <option value="">— Selecciona un proveedor —</option>
                                        {proveedores.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Documento / Número */}
                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label htmlFor="inp-doc" className={styles.fieldLabel}>
                                        <FileText size={12} strokeWidth={2} /> Documento
                                    </label>
                                    <input id="inp-doc" type="text" className={styles.input}
                                        placeholder="Ej. Factura" value={documento}
                                        onChange={e => setDocumento(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="inp-num-doc" className={styles.fieldLabel}>
                                        <Hash size={12} strokeWidth={2} /> Nº documento
                                    </label>
                                    <input id="inp-num-doc" type="text" className={styles.input}
                                        placeholder="001-0001" value={numeroDocumento}
                                        onChange={e => setNumeroDocumento(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Resumen + Confirmar ── */}
                    <div className={styles.orderSummary}>
                        {formError && (
                            <div className={styles.errorMsg}>
                                <AlertCircle size={14} strokeWidth={2} /> {formError}
                            </div>
                        )}
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Total de ítems</span>
                            <span className={styles.summaryVal}>{carrito.reduce((s, i) => s + (i.porCaja ? i.cajas : i.cantidad), 0)}</span>
                        </div>
                        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                            <span>Total compra</span>
                            <span>Q {total.toFixed(2)}</span>
                        </div>
                        <button id="btn-confirmar-compra" className={styles.btnConfirm}
                            onClick={confirmar} disabled={formLoading || carrito.length === 0}>
                            {formLoading
                                ? <><Loader2 size={18} className={styles.spin} /> Procesando…</>
                                : <><CheckCircle size={18} strokeWidth={2} /> Registrar compra</>
                            }
                        </button>
                    </div>
                </section>

                {/* ════════════════════
                    PANEL DERECHO — Historial
                ════════════════════ */}
                <section
                    className={`${styles.panelRight} ${mobileTab !== "hist" ? styles.panelHiddenMobile : ""}`}
                    aria-label="Historial de compras"
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitleRow}>
                            <ShoppingBag size={20} strokeWidth={1.8} className={styles.panelIconAlt} />
                            <h2 className={styles.panelTitle}>Historial</h2>
                        </div>
                        <button id="btn-refresh-compras" className={styles.btnRefresh}
                            onClick={loadCompras} disabled={histLoading} title="Actualizar">
                            <RefreshCw size={15} strokeWidth={2} className={histLoading ? styles.spin : ""} />
                        </button>
                    </div>

                    {compras.length > 0 && (
                        <div className={styles.daySummary}>
                            <div className={styles.dayStat}>
                                <span className={styles.dayStatNum}>{compras.length}</span>
                                <span className={styles.dayStatLabel}>Compras</span>
                            </div>
                            <div className={styles.dayStatDivider} />
                            <div className={styles.dayStat}>
                                <span className={styles.dayStatNum}>
                                    Q {compras.reduce((s, c) => {
                                        const t = c.detalles?.reduce(
                                            (a, d) => a + Number(d.precioCompra) * Number(d.cantidad), 0
                                        ) ?? Number(c.total ?? 0);
                                        return s + t;
                                    }, 0).toFixed(2)}
                                </span>
                                <span className={styles.dayStatLabel}>Total</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.histScroll}>
                        {histLoading ? (
                            <div className={styles.centerMsg}>
                                <Loader2 size={22} className={styles.spin} /><span>Cargando…</span>
                            </div>
                        ) : histError ? (
                            <div className={styles.centerMsg}>
                                <AlertCircle size={18} className={styles.errColor} />
                                <span className={styles.errColor}>{histError}</span>
                                <button className={styles.btnRetry} onClick={loadCompras}>Reintentar</button>
                            </div>
                        ) : compras.length === 0 ? (
                            <div className={styles.emptyState}>
                                <ShoppingBag size={36} strokeWidth={1} className={styles.emptyIcon} />
                                <p>Sin compras registradas.</p>
                            </div>
                        ) : (
                            <div className={styles.cardList}>
                                {[...compras].reverse().map(c => (
                                    <CompraCard key={c.id} compra={c} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <SuccessModal open={showSuccess} onClose={() => setShowSuccess(false)} />
        </div>
    );
};

export default Compra;
