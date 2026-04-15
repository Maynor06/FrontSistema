"use client";

import useSWR from 'swr';
import Api from '@/lib/api';

const fetcher = (url) => Api.get(url);

/**
 * Hook para obtener y cachear productos con SWR.
 * SWR permite que diferentes componentes compartan la misma data sin re-peticiones.
 */
export function useProducts() {
    const { data, error, isLoading, mutate } = useSWR('/products', fetcher, {
        revalidateOnFocus: false, // Evita re-validar cada vez que el usuario cambia de pestaña/ventana
        revalidateIfStale: true,  // Muestra datos cacheados mientras valida
    });

    return {
        products: data || [],
        isLoading,
        isError: error,
        mutate
    };
}
