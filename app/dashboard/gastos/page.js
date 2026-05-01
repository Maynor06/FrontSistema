"use client";

import { useState } from "react";
import { Gasto } from "../../../components/gasto/Gasto";
import { GastoCategoria } from "../../../components/gasto-categoria/GastoCategoria";

export default function GastosPage() {
    const [activeTab, setActiveTab] = useState("gastos");

    return (
        <div className="flex flex-col h-full">
            <div className="flex bg-white border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("gastos")}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "gastos"
                            ? "border-red-500 text-red-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Gastos
                </button>
                <button
                    onClick={() => setActiveTab("categorias")}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === "categorias"
                            ? "border-red-500 text-red-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Categorías de Gasto
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                {activeTab === "gastos" ? <Gasto /> : <GastoCategoria />}
            </div>
        </div>
    );
}
