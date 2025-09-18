"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, CheckCircle, Clock, Settings } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { fetchProjectStatusHistory } from "@/lib/supabaseProjectStatus"
import ProjectDocumentsGrid from "@/components/ui/ProjectDocumentsGrid"

// Интерфейс для истории статусов
interface StatusHistoryItem {
  status: string
  previous_status: string
  step: number
  changed_at: string
  changed_by: string | null
  comment: string | null
}

// Минимальный интерфейс проекта для документов
interface Project {
  id: string
  name: string
  company_data?: {
    name?: string
  }
  status: string
  current_step: number
  created_at: string
  completed_at?: string
  // Реальные поля документов из базы данных
  company_card_file?: string // Шаг 1: карточка компании
  receipts?: string // Шаг 3: чеки (может быть JSON)
  client_confirmation_url?: string // Шаг 7: подтверждение клиента
  // Дополнительные поля проекта для отображения шагов 4-5
  payment_method?: string // Шаг 4: способ оплаты поставщику
  selected_requisite_type?: string // Шаг 5: тип реквизитов
  amount?: number // Сумма проекта
  currency?: string // Валюта проекта
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return

      try {
        // Загружаем данные проекта
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single()

        if (error) {
          console.error("Ошибка загрузки проекта:", error)
          return
        }

        setProject(data)

        // Загружаем историю статусов проекта
        try {
          const history = await fetchProjectStatusHistory(projectId)
          setStatusHistory(history || [])
        } catch (historyError) {
          console.error("Ошибка загрузки истории проекта:", historyError)
          setStatusHistory([])
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'waiting_approval': return 'bg-yellow-500'
      case 'receipt_approved': return 'bg-blue-500'
      case 'waiting_manager_receipt': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    const statusLabels: Record<string, string> = {
      'completed': 'Завершён',
      'in_progress': 'В процессе',
      'waiting_approval': 'Ожидает одобрения',
      'receipt_approved': 'Чек одобрен',
      'waiting_manager_receipt': 'Ожидает чек менеджера',
      'waiting_client_confirmation': 'Ожидает подтверждения клиента'
    }
    return statusLabels[status] || status
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Проект не найден</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </div>
      </div>
    )
  }

  const isCompleted = project.status === 'completed'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Заголовок проекта */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.name || 'Проект без названия'}</h1>
              <p className="text-muted-foreground">{project.company_data?.name || 'Компания не указана'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge 
              variant={project.status === 'completed' ? 'default' : 'secondary'}
              className={project.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}
            >
              {project.status === 'completed' ? 'Завершён' : 'В работе'}
            </Badge>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Создан: {new Date(project.created_at).toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>

        {/* Документы проекта или детальная информация */}
        {project.status === 'completed' ? (
          <ProjectDocumentsGrid project={project} statusHistory={statusHistory} />
        ) : (
          <div>
            <ProjectDocumentsGrid project={project} statusHistory={statusHistory} />
            
            {/* Блок для активных проектов */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Продолжить работу над проектом</h3>
                  <p className="text-muted-foreground mb-4">Проект находится на шаге {project.current_step} из 7</p>
                  <Button 
                    onClick={() => router.push('/dashboard/create-project')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Перейти к конструктору проектов
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 