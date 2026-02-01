'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Package, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react'

interface AdminStatsProps {
  stats: {
    totalProducts: number
    totalSuppliers: number
    verifiedSuppliers: number
    pendingSuppliers: number
    todayImports: number
  }
}

/**
 * Статистика каталога для админ-панели
 */
export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      label: 'Всего товаров',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Поставщиков',
      value: stats.totalSuppliers,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Верифицированы',
      value: stats.verifiedSuppliers,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      label: 'На модерации',
      value: stats.pendingSuppliers,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Импорт сегодня',
      value: stats.todayImports,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default AdminStats
