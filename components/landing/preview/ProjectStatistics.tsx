"use client"

import type { ProjectStats } from "@/types/landing"

interface ProjectStatisticsProps {
  stats: ProjectStats
}

export function ProjectStatistics({ stats }: ProjectStatisticsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Активные проекты */}
      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-white">{stats.active}</div>
        <div className="text-sm text-blue-300 font-light mt-1">Активные</div>
      </div>

      {/* Ожидающие проекты */}
      <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-white">{stats.pending}</div>
        <div className="text-sm text-amber-300 font-light mt-1">Ожидают</div>
      </div>

      {/* Завершённые проекты */}
      <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-white">{stats.completed}</div>
        <div className="text-sm text-green-300 font-light mt-1">Завершены</div>
      </div>

      {/* Отклонённые проекты */}
      <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
        <div className="text-3xl font-bold text-white">{stats.rejected}</div>
        <div className="text-sm text-red-300 font-light mt-1">Отклонены</div>
      </div>
    </div>
  )
}
