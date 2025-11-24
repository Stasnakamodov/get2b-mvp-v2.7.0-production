import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { ManagerBotService } from '@/lib/telegram/ManagerBotService'

export async function POST(request: NextRequest) {
  try {
    const {
      stepConfigs,
      manualData,
      uploadedFiles,
      user,
      currentStage
    } = await request.json()

    // Проверяем авторизацию
    if (!user?.id) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
    }

    // Создаем уникальный ID для запроса (короткий для Telegram)
    const requestId = `atomic${Date.now()}`
    
    // Формируем сообщение для менеджера
    const message = formatAtomicConstructorMessage({
      stepConfigs,
      manualData,
      uploadedFiles,
      user,
      currentStage,
      requestId
    })

    // Отправляем в Telegram
    const managerBot = new ManagerBotService()
    await managerBot.sendAtomicConstructorApprovalRequest({
      text: message,
      requestId,
      userEmail: user.email,
      userName: user.user_metadata?.full_name || user.email,
      currentStage,
      activeScenario: stepConfigs?.activeScenario || 'quick'
    })

    // Сохраняем запрос в базе данных
    await saveAtomicConstructorRequest({
      requestId,
      userId: user.id,
      userEmail: user.email,
      stepConfigs,
      manualData,
      uploadedFiles,
      currentStage
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Данные отправлены менеджеру',
      requestId 
    })

  } catch (error) {
    console.error('❌ [Atomic Constructor] Ошибка отправки менеджеру:', error)
    return NextResponse.json(
      { error: 'Ошибка отправки данных менеджеру' },
      { status: 500 }
    )
  }
}

function formatAtomicConstructorMessage({
  stepConfigs,
  manualData,
  uploadedFiles,
  user,
  currentStage,
  requestId
}: {
  stepConfigs: Record<number, string>
  manualData: Record<number, any>
  uploadedFiles: Record<number, string>
  user: any
  currentStage: number
  requestId: string
}) {
  const stageNames = {
    1: 'Подготовка данных',
    2: 'Подготовка инфраструктуры',
    3: 'Анимация сделки'
  }

  // Plain text без Markdown (** и ` удалены), эмодзи сохранены
  let message = `🚀 НОВЫЙ АТОМАРНЫЙ КОНСТРУКТОР\n\n`
  message += `📋 ID запроса: ${requestId}\n`
  message += `👤 Пользователь: ${user.email}\n`
  message += `📊 Этап: ${stageNames[currentStage as keyof typeof stageNames]}\n\n`

  // Шаг 1: Данные компании
  if (manualData[1]) {
    message += `🏢 ШАГ 1: ДАННЫЕ КОМПАНИИ\n`
    message += `📝 Источник: ${getSourceDisplayName(stepConfigs[1])}\n`
    message += `🏛️ Название: ${manualData[1].name || 'Не указано'}\n`
    message += `📄 ИНН: ${manualData[1].inn || 'Не указано'}\n`
    message += `🏦 Банк: ${manualData[1].bankName || 'Не указано'}\n`
    message += `💳 Счет: ${manualData[1].bankAccount || 'Не указано'}\n\n`
  }

  // Шаг 2: Спецификация товаров
  if (manualData[2]) {
    message += `📦 ШАГ 2: СПЕЦИФИКАЦИЯ ТОВАРОВ\n`
    message += `📝 Источник: ${getSourceDisplayName(stepConfigs[2])}\n`
    message += `🏢 Поставщик: ${manualData[2].supplier || 'Не указано'}\n`
    message += `💰 Валюта: ${manualData[2].currency || 'Не указано'}\n`
    message += `📊 Позиций: ${manualData[2].items?.length || 0}\n`

    if (manualData[2].items && manualData[2].items.length > 0) {
      const totalQuantity = manualData[2].items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)
      const totalAmount = manualData[2].items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0)
      message += `📈 Общее количество: ${totalQuantity} шт\n`
      message += `💵 Общая сумма: ${totalAmount} ${manualData[2].currency || 'RUB'}\n`
    }
    message += `\n`
  }

  // Шаг 4: Способ оплаты
  if (manualData[4]) {
    message += `💳 ШАГ 4: СПОСОБ ОПЛАТЫ\n`
    message += `📝 Источник: ${getSourceDisplayName(stepConfigs[4])}\n`
    message += `🏢 Поставщик: ${manualData[4].supplier || 'Не указано'}\n`
    message += `💳 Метод: ${getPaymentMethodName(manualData[4].method)}\n\n`
  }

  // Шаг 5: Реквизиты
  if (manualData[5]) {
    message += `🏦 ШАГ 5: РЕКВИЗИТЫ\n`
    message += `📝 Источник: ${getSourceDisplayName(stepConfigs[5])}\n`
    message += `🏢 Получатель: ${manualData[5].recipientName || 'Не указано'}\n`
    message += `🏦 Банк: ${manualData[5].bankName || 'Не указано'}\n`
    message += `💳 Счет: ${manualData[5].accountNumber || 'Не указано'}\n`
    message += `🌐 SWIFT: ${manualData[5].swift || 'Не указано'}\n\n`
  }

  // Загруженные файлы
  const filesList = Object.entries(uploadedFiles)
    .filter(([_, url]) => url)
    .map(([stepId, url]) => `Шаг ${stepId}: ${url}`)
    .join('\n')

  if (filesList) {
    message += `📎 ЗАГРУЖЕННЫЕ ФАЙЛЫ:\n${filesList}\n\n`
  }

  message += `⏰ Время отправки: ${new Date().toLocaleString('ru-RU')}\n`
  message += `🔗 Ссылка на проект: https://get2b.ru/dashboard/project-constructor`

  return message
}

function getSourceDisplayName(source: string): string {
  const sourceNames: Record<string, string> = {
    'profile': 'Профиль',
    'template': 'Шаблон',
    'catalog': 'Каталог',
    'echo': 'Эхо данные',
    'manual': 'Вручную',
    'upload': 'Загрузить (OCR)',
    'automatic': 'Автоматически'
  }
  return sourceNames[source] || source
}

function getPaymentMethodName(method: string): string {
  const methodNames: Record<string, string> = {
    'bank-transfer': 'Банковский перевод',
    'p2p': 'P2P платеж',
    'crypto': 'Криптовалюта'
  }
  return methodNames[method] || method
}

async function saveAtomicConstructorRequest({
  requestId,
  userId,
  userEmail,
  stepConfigs,
  manualData,
  uploadedFiles,
  currentStage
}: {
  requestId: string
  userId: string
  userEmail: string
  stepConfigs: Record<number, string>
  manualData: Record<number, any>
  uploadedFiles: Record<number, string>
  currentStage: number
}) {
  // Фиксированные значения для атомарного конструктора
  const initiatorRole = 'client' // По умолчанию клиент для атомарного конструктора
  const startMethod = 'upload' // для атомарного конструктора всегда upload

  // Извлекаем данные Step1 (компания) и Step2 (спецификация) из manualData
  const companyData = manualData[1] || {}
  const supplierData = manualData[2]?.supplier ? { supplier: manualData[2].supplier } : {}
  const stepsData = {
    step1: manualData[1],
    step2: manualData[2],
    step4: manualData[4],
    step5: manualData[5]
  }

  const { error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: `Атомарный проект ${requestId}`,
      status: 'draft',
      initiator_role: initiatorRole,
      start_method: startMethod,
      current_step: 1,
      max_step_reached: 1,
      constructor_type: 'atomic',
      atomic_stage: currentStage,
      atomic_scenario: 'none', // Сценарии удалены, используем 'none'
      atomic_step_configs: stepConfigs,
      atomic_manual_data: manualData,
      atomic_uploaded_files: uploadedFiles,
      atomic_request_id: requestId,
      atomic_moderation_status: 'pending',
      // Используем существующие поля
      company_data: companyData,
      supplier_data: supplierData,
      steps: stepsData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('❌ Ошибка сохранения атомарного проекта:', error)
    throw error
  }
} 