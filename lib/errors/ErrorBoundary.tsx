'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiError, logError } from './ApiError';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  maxRetries?: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Обновляем состояние, чтобы показать fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
      retryCount: this.state.retryCount,
      errorId: this.state.errorId
    });

    // Вызываем колбэк если есть
    this.props.onError?.(error, errorInfo);

    // В production отправляем ошибку в сервис мониторинга
    if (process.env.NODE_ENV === 'production') {
      // TODO: Интеграция с Sentry, LogRocket, или другим сервисом мониторинга
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { children, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    // Сброс ошибки при изменении props
    if (hasError && resetOnPropsChange && prevProps.children !== children) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    });
  };

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReload = () => {
    // Убираем перезагрузку - пусть пользователь решает
console.log('Error boundary caught error - user can refresh manually');
  };

  render() {
    if (this.state.hasError) {
      // Если передан кастомный fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Дефолтный UI ошибки
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
            </div>
            
            <h2 className="text-2xl font-bold mb-4">
              Что-то пошло не так
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {this.getErrorMessage()}
            </p>
            
            <div className="space-y-3">
              {this.canRetry() && (
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Попробовать снова
                </Button>
              )}
              
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Перезагрузить страницу
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground flex items-center">
                  <Bug className="mr-2 h-4 w-4" />
                  Подробности ошибки (dev mode)
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            
            {this.state.errorId && (
              <p className="mt-4 text-xs text-muted-foreground">
                ID ошибки: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorMessage(): string {
    const { error } = this.state;
    
    if (!error) {
      return 'Произошла неизвестная ошибка';
    }

    // Если это наша ApiError, показываем понятное сообщение
    if (error instanceof ApiError) {
      switch (error.type) {
        case 'NETWORK_ERROR':
          return 'Проблемы с подключением к интернету. Проверьте соединение и попробуйте снова.';
        case 'AUTHENTICATION_ERROR':
          return 'Сессия истекла. Пожалуйста, войдите в систему заново.';
        case 'AUTHORIZATION_ERROR':
          return 'У вас нет прав доступа к этому разделу.';
        case 'EXTERNAL_API_ERROR':
          return 'Временные проблемы со внешним сервисом. Попробуйте позже.';
        case 'RATE_LIMIT':
          return 'Слишком много запросов. Подождите немного и попробуйте снова.';
        default:
          return error.message || 'Произошла ошибка при обработке запроса';
      }
    }

    // Для обычных ошибок показываем общее сообщение
    return 'Произошла техническая ошибка. Мы уже работаем над её исправлением.';
  }

  private canRetry(): boolean {
    const maxRetries = this.props.maxRetries || 3;
    return this.state.retryCount < maxRetries;
  }
}

// HOC для оборачивания компонентов в ErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Хук для программного выброса ошибок (например, для тестирования)
export function useErrorHandler() {
  const throwError = React.useCallback((error: Error | string) => {
    if (typeof error === 'string') {
      throw new Error(error);
    }
    throw error;
  }, []);

  return { throwError };
} 