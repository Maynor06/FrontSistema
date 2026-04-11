import { Inventario } from "../../../components/inventario/Inventario";

export const metadata = {
    title: "Inventario | Sistema E-Commerce",
    description: "Consulta las existencias actuales de productos en el inventario",
};

export default function InventarioPage() {
    return <Inventario />;
}
