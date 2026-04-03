import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { db } from '@/lib/db'
import { createHmac, timingSafeEqual } from "crypto";

// 🚀 GET2B WEBHOOK - Интеграция с основным сайтом

interface Get2BWebhookPayload {
  type: 'lead' | 'contact' | 'consultation' | 'project_request';
  data: {
    name?: string;
    email?: string; 
    phone?: string;
    company?: string;
    message?: string;
    project_details?: {
      product_type?: string;
      quantity?: string;
      budget?: string;
      timeline?: string;
    };
    source?: string; // откуда пришла заявка
    utm_params?: Record<string, string>;
  };
  timestamp: string;
  signature?: string; // для верификации
}

// db imported from @/lib/db above

export async function POST(req: NextRequest) {
  try {
    
    const body: Get2BWebhookPayload = await req.json();

    // Верификация подписи (опционально)
    const signature = req.headers.get('x-get2b-signature');
    if (signature && !verifySignature(body, signature)) {
      logger.error('❌ Неверная подпись webhook');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Обработка разных типов webhook'ов
    switch (body.type) {
      case 'lead':
        return handleLead(body.data);
      
      case 'contact':
        return handleContact(body.data);
      
      case 'consultation':
        return handleConsultation(body.data);
      
      case 'project_request':
        return handleProjectRequest(body.data);
      
      default:
        logger.warn('⚠️ Неизвестный тип webhook:', body.type);
        return NextResponse.json({ error: 'Unknown webhook type' }, { status: 400 });
    }

  } catch (error) {
    logger.error('💥 Ошибка обработки Get2B webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint для проверки статуса webhook
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const test = url.searchParams.get('test');

  if (test === 'true') {
    // Тестовый режим
    return NextResponse.json({
      status: 'active',
      webhook_url: process.env.NEXT_PUBLIC_BASE_URL + '/api/get2b-webhook',
      supported_events: ['lead', 'contact', 'consultation', 'project_request'],
      db_connected: true,
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({ message: 'Get2B Webhook is active' });
}

// 📋 Обработка лидов (заявки с лендинга)
async function handleLead(data: Get2BWebhookPayload['data']) {

  try {
    let leadId = null;
    
    // Пытаемся сохранить в базу данных, если Supabase доступен
    if (db) {
      try {
        const { data: lead, error: leadError } = await db
          .from('leads')
          .insert({
            user_id: null, // пока не создаем пользователя
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            message: data.message,
            source: data.source || 'website',
            utm_params: data.utm_params,
            status: 'new',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (leadError) {
          logger.error('❌ Ошибка сохранения лида в БД:', leadError);
          // Не прерываем выполнение, продолжаем без сохранения
        } else {
          leadId = lead.id;
        }
      } catch (dbError) {
        logger.error('❌ Ошибка подключения к БД:', dbError);
        // Продолжаем без сохранения
      }
    }

    // Отправляем уведомление в Telegram (если настроен)
    await notifyTelegramAboutLead({
      id: leadId,
      ...data,
      source: data.source || 'website'
    });

    // Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      lead_id: leadId,
      message: leadId ? 'Лид успешно сохранен' : 'Лид обработан (БД недоступна)',
      received_data: data
    });

  } catch (error) {
    logger.error('💥 Ошибка обработки лида:', error);
    throw error;
  }
}

// 📞 Обработка заявок на контакт
async function handleContact(data: Get2BWebhookPayload['data']) {
  
  // Обрабатываем как обычный лид
  return handleLead({ ...data, source: 'contact_form' });
}

// 💼 Обработка заявок на консультацию
async function handleConsultation(data: Get2BWebhookPayload['data']) {
  
  // Обрабатываем как обычный лид
  return handleLead({ ...data, source: 'consultation_form' });
}

// 🏗️ Обработка заявок на создание проекта
async function handleProjectRequest(data: Get2BWebhookPayload['data']) {
  
  // Добавляем детали проекта в сообщение
  const projectMessage = [
    data.message || '',
    data.project_details?.product_type ? `Тип товара: ${data.project_details.product_type}` : '',
    data.project_details?.quantity ? `Количество: ${data.project_details.quantity}` : '',
    data.project_details?.budget ? `Бюджет: ${data.project_details.budget}` : '',
    data.project_details?.timeline ? `Сроки: ${data.project_details.timeline}` : ''
  ].filter(Boolean).join('\n');

  // Обрабатываем как обычный лид с расширенным сообщением
  return handleLead({ 
    ...data, 
    message: projectMessage,
    source: 'project_request_form' 
  });
}

// 🔐 Верификация подписи HMAC-SHA256
function verifySignature(payload: Get2BWebhookPayload, signature: string): boolean {
  const secret = process.env.GET2B_WEBHOOK_SECRET;

  // Если секрет не установлен, логируем предупреждение
  if (!secret) {
    logger.warn('⚠️ GET2B_WEBHOOK_SECRET не установлен - проверка подписи отключена');
    return true;
  }

  try {
    // Создаем HMAC-SHA256 подпись из payload
    const payloadString = JSON.stringify(payload);
    const expectedSignature = createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    // Используем timing-safe сравнение для защиты от timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    // Проверяем длину буферов
    if (signatureBuffer.length !== expectedBuffer.length) {
      logger.error('❌ Неверная длина подписи');
      return false;
    }

    const isValid = timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isValid) {
      logger.error('❌ Подпись не совпадает');
    }

    return isValid;
  } catch (error) {
    logger.error('❌ Ошибка проверки подписи:', error);
    return false;
  }
}

// 📱 Уведомления в Telegram
async function notifyTelegramAboutLead(lead: any) {
  try {
    const message = `🎯 НОВЫЙ ЛИД с сайта Get2B!\n\n` +
      `👤 Имя: ${lead.name || 'Не указано'}\n` +  
      `📧 Email: ${lead.email || 'Не указано'}\n` +
      `📱 Телефон: ${lead.phone || 'Не указано'}\n` +
      `🏢 Компания: ${lead.company || 'Не указано'}\n` +
      `💬 Сообщение: ${lead.message || 'Нет сообщения'}\n` +
      `🌐 Источник: ${lead.source}\n` +
      `⏰ Время: ${new Date().toLocaleString('ru-RU')}`;

    await sendTelegramMessage(message);
  } catch (error) {
    logger.error('❌ Ошибка отправки уведомления о лиде:', error);
  }
}

async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    logger.warn('⚠️ Telegram не настроен');
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

  } catch (error) {
    logger.error('❌ Ошибка отправки в Telegram:', error);
  }
} 