"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Clock, ArrowRight, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import ProjectTimeline from "@/components/ui/ProjectTimeline"
import { Building2, FileText, DollarSign, FileCheck, ArrowRightLeft, Truck, CheckCircle } from "lucide-react"

interface Project {
  id: string
  title: string
  company: string
  date: string
  status: string
  progress: number
  currentStage: string
  currentStep?: number
  name?: string
  created_at: string
  completed_at?: string
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

const statusGroups: Record<string, string[]> = {
  all: [],
  active: ["active", "in_progress", "waiting", "waiting_approval", "waiting_receipt"],
  waiting: ["waiting", "waiting_approval", "waiting_receipt"],
  rejected: ["rejected", "receipt_rejected"],
  completed: ["completed"],
};

export default function YourDealsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortType, setSortType] = useState<string>("date_desc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  useEffect(() => {
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
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (statusFilter === "all") return true;
    return statusGroups[statusFilter]?.includes(project.status);
  });

  const searchedProjects = filteredProjects.filter(
    (project) =>
      ((project.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.company?.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const sortedProjects = [...searchedProjects].sort((a, b) => {
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

  const activeProjects = sortedProjects.filter((p) => p.status !== "completed");
  const completedProjects = sortedProjects.filter((p) => p.status === "completed");

  const handleContinueProject = (project: Project) => {
    localStorage.setItem("currentProject", JSON.stringify(project))
    switch (project.currentStage) {
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

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id))
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Ваши сделки</h1>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:items-center w-full md:w-auto">
          <div className="flex flex-row gap-2 items-center w-full md:w-auto">
            <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList className="bg-gray-800 dark:bg-gray-700">
                <TabsTrigger value="all">Все</TabsTrigger>
                <TabsTrigger value="active">Активные</TabsTrigger>
                <TabsTrigger value="waiting">В ожидании</TabsTrigger>
                <TabsTrigger value="rejected">Отклонённые</TabsTrigger>
                <TabsTrigger value="completed">Завершённые</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={sortType} onValueChange={setSortType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Сначала новые</SelectItem>
                <SelectItem value="date_asc">Сначала старые</SelectItem>
                <SelectItem value="name_asc">По названию (А-Я)</SelectItem>
                <SelectItem value="name_desc">По названию (Я-А)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full md:w-48 mt-2 md:mt-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Поиск сделок..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {activeProjects.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <p className="text-gray-500 mt-4">Активных сделок не найдено</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProjects.map((project) => {
            const step = project.currentStep || 1;
            return (
              <Card key={project.id} className="overflow-hidden">
                <CardHeader className="pb-2 relative">
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{project.name || 'Без названия'}</span>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Clock size={16} className="mr-2" />
                      <span>
                        Создан: {project.created_at ? new Date(project.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.company}</CardDescription>
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project)
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="my-4">
                    <ProjectTimeline steps={steps} currentStep={step} maxStepReached={step} showStepTitles={false} />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => handleContinueProject(project)}
                  >
                    Продолжить работу
                    <ArrowRight size={16} />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      {/* Можно добавить аналогичный блок для завершённых сделок, если нужно */}
    </div>
  )
} 