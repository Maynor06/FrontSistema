"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Receipt, Plus, Trash2, X, AlertCircle,
    Loader2, CheckCircle, RefreshCw, Tag,
    DollarSign, LayoutList, CalendarDays, Clock,
} from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import styles from "./Gasto.module.css";

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function formatFecha(raw) {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-GT", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
}

/* ══════════════════════════════════════════════
   CARD — gasto registrado
══════════════════════════════════════════════ */
function GastoCard({ gasto }) {
    return (
        <article className={styles.card} id={`gasto-card-${gasto.id}`}>
            <div className={styles.cardIconWrap}>
                <Receipt size={18} strokeWidth={1.8} />
            </div>
            <div className={styles.cardBody}>
                <p className={styles.cardName}>
                    {gasto.gastoCategoria?.nombre ?? gasto.gastoCategoriaId ?? "—"}
                </p>
                {gasto.description && (
                    <p className={styles.cardDesc}>{gasto.description}</p>
                )}
                <p className={styles.cardMeta}>
                    <Clock size={11} strokeWidth={2} />
                    {formatFecha(gasto.fecha ?? gasto.createdAt)}
                </p>
            </div>
            <div className={styles.cardAmount}>
                <span className={styles.amount}>Q {Number(gasto.monto).toFixed(2)}</span>
            </div>
        </article>
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
                <h2 className={styles.successTitle}>¡Gasto registrado!</h2>
                <p className={styles.successSub}>El gasto fue guardado correctamente.</p>
                <button id="btn-gasto-ok" className={styles.btnConfirm} onClick={onClose}>
                    Continuar
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */
export const Gasto = () => {
    const usuario = getUsuario();
    const usuarioId = String(usuario?.id ?? "");
    const establecimientoId = String(
        usuario?.establecimientoId ?? usuario?.establecimiento?.id ?? ""
    );

    /* ── Maestros ── */
    const [categorias, setCategorias] = useState([]);
    const [catLoading, setCatLoading] = useState(true);

    /* ── Formulario ── */
    const [form, setForm] = useState({
        monto: "",
        description: "",
        gastoCategoriaId: "",
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    /* ── Historial de hoy ── */
    const [gastosHoy, setGastosHoy] = useState([]);
    const [histLoading, setHistLoading] = useState(true);
    const [histError, setHistError] = useState("");

    /* ── Tabs móvil ── */
    const [mobileTab, setMobileTab] = useState("nuevo");

    /* ────────────────── Carga ────────────────── */
    const loadCategorias = useCallback(async () => {
        try {
            const data = await Api.get("/gasto-categoria");
            setCategorias(Array.isArray(data) ? data : []);
        } catch (_) { /* silencioso */ }
        finally { setCatLoading(false); }
    }, []);

    const loadGastosHoy = useCallback(async () => {
        setHistLoading(true);
        setHistError("");
        try {
            const data = await Api.get("/gasto/hoy");
            setGastosHoy(Array.isArray(data) ? data : []);
        } catch (err) {
            setHistError(err.message || "No se pudieron cargar los gastos de hoy.");
        } finally {
            setHistLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategorias();
        loadGastosHoy();
    }, [loadCategorias, loadGastosHoy]);

    /* ────────────────── Handlers ─────────────── */
    const handleChange = (e) =>
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
            setFormError("Ingresa un monto válido mayor a 0."); return;
        }
        if (!form.gastoCategoriaId) {
            setFormError("Selecciona una categoría de gasto."); return;
        }
        if (!establecimientoId) {
            setFormError("No se pudo obtener el establecimiento del usuario."); return;
        }

        const payload = {
            monto: Number(form.monto),
            gastoCategoriaId: form.gastoCategoriaId,
            usuarioId,
            establecimientoId,
        };
        if (form.description.trim()) payload.description = form.description.trim();

        setFormLoading(true);
        try {
            await Api.post("/gasto", payload);
            setForm({ monto: "", description: "", gastoCategoriaId: "" });
            setShowSuccess(true);
            loadGastosHoy();
        } catch (err) {
            setFormError(err.message || "No se pudo registrar el gasto.");
        } finally {
            setFormLoading(false);
        }
    };

    /* ── Totales del día ── */
    const totalHoy = gastosHoy.reduce((s, g) => s + Number(g.monto ?? 0), 0);

    /* ──────────────── RENDER ──────────────── */
    return (
        <div className={styles.root}>
            {/* ── Tabs móvil ── */}
            <div className={styles.mobileTabs}>
                <button id="tab-gasto-nuevo"
                    className={`${styles.mobileTab} ${mobileTab === "nuevo" ? styles.mobileTabActive : ""}`}
                    onClick={() => setMobileTab("nuevo")}>
                    <Plus size={14} strokeWidth={2} /> Nuevo gasto
                </button>
                <button id="tab-gasto-hist"
                    className={`${styles.mobileTab} ${mobileTab === "hist" ? styles.mobileTabActive : ""}`}
                    onClick={() => setMobileTab("hist")}>
                    <CalendarDays size={14} strokeWidth={2} /> Hoy ({gastosHoy.length})
                </button>
            </div>

            <div className={styles.layout}>
                {/* ════════════════════
                    PANEL IZQUIERDO — Formulario
                ════════════════════ */}
                <section
                    className={`${styles.panelLeft} ${mobileTab !== "nuevo" ? styles.panelHiddenMobile : ""}`}
                    aria-label="Registrar gasto"
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitleRow}>
                            <Receipt size={20} strokeWidth={1.8} className={styles.panelIcon} />
                            <h1 className={styles.panelTitle}>Registrar gasto</h1>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form} id="form-nuevo-gasto">
                        {formError && (
                            <div className={styles.errorMsg}>
                                <AlertCircle size={14} strokeWidth={2} /> {formError}
                            </div>
                        )}

                        {/* Monto */}
                        <div className={styles.field}>
                            <label htmlFor="gasto-monto" className={styles.label}>
                                <DollarSign size={13} strokeWidth={2} /> Monto (Q) *
                            </label>
                            <div className={styles.inputMoneyWrap}>
                                <span className={styles.inputMoneyPrefix}>Q</span>
                                <input
                                    id="gasto-monto"
                                    name="monto"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className={`${styles.input} ${styles.inputMoney}`}
                                    placeholder="0.00"
                                    value={form.monto}
                                    onChange={handleChange}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Categoría */}
                        <div className={styles.field}>
                            <label htmlFor="gasto-cat" className={styles.label}>
                                <Tag size={13} strokeWidth={2} /> Categoría *
                            </label>
                            {catLoading ? (
                                <div className={styles.loadingRow}>
                                    <Loader2 size={14} className={styles.spin} /> Cargando categorías…
                                </div>
                            ) : categorias.length === 0 ? (
                                <p className={styles.noData}>No hay categorías disponibles.</p>
                            ) : (
                                <select
                                    id="gasto-cat"
                                    name="gastoCategoriaId"
                                    className={styles.select}
                                    value={form.gastoCategoriaId}
                                    onChange={handleChange}
                                >
                                    <option value="">— Selecciona una categoría —</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Descripción */}
                        <div className={styles.field}>
                            <label htmlFor="gasto-desc" className={styles.label}>
                                <LayoutList size={13} strokeWidth={2} /> Descripción (opcional)
                            </label>
                            <textarea
                                id="gasto-desc"
                                name="description"
                                className={styles.textarea}
                                rows={3}
                                placeholder="Ej. Pago de servicios, insumos de limpieza…"
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            id="btn-registrar-gasto"
                            type="submit"
                            className={styles.btnConfirm}
                            disabled={formLoading}
                        >
                            {formLoading
                                ? <><Loader2 size={18} className={styles.spin} /> Guardando…</>
                                : <><CheckCircle size={18} strokeWidth={2} /> Registrar gasto</>
                            }
                        </button>
                    </form>
                </section>

                {/* ════════════════════
                    PANEL DERECHO — Historial hoy
                ════════════════════ */}
                <section
                    className={`${styles.panelRight} ${mobileTab !== "hist" ? styles.panelHiddenMobile : ""}`}
                    aria-label="Gastos de hoy"
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitleRow}>
                            <CalendarDays size={20} strokeWidth={1.8} className={styles.panelIconAlt} />
                            <h2 className={styles.panelTitle}>Gastos de hoy</h2>
                        </div>
                        <button id="btn-refresh-gastos" className={styles.btnRefresh}
                            onClick={loadGastosHoy} disabled={histLoading} title="Actualizar">
                            <RefreshCw size={15} strokeWidth={2} className={histLoading ? styles.spin : ""} />
                        </button>
                    </div>

                    {/* Resumen del día */}
                    {gastosHoy.length > 0 && (
                        <div className={styles.daySummary}>
                            <div className={styles.dayStat}>
                                <span className={styles.dayStatNum}>{gastosHoy.length}</span>
                                <span className={styles.dayStatLabel}>Gastos</span>
                            </div>
                            <div className={styles.dayStatDivider} />
                            <div className={styles.dayStat}>
                                <span className={styles.dayStatNum}>Q {totalHoy.toFixed(2)}</span>
                                <span className={styles.dayStatLabel}>Total del día</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.histScroll}>
                        {histLoading ? (
                            <div className={styles.centerMsg}>
                                <Loader2 size={22} className={styles.spin} />
                                <span>Cargando…</span>
                            </div>
                        ) : histError ? (
                            <div className={styles.centerMsg}>
                                <AlertCircle size={18} className={styles.errColor} />
                                <span className={styles.errColor}>{histError}</span>
                                <button className={styles.btnRetry} onClick={loadGastosHoy}>Reintentar</button>
                            </div>
                        ) : gastosHoy.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Receipt size={36} strokeWidth={1} className={styles.emptyIcon} />
                                <p>Sin gastos hoy aún.</p>
                            </div>
                        ) : (
                            <div className={styles.cardList}>
                                {[...gastosHoy].reverse().map(g => (
                                    <GastoCard key={g.id} gasto={g} />
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

export default Gasto;
