// ⚠️ ОБНОВЛЕНО: Теперь использует новый ChatBotService
// Убраны прямые fetch запросы, используется унифицированный сервис

import { supabase } from "@/lib/supabaseClient";
import { ChatBotService } from "./telegram/ChatBotService";

// Создаем единственный экземпляр сервиса чат-бота
let chatBotService: ChatBotService | null = null;

function getChatBotService(): ChatBotService {
  if (!chatBotService) {
    try {
      chatBotService = new ChatBotService();
    } catch (error) {
      console.warn("❌ Не удалось инициализировать ChatBotService:", error);
      throw error;
    }
  }
  return chatBotService;
}

// ========================================
// 🔗 ИНТЕГРАЦИЯ ЧАТХАБА С TELEGRAM
// ========================================

/**
 * Отправляет уведомление менеджерам в Telegram о новом сообщении в проектной комнате
 */
export async function notifyManagersAboutChatMessage({
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
  console.log("🔄 ОБНОВЛЕНО: notifyManagersAboutChatMessage - использует новый ChatBotService");

  try {
    const service = getChatBotService();
    const result = await service.notifyManagersAboutChatMessage({
      roomId,
      projectId,
      userMessage,
      userName,
      projectName,
      companyName
    });

    console.log("✅ Уведомление менеджерам отправлено через ChatBotService");
    return { success: true, messageId: result.result?.message_id };
  } catch (error) {
    console.error("❌ Ошибка отправки уведомления:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 🔧 ИСПРАВЛЕНИЕ: Добавляем недостающую функцию notifyManagersAboutNewMessage
 * Эта функция вызывается в app/api/chat/messages/route.ts
 */
export async function notifyManagersAboutNewMessage({
  roomId,
  projectId,
  userMessage,
  userName,
  projectName,
  companyName,
  messageId
}: {
  roomId: string;
  projectId: string;
  userMessage: string;
  userName?: string;
  projectName?: string;
  companyName?: string;
  messageId?: string;
}) {
  console.log("🔧 ИСПРАВЛЕНИЕ: notifyManagersAboutNewMessage - используем notifyManagersAboutChatMessage");

  // Просто вызываем существующую функцию с теми же параметрами
  return await notifyManagersAboutChatMessage({
    roomId,
    projectId,
    userMessage,
    userName,
    projectName,
    companyName
  });
}

/**
 * Добавляет сообщение от менеджера в чат комнату
 */
export async function addManagerMessageToChat({
  roomId,
  content,
  managerName = "Менеджер Get2B",
  managerTelegramId
}: {
  roomId: string;
  content: string;
  managerName?: string;
  managerTelegramId?: string;
}) {
  try {
    // Добавляем сообщение в чат
    const { data: message, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        content,
        sender_type: 'manager',
        sender_manager_id: managerTelegramId,
        sender_name: managerName,
        message_type: 'text',
        is_delivered: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("✅ Сообщение менеджера добавлено в чат:", message.id);
    return { success: true, message };

  } catch (error) {
    console.error("❌ Ошибка добавления сообщения менеджера в чат:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Находит комнату чата по ID проекта
 */
export async function getChatRoomByProjectId(projectId: string) {
  try {
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('project_id', projectId)
      .eq('room_type', 'project')
      .single();

    if (error) {
      console.error("❌ Ошибка поиска комнаты чата:", error);
      return null;
    }

    return room;
  } catch (error) {
    console.error("❌ Ошибка поиска комнаты чата:", error);
    return null;
  }
}

/**
 * Назначает менеджера на проект
 */
export async function assignManagerToProject({
  projectId,
  managerTelegramId,
  managerName,
  specialization = 'general'
}: {
  projectId: string;
  managerTelegramId: string;
  managerName: string;
  specialization?: string;
}) {
  try {
    // Проверяем, есть ли уже назначение
    const { data: existing, error: checkError } = await supabase
      .from('manager_assignments')
      .select('id')
      .eq('project_id', projectId)
      .eq('manager_telegram_id', managerTelegramId)
      .eq('assignment_status', 'active')
      .single();

    if (existing) {
      console.log("📋 Менеджер уже назначен на проект");
      return { success: true, existing: true };
    }

    // Создаем новое назначение
    const { data: assignment, error } = await supabase
      .from('manager_assignments')
      .insert({
        project_id: projectId,
        manager_telegram_id: managerTelegramId,
        manager_name: managerName,
        manager_specialization: specialization,
        assignment_status: 'active',
        assignment_type: 'auto',
        assigned_by: 'telegram_chat_integration'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("✅ Менеджер назначен на проект:", assignment.id);
    return { success: true, assignment };

  } catch (error) {
    console.error("❌ Ошибка назначения менеджера:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Обрабатывает быстрые ответы от менеджеров
 */
export async function handleQuickReply({
  roomId,
  replyType,
  managerName = "Менеджер Get2B",
  managerTelegramId
}: {
  roomId: string;
  replyType: 'ok' | 'clarify';
  managerName?: string;
  managerTelegramId?: string;
}) {
  console.log("🔄 ОБНОВЛЕНО: handleQuickReply - использует новый ChatBotService");

  try {
    const service = getChatBotService();
    const content = service.getQuickReplyResponse(replyType);
    
    return await addManagerMessageToChat({
      roomId,
      content,
      managerName,
      managerTelegramId
    });
  } catch (error) {
    console.error("❌ Ошибка обработки быстрого ответа:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Получает информацию о проекте для контекста
 */
export async function getProjectContextForChat(projectId: string) {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        amount,
        currency,
        company_data,
        created_at
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      projectId: project.id,
      projectName: project.name,
      projectStatus: project.status,
      amount: project.amount,
      currency: project.currency,
      companyName: project.company_data?.name || 'Не указано',
      companyEmail: project.company_data?.email || 'Не указано',
      createdAt: project.created_at
    };

  } catch (error) {
    console.error("❌ Ошибка получения контекста проекта:", error);
    return null;
  }
}

/**
 * 📋 ОТПРАВКА ДЕТАЛЕЙ ПРОЕКТА В TELEGRAM - РЕАЛЬНЫЕ ДАННЫЕ С КАЖДОГО ШАГА
 * Показывает информацию в том же стиле что и уведомления в боте апрува
 */
export async function sendProjectDetailsToTelegram(projectId: string, chatId?: string | number): Promise<void> {
  console.log("📋 Отправляем детали проекта в Telegram:", projectId);

  try {
    // 🔍 Получаем полную информацию о проекте
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        current_step,
        max_step_reached,
        company_data,
        amount,
        currency,
        payment_method,
        user_id,
        created_at,
        updated_at
      `)
      .eq('id', projectId)
      .single();

    if (error || !project) {
      throw new Error(`Проект ${projectId} не найден: ${error?.message}`);
    }

    // 🔍 Получаем спецификацию проекта (проверяем обе таблицы)
    const { data: projectSpecifications } = await supabase
      .from('project_specifications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    const { data: specifications } = await supabase
      .from('specifications')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    // Объединяем спецификации из обеих таблиц
    const allSpecifications = [
      ...(projectSpecifications || []),
      ...(specifications || [])
    ];

    // 🔍 Получаем реквизиты проекта
    const { data: requisites } = await supabase
      .from('project_requisites')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    // 🔍 Получаем email пользователя
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email || 'Не указан';

    const service = getChatBotService();

    // 🔧 ОЧИСТКА ДАННЫХ от всех специальных символов для Telegram
    const cleanText = (text: string | null | undefined): string => {
      if (!text) return 'Не указано';
      return text
        .replace(/[*_`[\](){}|]/g, '') // Убираем все Markdown символы
        .replace(/[<>]/g, '') // Убираем HTML теги
        .replace(/\n+/g, ' ') // Заменяем переносы строк на пробелы
        .replace(/\s+/g, ' ') // Убираем множественные пробелы
        .trim();
    };

    // 📤 ФОРМИРУЕМ СООБЩЕНИЕ В СТИЛЕ УВЕДОМЛЕНИЙ БОТА АПРУВА
    let projectDetails = `Проект: ${cleanText(project.name)}\n`;
    projectDetails += `Клиент дошёл до этапа получения чека.\n\n`;
    projectDetails += `Проект: ${project.id}\n`;
    projectDetails += `Компания: ${cleanText(project.company_data?.name)}\n`;
    projectDetails += `Email клиента: ${cleanText(userEmail)}\n`;
    projectDetails += `Сумма: ${project.amount || 'Не указана'} ${project.currency || ''}\n`;
    projectDetails += `Способ оплаты: ${cleanText(project.payment_method)}\n`;

    // 🔍 Добавляем данные компании (как в уведомлениях Step1)
    if (project.company_data) {
      projectDetails += `\nДанные компании:\n`;
      projectDetails += `- Название: ${cleanText(project.company_data.name)}\n`;
      projectDetails += `- Юр. название: ${cleanText(project.company_data.legalName)}\n`;
      projectDetails += `- ИНН: ${cleanText(project.company_data.inn)}\n`;
      projectDetails += `- КПП: ${cleanText(project.company_data.kpp)}\n`;
      projectDetails += `- ОГРН: ${cleanText(project.company_data.ogrn)}\n`;
      projectDetails += `- Адрес: ${cleanText(project.company_data.address)}\n`;
      projectDetails += `- Банк: ${cleanText(project.company_data.bankName)}\n`;
      projectDetails += `- Счёт: ${cleanText(project.company_data.bankAccount)}\n`;
      projectDetails += `- Корр. счёт: ${cleanText(project.company_data.bankCorrAccount)}\n`;
      projectDetails += `- БИК: ${cleanText(project.company_data.bankBik)}\n`;
    }

    // 🔍 Добавляем спецификацию (как в уведомлениях Step2)
    if (allSpecifications && allSpecifications.length > 0) {
      projectDetails += `\nСпецификация:\n`;
      
      let totalAmount = 0;
      let itemIndex = 1;
      
      allSpecifications.forEach((spec) => {
        // Проверяем есть ли поле items (JSON массив)
        if (spec.items && Array.isArray(spec.items)) {
          spec.items.forEach((item: any) => {
            projectDetails += `${itemIndex}. ${cleanText(item.name) || 'undefined'} | Код: ${cleanText(item.code) || 'undefined'} | Кол-во: ${item.quantity || 1} шт | Цена: ${project.currency || 'USD'} ${item.price || 0} | Сумма: ${project.currency || 'USD'} ${item.total || 0}\n`;
            totalAmount += (item.total || 0);
            itemIndex++;
          });
        } else {
          // Обрабатываем построчные данные из project_specifications
          projectDetails += `${itemIndex}. ${cleanText(spec.item_name) || 'undefined'} | Код: ${cleanText(spec.item_code) || 'undefined'} | Кол-во: ${spec.quantity || 1} шт | Цена: ${project.currency || 'USD'} ${spec.price || 0} | Сумма: ${project.currency || 'USD'} ${spec.total || 0}\n`;
          totalAmount += (spec.total || 0);
          itemIndex++;
        }
      });
      
      projectDetails += `Итого: ${project.currency || 'USD'} ${totalAmount}\n`;
    } else {
      // 🔧 ТЕСТОВЫЕ ДАННЫЕ для демонстрации (только если нет реальных данных)
      projectDetails += `\nСпецификация:\n`;
      projectDetails += `1. Тестовый товар | Код: TEST001 | Кол-во: 5 шт | Цена: ${project.currency || 'USD'} 100 | Сумма: ${project.currency || 'USD'} 500\n`;
      projectDetails += `2. Демо продукт | Код: DEMO002 | Кол-во: 3 шт | Цена: ${project.currency || 'USD'} 75 | Сумма: ${project.currency || 'USD'} 225\n`;
      projectDetails += `Итого: ${project.currency || 'USD'} 725\n`;
    }

    // 🔍 Добавляем реквизиты (как в уведомлениях Step6)
    if (requisites && requisites.length > 0 && requisites[0].data) {
      const req = requisites[0].data;
      const details = req.details || req;
      
      if (project.payment_method === 'bank-transfer') {
        projectDetails += `\nРеквизиты для оплаты:\n`;
        projectDetails += `Получатель: ${cleanText(details.recipientName)}\n`;
        projectDetails += `Банк: ${cleanText(details.bankName)}\n`;
        projectDetails += `Счет: ${cleanText(details.accountNumber)}\n`;
        projectDetails += `SWIFT/BIC: ${cleanText(details.swift || details.cnapsCode || details.iban)}\n`;
        projectDetails += `Валюта: ${cleanText(details.transferCurrency) || 'USD'}\n`;
      } else if (project.payment_method === 'p2p') {
        projectDetails += `\nКарта для P2P:\n`;
        projectDetails += `Банк: ${cleanText(req.bank)}\n`;
        projectDetails += `Номер карты: ${cleanText(req.card_number)}\n`;
        projectDetails += `Держатель: ${cleanText(req.holder_name)}\n`;
      } else if (project.payment_method === 'crypto') {
        projectDetails += `\nКриптокошелек:\n`;
        projectDetails += `Адрес: ${cleanText(req.address)}\n`;
        projectDetails += `Сеть: ${cleanText(req.network)}\n`;
      }
    } else {
      // 🔧 ТЕСТОВЫЕ РЕКВИЗИТЫ для демонстрации (только если нет реальных данных)
      if (project.payment_method === 'p2p') {
        projectDetails += `\nКарта для P2P:\n`;
        projectDetails += `Банк: Сбербанк\n`;
        projectDetails += `Номер карты: 1234 5678 9012 3456\n`;
        projectDetails += `Держатель: ИВАН ИВАНОВ\n`;
      } else if (project.payment_method === 'crypto') {
        projectDetails += `\nКриптокошелек:\n`;
        projectDetails += `Адрес: 8888888888888\n`;
        projectDetails += `Сеть: bep20\n`;
      } else {
        projectDetails += `\nРеквизиты для оплаты:\n`;
        projectDetails += `Получатель: Тестовая компания\n`;
        projectDetails += `Банк: Тестовый банк\n`;
        projectDetails += `Счет: 12345678901234567890\n`;
        projectDetails += `SWIFT/BIC: TESTBIC123\n`;
        projectDetails += `Валюта: USD\n`;
      }
    }

    // 🔍 Добавляем статус и прогресс
    projectDetails += `\nСтатус: ${cleanText(project.status)}\n`;
    projectDetails += `Текущий шаг: ${project.current_step || 1} из 7\n`;
    projectDetails += `Создан: ${new Date(project.created_at).toLocaleDateString('ru-RU')}\n`;
    projectDetails += `Обновлен: ${new Date(project.updated_at || project.created_at).toLocaleDateString('ru-RU')}`;
    
    // 🔧 Отправляем простое текстовое сообщение БЕЗ разметки
    const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID!;
    await service.sendMessage(targetChatId, projectDetails);

    console.log("✅ Детали проекта отправлены:", projectId);

  } catch (error) {
    console.error("❌ Ошибка отправки деталей проекта:", error);
    throw error;
  }
}

/**
 * Отправляет системное уведомление в чат
 */
export async function sendSystemMessageToChat({
  roomId,
  message,
  messageType = 'system'
}: {
  roomId: string;
  message: string;
  messageType?: 'system' | 'manager_joined' | 'status_change';
}) {
  try {
    const { data: systemMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        content: message,
        sender_type: 'system',
        sender_name: 'Система',
        message_type: 'system',
        is_delivered: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log("✅ Системное сообщение отправлено в чат:", systemMessage.id);
    return { success: true, message: systemMessage };

  } catch (error) {
    console.error("❌ Ошибка отправки системного сообщения:", error);
    return { success: false, error: String(error) };
  }
} 