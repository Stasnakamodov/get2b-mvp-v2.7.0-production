import { useMemo } from 'react'
import type { Project, ProjectStats } from '@/types/landing'

/**
 * Хук для вычисления статистики проектов
 * TODO: Реализовать в Фазе 4
 */
export function useProjectStats(projects: Project[]): ProjectStats {
  const activeProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  const pendingProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  const completedProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  const rejectedProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  return {
    activeProjects,
    pendingProjects,
    completedProjects,
    rejectedProjects,
  }
}
