// Используем встроенный fetch в Node.js

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
    console.log('🧪 Тестирование уведомления об аккредитации...');
    
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
    console.error('❌ Ошибка тестирования:', error);
  }
}

async function testBotCommands() {
  console.log('\n🤖 Тестирование команд бота...');
  console.log('Доступные команды для тестирования в Telegram:');
  console.log('/start - Начало работы с ботом');
  console.log('/help - Справка по командам');
  console.log('/accredit - Заявки на аккредитацию');
  console.log('/accredit_pending - Ожидающие заявки');
  console.log('/accredit_view 03e0c659-5323-4394-a8c0-22f73222f3fa - Детали заявки');
  console.log('/accredit_approve 03e0c659-5323-4394-a8c0-22f73222f3fa - Одобрить заявку');
  console.log('/accredit_reject 03e0c659-5323-4394-a8c0-22f73222f3fa Причина - Отклонить заявку');
}

async function runTests() {
  console.log('🚀 Запуск тестов функционала аккредитации в Telegram боте\n');
  
  await testAccreditationNotification();
  await testBotCommands();
  
  console.log('\n📋 Инструкции для тестирования:');
  console.log('1. Убедитесь, что сервер запущен (npm run dev)');
  console.log('2. Убедитесь, что ngrok настроен и webhook активен');
  console.log('3. Отправьте команды в Telegram бот @get2b_chathub_bot');
  console.log('4. Проверьте получение уведомлений о заявках на аккредитацию');
  console.log('5. Протестируйте кнопки одобрения/отклонения заявок');
}

runTests(); 