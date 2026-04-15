"use client";

import { useState, useEffect, useCallback } from "react";
import {
    LayoutList, Plus, Search, Pencil, Trash2, X,
    AlertCircle, Loader2, ChevronRight, FolderOpen, Folder,
} from "lucide-react";
import Api from "@/lib/api";
import { useCategories } from "@/hooks/useMaestros";
import styles from "./Categoria.module.css";

/* ─── Estado vacío del formulario ─── */
const EMPTY_FORM = {
    nombre: "",
    descripcion: "",
    slug: "",
    esSubcategoria: false,
    parentId: "",
};

/* ─── Card de categoría ─── */
function CategoriaCard({ cat, onEdit, onDelete }) {
    const esHija = cat.parentId != null;
    return (
        <article className={styles.card} id={`cat-card-${cat.id}`}>
            <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${esHija ? styles.cardIconSub : ""}`}>
                    {esHija
                        ? <FolderOpen size={20} strokeWidth={1.8} />
                        : <Folder size={20} strokeWidth={1.8} />
                    }
                </div>
                <div className={styles.cardInfo}>
                    <div className={styles.cardNameRow}>
                        {esHija && <ChevronRight size={13} strokeWidth={2.5} className={styles.subArrow} />}
                        <h3 className={styles.cardName}>{cat.nombre}</h3>
                        {esHija
                            ? <span className={styles.chipSub}>Subcategoría</span>
                            : <span className={styles.chipParent}>Principal</span>
                        }
                    </div>
                    {cat.descripcion && <p className={styles.cardDesc}>{cat.descripcion}</p>}
                    <div className={styles.cardMeta}>
                        <span className={styles.metaId}>ID: {cat.id}</span>
                        {cat.slug && <span className={styles.metaSlug}>/{cat.slug}</span>}
                        {esHija && <span className={styles.metaParent}>Parent: {cat.parentId}</span>}
                    </div>
                </div>
                <div className={styles.cardActions}>
                    <button
                        id={`btn-edit-cat-${cat.id}`}
                        className={styles.actionBtn}
                        onClick={() => onEdit(cat)}
                        title="Editar categoría"
                    >
                        <Pencil size={15} strokeWidth={1.8} />
                    </button>
                    <button
                        id={`btn-delete-cat-${cat.id}`}
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => onDelete(cat)}
                        title="Eliminar categoría"
                    >
                        <Trash2 size={15} strokeWidth={1.8} />
                    </button>
                </div>
            </div>
        </article>
    );
}

/* ─── Modal crear/editar ─── */
function CategoriaModal({ open, onClose, onSaved, initial }) {
    const isEdit = !!initial?.id;
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Categorías padre (solo se cargan si esSubcategoria)
    const [parents, setParents] = useState([]);
    const [parentsLoading, setParentsLoading] = useState(false);

    /* Pre-llenado al abrir */
    useEffect(() => {
        if (!open) return;
        setError("");
        if (isEdit) {
            setForm({
                nombre: initial.nombre ?? "",
                descripcion: initial.descripcion ?? "",
                slug: initial.slug ?? "",
                esSubcategoria: initial.parentId != null,
                parentId: initial.parentId?.toString() ?? "",
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [open, initial, isEdit]);

    /* Cargar categorías padre cuando se activa "es subcategoría" */
    useEffect(() => {
        if (!form.esSubcategoria) { setParents([]); return; }
        setParentsLoading(true);
        Api.get("/categoria/parents")
            .then((data) => setParents(Array.isArray(data) ? data : []))
            .catch(() => setParents([]))
            .finally(() => setParentsLoading(false));
    }, [form.esSubcategoria]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: type === "checkbox" ? checked : value };
            // Si se desmarca, limpiar parentId
            if (name === "esSubcategoria" && !checked) next.parentId = "";
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
        if (form.esSubcategoria && !form.parentId) { setError("Selecciona una categoría padre."); return; }

        const payload = { nombre: form.nombre.trim() };
        if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();
        if (form.slug.trim()) payload.slug = form.slug.trim();
        // parentId: si es subcategoría se envía number, si no, null
        payload.parentId = form.esSubcategoria ? Number(form.parentId) : null;

        setLoading(true);
        try {
            let saved;
            if (isEdit) {
                saved = await Api.patch(`/categoria/${initial.id}`, payload);
            } else {
                saved = await Api.post("/categoria", payload);
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
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title-cat">
                <div className={styles.modalHeader}>
                    <h2 id="modal-title-cat" className={styles.modalTitle}>
                        {isEdit ? "Editar categoría" : "Nueva categoría"}
                    </h2>
                    <button id="btn-close-cat-modal" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.formError}>
                            <AlertCircle size={15} strokeWidth={2} /> {error}
                        </div>
                    )}

                    {/* Nombre */}
                    <div className={styles.field}>
                        <label htmlFor="cat-nombre" className={styles.label}>Nombre *</label>
                        <input
                            id="cat-nombre" name="nombre" type="text"
                            className={styles.input} placeholder="Ej. Bebidas"
                            value={form.nombre} onChange={handleChange} autoFocus
                        />
                    </div>

                    {/* Descripción */}
                    <div className={styles.field}>
                        <label htmlFor="cat-descripcion" className={styles.label}>Descripción</label>
                        <textarea
                            id="cat-descripcion" name="descripcion"
                            className={styles.textarea} placeholder="Descripción de la categoría…"
                            value={form.descripcion} onChange={handleChange} rows={2}
                        />
                    </div>

                    {/* Slug */}
                    <div className={styles.field}>
                        <label htmlFor="cat-slug" className={styles.label}>Slug (URL amigable)</label>
                        <input
                            id="cat-slug" name="slug" type="text"
                            className={styles.input} placeholder="bebidas"
                            value={form.slug} onChange={handleChange}
                        />
                    </div>

                    {/* ── Checkbox subcategoría ── */}
                    <label className={styles.checkboxLabel} htmlFor="cat-esSubcategoria">
                        <div className={styles.checkboxWrap}>
                            <input
                                id="cat-esSubcategoria"
                                name="esSubcategoria"
                                type="checkbox"
                                className={styles.checkbox}
                                checked={form.esSubcategoria}
                                onChange={handleChange}
                            />
                            <span className={styles.checkboxCustom} />
                        </div>
                        <span className={styles.checkboxText}>
                            Es subcategoría{" "}
                            <span className={styles.checkboxHint}>(tiene una categoría padre)</span>
                        </span>
                    </label>

                    {/* ── Select de padre (visible solo si esSubcategoria) ── */}
                    {form.esSubcategoria && (
                        <div className={styles.field}>
                            <label htmlFor="cat-parentId" className={styles.label}>Categoría padre *</label>
                            {parentsLoading ? (
                                <div className={styles.selectLoading}>
                                    <Loader2 size={16} className={styles.spin} />
                                    <span>Cargando categorías…</span>
                                </div>
                            ) : parents.length === 0 ? (
                                <p className={styles.noParents}>
                                    No hay categorías principales disponibles. Crea una primero.
                                </p>
                            ) : (
                                <select
                                    id="cat-parentId"
                                    name="parentId"
                                    className={styles.select}
                                    value={form.parentId}
                                    onChange={handleChange}
                                >
                                    <option value="">— Selecciona una categoría padre —</option>
                                    {parents.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    <div className={styles.formActions}>
                        <button type="button" id="btn-cat-cancel" className={styles.btnSecondary} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" id="btn-cat-submit" className={styles.btnPrimary} disabled={loading}>
                            {loading ? <Loader2 size={16} className={styles.spin} /> : null}
                            {loading ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Modal de confirmación de eliminación ─── */
function DeleteConfirmModal({ open, onClose, onConfirm, cat, loading }) {
    if (!open || !cat) return null;
    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title-del-cat">
                <div className={styles.modalHeader}>
                    <h2 id="modal-title-del-cat" className={styles.modalTitle}>Eliminar categoría</h2>
                    <button id="btn-close-del-cat-modal" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>
                <div className={styles.deleteBody}>
                    <div className={styles.deleteIcon}><Trash2 size={32} strokeWidth={1.5} /></div>
                    <p className={styles.deleteText}>
                        ¿Estás seguro de eliminar <strong>{cat.nombre}</strong>?{" "}
                        {cat.parentId == null && "Si tiene subcategorías, estas también podrían verse afectadas. "}
                        Esta acción no se puede deshacer.
                    </p>
                </div>
                <div className={styles.formActions}>
                    <button id="btn-del-cat-cancel" type="button" className={styles.btnSecondary} onClick={onClose}>
                        Cancelar
                    </button>
                    <button id="btn-del-cat-confirm" type="button"
                        className={`${styles.btnPrimary} ${styles.btnDanger}`}
                        onClick={onConfirm} disabled={loading}
                    >
                        {loading ? <Loader2 size={16} className={styles.spin} /> : null}
                        {loading ? "Eliminando…" : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Componente principal ─── */
export const Categoria = () => {
    const { categories: list, isLoading: fetchLoading, isError: fetchError, mutate } = useCategories();

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

    /* ── Carga inicial (SWR) ── */
    const loadAll = () => mutate();

    /* ── Handlers modal ── */
    const openCreate = () => { setEditTarget(null); setModalOpen(true); };
    const openEdit = (cat) => { setEditTarget(cat); setModalOpen(true); };

    const handleSaved = () => {
        mutate();
    };

    /* ── Handlers eliminar ── */
    const openDelete = (cat) => { setDeleteTarget(cat); setDeleteOpen(true); };
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await Api.delete(`/categoria/${deleteTarget.id}`);
            mutate();
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
            const data = await Api.get(`/categoria/${searchId.trim()}`);
            setSearchResult(data);
        } catch (err) {
            setSearchError(
                err.status === 404
                    ? "No se encontró ninguna categoría con ese ID."
                    : err.message
            );
        } finally {
            setSearchLoading(false);
        }
    };

    // Separar padres e hijas para mostrarlas agrupadas
    const parents = list.filter((c) => c.parentId == null);
    const children = list.filter((c) => c.parentId != null);

    return (
        <div className={styles.page}>
            {/* ── Encabezado ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>
                    <div className={styles.pageTitleIcon}>
                        <LayoutList size={24} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h1 className={styles.h1}>Categorías</h1>
                        <p className={styles.subtitle}>Organiza el catálogo por categorías</p>
                    </div>
                </div>
                <button id="btn-new-categoria" className={styles.btnPrimary} onClick={openCreate}>
                    <Plus size={18} strokeWidth={2} /> Nueva
                </button>
            </div>

            {/* ── Búsqueda por ID ── */}
            <section className={styles.searchSection}>
                <form onSubmit={handleSearch} className={styles.searchForm} id="form-search-cat">
                    <div className={styles.searchInputWrap}>
                        <Search size={16} className={styles.searchIcon} strokeWidth={2} />
                        <input
                            id="input-search-cat-id"
                            type="text"
                            className={styles.searchInput}
                            placeholder="Buscar categoría por ID…"
                            value={searchId}
                            onChange={(e) => {
                                setSearchId(e.target.value);
                                setSearchResult(null);
                                setSearchError("");
                            }}
                        />
                    </div>
                    <button id="btn-search-cat" type="submit" className={styles.btnSearch} disabled={searchLoading}>
                        {searchLoading
                            ? <Loader2 size={16} className={styles.spin} />
                            : <Search size={16} strokeWidth={2} />
                        }
                    </button>
                </form>

                {searchError && (
                    <p className={styles.errorMsg}><AlertCircle size={14} /> {searchError}</p>
                )}
                {searchResult && (
                    <div className={styles.searchResultWrap}>
                        <p className={styles.searchResultLabel}>Resultado de búsqueda</p>
                        <CategoriaCard cat={searchResult} onEdit={openEdit} onDelete={openDelete} />
                    </div>
                )}
            </section>

            {/* ── Estados de carga / error ── */}
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

            {/* ── Lista (agrupada) ── */}
            {!fetchLoading && !fetchError && list.length === 0 && (
                <div className={styles.emptyState}>
                    <LayoutList size={48} strokeWidth={1} className={styles.emptyIcon} />
                    <p className={styles.emptyText}>Aún no hay categorías registradas.</p>
                    <button className={styles.btnPrimary} onClick={openCreate}>
                        <Plus size={16} strokeWidth={2} /> Crear la primera
                    </button>
                </div>
            )}

            {!fetchLoading && !fetchError && list.length > 0 && (
                <>
                    {/* Categorías principales */}
                    <section className={styles.group}>
                        <div className={styles.groupHeader}>
                            <Folder size={14} strokeWidth={2} />
                            <h2 className={styles.sectionTitle}>Categorías principales</h2>
                            <span className={styles.badge}>{parents.length}</span>
                        </div>
                        {parents.length === 0
                            ? <p className={styles.groupEmpty}>Sin categorías principales.</p>
                            : <div className={styles.grid}>
                                {parents.map((cat) => (
                                    <CategoriaCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={openDelete} />
                                ))}
                            </div>
                        }
                    </section>

                    {/* Subcategorías */}
                    {children.length > 0 && (
                        <section className={styles.group}>
                            <div className={styles.groupHeader}>
                                <FolderOpen size={14} strokeWidth={2} />
                                <h2 className={styles.sectionTitle}>Subcategorías</h2>
                                <span className={`${styles.badge} ${styles.badgeSub}`}>{children.length}</span>
                            </div>
                            <div className={styles.grid}>
                                {children.map((cat) => (
                                    <CategoriaCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={openDelete} />
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* ── Modales ── */}
            <CategoriaModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
                initial={editTarget}
            />
            <DeleteConfirmModal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                cat={deleteTarget}
                loading={deleteLoading}
            />
        </div>
    );
};
