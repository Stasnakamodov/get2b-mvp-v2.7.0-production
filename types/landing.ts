import type { LucideIcon } from 'lucide-react'

// ==================== PROJECT TYPES ====================

export interface Project {
  id: string
  name: string
  company_data?: {
    name: string
    legalName?: string
    inn?: string
    kpp?: string
    ogrn?: string
    email?: string
  }
  amount: number
  currency?: string
  created_at: string
  status: string
  current_step: number
  max_step_reached?: number
  receipts?: string
  user_id: string
}

export interface ProjectStep {
  id: number
  title: string
  description: string
  icon: LucideIcon
}

export interface ProjectStatusLabel {
  color: string
  text: string
  Icon: LucideIcon
}

// ==================== PROCESS STEPS ====================

export interface ProcessStep {
  number: string
  title: string
  description: string
  time: string
  icon: LucideIcon
}

// ==================== BENEFITS ====================

export interface Benefit {
  icon: LucideIcon
  title: string
  description: string
}

// ==================== FAQ ====================

export interface FAQItem {
  question: string
  answer: string
}

// ==================== TUTORIAL ====================

export type TutorialType = 'cart' | 'globe' | 'camera' | 'new-project' | 'catalog'

export interface TutorialContent {
  title: string
  description: string
  features: string[]
  icon: LucideIcon
  color: string
}

export interface TutorialState {
  isOpen: boolean
  type: TutorialType | null
}

// ==================== TEMPLATES ====================

export interface Template {
  id: string
  name: string
  description: string
  role: 'client' | 'supplier'
}

// ==================== STATS ====================

export interface ProjectStats {
  active: number
  pending: number
  completed: number
  rejected: number
  // Legacy aliases for backwards compatibility
  activeProjects: number
  pendingProjects: number
  completedProjects: number
  rejectedProjects: number
}

// ==================== HOOK RETURN TYPES ====================

export interface UseProjectsReturn {
  projects: Project[]
  displayProjects: Project[]
  loading: boolean
  error: Error | null
}

export interface UseTutorialReturn {
  isOpen: boolean
  type: TutorialType | null
  openTutorial: (type: TutorialType) => void
  closeTutorial: () => void
}

export interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLDivElement | null>
  isInView: boolean
}

// ==================== COMPONENT PROPS ====================

export interface FadeInSectionProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export interface FAQItemType {
  question: string
  answer: string
}
