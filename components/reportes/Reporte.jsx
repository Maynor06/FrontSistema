"use client";

import { useState } from "react";
import { BarChart3, Calendar, CalendarDays, CalendarSearch, Loader2, AlertCircle, TrendingUp } from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import styles from "./Reporte.module.css";

/* ══════════════════════════════════════════════
   CARD GENÉRICA PARA ESTADÍSTICAS
══════════════════════════════════════════════ */
function StatCard({ label: keyName, value }) {
    // Formatear label: de "totalVentas" a "TOTAL VENTAS"
    const formattedLabel = keyName
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .toUpperCase();

    // Determinar si es un número para darle formato de moneda
    let displayValue = value;
    const isNumber = typeof value === "number";

    if (keyName === "periodo" && typeof value === "object" && value !== null) {
        // Formatear las fechas si vienen en objeto
        const formatF = (d) => new Date(d).toLocaleDateString("es-GT", { day: '2-digit', month: 'short' });
        displayValue = `${formatF(value.desde)} al ${formatF(value.hasta)}`;
    } else if (isNumber) {
        // Si no lleva la palabra "total" o es un contador entero, mostramos como moneda.
        // totalOrdenes es entero y no debe llevar Q.
        if (keyName.includes("totalOrdenes") || keyName.includes("cantidad")) {
            displayValue = value.toLocaleString("es-GT");
        } else {
            displayValue = `Q ${value.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    } else if (typeof value === "object" && value !== null) {
        // Por si acaso viene otro objeto desconocido
        displayValue = "JSON Data";
    }
    // Colores dependiendo de la key (opcional, para dar un toque visual)
    let colorClass = styles.statDefault;
    const lowerLabel = keyName.toLowerCase();
    if (lowerLabel.includes("venta") || lowerLabel.includes("ingreso") || lowerLabel.includes("ganancia")) colorClass = styles.statSuccess;
    else if (lowerLabel.includes("gasto") || lowerLabel.includes("costo") || lowerLabel.includes("compra")) colorClass = styles.statWarning;
    else if (lowerLabel.includes("periodo") || lowerLabel.includes("orden")) colorClass = styles.statPrimary;

    return (
        <article className={`${styles.statCard} ${colorClass}`}>
            <div className={styles.statInfo}>
                <p className={styles.statLabel}>{formattedLabel}</p>
                <h3 className={styles.statValue}>{displayValue}</h3>
            </div>
        </article>
    );
}

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */
export const Reporte = () => {
    const usuario = getUsuario();
    const establecimientoId = String(
        usuario?.establecimientoId ?? usuario?.establecimiento?.id ?? ""
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState(null);

    const fetchReport = async (tipo) => {
        if (!establecimientoId) {
            setError("No se detectó un establecimiento asociado al usuario.");
            return;
        }

        setLoading(true);
        setError("");
        setActiveTab(tipo);
        setData(null);

        try {
            const res = await Api.get(`/reportes/balance/${tipo}/${establecimientoId}`);
            setData(res);
        } catch (err) {
            setError(err.message || "Error al generar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <div className={styles.titleIcon}>
                        <BarChart3 size={24} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Estado de Resultados</h1>
                        <p className={styles.subtitle}>Consulta el balance general del establecimiento</p>
                    </div>
                </div>
            </div>

            <div className={styles.controlsSection}>
                <p className={styles.instruction}>Selecciona el período a consultar:</p>
                <div className={styles.buttonGroup}>
                    <button 
                        className={`${styles.btnReport} ${activeTab === 'hoy' ? styles.active : ''}`}
                        onClick={() => fetchReport("hoy")}
                        disabled={loading}
                    >
                        <Calendar size={18} />
                        Balance Hoy
                    </button>
                    <button 
                        className={`${styles.btnReport} ${activeTab === 'semanal' ? styles.active : ''}`}
                        onClick={() => fetchReport("semanal")}
                        disabled={loading}
                    >
                        <CalendarDays size={18} />
                        Balance Semanal
                    </button>
                    <button 
                        className={`${styles.btnReport} ${activeTab === 'mensual' ? styles.active : ''}`}
                        onClick={() => fetchReport("mensual")}
                        disabled={loading}
                    >
                        <CalendarSearch size={18} />
                        Balance Mensual
                    </button>
                </div>
            </div>

            <div className={styles.contentSection}>
                {loading ? (
                    <div className={styles.centerBox}>
                        <Loader2 size={32} className={styles.spin} />
                        <p>Generando reporte...</p>
                    </div>
                ) : error ? (
                    <div className={styles.errorBox}>
                        <AlertCircle size={24} />
                        <p>{error}</p>
                    </div>
                ) : data ? (
                    typeof data === "object" && Object.keys(data).length > 0 ? (
                        <>
                            <div className={styles.reportHeader}>
                                <TrendingUp size={20} className={styles.reportIcon} />
                                <h2>Resultados ({activeTab.toUpperCase()})</h2>
                            </div>
                            <div className={styles.grid}>
                                {Object.entries(data).map(([key, value]) => {
                                    if (key === "establecimientoId" || key === "id") return null;
                                    return <StatCard key={key} label={key} value={value} />;
                                })}
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyBox}>
                            <p>El reporte no arrojó resultados.</p>
                        </div>
                    )
                ) : (
                    <div className={styles.emptyBox}>
                        <BarChart3 size={48} strokeWidth={1} className={styles.emptyIcon} />
                        <p>Los resultados aparecerán aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reporte;
