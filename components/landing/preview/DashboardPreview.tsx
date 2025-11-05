"use client"

import { motion } from "framer-motion"
import { CatalogSearchBar } from "./CatalogSearchBar"
import { ProjectTemplates } from "./ProjectTemplates"
import { ProjectStatistics } from "./ProjectStatistics"
import { ProjectCard } from "@/components/landing/cards/ProjectCard"
import { useProjectStats } from "@/hooks/landing/useProjectStats"
import { mockProjects } from "@/data/landing/mockData"
import type { TutorialType } from "@/types/landing"

interface DashboardPreviewProps {
  onTutorialOpen: (type: TutorialType) => void
}

export function DashboardPreview({ onTutorialOpen }: DashboardPreviewProps) {
  // Use mock projects for landing page preview
  const displayProjects = mockProjects
  const projectStats = useProjectStats(displayProjects)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-[70]"
    >
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        {/* Mock browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="ml-4 flex-1 bg-white/5 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500 font-light">get2b.ru/dashboard</span>
          </div>
        </div>

        {/* Dashboard content - РЕАЛЬНЫЙ DASHBOARD PREVIEW */}
        <div className="aspect-[16/10] bg-gradient-to-br from-zinc-900/90 to-black/90 p-6 overflow-y-auto">
          {/* Top Bar: Новый проект + Поиск (как в дашборде) */}
          <CatalogSearchBar onTutorialOpen={onTutorialOpen} />

          {/* Project Cards - показываем до 2 проектов */}
          <div className="space-y-3 mb-4">
            {displayProjects.slice(0, 2).map((proj) => (
              <ProjectCard key={proj.id} project={proj} />
            ))}
          </div>

          {/* Шаблоны проектов (как в дашборде - ПЕРЕД статистикой) */}
          <ProjectTemplates />

          {/* Stats Cards Row - 4 Cards (как в дашборде) */}
          <ProjectStatistics stats={projectStats} />
        </div>
      </div>

      {/* Floating notification cards */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-4 -right-4 bg-blue-600 rounded-xl p-3 border border-blue-400/20 shadow-2xl backdrop-blur-sm"
      >
        <div className="text-xs text-blue-100 mb-0.5 font-light">Новая заявка</div>
        <div className="text-sm text-white font-normal">₽2.4M · Электроника</div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-4 -left-4 bg-green-600 rounded-xl p-3 border border-green-400/20 shadow-2xl backdrop-blur-sm"
      >
        <div className="text-xs text-green-100 mb-0.5 font-light">Оплата прошла</div>
        <div className="text-sm text-white font-normal">Shenzhen Tech · ¥1.8M</div>
      </motion.div>
    </motion.div>
  )
}
