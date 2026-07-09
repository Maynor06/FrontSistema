"use client";

import { useState, useEffect } from "react";
import { 
  User, Lock, Mail, Building2, Shield, Eye, EyeOff, 
  Loader2, CheckCircle2, AlertCircle, KeyRound 
} from "lucide-react";
import Api from "@/lib/api";
import { getUsuario, isAuthenticated } from "@/lib/auth";
import { useRouter } from "next/navigation";
import styles from "./Perfil.module.css";

export default function Perfil() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form states
  const [form, setForm] = useState({
    passwordActual: "",
    passwordNueva: "",
    confirmarPassword: "",
  });

  // Password visibility states
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
      return;
    }
    setUsuario(getUsuario());
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { passwordActual, passwordNueva, confirmarPassword } = form;

    // Validation
    if (!passwordActual.trim() || !passwordNueva.trim() || !confirmarPassword.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    if (passwordNueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await Api.patch("/auth/cambiar-password", {
        passwordActual,
        passwordNueva,
      });

      setSuccess(response?.message || "Contraseña actualizada con éxito.");
      setForm({
        passwordActual: "",
        passwordNueva: "",
        confirmarPassword: "",
      });
    } catch (err) {
      setError(err.message || "Error al cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) {
    return (
      <div className={styles.container} style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <Loader2 size={32} className={styles.spinner} style={{ color: "#6366f1" }} />
      </div>
    );
  }

  const initials = usuario.nombre
    ? usuario.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  // Real-time checks for new password requirements
  const hasMinLength = form.passwordNueva.length >= 6;
  const passwordsMatch = form.passwordNueva && form.passwordNueva === form.confirmarPassword;

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <User size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 className={styles.title}>Mi Perfil</h1>
          <p className={styles.subtitle}>Gestiona tus datos personales y seguridad</p>
        </div>
      </header>

      {/* Grid Layout */}
      <div className={styles.grid}>
        {/* Sidebar Info Card */}
        <section className={`${styles.card} styles.profileCard`}>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.statusDotPulse} />
              <div className={styles.statusDot} />
            </div>

            <h2 className={styles.name}>{usuario.nombre}</h2>
            <p className={styles.username}>@{usuario.nombreUsuario}</p>

            <div className={styles.divider} />

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Correo electrónico</span>
                <span className={styles.infoValue}>
                  <Mail size={14} strokeWidth={2} style={{ color: "#94a3b8" }} />
                  {usuario.correo}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Rol asignado</span>
                {usuario.rol?.nombre && (
                  <span className={`${styles.badge} ${styles.badgePurple}`}>
                    <Shield size={12} strokeWidth={2.5} />
                    {usuario.rol.nombre}
                  </span>
                )}
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Establecimiento</span>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>
                  <Building2 size={12} strokeWidth={2.5} />
                  {usuario.establecimiento?.nombre || "No asignado"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Change Password Card */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <KeyRound size={18} strokeWidth={2} style={{ color: "#6366f1" }} />
            Seguridad · Cambiar Contraseña
          </h2>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {error && (
              <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                <AlertCircle size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className={`${styles.alert} ${styles.alertSuccess}`} role="alert">
                <CheckCircle2 size={18} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            {/* Contraseña Actual */}
            <div className={styles.field}>
              <label htmlFor="passwordActual" className={styles.label}>
                Contraseña actual
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="passwordActual"
                  name="passwordActual"
                  type={showActual ? "text" : "password"}
                  placeholder="Introduce tu contraseña actual"
                  value={form.passwordActual}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowActual(!showActual)}
                  aria-label={showActual ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                  tabIndex={-1}
                >
                  {showActual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Nueva Contraseña */}
            <div className={styles.field}>
              <label htmlFor="passwordNueva" className={styles.label}>
                Nueva contraseña
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="passwordNueva"
                  name="passwordNueva"
                  type={showNueva ? "text" : "password"}
                  placeholder="Introduce la nueva contraseña (mínimo 6 caracteres)"
                  value={form.passwordNueva}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNueva(!showNueva)}
                  aria-label={showNueva ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  tabIndex={-1}
                >
                  {showNueva ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmar Nueva Contraseña */}
            <div className={styles.field}>
              <label htmlFor="confirmarPassword" className={styles.label}>
                Confirmar nueva contraseña
              </label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  id="confirmarPassword"
                  name="confirmarPassword"
                  type={showConfirmar ? "text" : "password"}
                  placeholder="Repite la nueva contraseña"
                  value={form.confirmarPassword}
                  onChange={handleChange}
                  className={styles.input}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirmar(!showConfirmar)}
                  aria-label={showConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Requirements Box */}
            <div className={styles.passwordRequirements}>
              <p className={styles.requirementTitle}>Seguridad de la contraseña</p>
              <ul className={styles.requirementList}>
                <li className={`${styles.requirementItem} ${hasMinLength ? styles.requirementMet : ""}`}>
                  <CheckCircle2 size={12} strokeWidth={2.5} style={{ color: hasMinLength ? "#10b981" : "#cbd5e1" }} />
                  Mínimo de 6 caracteres
                </li>
                <li className={`${styles.requirementItem} ${passwordsMatch ? styles.requirementMet : ""}`}>
                  <CheckCircle2 size={12} strokeWidth={2.5} style={{ color: passwordsMatch ? "#10b981" : "#cbd5e1" }} />
                  Las contraseñas coinciden
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !hasMinLength || !passwordsMatch}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Guardando cambios...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
