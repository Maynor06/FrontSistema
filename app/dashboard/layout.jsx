import Sidebar from "@/components/Sidebar";
import styles from "./dashboard.module.css";

export const metadata = {
  title: "Dashboard | Sistema E-Commerce",
  description: "Panel principal del sistema e-commerce",
};

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
