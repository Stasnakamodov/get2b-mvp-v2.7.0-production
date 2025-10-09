'use client'

import React from 'react'
import { LucideIcon, Eye } from 'lucide-react'

type CubeColor = 'blue' | 'green' | 'purple' | 'orange' | 'red'

interface DataCubeProps {
  icon: LucideIcon
  color: CubeColor
  title: string
  subtitle: string
  primaryValue: string
  secondaryValue?: string
  onClick: () => void
}

/**
 * DataCube - Reusable data display cube component
 * Used to show filled step data in a clickable card format
 */
export function DataCube({
  icon: Icon,
  color,
  title,
  subtitle,
  primaryValue,
  secondaryValue,
  onClick
}: DataCubeProps) {
  const colorClasses = {
    blue: {
      border: 'border-blue-200 hover:border-blue-300',
      bg: 'bg-blue-500',
      text: 'text-blue-600'
    },
    green: {
      border: 'border-green-200 hover:border-green-300',
      bg: 'bg-green-500',
      text: 'text-green-600'
    },
    purple: {
      border: 'border-purple-200 hover:border-purple-300',
      bg: 'bg-purple-500',
      text: 'text-purple-600'
    },
    orange: {
      border: 'border-orange-200 hover:border-orange-300',
      bg: 'bg-orange-500',
      text: 'text-orange-600'
    },
    red: {
      border: 'border-red-200 hover:border-red-300',
      bg: 'bg-red-500',
      text: 'text-red-600'
    }
  }

  const colors = colorClasses[color]

  return (
    <div
      className={`bg-white border-2 ${colors.border} rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
      </div>
      <div className="text-sm text-gray-800 font-medium">{primaryValue}</div>
      {secondaryValue && (
        <div className="text-xs text-gray-500 mt-1">{secondaryValue}</div>
      )}
      <div className={`text-xs ${colors.text} mt-2 flex items-center gap-1`}>
        <span>Нажмите для просмотра</span>
        <Eye className="h-3 w-3" />
      </div>
    </div>
  )
}
