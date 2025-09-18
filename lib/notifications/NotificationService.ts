import { ProjectStatus } from '@/lib/types/project-status'
import { SMSService } from './SMSService'

export type NotificationType = 'telegram' | 'push' | 'sms' | 'email'

export interface NotificationChannel {
  type: NotificationType
  enabled: boolean
  config?: Record<string, any>
}

export interface NotificationRecipient {
  id: string
  name: string
  email?: string
  phone?: string
  telegramChatId?: string
  role: 'client' | 'manager' | 'supplier'
  preferences: {
    channels: NotificationChannel[]
    criticalOnly: boolean
    timezone: string
  }
}

export interface NotificationPayload {
  id: string
  type: 'project_status_change' | 'payment_reminder' | 'deadline_warning' | 'accreditation_request'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  projectId?: string
  data?: Record<string, any>
  scheduledAt?: Date
  expiresAt?: Date
}

export interface NotificationResult {
  success: boolean
  channel: NotificationType
  recipientId: string
  messageId?: string
  error?: string
  sentAt: Date
}

/**
 * 🔔 ГЛАВНЫЙ СЕРВИС УПРАВЛЕНИЯ УВЕДОМЛЕНИЯМИ
 * 
 * Поддерживает:
 * - Telegram (уже реализован)
 * - Push уведомления
 * - SMS через SMS.ru
 * - Email (будущее расширение)
 * 
 * Автоматические уведомления на критичных этапах проекта
 */
export class NotificationService {
  private static instance: NotificationService
  private channels: Map<NotificationType, NotificationChannel> = new Map()

  constructor() {
    this.initializeChannels()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private initializeChannels() {
    // Telegram - уже реализован
    this.channels.set('telegram', {
      type: 'telegram',
      enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      config: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
      }
    })

    // Push уведомления
    this.channels.set('push', {
      type: 'push',
      enabled: !!process.env.VAPID_PUBLIC_KEY,
      config: {
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
        vapidEmail: process.env.VAPID_EMAIL
      }
    })

    // SMS через SMS.ru
    this.channels.set('sms', {
      type: 'sms',
      enabled: !!process.env.SMS_RU_API_ID,
      config: {
        apiId: process.env.SMS_RU_API_ID,
        from: process.env.SMS_RU_FROM || 'Get2B'
      }
    })
  }

  /**
   * 🎯 ОТПРАВКА УВЕДОМЛЕНИЯ ПРОЕКТА ПО СТАТУСУ
   */
  async sendProjectStatusNotification(
    projectId: string,
    oldStatus: ProjectStatus,
    newStatus: ProjectStatus,
    projectData: any,
    recipients: NotificationRecipient[]
  ): Promise<NotificationResult[]> {
    const notification = this.createStatusChangeNotification(
      projectId,
      oldStatus,
      newStatus,
      projectData
    )

    const results: NotificationResult[] = []

    for (const recipient of recipients) {
      // Фильтруем получателей по критичности
      if (recipient.preferences.criticalOnly && notification.priority !== 'critical') {
        continue
      }

      // Отправляем по всем доступным каналам получателя
      for (const channel of recipient.preferences.channels) {
        if (!channel.enabled) continue

        try {
          const result = await this.sendToChannel(
            channel.type,
            recipient,
            notification
          )
          results.push(result)
        } catch (error) {
          results.push({
            success: false,
            channel: channel.type,
            recipientId: recipient.id,
            error: String(error),
            sentAt: new Date()
          })
        }
      }
    }

    return results
  }

  /**
   * 📋 СОЗДАНИЕ УВЕДОМЛЕНИЯ ПО ИЗМЕНЕНИЮ СТАТУСА
   */
  private createStatusChangeNotification(
    projectId: string,
    oldStatus: ProjectStatus,
    newStatus: ProjectStatus,
    projectData: any
  ): NotificationPayload {
    const criticalStatuses: ProjectStatus[] = [
      'waiting_approval',
      'waiting_receipt', 
      'receipt_rejected',
      'waiting_manager_receipt',
      'waiting_client_confirmation'
    ]

    const priority = criticalStatuses.includes(newStatus) ? 'critical' : 'medium'

    return {
      id: `project_${projectId}_${newStatus}_${Date.now()}`,
      type: 'project_status_change',
      priority,
      title: this.getStatusChangeTitle(newStatus, projectData),
      message: this.getStatusChangeMessage(oldStatus, newStatus, projectData),
      projectId,
      data: {
        oldStatus,
        newStatus,
        companyName: projectData.companyName,
        amount: projectData.amount,
        currency: projectData.currency
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
    }
  }

  /**
   * 🎨 ГЕНЕРАЦИЯ ЗАГОЛОВКОВ ПО СТАТУСАМ
   */
  private getStatusChangeTitle(status: ProjectStatus, projectData: any): string {
    const company = projectData.companyName || 'Проект'
    
    switch (status) {
      case 'waiting_approval':
        return `🟡 Требуется одобрение: ${company}`
      case 'waiting_receipt':
        return `🧾 Ожидание чека от клиента: ${company}`
      case 'receipt_rejected':
        return `❌ Чек отклонён: ${company}`
      case 'waiting_manager_receipt':
        return `💼 Ожидание чека от менеджера: ${company}`
      case 'waiting_client_confirmation':
        return `✅ Ожидание подтверждения: ${company}`
      case 'completed':
        return `🎉 Проект завершён: ${company}`
      default:
        return `📋 Статус проекта изменён: ${company}`
    }
  }

  /**
   * 📝 ГЕНЕРАЦИЯ СООБЩЕНИЙ ПО СТАТУСАМ  
   */
  private getStatusChangeMessage(
    oldStatus: ProjectStatus,
    newStatus: ProjectStatus, 
    projectData: any
  ): string {
    const company = projectData.companyName || 'Неизвестная компания'
    const amount = projectData.amount ? `${projectData.amount} ${projectData.currency || 'USD'}` : ''
    
    switch (newStatus) {
      case 'waiting_approval':
        return `Проект "${company}" (${amount}) отправлен на одобрение менеджеру. Требуется проверка спецификации и одобрение для перехода к оплате.`
      
      case 'waiting_receipt':
        return `Проект "${company}" одобрен! Клиент должен загрузить чек об оплате на сумму ${amount}. Ожидаем подтверждение оплаты.`
      
      case 'receipt_rejected':
        return `⚠️ Чек по проекту "${company}" отклонён менеджером. Клиент должен загрузить корректный чек об оплате ${amount}.`
      
      case 'waiting_manager_receipt':
        return `💰 Оплата от "${company}" (${amount}) подтверждена. Менеджер должен загрузить чек о переводе поставщику.`
      
      case 'waiting_client_confirmation':
        return `📋 Чек менеджера по проекту "${company}" загружен. Ожидаем финальное подтверждение от клиента.`
      
      case 'completed':
        return `🎉 Проект "${company}" (${amount}) успешно завершён! Все этапы пройдены, оплаты проведены.`
      
      default:
        return `Статус проекта "${company}" изменён с "${oldStatus}" на "${newStatus}".`
    }
  }

  /**
   * 📤 ОТПРАВКА В КОНКРЕТНЫЙ КАНАЛ
   */
  private async sendToChannel(
    channelType: NotificationType,
    recipient: NotificationRecipient,
    notification: NotificationPayload
  ): Promise<NotificationResult> {
    switch (channelType) {
      case 'telegram':
        return this.sendTelegramNotification(recipient, notification)
      case 'push':
        return this.sendPushNotification(recipient, notification)
      case 'sms':
        return this.sendSMSNotification(recipient, notification)
      default:
        throw new Error(`Unsupported channel type: ${channelType}`)
    }
  }

  /**
   * 📱 ОТПРАВКА В TELEGRAM
   */
  private async sendTelegramNotification(
    recipient: NotificationRecipient,
    notification: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      const channel = this.channels.get('telegram')
      if (!channel?.enabled || !channel.config) {
        throw new Error('Telegram channel not configured')
      }

      // Формируем кнопки действий для критичных уведомлений
      const actions = this.getTelegramActions(notification)
      
      const url = `https://api.telegram.org/bot${channel.config.botToken}/sendMessage`
      const payload = {
        chat_id: recipient.telegramChatId || channel.config.chatId,
        text: `${notification.title}\n\n${notification.message}`,
        reply_markup: actions ? { inline_keyboard: actions } : undefined,
        parse_mode: 'HTML'
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`Telegram API error: ${result.description}`)
      }

      return {
        success: true,
        channel: 'telegram',
        recipientId: recipient.id,
        messageId: result.result.message_id.toString(),
        sentAt: new Date()
      }
    } catch (error) {
      return {
        success: false,
        channel: 'telegram',
        recipientId: recipient.id,
        error: String(error),
        sentAt: new Date()
      }
    }
  }

  /**
   * 🔔 ОТПРАВКА PUSH УВЕДОМЛЕНИЯ
   */
  private async sendPushNotification(
    recipient: NotificationRecipient,
    notification: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      // TODO: Реализовать получение push subscription из базы данных по recipient.id
      // Пока используем заглушку
      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/mock',
        keys: {
          p256dh: 'mock-p256dh-key',
          auth: 'mock-auth-key'
        }
      }

      const pushPayload = {
        title: notification.title,
        body: notification.message,
        icon: '/favicon-192x192.png',
        tag: `project_${notification.projectId}`,
        data: notification.data,
        requireInteraction: notification.priority === 'critical'
      }

      // Имитируем отправку (пока web-push не установлен)
      console.log('📱 Push уведомление (симуляция):', {
        recipient: recipient.name,
        title: pushPayload.title,
        body: pushPayload.body
      })

      return {
        success: true,
        channel: 'push',
        recipientId: recipient.id,
        messageId: `push_${Date.now()}`,
        sentAt: new Date()
      }

    } catch (error) {
      return {
        success: false,
        channel: 'push',
        recipientId: recipient.id,
        error: String(error),
        sentAt: new Date()
      }
    }
  }

  /**
   * 💬 ОТПРАВКА SMS
   */
  private async sendSMSNotification(
    recipient: NotificationRecipient,
    notification: NotificationPayload
  ): Promise<NotificationResult> {
    try {
      if (!recipient.phone) {
        throw new Error('Recipient phone number not provided')
      }

      const smsService = SMSService.getInstance()
      
      if (!smsService.isEnabled()) {
        throw new Error('SMS service not configured')
      }

      // Создаем SMS сообщение для конкретного статуса
      const smsMessage = smsService.createProjectSMS(
        notification.projectId || '',
        notification.data?.newStatus || '',
        notification.data,
        recipient.role
      )

      // Отправляем SMS
      const result = await smsService.sendSMS(recipient.phone, smsMessage)

      if (result.success) {
        console.log('✅ SMS отправлено:', {
          phone: recipient.phone,
          smsId: result.sms_id,
          balance: result.balance
        })

        return {
          success: true,
          channel: 'sms',
          recipientId: recipient.id,
          messageId: result.sms_id,
          sentAt: new Date()
        }
      } else {
        throw new Error(result.error || 'SMS sending failed')
      }

    } catch (error) {
      console.error('❌ Ошибка отправки SMS:', error)
      return {
        success: false,
        channel: 'sms',
        recipientId: recipient.id,
        error: String(error),
        sentAt: new Date()
      }
    }
  }

  /**
   * 🎮 ГЕНЕРАЦИЯ TELEGRAM КНОПОК
   */
  private getTelegramActions(notification: NotificationPayload): any[] | null {
    if (!notification.projectId) return null

    switch (notification.data?.newStatus) {
      case 'waiting_approval':
        return [
          [
            { text: '✅ Одобрить проект', callback_data: `approve_project_${notification.projectId}` },
            { text: '❌ Отклонить проект', callback_data: `reject_project_${notification.projectId}` }
          ],
          [
            { text: '📋 Посмотреть проект', url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/project/${notification.projectId}` }
          ]
        ]
      
      case 'receipt_rejected':
        return [
          [
            { text: '📋 Открыть проект', url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/project/${notification.projectId}` }
          ]
        ]

      default:
        return [
          [
            { text: '📋 Открыть проект', url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/project/${notification.projectId}` }
          ]
        ]
    }
  }

  /**
   * ✅ ПРОВЕРКА ДОСТУПНОСТИ КАНАЛОВ
   */
  getAvailableChannels(): NotificationType[] {
    return Array.from(this.channels.entries())
      .filter(([_, channel]) => channel.enabled)
      .map(([type, _]) => type)
  }

  /**
   * 📊 СТАТИСТИКА УВЕДОМЛЕНИЙ
   */
  async getNotificationStats(projectId?: string): Promise<{
    total: number
    successful: number
    failed: number
    byChannel: Record<NotificationType, number>
  }> {
    // TODO: Реализовать сбор статистики из БД
    return {
      total: 0,
      successful: 0,
      failed: 0,
      byChannel: {
        telegram: 0,
        push: 0,
        sms: 0,
        email: 0
      }
    }
  }
} 