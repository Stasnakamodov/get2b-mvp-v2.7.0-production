const express = require('express');
const app = express();

app.use(express.json());

// Перехватываем webhook от Telegram для отладки
app.post('/debug-telegram-webhook', (req, res) => {
  console.log('\n🔍 РЕАЛЬНЫЙ WEBHOOK ОТ TELEGRAM:');
  console.log('=====================================');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('=====================================\n');
  
  // Если есть сообщение, показываем детали
  if (req.body.message) {
    const msg = req.body.message;
    console.log('📋 ДЕТАЛИ СООБЩЕНИЯ:');
    console.log(`   Текст: "${msg.text || 'НЕТ ТЕКСТА'}"`);
    console.log(`   От: ${msg.from?.first_name || 'НЕТ ИМЕНИ'} (ID: ${msg.from?.id})`);
    console.log(`   Чат ID: ${msg.chat?.id}`);
    
    if (msg.reply_to_message) {
      console.log(`   Ответ на: "${msg.reply_to_message.text || 'НЕТ ТЕКСТА'}"`);
    } else {
      console.log('   ❌ НЕТ REPLY_TO_MESSAGE - возможно поэтому не работает!');
    }
    console.log('');
  }
  
  res.json({ success: true, message: "Debug webhook received" });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔍 Debug webhook сервер запущен на порту ${PORT}`);
  console.log(`📡 Настройте Telegram webhook на: https://YOUR-NGROK-URL/debug-telegram-webhook`);
}); 