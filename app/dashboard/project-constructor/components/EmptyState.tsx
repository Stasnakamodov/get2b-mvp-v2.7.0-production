'use client'

import React from 'react'
import { Blocks } from 'lucide-react'

interface EmptyStateProps {
  type: 'hover-prompt' | 'disabled-step'
}

/**
 * Empty State Component
 * Shows appropriate message when no step is selected or step is disabled
 */
export function EmptyState({ type }: EmptyStateProps) {
  if (type === 'disabled-step') {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <Blocks className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-gray-500">Сначала настройте основные шаги (I и II)</p>
      </div>
    )
  }

  return (
    <div className="text-center py-8 text-gray-500">
      <Blocks className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p>Наведите на кубик для выбора источника данных</p>
    </div>
  )
}
