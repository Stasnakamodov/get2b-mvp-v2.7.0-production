/**
 * ApiClient - централизованный клиент для всех API вызовов
 * Решает проблемы:
 * - Дублирование кода API вызовов
 * - Отсутствие централизованной обработки ошибок
 * - Разрозненная авторизация
 * - Отсутствие типизации
 */

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface RequestOptions extends RequestInit {
  token?: string
  params?: Record<string, any>
}

class ApiClient {
  private baseUrl: string
  private defaultToken: string | null = null

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * Устанавливает токен по умолчанию для всех запросов
   */
  setAuthToken(token: string) {
    this.defaultToken = token
  }

  /**
   * Очищает токен авторизации
   */
  clearAuthToken() {
    this.defaultToken = null
  }

  /**
   * Базовый метод для выполнения запросов
   */
  private async request<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { token, params, ...fetchOptions } = options

    // Добавляем query параметры если есть
    let finalUrl = `${this.baseUrl}${url}`
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      finalUrl += `?${searchParams.toString()}`
    }

    // Подготавливаем headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {})
    }

    // Добавляем токен авторизации
    const authToken = token || this.defaultToken
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    try {
      const response = await fetch(finalUrl, {
        ...fetchOptions,
        headers
      })

      // Проверяем статус ответа
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      // Парсим JSON ответ
      const data = await response.json()

      // Проверяем формат ответа
      if (data.error) {
        return {
          success: false,
          error: data.error
        }
      }

      return {
        success: true,
        data: data
      }
    } catch (error) {
      // Обработка сетевых ошибок
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', error)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * GET запрос
   */
  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET'
    })
  }

  /**
   * POST запрос
   */
  async post<T>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  /**
   * PUT запрос
   */
  async put<T>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  /**
   * DELETE запрос
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE'
    })
  }

  /**
   * PATCH запрос
   */
  async patch<T>(url: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined
    })
  }
}

// Создаем singleton экземпляр
const apiClient = new ApiClient()

export default apiClient
export { ApiClient, type ApiResponse, type RequestOptions }