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
  reply_markup?: any;
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
   * Normalize URL — Telegram Bot API requires absolute https URLs.
   * If a relative URL slips through, prepend NEXT_PUBLIC_BASE_URL or
   * fall back to the public production origin.
   */
  private normalizeUrl(u: string): string {
    if (!u || u.startsWith('http://') || u.startsWith('https://')) return u;
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://get2b.pro';
    const normalized = `${base}${u.startsWith('/') ? '' : '/'}${u}`;
    console.warn(`⚠️ TelegramService: relative URL detected, normalizing → ${normalized}`);
    return normalized;
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
   * Скачивает файл по URL и возвращает Buffer + имя файла.
   * Для локальных URL (наш сервер) — читает файл с диска напрямую.
   */
  private async fetchFileBuffer(fileUrl: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads';
    const localPrefix = '/api/storage/';
    const normalizedUrl = this.normalizeUrl(fileUrl);

    // Проверяем, является ли URL локальным storage путём
    let storagePath = '';
    if (fileUrl.startsWith(localPrefix)) {
      storagePath = fileUrl.substring(localPrefix.length);
    } else if (normalizedUrl.includes(localPrefix)) {
      storagePath = normalizedUrl.split(localPrefix)[1];
    }

    if (storagePath) {
      // Локальный файл — читаем с диска (надёжнее чем HTTP)
      const path = require('path');
      const fs = require('fs/promises');
      const fullPath = path.join(UPLOAD_DIR, storagePath);
      console.log("📂 TelegramService: читаем локальный файл:", fullPath);
      const buffer = await fs.readFile(fullPath);
      const fileName = path.basename(storagePath);
      const ext = path.extname(fileName).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf',
      };
      return { buffer, fileName, mimeType: mimeMap[ext] || 'application/octet-stream' };
    }

    // Внешний URL — скачиваем по HTTP
    console.log("🌐 TelegramService: скачиваем внешний файл:", normalizedUrl);
    const response = await fetch(normalizedUrl);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = normalizedUrl.split('/').pop()?.split('?')[0] || 'file';
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';
    return { buffer, fileName, mimeType };
  }

  /**
   * Отправляет документ/файл через multipart upload (надёжно, не зависит от доступности URL для Telegram)
   */
  async sendDocument(params: TelegramDocument): Promise<any> {
    const url = `${this.baseUrl}/sendDocument`;

    console.log("📄 TelegramService: отправка документа (multipart)", {
      chat_id: params.chat_id,
      document_url: params.document
    });

    try {
      const { buffer, fileName, mimeType } = await this.fetchFileBuffer(params.document);
      const uint8 = new Uint8Array(buffer);
      const blob = new Blob([uint8], { type: mimeType });

      const formData = new FormData();
      formData.append('chat_id', String(params.chat_id));
      formData.append('document', blob, fileName);
      if (params.caption) formData.append('caption', params.caption);
      if (params.reply_markup) formData.append('reply_markup', JSON.stringify(params.reply_markup));

      const response = await fetch(url, { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Telegram API ошибка:", result);
        throw new Error(`Telegram API error: ${result.description || response.statusText}`);
      }

      console.log("✅ Документ отправлен успешно (multipart)");
      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки документа:", error);
      throw error;
    }
  }

  /**
   * Отправляет изображение через multipart upload
   */
  async sendPhoto(params: TelegramPhoto): Promise<any> {
    const url = `${this.baseUrl}/sendPhoto`;

    console.log("📷 TelegramService: отправка изображения (multipart)", {
      chat_id: params.chat_id,
      photo_url: params.photo
    });

    try {
      const { buffer, fileName, mimeType } = await this.fetchFileBuffer(params.photo);
      const uint8 = new Uint8Array(buffer);
      const blob = new Blob([uint8], { type: mimeType });

      const formData = new FormData();
      formData.append('chat_id', String(params.chat_id));
      formData.append('photo', blob, fileName);
      if (params.caption) formData.append('caption', params.caption);
      if (params.parse_mode) formData.append('parse_mode', params.parse_mode);
      if (params.reply_markup) formData.append('reply_markup', JSON.stringify(params.reply_markup));

      const response = await fetch(url, { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Telegram API ошибка:", result);
        throw new Error(`Telegram API error: ${result.description || response.statusText}`);
      }

      console.log("✅ Изображение отправлено успешно (multipart)");
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