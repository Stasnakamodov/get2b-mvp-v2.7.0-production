import { sendTelegramMessageClient, sendTelegramDocumentClient, sendTelegramProjectApprovalRequestClient } from '@/lib/telegram-client';

interface SpecificationItem {
  name: string;
  code: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  imageUrl?: string;
}

export function useTelegramNotifications() {
  // Отправка спецификации в Telegram
  async function sendSpecificationToTelegram({
    projectName,
    specificationItems,
    currency,
    invoiceType,
    invoiceFileUrl,
    projectId,
  }: {
    projectName: string;
    specificationItems: SpecificationItem[];
    currency: string;
    invoiceType: 'create' | 'upload';
    invoiceFileUrl: string | null;
    projectId: string | null;
  }) {
    try {
      let text = `Проект: ${projectName}\nСпецификация:`;
      specificationItems.forEach((item, idx) => {
        text += `\n${idx + 1}. ${item.name} | Код: ${item.code} | Кол-во: ${item.quantity} ${item.unit} | Цена: ${currency} ${item.price} | Сумма: ${currency} ${item.total}`;
      });
      text += `\nИтого: ${currency} ${specificationItems.reduce((sum, item) => sum + (item.total || 0), 0)}`;

      if (invoiceType === 'upload' && invoiceFileUrl) {
        try {
          await sendTelegramDocumentClient(invoiceFileUrl, text);
        } catch (documentError) {
          console.warn('⚠️ Не удалось отправить документ, отправляем ссылку:', documentError);
          try {
          await sendTelegramMessageClient(`${text}\nСсылка на файл спецификации: ${invoiceFileUrl}`);
          } catch (messageError) {
            console.warn('⚠️ Не удалось отправить сообщение со ссылкой:', messageError);
          }
        }
        if (projectId) {
          try {
            await sendTelegramProjectApprovalRequestClient(text, projectId, "invoice");
          } catch (approvalError) {
            console.warn('⚠️ Не удалось отправить запрос на одобрение:', approvalError);
          }
        }
        return;
      }
      if (projectId) {
        try {
        await sendTelegramProjectApprovalRequestClient(text, projectId);
        } catch (telegramError) {
          console.warn('⚠️ Telegram недоступен, но проект сохранен:', telegramError);
          // Не показываем ошибку пользователю, так как проект все равно сохранен
        }
      } else {
        try {
        await sendTelegramMessageClient(text);
        } catch (telegramError) {
          console.warn('⚠️ Telegram недоступен:', telegramError);
        }
      }
      // eslint-disable-next-line no-console
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Ошибка отправки спецификации в Telegram:', error);
      // Показываем предупреждение вместо ошибки
      alert('⚠️ Спецификация сохранена в базе данных. Уведомление в Telegram не отправлено из-за технических проблем. Обратитесь к менеджеру для проверки проекта.');
    }
  }

  return { sendSpecificationToTelegram };
} 