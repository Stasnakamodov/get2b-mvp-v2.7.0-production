import type { Project, ProjectStatusLabel } from '@/types/landing'
import { FileText } from 'lucide-react'

/**
 * Конвертирует число в римскую цифру (I-VII)
 * TODO: Реализовать в Фазе 3
 */
export function toRoman(num: number): string {
  // TODO: Реализация
  return String(num)
}

/**
 * Получает корректный шаг для карточки проекта
 * TODO: Реализовать в Фазе 3
 */
export function getCorrectStepForCard(project: Project): number {
  // TODO: Реализация
  return 1
}

/**
 * Получает label статуса проекта с цветом и иконкой
 * TODO: Реализовать в Фазе 3
 */
export function getProjectStatusLabel(
  step: number,
  status: string,
  receipts?: string
): ProjectStatusLabel {
  // TODO: Реализация
  return {
    color: '#6b7280',
    text: 'В работе',
    Icon: FileText,
  }
}
