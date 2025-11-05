import type { Project, ProjectStatusLabel } from '@/types/landing'
import { FileText, CheckCircle, DollarSign } from 'lucide-react'

/**
 * Конвертирует число в римскую цифру (I-VII)
 */
export function toRoman(num: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
  return romans[num - 1] || String(num)
}

/**
 * Получает корректный шаг для карточки проекта
 */
export function getCorrectStepForCard(project: Project): number {
  if (project.current_step) return project.current_step
  return 1
}

/**
 * Получает label статуса проекта с цветом и иконкой
 */
export function getProjectStatusLabel(
  step: number,
  status: string,
  receipts?: string
): ProjectStatusLabel {
  let color = '#6b7280'
  let text = 'В работе'
  let Icon = FileText

  if ((status === 'completed' || step === 7) && status !== 'waiting_client_confirmation') {
    color = '#22c55e'
    text = 'Завершён'
    Icon = CheckCircle
  } else if (status === 'waiting_client_confirmation' && step === 7) {
    color = '#3b82f6'
    text = 'Ожидание подтверждающего документа'
    Icon = CheckCircle
  } else if (step === 3) {
    if (status === 'waiting_receipt') {
      color = '#3b82f6'
      text = 'Ожидаем загрузки чека'
      Icon = DollarSign
    } else if (status === 'receipt_rejected') {
      color = '#ef4444'
      text = 'Чек отклонён'
      Icon = FileText
    } else if (status === 'receipt_approved') {
      color = '#22c55e'
      text = 'Чек одобрен'
      Icon = CheckCircle
    }
  } else if (status === 'waiting_approval') {
    color = '#3b82f6'
    text = 'Ожидание одобрения'
    Icon = CheckCircle
  } else if (status === 'rejected') {
    color = '#ef4444'
    text = 'Отклонён'
    Icon = FileText
  }

  return { color, text, Icon }
}
