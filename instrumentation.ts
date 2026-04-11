export async function register() {
  // Автоустановка Telegram вебхуков при старте сервера (только server-side, только production)
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
    setupTelegramWebhooks()
  }
}

async function setupTelegramWebhooks() {
  const baseUrl = 'https://get2b.pro'

  const webhooks = [
    {
      name: 'Manager bot',
      token: process.env.TELEGRAM_BOT_TOKEN,
      path: '/api/telegram/webhook',
    },
    {
      name: 'Chat bot',
      token: process.env.TELEGRAM_CHAT_BOT_TOKEN,
      path: '/api/telegram-chat-webhook',
    },
  ]

  for (const wh of webhooks) {
    if (!wh.token) {
      console.log(`⏭️ [Webhook] ${wh.name}: токен не задан, пропускаем`)
      continue
    }

    try {
      // Проверяем текущий вебхук
      const infoRes = await fetch(
        `https://api.telegram.org/bot${wh.token}/getWebhookInfo`
      )
      const info = await infoRes.json()
      const expectedUrl = `${baseUrl}${wh.path}`

      if (info.ok && info.result?.url === expectedUrl) {
        console.log(`✅ [Webhook] ${wh.name}: уже установлен (${expectedUrl})`)
        continue
      }

      // Устанавливаем вебхук
      const setRes = await fetch(
        `https://api.telegram.org/bot${wh.token}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: expectedUrl,
            allowed_updates: ['message', 'callback_query'],
          }),
        }
      )
      const setData = await setRes.json()

      if (setData.ok) {
        console.log(`✅ [Webhook] ${wh.name}: установлен → ${expectedUrl}`)
      } else {
        console.error(`❌ [Webhook] ${wh.name}: ошибка установки:`, setData.description)
      }
    } catch (err) {
      console.error(`❌ [Webhook] ${wh.name}: ошибка:`, err)
    }
  }
}
