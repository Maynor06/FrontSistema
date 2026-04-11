"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Boxes, RefreshCw, Search, AlertCircle, Loader2,
    Package, TrendingUp, TrendingDown, Minus, AlertTriangle,
} from "lucide-react";
import Api from "@/lib/api";
import styles from "./Inventario.module.css";

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
function nivelStock(cantidad) {
    const n = Number(cantidad ?? 0);
    if (n <= 0) return { label: "Sin stock", cls: "stockAgotado", Icon: AlertTriangle };
    if (n <= 5) return { label: "Stock bajo", cls: "stockBajo", Icon: TrendingDown };
    if (n <= 20) return { label: "Stock medio", cls: "stockMedio", Icon: Minus };
    return { label: "Stock alto", cls: "stockAlto", Icon: TrendingUp };
}

/* ──────────────────────────────────────────────
   CARD DE INVENTARIO
────────────────────────────────────────────── */
function InventarioCard({ item }) {
    const cantidad = Number(item.cantidad ?? item.stock ?? 0);
    const { label, cls, Icon } = nivelStock(cantidad);

    return (
        <article className={styles.card} id={`inv-card-${item.id}`}>
            <div className={styles.cardIcon}>
                <Package size={18} strokeWidth={1.8} />
            </div>
            <div className={styles.cardBody}>
                <p className={styles.cardName}>
                    {item.producto?.nombre ?? item.nombre ?? `Producto #${item.productoId ?? item.id}`}
                </p>
                {(item.producto?.slug || item.slug) && (
                    <p className={styles.cardSlug}>/{item.producto?.slug ?? item.slug}</p>
                )}
                {item.establecimiento?.nombre && (
                    <p className={styles.cardEst}>{item.establecimiento.nombre}</p>
                )}
            </div>
            <div className={styles.cardRight}>
                <span className={styles.cardQty}>{cantidad}</span>
                <span className={`${styles.stockChip} ${styles[cls]}`}>
                    <Icon size={11} strokeWidth={2} />
                    {label}
                </span>
            </div>
        </article>
    );
}

/* ──────────────────────────────────────────────
   COMPONENTE PRINCIPAL
────────────────────────────────────────────── */
export const Inventario = () => {
    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const loadInventario = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await Api.get("/inventario");
            setInventario(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "No se pudo cargar el inventario.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadInventario(); }, [loadInventario]);

    /* ── Filtro local ── */
    const filtrado = inventario.filter(item => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        const nombre = (item.producto?.nombre ?? item.nombre ?? "").toLowerCase();
        const slug = (item.producto?.slug ?? item.slug ?? "").toLowerCase();
        return nombre.includes(q) || slug.includes(q);
    });

    /* ── Estadísticas rápidas ── */
    const stats = {
        total: inventario.length,
        sinStock: inventario.filter(i => Number(i.cantidad ?? i.stock ?? 0) <= 0).length,
        stockBajo: inventario.filter(i => {
            const n = Number(i.cantidad ?? i.stock ?? 0);
            return n > 0 && n <= 5;
        }).length,
    };

    return (
        <div className={styles.page}>
            {/* ── Header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>
                    <div className={styles.pageTitleIcon}>
                        <Boxes size={24} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className={styles.h1}>Inventario</h1>
                        <p className={styles.subtitle}>Existencias actuales de productos</p>
                    </div>
                </div>
                <button
                    id="btn-refresh-inv"
                    className={styles.btnRefresh}
                    onClick={loadInventario}
                    disabled={loading}
                    title="Actualizar"
                >
                    <RefreshCw size={16} strokeWidth={2} className={loading ? styles.spin : ""} />
                    Actualizar
                </button>
            </div>

            {/* ── Stats rápidas ── */}
            {!loading && !error && (
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <span className={styles.statNum}>{stats.total}</span>
                        <span className={styles.statLabel}>Productos</span>
                    </div>
                    <div className={`${styles.statCard} ${stats.sinStock > 0 ? styles.statCardDanger : ""}`}>
                        <span className={styles.statNum}>{stats.sinStock}</span>
                        <span className={styles.statLabel}>Sin stock</span>
                    </div>
                    <div className={`${styles.statCard} ${stats.stockBajo > 0 ? styles.statCardWarn : ""}`}>
                        <span className={styles.statNum}>{stats.stockBajo}</span>
                        <span className={styles.statLabel}>Stock bajo (≤5)</span>
                    </div>
                </div>
            )}

            {/* ── Buscador ── */}
            <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIco} strokeWidth={2} />
                <input
                    id="input-buscar-inv"
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar por nombre o slug…"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>

            {/* ── Contenido ── */}
            {loading ? (
                <div className={styles.centerMsg}>
                    <Loader2 size={26} className={styles.spin} />
                    <span>Cargando inventario…</span>
                </div>
            ) : error ? (
                <div className={styles.centerMsg}>
                    <AlertCircle size={20} className={styles.errorColor} />
                    <span className={styles.errorColor}>{error}</span>
                    <button className={styles.btnRetry} onClick={loadInventario}>Reintentar</button>
                </div>
            ) : filtrado.length === 0 ? (
                <div className={styles.emptyState}>
                    <Boxes size={44} strokeWidth={1} className={styles.emptyIcon} />
                    <p className={styles.emptyText}>
                        {busqueda ? "Sin resultados para esa búsqueda." : "No hay registros de inventario."}
                    </p>
                </div>
            ) : (
                <div className={styles.list}>
                    {filtrado.map(item => (
                        <InventarioCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Inventario;
