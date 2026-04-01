"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowRight } from "lucide-react"
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
  amount?: number
  currency?: string
  company_data?: { name?: string } | null
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

function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
    case "in_progress":
      return "В работе"
    case "waiting":
    case "waiting_approval":
    case "waiting_receipt":
      return "В ожидании"
    case "rejected":
    case "receipt_rejected":
      return "Отклонена"
    case "completed":
      return "Завершена"
    default:
      return "В работе"
  }
}

export default function YourDealsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortType, setSortType] = useState<string>("date_desc")

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
        (project.company?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (project.company_data?.name?.toLowerCase().includes(searchQuery.toLowerCase())))
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

  const renderDealCard = (project: Project) => {
    const step = project.currentStep || 1
    const companyName = project.company_data?.name || project.company
    const amountStr = project.amount
      ? `${project.amount.toLocaleString('ru-RU')} ${project.currency || '₽'}`
      : null

    return (
      <Card key={project.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            {/* Left: title + subtitle */}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-lg font-bold text-foreground truncate">
                {project.name || 'Без названия'}
              </span>
              <span className="text-sm text-muted-foreground">
                {[companyName, amountStr].filter(Boolean).join(' · ')}
              </span>
            </div>
            {/* Right: status badge */}
            <span className="shrink-0 inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500 dark:bg-blue-500/20 dark:text-blue-400 whitespace-nowrap">
              {getStatusLabel(project.status)} · Шаг {step}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <ProjectTimeline steps={steps} currentStep={step} maxStepReached={step} showStepTitles={false} />
        </CardContent>
        <CardFooter className="pt-2 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/project/${project.id}`)}
          >
            Подробнее
          </Button>
          <Button
            onClick={() => handleContinueProject(project)}
            className="gap-2"
          >
            Следующий шаг
            <ArrowRight size={16} />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Ваши сделки</h1>
        <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:items-center w-full md:w-auto">
          <div className="flex flex-row gap-2 items-center w-full md:w-auto">
            <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
              <TabsList>
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
        <div className="flex flex-col gap-4">
          {activeProjects.map(renderDealCard)}
        </div>
      )}

      {completedProjects.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Завершённые</h2>
          <div className="flex flex-col gap-4 opacity-70">
            {completedProjects.map(renderDealCard)}
          </div>
        </div>
      )}
    </div>
  )
}
