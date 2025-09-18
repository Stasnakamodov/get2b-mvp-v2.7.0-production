import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🚀 GET2B WEBHOOK - Интеграция с основным сайтом
// URL: https://945bbafbb0fd.ngrok-free.app

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

// Безопасная инициализация Supabase с service role key (обходит RLS)
let supabase: any = null;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Пробуем сначала service role key, потом anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase инициализирован для webhook с', 
      process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role key (обходит RLS)' : 'anon key');
  } else {
    console.warn('⚠️ Переменные Supabase не найдены, webhook работает без БД');
  }
} catch (error) {
  console.error('❌ Ошибка инициализации Supabase:', error);
}

export async function POST(req: NextRequest) {
  try {
    console.log('🌐 GET2B Webhook: Получен запрос с основного сайта');
    
    const body: Get2BWebhookPayload = await req.json();
    console.log('📦 Webhook payload:', JSON.stringify(body, null, 2));

    // Верификация подписи (опционально)
    const signature = req.headers.get('x-get2b-signature');
    if (signature && !verifySignature(body, signature)) {
      console.error('❌ Неверная подпись webhook');
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
        console.warn('⚠️ Неизвестный тип webhook:', body.type);
        return NextResponse.json({ error: 'Unknown webhook type' }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Ошибка обработки Get2B webhook:', error);
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
      webhook_url: 'https://your-domain.com/api/get2b-webhook',
      supported_events: ['lead', 'contact', 'consultation', 'project_request'],
      supabase_connected: !!supabase,
      using_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({ message: 'Get2B Webhook is active' });
}

// 📋 Обработка лидов (заявки с лендинга)
async function handleLead(data: Get2BWebhookPayload['data']) {
  console.log('🎯 Обработка лида:', data);

  try {
    let leadId = null;
    
    // Пытаемся сохранить в базу данных, если Supabase доступен
    if (supabase) {
      try {
        const { data: lead, error: leadError } = await supabase
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
          console.error('❌ Ошибка сохранения лида в БД:', leadError);
          // Не прерываем выполнение, продолжаем без сохранения
        } else {
          leadId = lead.id;
          console.log('✅ Лид сохранен в БД:', leadId);
        }
      } catch (dbError) {
        console.error('❌ Ошибка подключения к БД:', dbError);
        // Продолжаем без сохранения
      }
    }

    // Логируем данные в любом случае
    console.log('✅ Лид обработан:', {
      id: leadId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      message: data.message,
      source: data.source || 'website'
    });

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
    console.error('💥 Ошибка обработки лида:', error);
    throw error;
  }
}

// 📞 Обработка заявок на контакт
async function handleContact(data: Get2BWebhookPayload['data']) {
  console.log('📞 Обработка заявки на контакт как лид:', data);
  
  // Обрабатываем как обычный лид
  return handleLead({ ...data, source: 'contact_form' });
}

// 💼 Обработка заявок на консультацию
async function handleConsultation(data: Get2BWebhookPayload['data']) {
  console.log('💼 Обработка заявки на консультацию как лид:', data);
  
  // Обрабатываем как обычный лид
  return handleLead({ ...data, source: 'consultation_form' });
}

// 🏗️ Обработка заявок на создание проекта
async function handleProjectRequest(data: Get2BWebhookPayload['data']) {
  console.log('🏗️ Обработка заявки на проект как лид:', data);
  
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

// 🔐 Верификация подписи
function verifySignature(payload: any, signature: string): boolean {
  // Реализация проверки подписи webhook
  // В production должен использовать криптографическую подпись
  const secret = process.env.GET2B_WEBHOOK_SECRET;
  if (!secret) return true; // Пропускаем проверку если секрет не установлен
  
  // TODO: Реализовать HMAC проверку
  return true;
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
    console.error('❌ Ошибка отправки уведомления о лиде:', error);
  }
}

async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.warn('⚠️ Telegram не настроен');
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

    console.log('✅ Уведомление отправлено в Telegram');
  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error);
  }
} 