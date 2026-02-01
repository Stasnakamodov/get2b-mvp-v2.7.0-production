'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * React Query Provider для infinite scroll и кэширования данных
 *
 * Используется для:
 * - useInfiniteProducts - загрузка товаров с пагинацией
 * - Кэширование API запросов
 * - Автоматическое обновление данных
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Данные считаются свежими 30 секунд
            staleTime: 30 * 1000,
            // Повторные попытки при ошибке
            retry: 2,
            // Фоновое обновление при фокусе окна
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export default QueryProvider
