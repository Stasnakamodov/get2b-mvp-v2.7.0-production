import { useState, useEffect } from 'react'
import type { UseProjectsReturn } from '@/types/landing'

/**
 * Хук для загрузки проектов пользователя из Supabase
 * TODO: Реализовать в Фазе 4
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // TODO: Реализовать загрузку из Supabase
    setLoading(false)
  }, [])

  return { projects, loading, error }
}
