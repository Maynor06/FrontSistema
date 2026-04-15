"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Loader2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import Api from "@/lib/api";
import { useGastoCategories } from "@/hooks/useMaestros";
import styles from "./GastoCategoria.module.css";

function CategoriaCard({ cat }) {
    return (
        <article className={styles.card}>
            <div className={styles.cardIcon}>
                <Tag size={16} strokeWidth={2} />
            </div>
            <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{cat.nombre}</h3>
                <p className={styles.cardDesc}>{cat.descripcion || "Sin descripción"}</p>
            </div>
        </article>
    );
}

export const GastoCategoria = () => {
    const { gastoCategories: categorias, isLoading: loading, isError: error, mutate } = useGastoCategories();

    const [form, setForm] = useState({ nombre: "", descripcion: "" });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");

    const loadCategorias = () => mutate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        if (!form.nombre.trim()) { setFormError("El nombre es requerido."); return; }

        setFormLoading(true);
        try {
            await Api.post("/gasto-categoria", {
                nombre: form.nombre.trim(),
                descripcion: form.descripcion.trim(),
            });
            setForm({ nombre: "", descripcion: "" });
            loadCategorias();
        } catch (err) {
            setFormError(err.message || "Error al crear la categoría");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <div className={styles.titleIcon}><Layers size={22} strokeWidth={1.8} /></div>
                    <div>
                        <h1 className={styles.title}>Categorías de Gasto</h1>
                        <p className={styles.subtitle}>Gestiona las clasificaciones para tus gastos</p>
                    </div>
                </div>
                <button onClick={loadCategorias} className={styles.btnRefresh} disabled={loading} title="Actualizar">
                    <RefreshCw size={16} className={loading ? styles.spin : ""} />
                </button>
            </div>

            <div className={styles.layout}>
                {/* LISTA */}
                <div className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Categorías registradas ({categorias.length})</h2>
                    {loading ? (
                        <div className={styles.center}><Loader2 className={styles.spin} /></div>
                    ) : error ? (
                        <div className={styles.centerError}><AlertCircle /> {error}</div>
                    ) : categorias.length === 0 ? (
                        <div className={styles.empty}>No hay categorías de gasto registradas.</div>
                    ) : (
                        <div className={styles.grid}>
                            {categorias.map(c => <CategoriaCard key={c.id} cat={c} />)}
                        </div>
                    )}
                </div>

                {/* FORMULARIO */}
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Nueva Categoría</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {formError && <div className={styles.errorMsg}><AlertCircle size={14} /> {formError}</div>}
                        
                        <div className={styles.field}>
                            <label>Nombre *</label>
                            <input 
                                type="text" 
                                className={styles.input} 
                                value={form.nombre} 
                                onChange={e => setForm({ ...form, nombre: e.target.value })} 
                                placeholder="Ej. Servicios, Papelería..." 
                            />
                        </div>
                        
                        <div className={styles.field}>
                            <label>Descripción</label>
                            <textarea 
                                className={styles.input} 
                                rows={3}
                                value={form.descripcion} 
                                onChange={e => setForm({ ...form, descripcion: e.target.value })} 
                                placeholder="Detalles de la categoría..." 
                            />
                        </div>

                        <button type="submit" className={styles.btnSubmit} disabled={formLoading}>
                            {formLoading ? <Loader2 size={16} className={styles.spin} /> : <Plus size={16} />}
                            Crear Categoría
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GastoCategoria;
