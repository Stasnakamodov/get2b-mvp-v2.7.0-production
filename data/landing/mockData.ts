import type { Project, Template } from '@/types/landing'

/**
 * Mock проекты для preview dashboard
 * Показываются когда у пользователя нет реальных проектов
 */
export const mockProjects: Project[] = [
  {
    id: 'mock-1',
    name: 'Закупка электроники',
    company_data: { name: 'ООО "ТехноПром"' },
    amount: 2400000,
    currency: '₽',
    created_at: '2025-01-15T10:00:00Z',
    status: 'in_work',
    current_step: 3,
    user_id: 'mock',
  },
  {
    id: 'mock-2',
    name: 'Партия смартфонов',
    company_data: { name: 'ИП Смирнов А.В.' },
    amount: 156000,
    currency: '¥',
    created_at: '2025-01-18T14:30:00Z',
    status: 'waiting_approval',
    current_step: 2,
    user_id: 'mock',
  },
  {
    id: 'mock-3',
    name: 'Оптовая закупка мебели',
    company_data: { name: 'ООО "Интерьер Плюс"' },
    amount: 890000,
    currency: '₽',
    created_at: '2025-01-10T09:15:00Z',
    status: 'completed',
    current_step: 7,
    user_id: 'mock',
  },
]

/**
 * Template карточки для выбора роли
 */
export const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: 'Закупка электроники',
    description: 'Стандартный шаблон для закупки электронных компонентов из Китая',
    role: 'client',
  },
  {
    id: 'template-2',
    name: 'Оптовая мебель',
    description: 'Шаблон для массовых закупок мебели и интерьерных решений',
    role: 'client',
  },
]
