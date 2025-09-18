import { NextRequest, NextResponse } from 'next/server';
import { ApiError, logError, isApiError } from './ApiError';

// Тип для API handler функций
export type ApiHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

// Middleware для обработки ошибок в API routes
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return await handleApiError(error, request);
    }
  };
}

// Централизованная обработка ошибок API
export async function handleApiError(error: unknown, request?: NextRequest): Promise<NextResponse> {
  let apiError: ApiError;

  // Конвертируем любую ошибку в ApiError
  if (isApiError(error)) {
    apiError = error;
  } else if (error instanceof Error) {
    // Обрабатываем специфичные типы ошибок
    if (error.name === 'ValidationError') {
      apiError = ApiError.badRequest(error.message);
    } else if (error.name === 'CastError' || error.message.includes('invalid input syntax')) {
      apiError = ApiError.badRequest('Неверный формат данных');
    } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      apiError = ApiError.conflict('Такая запись уже существует');
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      apiError = ApiError.notFound();
    } else if (error.message.includes('timeout') || error.message.includes('connection')) {
      apiError = ApiError.external('Проблемы с подключением к внешнему сервису');
    } else {
      apiError = ApiError.internal(`Внутренняя ошибка: ${error.message}`);
    }
  } else {
    // Неизвестный тип ошибки
    apiError = ApiError.internal('Произошла неизвестная ошибка');
  }

  // Добавляем контекст запроса в детали ошибки
  if (request) {
    apiError.details.requestId = generateRequestId();
    apiError.details.userId = await getUserIdFromRequest(request);
  }

  // Логируем ошибку
  logError(apiError, {
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent'),
    ip: getClientIP(request)
  });

  // Возвращаем ответ с ошибкой
  return NextResponse.json(
    apiError.toJSON(),
    { 
      status: apiError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-ID': apiError.details.timestamp
      }
    }
  );
}

// Вспомогательная функция для генерации ID запроса
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Извлечение user ID из запроса (из токена или сессии)
async function getUserIdFromRequest(request: NextRequest): Promise<string | undefined> {
  try {
    // Проверяем Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // TODO: Декодировать JWT токен и извлечь user_id
      // const token = authHeader.substring(7);
      // const decoded = jwt.decode(token);
      // return decoded?.sub;
    }

    // Проверяем cookies (если используется сессия)
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie) {
      // TODO: Извлечь user_id из сессии
      // const session = await getSession(sessionCookie.value);
      // return session?.userId;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

// Получение IP адреса клиента
function getClientIP(request?: NextRequest): string | undefined {
  if (!request) return undefined;

  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    undefined
  );
}

// Валидатор для проверки обязательных полей
export function validateRequired<T>(
  data: Partial<T>,
  requiredFields: (keyof T)[],
  fieldNames?: Record<keyof T, string>
): void {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!data[field]) {
      const fieldName = fieldNames?.[field] || String(field);
      missingFields.push(fieldName);
    }
  }

  if (missingFields.length > 0) {
    throw ApiError.badRequest(
      `Обязательные поля не заполнены: ${missingFields.join(', ')}`
    );
  }
}

// Валидатор для проверки формата email
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw ApiError.badRequest('Неверный формат email адреса', 'email');
  }
}

// Валидатор для проверки UUID
export function validateUUID(id: string, fieldName: string = 'id'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw ApiError.badRequest(`Неверный формат ${fieldName}`, fieldName);
  }
}

// Функция для безопасного парсинга JSON
export function safeParseJSON<T>(
  jsonString: string,
  fallback: T
): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

// Декоратор для методов API handler'ов
export function handleErrors<T extends any[], R>(
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
) {
  const method = descriptor.value!;
  
  descriptor.value = async function (...args: T): Promise<R> {
    try {
      return await method.apply(this, args);
    } catch (error) {
      throw isApiError(error) ? error : ApiError.internal(String(error));
    }
  };
} 