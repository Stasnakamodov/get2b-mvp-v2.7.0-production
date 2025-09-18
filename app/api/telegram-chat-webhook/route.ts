// ⚠️ ОБНОВЛЕНО: Теперь использует новый ChatBotService

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseService } from "@/lib/supabaseServiceClient";
import { ChatBotService } from "@/lib/telegram/ChatBotService";

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

// POST: Webhook для чат-бота Get2B ChatHub Assistant (ИСПРАВЛЕННАЯ ВЕРСИЯ)
export async function POST(request: NextRequest) {
  // Принудительно выводим в консоль что webhook получен
  console.error('🚨 WEBHOOK CALL DETECTED! Time:', new Date().toISOString());
  
  try {
    const body = await request.json();
    
    console.error('🤖 WEBHOOK RECEIVED - FULL PAYLOAD:');
    console.error('====================================');
    console.error(JSON.stringify(body, null, 2));
    console.error('====================================');

    // Обрабатываем callback queries (нажатия кнопок)
    if (body.callback_query) {
      console.log('📞 CALLBACK QUERY detected - handling...');
      return await handleCallbackQuery(body.callback_query);
    }

    // Проверяем что это сообщение
    if (!body.message) {
      console.log('❌ NO MESSAGE in payload - exiting');
      return NextResponse.json({ success: true, message: "No message to process" });
    }

    console.log('✅ MESSAGE found in payload - processing...');

    const message = body.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;
    const userName = message.from.first_name || 'Пользователь';

    console.log('📩 Processing chat bot message:', {
      chatId,
      userId,
      userName,
      text,
      textLength: text.length,
      isCommand: text.startsWith('/')
    });

    // Обрабатываем команды
    if (text.startsWith('/')) {
      console.log('🔧 COMMAND detected - handling command:', text);
      await handleChatBotCommand(chatId, text, userId, userName);
    } else {
      console.log('💬 REGULAR MESSAGE detected - handling as manager reply:', text);
      // Обычное сообщение - возможно ответ менеджера клиенту
      await handleManagerReply(message, chatId, text, userId, userName);
    }

    return NextResponse.json({ success: true, message: "Chat bot message processed" });

  } catch (error) {
    console.error('💥 Chat bot webhook error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Обработка команд чат-бота
async function handleChatBotCommand(chatId: number, command: string, userId: number, userName: string) {
  console.log("🔄 ОБНОВЛЕНО: handleChatBotCommand - использует новый ChatBotService");

  try {
    const service = getChatBotService();
    const responseText = service.getCommandResponse(command, userName);
    
    await service.sendMessage(chatId, responseText);
    console.log("✅ Команда обработана через ChatBotService");
  } catch (error) {
    console.error('❌ Ошибка обработки команды:', error);
  }
}

// Обработка ответов менеджеров клиентам (ULTRA DEBUG VERSION)
async function handleManagerReply(message: any, chatId: number, text: string, userId: number, userName: string) {
  console.log("💬 ULTRA DEBUG: handleManagerReply started");
  console.log("📝 ULTRA DEBUG: Message text:", text);
  console.log("👤 ULTRA DEBUG: User:", { userId, userName, chatId });
  console.log("🔍 ULTRA DEBUG: Full message object:", JSON.stringify(message, null, 2));
  
  let webChatMessageSaved = false;
  
  try {
    // Проверяем, есть ли реплай на сообщение о новом чате
    const replyToMessage = message.reply_to_message;
    console.log("🔍 DEBUG: Reply to message exists:", !!replyToMessage);
    
    if (replyToMessage?.text) {
      console.log("📄 DEBUG: Reply text:", replyToMessage.text);
    }
    
    let roomId = null;
    let projectId = null;

    if (replyToMessage?.text) {
      // Ищем ID проекта в тексте реплая
      const projectMatch = replyToMessage.text.match(/🆔 Проект: ([a-f0-9-]+)/);
      console.log("🎯 DEBUG: Project regex match:", projectMatch);
      
      if (projectMatch) {
        projectId = projectMatch[1];
        console.log("✅ ULTRA DEBUG: Found project ID:", projectId);

        // Ищем комнату чата по проекту
        console.log("🔍 ULTRA DEBUG: Searching for room with project_id:", projectId);
        
        let room = null;
        let roomError = null;
        
        try {
          const result = await supabaseService
            .from('chat_rooms')
            .select('id, name, user_id')
            .eq('project_id', projectId)
            .eq('room_type', 'project')
            .eq('is_active', true)
            .single();

          room = result.data;
          roomError = result.error;

          console.log("📦 ULTRA DEBUG: Room query result:", { room, error: roomError });
          console.log("🌐 ULTRA DEBUG: Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        } catch (dbError) {
          console.error("💥 ULTRA DEBUG: Database connection error:", dbError);
          roomError = dbError;
        }

        if (room) {
          roomId = room.id;
          console.log("✅ DEBUG: Found chat room:", { roomId, roomName: room.name, userId: room.user_id });
        } else {
          console.log("❌ DEBUG: No room found for project:", projectId);
          if (roomError) {
            console.log("🚨 DEBUG: Room query error:", roomError);
          }
        }
      } else {
        console.log("❌ DEBUG: No project ID found in reply text");
      }
    } else {
      console.log("❌ DEBUG: No reply_to_message.text");
    }

    if (roomId) {
      console.log("💾 DEBUG: Attempting to save message to web chat...");
      
      // 🚀 ОТПРАВЛЯЕМ СООБЩЕНИЕ В ВЕБ-ЧАТ (с улучшенной обработкой ошибок)
      const messageData = {
        room_id: roomId,
        content: text,
        sender_type: 'manager' as const,
        sender_manager_id: String(userId),
        sender_name: userName || 'Менеджер Get2B',
        message_type: 'text' as const
      };
      
      console.log("💾 DEBUG: Message data to save:", messageData);
      
      const { data: newMessage, error } = await supabaseService
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      console.log("📊 DEBUG: Database insert result:", { newMessage, error });

      if (error) {
        console.error('❌ DEBUG: Database save error:', error);
        throw new Error(`Ошибка сохранения: ${error.message}`);
      } else {
        webChatMessageSaved = true;
        console.log('✅ DEBUG: Message saved successfully:', {
          messageId: newMessage.id,
          roomId: newMessage.room_id,
          content: newMessage.content,
          senderType: newMessage.sender_type
        });
      }

      // 🔧 БЕЗОПАСНАЯ отправка ответа в Telegram (не прерываем при ошибке)
      try {
        const service = getChatBotService();
        await service.sendMessage(chatId, `✅ Ваш ответ отправлен клиенту в веб-чат:\n\n"${text}"`);
        console.log("✅ DEBUG: Confirmation sent to Telegram");
      } catch (telegramError) {
        console.warn("⚠️ DEBUG: Failed to send Telegram confirmation (non-critical):", telegramError);
        // НЕ ПРЕРЫВАЕМ выполнение - главное что сообщение сохранено в веб-чат!
      }
      
    } else {
      console.log("❌ DEBUG: No room found - cannot save message");
      
      // Безопасная отправка уведомления об ошибке
      try {
        const service = getChatBotService();
        await service.sendMessage(chatId, `❌ Не удалось найти комнату чата для отправки ответа.\n\nОтвечайте только на уведомления о новых сообщениях в чатах проектов.`);
      } catch (telegramError) {
        console.warn("⚠️ DEBUG: Failed to send error to Telegram:", telegramError);
      }
    }
    
  } catch (error) {
    console.error('❌ DEBUG: handleManagerReply error:', error);
    
    // Безопасная отправка уведомления об ошибке
    try {
      const service = getChatBotService();
      await service.sendMessage(chatId, `❌ Ошибка отправки ответа: ${error instanceof Error ? error.message : String(error)}`);
    } catch (telegramError) {
      console.warn("⚠️ DEBUG: Failed to send error to Telegram:", telegramError);
    }
  }

  // 🎯 ГЛАВНОЕ: Возвращаем успех если сообщение сохранено в веб-чат
  if (webChatMessageSaved) {
    console.log("🎉 DEBUG: SUCCESS - Message saved to web chat!");
  } else {
    console.log("💥 DEBUG: FAILED - Message NOT saved to web chat");
  }
}

// Получение статуса чатхаба
async function getChatHubStatus(): Promise<string> {
  try {
    // Получаем статистику из базы данных
    const { data: roomsData, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('room_type, is_active')
      .eq('is_active', true);

    const { data: messagesData, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: participantsData, error: participantsError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('is_active', true);

    const totalRooms = roomsData?.length || 0;
    const aiRooms = roomsData?.filter(r => r.room_type === 'ai').length || 0;
    const projectRooms = roomsData?.filter(r => r.room_type === 'project').length || 0;
    const todayMessages = messagesData?.length || 0;
    const activeParticipants = participantsData?.length || 0;

    return `🏠 Активных комнат: ${totalRooms}
🤖 AI чатов: ${aiRooms}
📋 Проектных чатов: ${projectRooms}
💬 Сообщений за день: ${todayMessages}
👥 Активных участников: ${activeParticipants}`;

  } catch (error) {
    console.error('Error getting chat status:', error);
    return '⚠️ Ошибка получения статистики';
  }
}

// Получение списка активных проектных чатов
async function getActiveProjectChats(): Promise<string> {
  try {
    const { data: projectChats, error } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        name,
        project_id,
        created_at,
        projects!inner(name, status)
      `)
      .eq('room_type', 'project')
      .eq('is_active', true)
      .limit(10);

    if (error || !projectChats || projectChats.length === 0) {
      return '📭 Нет активных проектных чатов';
    }

    return projectChats.map((chat: any, index: number) => 
      `${index + 1}. **${chat.projects?.name || chat.name}**
   💬 Чат: ${chat.name}
   📊 Статус: ${chat.projects?.status || 'unknown'}
   📅 Создан: ${new Date(chat.created_at).toLocaleDateString('ru-RU')}`
    ).join('\n\n');

  } catch (error) {
    console.error('Error getting project chats:', error);
    return '⚠️ Ошибка получения списка чатов';
  }
}

// ========================================
// 💬 ОБРАБОТКА ЧАТ-ФУНКЦИЙ (CALLBACK QUERIES)
// ========================================

async function handleCallbackQuery(callbackQuery: any) {
  try {
    const data = callbackQuery.data;
    const service = getChatBotService();
    
    console.log("💬 Обработка callback query чат-бота:", data);

    // Быстрые ответы в чате
    if (data.startsWith("quick_reply_")) {
      const [, , roomId, replyType] = data.split("_");
      
      try {
        const { handleQuickReply } = await import('@/lib/telegram-chat-integration');
        
        await handleQuickReply({
          roomId,
          replyType: replyType as 'ok' | 'clarify',
          managerName: callbackQuery.from?.first_name || "Менеджер Get2B",
          managerTelegramId: String(callbackQuery.from?.id)
        });

        const responseText = replyType === 'ok' 
          ? "✅ Ответ \"Все в порядке\" отправлен клиенту" 
          : "❓ Ответ \"Нужны уточнения\" отправлен клиенту";
            
        await service.answerCallbackQuery(callbackQuery.id, responseText);

        console.log("💬 Быстрый ответ отправлен в чат:", roomId, replyType);
        return NextResponse.json({ 
          ok: true, 
          message: `Quick reply sent to chat ${roomId}` 
        });
      } catch (error: any) {
        console.error("❌ Chat quick reply error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // Открыть чат проекта
    if (data.startsWith("open_chat_")) {
      const roomId = data.replace("open_chat_", "");
      
      await service.answerCallbackQuery(
        callbackQuery.id, 
        "💬 Функция открытия чата будет добавлена в будущих версиях", 
        true
      );

      return NextResponse.json({ ok: true, message: "Chat open requested" });
    }

    // Детали проекта
    if (data.startsWith("project_details_")) {
      const projectId = data.replace("project_details_", "");
      
      try {
        const { sendProjectDetailsToTelegram } = await import('@/lib/telegram-chat-integration');
        
        // 🔧 ИСПРАВЛЕНИЕ: Передаем chat_id из callback query
        const chatId = callbackQuery.message?.chat?.id || callbackQuery.from?.id;
        await sendProjectDetailsToTelegram(projectId, chatId);

        await service.answerCallbackQuery(callbackQuery.id, "📋 Детали проекта отправлены");

        console.log("📋 Детали проекта отправлены:", projectId);
        return NextResponse.json({ 
          ok: true, 
          message: `Project details sent for ${projectId}` 
        });
      } catch (error: any) {
        console.error("❌ Project details error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // ========================================
    // ⭐ ОБРАБОТКА АККРЕДИТАЦИИ
    // ========================================

    // Просмотр заявки на аккредитацию
    if (data.startsWith("accredit_view_")) {
      const applicationId = data.replace("accredit_view_", "");
      
      try {
        await service.answerCallbackQuery(callbackQuery.id, "🔍 Загружаем детали заявки...");
        
        // Получаем данные заявки из базы
        const { data: application, error } = await supabase
          .from('accreditation_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (error || !application) {
          await service.answerCallbackQuery(callbackQuery.id, "❌ Заявка не найдена", true);
          return NextResponse.json({ ok: false, error: "Application not found" });
        }

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

        // 📤 ФОРМИРУЕМ ПОДРОБНОЕ СООБЩЕНИЕ В СТИЛЕ ДЕТАЛЕЙ ПРОЕКТА
        let detailsText = `🔍 ДЕТАЛИ ЗАЯВКИ НА АККРЕДИТАЦИЮ\n\n`;
        
        // Основная информация
        detailsText += `🆔 ID заявки: ${application.id}\n`;
        detailsText += `📊 Статус: ${cleanText(application.status)}\n`;
        detailsText += `📅 Подана: ${new Date(application.submitted_at).toLocaleString('ru-RU')}\n\n`;
        
        // Информация о поставщике
        detailsText += `🏢 ИНФОРМАЦИЯ О ПОСТАВЩИКЕ:\n`;
        detailsText += `• Название: ${cleanText(application.supplier_name)}\n`;
        detailsText += `• Компания: ${cleanText(application.company_name)}\n`;
        detailsText += `• Категория: ${cleanText(application.category)}\n`;
        detailsText += `• Страна: ${cleanText(application.country)}\n\n`;
        
        // Парсим profile_data если это JSON
        if (application.profile_data) {
          try {
            const profileData = typeof application.profile_data === 'string' 
              ? JSON.parse(application.profile_data) 
              : application.profile_data;
            
            if (profileData) {
              detailsText += `📋 ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:\n`;
              if (profileData.description) {
                detailsText += `• Описание: ${cleanText(profileData.description)}\n`;
              }
              if (profileData.contact_email) {
                detailsText += `• Email: ${cleanText(profileData.contact_email)}\n`;
              }
              if (profileData.contact_phone) {
                detailsText += `• Телефон: ${cleanText(profileData.contact_phone)}\n`;
              }
              if (profileData.website) {
                detailsText += `• Сайт: ${cleanText(profileData.website)}\n`;
              }
              detailsText += `\n`;
            }
          } catch (parseError) {
            console.log('Ошибка парсинга profile_data:', parseError);
          }
        }
        
        // Парсим products если это JSON
        if (application.products) {
          try {
            const products = typeof application.products === 'string' 
              ? JSON.parse(application.products) 
              : application.products;
            
            if (Array.isArray(products) && products.length > 0) {
              detailsText += `📦 ТОВАРЫ И УСЛУГИ:\n`;
              products.forEach((product: any, index: number) => {
                detailsText += `${index + 1}. ${cleanText(product.name)}\n`;
                if (product.description) {
                  detailsText += `   Описание: ${cleanText(product.description)}\n`;
                }
                if (product.category) {
                  detailsText += `   Категория: ${cleanText(product.category)}\n`;
                }
                if (product.price) {
                  detailsText += `   Цена: ${cleanText(product.price)} ${cleanText(product.currency || 'USD')}\n`;
                }
                if (product.certificates && Array.isArray(product.certificates) && product.certificates.length > 0) {
                  detailsText += `   Сертификаты: ${product.certificates.length} шт.\n`;
                }
                detailsText += `\n`;
              });
            }
          } catch (parseError) {
            console.log('Ошибка парсинга products:', parseError);
          }
        }
        
        // Парсим legal_confirmation если это JSON
        if (application.legal_confirmation) {
          try {
            const legalData = typeof application.legal_confirmation === 'string' 
              ? JSON.parse(application.legal_confirmation) 
              : application.legal_confirmation;
            
            if (legalData) {
              detailsText += `⚖️ ЮРИДИЧЕСКИЕ ПОДТВЕРЖДЕНИЯ:\n`;
              detailsText += `• Юридическое лицо: ${legalData.isLegalEntity ? 'Да' : 'Нет'}\n`;
              detailsText += `• Право на представление: ${legalData.hasRightToRepresent ? 'Да' : 'Нет'}\n`;
              detailsText += `• Точность данных: ${legalData.confirmAccuracy ? 'Подтверждено' : 'Не подтверждено'}\n\n`;
            }
          } catch (parseError) {
            console.log('Ошибка парсинга legal_confirmation:', parseError);
          }
        }
        
        // Статистика материалов
        detailsText += `📊 СТАТИСТИКА МАТЕРИАЛОВ:\n`;
        detailsText += `• Товары: ${application.products_count || 0}\n`;
        detailsText += `• Сертификаты: ${application.certificates_count || 0}\n`;
        detailsText += `• Документы: ${application.legal_documents_count || 0}\n\n`;
        
        // Информация о рассмотрении
        if (application.reviewed_by) {
          detailsText += `👤 РАССМОТРЕНО:\n`;
          detailsText += `• Менеджер: ${cleanText(application.reviewed_by)}\n`;
          detailsText += `• Дата: ${new Date(application.reviewed_at).toLocaleString('ru-RU')}\n`;
          if (application.rejection_reason) {
            detailsText += `• Причина отклонения: ${cleanText(application.rejection_reason)}\n`;
          }
          detailsText += `\n`;
        }
        
        // Ссылка на веб-интерфейс
        detailsText += `💡 Для полного просмотра используйте веб-интерфейс:\n`;
        detailsText += `https://get2b.com/dashboard/profile`;

        // Добавляем кнопки для просмотра файлов
        const replyMarkup = {
          inline_keyboard: [
            [
              { text: "📦 Товары", callback_data: `accredit_files_${applicationId}_products` },
              { text: "📋 Сертификаты", callback_data: `accredit_files_${applicationId}_certificates` }
            ],
            [
              { text: "📄 Документы", callback_data: `accredit_files_${applicationId}_documents` },
              { text: "📊 Статистика", callback_data: `accredit_files_${applicationId}_summary` }
            ],
            [
              { text: "✅ Одобрить", callback_data: `accredit_approve_${applicationId}` },
              { text: "❌ Отклонить", callback_data: `accredit_reject_${applicationId}` }
            ]
          ]
        };

        await service.sendMessageWithButtons(callbackQuery.message.chat.id, detailsText, replyMarkup, 'Markdown');

        return NextResponse.json({ 
          ok: true, 
          message: `Accreditation details sent for ${applicationId}` 
        });
      } catch (error: any) {
        console.error("❌ Accreditation view error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // Одобрение заявки на аккредитацию
    if (data.startsWith("accredit_approve_")) {
      const applicationId = data.replace("accredit_approve_", "");
      
      try {
        await service.answerCallbackQuery(callbackQuery.id, "✅ Обрабатываем одобрение...");
        
        // Получаем данные заявки
        const { data: application, error: fetchError } = await supabase
          .from('accreditation_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (fetchError || !application) {
          await service.answerCallbackQuery(callbackQuery.id, "❌ Заявка не найдена", true);
          return NextResponse.json({ ok: false, error: "Application not found" });
        }

        // Обновляем статус заявки
        const { error: updateError } = await supabase
          .from('accreditation_applications')
          .update({ 
            status: 'approved',
            reviewed_by: callbackQuery.from?.first_name || 'Менеджер',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        if (updateError) {
          await service.answerCallbackQuery(callbackQuery.id, "❌ Ошибка при одобрении", true);
          return NextResponse.json({ ok: false, error: updateError.message });
        }

        // Маппинг категорий для замены неразрешенных на разрешенные
        const categoryMapping: { [key: string]: string } = {
          'Тестовая категория': 'Электроника',
          'танковая': 'Автотовары',
          '321d': 'Текстиль и одежда',
          '312312': 'Текстиль и одежда',
          '.kjblubuy': 'Спорт и отдых',
          '12412': 'Электроника'
        };

        const mappedCategory = categoryMapping[application.category] || application.category;

        // 🟠 СОЗДАЕМ ЗАПИСЬ В ОРАНЖЕВОМ КАБИНЕТЕ (catalog_verified_suppliers)
        const verifiedSupplierData = {
          name: application.supplier_name,
          company_name: application.company_name,
          category: mappedCategory,
          country: application.country,
          description: application.application_data?.description || '',
          contact_email: application.application_data?.contact_email || '',
          contact_phone: application.application_data?.contact_phone || '',
          website: application.application_data?.website || '',
          contact_person: application.application_data?.contact_person || '',
          min_order: application.application_data?.min_order || '',
          response_time: application.application_data?.response_time || '',
          employees: application.application_data?.employees || '',
          established: application.application_data?.established || '',
          certifications: application.application_data?.certifications || null,
          specialties: application.application_data?.specialties || null,
          payment_methods: application.application_data?.payment_methods || null,
          logo_url: application.application_data?.logo_url || null,
          moderation_status: 'approved',
          moderated_by: callbackQuery.from?.id || null,
          moderated_at: new Date().toISOString(),
          is_verified: true,
          is_active: true,
          public_rating: 0,
          reviews_count: 0,
          projects_count: 0,
          success_rate: 0
        };

        const { data: verifiedSupplier, error: createError } = await supabase
          .from('catalog_verified_suppliers')
          .insert([verifiedSupplierData])
          .select()
          .single();

        if (createError) {
          console.error("❌ Ошибка создания поставщика в оранжевом кабинете:", createError);
          await service.answerCallbackQuery(callbackQuery.id, "❌ Ошибка создания поставщика", true);
          return NextResponse.json({ ok: false, error: createError.message });
        }

        // Обновляем заявку с ID созданного поставщика
        await supabase
          .from('accreditation_applications')
          .update({ 
            verified_supplier_id: verifiedSupplier.id 
          })
          .eq('id', applicationId);

        // 📦 КОПИРУЕМ ТОВАРЫ В ОРАНЖЕВЫЙ КАБИНЕТ (если есть)
        if (application.products_data) {
          try {
            const products = typeof application.products_data === 'string' 
              ? JSON.parse(application.products_data) 
              : application.products_data;

            if (Array.isArray(products) && products.length > 0) {
              const verifiedProducts = products.map((product: any) => ({
                supplier_id: verifiedSupplier.id,
                name: product.name || 'Товар без названия',
                description: product.description || '',
                category: product.category || application.category,
                price: product.price || 0,
                currency: product.currency || 'USD',
                min_order: product.min_order || '',
                in_stock: true,
                image_url: product.image_url || null,
                certification: product.certification || null
              }));

              await supabase
                .from('catalog_verified_products')
                .insert(verifiedProducts);
            }
          } catch (productError) {
            console.warn("⚠️ Ошибка копирования товаров:", productError);
          }
        }

        // Отправляем уведомление об одобрении
          await service.notifyAccreditationApproved({
            applicationId: application.id,
            supplierName: application.supplier_name,
            companyName: application.company_name,
            managerName: callbackQuery.from?.first_name || 'Менеджер'
          });

        await service.answerCallbackQuery(callbackQuery.id, "✅ Заявка одобрена! Поставщик добавлен в оранжевый кабинет.");

        return NextResponse.json({ 
          ok: true, 
          message: `Accreditation approved for ${applicationId}`,
          verified_supplier_id: verifiedSupplier.id
        });
      } catch (error: any) {
        console.error("❌ Accreditation approve error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // Отклонение заявки на аккредитацию
    if (data.startsWith("accredit_reject_")) {
      const applicationId = data.replace("accredit_reject_", "");
      
      try {
        await service.answerCallbackQuery(callbackQuery.id, "❌ Обрабатываем отклонение...");
        
        // Пока что отклоняем без причины (можно добавить диалог для ввода причины)
        const { error } = await supabase
          .from('accreditation_applications')
          .update({ 
            status: 'rejected',
            rejection_reason: 'Отклонено менеджером через Telegram',
            reviewed_by: callbackQuery.from?.first_name || 'Менеджер',
            reviewed_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        if (error) {
          await service.answerCallbackQuery(callbackQuery.id, "❌ Ошибка при отклонении", true);
          return NextResponse.json({ ok: false, error: error.message });
        }

        // Получаем данные заявки для уведомления
        const { data: application } = await supabase
          .from('accreditation_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (application) {
          await service.notifyAccreditationRejected({
            applicationId: application.id,
            supplierName: application.supplier_name,
            companyName: application.company_name,
            managerName: callbackQuery.from?.first_name || 'Менеджер',
            reason: 'Отклонено менеджером через Telegram'
          });
        }

        await service.answerCallbackQuery(callbackQuery.id, "❌ Заявка отклонена");

        return NextResponse.json({ 
          ok: true, 
          message: `Accreditation rejected for ${applicationId}` 
        });
      } catch (error: any) {
        console.error("❌ Accreditation reject error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // ========================================
    // 📁 ОБРАБОТКА ФАЙЛОВ АККРЕДИТАЦИИ
    // ========================================

    // Просмотр товаров заявки
    if (data.startsWith("accredit_files_")) {
      const parts = data.split('_');
      const applicationId = parts[2];
      const fileType = parts[3];
      
      try {
        await service.answerCallbackQuery(callbackQuery.id, "📁 Загружаем файлы...");
        
        // Получаем данные файлов через API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/telegram/get-accreditation-files?applicationId=${applicationId}&type=${fileType}`);
        const result = await response.json();
        
        if (!result.success) {
          await service.answerCallbackQuery(callbackQuery.id, "❌ Ошибка загрузки файлов", true);
          return NextResponse.json({ ok: false, error: result.error });
        }

        const filesData = result.data;
        let messageText = '';
        let replyMarkup: any = null;

        switch (fileType) {
          case 'products':
            messageText = `📦 ТОВАРЫ ЗАЯВКИ НА АККРЕДИТАЦИЮ\n\n`;
            messageText += `🏢 Поставщик: ${filesData.supplierName}\n`;
            messageText += `🆔 ID заявки: ${filesData.applicationId}\n\n`;
            
            if (filesData.products && filesData.products.length > 0) {
              filesData.products.forEach((product: any, index: number) => {
                messageText += `${index + 1}. ${product.name}\n`;
                messageText += `   Категория: ${product.category || 'Не указана'}\n`;
                messageText += `   Цена: ${product.price || 'Не указана'} ${product.currency || ''}\n`;
                messageText += `   📷 Изображений: ${product.images.length}\n`;
                messageText += `   📋 Сертификатов: ${product.certificates.length}\n\n`;
              });
            } else {
              messageText += `❌ Товары не найдены\n\n`;
            }

            // Кнопки для просмотра изображений и сертификатов каждого товара
            if (filesData.products && filesData.products.length > 0) {
              replyMarkup = {
                inline_keyboard: filesData.products.map((product: any, index: number) => [
                  { text: `📷 ${product.name} (изображения)`, callback_data: `accredit_product_images_${applicationId}_${index}` },
                  { text: `📋 ${product.name} (сертификаты)`, callback_data: `accredit_product_certs_${applicationId}_${index}` }
                ]).concat([
                  [{ text: "🔙 Назад к деталям", callback_data: `accredit_view_${applicationId}` }]
                ])
              };
            }
            break;

          case 'certificates':
            messageText = `📋 СЕРТИФИКАТЫ ЗАЯВКИ НА АККРЕДИТАЦИЮ\n\n`;
            messageText += `🏢 Поставщик: ${filesData.supplierName}\n`;
            messageText += `🆔 ID заявки: ${filesData.applicationId}\n\n`;
            
            if (filesData.certificates && filesData.certificates.length > 0) {
              filesData.certificates.forEach((cert: any, index: number) => {
                messageText += `${index + 1}. ${cert.name}\n`;
                messageText += `   Товар: ${cert.productName}\n`;
                messageText += `   Размер: ${(cert.size / 1024).toFixed(1)} KB\n`;
                messageText += `   Тип: ${cert.type}\n\n`;
              });
            } else {
              messageText += `❌ Сертификаты не найдены\n\n`;
            }

            replyMarkup = {
              inline_keyboard: [
                [{ text: "🔙 Назад к деталям", callback_data: `accredit_view_${applicationId}` }]
              ]
            };
            break;

          case 'documents':
            messageText = `📄 ЮРИДИЧЕСКИЕ ДОКУМЕНТЫ ЗАЯВКИ НА АККРЕДИТАЦИЮ\n\n`;
            messageText += `🏢 Поставщик: ${filesData.supplierName}\n`;
            messageText += `🆔 ID заявки: ${filesData.applicationId}\n\n`;
            
            if (filesData.documents && filesData.documents.length > 0) {
              console.log("🔍 DEBUG: Найдено документов:", filesData.documents.length);
              
              filesData.documents.forEach((doc: any, index: number) => {
                messageText += `${index + 1}. ${doc.name}\n`;
                messageText += `   Тип: ${doc.type}\n`;
                messageText += `   Размер: ${(doc.size / 1024).toFixed(1)} KB\n`;
                messageText += `   Файл: ${doc.fileName}\n`;
                messageText += `   URL: ${doc.public_url ? '✅ Есть' : '❌ Нет'}\n\n`;
              });
              
              // Отправляем документы в Telegram
              for (let docIndex = 0; docIndex < filesData.documents.length; docIndex++) {
                const doc = filesData.documents[docIndex];
                console.log("🔍 DEBUG: Обработка документа:", {
                  name: doc.name,
                  hasUrl: !!doc.public_url,
                  url: doc.public_url
                });
                
                if (doc.public_url) {
                  try {
                    console.log("📤 DEBUG: Отправляем документ через новый API");
                    
                    // Используем новый API для отправки документа
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-accreditation-legal-document?applicationId=${applicationId}&docIndex=${docIndex}&chatId=${callbackQuery.message.chat.id}`, {
                      method: 'POST'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                      console.log("✅ DEBUG: Документ отправлен успешно через новый API");
                    } else {
                      console.error("❌ DEBUG: Ошибка отправки документа через новый API:", result.error);
                      // Fallback: отправляем ссылку
                      await service.sendMessage(callbackQuery.message.chat.id, `🔗 Ссылка на документ: ${doc.public_url}`);
                    }
                  } catch (docError) {
                    console.error("❌ DEBUG: Ошибка отправки документа:", docError);
                    // Если не удалось отправить документ, отправляем ссылку
                    await service.sendMessage(callbackQuery.message.chat.id, `🔗 Ссылка на документ: ${doc.public_url}`);
                  }
                } else {
                  console.log("❌ DEBUG: Нет public_url для документа:", doc);
                  await service.sendMessage(callbackQuery.message.chat.id, `❌ Нет URL для документа: ${doc.name}`);
                }
              }
            } else {
              messageText += `❌ Документы не найдены\n\n`;
              console.log("❌ DEBUG: Документы не найдены в данных");
            }

            replyMarkup = {
              inline_keyboard: [
                [{ text: "🔙 Назад к деталям", callback_data: `accredit_view_${applicationId}` }]
              ]
            };
            break;

          case 'summary':
            messageText = `📊 СТАТИСТИКА ФАЙЛОВ ЗАЯВКИ НА АККРЕДИТАЦИЮ\n\n`;
            messageText += `🏢 Поставщик: ${filesData.supplierName}\n`;
            messageText += `🆔 ID заявки: ${filesData.applicationId}\n\n`;
            messageText += `📦 Товаров: ${filesData.summary.products}\n`;
            messageText += `📷 Изображений: ${filesData.summary.totalImages}\n`;
            messageText += `📋 Сертификатов: ${filesData.summary.totalCertificates}\n`;
            messageText += `📄 Документов: ${filesData.summary.totalDocuments}\n\n`;

            if (filesData.products && filesData.products.length > 0) {
              messageText += `📋 ДЕТАЛИ ПО ТОВАРАМ:\n`;
              filesData.products.forEach((product: any, index: number) => {
                messageText += `${index + 1}. ${product.name}\n`;
                messageText += `   📷 Изображений: ${product.imagesCount}\n`;
                messageText += `   📋 Сертификатов: ${product.certificatesCount}\n`;
              });
            }

            replyMarkup = {
              inline_keyboard: [
                [{ text: "🔙 Назад к деталям", callback_data: `accredit_view_${applicationId}` }]
              ]
            };
            break;
        }

        if (replyMarkup) {
          await service.sendMessageWithButtons(callbackQuery.message.chat.id, messageText, replyMarkup, 'Markdown');
        } else {
          await service.sendMessage(callbackQuery.message.chat.id, messageText, 'Markdown');
        }

        return NextResponse.json({ 
          ok: true, 
          message: `Files data sent for ${applicationId}` 
        });
      } catch (error: any) {
        console.error("❌ Accreditation files error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // ========================================
    // 📷 ОБРАБОТКА ИЗОБРАЖЕНИЙ И СЕРТИФИКАТОВ ТОВАРОВ
    // ========================================

    // Просмотр изображений конкретного товара
    if (data.startsWith("accredit_product_images_")) {
      const parts = data.split('_');
      const applicationId = parts[3];
      const productIndex = parts[4];
      
      try {
        await service.answerCallbackQuery(callbackQuery.id, "📷 Загружаем изображения...");
        
        console.log("🔍 DEBUG: Запрос изображений для товара:", { applicationId, productIndex });
        
        // Получаем данные изображений товара
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/telegram/get-accreditation-files?applicationId=${applicationId}&type=product_images&productIndex=${productIndex}`);
        const result = await response.json();
        
        console.log("🔍 DEBUG: Ответ API файлов:", JSON.stringify(result, null, 2));
        
        if (!result.success) {
          await service.answerCallbackQuery(callbackQuery.id, "❌ Ошибка загрузки изображений", true);
          return NextResponse.json({ ok: false, error: result.error });
        }

        const filesData = result.data;
        console.log("🔍 DEBUG: Данные файлов:", JSON.stringify(filesData, null, 2));
        
        let messageText = `📷 ИЗОБРАЖЕНИЯ ТОВАРА\n\n`;
        messageText += `🏢 Поставщик: ${filesData.supplierName}\n`;
        messageText += `🆔 ID заявки: ${filesData.applicationId}\n`;
        messageText += `📦 Товар: ${filesData.productName}\n\n`;
        
        if (filesData.images && filesData.images.length > 0) {
          console.log("🔍 DEBUG: Найдено изображений:", filesData.images.length);
          
          filesData.images.forEach((image: any, index: number) => {
            messageText += `${index + 1}. ${image.name}\n`;
            messageText += `   Размер: ${(image.size / 1024).toFixed(1)} KB\n`;
            messageText += `   Тип: ${image.type}\n`;
            messageText += `   URL: ${image.public_url ? '✅ Есть' : '❌ Нет'}\n\n`;
          });
          
          // Отправляем изображения в Telegram
          for (let imageIndex = 0; imageIndex < filesData.images.length; imageIndex++) {
            const image = filesData.images[imageIndex];
            console.log("🔍 DEBUG: Обработка изображения:", {
              name: image.name,
              hasUrl: !!image.public_url,
              url: image.public_url
            });
            
            if (image.public_url) {
              try {
                console.log("📤 DEBUG: Отправляем изображение через новый API");
                
                // Используем новый API для отправки документа
                const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-accreditation-document?applicationId=${applicationId}&productIndex=${productIndex}&imageIndex=${imageIndex}&chatId=${callbackQuery.message.chat.id}`, {
                  method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                  console.log("✅ DEBUG: Изображение отправлено успешно через новый API");
                } else {
                  console.error("❌ DEBUG: Ошибка отправки через новый API:", result.error);
                  // Fallback: отправляем ссылку
                  await service.sendMessage(callbackQuery.message.chat.id, `🔗 Ссылка на изображение: ${image.public_url}`);
                }
              } catch (photoError) {
                console.error("❌ DEBUG: Ошибка отправки изображения:", photoError);
                // Если не удалось отправить фото, отправляем ссылку
                await service.sendMessage(callbackQuery.message.chat.id, `🔗 Ссылка на изображение: ${image.public_url}`);
              }
            } else {
              console.log("❌ DEBUG: Нет public_url для изображения:", image);
              await service.sendMessage(callbackQuery.message.chat.id, `❌ Нет URL для изображения: ${image.name}`);
            }
          }
        } else {
          messageText += `❌ Изображения не найдены\n\n`;
          console.log("❌ DEBUG: Изображения не найдены в данных");
        }

        const replyMarkup = {
          inline_keyboard: [
            [{ text: "🔙 Назад к товарам", callback_data: `accredit_files_${applicationId}_products` }]
          ]
        };

        await service.sendMessageWithButtons(callbackQuery.message.chat.id, messageText, replyMarkup, 'Markdown');

        return NextResponse.json({ 
          ok: true, 
          message: `Product images sent for ${applicationId}, product ${productIndex}` 
        });
      } catch (error: any) {
        console.error("❌ Product images error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // Просмотр сертификатов конкретного товара
    if (data.startsWith("accredit_product_certs_")) {
      const parts = data.split('_');
      const applicationId = parts[3];
      const productIndex = parts[4];
      
      try {
        await service.answerCallbackQuery(callbackQuery.id, "📋 Загружаем сертификаты...");
        
        console.log("🔍 DEBUG: Запрос сертификатов для товара:", { applicationId, productIndex });
        
        // Получаем данные сертификатов товара
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/telegram/get-accreditation-files?applicationId=${applicationId}&type=product_certificates&productIndex=${productIndex}`);
        const result = await response.json();
        
        console.log("🔍 DEBUG: Ответ API сертификатов:", JSON.stringify(result, null, 2));
        
        if (!result.success) {
          await service.answerCallbackQuery(callbackQuery.id, "❌ Ошибка загрузки сертификатов", true);
          return NextResponse.json({ ok: false, error: result.error });
        }

        const filesData = result.data;
        console.log("🔍 DEBUG: Данные сертификатов:", JSON.stringify(filesData, null, 2));
        
        let messageText = `📋 СЕРТИФИКАТЫ ТОВАРА\n\n`;
        messageText += `🏢 Поставщик: ${filesData.supplierName}\n`;
        messageText += `🆔 ID заявки: ${filesData.applicationId}\n`;
        messageText += `📦 Товар: ${filesData.productName}\n\n`;
        
        if (filesData.certificates && filesData.certificates.length > 0) {
          console.log("🔍 DEBUG: Найдено сертификатов:", filesData.certificates.length);
          
          filesData.certificates.forEach((cert: any, index: number) => {
            messageText += `${index + 1}. ${cert.name}\n`;
            messageText += `   Размер: ${(cert.size / 1024).toFixed(1)} KB\n`;
            messageText += `   Тип: ${cert.type}\n`;
            messageText += `   URL: ${cert.public_url ? '✅ Есть' : '❌ Нет'}\n\n`;
          });
          
          // Отправляем сертификаты в Telegram
          for (let certIndex = 0; certIndex < filesData.certificates.length; certIndex++) {
            const cert = filesData.certificates[certIndex];
            console.log("🔍 DEBUG: Обработка сертификата:", {
              name: cert.name,
              hasUrl: !!cert.public_url,
              url: cert.public_url
            });
            
            if (cert.public_url) {
              try {
                console.log("📤 DEBUG: Отправляем сертификат через новый API");
                
                // Используем новый API для отправки сертификата
                const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-accreditation-certificate?applicationId=${applicationId}&productIndex=${productIndex}&certIndex=${certIndex}&chatId=${callbackQuery.message.chat.id}`, {
                  method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                  console.log("✅ DEBUG: Сертификат отправлен успешно через новый API");
                } else {
                  console.error("❌ DEBUG: Ошибка отправки сертификата через новый API:", result.error);
                  // Проверяем, существует ли файл
                  const fileCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/find-file?fileName=${encodeURIComponent(cert.name)}`);
                  const fileCheckResult = await fileCheckResponse.json();
                  
                  if (fileCheckResult.success && Object.values(fileCheckResult.results).some((bucket: any) => bucket.found)) {
                    // Файл существует, но не удалось отправить - отправляем ссылку
                    await service.sendMessage(callbackQuery.message.chat.id, `🔗 Ссылка на сертификат: ${cert.public_url}`);
                  } else {
                    // Файл не существует
                    await service.sendMessage(callbackQuery.message.chat.id, `⚠️ Файл сертификата не найден: ${cert.name}\n\nЭто может быть связано с тем, что файл был загружен до обновления системы.`);
                  }
                }
              } catch (certError) {
                console.error("❌ DEBUG: Ошибка отправки сертификата:", certError);
                // Проверяем существование файла
                try {
                  const fileCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/find-file?fileName=${encodeURIComponent(cert.name)}`);
                  const fileCheckResult = await fileCheckResponse.json();
                  
                  if (fileCheckResult.success && Object.values(fileCheckResult.results).some((bucket: any) => bucket.found)) {
                    await service.sendMessage(callbackQuery.message.chat.id, `🔗 Ссылка на сертификат: ${cert.public_url}`);
                  } else {
                    await service.sendMessage(callbackQuery.message.chat.id, `⚠️ Файл сертификата не найден: ${cert.name}\n\nЭто может быть связано с тем, что файл был загружен до обновления системы.`);
                  }
                } catch (fileCheckError) {
                  await service.sendMessage(callbackQuery.message.chat.id, `⚠️ Ошибка проверки файла: ${cert.name}`);
                }
              }
            } else {
              console.log("❌ DEBUG: Нет public_url для сертификата:", cert);
              await service.sendMessage(callbackQuery.message.chat.id, `❌ Нет URL для сертификата: ${cert.name}`);
            }
          }
        } else {
          messageText += `❌ Сертификаты не найдены\n\n`;
          console.log("❌ DEBUG: Сертификаты не найдены в данных");
        }

        const replyMarkup = {
          inline_keyboard: [
            [{ text: "🔙 Назад к товарам", callback_data: `accredit_files_${applicationId}_products` }]
          ]
        };

        await service.sendMessageWithButtons(callbackQuery.message.chat.id, messageText, replyMarkup, 'Markdown');

        return NextResponse.json({ 
          ok: true, 
          message: `Product certificates sent for ${applicationId}, product ${productIndex}` 
        });
      } catch (error: any) {
        console.error("❌ Product certificates error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    return NextResponse.json({ ok: true, message: "Callback query processed" });
    
  } catch (error: any) {
    console.error("❌ Callback query error:", error);
    return NextResponse.json({ ok: false, error: error.message });
  }
} 