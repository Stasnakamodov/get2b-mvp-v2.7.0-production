import { TelegramService } from './TelegramService';

/**
 * 👨‍💼 МЕНЕДЖЕРСКИЙ БОТ SERVICE
 * Сервис для операций менеджерского бота (@Get2b_bot)
 * Функции: одобрение проектов, загрузка чеков
 */

export class ManagerBotService {
  private telegramService: TelegramService;
  private chatId: string;

  constructor() {
    console.log("🔧 [ManagerBotService] Инициализация...");
    console.log("🔧 [ManagerBotService] Проверяем переменные окружения...");
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    console.log("🔧 [ManagerBotService] TELEGRAM_BOT_TOKEN:", botToken ? "✅ найден" : "❌ не найден");
    console.log("🔧 [ManagerBotService] TELEGRAM_CHAT_ID:", chatId ? "✅ найден" : "❌ не найден");

    if (!botToken) {
      throw new Error("❌ TELEGRAM_BOT_TOKEN не найден для менеджерского бота");
    }
    if (!chatId) {
      throw new Error("❌ TELEGRAM_CHAT_ID не найден для менеджерского бота");
    }

    console.log("🔧 [ManagerBotService] Создаем TelegramService...");
    this.telegramService = new TelegramService(botToken);
    this.chatId = chatId;
    console.log("✅ [ManagerBotService] Инициализация завершена");
  }

  /**
   * Отправляет простое сообщение
   */
  async sendMessage(text: string) {
    console.log("👨‍💼 ManagerBotService: отправка сообщения");
    
    return await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text
    });
  }

  /**
   * Отправляет документ
   */
  async sendDocument(documentUrl: string, caption?: string) {
    console.log("👨‍💼 ManagerBotService: отправка документа");
    
    return await this.telegramService.sendDocument({
      chat_id: this.chatId,
      document: documentUrl,
      caption: caption || ""
    });
  }

  /**
   * Отправляет чек клиента с кнопками одобрения/отклонения
   */
  async sendClientReceiptApprovalRequest(documentUrl: string, caption: string, projectRequestId: string) {
    console.log("👨‍💼 [ManagerBotService] sendClientReceiptApprovalRequest вызван");
    console.log("👨‍💼 [ManagerBotService] Параметры:", { 
      documentUrl: documentUrl?.substring(0, 100) + "...",
      captionLength: caption?.length,
      projectRequestId
    });
    
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "✅ Одобрить чек клиента", callback_data: `approve_client_receipt_${projectRequestId}` },
          { text: "❌ Отклонить чек клиента", callback_data: `reject_client_receipt_${projectRequestId}` },
        ],
      ],
    };

    console.log("👨‍💼 [ManagerBotService] Отправляем документ с кнопками в Telegram...");
    const result = await this.telegramService.sendDocument({
      chat_id: this.chatId,
      document: documentUrl,
      caption: caption,
      reply_markup: replyMarkup
    });
    console.log("✅ [ManagerBotService] Документ с кнопками отправлен:", result);
    return result;
  }

  /**
   * Отправляет запрос на одобрение проекта с кнопками
   */
  async sendProjectApprovalRequest(text: string, projectId: string, type: "spec" | "receipt" | "invoice" = "spec") {
    console.log("👨‍💼 [ManagerBotService] sendProjectApprovalRequest вызван");
    console.log("👨‍💼 [ManagerBotService] Параметры:", { 
      textLength: text.length, 
      projectId, 
      type,
      chatId: this.chatId 
    });
    
    let replyMarkup;
    if (type === "receipt") {
      replyMarkup = {
        inline_keyboard: [
          [
            { text: "✅ Одобрить чек", callback_data: `approve_receipt_${projectId}` },
            { text: "❌ Отклонить чек", callback_data: `reject_receipt_${projectId}` },
          ],
        ],
      };
    } else if (type === "invoice") {
      replyMarkup = {
        inline_keyboard: [
          [
            { text: "✅ Одобрить инвойс", callback_data: `approve_invoice_${projectId}` },
            { text: "❌ Отклонить инвойс", callback_data: `reject_invoice_${projectId}` },
          ],
        ],
      };
    } else {
      replyMarkup = {
        inline_keyboard: [
          [
            { text: "✅ Одобрить проект", callback_data: `approve_project_${projectId}` },
            { text: "❌ Отклонить проект", callback_data: `reject_project_${projectId}` },
          ],
        ],
      };
    }

    console.log("👨‍💼 [ManagerBotService] Отправляем сообщение в Telegram...");
    const result = await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text,
      reply_markup: replyMarkup
    });
    console.log("✅ [ManagerBotService] Сообщение отправлено:", result);
    return result;
  }

  /**
   * Отправляет запрос на загрузку чека поставщика
   */
  async sendSupplierReceiptRequest({
    projectId,
    email,
    companyName,
    amount,
    currency,
    paymentMethod,
    requisites,
  }: {
    projectId: string;
    email: string;
    companyName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    requisites?: string;
  }) {
    console.log("👨‍💼 ManagerBotService: запрос загрузки чека поставщика");
    
    const text = `Клиент дошёл до этапа получения чека.

Проект: ${projectId}
Компания: ${companyName}
Email клиента: ${email}
Сумма: ${amount} ${currency}
Способ оплаты: ${paymentMethod}${requisites || ''}

❗️Пожалуйста, отправьте чек для клиента (фото/файл) в reply на это сообщение, чтобы загрузить его в систему. Чек будет автоматически прикреплён к проекту и станет доступен клиенту на сайте.`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: "📤 Загрузить чек для клиента", callback_data: `upload_supplier_receipt_${projectId}` }],
      ],
    };

    return await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text,
      reply_markup: replyMarkup
    });
  }

  /**
   * Отправляет запрос на подтверждение от клиента
   */
  async sendClientConfirmationRequest({
    projectId,
    email,
    companyName,
  }: {
    projectId: string;
    email: string;
    companyName: string;
  }) {
    console.log("👨‍💼 ManagerBotService: запрос подтверждения клиента");
    
    const text = `Поставщик загрузил счет-фактуру по проекту: ${projectId}
Компания: ${companyName}
Email: ${email}

Пожалуйста, ответьте на это сообщение чеком, подтверждающим отправку средств.`;

    return await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text,
      reply_markup: {
        force_reply: true,
        selective: true
      }
    });
  }

  /**
   * Отправляет уведомление о создании профиля клиента
   */
  async sendClientProfileNotification({
    userId,
    userName,
    userEmail,
    profileId,
    companyName,
    legalName,
    inn,
    kpp,
    ogrn,
    address,
    email,
    phone,
    bankName,
    bankAccount,
    corrAccount,
    bik
  }: {
    userId: string;
    userName?: string;
    userEmail?: string;
    profileId: string;
    companyName: string;
    legalName: string;
    inn: string;
    kpp: string;
    ogrn: string;
    address: string;
    email: string;
    phone: string;
    bankName: string;
    bankAccount: string;
    corrAccount: string;
    bik: string;
  }) {
    console.log("👨‍💼 ManagerBotService: уведомление о создании профиля клиента");
    
    const text = `👤 НОВЫЙ ПРОФИЛЬ КЛИЕНТА

🆔 ID пользователя: \`${userId}\`
👤 Имя: ${userName || 'Не указано'}
📧 Email: ${userEmail || 'Не указан'}

🏢 ДАННЫЕ КОМПАНИИ:
• Название: ${companyName}
• Юридическое название: ${legalName}
• ИНН: ${inn}
• КПП: ${kpp}
• ОГРН: ${ogrn}
• Адрес: ${address}

📞 КОНТАКТЫ:
• Email: ${email}
• Телефон: ${phone}

🏦 БАНКОВСКИЕ РЕКВИЗИТЫ:
• Банк: ${bankName}
• Расчетный счет: ${bankAccount}
• Корр. счет: ${corrAccount}
• БИК: ${bik}

🆔 ID профиля: \`${profileId}\`

✅ Профиль клиента создан и готов к использованию в проектах`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "👤 Просмотреть профиль", callback_data: `view_client_profile_${profileId}` },
          { text: "📋 Веб-интерфейс", url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://get2b.pro'}/dashboard/profile` }
        ],
        [
          { text: "✅ Профиль корректный", callback_data: `approve_client_profile_${profileId}` },
          { text: "❌ Требует проверки", callback_data: `review_client_profile_${profileId}` }
        ]
      ]
    };

    return await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: 'Markdown'
    });
  }

  /**
   * Отправляет уведомление о создании профиля поставщика
   */
  async sendSupplierProfileNotification({
    userId,
    userName,
    userEmail,
    profileId,
    companyName,
    category,
    country,
    city,
    description,
    contactEmail,
    contactPhone,
    website
  }: {
    userId: string;
    userName?: string;
    userEmail?: string;
    profileId: string;
    companyName: string;
    category: string;
    country: string;
    city?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  }) {
    console.log("👨‍💼 ManagerBotService: уведомление о создании профиля поставщика");
    
    const text = `🏭 НОВЫЙ ПРОФИЛЬ ПОСТАВЩИКА

🆔 ID пользователя: \`${userId}\`
👤 Имя: ${userName || 'Не указано'}
📧 Email: ${userEmail || 'Не указан'}

🏢 ДАННЫЕ КОМПАНИИ:
• Название: ${companyName}
• Категория: ${category}
• Страна: ${country}
• Город: ${city || 'Не указан'}

📝 ОПИСАНИЕ:
${description || 'Не указано'}

📞 КОНТАКТЫ:
• Email: ${contactEmail || 'Не указан'}
• Телефон: ${contactPhone || 'Не указан'}
• Сайт: ${website || 'Не указан'}

🆔 ID профиля: \`${profileId}\`

✅ Профиль поставщика создан и готов к использованию`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "🏭 Просмотреть профиль", callback_data: `view_supplier_profile_${profileId}` },
          { text: "📋 Веб-интерфейс", url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://get2b.pro'}/dashboard/profile` }
        ],
        [
          { text: "✅ Профиль корректный", callback_data: `approve_supplier_profile_${profileId}` },
          { text: "❌ Требует проверки", callback_data: `review_supplier_profile_${profileId}` }
        ]
      ]
    };

    return await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: 'Markdown'
    });
  }

  /**
   * Отправляет ответ на callback query
   */
  async answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
    console.log("👨‍💼 ManagerBotService: ответ на callback query");
    
    return await this.telegramService.answerCallbackQuery({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert
    });
  }

  /**
   * Отправляет запрос на одобрение атомарного конструктора
   */
  async sendAtomicConstructorApprovalRequest({
    text,
    requestId,
    userEmail,
    userName,
    currentStage,
    activeScenario
  }: {
    text: string;
    requestId: string;
    userEmail: string;
    userName: string;
    currentStage: number;
    activeScenario: string;
  }) {
    console.log("👨‍💼 [ManagerBotService] sendAtomicConstructorApprovalRequest вызван");
    console.log("👨‍💼 [ManagerBotService] Параметры:", { 
      requestId, 
      userEmail, 
      currentStage, 
      activeScenario,
      chatId: this.chatId 
    });
    
    // Для UUID не очищаем и не обрезаем - используем полный идентификатор
    // UUID уже содержит только допустимые символы для callback_data
    let cleanRequestId = requestId;
    
    console.log("🔧 [ManagerBotService] Очищенный requestId:", cleanRequestId);
    console.log("🔧 [ManagerBotService] callback_data для одобрения:", `approve_atomic_${cleanRequestId}`);
    console.log("🔧 [ManagerBotService] callback_data для отклонения:", `reject_atomic_${cleanRequestId}`);
    
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "✅ Одобрить", callback_data: `approve_atomic_${cleanRequestId}` },
          { text: "❌ Отклонить", callback_data: `reject_atomic_${cleanRequestId}` },
        ],
        [
          { text: "📋 Запросить изменения", callback_data: `request_changes_atomic_${cleanRequestId}` },
          { text: "🔗 Открыть в системе", url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://get2b.pro'}/dashboard/project-constructor` }
        ]
      ]
    };

    return await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text,
      reply_markup: replyMarkup
      // parse_mode удалён - используем plain text для избежания ошибок парсинга
      // Эмодзи и структура сообщения сохраняются без Markdown-форматирования
    });
  }

  /**
   * Отправляет уведомление о загрузке чека с кнопками одобрения
   */
  async sendReceiptApprovalRequest({
    projectRequestId,
    receiptUrl,
    fileName
  }: {
    projectRequestId: string;
    receiptUrl: string;
    fileName: string;
  }) {
    console.log("👨‍💼 [ManagerBotService] sendReceiptApprovalRequest вызван");
    console.log("👨‍💼 [ManagerBotService] Параметры:", { 
      projectRequestId, 
      receiptUrl,
      fileName,
      chatId: this.chatId 
    });
    
    // Для UUID не очищаем символы, только проверяем допустимость для callback_data
    // UUID уже содержит только допустимые символы (цифры, буквы, дефисы)
    let cleanRequestId = projectRequestId;
    
    console.log("🔧 [ManagerBotService] Очищенный requestId для чека:", cleanRequestId);
    console.log("🔧 [ManagerBotService] callback_data для одобрения чека:", `approve_receipt_${cleanRequestId}`);
    console.log("🔧 [ManagerBotService] callback_data для отклонения чека:", `reject_receipt_${cleanRequestId}`);
    
    const message = `📄 Чек об оплате загружен

🔗 ID запроса: ${projectRequestId}
📁 Файл: ${fileName || 'receipt'}
🔗 Ссылка: ${receiptUrl}

Пожалуйста, проверьте чек и подтвердите оплату.`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "✅ Подтвердить оплату", callback_data: `approve_receipt_${cleanRequestId}` },
          { text: "❌ Отклонить чек", callback_data: `reject_receipt_${cleanRequestId}` },
        ],
        [
          { text: "📋 Запросить новый чек", callback_data: `request_new_receipt_${cleanRequestId}` },
          { text: "🔗 Открыть в системе", url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://get2b.pro'}/dashboard/project-constructor` }
        ]
      ]
    };

    return await this.telegramService.sendMessage({
      chat_id: this.chatId,
      text: message,
      reply_markup: replyMarkup
    });
  }

  /**
   * Обрабатывает загрузку файла от пользователя
   */
  async handleFileUpload(fileId: string, fileName: string) {
    console.log("👨‍💼 ManagerBotService: обработка загрузки файла");
    
    // Получаем информацию о файле
    const fileData = await this.telegramService.getFile(fileId);
    
    if (fileData.ok) {
      const fileUrl = this.telegramService.getFileDownloadUrl(fileData.result.file_path);
      return { fileUrl, fileName };
    } else {
      throw new Error("Не удалось получить файл от Telegram");
    }
  }
} 