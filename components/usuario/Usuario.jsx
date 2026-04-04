"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, Plus, Search, Pencil, Trash2, X,
    AlertCircle, Loader2, ShieldCheck, Key,
    Mail, User, Building2, Lock, ChevronDown,
} from "lucide-react";
import Api from "@/lib/api";
import styles from "./Usuario.module.css";

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */

/* ─── Campo genérico ─── */
function Field({ label, htmlFor, children }) {
    return (
        <div className={styles.field}>
            <label htmlFor={htmlFor} className={styles.label}>{label}</label>
            {children}
        </div>
    );
}

/* ─── Mensaje de error inline ─── */
function FormError({ msg }) {
    if (!msg) return null;
    return (
        <div className={styles.formError}>
            <AlertCircle size={14} strokeWidth={2} /> {msg}
        </div>
    );
}

/* ══════════════════════════════════════════════
   PERMISOS — Card
══════════════════════════════════════════════ */
function PermisoCard({ permiso, onEdit, onDelete }) {
    return (
        <article className={styles.card} id={`permiso-card-${permiso.id}`}>
            <div className={styles.cardIconWrap} style={{ background: "rgba(139,92,246,.12)", color: "#7c3aed" }}>
                <Key size={18} strokeWidth={1.8} />
            </div>
            <div className={styles.cardBody}>
                <p className={styles.cardName}>{permiso.nombre}</p>
                {permiso.descripcion && <p className={styles.cardHint}>{permiso.descripcion}</p>}
            </div>
            <div className={styles.cardActions}>
                <button id={`btn-edit-permiso-${permiso.id}`} className={styles.actionBtn}
                    onClick={() => onEdit(permiso)} title="Editar">
                    <Pencil size={14} strokeWidth={1.8} />
                </button>
                <button id={`btn-delete-permiso-${permiso.id}`}
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={() => onDelete(permiso)} title="Eliminar">
                    <Trash2 size={14} strokeWidth={1.8} />
                </button>
            </div>
        </article>
    );
}

/* ══════════════════════════════════════════════
   PERMISOS — Modal crear/editar
══════════════════════════════════════════════ */
function PermisoModal({ open, onClose, onSaved, initial }) {
    const isEdit = !!initial?.id;
    const [form, setForm] = useState({ nombre: "", descripciN: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setError("");
        setForm(isEdit ? { nombre: initial.nombre ?? "", descripciN: initial.descripcion ?? "" } : { nombre: "", descripciN: "" });
    }, [open, initial, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
        setLoading(true);
        try {
            const payload = { nombre: form.nombre.trim() };
            if (form.descripciN.trim()) payload.descripciN = form.descripciN.trim();
            const saved = isEdit
                ? await Api.patch(`/permiso/${initial.id}`, payload)
                : await Api.post("/permiso", payload);
            onSaved(saved, isEdit);
            onClose();
        } catch (err) {
            setError(err.message || "Error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{isEdit ? "Editar permiso" : "Nuevo permiso"}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} strokeWidth={2} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <FormError msg={error} />
                    <Field label="Nombre *" htmlFor="perm-nombre">
                        <input id="perm-nombre" name="nombre" type="text" className={styles.input}
                            placeholder="Ej. crear:producto" value={form.nombre} autoFocus
                            onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))} />
                    </Field>
                    <Field label="Descripción" htmlFor="perm-desc">
                        <textarea id="perm-desc" name="descripcion" rows={2} className={styles.textarea}
                            placeholder="Descripción del permiso…" value={form.descripcion}
                            onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))} />
                    </Field>
                    <div className={styles.formActions}>
                        <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                        <button type="submit" className={styles.btnPurple} disabled={loading}>
                            {loading && <Loader2 size={15} className={styles.spin} />}
                            {loading ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   ROLES — Card
══════════════════════════════════════════════ */
function RolCard({ rol, onEdit, onDelete }) {
    return (
        <article className={styles.card} id={`rol-card-${rol.id}`}>
            <div className={styles.cardIconWrap} style={{ background: "rgba(99,102,241,.12)", color: "#6366f1" }}>
                <ShieldCheck size={18} strokeWidth={1.8} />
            </div>
            <div className={styles.cardBody}>
                <p className={styles.cardName}>{rol.nombre}</p>
                {rol.descripcion && <p className={styles.cardHint}>{rol.descripcion}</p>}
                {Array.isArray(rol.permisos) && rol.permisos.length > 0 && (
                    <div className={styles.permChips}>
                        {rol.permisos.slice(0, 4).map((p) => (
                            <span key={p.id ?? p} className={styles.permChip}>{p.nombre ?? p}</span>
                        ))}
                        {rol.permisos.length > 4 && (
                            <span className={styles.permChipMore}>+{rol.permisos.length - 4}</span>
                        )}
                    </div>
                )}
            </div>
            <div className={styles.cardActions}>
                <button id={`btn-edit-rol-${rol.id}`} className={styles.actionBtn}
                    onClick={() => onEdit(rol)} title="Editar">
                    <Pencil size={14} strokeWidth={1.8} />
                </button>
                <button id={`btn-delete-rol-${rol.id}`}
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={() => onDelete(rol)} title="Eliminar">
                    <Trash2 size={14} strokeWidth={1.8} />
                </button>
            </div>
        </article>
    );
}

/* ══════════════════════════════════════════════
   ROLES — Modal crear/editar
══════════════════════════════════════════════ */
function RolModal({ open, onClose, onSaved, initial }) {
    const isEdit = !!initial?.id;
    const [form, setForm] = useState({ nombre: "", descripcion: "" });
    const [selectedPermisos, setSelectedPermisos] = useState([]);
    const [permisos, setPermisos] = useState([]);
    const [permsLoading, setPermsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setError("");
        setForm(isEdit
            ? { nombre: initial.nombre ?? "", descripcion: initial.descripcion ?? "" }
            : { nombre: "", descripcion: "" }
        );
        // IDs ya asignados al rol (si existen)
        const existingIds = isEdit && Array.isArray(initial.permisos)
            ? initial.permisos.map((p) => String(p.id ?? p))
            : [];
        setSelectedPermisos(existingIds);

        // Cargar lista de permisos
        setPermsLoading(true);
        Api.get("/permiso")
            .then((data) => setPermisos(Array.isArray(data) ? data : []))
            .catch(() => setPermisos([]))
            .finally(() => setPermsLoading(false));
    }, [open, initial, isEdit]);

    const togglePerm = (id) => {
        const sid = String(id);
        setSelectedPermisos((prev) =>
            prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }

        setLoading(true);
        try {
            // 1. Crear/actualizar el rol
            const payload = { nombre: form.nombre.trim() };
            if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim();

            let saved;
            if (isEdit) {
                saved = await Api.patch(`/rol/${initial.id}`, payload);
            } else {
                saved = await Api.post("/rol", payload);
            }

            // 2. Asignar permisos al rol (rol-permiso)
            for (const permisoId of selectedPermisos) {
                await Api.post("/rol-permiso", { rolId: String(saved.id), permisoId });
            }

            onSaved(saved, isEdit);
            onClose();
        } catch (err) {
            setError(err.message || "Error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{isEdit ? "Editar rol" : "Nuevo rol"}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} strokeWidth={2} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <FormError msg={error} />

                    <Field label="Nombre del rol *" htmlFor="rol-nombre">
                        <input id="rol-nombre" name="nombre" type="text" className={styles.input}
                            placeholder="Ej. Administrador" value={form.nombre} autoFocus
                            onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))} />
                    </Field>

                    <Field label="Descripción" htmlFor="rol-desc">
                        <textarea id="rol-desc" name="descripcion" rows={2} className={styles.textarea}
                            placeholder="Descripción del rol…" value={form.descripcion}
                            onChange={(e) => setForm(p => ({ ...p, descripcion: e.target.value }))} />
                    </Field>

                    {/* ── Selector de permisos ── */}
                    <div className={styles.field}>
                        <label className={styles.label}>
                            Permisos del rol
                            {selectedPermisos.length > 0 && (
                                <span className={styles.countBadge}>{selectedPermisos.length} seleccionados</span>
                            )}
                        </label>

                        {permsLoading ? (
                            <div className={styles.loadingRow}>
                                <Loader2 size={16} className={styles.spin} />
                                <span>Cargando permisos…</span>
                            </div>
                        ) : permisos.length === 0 ? (
                            <p className={styles.emptyHint}>No hay permisos creados aún.</p>
                        ) : (
                            <div className={styles.permisoGrid} id="rol-permisos-grid">
                                {permisos.map((p) => {
                                    const checked = selectedPermisos.includes(String(p.id));
                                    return (
                                        <label
                                            key={p.id}
                                            className={`${styles.permisoChk} ${checked ? styles.permisoChkActive : ""}`}
                                            htmlFor={`perm-chk-${p.id}`}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`perm-chk-${p.id}`}
                                                checked={checked}
                                                onChange={() => togglePerm(p.id)}
                                                className={styles.hiddenCheck}
                                            />
                                            <Key size={12} strokeWidth={2} />
                                            {p.nombre}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                        <button type="submit" id="btn-rol-submit" className={styles.btnIndigo} disabled={loading}>
                            {loading && <Loader2 size={15} className={styles.spin} />}
                            {loading ? "Guardando…" : isEdit ? "Actualizar" : "Crear rol"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   USUARIOS — Card
══════════════════════════════════════════════ */
function UsuarioCard({ usuario, onEdit, onDelete }) {
    const initials = usuario.nombre
        ? usuario.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
        : "U";
    return (
        <article className={styles.card} id={`user-card-${usuario.id}`}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.cardBody}>
                <p className={styles.cardName}>{usuario.nombre}</p>
                <p className={styles.cardHint}>
                    <Mail size={11} strokeWidth={2} /> {usuario.correo}
                </p>
                <div className={styles.userMeta}>
                    {usuario.nombreUsuario && (
                        <span className={styles.chipGray}>@{usuario.nombreUsuario}</span>
                    )}
                    {usuario.rol?.nombre && (
                        <span className={styles.chipRole}>{usuario.rol.nombre}</span>
                    )}
                </div>
            </div>
            <div className={styles.cardActions}>
                <button id={`btn-edit-user-${usuario.id}`} className={styles.actionBtn}
                    onClick={() => onEdit(usuario)} title="Editar">
                    <Pencil size={14} strokeWidth={1.8} />
                </button>
                <button id={`btn-delete-user-${usuario.id}`}
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={() => onDelete(usuario)} title="Eliminar">
                    <Trash2 size={14} strokeWidth={1.8} />
                </button>
            </div>
        </article>
    );
}

/* ══════════════════════════════════════════════
   USUARIOS — Modal crear/editar
══════════════════════════════════════════════ */
function UsuarioModal({ open, onClose, onSaved, initial }) {
    const isEdit = !!initial?.id;
    const EMPTY = { nombre: "", correo: "", password: "", nombreUsuario: "", establecimientoId: "", rolId: "" };
    const [form, setForm] = useState(EMPTY);
    const [roles, setRoles] = useState([]);
    const [establecimientos, setEstablecimientos] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [estLoading, setEstLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (!open) return;
        setError("");
        setForm(isEdit ? {
            nombre: initial.nombre ?? "",
            correo: initial.correo ?? "",
            password: "",
            nombreUsuario: initial.nombreUsuario ?? "",
            establecimientoId: initial.establecimientoId ?? initial.establecimiento?.id ?? "",
            rolId: initial.rolId ?? initial.rol?.id ?? "",
        } : EMPTY);

        // Cargar roles
        setRolesLoading(true);
        Api.get("/rol").then(d => setRoles(Array.isArray(d) ? d : [])).catch(() => setRoles([])).finally(() => setRolesLoading(false));

        // Cargar establecimientos
        setEstLoading(true);
        Api.get("/establecimiento").then(d => setEstablecimientos(Array.isArray(d) ? d : [])).catch(() => setEstablecimientos([])).finally(() => setEstLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initial, isEdit]);

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
        if (!form.correo.trim()) { setError("El correo es requerido."); return; }
        if (!isEdit && !form.password.trim()) { setError("La contraseña es requerida."); return; }
        if (!form.establecimientoId) { setError("El establecimiento es requerido."); return; }
        if (!form.rolId) { setError("El rol es requerido."); return; }

        const payload = {
            nombre: form.nombre.trim(),
            correo: form.correo.trim(),
            establecimientoId: form.establecimientoId,
            rolId: form.rolId,
        };
        if (form.nombreUsuario.trim()) payload.nombreUsuario = form.nombreUsuario.trim();
        if (form.password.trim()) payload.password = form.password.trim();

        setLoading(true);
        try {
            const saved = isEdit
                ? await Api.patch(`/usuario/${initial.id}`, payload)
                : await Api.post("/usuario", payload);
            onSaved(saved, isEdit);
            onClose();
        } catch (err) {
            setError(err.message || "Error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;
    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{isEdit ? "Editar usuario" : "Nuevo usuario"}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} strokeWidth={2} /></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <FormError msg={error} />

                    <div className={styles.row2}>
                        <Field label="Nombre completo *" htmlFor="user-nombre">
                            <div className={styles.inputIcon}>
                                <User size={14} className={styles.inputIco} strokeWidth={2} />
                                <input id="user-nombre" name="nombre" type="text" className={`${styles.input} ${styles.inputPad}`}
                                    placeholder="Juan García" value={form.nombre} onChange={handleChange} autoFocus />
                            </div>
                        </Field>
                        <Field label="Nombre de usuario" htmlFor="user-nombreUsuario">
                            <input id="user-nombreUsuario" name="nombreUsuario" type="text" className={styles.input}
                                placeholder="juan_g" value={form.nombreUsuario} onChange={handleChange} />
                        </Field>
                    </div>

                    <Field label="Correo electrónico *" htmlFor="user-correo">
                        <div className={styles.inputIcon}>
                            <Mail size={14} className={styles.inputIco} strokeWidth={2} />
                            <input id="user-correo" name="correo" type="email" className={`${styles.input} ${styles.inputPad}`}
                                placeholder="juan@ejemplo.com" value={form.correo} onChange={handleChange} />
                        </div>
                    </Field>

                    <Field label={isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"} htmlFor="user-password">
                        <div className={styles.inputIcon}>
                            <Lock size={14} className={styles.inputIco} strokeWidth={2} />
                            <input id="user-password" name="password"
                                type={showPass ? "text" : "password"}
                                className={`${styles.input} ${styles.inputPad} ${styles.inputPadRight}`}
                                placeholder="••••••••" value={form.password} onChange={handleChange} />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                                {showPass ? "Ocultar" : "Ver"}
                            </button>
                        </div>
                    </Field>

                    <Field label="Establecimiento *" htmlFor="user-est">
                        {estLoading
                            ? <div className={styles.loadingRow}><Loader2 size={14} className={styles.spin} /><span>Cargando…</span></div>
                            : <select id="user-est" name="establecimientoId" className={styles.select}
                                value={form.establecimientoId} onChange={handleChange}>
                                <option value="">— Selecciona un establecimiento —</option>
                                {establecimientos.map(e => (
                                    <option key={e.id} value={e.id}>{e.nombre}</option>
                                ))}
                            </select>
                        }
                    </Field>

                    <Field label="Rol *" htmlFor="user-rol">
                        {rolesLoading
                            ? <div className={styles.loadingRow}><Loader2 size={14} className={styles.spin} /><span>Cargando…</span></div>
                            : <select id="user-rol" name="rolId" className={styles.select}
                                value={form.rolId} onChange={handleChange}>
                                <option value="">— Selecciona un rol —</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                ))}
                            </select>
                        }
                    </Field>

                    <div className={styles.formActions}>
                        <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                        <button type="submit" id="btn-user-submit" className={styles.btnGreen} disabled={loading}>
                            {loading && <Loader2 size={15} className={styles.spin} />}
                            {loading ? "Guardando…" : isEdit ? "Actualizar" : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   MODAL ELIMINAR (genérico)
══════════════════════════════════════════════ */
function DeleteModal({ open, onClose, onConfirm, nombre, loading }) {
    if (!open) return null;
    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Confirmar eliminación</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} strokeWidth={2} /></button>
                </div>
                <div className={styles.deleteBody}>
                    <div className={styles.deleteIcon}><Trash2 size={28} strokeWidth={1.5} /></div>
                    <p className={styles.deleteText}>
                        ¿Eliminar <strong>{nombre}</strong>? Esta acción no se puede deshacer.
                    </p>
                </div>
                <div className={styles.formActions}>
                    <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
                    <button id="btn-del-confirm" type="button"
                        className={`${styles.btnPrimary} ${styles.btnDanger}`}
                        onClick={onConfirm} disabled={loading}>
                        {loading && <Loader2 size={15} className={styles.spin} />}
                        {loading ? "Eliminando…" : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   SECCIÓN GENÉRICA (lista + búsqueda)
══════════════════════════════════════════════ */
function SectionList({ items, loading, error, onRetry, renderCard, emptyText, emptyIcon: EmptyIcon }) {
    if (loading) return (
        <div className={styles.centerMsg}>
            <Loader2 size={26} className={styles.spin} />
            <span>Cargando…</span>
        </div>
    );
    if (error) return (
        <div className={styles.centerMsg}>
            <AlertCircle size={20} className={styles.errorColor} />
            <span className={styles.errorColor}>{error}</span>
            <button className={styles.btnRetry} onClick={onRetry}>Reintentar</button>
        </div>
    );
    if (items.length === 0) return (
        <div className={styles.emptyState}>
            <EmptyIcon size={40} strokeWidth={1} className={styles.emptyIcon} />
            <p className={styles.emptyText}>{emptyText}</p>
        </div>
    );
    return <div className={styles.list}>{items.map(renderCard)}</div>;
}

/* ══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════ */
const TABS = [
    { id: "usuarios", label: "Usuarios", icon: Users },
    { id: "roles", label: "Roles", icon: ShieldCheck },
    { id: "permisos", label: "Permisos", icon: Key },
];

const Usuario = () => {
    const [activeTab, setActiveTab] = useState("usuarios");

    /* ─── Estado por sección ─── */
    const [usuarios, setUsuarios] = useState([]);
    const [usuariosLoading, setUsuariosLoading] = useState(true);
    const [usuariosError, setUsuariosError] = useState("");

    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesError, setRolesError] = useState("");

    const [permisos, setPermisos] = useState([]);
    const [permisosLoading, setPermisosLoading] = useState(true);
    const [permisosError, setPermisosError] = useState("");

    /* ─── Modales ─── */
    const [userModal, setUserModal] = useState({ open: false, data: null });
    const [rolModal, setRolModal] = useState({ open: false, data: null });
    const [permisoModal, setPermisoModal] = useState({ open: false, data: null });

    const [deleteModal, setDeleteModal] = useState({ open: false, nombre: "", onConfirm: null, loading: false });

    /* ─── Búsqueda por ID ─── */
    const [searchId, setSearchId] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    /* ── Loaders ── */
    const loadUsuarios = useCallback(async () => {
        setUsuariosLoading(true); setUsuariosError("");
        try { const d = await Api.get("/usuario"); setUsuarios(Array.isArray(d) ? d : []); }
        catch (e) { setUsuariosError(e.message || "Error al cargar usuarios."); }
        finally { setUsuariosLoading(false); }
    }, []);

    const loadRoles = useCallback(async () => {
        setRolesLoading(true); setRolesError("");
        try { const d = await Api.get("/rol"); setRoles(Array.isArray(d) ? d : []); }
        catch (e) { setRolesError(e.message || "Error al cargar roles."); }
        finally { setRolesLoading(false); }
    }, []);

    const loadPermisos = useCallback(async () => {
        setPermisosLoading(true); setPermisosError("");
        try { const d = await Api.get("/permiso"); setPermisos(Array.isArray(d) ? d : []); }
        catch (e) { setPermisosError(e.message || "Error al cargar permisos."); }
        finally { setPermisosLoading(false); }
    }, []);

    useEffect(() => { loadUsuarios(); loadRoles(); loadPermisos(); }, [loadUsuarios, loadRoles, loadPermisos]);

    /* ── Reset búsqueda al cambiar de tab ── */
    useEffect(() => { setSearchId(""); setSearchResult(null); setSearchError(""); }, [activeTab]);

    /* ── Búsqueda por ID ── */
    const endpointByTab = { usuarios: "/usuario", roles: "/rol", permisos: "/permiso" };
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId.trim()) return;
        setSearchLoading(true); setSearchError(""); setSearchResult(null);
        try {
            const data = await Api.get(`${endpointByTab[activeTab]}/${searchId.trim()}`);
            setSearchResult(data);
        } catch (err) {
            setSearchError(err.status === 404 ? "No encontrado con ese ID." : err.message);
        } finally { setSearchLoading(false); }
    };

    /* ── Handlers guardado ── */
    const handleUserSaved = (saved, isEdit) => {
        setUsuarios(prev => isEdit ? prev.map(u => u.id === saved.id ? saved : u) : [saved, ...prev]);
    };
    const handleRolSaved = (saved, isEdit) => {
        setRoles(prev => isEdit ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev]);
    };
    const handlePermisoSaved = (saved, isEdit) => {
        setPermisos(prev => isEdit ? prev.map(p => p.id === saved.id ? saved : p) : [saved, ...prev]);
    };

    /* ── Handlers eliminar ── */
    const confirmDelete = (nombre, onConfirm) => {
        setDeleteModal({ open: true, nombre, onConfirm, loading: false });
    };
    const closeDelete = () => setDeleteModal({ open: false, nombre: "", onConfirm: null, loading: false });

    const makeDeleteHandler = (endpoint, id, setter) => () => {
        confirmDelete("", async () => {
            setDeleteModal(p => ({ ...p, loading: true }));
            try {
                await Api.delete(`${endpoint}/${id}`);
                setter(prev => prev.filter(x => x.id !== id));
                closeDelete();
            } catch (err) {
                alert(err.message || "No se pudo eliminar.");
                closeDelete();
            }
        });
    };

    /* ─── Labels del tab activo ─── */
    const tabLabels = {
        usuarios: { title: "Usuarios", sub: "Administra las cuentas de usuario", btnLabel: "Nuevo usuario", placeholder: "Buscar usuario por ID…" },
        roles: { title: "Roles", sub: "Define los roles del sistema", btnLabel: "Nuevo rol", placeholder: "Buscar rol por ID…" },
        permisos: { title: "Permisos", sub: "Configura los permisos disponibles", btnLabel: "Nuevo permiso", placeholder: "Buscar permiso por ID…" },
    };
    const curr = tabLabels[activeTab];

    const handleNewBtn = () => {
        if (activeTab === "usuarios") setUserModal({ open: true, data: null });
        if (activeTab === "roles") setRolModal({ open: true, data: null });
        if (activeTab === "permisos") setPermisoModal({ open: true, data: null });
    };

    /* ─── Render cards por tab ─── */
    const renderUserCard = (u) => (
        <UsuarioCard key={u.id} usuario={u}
            onEdit={(x) => setUserModal({ open: true, data: x })}
            onDelete={(x) => {
                confirmDelete(x.nombre, async () => {
                    setDeleteModal(p => ({ ...p, loading: true }));
                    try { await Api.delete(`/usuario/${x.id}`); setUsuarios(prev => prev.filter(v => v.id !== x.id)); closeDelete(); }
                    catch (err) { alert(err.message); closeDelete(); }
                });
            }}
        />
    );
    const renderRolCard = (r) => (
        <RolCard key={r.id} rol={r}
            onEdit={(x) => setRolModal({ open: true, data: x })}
            onDelete={(x) => {
                confirmDelete(x.nombre, async () => {
                    setDeleteModal(p => ({ ...p, loading: true }));
                    try { await Api.delete(`/rol/${x.id}`); setRoles(prev => prev.filter(v => v.id !== x.id)); closeDelete(); }
                    catch (err) { alert(err.message); closeDelete(); }
                });
            }}
        />
    );
    const renderPermisoCard = (p) => (
        <PermisoCard key={p.id} permiso={p}
            onEdit={(x) => setPermisoModal({ open: true, data: x })}
            onDelete={(x) => {
                confirmDelete(x.nombre, async () => {
                    setDeleteModal(p2 => ({ ...p2, loading: true }));
                    try { await Api.delete(`/permiso/${x.id}`); setPermisos(prev => prev.filter(v => v.id !== x.id)); closeDelete(); }
                    catch (err) { alert(err.message); closeDelete(); }
                });
            }}
        />
    );

    return (
        <div className={styles.page}>
            {/* ── Header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>
                    <div className={styles.pageTitleIcon}><Users size={24} strokeWidth={1.8} /></div>
                    <div>
                        <h1 className={styles.h1}>{curr.title}</h1>
                        <p className={styles.subtitle}>{curr.sub}</p>
                    </div>
                </div>
                <button id={`btn-new-${activeTab}`} className={styles.btnPrimary} onClick={handleNewBtn}>
                    <Plus size={17} strokeWidth={2} /> {curr.btnLabel}
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className={styles.tabs} role="tablist">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        role="tab"
                        id={`tab-${id}`}
                        aria-selected={activeTab === id}
                        className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab(id)}
                    >
                        <Icon size={15} strokeWidth={2} />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Búsqueda por ID ── */}
            <section className={styles.searchSection}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <div className={styles.searchInputWrap}>
                        <Search size={15} className={styles.searchIcon} strokeWidth={2} />
                        <input
                            id={`input-search-${activeTab}-id`}
                            type="text"
                            className={styles.searchInput}
                            placeholder={curr.placeholder}
                            value={searchId}
                            onChange={(e) => { setSearchId(e.target.value); setSearchResult(null); setSearchError(""); }}
                        />
                    </div>
                    <button id={`btn-search-${activeTab}`} type="submit" className={styles.btnSearch} disabled={searchLoading}>
                        {searchLoading ? <Loader2 size={15} className={styles.spin} /> : <Search size={15} strokeWidth={2} />}
                    </button>
                </form>
                {searchError && <p className={styles.errorMsg}><AlertCircle size={13} /> {searchError}</p>}
                {searchResult && (
                    <div className={styles.searchResultWrap}>
                        <p className={styles.searchResultLabel}>Resultado</p>
                        {activeTab === "usuarios" && renderUserCard(searchResult)}
                        {activeTab === "roles" && renderRolCard(searchResult)}
                        {activeTab === "permisos" && renderPermisoCard(searchResult)}
                    </div>
                )}
            </section>

            {/* ── Contenido por tab ── */}
            <div className={styles.tabContent}>
                {activeTab === "usuarios" && (
                    <>
                        <div className={styles.listHeader}>
                            <h2 className={styles.sectionTitle}>Todos los usuarios</h2>
                            <span className={styles.badge}>{usuarios.length}</span>
                        </div>
                        <SectionList items={usuarios} loading={usuariosLoading} error={usuariosError}
                            onRetry={loadUsuarios} renderCard={renderUserCard}
                            emptyText="No hay usuarios registrados aún." emptyIcon={Users} />
                    </>
                )}
                {activeTab === "roles" && (
                    <>
                        <div className={styles.listHeader}>
                            <h2 className={styles.sectionTitle}>Todos los roles</h2>
                            <span className={`${styles.badge} ${styles.badgeIndigo}`}>{roles.length}</span>
                        </div>
                        <SectionList items={roles} loading={rolesLoading} error={rolesError}
                            onRetry={loadRoles} renderCard={renderRolCard}
                            emptyText="No hay roles creados aún." emptyIcon={ShieldCheck} />
                    </>
                )}
                {activeTab === "permisos" && (
                    <>
                        <div className={styles.listHeader}>
                            <h2 className={styles.sectionTitle}>Todos los permisos</h2>
                            <span className={`${styles.badge} ${styles.badgePurple}`}>{permisos.length}</span>
                        </div>
                        <SectionList items={permisos} loading={permisosLoading} error={permisosError}
                            onRetry={loadPermisos} renderCard={renderPermisoCard}
                            emptyText="No hay permisos creados aún." emptyIcon={Key} />
                    </>
                )}
            </div>

            {/* ── Modales ── */}
            <UsuarioModal open={userModal.open} initial={userModal.data}
                onClose={() => setUserModal({ open: false, data: null })} onSaved={handleUserSaved} />
            <RolModal open={rolModal.open} initial={rolModal.data}
                onClose={() => setRolModal({ open: false, data: null })} onSaved={handleRolSaved} />
            <PermisoModal open={permisoModal.open} initial={permisoModal.data}
                onClose={() => setPermisoModal({ open: false, data: null })} onSaved={handlePermisoSaved} />
            <DeleteModal open={deleteModal.open} nombre={deleteModal.nombre}
                onClose={closeDelete} onConfirm={deleteModal.onConfirm} loading={deleteModal.loading} />
        </div>
    );
};

export default Usuario;