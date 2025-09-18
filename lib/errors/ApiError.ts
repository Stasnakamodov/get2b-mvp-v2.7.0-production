export type ApiErrorType = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR' 
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR';

export interface ApiErrorDetails {
  field?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
}

export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly statusCode: number;
  public readonly details: ApiErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ApiErrorType,
    statusCode: number = 500,
    details: Partial<ApiErrorDetails> = {},
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = {
      timestamp: new Date().toISOString(),
      ...details
    };

    // Сохраняем стек вызовов
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // Метод для конвертации в JSON для отправки клиенту
  toJSON() {
    return {
      error: {
        message: this.message,
        type: this.type,
        statusCode: this.statusCode,
        details: this.details
      }
    };
  }

  // Статические методы для часто используемых ошибок
  static badRequest(message: string, field?: string): ApiError {
    return new ApiError(message, 'VALIDATION_ERROR', 400, { field });
  }

  static unauthorized(message: string = 'Необходима авторизация'): ApiError {
    return new ApiError(message, 'AUTHENTICATION_ERROR', 401);
  }

  static forbidden(message: string = 'Доступ запрещен'): ApiError {
    return new ApiError(message, 'AUTHORIZATION_ERROR', 403);
  }

  static notFound(message: string = 'Ресурс не найден'): ApiError {
    return new ApiError(message, 'NOT_FOUND', 404);
  }

  static conflict(message: string): ApiError {
    return new ApiError(message, 'CONFLICT', 409);
  }

  static rateLimit(message: string = 'Превышен лимит запросов'): ApiError {
    return new ApiError(message, 'RATE_LIMIT', 429);
  }

  static internal(message: string = 'Внутренняя ошибка сервера'): ApiError {
    return new ApiError(message, 'INTERNAL_SERVER_ERROR', 500, {}, false);
  }

  static database(message: string, details?: Partial<ApiErrorDetails>): ApiError {
    return new ApiError(message, 'DATABASE_ERROR', 500, details, false);
  }

  static external(message: string, service?: string): ApiError {
    return new ApiError(message, 'EXTERNAL_API_ERROR', 502, { code: service });
  }
}

// Утилитарные функции для проверки типов ошибок
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

export const isOperationalError = (error: unknown): boolean => {
  return isApiError(error) && error.isOperational;
};

// Функция для логирования ошибок
export const logError = (error: Error, context?: Record<string, any>) => {
  const baseErrorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };

  const errorInfo = isApiError(error) 
    ? {
        ...baseErrorInfo,
        type: error.type,
        statusCode: error.statusCode,
        details: error.details,
        isOperational: error.isOperational
      }
    : baseErrorInfo;

  // В production отправляем в сервис логирования
  if (process.env.NODE_ENV === 'production') {
    // TODO: Интеграция с логгером (Winston, Pino, или облачный сервис)
    console.error('[API_ERROR]', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('[API_ERROR]', errorInfo);
  }
}; 