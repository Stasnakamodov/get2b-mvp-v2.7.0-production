import { useMemo } from 'react'
import type { Project, ProjectStats } from '@/types/landing'

/**
 * Хук для вычисления статистики проектов
 * Используется в landing page для отображения метрик в dashboard preview
 */
export function useProjectStats(projects: Project[]): ProjectStats {
  const activeProjects = useMemo(() =>
    projects.filter((p) => p.status !== "completed" && p.status !== "rejected").length
  , [projects])

  const pendingProjects = useMemo(() =>
    projects.filter((p) => ["waiting_approval", "waiting_receipt"].includes(p.status)).length
  , [projects])

  const completedProjects = useMemo(() =>
    projects.filter((p) => p.status === "completed").length
  , [projects])

  const rejectedProjects = useMemo(() =>
    projects.filter((p) => ["rejected", "receipt_rejected"].includes(p.status)).length
  , [projects])

  return {
    activeProjects,
    pendingProjects,
    completedProjects,
    rejectedProjects,
  }
}
