// 🤖 Скрипт настройки webhook для Get2B ChatHub Assistant

const CHAT_BOT_TOKEN = "8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g";
const PROJECT_BOT_TOKEN = "7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ";

// ✅ ВАШИ РЕАЛЬНЫЙ NGROK URL!
const NGROK_URL = "https://4cd3a60fa8a1.ngrok-free.app";

const CHAT_WEBHOOK_URL = `${NGROK_URL}/api/telegram-chat-webhook`;
const PROJECT_WEBHOOK_URL = `${NGROK_URL}/api/telegram-webhook`;

async function setupBothWebhooks() {
  console.log('🚀 Настройка webhook для ОБОИХ ботов Get2B...');
  console.log('📡 Chat Webhook:', CHAT_WEBHOOK_URL);
  console.log('📡 Project Webhook:', PROJECT_WEBHOOK_URL);
  
  try {
    // Настраиваем ЧАТ-БОТ
    console.log('\n🤖 Настройка ChatHub Assistant...');
    await setupWebhook(CHAT_BOT_TOKEN, CHAT_WEBHOOK_URL, 'ChatHub Assistant');
    
    // Настраиваем ПРОЕКТНЫЙ БОТ  
    console.log('\n🏗️ Настройка Project Manager...');
    await setupWebhook(PROJECT_BOT_TOKEN, PROJECT_WEBHOOK_URL, 'Project Manager');
    
    console.log('\n✅ ОБА БОТА НАСТРОЕНЫ УСПЕШНО!');
    console.log('\n🎯 ТЕСТИРОВАНИЕ:');
    console.log('1. Создайте проектную комнату в чате: http://localhost:3000/dashboard/ai-chat');
    console.log('2. Отправьте сообщение в проектную комнату');
    console.log('3. Проверьте что уведомление пришло в Telegram');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

async function setupWebhook(token, webhookUrl, botName) {
  console.log(`🔗 Установка webhook для ${botName}...`);
  
  try {
    // Удаляем старый webhook
    const deleteResponse = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
      method: 'POST'
    });
    
    if (deleteResponse.ok) {
      console.log(`✅ Старый webhook удален для ${botName}`);
    }
    
    // Устанавливаем новый webhook
    const setResponse = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true
      })
    });

    if (setResponse.ok) {
      const result = await setResponse.json();
      console.log(`✅ Webhook установлен успешно для ${botName}:`, result);
    } else {
      const error = await setResponse.text();
      console.error(`❌ Ошибка установки webhook для ${botName}:`, error);
    }

    // Проверяем информацию о боте
    const botInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (botInfoResponse.ok) {
      const botInfo = await botInfoResponse.json();
      console.log(`🤖 Информация о боте ${botName}:`, botInfo.result);
    }

    // Проверяем статус webhook
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    if (webhookInfoResponse.ok) {
      const webhookInfo = await webhookInfoResponse.json();
      console.log(`🔗 Информация о webhook для ${botName}:`, webhookInfo.result);
    }

  } catch (error) {
    console.error(`💥 Ошибка настройки webhook для ${botName}:`, error);
  }
}

// Функция для отправки тестового сообщения
async function sendTestMessage(chatId) {
  console.log(`📩 Отправка тестового сообщения в чат ${chatId}...`);
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${CHAT_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🧪 Тестовое сообщение от Get2B ChatHub Assistant

✅ Бот работает!
🔗 Webhook настроен
⚡ Готов к получению уведомлений

Попробуйте команду /start для начала работы.`,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      console.log('✅ Тестовое сообщение отправлено');
    } else {
      const error = await response.text();
      console.error('❌ Ошибка отправки тестового сообщения:', error);
    }
  } catch (error) {
    console.error('💥 Ошибка отправки сообщения:', error);
  }
}

// Запуск настройки
setupBothWebhooks();

console.log(`
🎯 ИНСТРУКЦИИ ПО НАСТРОЙКЕ:

1. ⚠️ ЗАМЕНИТЕ YOUR_NGROK_URL на ваш реальный ngrok URL в строке 7
2. Запустите: node setup-chat-bot-webhook.js
3. Проверьте что оба webhook установлены успешно

🔧 Для получения ngrok URL:
- В новом терминале: ngrok http 3000
- Скопируйте HTTPS URL (например: https://abc123-def456.ngrok.io)
- Замените YOUR_NGROK_URL в этом файле

💡 После настройки ОБА бота будут:
- Проектный: отвечать на апрувы и этапы проектов
- Чат-бот: уведомлять о сообщениях в проектных чатах

🧪 ТЕСТИРОВАНИЕ:
1. Создайте проектную комнату: http://localhost:3000/dashboard/ai-chat  
2. Выберите проект и нажмите "Связаться с менеджером"
3. Отправьте сообщение в созданную проектную комнату
4. Проверьте что уведомление пришло в Telegram чат менеджеров

🚀 Готово к работе с менеджерскими комнатами!
`); 