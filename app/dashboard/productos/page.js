"use client";

import { useState } from "react";
import Producto from "../../../components/Producto/Producto";
import { Categoria } from "../../../components/Categoria/Categoria";

export default function ProductosPage() {
    const [activeTab, setActiveTab] = useState("productos");

    return (
        <div className="flex flex-col h-full">
            <div className="flex bg-white border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("productos")}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                        activeTab === "productos" 
                        ? "border-violet-500 text-violet-600" 
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Productos
                </button>
                <button
                    onClick={() => setActiveTab("categorias")}
                    className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
                        activeTab === "categorias" 
                        ? "border-violet-500 text-violet-600" 
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    Categorías
                </button>
            </div>
            <div className="flex-1 overflow-auto">
                {activeTab === "productos" ? <Producto /> : <Categoria />}
            </div>
        </div>
    );
}