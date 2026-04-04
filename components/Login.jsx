"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShoppingBag, Lock, User } from "lucide-react";
import { Api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import styles from "./Login.module.css";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreUsuario: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombreUsuario.trim() || !form.password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await Api.Post("/auth/login", form);
      saveSession(data.access_token, data.usuario);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Fondo decorativo */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        {/* Logo / Branding */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <ShoppingBag size={28} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className={styles.brandTitle}>Sistema E-Commerce</h1>
            <p className={styles.brandSub}>Panel de administración</p>
          </div>
        </div>

        <h2 className={styles.heading}>Iniciar sesión</h2>
        <p className={styles.subheading}>Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Usuario */}
          <div className={styles.field}>
            <label htmlFor="nombreUsuario" className={styles.label}>
              Usuario
            </label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="nombreUsuario"
                name="nombreUsuario"
                type="text"
                autoComplete="username"
                placeholder="Nombre de usuario"
                value={form.nombreUsuario}
                onChange={handleChange}
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          {/* Botón */}
          <button
            id="btn-login"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
