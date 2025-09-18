import { NextRequest, NextResponse } from 'next/server'
import { NotificationService, type NotificationRecipient } from '@/lib/notifications/NotificationService'
import { ProjectStatus } from '@/lib/types/project-status'

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 API /notifications/project-status вызван')

    const body = await request.json()
    console.log('📦 Тело запроса:', body)

    const { 
      projectId, 
      oldStatus, 
      newStatus, 
      projectData,
      recipients 
    } = body

    // Валидация обязательных полей
    if (!projectId || !newStatus || !projectData) {
      console.error('❌ Не все обязательные поля переданы')
      return NextResponse.json({ 
        error: 'projectId, newStatus, and projectData are required' 
      }, { status: 400 })
    }

    // Инициализируем сервис уведомлений
    const notificationService = NotificationService.getInstance()

    // Получаем список доступных каналов
    const availableChannels = notificationService.getAvailableChannels()
    console.log('📡 Доступные каналы:', availableChannels)

    if (availableChannels.length === 0) {
      console.warn('⚠️ Нет доступных каналов уведомлений')
      return NextResponse.json({ 
        success: true, 
        skipped: true,
        message: 'No notification channels configured' 
      })
    }

    // Подготавливаем получателей или используем дефолтные
    const finalRecipients: NotificationRecipient[] = recipients || getDefaultRecipients(newStatus, availableChannels)

    console.log('👥 Получатели уведомлений:', finalRecipients.length)

    // Отправляем уведомления
    const results = await notificationService.sendProjectStatusNotification(
      projectId,
      oldStatus as ProjectStatus,
      newStatus as ProjectStatus,
      projectData,
      finalRecipients
    )

    // Анализируем результаты
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`✅ Отправлено успешно: ${successCount}/${results.length}`)
    if (failureCount > 0) {
      console.warn(`❌ Неудачные отправки: ${failureCount}`)
      console.log('Ошибки:', results.filter(r => !r.success).map(r => ({ channel: r.channel, error: r.error })))
    }

    return NextResponse.json({
      success: true,
      results,
      stats: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        channels: availableChannels
      }
    })

  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error)
    return NextResponse.json({ 
      error: 'Failed to send notifications',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * 👥 ДЕФОЛТНЫЕ ПОЛУЧАТЕЛИ ПО СТАТУСАМ
 */
function getDefaultRecipients(
  newStatus: ProjectStatus, 
  availableChannels: string[]
): NotificationRecipient[] {
  const recipients: NotificationRecipient[] = []

  // Менеджер - получает все критичные уведомления
  if (['waiting_approval', 'waiting_manager_receipt', 'receipt_rejected'].includes(newStatus)) {
    recipients.push({
      id: 'manager-default',
      name: 'Менеджер Get2B',
      role: 'manager',
      preferences: {
        channels: availableChannels.map(type => ({ 
          type: type as any, 
          enabled: true 
        })),
        criticalOnly: false,
        timezone: 'Europe/Moscow'
      }
    })
  }

  // Клиент - получает уведомления о своих проектах
  if (['waiting_receipt', 'receipt_rejected', 'waiting_client_confirmation', 'completed'].includes(newStatus)) {
    recipients.push({
      id: 'client-default',
      name: 'Клиент',
      role: 'client',
      preferences: {
        channels: availableChannels.map(type => ({ 
          type: type as any, 
          enabled: true 
        })),
        criticalOnly: true, // Только критичные уведомления
        timezone: 'Europe/Moscow'
      }
    })
  }

  return recipients
}

/**
 * 📊 GET: Получение статистики уведомлений
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const notificationService = NotificationService.getInstance()
    
    // Получаем статистику
    const stats = await notificationService.getNotificationStats(projectId || undefined)
    
    // Получаем доступные каналы
    const availableChannels = notificationService.getAvailableChannels()

    return NextResponse.json({
      success: true,
      stats,
      availableChannels,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Ошибка получения статистики уведомлений:', error)
    return NextResponse.json({ 
      error: 'Failed to get notification stats' 
    }, { status: 500 })
  }
} 