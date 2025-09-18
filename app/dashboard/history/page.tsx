"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Clock, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Building2, 
  History,
  TrendingUp,
  Calendar,
  Activity,
  Filter,
  Eye,
  ArrowRight,
  Zap,
  Star,
  Timer
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { ProjectStatus, STATUS_LABELS } from "@/lib/types/project-status"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Project {
  id: string
  name: string
  company: string
  status: ProjectStatus
  current_step: number
  created_at: string
  updated_at: string
}

interface StatusHistoryItem {
  id: string
  project_id: string
  status: ProjectStatus
  previous_status: ProjectStatus
  changed_by: string | null
  comment: string | null
  changed_at: string
  step: number
  project?: Project
}

export default function HistoryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'waiting'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Загружаем проекты пользователя
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (projectsError) {
        console.error("Error fetching projects:", projectsError)
        return
      }

      const projectsList = projectsData || []
      setProjects(projectsList)

      // Загружаем историю статусов для всех проектов пользователя
      const projectIds = projectsList.map(p => p.id)
      if (projectIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from("project_status_history")
          .select("*")
          .in("project_id", projectIds)
          .order("changed_at", { ascending: false })

        if (historyError) {
          console.error("Error fetching history:", JSON.stringify(historyError))
          return
        }

        // Объединяем данные вручную
        const historyWithProjects = (historyData || []).map(historyItem => ({
          ...historyItem,
          project: projectsList.find(p => p.id === historyItem.project_id)
        }))

        setStatusHistory(historyWithProjects)
      } else {
        setStatusHistory([])
      }
    } catch (error) {
      console.error("Error fetching data:", JSON.stringify(error))
    } finally {
      setLoading(false)
    }
  }

  // Статистика
  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => ['in_progress', 'waiting_approval', 'waiting_receipt'].includes(p.status)).length,
    events: statusHistory.length
  }

  // Фильтруем проекты по поиску
  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Фильтруем историю для выбранного проекта
  const projectHistory = selectedProjectId
    ? statusHistory.filter(item => item.project_id === selectedProjectId)
    : statusHistory

  // Фильтруем общую историю по поиску и фильтру
  const filteredHistory = projectHistory.filter(item => {
    const matchesSearch = item.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.project?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      STATUS_LABELS[item.status]?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
      (filter === 'completed' && item.status === 'completed') ||
      (filter === 'in_progress' && ['in_progress', 'waiting_approval', 'waiting_receipt'].includes(item.status)) ||
      (filter === 'waiting' && ['waiting_approval', 'waiting_receipt'].includes(item.status))

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
      case "in_progress":
        return "bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
      case "waiting_approval":
        return "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
      case "receipt_rejected":
        return "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
      case "waiting_receipt":
        return "bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
      default:
        return "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
    }
  }

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={18} className="text-green-600" />
      case "receipt_rejected":
        return <XCircle size={18} className="text-red-600" />
      case "waiting_approval":
        return <Clock size={18} className="text-yellow-600" />
      case "waiting_receipt":
        return <Timer size={18} className="text-purple-600" />
      case "in_progress":
        return <Zap size={18} className="text-blue-600" />
      default:
        return <FileText size={18} className="text-gray-600" />
    }
  }

  const getTimelineColor = (status: ProjectStatus) => {
    switch (status) {
      case "completed":
        return "border-green-400 dark:border-green-500 bg-green-100 dark:bg-green-900/30"
      case "receipt_rejected":
        return "border-red-400 dark:border-red-500 bg-red-100 dark:bg-red-900/30"
      case "waiting_approval":
        return "border-yellow-400 dark:border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30"
      case "waiting_receipt":
        return "border-purple-400 dark:border-purple-500 bg-purple-100 dark:bg-purple-900/30"
      case "in_progress":
        return "border-blue-400 dark:border-blue-500 bg-blue-100 dark:bg-blue-900/30"
      default:
        return "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto py-8">
          <div className="text-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"
            />
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-gray-600 dark:text-gray-300 text-lg"
            >
              Загружаем историю проектов...
            </motion.p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        {/* Компактный заголовок */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <History size={32} className="text-blue-600" />
              История проектов
            </h1>
            <p className="text-muted-foreground mt-1">
              {projects.length} проектов • {statusHistory.length} событий
            </p>
          </div>
          
          {/* Компактная статистика */}
          <div className="flex gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.completed}</div>
              <div className="text-xs text-blue-500 dark:text-blue-400">Завершено</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 text-center">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.inProgress}</div>
              <div className="text-xs text-green-500 dark:text-green-400">В работе</div>
            </div>
          </div>
        </motion.div>

                 <Tabs defaultValue="user_history" className="w-full">
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
             <TabsList className="grid w-full sm:w-auto grid-cols-2">
               <TabsTrigger value="user_history">
                 <Activity size={16} className="mr-2" />
                 История пользователя
               </TabsTrigger>
               <TabsTrigger value="project_history">
                 <FileText size={16} className="mr-2" />
                 По проектам
               </TabsTrigger>
             </TabsList>

             {/* Компактные фильтры */}
             <div className="flex gap-2">
               {(['all', 'completed', 'in_progress', 'waiting'] as const).map((filterType) => (
                 <Button
                   key={filterType}
                   variant={filter === filterType ? "default" : "outline"}
                   size="sm"
                   onClick={() => setFilter(filterType)}
                 >
                   {filterType === 'all' && 'Все'}
                   {filterType === 'completed' && 'Завершены'}
                   {filterType === 'in_progress' && 'В работе'}
                   {filterType === 'waiting' && 'Ожидание'}
                 </Button>
               ))}
             </div>
           </div>

           {/* Простой поиск */}
           <div className="relative mb-6">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <Input
               placeholder="Поиск по проектам, компаниям или статусам..."
               className="pl-10"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>

          <TabsContent value="user_history" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
                             <Card>
                                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Activity size={20} className="text-blue-600" />
                     Общая история активности
                   </CardTitle>
                   <CardDescription>
                     Все изменения статусов по всем вашим проектам
                   </CardDescription>
                 </CardHeader>
                <CardContent className="p-6">
                  {filteredHistory.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-4">
                        <History size={40} className="text-gray-400 dark:text-gray-300" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">История пуста</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Начните создавать проекты, чтобы увидеть историю</p>
                    </motion.div>
                  ) : (
                    <div className="relative">
                      {/* Timeline линия */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200 dark:from-blue-600 dark:via-purple-600 dark:to-blue-600" />
                      
                      <div className="space-y-6">
                        {filteredHistory.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex items-start gap-6 group"
                          >
                            {/* Timeline точка */}
                            <div className={cn(
                              "relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                              getTimelineColor(item.status)
                            )}>
                              {getStatusIcon(item.status)}
                            </div>
                            
                                                         {/* Карточка события */}
                             <div className="flex-1 min-w-0">
                               <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-blue-500">
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                                        {item.project?.name || "Неизвестный проект"}
                                      </h4>
                                      {item.project?.company && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                                          <Building2 size={16} />
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{item.project.company}</span>
                                        </div>
                                      )}
                                    </div>
                                    <Badge variant="outline" className={cn("text-sm font-medium", getStatusColor(item.status))}>
                                      {STATUS_LABELS[item.status]}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {new Date(item.changed_at).toLocaleString('ru-RU')}
                                    </div>
                                    {item.changed_by && (
                                      <div className="flex items-center gap-1">
                                        <User size={14} />
                                        {item.changed_by}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Star size={14} />
                                      Шаг {item.step}/7
                                    </div>
                                  </div>
                                  
                                  {item.comment && (
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg">
                                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{item.comment}"</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="project_history" className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                             {/* Список проектов */}
               <Card className="lg:col-span-1">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <FileText size={20} className="text-green-600" />
                     Проекты
                   </CardTitle>
                 </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                                         <Button
                       variant={selectedProjectId === null ? "default" : "outline"}
                       className="w-full justify-start"
                       onClick={() => setSelectedProjectId(null)}
                     >
                                             Все проекты
                    </Button>
                    
                    {filteredProjects.map((project) => (
                                             <Button
                         key={project.id}
                         variant={selectedProjectId === project.id ? "default" : "outline"}
                         className="w-full justify-start"
                         onClick={() => setSelectedProjectId(project.id)}
                       >
                         <div className="flex flex-col items-start">
                           <span className="font-medium text-gray-900 dark:text-gray-100">{project.name}</span>
                           <span className="text-xs text-gray-500 dark:text-gray-400">{project.company}</span>
                         </div>
                       </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

                             {/* История выбранного проекта */}
               <Card className="lg:col-span-2">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <History size={20} className="text-purple-600" />
                     {selectedProjectId
                       ? `История проекта "${projects.find(p => p.id === selectedProjectId)?.name}"`
                       : "История всех проектов"
                     }
                   </CardTitle>
                 </CardHeader>
                <CardContent className="p-6">
                  {filteredHistory.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-4">
                        <History size={40} className="text-gray-400 dark:text-gray-300" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">История пуста</p>
                      <p className="text-gray-400 text-sm mt-2">Выберите проект для просмотра его истории</p>
                    </motion.div>
                  ) : (
                    <div className="relative">
                      {/* Timeline линия */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-pink-200 to-purple-200 dark:from-purple-600 dark:via-pink-600 dark:to-purple-600" />
                      
                      <div className="space-y-6">
                        {filteredHistory.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex items-start gap-6 group"
                          >
                            {/* Timeline точка */}
                            <div className={cn(
                              "relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                              getTimelineColor(item.status)
                            )}>
                              {getStatusIcon(item.status)}
                            </div>
                            
                                                         {/* Карточка события */}
                             <div className="flex-1 min-w-0">
                               <Card className="transition-all duration-300 hover:shadow-md border-l-4 border-l-purple-500">
                                <CardContent className="p-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                                        Шаг {item.step} из 7
                                      </h4>
                                      {item.previous_status && (
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                                          <ArrowRight size={16} />
                                          <span className="text-sm">
                                            {STATUS_LABELS[item.previous_status]} → {STATUS_LABELS[item.status]}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <Badge variant="outline" className={cn("text-sm font-medium", getStatusColor(item.status))}>
                                      {STATUS_LABELS[item.status]}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {new Date(item.changed_at).toLocaleString('ru-RU')}
                                    </div>
                                    {item.changed_by && (
                                      <div className="flex items-center gap-1">
                                        <User size={14} />
                                        {item.changed_by}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {item.comment && (
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg">
                                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{item.comment}"</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 