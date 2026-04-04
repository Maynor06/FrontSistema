"use client";

import { useState, useEffect, useCallback } from "react";
import { Store, Plus, Search, Pencil, Trash2, X, MapPin, Phone, Calendar, AlertCircle, Loader2 } from "lucide-react";
import Api from "@/lib/api";
import styles from "./Establecimiento.module.css";

/* ─── Estado inicial del formulario ─── */
const EMPTY_FORM = {
  nombre: "",
  direccion: "",
  telefono: "",
};

/* ─── Componente Card ─── */
function EstablecimientoCard({ est, onEdit, onDelete }) {
  return (
    <article className={styles.card} id={`est-card-${est.id}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}>
          <Store size={22} strokeWidth={1.8} />
        </div>
        <div className={styles.cardActions}>
          <button
            id={`btn-edit-est-${est.id}`}
            className={styles.actionBtn}
            onClick={() => onEdit(est)}
            title="Editar establecimiento"
          >
            <Pencil size={16} strokeWidth={1.8} />
          </button>
          <button
            id={`btn-delete-est-${est.id}`}
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={() => onDelete(est)}
            title="Eliminar establecimiento"
          >
            <Trash2 size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{est.nombre}</h3>
        <p className={styles.cardId}>ID: {est.id}</p>
      </div>

      <div className={styles.cardMeta}>
        <span className={styles.metaItem}>
          <MapPin size={13} strokeWidth={2} /> {est.direccion}
        </span>
        <span className={styles.metaItem}>
          <Phone size={13} strokeWidth={2} /> {est.telefono}
        </span>
        <span className={styles.metaItem}>
          <Calendar size={13} strokeWidth={2} />{" "}
          {est.fechaCreada ? new Date(est.fechaCreada).toLocaleDateString("es-GT") : "—"}
        </span>
      </div>
    </article>
  );
}

/* ─── Componente Modal ─── */
function EstablecimientoModal({ open, onClose, onSaved, initial }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(isEdit ? { nombre: initial.nombre, direccion: initial.direccion, telefono: initial.telefono } : EMPTY_FORM);
      setError("");
    }
  }, [open, initial]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.direccion.trim() || !form.telefono.trim()) {
      setError("Nombre, dirección y teléfono son requeridos.");
      return;
    }
    setLoading(true);
    try {
      let saved;
      if (isEdit) {
        saved = await Api.patch(`/establecimiento/${initial.id}`, form);
      } else {
        saved = await Api.post("/establecimiento", form);
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
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title-est">
        <div className={styles.modalHeader}>
          <h2 id="modal-title-est" className={styles.modalTitle}>
            {isEdit ? "Editar establecimiento" : "Nuevo establecimiento"}
          </h2>
          <button id="btn-close-est-modal" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.formError}>
              <AlertCircle size={15} strokeWidth={2} /> {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="est-nombre" className={styles.label}>Nombre *</label>
            <input
              id="est-nombre"
              name="nombre"
              type="text"
              className={styles.input}
              placeholder="Ej. Plaza Central"
              value={form.nombre}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="est-direccion" className={styles.label}>Dirección *</label>
            <input
              id="est-direccion"
              name="direccion"
              type="text"
              className={styles.input}
              placeholder="Ej. Mercado Comalapa"
              value={form.direccion}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="est-telefono" className={styles.label}>Teléfono *</label>
            <input
              id="est-telefono"
              name="telefono"
              type="text"
              className={styles.input}
              placeholder="Ej. 42023808"
              value={form.telefono}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" id="btn-est-cancel" className={styles.btnSecondary} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" id="btn-est-submit" className={styles.btnPrimary} disabled={loading}>
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
function DeleteConfirmModal({ open, onClose, onConfirm, est, loading }) {
  if (!open || !est) return null;
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title-del">
        <div className={styles.modalHeader}>
          <h2 id="modal-title-del" className={styles.modalTitle}>Eliminar establecimiento</h2>
          <button id="btn-close-del-modal" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <div className={styles.deleteBody}>
          <div className={styles.deleteIcon}><Trash2 size={32} strokeWidth={1.5} /></div>
          <p className={styles.deleteText}>
            ¿Estás seguro de eliminar <strong>{est.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className={styles.formActions}>
          <button id="btn-del-cancel" type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button id="btn-del-confirm" type="button" className={`${styles.btnPrimary} ${styles.btnDanger}`} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={16} className={styles.spin} /> : null}
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
export const Establecimiento = () => {
  const [list, setList] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Modal eliminar
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Búsqueda por ID
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  /* ── Carga inicial de todos los establecimientos ── */
  const loadAll = useCallback(async () => {
    setFetchLoading(true);
    setFetchError("");
    try {
      const data = await Api.get("/establecimiento");
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message || "No se pudo cargar la lista.");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ── Handlers modal ── */
  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (est) => { setEditTarget(est); setModalOpen(true); };

  const handleSaved = (saved, isEdit) => {
    if (isEdit) {
      setList((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      if (searchResult?.id === saved.id) setSearchResult(saved);
    } else {
      setList((prev) => [saved, ...prev]);
    }
  };

  /* ── Handlers eliminar ── */
  const openDelete = (est) => { setDeleteTarget(est); setDeleteOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await Api.delete(`/establecimiento/${deleteTarget.id}`);
      setList((prev) => prev.filter((e) => e.id !== deleteTarget.id));
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
      const data = await Api.get(`/establecimiento/${searchId.trim()}`);
      setSearchResult(data);
    } catch (err) {
      setSearchError(err.status === 404 ? "No se encontró ningún establecimiento con ese ID." : err.message);
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
          <div className={styles.pageTitleIcon}><Store size={24} strokeWidth={1.8} /></div>
          <div>
            <h1 className={styles.h1}>Establecimientos</h1>
            <p className={styles.subtitle}>Gestiona los establecimientos del sistema</p>
          </div>
        </div>
        <button id="btn-new-establecimiento" className={styles.btnPrimary} onClick={openCreate}>
          <Plus size={18} strokeWidth={2} /> Nuevo
        </button>
      </div>

      {/* ── Búsqueda por ID ── */}
      <section className={styles.searchSection}>
        <form onSubmit={handleSearch} className={styles.searchForm} id="form-search-est">
          <div className={styles.searchInputWrap}>
            <Search size={16} className={styles.searchIcon} strokeWidth={2} />
            <input
              id="input-search-est-id"
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por ID de establecimiento…"
              value={searchId}
              onChange={(e) => { setSearchId(e.target.value); setSearchResult(null); setSearchError(""); }}
            />
          </div>
          <button id="btn-search-est" type="submit" className={styles.btnSearch} disabled={searchLoading}>
            {searchLoading ? <Loader2 size={16} className={styles.spin} /> : <Search size={16} strokeWidth={2} />}
          </button>
        </form>

        {searchError && <p className={styles.errorMsg}><AlertCircle size={14} /> {searchError}</p>}
        {searchResult && (
          <div className={styles.searchResultWrap}>
            <p className={styles.searchResultLabel}>Resultado de búsqueda</p>
            <EstablecimientoCard est={searchResult} onEdit={openEdit} onDelete={openDelete} />
          </div>
        )}
      </section>

      {/* ── Lista ── */}
      <section>
        <div className={styles.listHeader}>
          <h2 className={styles.sectionTitle}>Todos los establecimientos</h2>
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
            <Store size={48} strokeWidth={1} className={styles.emptyIcon} />
            <p className={styles.emptyText}>Aún no hay establecimientos registrados.</p>
            <button className={styles.btnPrimary} onClick={openCreate}>
              <Plus size={16} strokeWidth={2} /> Crear el primero
            </button>
          </div>
        )}

        {!fetchLoading && !fetchError && list.length > 0 && (
          <div className={styles.grid}>
            {list.map((est) => (
              <EstablecimientoCard key={est.id} est={est} onEdit={openEdit} onDelete={openDelete} />
            ))}
          </div>
        )}
      </section>

      {/* ── Modales ── */}
      <EstablecimientoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initial={editTarget}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        est={deleteTarget}
        loading={deleteLoading}
      />
    </div>
  );
};
