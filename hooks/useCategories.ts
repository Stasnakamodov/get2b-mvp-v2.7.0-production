import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export interface Category {
  id: string
  key: string
  name: string
  icon: string
  description: string
  level: number
  parent_id: string | null
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('catalog_categories')
        .select('*')
        .eq('is_active', true)
        .eq('level', 1)
        .order('sort_order')

      if (error) throw error

      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  return { categories, loading, error, refetch: fetchCategories }
}