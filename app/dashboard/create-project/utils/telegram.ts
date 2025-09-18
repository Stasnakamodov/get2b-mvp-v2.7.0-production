// Функции для отправки данных в Telegram

export async function sendPaymentMethodToTelegram(method: string, projectName: string) {
  const text = `Проект: ${projectName}\nВыбран способ оплаты: ${method}`
  // Здесь будет реальная отправка в Telegram
  console.log('Отправка способа оплаты в Telegram:', text)
}

export async function sendPaymentDetailsToTelegram(details: any, projectName: string) {
  const text = `Проект: ${projectName}\nДетали оплаты: ${JSON.stringify(details)}`
  // Здесь будет реальная отправка в Telegram
  console.log('Отправка деталей оплаты в Telegram:', text)
}

export async function sendSupplierReceiptRequestToManagerClient(receiptUrl: string, projectName: string, projectId: string) {
  const text = `Проект: ${projectName}\nЗагружен чек об оплате`
  // Здесь будет реальная отправка в Telegram
  console.log('Отправка запроса чека в Telegram:', text + `\nЧек: ${receiptUrl}`)
} 