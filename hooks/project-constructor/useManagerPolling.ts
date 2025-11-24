import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { cleanProjectRequestId } from '@/utils/IdUtils'
import { POLLING_INTERVALS } from '@/components/project-constructor/config/PollingConstants'

/**
 * Hook for polling manager approval status for atomic constructor
 *
 * @param projectRequestId - The project request ID to poll for
 * @param currentStage - Current stage of the project (only polls on stage 2)
 * @param managerApprovalStatus - Current manager approval status
 * @param setManagerApprovalStatus - Setter for manager approval status
 */
export const useManagerPolling = (
  projectRequestId: string,
  currentStage: number,
  managerApprovalStatus: 'pending' | 'approved' | 'rejected' | null,
  setManagerApprovalStatus: (status: 'pending' | 'approved' | 'rejected' | null) => void
) => {
  useEffect(() => {
    if (!projectRequestId || currentStage !== 2) return

    const checkManagerStatus = async () => {
      try {
        const cleanRequestId = cleanProjectRequestId(projectRequestId)

        const { data: projects, error } = await supabase
          .from('projects')
          .select('atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanRequestId}%`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ Ошибка проверки статуса модерации:', error)
          return
        }

        if (projects && projects.length > 0 && projects[0].atomic_moderation_status) {
          const status = projects[0].atomic_moderation_status
          setManagerApprovalStatus(status)

          // Если одобрено, показываем платёжку (шаг 3)
          if (status === 'approved') {
            // НЕ переходим к этапу 3, остаемся на этапе 2 для показа платёжки
          }
        } else {
        }
      } catch (error) {
        console.error('❌ Ошибка polling статуса модерации:', error)
      }
    }

    // Проверяем статус каждые 4 секунды
    const interval = setInterval(checkManagerStatus, POLLING_INTERVALS.MANAGER_STATUS_CHECK)

    // Первая проверка сразу
    checkManagerStatus()

    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, setManagerApprovalStatus])
}
