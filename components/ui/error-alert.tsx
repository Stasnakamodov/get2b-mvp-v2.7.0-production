import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError, ApiErrorType } from '@/lib/errors/ApiError';
import { cn } from '@/lib/utils';

export type ErrorAlertVariant = 'destructive' | 'warning' | 'info' | 'default';

interface ErrorAlertProps {
  error?: Error | ApiError | string | null;
  title?: string;
  description?: string;
  variant?: ErrorAlertVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  showErrorId?: boolean;
  className?: string;
}

// Мапинг типов ошибок на варианты UI
const getVariantFromErrorType = (type: ApiErrorType): ErrorAlertVariant => {
  switch (type) {
    case 'VALIDATION_ERROR':
    case 'AUTHENTICATION_ERROR':
    case 'AUTHORIZATION_ERROR':
      return 'warning';
    case 'NOT_FOUND':
    case 'CONFLICT':
      return 'info';
    case 'DATABASE_ERROR':
    case 'INTERNAL_SERVER_ERROR':
    case 'EXTERNAL_API_ERROR':
      return 'destructive';
    case 'RATE_LIMIT':
      return 'warning';
    default:
      return 'destructive';
  }
};

// Мапинг вариантов на иконки
const getIconForVariant = (variant: ErrorAlertVariant) => {
  switch (variant) {
    case 'destructive':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return AlertCircle;
  }
};

// Мапинг типов ошибок на user-friendly сообщения
const getErrorMessage = (error: Error | ApiError | string): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof ApiError) {
    switch (error.type) {
      case 'VALIDATION_ERROR':
        return error.message || 'Проверьте правильность заполнения полей';
      case 'AUTHENTICATION_ERROR':
        return 'Необходимо войти в систему для выполнения этого действия';
      case 'AUTHORIZATION_ERROR':
        return 'У вас нет прав для выполнения этого действия';
      case 'NOT_FOUND':
        return 'Запрашиваемый ресурс не найден';
      case 'CONFLICT':
        return error.message || 'Конфликт данных. Попробуйте обновить страницу';
      case 'RATE_LIMIT':
        return 'Слишком много запросов. Подождите немного и попробуйте снова';
      case 'NETWORK_ERROR':
        return 'Проблемы с подключением. Проверьте интернет соединение';
      case 'EXTERNAL_API_ERROR':
        return 'Временные проблемы со внешним сервисом. Попробуйте позже';
      case 'DATABASE_ERROR':
      case 'INTERNAL_SERVER_ERROR':
        return 'Техническая ошибка. Мы уже работаем над её исправлением';
      default:
        return error.message || 'Произошла неизвестная ошибка';
    }
  }

  return error.message || 'Произошла ошибка';
};

// Определяем, можно ли повторить операцию для данного типа ошибки
const canRetry = (error: Error | ApiError | string): boolean => {
  if (typeof error === 'string') return false;
  if (!(error instanceof ApiError)) return false;

  const retryableTypes: ApiErrorType[] = [
    'NETWORK_ERROR',
    'EXTERNAL_API_ERROR',
    'RATE_LIMIT',
    'INTERNAL_SERVER_ERROR'
  ];

  return retryableTypes.includes(error.type);
};

export function ErrorAlert({
  error,
  title,
  description,
  variant: propVariant,
  dismissible = false,
  onDismiss,
  onRetry,
  showErrorId = false,
  className
}: ErrorAlertProps) {
  // Если нет ошибки, ничего не рендерим
  if (!error) return null;

  // Определяем вариант UI
  const errorVariant = error instanceof ApiError 
    ? getVariantFromErrorType(error.type)
    : 'destructive';
  const variant = propVariant || errorVariant;

  // Получаем иконку
  const Icon = getIconForVariant(variant);

  // Получаем сообщение
  const errorMessage = description || getErrorMessage(error);

  // Получаем заголовок
  const errorTitle = title || getDefaultTitle(variant);

  // Показываем ли кнопку повтора
  const showRetry = onRetry && canRetry(error);

  // ID ошибки для отладки
  const errorId = error instanceof ApiError ? error.details.timestamp : null;

  // Мапим наши варианты на поддерживаемые Alert компонентом
  const alertVariant = variant === 'destructive' ? 'destructive' : 'default';

  return (
    <Alert variant={alertVariant} className={cn('relative', className)}>
      <Icon className="h-4 w-4" />
      
      <div className="flex-1">
        <AlertTitle className="flex items-center justify-between">
          <span>{errorTitle}</span>
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Закрыть</span>
            </Button>
          )}
        </AlertTitle>
        
        <AlertDescription className="mt-2">
          {errorMessage}
          
          {showRetry && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                Попробовать снова
              </Button>
            </div>
          )}
          
          {showErrorId && errorId && (
            <div className="mt-2 text-xs opacity-70">
              ID ошибки: {errorId}
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}

// Получаем заголовок по умолчанию для варианта
function getDefaultTitle(variant: ErrorAlertVariant): string {
  switch (variant) {
    case 'destructive':
      return 'Ошибка';
    case 'warning':
      return 'Внимание';
    case 'info':
      return 'Информация';
    default:
      return 'Уведомление';
  }
}

// Хук для управления состоянием ошибки
export function useErrorAlert() {
  const [error, setError] = React.useState<Error | ApiError | string | null>(null);

  const showError = React.useCallback((err: Error | ApiError | string) => {
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    showError,
    clearError,
    ErrorAlert: (props: Omit<ErrorAlertProps, 'error' | 'onDismiss'>) => (
      <ErrorAlert 
        {...props} 
        error={error} 
        onDismiss={clearError}
        dismissible={props.dismissible ?? true}
      />
    )
  };
}

// Компонент для отображения множественных ошибок
interface ErrorListProps {
  errors: (Error | ApiError | string)[];
  title?: string;
  onClearAll?: () => void;
  className?: string;
}

export function ErrorList({ errors, title = 'Ошибки', onClearAll, className }: ErrorListProps) {
  if (errors.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        {onClearAll && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Очистить все
          </Button>
        )}
      </div>
      
      {errors.map((error, index) => (
        <ErrorAlert
          key={index}
          error={error}
          dismissible={false}
          className="text-sm"
        />
      ))}
    </div>
  );
} 