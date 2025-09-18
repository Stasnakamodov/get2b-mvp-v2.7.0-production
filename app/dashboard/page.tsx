"use client"

import React from "react"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Building2,
  FileText,
  DollarSign,
  FileCheck,
  ArrowRightLeft,
  Truck,
  CheckCircle,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import ProjectTimeline from "@/components/ui/ProjectTimeline"
import { useDeleteTemplate } from "./create-project/hooks/useDeleteTemplate"
import { useRouter } from "next/navigation"
import { useProjectTemplates } from "./create-project/hooks/useSaveTemplate"

// Типы для проектов
interface Project {
  id: string
  name: string
  company_data?: {
    name: string
    legalName?: string
    inn?: string
    kpp?: string
    ogrn?: string
    email?: string
    // ... другие поля компании
  }
  amount: number
  currency?: string
  created_at: string
  status: string
  current_step: number
  max_step_reached?: number
  receipts?: string
  user_id: string
  // ... другие поля из базы
}

// Этапы проекта
const projectSteps = [
  { id: 1, title: "Данные клиента", description: "Выбор карточки", icon: Building2 },
  { id: 2, title: "Спецификация", description: "Создание заявки", icon: FileText },
  { id: 3, title: "Пополнение агента", description: "Пополнение счета", icon: DollarSign },
  { id: 4, title: "Метод", description: "Выбор метода", icon: FileCheck },
  { id: 5, title: "Реквизиты", description: "Банковские реквизиты", icon: ArrowRightLeft },
  { id: 6, title: "Получение", description: "Получение средств", icon: Truck },
  { id: 7, title: "Подтверждение", description: "Завершение операции", icon: CheckCircle },
]

function getProjectStatusLabel(step: number, status: string, receipts?: string) {
  // Специальная логика для 6 шага (получение чека от менеджера)
  if (step === 6) {
    if (status === 'waiting_manager_receipt') {
      return {
        color: '#facc15', // жёлтый
        text: 'Ожидание чека от менеджера',
        Icon: Clock,
      };
    } else if (status === 'in_work') {
      // Проверяем наличие чека от менеджера
      let hasManagerReceipt = false;
      if (receipts) {
        try {
          const receiptsData = JSON.parse(receipts);
          hasManagerReceipt = !!receiptsData.manager_receipt;
        } catch {
          // Старый формат
          hasManagerReceipt = !!receipts;
        }
      }
      
      if (hasManagerReceipt) {
        return {
          color: '#22c55e', // зелёный
          text: 'Чек от менеджера готов',
          Icon: CheckCircle,
        };
      } else {
        return {
          color: '#facc15', // жёлтый
          text: 'Ожидание чека от менеджера',
          Icon: Clock,
        };
      }
    }
  }

  let color = '#6b7280';
  let text = 'В работе';
  let Icon = FileText;

  if ((status === 'completed' || step === 7) && status !== 'waiting_client_confirmation') {
    color = '#22c55e'; text = 'Завершён'; Icon = CheckCircle;
  } else if (status === 'waiting_client_confirmation' && step === 7) {
    color = '#3b82f6'; text = 'Ожидание подтверждающего документа'; Icon = Clock;
  } else if (step === 3) {
    if (status === 'waiting_receipt') {
      if (!receipts) {
        color = '#3b82f6'; text = 'Ожидаем загрузки чека'; Icon = Clock;
      } else {
        color = '#3b82f6'; text = 'Ожидание подтверждения чека'; Icon = Clock;
      }
    } else if (status === 'receipt_rejected') {
      color = '#ef4444'; text = 'Чек отклонён'; Icon = XCircle;
    } else if (status === 'receipt_approved') {
      color = '#22c55e'; text = 'Чек одобрен'; Icon = CheckCircle;
    } else {
      color = '#6b7280'; text = 'В работе'; Icon = DollarSign;
    }
  } else if (step === 2) {
    if (status === 'waiting_approval') {
      color = '#3b82f6'; text = 'Ожидание одобрения'; Icon = Clock;
    } else if (status === 'rejected') {
      color = '#ef4444'; text = 'Отклонён'; Icon = XCircle;
    } else if (status === 'in_progress') {
      color = '#6b7280'; text = 'В работе'; Icon = FileText;
    } else {
      color = '#6b7280'; text = 'В работе'; Icon = FileText;
    }
  } else if (step === 5) {
    if (status === 'filling_requisites' || status === 'in_progress') {
      color = '#3b82f6'; text = 'Ввод реквизитов'; Icon = FileCheck;
    }
  } else if (status === 'receipt_approved') {
    color = '#f59e42'; text = 'Ожидание клиента'; Icon = Truck;
  } else if (status === 'waiting' || status === 'pending') {
    color = '#facc15'; text = 'Ожидает'; Icon = Clock;
  } else if (status === 'waiting_approval') {
    color = '#3b82f6'; text = 'Ожидание одобрения'; Icon = Clock;
  } else if (status === 'rejected') {
    color = '#ef4444'; text = 'Отклонён'; Icon = XCircle;
  }
  return { color, text, Icon };
}

// --- Корректный шаг для карточки ---
function getCorrectStepForCard(project: any) {
  // Используем только поле current_step из базы
  if (project.current_step) return project.current_step;
  return 1;
}

function DashboardPageContent() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const { deleteTemplate, isDeleting, error: deleteError, success: deleteSuccess } = useDeleteTemplate()
  const { templates, loading: loadingTemplates, error: errorTemplates, fetchTemplates } = useProjectTemplates();
  const router = useRouter()
  const FINAL_STEP = 7; // Количество шагов в проекте
  const [templateRole, setTemplateRole] = useState<'client' | 'supplier'>('client');

  // Добавляем состояние для диагностики
  const [debugInfo, setDebugInfo] = useState<{
    user: any;
    userLoaded: boolean;
    projectsLoaded: boolean;
    projectsError: string | null;
    templatesLoaded: boolean;
  }>({
    user: null,
    userLoaded: false,
    projectsLoaded: false,
    projectsError: null,
    templatesLoaded: false
  });

  useEffect(() => {
    // Загружаем проекты из Supabase
    const fetchProjects = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        setDebugInfo(prev => ({ ...prev, userLoaded: true, user }));
        
        if (userError) {
          console.error("❌ [DASHBOARD] Ошибка получения пользователя:", userError.message);
          setDebugInfo(prev => ({ ...prev, projectsError: userError.message }));
          return;
        }
        if (!user) {
          console.log("⚠️ [DASHBOARD] Пользователь не авторизован");
          setDebugInfo(prev => ({ ...prev, projectsError: 'Пользователь не авторизован' }));
          return;
        }
        
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
          
        setDebugInfo(prev => ({ ...prev, projectsLoaded: true }));
          
        if (!error && data) {
          console.log("🔍 [DASHBOARD] Загруженные проекты из базы:", data);
          setProjects(data.map((p: any) => ({
            ...p,
            currentStep: p.current_step || 1,
          })));
          setDebugInfo(prev => ({ ...prev, projectsError: null }));
        } else if (error) {
          console.error("❌ [DASHBOARD] Ошибка загрузки проектов:", error.message || error);
          setDebugInfo(prev => ({ ...prev, projectsError: error.message || 'Неизвестная ошибка' }));
          // Устанавливаем пустой массив при ошибке, чтобы UI не сломался
          setProjects([]);
        }
      } catch (err) {
        console.error("❌ [DASHBOARD] Критическая ошибка при загрузке проектов:", err);
        setDebugInfo(prev => ({ ...prev, projectsError: err instanceof Error ? err.message : 'Критическая ошибка' }));
        setProjects([]);
      }
    };
    
    fetchProjects();
    fetchTemplates(); // шаблоны только при монтировании
    setIsLoaded(true);

    // --- Polling только для проектов ---
    const pollingInterval = setInterval(() => {
      fetchProjects();
      // fetchTemplates(); // больше не вызываем тут
    }, 30000); // 30 секунд, можно увеличить
    return () => {
      clearInterval(pollingInterval);
    };
  }, []);

  // Функция для удаления шаблона
  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    await fetchTemplates();
  }

  // Функция для создания проекта из шаблона
  const createProjectFromTemplate = async (templateId: string) => {
    // Здесь будет логика создания проекта из шаблона
    console.log(`Создание проекта из шаблона ${templateId}`)
  }

  // Функция для удаления проекта
  const deleteProject = async (id: string) => {
    // Удаляем из Supabase
    await supabase.from("projects").delete().eq("id", id);
    // Обновляем локальное состояние
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  // Функция для удаления шаблона из project_templates
  const handleDeleteProjectTemplate = async (id: string) => {
    await supabase.from("project_templates").delete().eq("id", id);
    await fetchTemplates();
  };

  // Варианты анимации для разных элементов
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 24 
      },
    },
  }

  const stageIconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (custom: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: custom * 0.1,
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    }),
  }

  const stageLineVariants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        delay: 0.3,
        duration: 0.8,
        ease: "easeInOut" as const,
      },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.6,
        type: "spring" as const,
        stiffness: 200,
        damping: 15,
      },
    },
    hover: {
      scale: 1.05,
      transition: { 
        type: "spring" as const, 
        stiffness: 400, 
        damping: 10 
      },
    },
    tap: { scale: 0.95 },
  }

  // Логика: всегда показывать 3 проекта — приоритет незакрытым, добивать закрытыми
  const notClosedProjects = projects ? projects.filter((p) => p.status !== "completed") : [];
  const closedProjects = projects ? projects.filter((p) => p.status === "completed") : [];
  let visibleProjects = [];
  if (notClosedProjects.length >= 3) {
    visibleProjects = notClosedProjects.slice(0, 3);
  } else {
    visibleProjects = [
      ...notClosedProjects,
      ...closedProjects.slice(0, 3 - notClosedProjects.length)
    ];
  }
  const [showAll, setShowAll] = useState(false);
  const showButton = projects && projects.length > 3;
  const allVisible = showAll ? projects : visibleProjects;

  // Обработчик для кнопки "Новый проект" с учётом рефакторинга
  const handleCreateProjectClick = async () => {
    router.push(`/dashboard/create-project`); // ВСЕГДА чистый URL
  };

  // Фильтрация шаблонов по роли
  const filteredTemplates = templates.filter((tpl: any) => tpl.role === templateRole);

  return (
    <div className="container mx-auto py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground">Ваши сделки</h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={handleCreateProjectClick} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300">
              <Plus size={16} />
              Новый проект
            </Button>
        </motion.div>
      </motion.div>

      {/* Секция активных проектов */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mb-12">
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Ваши сделки</h2>
          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
            <Link href="/dashboard/active-projects">
              <Button variant="outline" className="flex items-center gap-1">
                Все сделки
                <ChevronRight size={16} />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <div className="space-y-8">
          {allVisible.length > 0 ? (
            allVisible.map((project, projectIndex) => {
              const step = getCorrectStepForCard(project);
              const { color, text, Icon } = getProjectStatusLabel(step, String(project.status), project.receipts);
              return (
                <motion.div key={project.id} variants={itemVariants} custom={projectIndex} layout>
                  <Card className="overflow-hidden bg-card border-border shadow-xl hover:shadow-2xl transition-all duration-300 relative">
                    <CardContent className="p-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * projectIndex, duration: 0.5 }}
                        className="flex justify-between items-start mb-4"
                      >
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
                          <p className="text-muted-foreground">
                            {project.company_data?.name || 'Компания не указана'} • {project.amount || '0'} {project.currency || 'USD'} • {new Date(project.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Лейбл статуса и этапа */}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: '16px', fontWeight: 'bold', color: '#fff', background: color, fontSize: 14
                          }}>
                            <Icon size={18} style={{ marginRight: 6 }} />
                            {text} {step ? `• Шаг ${step}` : ''}
                          </span>
                          {/* Корзина */}
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteProject(project.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Визуализация этапов процесса */}
                      <div className="relative mt-8 mb-6">
                        <ProjectTimeline steps={projectSteps} currentStep={step} maxStepReached={step} />
                      </div>

                      <motion.div
                        className="flex justify-end gap-4 mt-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + 0.1 * projectIndex, duration: 0.5 }}
                      >
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link href={`/dashboard/project/${project.id}`}>
                                        <Button variant="outline" className="border-border hover:border-border/80">
              Подробнее <ChevronRight size={16} className="ml-1" />
            </Button>
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link
                            href={`/dashboard/create-project?step=${step}&projectId=${project.id}`}
                          >
                            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                              Перейти к следующему шагу
                            </Button>
                          </Link>
                        </motion.div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          ) : (
            <Card className="overflow-hidden bg-card border-border shadow-xl">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground py-8">Нет активных проектов</p>
                <Link href="/dashboard/create-project">
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    <Plus size={16} className="mr-2" />
                    Создать первый проект
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {showButton && !showAll && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => setShowAll(true)}>
                Показать все проекты
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Секция шаблонов проектов */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="mb-12">
        <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Шаблоны проектов</h2>
          <div className="flex gap-2">
            <Button
              variant={templateRole === 'client' ? 'default' : 'outline'}
              onClick={() => setTemplateRole('client')}
            >
              Клиенты
            </Button>
            <Button
              variant={templateRole === 'supplier' ? 'default' : 'outline'}
              onClick={() => setTemplateRole('supplier')}
            >
              Поставщики
            </Button>
            <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => router.push('/dashboard/create-project?mode=template&role=client')}
              >
                <Plus size={16} />
                Создать шаблон
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingTemplates && !isLoaded ? (
            <div className="col-span-full text-center text-muted-foreground py-8">Загрузка шаблонов...</div>
          ) : errorTemplates ? (
            <div className="col-span-full text-center text-red-500 py-8">Ошибка: {errorTemplates}</div>
          ) : filteredTemplates && filteredTemplates.length > 0 ? (
            filteredTemplates.map((template: any, index: number) => (
              <motion.div
                key={template.id}
                variants={itemVariants}
                custom={index}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="overflow-hidden h-full bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 h-full flex flex-col">
                    <motion.h3
                      className="text-lg font-semibold mb-2 text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      {template.name || 'Без названия'}
                    </motion.h3>
                    <motion.p
                      className="text-muted-foreground text-sm mb-6 flex-grow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      {template.description || ''}
                    </motion.p>
                    <motion.div
                      className="flex justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProjectTemplate(template.id)}
                          disabled={isDeleting}
                          className="border-border hover:border-border/80"
                        >
                          {isDeleting ? "Удаляем..." : "Удалить"}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          onClick={() => {
                            window.location.href = `/dashboard/create-project?templateId=${template.id}`;
                          }}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                          <Plus size={16} className="mr-1" />
                          Создать проект
                        </Button>
                      </motion.div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="col-span-full overflow-hidden bg-card border-border shadow-lg">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground py-8">Нет сохраненных шаблонов</p>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={() => router.push('/dashboard/create-project?mode=template&role=client')}
                >
                  <Plus size={16} className="mr-2" />
                  Создать первый шаблон
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>

      {/* Статистика и виджеты */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <motion.h2 variants={itemVariants} className="text-2xl font-semibold mb-6 text-foreground">
          Статистика
        </motion.h2>
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div variants={itemVariants} custom={0} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2 text-foreground">Активные проекты</h3>
                <motion.p
                  className="text-3xl font-bold text-blue-500"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.5,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {projects ? projects.filter((p) => p.status !== "completed" && p.status !== "rejected").length : 0}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants} custom={1} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2 text-foreground">Ожидающие проекты</h3>
                <motion.p
                  className="text-3xl font-bold text-amber-500"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.6,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {/* Только проекты, где клиент ждёт одобрения менеджера в Telegram */}
                  {projects ? projects.filter((p) => ["waiting_approval", "waiting_receipt"].includes(p.status)).length : 0}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants} custom={2} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2 text-foreground">Завершенные проекты</h3>
                <motion.p
                  className="text-3xl font-bold text-green-500"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.7,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {projects ? projects.filter((p) => p.status === "completed").length : 0}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants} custom={3} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Card className="bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-2 text-foreground">Отклонённые проекты</h3>
                <motion.p
                  className="text-3xl font-bold text-red-500"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.8,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {/* Учитываем все отклонённые статусы */}
                  {projects ? projects.filter((p) => ["rejected", "receipt_rejected"].includes(p.status)).length : 0}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Диагностическая панель */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="mt-8"
      >
        <Card className="bg-red-900/20 border-red-800 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-400">🔍 Диагностика загрузки данных</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-foreground">Пользователь:</div>
                <div className={debugInfo.userLoaded ? 'text-green-400' : 'text-yellow-400'}>
                  {debugInfo.userLoaded ? (debugInfo.user ? '✅ Загружен' : '❌ Не найден') : '⏳ Загрузка...'}
                </div>
                {debugInfo.user && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ID: {debugInfo.user.id?.substring(0, 8)}...
                  </div>
                )}
              </div>
              
              <div>
                <div className="font-medium text-foreground">Проекты:</div>
                <div className={debugInfo.projectsLoaded ? 'text-green-400' : 'text-yellow-400'}>
                  {debugInfo.projectsLoaded ? `✅ Загружено (${projects.length})` : '⏳ Загрузка...'}
                </div>
                {debugInfo.projectsError && (
                  <div className="text-xs text-red-400 mt-1">
                    Ошибка: {debugInfo.projectsError}
                  </div>
                )}
              </div>
              
              <div>
                <div className="font-medium text-foreground">Шаблоны:</div>
                <div className={!loadingTemplates ? 'text-green-400' : 'text-yellow-400'}>
                  {!loadingTemplates ? `✅ Загружено (${templates.length})` : '⏳ Загрузка...'}
                </div>
                {errorTemplates && (
                  <div className="text-xs text-red-400 mt-1">
                    Ошибка: {errorTemplates}
                  </div>
                )}
              </div>
              
              <div>
                <div className="font-medium text-foreground">Supabase:</div>
                <div className="text-green-400">✅ Подключен</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Клиент инициализирован
                </div>
              </div>
            </div>
            
            {(debugInfo.projectsError || errorTemplates) && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded">
                <div className="font-medium text-red-400 mb-2">Возможные причины проблем:</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Пользователь не авторизован или сессия истекла</li>
                  <li>• Нет прав доступа к таблицам projects или project_templates</li>
                  <li>• RLS политики блокируют доступ к данным</li>
                  <li>• Проблемы с подключением к Supabase</li>
                  <li>• TypeScript ошибки в типах данных</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Динамический импорт для отключения SSR
const DashboardPage = dynamic(() => Promise.resolve(DashboardPageContent), {
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

export default DashboardPage
