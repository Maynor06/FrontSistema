"use client";

import useSWR from 'swr';
import Api from '@/lib/api';
import { getUsuario } from '@/lib/auth';

const fetcher = (url) => Api.get(url);

/**
 * Hook para obtener y cachear productos con SWR.
 * Ahora utiliza el endpoint de establecimiento.
 */
export function useProducts() {
    let establecimientoId = null;
    if (typeof window !== 'undefined') {
        const usuario = getUsuario();
        establecimientoId = usuario?.establecimientoId || usuario?.establecimiento?.id;
    }

    const endpoint = establecimientoId ? `/products/establecimiento/${establecimientoId}` : null;

    const { data, error, isLoading, mutate } = useSWR(endpoint, fetcher, {
        revalidateOnFocus: false,
        revalidateIfStale: true,
    });

    return {
        products: data || [],
        isLoading: isLoading,
        isError: error,
        mutate
    };
}
