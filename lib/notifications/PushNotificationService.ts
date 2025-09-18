// import webpush from 'web-push' // TODO: Установить: npm install web-push @types/web-push

// Временная типизация для web-push (пока не установлен пакет)
declare const webpush: {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void
  sendNotification: (subscription: any, payload: string, options?: any) => Promise<{ statusCode: number }>
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
}

/**
 * 🔔 СЕРВИС PUSH УВЕДОМЛЕНИЙ
 * 
 * Использует Web Push API для отправки уведомлений в браузер
 * Поддерживает Chrome, Firefox, Safari, Edge
 */
export class PushNotificationService {
  private static instance: PushNotificationService
  private isConfigured: boolean = false

  constructor() {
    this.initializeWebPush()
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  private initializeWebPush() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidEmail = process.env.VAPID_EMAIL

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      console.warn('⚠️ VAPID ключи не настроены. Push уведомления недоступны.')
      console.log('💡 Для настройки используйте: npx web-push generate-vapid-keys')
      return
    }

    try {
      webpush.setVapidDetails(
        `mailto:${vapidEmail}`,
        vapidPublicKey,
        vapidPrivateKey
      )
      this.isConfigured = true
      console.log('✅ Web Push сервис инициализирован')
    } catch (error) {
      console.error('❌ Ошибка инициализации Web Push:', error)
    }
  }

  /**
   * 📤 ОТПРАВКА PUSH УВЕДОМЛЕНИЯ
   */
  async sendNotification(
    subscription: PushSubscription,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Push notifications not configured'
      }
    }

    try {
      // Подготавливаем payload для отправки
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/favicon-192x192.png',
        badge: payload.badge || '/favicon-96x96.png',
        tag: payload.tag || 'get2b-notification',
        data: payload.data || {},
        actions: payload.actions || [],
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        timestamp: Date.now()
      })

      // Отправляем уведомление
      const result = await webpush.sendNotification(
        subscription,
        notificationPayload,
        {
          TTL: 24 * 60 * 60, // 24 часа
          urgency: 'normal'
        }
      )

      console.log('✅ Push уведомление отправлено:', result.statusCode)

      return {
        success: true,
        messageId: `push_${Date.now()}`
      }

    } catch (error: any) {
      console.error('❌ Ошибка отправки Push уведомления:', error)

      // Обрабатываем специфичные ошибки
      if (error.statusCode === 410) {
        // Подписка недействительна
        return {
          success: false,
          error: 'Push subscription expired'
        }
      }

      if (error.statusCode === 413) {
        // Payload слишком большой
        return {
          success: false,
          error: 'Push payload too large'
        }
      }

      return {
        success: false,
        error: error.message || 'Unknown push notification error'
      }
    }
  }

  /**
   * 📱 СОЗДАНИЕ УВЕДОМЛЕНИЯ ДЛЯ ПРОЕКТА
   */
  createProjectNotification(
    projectId: string,
    status: string,
    projectData: any
  ): PushNotificationPayload {
    const company = projectData.companyName || 'Проект'
    const amount = projectData.amount ? `${projectData.amount} ${projectData.currency || 'USD'}` : ''

    switch (status) {
      case 'waiting_approval':
        return {
          title: 'Требуется одобрение 🟡',
          body: `Проект "${company}" (${amount}) ожидает одобрения`,
          icon: '/icons/approval-needed.png',
          tag: `project_${projectId}_approval`,
          data: { projectId, status, action: 'approval_needed' },
          actions: [
            { action: 'open_project', title: 'Открыть проект', icon: '/icons/open.png' },
            { action: 'approve', title: 'Одобрить', icon: '/icons/approve.png' }
          ],
          requireInteraction: true
        }

      case 'waiting_receipt':
        return {
          title: 'Ожидание чека 🧾',
          body: `Загрузите чек об оплате для "${company}" (${amount})`,
          icon: '/icons/receipt-waiting.png',
          tag: `project_${projectId}_receipt`,
          data: { projectId, status, action: 'upload_receipt' },
          actions: [
            { action: 'open_project', title: 'Загрузить чек', icon: '/icons/upload.png' }
          ],
          requireInteraction: true
        }

      case 'receipt_rejected':
        return {
          title: 'Чек отклонён ❌',
          body: `Чек по проекту "${company}" отклонён. Загрузите корректный чек.`,
          icon: '/icons/receipt-rejected.png',
          tag: `project_${projectId}_rejected`,
          data: { projectId, status, action: 'reupload_receipt' },
          actions: [
            { action: 'open_project', title: 'Исправить', icon: '/icons/fix.png' }
          ],
          requireInteraction: true
        }

      case 'waiting_manager_receipt':
        return {
          title: 'Ожидание чека от менеджера 💼',
          body: `Менеджер должен загрузить чек по проекту "${company}"`,
          icon: '/icons/manager-receipt.png',
          tag: `project_${projectId}_manager`,
          data: { projectId, status, action: 'manager_receipt_needed' },
          actions: [
            { action: 'open_project', title: 'Открыть проект', icon: '/icons/open.png' }
          ]
        }

      case 'waiting_client_confirmation':
        return {
          title: 'Ожидание подтверждения ✅',
          body: `Подтвердите завершение проекта "${company}"`,
          icon: '/icons/confirmation.png',
          tag: `project_${projectId}_confirm`,
          data: { projectId, status, action: 'client_confirmation' },
          actions: [
            { action: 'open_project', title: 'Подтвердить', icon: '/icons/confirm.png' }
          ],
          requireInteraction: true
        }

      case 'completed':
        return {
          title: 'Проект завершён 🎉',
          body: `Проект "${company}" (${amount}) успешно завершён!`,
          icon: '/icons/completed.png',
          tag: `project_${projectId}_completed`,
          data: { projectId, status, action: 'project_completed' },
          actions: [
            { action: 'open_project', title: 'Посмотреть', icon: '/icons/view.png' }
          ]
        }

      default:
        return {
          title: 'Обновление проекта 📋',
          body: `Статус проекта "${company}" изменён`,
          icon: '/icons/update.png',
          tag: `project_${projectId}_update`,
          data: { projectId, status, action: 'status_update' },
          actions: [
            { action: 'open_project', title: 'Открыть', icon: '/icons/open.png' }
          ]
        }
    }
  }

  /**
   * 🔧 ПРОВЕРКА КОНФИГУРАЦИИ
   */
  isEnabled(): boolean {
    return this.isConfigured
  }

  /**
   * 📋 ПОЛУЧЕНИЕ VAPID PUBLIC KEY
   */
  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null
  }

  /**
   * ✅ ВАЛИДАЦИЯ ПОДПИСКИ
   */
  validateSubscription(subscription: any): subscription is PushSubscription {
    return (
      subscription &&
      typeof subscription.endpoint === 'string' &&
      subscription.keys &&
      typeof subscription.keys.p256dh === 'string' &&
      typeof subscription.keys.auth === 'string'
    )
  }

  /**
   * 📊 СТАТИСТИКА ОТПРАВКИ
   */
  async getDeliveryStats(): Promise<{
    totalSent: number
    delivered: number
    failed: number
    expired: number
  }> {
    // TODO: Реализовать сбор статистики из базы данных
    return {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      expired: 0
    }
  }
} 