import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ManagerBotService } from '@/lib/telegram/ManagerBotService';
import { changeProjectStatus } from '@/lib/supabaseProjectStatus';
import { ProjectStatus } from '@/lib/types/project-status';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();

    // Сначала проверяем наличие сообщения с файлом
    if (body.message?.photo || body.message?.document) {
      const message = body.message;
      const replyToMessage = message.reply_to_message;
      
      // Проверяем, что это ответ на сообщение о загрузке чека
      if (replyToMessage && replyToMessage.text?.includes("Загрузка чека для проекта")) {
        
        const projectIdMatch = replyToMessage.text.match(/проекта ([a-f0-9-]+)/);
        
        if (projectIdMatch) {
          const projectId = projectIdMatch[1];
          
          try {
            let fileId = "";
            let fileName = "receipt";
            
            if (message.photo) {
              const photo = message.photo[message.photo.length - 1];
              fileId = photo.file_id;
              fileName = "receipt.jpg";
            } else if (message.document) {
              fileId = message.document.file_id;
              fileName = message.document.file_name || "receipt";
            }
            
            
            // Получаем URL файла от Telegram
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
            const fileData = await fileResponse.json();
            
            if (fileData.ok) {
              const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
              
              // Скачиваем и загружаем файл в Supabase
              const fileDownloadResponse = await fetch(fileUrl);
              const fileBuffer = await fileDownloadResponse.arrayBuffer();
              const fileExtension = fileName.split('.').pop() || 'jpg';
              const supabaseFileName = `manager-receipt-${projectId}-${Date.now()}.${fileExtension}`;
              
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("step6-client-receipts")
                .upload(supabaseFileName, fileBuffer, {
                  contentType: message.document?.mime_type || 'image/jpeg',
                  upsert: false
                });
                
              if (uploadError) {
                throw new Error("Не удалось загрузить файл в Storage: " + uploadError.message);
              }
              
              // Получаем публичный URL
              const { data: urlData } = supabase.storage
                .from("step6-client-receipts")
                .getPublicUrl(supabaseFileName);
                
              const supabaseFileUrl = urlData.publicUrl;
              
              // Получаем текущие данные проекта и обновляем
              const { data: currentProject, error: fetchError } = await supabase
                .from("projects")
                .select("receipts, status")
                .eq("id", projectId)
                .single();

              if (fetchError) {
                throw new Error("Проект не найден");
              }

              const receiptsData = {
                client_receipt: currentProject.receipts,
                manager_receipt: supabaseFileUrl,
                manager_uploaded_at: new Date().toISOString(),
                manager_file_name: supabaseFileName
              };

              // Обновляем проект с правильной сменой статуса
              await changeProjectStatus({
                projectId,
                newStatus: "in_work",
                changedBy: "telegram_bot",
                comment: "Чек от менеджера загружен",
                extraFields: {
                  receipts: JSON.stringify(receiptsData),
                  updated_at: new Date().toISOString()
                }
              });


              const managerBot = new ManagerBotService();
              await managerBot.sendMessage(
                `✅ Чек для проекта ${projectId} успешно загружен и доступен клиенту.\n📁 Файл: ${supabaseFileName}`
              );
              
              return NextResponse.json({ 
                ok: true, 
                message: `Receipt uploaded for project ${projectId}`,
                file_url: supabaseFileUrl
              });
              
            } else {
              throw new Error("Не удалось получить файл от Telegram");
            }
          } catch (error: any) {
            console.error("❌ [WEBHOOK] Ошибка загрузки файла:", error);
            
            const managerBot = new ManagerBotService();
            await managerBot.sendMessage(
              `❌ Ошибка загрузки чека для проекта ${projectId}: ${error.message}`
            );
            
            return NextResponse.json({ ok: false, error: error.message });
          }
        } else {
        }
      } else {
      }
      
      return NextResponse.json({ ok: true, message: "File processed" });
    }

    // Проверяем наличие callback_query
    if (!body.callback_query) {
      return NextResponse.json({ ok: true });
    }

    const callbackQuery = body.callback_query;
    const callbackData = callbackQuery.data;
    const callbackQueryId = callbackQuery.id;
    
    
    const managerBot = new ManagerBotService();

    if (callbackData.startsWith('approve_')) {
      // Правильное извлечение projectId из callback_data
      let projectId: string;
      if (callbackData.includes('_')) {
        // Для формата approve_receipt_uuid или approve_uuid
        const parts = callbackData.split('_');
        if (parts.length >= 3) {
          // approve_receipt_uuid -> берем uuid
          projectId = parts.slice(2).join('_');
        } else {
          // approve_uuid -> берем uuid  
          projectId = parts[1];
        }
      } else {
        // Fallback - убираем только approve_
        projectId = callbackData.replace(/^approve_/, '');
      }
      
      // Определяем новый статус в зависимости от типа одобрения
      let newStatus: ProjectStatus;
      let responseMessage: string;
      
      if (callbackData.includes('receipt')) {
        newStatus = 'receipt_approved';
        responseMessage = `✅ Чек для проекта ${projectId} одобрен!`;
      } else if (callbackData.includes('invoice')) {
        newStatus = 'in_work';
        responseMessage = `✅ Инвойс для проекта ${projectId} одобрен!`;
      } else {
        newStatus = 'waiting_receipt';
        responseMessage = `✅ Проект ${projectId} одобрен! Переведен на следующий шаг`;
      }
      
      // Используем правильную систему смены статуса
      try {
        const result = await changeProjectStatus({
          projectId,
          newStatus,
          changedBy: 'telegram_bot',
          comment: 'Одобрено менеджером через Telegram'
        });
        
        
        await managerBot.answerCallbackQuery(
          callbackQueryId,
          responseMessage
        );
      } catch (error: any) {
        console.error("❌ [WEBHOOK] Ошибка смены статуса:", error);
        await managerBot.answerCallbackQuery(
          callbackQueryId,
          `❌ Ошибка обновления проекта: ${error.message}`
        );
      }
      
    } else if (callbackData.startsWith('reject_')) {
      // Правильное извлечение projectId из callback_data
      let projectId: string;
      if (callbackData.includes('_')) {
        // Для формата reject_receipt_uuid или reject_uuid
        const parts = callbackData.split('_');
        if (parts.length >= 3) {
          // reject_receipt_uuid -> берем uuid
          projectId = parts.slice(2).join('_');
        } else {
          // reject_uuid -> берем uuid  
          projectId = parts[1];
        }
      } else {
        // Fallback - убираем только reject_
        projectId = callbackData.replace(/^reject_/, '');
      }
      
      // Определяем новый статус для отклонения
      let newStatus: ProjectStatus;
      let responseMessage: string;
      
      if (callbackData.includes('receipt')) {
        newStatus = 'receipt_rejected';
        responseMessage = `❌ Чек для проекта ${projectId} отклонен`;
      } else if (callbackData.includes('invoice')) {
        newStatus = 'waiting_manager_receipt';
        responseMessage = `❌ Инвойс для проекта ${projectId} отклонен`;
      } else {
        newStatus = 'receipt_rejected';
        responseMessage = `❌ Проект ${projectId} отклонен`;
      }
      
      // Используем правильную систему смены статуса
      try {
        const result = await changeProjectStatus({
          projectId,
          newStatus,
          changedBy: 'telegram_bot',
          comment: 'Отклонено менеджером через Telegram'
        });
        
        
        await managerBot.answerCallbackQuery(
          callbackQueryId,
          responseMessage
        );
      } catch (error: any) {
        console.error("❌ [WEBHOOK] Ошибка смены статуса при отклонении:", error);
        await managerBot.answerCallbackQuery(
          callbackQueryId,
          `❌ Ошибка обновления проекта: ${error.message}`
        );
      }
    } else if (callbackData.startsWith('upload_supplier_receipt_')) {
      const projectId = callbackData.replace('upload_supplier_receipt_', '');
      
      try {
        // Отвечаем на callback query
        await managerBot.answerCallbackQuery(
          callbackQueryId,
          "Пожалуйста, отправьте чек в ответ на следующее сообщение",
          true
        );
        
        // Отправляем сообщение с просьбой загрузить файл
        const text = `📤 Загрузка чека для проекта ${projectId}\n\nПожалуйста, отправьте чек (фото или файл) в ответ на это сообщение. Файл будет автоматически прикреплен к проекту.`;
        
        await managerBot.sendMessage(text);
        
      } catch (error: any) {
        console.error("❌ [WEBHOOK] Ошибка при открытии диалога загрузки:", error);
        await managerBot.answerCallbackQuery(
          callbackQueryId,
          `❌ Ошибка: ${error.message}`
        );
      }
    } else {
      await managerBot.answerCallbackQuery(
        callbackQueryId,
        "Команда не распознана"
      );
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("💥 [WEBHOOK] ОШИБКА:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}