import { useState, useEffect } from 'react'
import type { UseProjectsReturn, Project } from '@/types/landing'
import { supabase } from '@/lib/supabaseClient'

/**
 * Хук для загрузки проектов пользователя из Supabase
 * Используется в landing page для отображения dashboard preview
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (fetchError) {
          throw new Error(fetchError.message)
        }

        if (data) {
          setProjects(data)
        }
      } catch (err) {
        console.error("Ошибка загрузки проектов для лендинга:", err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return {
    projects,
    displayProjects: projects, // Same as projects for now
    loading,
    error
  }
}
