import { ManagerBotService } from './ManagerBotService'

/**
 * Сервис уведомлений для режима сценариев
 * Использует существующий ManagerBotService для отправки в Telegram
 */

export type ScenarioNotificationType = 'scenario_created' | 'scenario_selected' | 'scenario_frozen'

interface ScenarioNotificationPayload {
  scenarioName: string
  scenarioId: string
  projectId: string
  creatorRole: 'client' | 'manager' | 'supplier'
  branchedAtStep?: number
  creatorName?: string
}

const roleLabels: Record<string, string> = {
  client: 'Клиент',
  manager: 'Менеджер',
  supplier: 'Поставщик',
}

const stepLabels: Record<number, string> = {
  1: 'Компания',
  2: 'Спецификация',
  3: 'Банк. реквизиты',
  4: 'Способ оплаты',
  5: 'Реквизиты',
  6: 'Документы',
  7: 'Контакты',
}

export class ScenarioNotificationService {
  private managerBot: ManagerBotService

  constructor() {
    this.managerBot = new ManagerBotService()
  }

  async sendNotification(
    type: ScenarioNotificationType,
    payload: ScenarioNotificationPayload
  ): Promise<{ success: boolean; messageId?: string }> {
    try {
      const message = this.formatMessage(type, payload)
      const result = await this.managerBot.sendMessage(message)

      return {
        success: true,
        messageId: result?.result?.message_id?.toString(),
      }
    } catch (error) {
      console.error(`Ошибка отправки уведомления сценария (${type}):`, error)
      return { success: false }
    }
  }

  private formatMessage(
    type: ScenarioNotificationType,
    payload: ScenarioNotificationPayload
  ): string {
    const role = roleLabels[payload.creatorRole] || payload.creatorRole
    const stepLabel = payload.branchedAtStep
      ? stepLabels[payload.branchedAtStep] || `Шаг ${payload.branchedAtStep}`
      : ''

    switch (type) {
      case 'scenario_created':
        return [
          `🌿 Новая ветка сценария`,
          ``,
          `Название: ${payload.scenarioName}`,
          `Создал: ${payload.creatorName || role} (${role})`,
          payload.branchedAtStep ? `Шаг ветвления: ${payload.branchedAtStep} (${stepLabel})` : '',
          `Проект: ${payload.projectId}`,
        ].filter(Boolean).join('\n')

      case 'scenario_selected':
        return [
          `✅ Сценарий выбран`,
          ``,
          `Название: ${payload.scenarioName}`,
          `Выбрал: ${payload.creatorName || role} (${role})`,
          `Проект: ${payload.projectId}`,
          ``,
          `Остальные сценарии заморожены.`,
        ].filter(Boolean).join('\n')

      case 'scenario_frozen':
        return [
          `❄️ Сценарий заморожен`,
          ``,
          `Название: ${payload.scenarioName}`,
          `Проект: ${payload.projectId}`,
        ].filter(Boolean).join('\n')

      default:
        return `Уведомление сценария: ${type} — ${payload.scenarioName}`
    }
  }
}
