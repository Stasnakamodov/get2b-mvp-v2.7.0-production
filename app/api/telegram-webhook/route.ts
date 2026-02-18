import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/src/shared/lib/logger";
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { changeProjectStatus } from "@/lib/supabaseProjectStatus"
import { ProjectStatus } from "@/lib/types/project-status"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    logger.info("📨 Webhook body:", JSON.stringify(body, null, 2))
    logger.info("🔍 Проверяем callback_query:", {
      hasCallbackQuery: !!body.callback_query,
      callbackData: body.callback_query?.data,
      callbackId: body.callback_query?.id
    })

    // Добавляем проверку наличия message с файлом в самом начале
    if (body.message) {
      logger.info("💬 Получено сообщение:", {
        messageId: body.message.message_id,
        hasPhoto: !!body.message.photo,
        hasDocument: !!body.message.document,
        hasReplyTo: !!body.message.reply_to_message,
        text: body.message.text?.substring(0, 100)
      });
    }

    // Проверяем наличие callback_query
    if (!body.callback_query && !body.message) {
      logger.info("❌ Нет callback_query и message, завершаем");
      return NextResponse.json({ ok: true })
    }

    // Если есть message с файлом, обрабатываем его ПЕРВЫМ
    if (body.message?.photo || body.message?.document) {
      logger.info("📁 Получен файл в webhook:", {
        hasPhoto: !!body.message?.photo,
        hasDocument: !!body.message?.document,
        messageId: body.message?.message_id,
        hasReplyTo: !!body.message?.reply_to_message
      });

      const message = body.message;
      const replyToMessage = message.reply_to_message;
      
      logger.info("🔍 Проверяем reply_to_message:", {
        hasReplyTo: !!replyToMessage,
        replyText: replyToMessage?.text?.substring(0, 100),
        includesLoadingText: replyToMessage?.text?.includes("Загрузка чека для проекта")
      });
      
      // Проверяем, что это ответ на сообщение о загрузке чека
      if (replyToMessage && replyToMessage.text?.includes("Загрузка чека для проекта")) {
        logger.info("✅ Найдено сообщение о загрузке чека");
        
        const projectIdMatch = replyToMessage.text.match(/проекта ([a-f0-9-]+)/);
        logger.info("🔍 Поиск project ID:", {
          projectIdMatch: projectIdMatch?.[1],
          fullText: replyToMessage.text
        });
        
        if (projectIdMatch) {
          const projectId = projectIdMatch[1];
          logger.info("🎯 Начинаем обработку файла для проекта:", projectId);
          
          try {
            let fileId = "";
            let fileName = "receipt";
            
            if (message.photo) {
              // Берем фото наибольшего размера
              const photo = message.photo[message.photo.length - 1];
              fileId = photo.file_id;
              fileName = "receipt.jpg";
            } else if (message.document) {
              fileId = message.document.file_id;
              fileName = message.document.file_name || "receipt";
            }
            
            logger.info("📄 Обрабатываем файл:", { fileId, fileName });
            
            // Получаем URL файла от Telegram
            const fileResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
            const fileData = await fileResponse.json();
            
            if (fileData.ok) {
              const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
              logger.info("🔗 URL файла от Telegram:", fileUrl);
              
              // Скачиваем файл с Telegram серверов
              logger.info("⬇️ Скачиваем файл с Telegram...");
              const fileDownloadResponse = await fetch(fileUrl);
              if (!fileDownloadResponse.ok) {
                throw new Error("Не удалось скачать файл с Telegram");
              }
              
              const fileBuffer = await fileDownloadResponse.arrayBuffer();
              const fileExtension = fileName.split('.').pop() || 'jpg';
              const supabaseFileName = `manager-receipt-${projectId}-${Date.now()}.${fileExtension}`;
              
              logger.info("📁 Загружаем файл в Supabase Storage:", {
                fileName: supabaseFileName,
                size: fileBuffer.byteLength,
                bucket: "step6-client-receipts"
              });
              
              // Загружаем файл в Supabase Storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from("step6-client-receipts")
                .upload(supabaseFileName, fileBuffer, {
                  contentType: message.document?.mime_type || 'image/jpeg',
                  upsert: false
                });
                
              if (uploadError) {
                logger.error("❌ Ошибка загрузки в Supabase Storage:", uploadError);
                throw new Error("Не удалось загрузить файл в Storage: " + uploadError.message);
              }
              
              // Получаем публичный URL файла из Supabase Storage
              const { data: urlData } = supabase.storage
                .from("step6-client-receipts")
                .getPublicUrl(supabaseFileName);
                
              const supabaseFileUrl = urlData.publicUrl;
              logger.info("✅ Файл загружен в Supabase Storage:", supabaseFileUrl);
              
              // Получаем текущие данные проекта
              const { data: currentProject, error: fetchError } = await supabase
                .from("projects")
                .select("receipts, status")
                .eq("id", projectId)
                .single()

              if (fetchError) {
                logger.error("❌ Ошибка получения проекта:", fetchError)
                throw new Error("Проект не найден")
              }

              logger.info("📋 Текущий проект:", { 
                status: currentProject.status, 
                hasReceipts: !!currentProject.receipts 
              });

              // Создаем объект с чеками (клиентский и менеджерский)
              const receiptsData = {
                client_receipt: currentProject.receipts, // Сохраняем старый чек клиента
                manager_receipt: supabaseFileUrl, // Используем URL из Supabase Storage
                manager_uploaded_at: new Date().toISOString(),
                manager_file_name: supabaseFileName // Сохраняем имя файла для отладки
              }

              logger.info("💾 Сохраняем данные в БД:", receiptsData);

              // Сохраняем URL файла в проект
              const { error: updateError } = await supabase
                .from("projects")
                .update({ 
                  receipts: JSON.stringify(receiptsData), // Сохраняем как JSON
                  status: "in_work", // Меняем статус на "в работе"
                  updated_at: new Date().toISOString()
                })
                .eq("id", projectId)

              if (updateError) {
                logger.error("❌ Ошибка обновления проекта:", updateError)
                throw new Error("Не удалось обновить проект")
              }

              logger.info("✅ Проект обновлен с чеком от менеджера из Supabase Storage")

              // Очищаем флаг отправки запроса для этого проекта
              logger.info(`🧹 Чек загружен для проекта ${projectId}`)
              
              // Отправляем подтверждение в Telegram
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: process.env.TELEGRAM_CHAT_ID,
                  text: `✅ Чек для проекта ${projectId} успешно загружен в хранилище и доступен клиенту на сайте.\n📁 Файл: ${supabaseFileName}`,
                  reply_to_message_id: body.message.message_id
                })
              })
              
              return NextResponse.json({ 
                ok: true, 
                message: `Receipt uploaded to Supabase Storage for project ${projectId}`,
                file_url: supabaseFileUrl
              });
            } else {
              logger.error("❌ Ошибка получения файла от Telegram:", fileData);
              throw new Error("Не удалось получить файл от Telegram");
            }
          } catch (error: any) {
            logger.error("❌ File upload error:", error);
            
            // Отправляем сообщение об ошибке
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: process.env.TELEGRAM_CHAT_ID,
                  text: `❌ Ошибка загрузки чека для проекта ${projectId}: ${error.message}`,
                  reply_to_message_id: message.message_id
                })
              });
            }
            
            return NextResponse.json({ ok: false, error: error.message });
          }
        } else {
          logger.info("❌ Project ID не найден в тексте сообщения");
        }
      } else {
        logger.info("❌ Сообщение не является ответом на загрузку чека");
      }
      
      return NextResponse.json({ ok: true, message: "File processed" });
    }

    // Если нет callback_query, завершаем
    if (!body.callback_query) {
      logger.info("❌ Нет callback_query, завершаем");
      return NextResponse.json({ ok: true })
    }

    const { data } = body.callback_query
    logger.info("📝 Callback data:", data)

    // Функция для проверки, является ли ID коротким (атомарный конструктор) или полным UUID
    const isShortId = (callbackData: string): boolean => {
      if (callbackData.startsWith("approve_receipt_") || callbackData.startsWith("reject_receipt_")) {
        const idPart = callbackData.split("_").slice(-1)[0];
        return idPart.length <= 10;
      }
      return false;
    };

    // Обработка одобрения/отклонения проекта (исключаем атомарный конструктор и короткие ID)
    if ((data.startsWith("approve_") || data.startsWith("reject_")) &&
        !data.includes("atomic") &&
        !data.includes("client_receipt") &&
        !isShortId(data)) {
      logger.info("📝 Обрабатываем одобрение/отклонение обычного проекта")

      const data = body.callback_query.data;
      const parts = data.split("_");
      const action = parts[0]; // approve или reject
      
      let type = "";
      let projectId = "";
      
      // Парсим callback_data в зависимости от формата
      if (parts.length >= 3) {
        if (parts[1] === "project") {
          // Формат: approve_project_uuid или reject_project_uuid (классический конструктор)
          type = "project";
          projectId = parts.slice(2).join("_"); // все что после project (может содержать _ в UUID)
        } else {
          // Формат: approve_receipt_uuid или approve_invoice_uuid
          type = parts[1]; // receipt, invoice, spec, etc.
          projectId = parts.slice(2).join("_"); // все что после типа (может содержать _ в UUID)
        }
      } else if (parts.length === 2) {
        // Формат: approve_uuid (без типа)
        type = "spec"; // по умолчанию спецификация
        projectId = parts[1];
      } else {
        throw new Error("Неверный формат callback_data: " + data);
      }
      
      logger.info("Parsed callback_data:", { data, action, type, projectId });
      logger.info("🔍 [DEBUG] Validation - projectId:", { length: projectId.length, formatValid: /^[a-f0-9-]{36}$/.test(projectId) });

      // Получаем текущий статус проекта
      const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
      if (fetchError || !project) throw new Error("Проект не найден");

      let newStatus: ProjectStatus;
      if (action === "approve") {
        // Обработка апрува проекта (классический конструктор)
        if (type === "project") {
          switch (project.status) {
            case "waiting_approval":
              newStatus = "waiting_receipt";
              break;
            default:
              throw new Error("Некорректный статус для апрува проекта: " + project.status);
          }
        }
        // Обработка апрува инвойса
        else if (type === "invoice") {
          switch (project.status) {
            case "waiting_approval":
              newStatus = "waiting_receipt";
              break;
            default:
              throw new Error("Некорректный статус для апрува инвойса: " + project.status);
          }
        } else {
          // Обработка апрува спецификации или чека
        switch (project.status) {
          case "waiting_approval":
            newStatus = "waiting_receipt";
            break;
          case "waiting_receipt":
            newStatus = "receipt_approved";
            break;
          case "receipt_approved":
            // Если проект уже одобрен, переводим на следующий этап
            newStatus = "filling_requisites";
            break;
          case "waiting_client_confirmation":
            newStatus = "completed";
            break;
          default:
            // Для уже обработанных статусов просто возвращаем успех без изменений
            if (project.status === "filling_requisites" || project.status === "in_work" || project.status === "completed") {
              // Отправляем ответ в Telegram без изменения статуса
              if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
                    callback_query_id: body.callback_query.id,
                    text: "Проект уже обработан",
                    show_alert: false
                  })
                })
              }
              return NextResponse.json({ 
                ok: true, 
                message: `Project ${projectId} already processed` 
              })
            }
            throw new Error("Некорректный статус для апрува: " + project.status);
          }
        }
      } else if (action === "reject") {
        // Обработка отклонения проекта (классический конструктор)
        if (type === "project") {
          switch (project.status) {
            case "waiting_approval":
              newStatus = "receipt_rejected";
              break;
            default:
              throw new Error("Некорректный статус для отклонения проекта: " + project.status);
          }
        }
        // Обработка отклонения инвойса
        else if (type === "invoice") {
          switch (project.status) {
            case "waiting_approval":
              newStatus = "draft"; // Возвращаем в черновик для доработки
              break;
            default:
              throw new Error("Некорректный статус для отклонения инвойса: " + project.status);
          }
        } else {
          // Обработка отклонения спецификации или чека
        switch (project.status) {
          case "waiting_approval":
            newStatus = "receipt_rejected";
            break;
          case "waiting_receipt":
            newStatus = "receipt_rejected";
            break;
          case "receipt_approved":
            newStatus = "receipt_rejected";
            break;
          default:
            // Для уже обработанных статусов просто возвращаем успех без изменений
            if (project.status === "receipt_rejected" || project.status === "completed" || project.status === "in_work") {
              // Отправляем ответ в Telegram без изменения статуса
              if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
                    callback_query_id: body.callback_query.id,
                    text: "Проект уже обработан",
                    show_alert: false
                  })
                })
              }
              return NextResponse.json({ 
                ok: true, 
                message: `Project ${projectId} already processed` 
              })
            }
            throw new Error("Некорректный статус для отклонения: " + project.status);
          }
        }
      } else {
        throw new Error("Неизвестное действие: " + action);
      }

      try {
        await changeProjectStatus({
          projectId,
          newStatus,
          changedBy: "telegram_bot",
          comment: `${action === "approve" ? "Одобрено" : "Отклонено"} менеджером через Telegram`,
        })
        // --- Отправляем ответ в Telegram ---
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          let responseText = "";
          if (action === "approve") {
            if (type === "project") {
              responseText = "Проект одобрен! Клиент может загружать чек.";
            } else if (type === "invoice") {
              responseText = "Инвойс одобрен! Проект переходит к загрузке чека.";
            } else {
            switch (project.status) {
              case "waiting_approval":
                responseText = "Проект одобрен! Клиент может загружать чек.";
                break;
              case "waiting_receipt":
                responseText = "Чек одобрен! Проект переходит к следующему этапу.";
                break;
              case "receipt_approved":
                responseText = "Проект переведен на заполнение реквизитов.";
                break;
              case "waiting_client_confirmation":
                responseText = "Проект завершен!";
                break;
              default:
                responseText = "Проект одобрен!";
              }
            }
          } else {
            if (type === "project") {
              responseText = "Проект отклонен. Клиент может внести правки.";
            } else if (type === "invoice") {
              responseText = "Инвойс отклонен. Клиент должен загрузить новый инвойс.";
          } else {
            switch (project.status) {
              case "waiting_approval":
                responseText = "Проект отклонен. Клиент может внести правки.";
                break;
              case "waiting_receipt":
              case "receipt_approved":
                responseText = "Чек отклонен. Клиент должен загрузить новый чек.";
                break;
              default:
                responseText = "Проект отклонен.";
              }
            }
          }
          
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: responseText,
              show_alert: false
            })
          })
        }
        return NextResponse.json({ 
          ok: true, 
          message: `Project ${projectId} ${action === "approve" ? "approved" : "rejected"}` 
        })
      } catch (error: any) {
        logger.error("❌ Status change error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Обработка загрузки чека менеджером
    if (data.startsWith("upload_supplier_receipt_")) {
        const projectId = data.replace("upload_supplier_receipt_", "")

      try {
        // Отправляем ответ с инструкцией для загрузки файла
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "Пожалуйста, ответьте на это сообщение файлом чека",
              show_alert: true
            })
          })
        }

        // Отправляем сообщение с просьбой загрузить файл
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: `📤 Загрузка чека для проекта ${projectId}\n\nПожалуйста, отправьте чек (фото или файл) в ответ на это сообщение. Файл будет автоматически прикреплен к проекту.`,
              reply_markup: {
                force_reply: true,
                selective: true
              }
            })
          })
        }

        return NextResponse.json({ 
          ok: true, 
          message: `Upload dialog opened for project ${projectId}` 
        })
      } catch (error: any) {
        logger.error("❌ Receipt upload dialog error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Обработка подтверждения получения средств
    if (data.startsWith("confirm_receipt_")) {
      const projectId = data.replace("confirm_receipt_", "")
      
      try {
        await changeProjectStatus({
          projectId,
          newStatus: "completed" as ProjectStatus,
          changedBy: "telegram_bot",
          comment: "Получение средств подтверждено",
        })

        return NextResponse.json({ 
          ok: true, 
          message: `Receipt confirmed for project ${projectId}` 
        })
      } catch (error: any) {
        logger.error("❌ Receipt confirmation error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // ========================================
    // 🚀 ОБРАБОТКА АТОМАРНОГО КОНСТРУКТОРА
    // ========================================

    // Одобрение атомарного конструктора
    if (data.startsWith("approve_atomic_")) {
      logger.info("🎯 Обрабатываем одобрение атомарного конструктора:", data)
      const cleanRequestId = data.replace("approve_atomic_", "")
      logger.info("🧹 Очищенный requestId:", cleanRequestId)
      
      try {
        // Ищем запись по очищенному requestId (используем более точный поиск)
        logger.info("🔍 Ищем проект с atomic_request_id содержащим:", cleanRequestId)
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)
          .order("created_at", { ascending: false })
          .limit(1)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для одобрения:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId 
        })

        // Обновляем статус на одобрено
        const { error: approveError } = await supabase
          .from("projects")
          .update({
            atomic_moderation_status: "approved",
            atomic_moderated_at: new Date().toISOString(),
            atomic_moderated_by: "telegram_bot"
          })
          .eq("id", project.id)

        if (approveError) {
          throw new Error("Ошибка одобрения: " + approveError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          logger.info("📤 Отправляем ответ на callback_query:", body.callback_query.id)
          const answerResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "✅ Атомарный конструктор одобрен!",
              show_alert: true
            })
          })
          
          const answerResult = await answerResponse.json()
          logger.info("📤 Ответ на callback_query:", answerResult)
        }

        logger.info("✅ Атомарный конструктор одобрен:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `Atomic constructor ${cleanRequestId} approved` 
        })
      } catch (error: any) {
        logger.error("❌ Atomic constructor approval error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Отклонение атомарного конструктора
    if (data.startsWith("reject_atomic_")) {
      const cleanRequestId = data.replace("reject_atomic_", "")
      
      try {
        // Ищем запись по очищенному requestId
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для отклонения:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId 
        })

        // Обновляем статус на отклонено
        const { error: rejectError } = await supabase
          .from("projects")
          .update({
            atomic_moderation_status: "rejected",
            atomic_moderated_at: new Date().toISOString(),
            atomic_moderated_by: "telegram_bot"
          })
          .eq("id", project.id)

        if (rejectError) {
          throw new Error("Ошибка отклонения: " + rejectError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "❌ Атомарный конструктор отклонен",
              show_alert: true
            })
          })
        }

        logger.info("❌ Атомарный конструктор отклонен:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `Atomic constructor ${cleanRequestId} rejected` 
        })
      } catch (error: any) {
        logger.error("❌ Atomic constructor rejection error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Запрос изменений атомарного конструктора
    if (data.startsWith("request_changes_atomic_")) {
      const cleanRequestId = data.replace("request_changes_atomic_", "")
      
      try {
        // Ищем запись по очищенному requestId
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для запроса изменений:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId 
        })

        // Обновляем статус на доработка
        const { error: revisionError } = await supabase
          .from("projects")
          .update({
            atomic_moderation_status: "revision",
            atomic_moderated_at: new Date().toISOString(),
            atomic_moderated_by: "telegram_bot"
          })
          .eq("id", project.id)

        if (revisionError) {
          throw new Error("Ошибка запроса изменений: " + revisionError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "📋 Запрошены изменения в атомарном конструкторе",
              show_alert: true
            })
          })
        }

        logger.info("📋 Запрошены изменения:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `Atomic constructor ${cleanRequestId} changes requested` 
        })
      } catch (error: any) {
        logger.error("❌ Atomic constructor revision error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Обработка одобрения чека
    if (data.startsWith("approve_receipt_")) {
      const cleanRequestId = data.replace("approve_receipt_", "")
      
      try {
        logger.info("✅ Обрабатываем одобрение чека:", cleanRequestId)
        
        // Ищем запись по очищенному requestId
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id, status")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)
          .order("created_at", { ascending: false })
          .limit(1)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для одобрения чека:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId 
        })

        // Обновляем статус проекта
        const { error: approveError } = await supabase
          .from("projects")
          .update({
            status: "receipt_approved",
            updated_at: new Date().toISOString()
          })
          .eq("id", project.id)

        if (approveError) {
          throw new Error("Ошибка одобрения чека: " + approveError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "✅ Чек одобрен! Оплата подтверждена.",
              show_alert: true
            })
          })
        }

        logger.info("✅ Чек одобрен:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `Receipt ${cleanRequestId} approved` 
        })
      } catch (error: any) {
        logger.error("❌ Receipt approval error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Обработка одобрения чека клиента
    if (data.startsWith("approve_client_receipt_")) {
      const cleanRequestId = data.replace("approve_client_receipt_", "")
      
      try {
        logger.info("✅ Обрабатываем одобрение чека клиента:", cleanRequestId)
        
        // Ищем запись по очищенному requestId
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id, status, client_confirmation_url")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)
          .order("created_at", { ascending: false })
          .limit(1)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для одобрения чека клиента:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId,
          hasClientReceipt: !!project.client_confirmation_url
        })

        if (!project.client_confirmation_url) {
          throw new Error("Чек клиента не найден")
        }

        // Обновляем статус проекта на completed
        const { error: approveError } = await supabase
          .from("projects")
          .update({
            status: "completed",
            client_confirmation_status: "approved",
            updated_at: new Date().toISOString()
          })
          .eq("id", project.id)

        if (approveError) {
          throw new Error("Ошибка одобрения чека клиента: " + approveError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "✅ Чек клиента одобрен! Проект завершен.",
              show_alert: true
            })
          })
        }

        logger.info("✅ Чек клиента одобрен, проект завершен:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `Client receipt ${cleanRequestId} approved, project completed` 
        })
      } catch (error: any) {
        logger.error("❌ Client receipt approval error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Обработка отклонения чека клиента
    if (data.startsWith("reject_client_receipt_")) {
      const cleanRequestId = data.replace("reject_client_receipt_", "")
      
      try {
        logger.info("❌ Обрабатываем отклонение чека клиента:", cleanRequestId)
        
        // Ищем запись по очищенному requestId
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id, status, client_confirmation_url")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)
          .order("created_at", { ascending: false })
          .limit(1)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для отклонения чека клиента:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId,
          hasClientReceipt: !!project.client_confirmation_url
        })

        // Обновляем статус проекта
        const { error: rejectError } = await supabase
          .from("projects")
          .update({
            client_confirmation_status: "rejected",
            updated_at: new Date().toISOString()
          })
          .eq("id", project.id)

        if (rejectError) {
          throw new Error("Ошибка отклонения чека клиента: " + rejectError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "❌ Чек клиента отклонен. Клиент должен загрузить новый чек.",
              show_alert: true
            })
          })
        }

        logger.info("❌ Чек клиента отклонен:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `Client receipt ${cleanRequestId} rejected` 
        })
      } catch (error: any) {
        logger.error("❌ Client receipt rejection error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Обработка отклонения чека
    if (data.startsWith("reject_receipt_")) {
      const cleanRequestId = data.replace("reject_receipt_", "")
      
      try {
        logger.info("❌ Обрабатываем отклонение чека:", cleanRequestId)
        
        // Ищем запись по очищенному requestId
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id, status")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)
          .order("created_at", { ascending: false })
          .limit(1)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для отклонения чека:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId 
        })

        // Обновляем статус проекта
        const { error: rejectError } = await supabase
          .from("projects")
          .update({
            status: "receipt_rejected",
            updated_at: new Date().toISOString()
          })
          .eq("id", project.id)

        if (rejectError) {
          throw new Error("Ошибка отклонения чека: " + rejectError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "❌ Чек отклонен. Требуется новый чек.",
              show_alert: true
            })
          })
        }

        logger.info("❌ Чек отклонен:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `Receipt ${cleanRequestId} rejected` 
        })
      } catch (error: any) {
        logger.error("❌ Receipt rejection error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // Запрос нового чека
    if (data.startsWith("request_new_receipt_")) {
      const cleanRequestId = data.replace("request_new_receipt_", "")
      
      try {
        logger.info("📋 Обрабатываем запрос нового чека:", cleanRequestId)
        
        // Ищем запись по очищенному requestId
        const { data: projects, error: searchError } = await supabase
          .from("projects")
          .select("id, atomic_request_id, status")
          .ilike("atomic_request_id", `%${cleanRequestId}%`)
          .order("created_at", { ascending: false })
          .limit(1)

        if (searchError) {
          throw new Error("Ошибка поиска: " + searchError.message)
        }

        if (!projects || projects.length === 0) {
          throw new Error("Запрос не найден")
        }

        const project = projects[0]
        logger.info("🔍 Найдена запись для запроса нового чека:", { 
          projectId: project.id, 
          originalRequestId: project.atomic_request_id,
          cleanRequestId 
        })

        // Обновляем статус проекта
        const { error: requestError } = await supabase
          .from("projects")
          .update({
            status: "waiting_receipt",
            updated_at: new Date().toISOString()
          })
          .eq("id", project.id)

        if (requestError) {
          throw new Error("Ошибка запроса нового чека: " + requestError.message)
        }

        // Отправляем ответ в Telegram
        if (body.callback_query?.id && process.env.TELEGRAM_BOT_TOKEN) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              callback_query_id: body.callback_query.id,
              text: "📋 Запрошен новый чек. Ожидаем загрузки.",
              show_alert: true
            })
          })
        }

        logger.info("📋 Запрошен новый чек:", cleanRequestId)
        return NextResponse.json({ 
          ok: true, 
          message: `New receipt requested for ${cleanRequestId}` 
        })
      } catch (error: any) {
        logger.error("❌ New receipt request error:", error)
        return NextResponse.json({ ok: false, error: error.message })
      }
    }

    // ========================================
    // 💬 ОБРАБОТКА ЧАТ ИНТЕГРАЦИИ
    // ========================================

    // ❌ УДАЛЕНО: Быстрые ответы в чате теперь обрабатываются только в telegram-chat-webhook

    // ❌ УДАЛЕНО: Чат-функции (open_chat_, project_details_) теперь обрабатываются только в telegram-chat-webhook

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    logger.error("❌ Webhook error:", error)
    return NextResponse.json({ ok: false, error: error.message })
  }
}
