#!/usr/bin/env node

/**
 * 🧪 Тестирование улучшенной функции просмотра деталей заявки на аккредитацию
 * 
 * Этот скрипт тестирует новую функциональность кнопки "Просмотреть детали"
 * которая теперь показывает подробную информацию о заявке, аналогично деталям проекта
 */

console.log('🧪 Тестирование улучшенной функции просмотра деталей заявки на аккредитацию\n');

// Проверяем переменные окружения
if (!process.env.TELEGRAM_CHAT_BOT_TOKEN) {
  console.error('❌ Ошибка: TELEGRAM_CHAT_BOT_TOKEN не найден в переменных окружения');
  process.exit(1);
}

// Используем TELEGRAM_CHAT_ID если TELEGRAM_CHAT_BOT_CHAT_ID не найден
const chatId = process.env.TELEGRAM_CHAT_BOT_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
if (!chatId) {
  console.error('❌ Ошибка: TELEGRAM_CHAT_ID или TELEGRAM_CHAT_BOT_CHAT_ID не найден в переменных окружения');
  process.exit(1);
}

// Тестовые данные для заявки на аккредитацию
const testAccreditationData = {
  applicationId: '03e0c659-5323-4394-a8c0-22f73222f3fa',
  supplierName: 'Тестовый Поставщик',
  companyName: 'ООО "Тестовая Компания"',
  category: 'Электроника',
  country: 'Россия',
  productsCount: 3,
  certificatesCount: 2,
  legalDocumentsCount: 1
};

async function testAccreditationNotification() {
  try {
    console.log('📤 Отправка уведомления о новой заявке...');
    const response = await fetch('http://localhost:3000/api/telegram/send-accreditation-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAccreditationData)
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('✅ Уведомление отправлено успешно:', result);
    } else {
      console.error('❌ Ошибка отправки уведомления:', result);
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования уведомления:', error);
  }
}

async function testAccreditationDetails() {
  try {
    console.log('🔍 Тестирование просмотра деталей заявки...');
    
    // Имитируем webhook payload от Telegram для кнопки "Просмотреть детали"
    const webhookPayload = {
      update_id: Date.now(),
      callback_query: {
        id: `test_${Date.now()}`,
        from: {
          id: 987654321,
          is_bot: false,
          first_name: "Тестовый",
          last_name: "Менеджер",
          username: "test_manager"
        },
        message: {
          message_id: 123,
          chat: {
            id: parseInt(chatId),
            type: "private"
          },
          date: Math.floor(Date.now() / 1000),
          text: "⭐ НОВАЯ ЗАЯВКА НА АККРЕДИТАЦИЮ"
        },
        data: `accredit_view_${testAccreditationData.applicationId}`
      }
    };

    console.log('📤 Отправка webhook payload для просмотра деталей...');
    const response = await fetch('http://localhost:3000/api/telegram-chat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('✅ Детали заявки отправлены успешно:', result);
    } else {
      console.error('❌ Ошибка отправки деталей:', result);
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования деталей:', error);
  }
}

async function testAllAccreditationFeatures() {
  console.log('🚀 Запуск полного тестирования функций аккредитации...\n');
  
  // Тест 1: Отправка уведомления
  await testAccreditationNotification();
  console.log('');
  
  // Ждем 2 секунды между тестами
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Тест 2: Просмотр деталей
  await testAccreditationDetails();
  console.log('');
  
  console.log('📋 Инструкции для ручного тестирования в Telegram:');
  console.log('1. Проверьте что пришло уведомление о новой заявке');
  console.log('2. Нажмите кнопку "🔍 Просмотреть детали"');
  console.log('3. Проверьте что пришло подробное сообщение с деталями заявки');
  console.log('4. Проверьте что информация структурирована и читаема');
  console.log('');
  
  console.log('🔧 Команды для тестирования в Telegram:');
  console.log('/accredit - список всех заявок на аккредитацию');
  console.log('/accredit_pending - только ожидающие рассмотрения');
  console.log('/accredit_view <id> - просмотр деталей конкретной заявки');
  console.log('/accredit_approve <id> - одобрение заявки');
  console.log('/accredit_reject <id> <причина> - отклонение заявки');
}

// Запускаем тесты
testAllAccreditationFeatures().catch(console.error); 