#!/usr/bin/env node

/**
 * 🧪 Тестирование функциональности просмотра файлов заявок на аккредитацию
 * 
 * Этот скрипт тестирует новую функциональность кнопок для просмотра товаров,
 * сертификатов и документов заявок на аккредитацию в Telegram
 */

console.log('🧪 Тестирование функциональности просмотра файлов заявок на аккредитацию\n');

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

// Тестовые данные
const testApplicationId = '03e0c659-5323-4394-a8c0-22f73222f3fa';

async function testAccreditationFilesAPI() {
  try {
    console.log('🔍 Тестирование API получения файлов заявки...');
    
    // Тест 1: Получение общей информации о файлах
    console.log('\n📊 Тест 1: Общая информация о файлах');
    const summaryResponse = await fetch(`http://localhost:3000/api/telegram/get-accreditation-files?applicationId=${testApplicationId}`);
    const summaryResult = await summaryResponse.json();
    
    if (summaryResponse.ok) {
      console.log('✅ Общая информация получена:', summaryResult.data.summary);
    } else {
      console.error('❌ Ошибка получения общей информации:', summaryResult);
    }

    // Тест 2: Получение информации о товарах
    console.log('\n📦 Тест 2: Информация о товарах');
    const productsResponse = await fetch(`http://localhost:3000/api/telegram/get-accreditation-files?applicationId=${testApplicationId}&type=products`);
    const productsResult = await productsResponse.json();
    
    if (productsResponse.ok) {
      console.log('✅ Информация о товарах получена:', productsResult.data.products?.length || 0, 'товаров');
    } else {
      console.error('❌ Ошибка получения информации о товарах:', productsResult);
    }

    // Тест 3: Получение информации о сертификатах
    console.log('\n📋 Тест 3: Информация о сертификатах');
    const certificatesResponse = await fetch(`http://localhost:3000/api/telegram/get-accreditation-files?applicationId=${testApplicationId}&type=certificates`);
    const certificatesResult = await certificatesResponse.json();
    
    if (certificatesResponse.ok) {
      console.log('✅ Информация о сертификатах получена:', certificatesResult.data.certificates?.length || 0, 'сертификатов');
    } else {
      console.error('❌ Ошибка получения информации о сертификатах:', certificatesResult);
    }

    // Тест 4: Получение информации о документах
    console.log('\n📄 Тест 4: Информация о документах');
    const documentsResponse = await fetch(`http://localhost:3000/api/telegram/get-accreditation-files?applicationId=${testApplicationId}&type=documents`);
    const documentsResult = await documentsResponse.json();
    
    if (documentsResponse.ok) {
      console.log('✅ Информация о документах получена:', documentsResult.data.documents?.length || 0, 'документов');
    } else {
      console.error('❌ Ошибка получения информации о документах:', documentsResult);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования API:', error);
  }
}

async function testTelegramFilesCallback() {
  try {
    console.log('\n📱 Тестирование Telegram callback для файлов...');
    
    // Тест кнопки "📦 Товары"
    const productsWebhookPayload = {
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
          text: "🔍 ДЕТАЛИ ЗАЯВКИ НА АККРЕДИТАЦИЮ"
        },
        data: `accredit_files_${testApplicationId}_products`
      }
    };

    console.log('📤 Отправка webhook payload для просмотра товаров...');
    const response = await fetch('http://localhost:3000/api/telegram-chat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productsWebhookPayload)
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('✅ Callback для товаров обработан успешно:', result);
    } else {
      console.error('❌ Ошибка обработки callback для товаров:', result);
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования Telegram callback:', error);
  }
}

async function testAllFileFeatures() {
  console.log('🚀 Запуск полного тестирования функциональности файлов...\n');
  
  // Тест API
  await testAccreditationFilesAPI();
  
  // Ждем 2 секунды между тестами
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Тест Telegram callback
  await testTelegramFilesCallback();
  
  console.log('\n📋 Инструкции для ручного тестирования в Telegram:');
  console.log('1. Отправьте заявку на аккредитацию');
  console.log('2. В Telegram придет уведомление с кнопками');
  console.log('3. Нажмите "🔍 Просмотреть детали"');
  console.log('4. В деталях появятся новые кнопки:');
  console.log('   - 📦 Товары');
  console.log('   - 📋 Сертификаты');
  console.log('   - 📄 Документы');
  console.log('   - 📊 Статистика');
  console.log('5. Нажмите любую кнопку для просмотра файлов');
  console.log('6. Проверьте что информация отображается корректно');
  console.log('');
  
  console.log('🔧 Команды для тестирования в Telegram:');
  console.log('/accredit - список всех заявок на аккредитацию');
  console.log('/accredit_pending - только ожидающие рассмотрения');
  console.log('/accredit_view <id> - просмотр деталей с кнопками файлов');
  console.log('');
  
  console.log('📁 Новые callback данные:');
  console.log('accredit_files_<id>_products - просмотр товаров');
  console.log('accredit_files_<id>_certificates - просмотр сертификатов');
  console.log('accredit_files_<id>_documents - просмотр документов');
  console.log('accredit_files_<id>_summary - статистика файлов');
}

// Запускаем тесты
testAllFileFeatures().catch(console.error); 