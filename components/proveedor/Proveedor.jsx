"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Loader2, AlertCircle, RefreshCw, Mail, Phone, MapPin, Hash } from "lucide-react";
import Api from "@/lib/api";
import styles from "./Proveedor.module.css";

function ProveedorCard({ prov }) {
    return (
        <article className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.cardIcon}><Truck size={18} strokeWidth={2} /></div>
                <h3 className={styles.cardName}>{prov.nombre}</h3>
            </div>
            <div className={styles.cardBody}>
                {prov.telefono && <p className={styles.row}><Phone size={14} /> {prov.telefono}</p>}
                {prov.correo && <p className={styles.row}><Mail size={14} /> {prov.correo}</p>}
                {prov.direccion && <p className={styles.row}><MapPin size={14} /> {prov.direccion}</p>}
                {prov.nit && <p className={styles.row}><Hash size={14} /> NIT: {prov.nit}</p>}
            </div>
        </article>
    );
}

export const Proveedor = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", direccion: "", nit: "" });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const loadProveedores = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await Api.get("/proveedor");
            setProveedores(Array.isArray(res) ? res : []);
        } catch (err) {
            setError(err.message || "Error al cargar proveedores");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProveedores(); }, [loadProveedores]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        if (!form.nombre.trim()) { setFormError("El nombre es requerido."); return; }

        setFormLoading(true);
        try {
            await Api.post("/proveedor", {
                nombre: form.nombre.trim(),
                telefono: form.telefono.trim() || undefined,
                correo: form.correo.trim() || undefined,
                direccion: form.direccion.trim() || undefined,
                nit: form.nit.trim() || undefined,
            });
            setForm({ nombre: "", telefono: "", correo: "", direccion: "", nit: "" });
            loadProveedores();
        } catch (err) {
            setFormError(err.message || "Error al crear el proveedor");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <div className={styles.titleIcon}><Truck size={22} strokeWidth={1.8} /></div>
                    <div>
                        <h1 className={styles.title}>Proveedores</h1>
                        <p className={styles.subtitle}>Gestión de proveedores e información de contacto</p>
                    </div>
                </div>
                <button onClick={loadProveedores} className={styles.btnRefresh} disabled={loading} title="Actualizar">
                    <RefreshCw size={16} className={loading ? styles.spin : ""} />
                </button>
            </div>

            <div className={styles.layout}>
                {/* LISTA */}
                <div className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Proveedores registrados ({proveedores.length})</h2>
                    {loading ? (
                        <div className={styles.center}><Loader2 className={styles.spin} /></div>
                    ) : error ? (
                        <div className={styles.centerError}><AlertCircle /> {error}</div>
                    ) : proveedores.length === 0 ? (
                        <div className={styles.empty}>No hay proveedores registrados.</div>
                    ) : (
                        <div className={styles.grid}>
                            {proveedores.map(p => <ProveedorCard key={p.id} prov={p} />)}
                        </div>
                    )}
                </div>

                {/* FORMULARIO */}
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Nuevo Proveedor</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {formError && <div className={styles.errorMsg}><AlertCircle size={14} /> {formError}</div>}
                        
                        <div className={styles.field}>
                            <label>Nombre *</label>
                            <input 
                                type="text" className={styles.input} required
                                value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} 
                                placeholder="Nombre de la empresa o contacto" 
                            />
                        </div>
                        
                        <div className={styles.gridForm}>
                            <div className={styles.field}>
                                <label>Teléfono</label>
                                <input 
                                    type="text" className={styles.input} 
                                    value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} 
                                />
                            </div>
                            <div className={styles.field}>
                                <label>NIT</label>
                                <input 
                                    type="text" className={styles.input} 
                                    value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} 
                                />
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>Correo Electrónico</label>
                            <input 
                                type="email" className={styles.input} 
                                value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} 
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Dirección</label>
                            <textarea 
                                className={styles.input} rows={2}
                                value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} 
                            />
                        </div>

                        <button type="submit" className={styles.btnSubmit} disabled={formLoading}>
                            {formLoading ? <Loader2 size={16} className={styles.spin} /> : <Plus size={16} />}
                            Crear Proveedor
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Proveedor;
