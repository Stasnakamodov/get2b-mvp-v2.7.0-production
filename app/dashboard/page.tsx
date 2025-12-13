"use client"

import React from "react"
import { logger } from "@/src/shared/lib/logger"
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
  ShoppingCart,
  Package,
  AlertTriangle,
  Sparkles,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
        text: 'Ожидание чека от менеджера'
      }
    }
  }
  return {
    color: '#22c55e',
    text: 'Активен'
  }
}

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to the dashboard</p>
    </div>
  )
}
