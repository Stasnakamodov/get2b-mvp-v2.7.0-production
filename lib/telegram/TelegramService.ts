/**
 * 🤖 БАЗОВЫЙ TELEGRAM SERVICE
 * Унифицированный сервис для отправки сообщений в Telegram
 * Используется всеми ботами Get2B для технических операций
 */

export interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: any;
  disable_web_page_preview?: boolean;
}

export interface TelegramDocument {
  chat_id: string | number;
  document: string;
  caption?: string;
  reply_markup?: any;
}

export interface TelegramPhoto {
  chat_id: string | number;
  photo: string;
  caption?: string;
  parse_mode?: 'HTML' | 'Markdown';
}

export interface TelegramCallbackQuery {
  callback_query_id: string;
  text?: string;
  show_alert?: boolean;
}

export class TelegramService {
  private botToken: string;
  private baseUrl: string;

  constructor(botToken: string) {
    if (!botToken) {
      throw new Error("❌ Bot token is required for TelegramService");
    }
    this.botToken = botToken;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Отправляет текстовое сообщение
   */
  async sendMessage(params: TelegramMessage): Promise<any> {
    const url = `${this.baseUrl}/sendMessage`;
    
    console.log("📤 TelegramService: отправка сообщения", {
      chat_id: params.chat_id,
      text_length: params.text.length
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Telegram API ошибка:", result);
        throw new Error(`Telegram API error: ${result.description || response.statusText}`);
      }

      console.log("✅ Сообщение отправлено успешно");
      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки сообщения:", error);
      throw error;
    }
  }

  /**
   * Отправляет документ/файл
   */
  async sendDocument(params: TelegramDocument): Promise<any> {
    const url = `${this.baseUrl}/sendDocument`;
    
    console.log("📄 TelegramService: отправка документа", {
      chat_id: params.chat_id,
      document_url: params.document
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Telegram API ошибка:", result);
        throw new Error(`Telegram API error: ${result.description || response.statusText}`);
      }

      console.log("✅ Документ отправлен успешно");
      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки документа:", error);
      throw error;
    }
  }

  /**
   * Отправляет изображение
   */
  async sendPhoto(params: TelegramPhoto): Promise<any> {
    const url = `${this.baseUrl}/sendPhoto`;
    
    console.log("📷 TelegramService: отправка изображения", {
      chat_id: params.chat_id,
      photo_url: params.photo
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Telegram API ошибка:", result);
        throw new Error(`Telegram API error: ${result.description || response.statusText}`);
      }

      console.log("✅ Изображение отправлено успешно");
      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки изображения:", error);
      throw error;
    }
  }

  /**
   * Отвечает на callback query (нажатие inline кнопки)
   */
  async answerCallbackQuery(params: TelegramCallbackQuery): Promise<any> {
    const url = `${this.baseUrl}/answerCallbackQuery`;
    
    console.log("🔄 TelegramService: ответ на callback query", {
      callback_query_id: params.callback_query_id,
      text: params.text
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Telegram API ошибка:", result);
        throw new Error(`Telegram API error: ${result.description || response.statusText}`);
      }

      console.log("✅ Callback query обработан");
      return result;
    } catch (error) {
      console.error("❌ Ошибка ответа на callback query:", error);
      throw error;
    }
  }

  /**
   * Получает информацию о файле
   */
  async getFile(fileId: string): Promise<any> {
    const url = `${this.baseUrl}/getFile`;
    
    console.log("📁 TelegramService: получение информации о файле", { fileId });

    try {
      const response = await fetch(`${url}?file_id=${fileId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Ошибка получения файла:", error);
      throw error;
    }
  }

  /**
   * Получает полный URL для скачивания файла
   */
  getFileDownloadUrl(filePath: string): string {
    return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
  }
} 