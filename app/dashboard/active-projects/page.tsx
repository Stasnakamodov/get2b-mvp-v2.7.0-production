"use client"

import React, { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import { ProjectTimeline } from "@/components/ui/ProjectTimeline"
import { 
  Building2, 
  Calendar, 
  Clock, 
  Search, 
  ArrowRight, 
  History, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  LayoutGrid,
  List,
  Trash2,
  DollarSign,
  FileCheck,
  ArrowRightLeft,
  Truck,
  AlertCircle,
  Sparkles,
  Grid
} from "lucide-react"
import { ProjectStatus } from "@/lib/types/project-status"
import { STATUS_LABELS } from "@/lib/types/project-status"
import { Project as ProjectType } from "@/lib/types"
import { ProjectStatusBadge } from "@/components/ui/ProjectStatus"
import * as RadixSelect from "@radix-ui/react-select"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

// Типы для проектов
interface Project {
  id: string
  name: string
  company: string
  status: ProjectStatus
  current_step: number
  created_at: string
}

// Вспомогательная функция для определения следующего этапа
function getNextStage(currentStage: string): string {
  switch (currentStage) {
    case "card":
      return "Спецификация"
    case "application":
      return "Пополнение агента"
    case "replenishment":
      return "Выбор метода"
    case "method":
      return "Заполнение реквизитов"
    case "requisites":
      return "Получение средств"
    case "receiving":
      return "Подтверждение"
    case "confirmation":
      return "Завершение проекта"
    default:
      return "Начало проекта"
  }
}

// Добавляю функцию для преобразования currentStage в номер шага
function getStepFromStage(stage: string): number {
  switch (stage) {
    case "card": return 1;
    case "application": return 2;
    case "replenishment": return 3;
    case "method": return 4;
    case "requisites": return 5;
    case "receiving": return 6;
    case "confirmation": return 7;
    default: return 1;
  }
}

const steps = [
  { id: 1, title: "Данные клиента", description: "Данные компании", icon: Building2 },
  { id: 2, title: "Спецификация", description: "Спецификация", icon: FileText },
  { id: 3, title: "Пополнение агента", description: "Пополнение счета", icon: DollarSign },
  { id: 4, title: "Метод", description: "Выбор метода", icon: FileCheck },
  { id: 5, title: "Реквизиты", description: "Банковские реквизиты", icon: ArrowRightLeft },
  { id: 6, title: "Получение", description: "Получение средств", icon: Truck },
  { id: 7, title: "Подтверждение", description: "Завершение операции", icon: CheckCircle },
];

// Группы статусов для фильтрации
const statusGroups: Record<string, ProjectStatus[]> = {
  all: [],
  active: [
    "in_progress",
    "waiting_approval",
    "waiting_receipt",
    "receipt_approved",
    "filling_requisites",
    "in_work"
  ],
  waiting: ["waiting_approval", "waiting_receipt"],
  rejected: ["receipt_rejected"],
  completed: ["completed"],
};

// Быстрые фильтры
const quickFilters = [
  {
    id: "needs_attention",
    label: "Требует внимания",
    icon: AlertTriangle,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    statuses: ["waiting_approval", "waiting_receipt", "receipt_rejected"]
  },
  {
    id: "overdue",
    label: "Просрочены",
    icon: AlertCircle,
    color: "text-red-600 bg-red-50 border-red-200",
    statuses: [] // Логика отдельная
  },
  {
    id: "new",
    label: "Новые",
    icon: Sparkles,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    statuses: [] // Логика отдельная
  }
];

function ActiveProjectsPageContent() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortType, setSortType] = useState<string>("date_desc")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [quickFilter, setQuickFilter] = useState<string | null>(null)

  useEffect(() => {
    // Загрузка проектов только текущего пользователя из Supabase
    const fetchProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setProjects(data.map((p: any) => ({
          ...p,
          currentStep: p.current_step || 1,
        })));
      }
    };
    
    // Первоначальная загрузка
    fetchProjects();
    
    // Умный поллинг только для активных проектов
    const hasActiveProjects = projects.some(p => 
      p.status !== "completed" && 
      ["waiting_approval", "waiting_receipt", "in_progress"].includes(p.status)
    );
    
    // Поллинг только если есть активные проекты, требующие обновления
    if (hasActiveProjects) {
      const interval = setInterval(fetchProjects, 10000); // каждые 10 секунд вместо 5
      return () => clearInterval(interval);
    }
  }, [projects.length]); // Зависимость от количества проектов

  // Добавим состояние для диалога подтверждения удаления
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedProjectForHistory, setSelectedProjectForHistory] = useState<Project | null>(null)
  const [projectStatusHistory, setProjectStatusHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Функция для проверки "просроченных" проектов (старше 7 дней без изменений)
  const isOverdue = (project: Project): boolean => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(project.created_at) < sevenDaysAgo && project.status !== "completed";
  };

  // Функция для проверки "новых" проектов (созданы за последние 3 дня)
  const isNew = (project: Project): boolean => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return new Date(project.created_at) > threeDaysAgo;
  };

  // --- Оптимизированная фильтрация с useMemo ---
  const quickFilteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (!quickFilter) return true;
      
      switch (quickFilter) {
        case "needs_attention":
          return quickFilters[0].statuses.includes(project.status as ProjectStatus);
        case "overdue":
          return isOverdue(project);
        case "new":
          return isNew(project);
        default:
          return true;
      }
    });
  }, [projects, quickFilter]);

  // --- Фильтрация по статусу ---
  const filteredProjects = useMemo(() => {
    return quickFilteredProjects.filter((project) => {
      if (statusFilter === "all") return true;
      return statusGroups[statusFilter]?.includes(project.status as ProjectStatus);
    });
  }, [quickFilteredProjects, statusFilter]);

  // --- Поиск ---
  const searchedProjects = useMemo(() => {
    return filteredProjects.filter(
      (project) =>
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.company?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredProjects, searchQuery]);

  // --- Сортировка ---
  const sortedProjects = useMemo(() => {
    return [...searchedProjects].sort((a, b) => {
      if (sortType === "date_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortType === "date_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortType === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortType === "name_desc") {
        return (b.name || "").localeCompare(a.name || "");
      }
      return 0;
    });
  }, [searchedProjects, sortType]);

  // --- Разделение на активные и завершённые для отображения ---
  const activeProjects = useMemo(() => {
    return sortedProjects.filter((p) => p.status !== "completed");
  }, [sortedProjects]);
  
  const completedProjects = useMemo(() => {
    return sortedProjects.filter((p) => p.status === "completed");
  }, [sortedProjects]);

  // Функция для продолжения работы над проектом
  const handleContinueProject = (project: Project) => {
    localStorage.setItem("currentProject", JSON.stringify(project))

    switch (project.name) {
      case "card":
        router.push(`/dashboard/create-project?step=1&projectId=${project.id}`)
        break
      case "application":
        router.push(`/dashboard/create-project?step=2&projectId=${project.id}`)
        break
      case "replenishment":
        router.push(`/dashboard/create-project?step=3&projectId=${project.id}`)
        break
      case "method":
        router.push(`/dashboard/create-project?step=4&projectId=${project.id}`)
        break
      case "requisites":
        router.push(`/dashboard/create-project?step=5&projectId=${project.id}`)
        break
      case "receiving":
        router.push(`/dashboard/create-project?step=6&projectId=${project.id}`)
        break
      case "confirmation":
        router.push(`/dashboard/create-project?step=7&projectId=${project.id}`)
        break
      default:
        router.push(`/dashboard/create-project?projectId=${project.id}`)
    }
  }

  // Функция перехода к детальной странице проекта
  const handleViewProjectDetails = (project: Project) => {
    router.push(`/dashboard/project/${project.id}`)
  }

  // Добавим функцию для удаления проекта
  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  // Обновленная функция для показа истории проекта с реальными данными
  const handleShowProjectHistory = async (project: Project) => {
    setSelectedProjectForHistory(project)
    setHistoryDialogOpen(true)
    setHistoryLoading(true)
    
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser()
      
      // Получаем историю статусов из базы данных
      const { data: statusHistory, error } = await supabase
        .from('project_status_history')
        .select(`
          id,
          status,
          previous_status,
          step,
          changed_at,
          changed_by,
          comment,
          created_at
        `)
        .eq('project_id', project.id)
        .order('changed_at', { ascending: true })

      if (error) {
        console.error('Ошибка загрузки истории проекта:', error)
        setProjectStatusHistory([])
      } else {
        // Добавляем событие создания проекта в начало истории
        const projectCreation = {
          id: 'creation',
          status: 'draft',
          previous_status: null,
          step: 1,
          changed_at: project.created_at,
          changed_by: user?.id || 'system',
          comment: 'Проект создан',
          created_at: project.created_at
        }
        
        setProjectStatusHistory([projectCreation, ...(statusHistory || [])])
      }
    } catch (error) {
      console.error('Ошибка при получении истории:', error)
      setProjectStatusHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // Добавим функцию для подтверждения удаления
  const confirmDeleteProject = () => {
    if (projectToDelete) {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id))
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  // Компонент карточки проекта
  const ProjectCard = ({ project }: { project: Project }) => (
    <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {project.name || 'Без названия'}
              </h3>
              <ProjectStatusBadge status={project.status as ProjectStatus} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Building2 size={16} />
                {project.company}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {new Date(project.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleContinueProject(project)}
              className="whitespace-nowrap"
            >
              <ArrowRight size={16} className="mr-1" />
              Продолжить
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleShowProjectHistory(project)}
              className="whitespace-nowrap"
            >
              <History size={16} className="mr-1" />
              Подробнее
            </Button>            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeleteProject(project)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        
        {/* ProjectTimeline во всю ширину */}
        <div className="mb-3">
          <ProjectTimeline 
            steps={steps} 
            currentStep={project.current_step} 
            maxStepReached={project.current_step}
            showStepTitles={true}
          />
        </div>
        
        <div className="text-center text-sm text-gray-600">
          Этап {project.current_step}/7: {steps.find(s => s.id === project.current_step)?.title}
        </div>
      </CardContent>
    </Card>
  );

  // Компонент таблицы проектов
  const ProjectTable = ({ projects }: { projects: Project[] }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Проект
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Компания
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Статус
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Этап
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Создан
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {project.name || 'Без названия'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{project.company}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ProjectStatusBadge status={project.status as ProjectStatus} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{project.current_step}/7</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(project.current_step / 7) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(project.created_at).toLocaleDateString('ru-RU')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleContinueProject(project)}
                >
                  <ArrowRight size={14} className="mr-1" />
                  Продолжить
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewProjectDetails(project)}
                >
                  <Eye size={14} className="mr-1" />
                  Подробнее
                </Button>                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteProject(project)}
                >
                  <Trash2 size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Ваши сделки</h1>
        <Button onClick={() => router.push("/dashboard/create-project")}>
          Создать проект
        </Button>
      </div>

      {/* Быстрые фильтры */}
      <div className="flex flex-wrap gap-2 mb-6">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = quickFilter === filter.id;
          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setQuickFilter(isActive ? null : filter.id)}
              className={cn(
                "flex items-center gap-2",
                !isActive && filter.color
              )}
            >
              <Icon size={16} />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {/* Основные фильтры и управление */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Поиск сделок..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-gray-100 dark:bg-gray-700">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="active">Активные</TabsTrigger>
            <TabsTrigger value="waiting">В ожидании</TabsTrigger>
            <TabsTrigger value="rejected">Отклонённые</TabsTrigger>
            <TabsTrigger value="completed">Завершённые</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sortType} onValueChange={setSortType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Сначала новые</SelectItem>
            <SelectItem value="date_asc">Сначала старые</SelectItem>
            <SelectItem value="name_asc">По названию (А-Я)</SelectItem>
            <SelectItem value="name_desc">По названию (Я-А)</SelectItem>
          </SelectContent>
        </Select>

        {/* Переключатель режима просмотра */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid size={16} />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Отображение проектов */}
      {sortedProjects.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <p className="text-gray-500 mt-4">Проекты не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Активные проекты */}
          {activeProjects.length > 0 && (
              <div>
              <h2 className="text-xl font-semibold mb-4">Активные проекты ({activeProjects.length})</h2>
              {viewMode === "cards" ? (
                <div className="space-y-6">
                  {activeProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
              </div>
              ) : (
                <ProjectTable projects={activeProjects} />
              )}
            </div>
          )}

          {/* Завершённые проекты */}
          {completedProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Завершённые проекты ({completedProjects.length})</h2>
              {viewMode === "cards" ? (
                <div className="space-y-6">
                  {completedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <ProjectTable projects={completedProjects} />
              )}
            </div>
          )}
          </div>
        )}

      {/* Диалог подтверждения удаления */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить проект "{projectToDelete?.name}"? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProject}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно истории проекта */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <History size={24} />
              История проекта
            </DialogTitle>
            <DialogDescription>
              Детальная временная шкала и история изменений проекта
            </DialogDescription>
          </DialogHeader>
          
          {selectedProjectForHistory && (
            <div className="space-y-6">
              {/* Основная информация о проекте */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-500">Название проекта</span>
                      </div>
                      <p className="text-lg font-semibold">{selectedProjectForHistory.name || 'Без названия'}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-500">Компания</span>
                      </div>
                      <p className="text-lg font-semibold">{selectedProjectForHistory.company}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-500">Дата создания</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {new Date(selectedProjectForHistory.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-500">Текущий статус</span>
                      </div>
                      <ProjectStatusBadge status={selectedProjectForHistory.status as ProjectStatus} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Прогресс проекта */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Прогресс выполнения</h3>
                      <span className="text-sm text-gray-500">
                        Этап {selectedProjectForHistory.current_step}/7
                      </span>
                    </div>
                    
                    <div className="w-full">
                      <ProjectTimeline 
                        steps={steps} 
                        currentStep={selectedProjectForHistory.current_step} 
                        maxStepReached={selectedProjectForHistory.current_step}
                        showStepTitles={true}
                      />
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-800 font-medium">
                        Текущий этап: {steps.find(s => s.id === selectedProjectForHistory.current_step)?.title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Детальная история изменений */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Детальная история изменений
                  </h3>
                  
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">Загружаем историю...</span>
                    </div>
                  ) : projectStatusHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock size={48} className="mx-auto mb-2 opacity-50" />
                      <p>История изменений пока пуста</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectStatusHistory.map((historyItem, index) => {
                        const isFirst = index === 0
                        const isLast = index === projectStatusHistory.length - 1
                        const statusInfo = STATUS_LABELS[historyItem.status as ProjectStatus] || historyItem.status
                        const isCurrentStatus = historyItem.status === selectedProjectForHistory.status
                        
                        return (
                          <div 
                            key={historyItem.id}
                            className={`relative flex items-start gap-4 p-4 rounded-lg transition-all ${
                              isCurrentStatus ? 'bg-blue-50 border-2 border-blue-200' :
                              isFirst ? 'bg-green-50 border border-green-200' :
                              'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {/* Линия времени */}
                            {!isLast && (
                              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-300"></div>
                            )}
                            
                            {/* Иконка статуса */}
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              isCurrentStatus ? 'bg-blue-500 text-white' :
                              isFirst ? 'bg-green-500 text-white' :
                              'bg-gray-400 text-white'
                            }`}>
                              {isFirst ? '📅' : isCurrentStatus ? '🎯' : '✓'}
                            </div>
                            
                            {/* Содержимое */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className={`font-semibold ${
                                  isCurrentStatus ? 'text-blue-800' :
                                  isFirst ? 'text-green-800' :
                                  'text-gray-800'
                                }`}>
                                  {isFirst ? '🎬 Проект создан' : 
                                   isCurrentStatus ? `🎯 Текущий статус: ${statusInfo}` :
                                   `📝 Статус изменен: ${statusInfo}`}
                                </h4>
                                
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock size={14} />
                                  {new Date(historyItem.changed_at).toLocaleString("ru-RU", {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              
                              {/* Детали изменения */}
                              <div className="space-y-1">
                                {historyItem.previous_status && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Переход:</span> {STATUS_LABELS[historyItem.previous_status as ProjectStatus]} → {statusInfo}
                                  </p>
                                )}
                                
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Этап:</span> {historyItem.step}/7 - {steps.find(s => s.id === historyItem.step)?.title || 'Неизвестный этап'}
                                </p>
                                
                                {historyItem.comment && (
                                  <p className="text-sm text-gray-700 bg-white p-2 rounded border-l-4 border-blue-300">
                                    <span className="font-medium">💬 Комментарий:</span> {historyItem.comment}
                                  </p>
                                )}
                                
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium">Изменено:</span> {historyItem.changed_by || 'Система'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Бейдж текущего статуса */}
                            {isCurrentStatus && (
                              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Текущий
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setHistoryDialogOpen(false)}
            >
              Закрыть
            </Button>
            <Button 
              onClick={() => {
                if (selectedProjectForHistory) {
                  handleContinueProject(selectedProjectForHistory)
                  setHistoryDialogOpen(false)
                }
              }}
            >
              <ArrowRight size={16} className="mr-1" />
              Продолжить проект
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Динамический импорт для отключения SSR
const ActiveProjectsPage = dynamic(() => Promise.resolve(ActiveProjectsPageContent), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto py-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  )
})

export default ActiveProjectsPage
