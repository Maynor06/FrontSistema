"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, Loader2, AlertCircle, Plus, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import Api from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import styles from "./Inventario.module.css";

export function Movimientos() {
  const [productoId, setProductoId] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  const [productoIdAjuste, setProductoIdAjuste] = useState("");
  const [establecimientoId, setEstablecimientoId] = useState("");
  const [afectacion, setAfectacion] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loadingAjuste, setLoadingAjuste] = useState(false);
  const [ajusteExito, setAjusteExito] = useState("");
  const [errorAjuste, setErrorAjuste] = useState("");

  useEffect(() => {
    const usr = getUsuario();
    if (usr?.establecimientoId) {
      setEstablecimientoId(String(usr.establecimientoId));
    } else if (usr?.establecimiento?.id) {
      setEstablecimientoId(String(usr.establecimiento.id));
    } else if (usr?.establecimientos?.[0]?.id) {
      setEstablecimientoId(String(usr.establecimientos[0].id));
    }
  }, []);

  const buscarMovimientos = useCallback(async () => {
    if (!productoId.trim()) {
      setErrorBusqueda("Debes ingresar el ID del producto.");
      return;
    }
    setLoadingMovimientos(true);
    setErrorBusqueda("");
    try {
      const data = await Api.get(`/movimiento-producto/producto/${productoId}`);
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorBusqueda(err.message || "No se encontraron movimientos para el producto.");
      setMovimientos([]);
    } finally {
      setLoadingMovimientos(false);
    }
  }, [productoId]);

  const handleCrearAjuste = async (e) => {
    e.preventDefault();
    setAjusteExito("");
    setErrorAjuste("");
    
    if (!productoIdAjuste.trim() || !establecimientoId.trim() || !afectacion) {
      setErrorAjuste("Producto ID, Establecimiento ID y Afectación son obligatorios.");
      return;
    }

    const usuario = getUsuario();
    if (!usuario?.id) {
       setErrorAjuste("No se encontró usuario activo para realizar el movimiento.");
       return;
    }

    setLoadingAjuste(true);
    try {
      const payload = {
        productoId: productoIdAjuste,
        establecimientoId,
        usuarioMovimientoId: String(usuario.id),
        afectacion: Number(afectacion),
      };
      if (precio) payload.precio = Number(precio);
      if (descripcion) payload.descripcion = descripcion;

      const res = await Api.post("/movimiento-producto/ajuste", payload);
      setAjusteExito("Movimiento registrado con éxito.");
      setAfectacion("");
      setPrecio("");
      setDescripcion("");
      
      // Recargar la lista si corresponde
      if (productoId) {
         buscarMovimientos();
      }
    } catch (err) {
      setErrorAjuste(err.message || "No se pudo registrar el movimiento.");
    } finally {
      setLoadingAjuste(false);
    }
  };

  return (
    <div className={styles.movimientosContainer}>
      <div className={styles.movimientosGrid}>
        
        {/* Lado izquierdo: Buscador de movimientos */}
        <div className={styles.panelPrincipal}>
          <h2 className={styles.panelTitle}>
            <Search size={18} /> Consultar Movimientos
          </h2>
          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="ID del Producto..."
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className={styles.inputForm}
            />
            <button
              className={styles.btnPrimary}
              onClick={buscarMovimientos}
              disabled={loadingMovimientos}
            >
              {loadingMovimientos ? <Loader2 size={16} className={styles.spin} /> : "Buscar"}
            </button>
          </div>

          {errorBusqueda && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} /> {errorBusqueda}
            </div>
          )}

          <div className={styles.movimientosList}>
            {movimientos.length === 0 && !loadingMovimientos && !errorBusqueda && (
              <p className={styles.emptyTextWrapper}>Busca un producto para ver sus movimientos.</p>
            )}
            
            {movimientos.map((mov) => (
              <div key={mov.id} className={styles.movCard}>
                <div className={styles.movHeader}>
                  <span className={styles.movType}>
                    {mov.tipoMovimiento?.nombre ?? mov.tipoMovimiento ?? 'Desconocido'}
                  </span>
                  <span className={styles.movDate}>
                    {new Date(mov.fecha || mov.fechaMovimiento).toLocaleString()}
                  </span>
                </div>
                <div className={styles.movBody}>
                  <span>
                    Establecimiento: {mov.inventario?.establemcimiento?.nombre ?? mov.inventario?.establecimiento?.nombre ?? mov.establecimientoId ?? 'N/A'}
                  </span>
                  <span className={Number(mov.cantidad || mov.afectacion) > 0 ? styles.movPositivo : styles.movNegativo}>
                    Cant: {mov.cantidad || mov.afectacion}
                  </span>
                </div>
                {mov.descripcion && (
                  <div className={styles.movFooter}>
                    Desc: {mov.descripcion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lado derecho: Formulario de Ajuste */}
        <div className={styles.panelLateral}>
          <h2 className={styles.panelTitle}>
            <ArrowRightLeft size={18} /> Crear Ajuste
          </h2>
          <form onSubmit={handleCrearAjuste} className={styles.ajusteForm}>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>ID Producto *</label>
                <input
                  type="text"
                  placeholder="ID del producto..."
                  value={productoIdAjuste}
                  onChange={(e) => setProductoIdAjuste(e.target.value)}
                  className={styles.inputForm}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>ID Establecimiento *</label>
                <input
                  type="text"
                  placeholder="Ej. 1"
                  value={establecimientoId}
                  onChange={(e) => setEstablecimientoId(e.target.value)}
                  className={styles.inputForm}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Afectación *</label>
                <input
                  type="number"
                  placeholder="-1, 5..."
                  value={afectacion}
                  onChange={(e) => setAfectacion(e.target.value)}
                  className={styles.inputForm}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Precio (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className={styles.inputForm}
                />
              </div>
            </div>

             <div className={styles.formGroup}>
              <label>Descripción</label>
              <textarea
                placeholder="Razón del ajuste..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className={styles.inputForm}
                rows={3}
              />
            </div>

            {errorAjuste && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} /> {errorAjuste}
              </div>
            )}
            
            {ajusteExito && (
              <div className={styles.successAlert}>
                <CheckCircle2 size={16} /> {ajusteExito}
              </div>
            )}

            <button
              type="submit"
              className={styles.btnPrimaryFull}
              disabled={loadingAjuste}
            >
              {loadingAjuste ? <Loader2 size={16} className={styles.spin} /> : <><Plus size={16}/> Registrar Ajuste</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
