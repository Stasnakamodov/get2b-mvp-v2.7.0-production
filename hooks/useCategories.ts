'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface Category {
  id: string
  key: string
  name: string
  icon: string
  description: string
  level: number
  parent_id: string | null
  products_count?: number
}

/**
 * Хук для загрузки и кэширования категорий каталога
 *
 * Использует React Query для:
 * - Кэширования данных на 5 минут (staleTime)
 * - Автоматического повторного запроса при ошибках
 * - Дедупликации запросов
 *
 * @example
 * const { categories, loading, error } = useCategories()
 */
export function useCategories() {
  const query = useQuery<Category[]>({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_categories')
        .select('*')
        .eq('is_active', true)
        .eq('level', 1)
        .order('sort_order')

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 минут - категории редко меняются
    gcTime: 30 * 60 * 1000, // 30 минут в кэше
    retry: 2,
    refetchOnWindowFocus: false, // Не перезагружать при фокусе
  })

  return {
    categories: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch
  }
}

export default useCategories
