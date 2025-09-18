import { TelegramService } from './TelegramService';

/**
 * 💬 ЧАТ БОТ SERVICE  
 * Сервис для операций чат-бота (@get2b_chathub_bot)
 * Функции: уведомления о чат-сообщениях, быстрые ответы
 */

export class ChatBotService {
  private telegramService: TelegramService;
  private managerChatId: string;

  constructor() {
    const chatBotToken = process.env.TELEGRAM_CHAT_BOT_TOKEN;
    const managerChatId = process.env.TELEGRAM_CHAT_ID;

    if (!chatBotToken) {
      throw new Error("❌ TELEGRAM_CHAT_BOT_TOKEN не найден для чат-бота");
    }
    if (!managerChatId) {
      throw new Error("❌ TELEGRAM_CHAT_ID не найден для чат-бота");
    }

    this.telegramService = new TelegramService(chatBotToken);
    this.managerChatId = managerChatId;
  }

  /**
   * Отправляет сообщение в чат (используется для команд бота)
   */
  async sendMessage(chatId: string | number, text: string, parseMode: 'HTML' | 'Markdown' = 'Markdown') {
    console.log("💬 ChatBotService: отправка сообщения");
    
    return await this.telegramService.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true
    });
  }

  /**
   * Отправляет сообщение с кнопками
   */
  async sendMessageWithButtons(chatId: string | number, text: string, replyMarkup: any, parseMode: 'HTML' | 'Markdown' = 'Markdown') {
    console.log("💬 ChatBotService: отправка сообщения с кнопками");
    
    return await this.telegramService.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      reply_markup: replyMarkup,
      disable_web_page_preview: true
    });
  }

  async sendPhoto(chatId: string | number, photoUrl: string, caption?: string) {
    console.log("📷 ChatBotService: отправка изображения");
    return await this.telegramService.sendPhoto({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: 'Markdown'
    });
  }

  /**
   * Отправляет уведомление менеджерам о новом сообщении в проектной комнате
   */
  async notifyManagersAboutChatMessage({
    roomId,
    projectId,
    userMessage,
    userName,
    projectName,
    companyName
  }: {
    roomId: string;
    projectId: string;
    userMessage: string;
    userName?: string;
    projectName?: string;
    companyName?: string;
  }) {
    console.log("💬 ChatBotService: уведомление менеджерам о сообщении в чате");

    const text = `💬 НОВОЕ СООБЩЕНИЕ В ЧАТЕ

🆔 Проект: ${projectId}
📋 Название: ${projectName || 'Не указано'}
🏢 Компания: ${companyName || 'Не указано'}
👤 От кого: ${userName || 'Клиент'}

💭 Сообщение:
"${userMessage}"

❗️ Ответьте на это сообщение, чтобы отправить ответ клиенту в чат.`;

    // Кнопки для быстрых ответов
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "💬 Открыть чат проекта", callback_data: `open_chat_${roomId}` },
          { text: "📋 Детали проекта", callback_data: `project_details_${projectId}` }
        ],
        [
          { text: "✅ Все в порядке", callback_data: `quick_reply_${roomId}_ok` },
          { text: "❓ Нужны уточнения", callback_data: `quick_reply_${roomId}_clarify` }
        ]
      ]
    };

    return await this.telegramService.sendMessage({
      chat_id: this.managerChatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: 'HTML'
    });
  }

  /**
   * Отправляет детали проекта менеджерам
   */
  async sendProjectDetails({
    projectId,
    projectName,
    projectStatus,
    amount,
    currency,
    companyName,
    companyEmail,
    createdAt
  }: {
    projectId: string;
    projectName: string;
    projectStatus: string;
    amount?: number;
    currency?: string;
    companyName: string;
    companyEmail: string;
    createdAt: string;
  }) {
    console.log("💬 ChatBotService: отправка деталей проекта");

    const detailsText = `📋 ДЕТАЛИ ПРОЕКТА

🆔 ID: ${projectId}
📋 Название: ${projectName}
📊 Статус: ${projectStatus}
💰 Сумма: ${amount || 'Не указано'} ${currency || ''}
🏢 Компания: ${companyName}
📧 Email: ${companyEmail}
📅 Создан: ${new Date(createdAt).toLocaleDateString('ru-RU')}`;

    return await this.telegramService.sendMessage({
      chat_id: this.managerChatId,
      text: detailsText,
      parse_mode: "HTML"
    });
  }

  /**
   * Отправляет ответ на callback query
   */
  async answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
    console.log("💬 ChatBotService: ответ на callback query");
    
    return await this.telegramService.answerCallbackQuery({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert
    });
  }

  /**
   * Обрабатывает команды чат-бота
   */
  getCommandResponse(command: string, userName: string): string {
    switch (command.toLowerCase()) {
      case '/start':
        return `🤖 Добро пожаловать в Get2B ChatHub Assistant!

👋 Привет, ${userName}!

Я бот для уведомлений о сообщениях в чатах проектов Get2B, управления аккредитацией поставщиков и быстрых ответов менеджеров.

🔧 **Мои функции:**
💬 Уведомления о новых сообщениях клиентов
⭐ Управление заявками на аккредитацию
⚡ Быстрые ответы менеджеров
🔔 Алерты по проектным чатам
📊 Статистика активности чатов

📋 **Доступные команды:**
/help - Справка по командам
/status - Статус чатов и уведомлений
/projects - Список активных проектных чатов
/accredit - Заявки на аккредитацию
/mute - Отключить уведомления
/unmute - Включить уведомления

✨ Готов к работе! Жду уведомлений о новых сообщениях и заявках на аккредитацию.`;

      case '/help':
        return `❓ **Справка по Get2B ChatHub Assistant**

📋 **Основные команды:**
/start - 🚀 Запустить бота и получить инструкции
/help - ❓ Справка по командам  
/status - 📊 Статус чатов и уведомлений
/projects - 📋 Список активных проектных чатов
/mute - 🔕 Отключить уведомления
/unmute - 🔔 Включить уведомления

⭐ **Команды аккредитации:**
/accredit - Заявки на аккредитацию
/accredit_pending - Ожидающие заявки
/accredit_view <id> - Детали заявки
/accredit_approve <id> - Одобрить заявку
/accredit_reject <id> <причина> - Отклонить заявку

💬 **Как отвечать клиентам:**
1. Получите уведомление о новом сообщении
2. Просто напишите ответ в этот чат
3. Ваш ответ автоматически попадет к клиенту

🔔 **Уведомления:**
Бот присылает алерты когда клиенты пишут в проектные чаты и подают заявки на аккредитацию. Вы можете мгновенно отвечать прямо через Telegram!`;

      case '/status':
        return `📊 **Статус системы Get2B**

🔔 Уведомления: ✅ Включены
⚡ Бот статус: ✅ Активен
⭐ Аккредитация: ✅ Работает
🤖 Версия: ChatHub Assistant v1.1

💡 Используйте команды для получения подробной статистики.`;

      case '/projects':
        return `📋 **Активные проектные чаты**

💡 При новых сообщениях в этих чатах вы получите уведомления!
🔧 Функция просмотра списка проектов в разработке.`;

      case '/mute':
        return `🔕 **Уведомления отключены**

Вы больше не будете получать уведомления о новых сообщениях в чатах.

Чтобы включить обратно, используйте команду /unmute`;

      case '/unmute':
        return `🔔 **Уведомления включены**

Теперь вы будете получать уведомления о всех новых сообщениях в проектных чатах.

🎯 Готов к работе!`;

      case '/accredit':
        return `⭐ **ЗАЯВКИ НА АККРЕДИТАЦИЮ**

Используйте команды:
/accredit_pending - Показать ожидающие заявки
/accredit_view <id> - Детали заявки
/accredit_approve <id> - Одобрить заявку
/accredit_reject <id> <причина> - Отклонить заявку

💡 Пример: /accredit_view 03e0c659-5323-4394-a8c0-22f73222f3fa`;

      case '/accredit_pending':
        return `⏳ **ОЖИДАЮЩИЕ ЗАЯВКИ НА АККРЕДИТАЦИЮ**

Запрос обрабатывается... Используйте веб-интерфейс для просмотра:
https://get2b.com/dashboard/profile

💡 Или используйте /accredit_view <id> для конкретной заявки.`;

      default:
        // Проверяем команды аккредитации с параметрами
        if (command.startsWith('/accredit_view ')) {
          const applicationId = command.split(' ')[1];
          return `🔍 **ПРОСМОТР ЗАЯВКИ НА АККРЕДИТАЦИЮ**

ID: ${applicationId}

Запрос обрабатывается... Используйте веб-интерфейс:
https://get2b.com/dashboard/profile

💡 Или используйте кнопки ниже для быстрых действий.`;
        }
        
        if (command.startsWith('/accredit_approve ')) {
          const applicationId = command.split(' ')[1];
          return `✅ **ОДОБРЕНИЕ ЗАЯВКИ НА АККРЕДИТАЦИЮ**

ID: ${applicationId}

Запрос обрабатывается... Используйте веб-интерфейс:
https://get2b.com/dashboard/profile

💡 Или используйте кнопки ниже для быстрых действий.`;
        }
        
        if (command.startsWith('/accredit_reject ')) {
          const parts = command.split(' ');
          const applicationId = parts[1];
          const reason = parts.slice(2).join(' ') || 'Причина не указана';
          return `❌ **ОТКЛОНЕНИЕ ЗАЯВКИ НА АККРЕДИТАЦИЮ**

ID: ${applicationId}
Причина: ${reason}

Запрос обрабатывается... Используйте веб-интерфейс:
https://get2b.com/dashboard/profile

💡 Или используйте кнопки ниже для быстрых действий.`;
        }

        return `❓ Неизвестная команда: ${command}

Используйте /help для просмотра доступных команд.`;
    }
  }

  /**
   * Обрабатывает ответы менеджеров клиентам (УСТАРЕЛО - логика перенесена в webhook)
   */
  getManagerReplyResponse(text: string): string {
    return `✅ Ответ получен: "${text}"

⚠️ Эта функция больше не используется - логика перенесена в webhook handler.`;
  }

  /**
   * Отправляет уведомление о новой заявке на аккредитацию
   */
  async notifyAccreditationApplication({
    applicationId,
    supplierName,
    companyName,
    category,
    country,
    productsCount,
    certificatesCount,
    legalDocumentsCount
  }: {
    applicationId: string;
    supplierName: string;
    companyName: string;
    category: string;
    country: string;
    productsCount: number;
    certificatesCount: number;
    legalDocumentsCount: number;
  }) {
    console.log("⭐ ChatBotService: уведомление о новой заявке на аккредитацию");

    const text = `⭐ **НОВАЯ ЗАЯВКА НА АККРЕДИТАЦИЮ**

🏢 **Поставщик:** ${supplierName}
🏭 **Компания:** ${companyName}
📂 **Категория:** ${category}
🌍 **Страна:** ${country}

📦 **Материалы:**
• Товары: ${productsCount}
• Сертификаты: ${certificatesCount}
• Документы: ${legalDocumentsCount}

🆔 **ID заявки:** \`${applicationId}\`

❗️ **Требует рассмотрения менеджером**`;

    // Кнопки для быстрых действий
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "🔍 Просмотреть детали", callback_data: `accredit_view_${applicationId}` },
          { text: "✅ Одобрить", callback_data: `accredit_approve_${applicationId}` }
        ],
        [
          { text: "❌ Отклонить", callback_data: `accredit_reject_${applicationId}` },
          { text: "📋 Веб-интерфейс", url: "https://get2b.com/dashboard/profile" }
        ]
      ]
    };

    return await this.telegramService.sendMessage({
      chat_id: this.managerChatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: 'Markdown'
    });
  }

  /**
   * Отправляет уведомление об одобрении заявки на аккредитацию
   */
  async notifyAccreditationApproved({
    applicationId,
    supplierName,
    companyName,
    managerName
  }: {
    applicationId: string;
    supplierName: string;
    companyName: string;
    managerName: string;
  }) {
    console.log("✅ ChatBotService: уведомление об одобрении аккредитации");

    const text = `✅ **ЗАЯВКА НА АККРЕДИТАЦИЮ ОДОБРЕНА**

🏢 **Поставщик:** ${supplierName}
🏭 **Компания:** ${companyName}
👤 **Одобрил:** ${managerName}
🆔 **ID заявки:** \`${applicationId}\`

🎉 **Поставщик аккредитован и добавлен в оранжевый кабинет!**
🟠 **Теперь доступен всем пользователям в каталоге Get2B**`;

    return await this.telegramService.sendMessage({
      chat_id: this.managerChatId,
      text,
      parse_mode: 'Markdown'
    });
  }

  /**
   * Отправляет уведомление об отклонении заявки на аккредитацию
   */
  async notifyAccreditationRejected({
    applicationId,
    supplierName,
    companyName,
    managerName,
    reason
  }: {
    applicationId: string;
    supplierName: string;
    companyName: string;
    managerName: string;
    reason: string;
  }) {
    console.log("❌ ChatBotService: уведомление об отклонении аккредитации");

    const text = `❌ **ЗАЯВКА НА АККРЕДИТАЦИЮ ОТКЛОНЕНА**

🏢 **Поставщик:** ${supplierName}
🏭 **Компания:** ${companyName}
👤 **Отклонил:** ${managerName}
🆔 **ID заявки:** \`${applicationId}\`

📝 **Причина отклонения:**
${reason}

💡 **Поставщик может подать заявку повторно после исправления замечаний.**`;

    return await this.telegramService.sendMessage({
      chat_id: this.managerChatId,
      text,
      parse_mode: 'Markdown'
    });
  }

  /**
   * Формирует быстрые ответы для чата
   */
  getQuickReplyResponse(replyType: 'ok' | 'clarify'): string {
    const quickReplies = {
      ok: "✅ Спасибо за ваше сообщение! Все в порядке, продолжаем работу над проектом.",
      clarify: "❓ Спасибо за вопрос! Нам нужны дополнительные уточнения. Менеджер свяжется с вами в ближайшее время."
    };

    return quickReplies[replyType];
  }
} 