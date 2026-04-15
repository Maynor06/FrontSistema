"use client";

import { useState } from "react";
import { Compra } from "../../../components/compra/Compra";
import { Proveedor } from "../../../components/proveedor/Proveedor";

export default function ComprasPage() {
    const [activeTab, setActiveTab] = useState("compras");

    return (
        <div className="flex flex-col h-full">
            <div className="flex bg-white border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("compras")}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                        activeTab === "compras" 
                        ? "border-indigo-500 text-indigo-600" 
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Compras
                </button>
                <button
                    onClick={() => setActiveTab("proveedores")}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                        activeTab === "proveedores" 
                        ? "border-indigo-500 text-indigo-600" 
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Proveedores
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                {activeTab === "compras" ? <Compra /> : <Proveedor />}
            </div>
        </div>
    );
}
