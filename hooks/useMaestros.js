"use client";

import useSWR from 'swr';
import Api from '@/lib/api';
import { getUsuario } from '@/lib/auth';

const fetcher = (url) => Api.get(url);

/**
 * Hook para obtener categorías de productos.
 */
export function useCategories() {
    const { data, error, isLoading, mutate } = useSWR('/categoria', fetcher);
    return {
        categories: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

/**
 * Hook para obtener categorías de gastos.
 */
export function useGastoCategories() {
    const { data, error, isLoading, mutate } = useSWR('/gasto-categoria', fetcher);
    return {
        gastoCategories: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

/**
 * Hook para obtener proveedores.
 */
export function useProveedores() {
    const { data, error, isLoading, mutate } = useSWR('/proveedor', fetcher);
    return {
        proveedores: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

/**
 * Hook para obtener productos maestros.
 */
export function useProductsMaestro() {
    let establecimientoId = null;
    if (typeof window !== 'undefined') {
        const usuario = getUsuario();
        establecimientoId = usuario?.establecimientoId || usuario?.establecimiento?.id;
    }
    const endpoint = establecimientoId ? `/products/maestro` : null;
    const { data, error, isLoading, mutate } = useSWR(endpoint, fetcher);
    return {
        maestros: data || [],
        isLoading,
        isError: error,
        mutate
    };
}
