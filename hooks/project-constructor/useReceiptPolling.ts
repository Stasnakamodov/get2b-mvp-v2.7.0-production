import { useEffect } from 'react'
import { db } from '@/lib/db/client'
import { cleanProjectRequestId } from '@/utils/IdUtils'
import { POLLING_INTERVALS } from '@/components/project-constructor/config/PollingConstants'

/**
 * Hook for polling receipt approval status
 *
 * @param projectRequestId - The project request ID to poll for
 * @param currentStage - Current stage of the project (only polls on stage 2)
 * @param managerApprovalStatus - Current manager approval status
 * @param receiptApprovalStatus - Current receipt approval status
 * @param setManagerApprovalStatus - Setter for manager approval status
 * @param setReceiptApprovalStatus - Setter for receipt approval status
 * @param setCurrentStage - Setter for current stage (to transition to stage 3)
 */
export const useReceiptPolling = (
  projectRequestId: string,
  currentStage: number,
  managerApprovalStatus: 'pending' | 'approved' | 'rejected' | null,
  receiptApprovalStatus: 'pending' | 'approved' | 'rejected' | 'waiting' | null,
  setManagerApprovalStatus: (status: 'pending' | 'approved' | 'rejected' | null) => void,
  setReceiptApprovalStatus: (status: 'pending' | 'approved' | 'rejected' | 'waiting' | null) => void,
  setCurrentStage: (stage: number) => void
) => {
  useEffect(() => {
    if (!projectRequestId || currentStage !== 2) return

    const checkReceiptStatus = async () => {
      try {
        console.log('🔍 Проверяем статус чека для projectRequestId:', projectRequestId)
        const cleanRequestId = cleanProjectRequestId(projectRequestId)
        console.log('🧹 Очищенный requestId для поиска чека:', cleanRequestId)

        const { data: projects, error } = await db
          .from('projects')
          .select('status, atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanRequestId}%`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ Ошибка проверки статуса чека:', error)
          return
        }

        console.log('📊 [DEBUG] Найденные проекты для чека:', projects)

        if (projects && projects.length > 0) {
          const project = projects[0]
          console.log('📊 [DEBUG] Проект найден:', {
            status: project.status,
            atomic_moderation_status: project.atomic_moderation_status
          })

          // Обновляем статус менеджера если он не установлен
          if (project.atomic_moderation_status && managerApprovalStatus !== project.atomic_moderation_status) {
            console.log('📊 Обновляем статус менеджера:', project.atomic_moderation_status)
            setManagerApprovalStatus(project.atomic_moderation_status)
          }

          if (project.status) {
            const status = project.status
            console.log('📊 Статус чека обновлен:', status)

            if (status === 'receipt_approved' && receiptApprovalStatus !== 'approved') {
              console.log('✅ Чек одобрен - переходим к этапу 3 (анимация сделки)')
              setReceiptApprovalStatus('approved')
              setCurrentStage(3) // Переходим к этапу 3: анимация сделки
            } else if (status === 'receipt_rejected' && receiptApprovalStatus !== 'rejected') {
              console.log('❌ Чек отклонен')
              setReceiptApprovalStatus('rejected')
            } else if (status === 'waiting_receipt' && receiptApprovalStatus !== 'waiting') {
              console.log('⏳ Чек загружен, ждет одобрения')
              setReceiptApprovalStatus('waiting')
            }
          } else {
            console.log('📊 Статус чека пустой')
          }
        } else {
          console.log('📊 Записи не найдены')
        }
      } catch (error) {
        console.error('❌ Ошибка polling статуса чека:', error)
      }
    }

    // Проверяем статус каждые 4 секунды
    const interval = setInterval(checkReceiptStatus, POLLING_INTERVALS.RECEIPT_STATUS_CHECK)

    // Первая проверка сразу
    checkReceiptStatus()

    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, managerApprovalStatus, receiptApprovalStatus, setManagerApprovalStatus, setReceiptApprovalStatus, setCurrentStage])
}
