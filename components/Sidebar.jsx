"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Store, Package, ShoppingCart, LogOut, ShoppingBag, LayoutList, Users, Boxes, Receipt, Truck, Layers, BarChart3 } from "lucide-react";
import { clearSession, getUsuario } from "@/lib/auth";
import navItems from "@/data/navigation.json";
import styles from "./Sidebar.module.css";

/** Mapa de nombres de ícono → componente lucide-react */
const ICONS = {
  Store,
  Package,
  ShoppingCart,
  ShoppingBag,
  LayoutList,
  Users,
  Boxes,
  Receipt,
  Truck,
  Layers,
  BarChart3,
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setUsuario(getUsuario());
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo → link al dashboard */}
      <div className={styles.logo}>
        <Link href="/dashboard" id="nav-home" className={styles.logoIcon} title="Ir al inicio">
          <ShoppingBag size={22} strokeWidth={1.8} />
        </Link>
      </div>

      {/* Nav items */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] ?? Package;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              id={`nav-${item.id}`}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              title={item.label}
            >
              <Icon size={22} strokeWidth={1.8} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: avatar con popover + logout */}
      <div className={styles.footer}>
        {usuario && (
          <div className={styles.avatarWrap}>
            <div className={styles.avatar} id="sidebar-user-avatar">
              {usuario.nombre?.[0]?.toUpperCase() ?? "U"}
            </div>
            {/* Popover info usuario */}
            <div className={styles.userPopover}>
              <p className={styles.popoverName}>{usuario.nombre}</p>
              <p className={styles.popoverUser}>@{usuario.nombreUsuario}</p>
              {usuario.rol?.nombre && (
                <span className={styles.popoverRole}>{usuario.rol.nombre}</span>
              )}
              <button
                id="btn-logout-popover"
                className={styles.popoverLogout}
                onClick={handleLogout}
              >
                <LogOut size={14} strokeWidth={2} /> Cerrar sesión
              </button>
            </div>
          </div>
        )}
        <button
          id="btn-logout"
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          <LogOut size={20} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
