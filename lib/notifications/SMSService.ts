/**
 * 💬 СЕРВИС SMS УВЕДОМЛЕНИЙ
 * 
 * Интеграция с SMS.ru API для отправки SMS в России
 * Поддерживает массовую рассылку и статистику доставки
 */
export class SMSService {
  private static instance: SMSService
  private apiId: string | null
  private from: string
  private isConfigured: boolean = false

  constructor() {
    this.apiId = process.env.SMS_RU_API_ID || null
    this.from = process.env.SMS_RU_FROM || 'Get2B'
    this.isConfigured = !!this.apiId
    
    if (!this.isConfigured) {
      console.warn('⚠️ SMS.ru API_ID не настроен. SMS уведомления недоступны.')
      console.log('💡 Получите API_ID на https://sms.ru/')
    } else {
      console.log('✅ SMS сервис инициализирован')
    }
  }

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService()
    }
    return SMSService.instance
  }

  /**
   * 📤 ОТПРАВКА SMS СООБЩЕНИЯ
   */
  async sendSMS(
    phone: string,
    message: string,
    options?: {
      translit?: boolean
      test?: boolean
      partner_id?: string
    }
  ): Promise<{ success: boolean; sms_id?: string; error?: string; balance?: number }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'SMS service not configured'
      }
    }

    try {
      // Очищаем номер телефона
      const cleanPhone = this.normalizePhoneNumber(phone)
      if (!this.isValidPhoneNumber(cleanPhone)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        }
      }

      // Готовим параметры запроса
      const params = new URLSearchParams({
        api_id: this.apiId!,
        to: cleanPhone,
        msg: message,
        from: this.from,
        json: '1'
      })

      if (options?.translit) {
        params.append('translit', '1')
      }

      if (options?.test) {
        params.append('test', '1')
      }

      if (options?.partner_id) {
        params.append('partner_id', options.partner_id)
      }

      // Отправляем запрос к SMS.ru API
      const response = await fetch('https://sms.ru/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      })

      const result = await response.json()

      console.log('📱 SMS.ru API ответ:', result)

      // Обрабатываем ответ
      if (result.status === 'OK') {
        // Успешная отправка
        const smsIds = Object.keys(result.sms || {})
        const firstSmsId = smsIds[0]
        const smsInfo = result.sms?.[firstSmsId]

        if (smsInfo?.status === 'OK') {
          return {
            success: true,
            sms_id: firstSmsId,
            balance: result.balance
          }
        } else {
          return {
            success: false,
            error: `SMS error: ${smsInfo?.status_text || 'Unknown error'}`
          }
        }
      } else {
        // Ошибка отправки
        return {
          success: false,
          error: `API error: ${result.status_text || result.status}`
        }
      }

    } catch (error) {
      console.error('❌ Ошибка отправки SMS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMS error'
      }
    }
  }

  /**
   * 📋 СОЗДАНИЕ SMS ДЛЯ ПРОЕКТА
   */
  createProjectSMS(
    projectId: string,
    status: string,
    projectData: any,
    recipientRole: 'client' | 'manager' | 'supplier'
  ): string {
    const company = projectData.companyName || 'Проект'
    const amount = projectData.amount ? `${projectData.amount} ${projectData.currency || 'USD'}` : ''

    // Короткие сообщения для SMS (160 символов лимит)
    switch (status) {
      case 'waiting_approval':
        return recipientRole === 'manager'
          ? `Get2B: Требуется одобрение проекта "${company}" (${amount}). Войдите в систему для проверки.`
          : `Get2B: Ваш проект "${company}" отправлен на рассмотрение. Ожидайте одобрения.`

      case 'waiting_receipt':
        return `Get2B: Проект "${company}" одобрен! Загрузите чек об оплате ${amount} в личном кабинете.`

      case 'receipt_rejected':
        return `Get2B: Чек по проекту "${company}" отклонён. Загрузите корректный чек в личном кабинете.`

      case 'waiting_manager_receipt':
        return recipientRole === 'manager'
          ? `Get2B: Загрузите чек о переводе поставщику по проекту "${company}" (${amount}).`
          : `Get2B: Ваша оплата "${company}" подтверждена. Ожидайте чек от менеджера.`

      case 'waiting_client_confirmation':
        return `Get2B: Чек по проекту "${company}" загружен. Подтвердите завершение в личном кабинете.`

      case 'completed':
        return `Get2B: Проект "${company}" (${amount}) завершён! Спасибо за сотрудничество.`

      default:
        return `Get2B: Статус проекта "${company}" обновлён. Проверьте личный кабинет.`
    }
  }

  /**
   * 📞 НОРМАЛИЗАЦИЯ НОМЕРА ТЕЛЕФОНА
   */
  private normalizePhoneNumber(phone: string): string {
    // Убираем все нечисловые символы
    let cleaned = phone.replace(/\D/g, '')
    
    // Добавляем код России если его нет
    if (cleaned.length === 10 && cleaned.startsWith('9')) {
      cleaned = '7' + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.substring(1)
    } else if (cleaned.length === 11 && cleaned.startsWith('7')) {
      // Уже правильный формат
    } else if (cleaned.length === 10) {
      cleaned = '7' + cleaned
    }
    
    return cleaned
  }

  /**
   * ✅ ВАЛИДАЦИЯ НОМЕРА ТЕЛЕФОНА
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Российский номер: 11 цифр, начинается с 7
    return /^7\d{10}$/.test(phone)
  }

  /**
   * 📊 ПОЛУЧЕНИЕ БАЛАНСА
   */
  async getBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'SMS service not configured' }
    }

    try {
      const params = new URLSearchParams({
        api_id: this.apiId!,
        json: '1'
      })

      const response = await fetch('https://sms.ru/my/balance?' + params.toString())
      const result = await response.json()

      if (result.status === 'OK') {
        return {
          success: true,
          balance: parseFloat(result.balance)
        }
      } else {
        return {
          success: false,
          error: result.status_text || 'Failed to get balance'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 📈 СТАТИСТИКА ОТПРАВКИ
   */
  async getSMSStats(smsId: string): Promise<{
    success: boolean
    status?: string
    statusText?: string
    error?: string
  }> {
    if (!this.isConfigured) {
      return { success: false, error: 'SMS service not configured' }
    }

    try {
      const params = new URLSearchParams({
        api_id: this.apiId!,
        sms_id: smsId,
        json: '1'
      })

      const response = await fetch('https://sms.ru/sms/status?' + params.toString())
      const result = await response.json()

      if (result.status === 'OK') {
        const smsInfo = result.sms?.[smsId]
        return {
          success: true,
          status: smsInfo?.status,
          statusText: smsInfo?.status_text
        }
      } else {
        return {
          success: false,
          error: result.status_text || 'Failed to get SMS status'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
   * 📱 ТЕСТОВАЯ ОТПРАВКА
   */
  async testSMS(phone: string): Promise<{ success: boolean; error?: string }> {
    const message = 'Get2B: Тестовое SMS сообщение. Ваш номер телефона подтверждён!'
    
    const result = await this.sendSMS(phone, message, { test: true })
    
    return {
      success: result.success,
      error: result.error
    }
  }
} 