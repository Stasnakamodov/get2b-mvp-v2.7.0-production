/**
 * Единый хелпер для работы с полем projects.receipts.
 * Поле хранится как text в PostgreSQL, но всегда нормализуется в JSON.
 */

export interface ReceiptsData {
  client_receipt: string | null;
  manager_receipt: string | null;
  manager_uploaded_at: string | null;
  manager_file_name: string | null;
}

const EMPTY: ReceiptsData = {
  client_receipt: null,
  manager_receipt: null,
  manager_uploaded_at: null,
  manager_file_name: null,
};

/**
 * Безопасно парсит receipts из БД.
 * Обрабатывает: null, plain URL строку, JSON, двойно-закодированный JSON.
 */
export function parseReceipts(raw: string | null | undefined): ReceiptsData {
  if (!raw || raw.trim() === '') return { ...EMPTY };

  // Пробуем JSON
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      let clientReceipt = parsed.client_receipt ?? null;

      // Защита от двойного кодирования:
      // client_receipt может содержать JSON-строку вместо URL
      if (typeof clientReceipt === 'string' && clientReceipt.startsWith('{')) {
        try {
          const inner = JSON.parse(clientReceipt);
          if (typeof inner === 'object' && inner !== null) {
            clientReceipt = inner.client_receipt ?? clientReceipt;
          }
        } catch {
          // не JSON — оставляем как есть
        }
      }

      return {
        client_receipt: clientReceipt,
        manager_receipt: parsed.manager_receipt ?? null,
        manager_uploaded_at: parsed.manager_uploaded_at ?? null,
        manager_file_name: parsed.manager_file_name ?? null,
      };
    }
  } catch {
    // не JSON — plain URL строка
  }

  // Если не JSON — считаем plain URL = client_receipt
  return {
    ...EMPTY,
    client_receipt: raw,
  };
}

/**
 * Сериализует данные чеков в JSON-строку для записи в БД.
 */
export function serializeReceipts(data: Partial<ReceiptsData>): string {
  return JSON.stringify({
    client_receipt: data.client_receipt ?? null,
    manager_receipt: data.manager_receipt ?? null,
    manager_uploaded_at: data.manager_uploaded_at ?? null,
    manager_file_name: data.manager_file_name ?? null,
  });
}

/** Извлекает URL клиентского чека */
export function getClientReceiptUrl(raw: string | null | undefined): string | null {
  return parseReceipts(raw).client_receipt;
}

/** Извлекает URL менеджерского чека */
export function getManagerReceiptUrl(raw: string | null | undefined): string | null {
  return parseReceipts(raw).manager_receipt;
}
