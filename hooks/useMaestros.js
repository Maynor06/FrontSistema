"use client";

import useSWR from 'swr';
import Api from '@/lib/api';

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
