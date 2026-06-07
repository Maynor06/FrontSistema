"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUsuario, isAuthenticated } from "@/lib/auth";
import { Store, Package, ShoppingCart, TrendingUp } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

const QUICK_ACCESS = [
  {
    id: "productos",
    label: "Productos",
    description: "Administra el catálogo de productos",
    icon: Package,
    href: "/dashboard/productos",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
  },
  {
    id: "ventas",
    label: "Ventas",
    description: "Registra y consulta las ventas",
    icon: ShoppingCart,
    href: "/dashboard/ventas",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  const usuario = getUsuario();

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Hola, {usuario?.nombre ?? "Usuario"} 👋
          </h1>
          <p className={styles.subGreeting}>
            {usuario?.establecimiento?.nombre ?? "Sistema E-Commerce"} ·{" "}
            {usuario?.rol?.nombre}
          </p>
        </div>
        <div className={styles.headerBadge}>
          <TrendingUp size={16} />
          Online
        </div>
      </div>

      {/* Quick access cards */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Acceso rápido</h2>
        <div className={styles.grid}>
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                id={`card-${item.id}`}
                href={item.href}
                className={styles.card}
              >
                <div
                  className={styles.cardIcon}
                  style={{ background: item.bg, color: item.color }}
                >
                  <Icon size={26} strokeWidth={1.8} />
                </div>
                <div>
                  <p className={styles.cardLabel}>{item.label}</p>
                  <p className={styles.cardDesc}>{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
