'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DebugSupabase() {
  const [status, setStatus] = useState<{
    url: string
    key: string
    connection: 'loading' | 'success' | 'error'
    error?: string
    authStatus?: string
  }>({
    url: '',
    key: '',
    connection: 'loading'
  })

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Проверяем переменные окружения
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'НЕ НАЙДЕН'
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
          ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
          : 'НЕ НАЙДЕН'

        setStatus(prev => ({ ...prev, url, key }))

        // Проверяем подключение к Supabase
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus(prev => ({
            ...prev,
            connection: 'error',
            error: error.message,
            authStatus: 'Ошибка получения сессии'
          }))
        } else {
          setStatus(prev => ({
            ...prev,
            connection: 'success',
            authStatus: data.session ? 'Пользователь авторизован' : 'Пользователь не авторизован'
          }))
        }
      } catch (err) {
        setStatus(prev => ({
          ...prev,
          connection: 'error',
          error: err instanceof Error ? err.message : 'Неизвестная ошибка'
        }))
      }
    }

    checkSupabase()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-black p-4 max-w-md z-50 text-xs">
      <h3 className="font-bold mb-2 text-red-600">🔍 SUPABASE DEBUG</h3>
      
      <div className="space-y-2">
        <div>
          <strong>URL:</strong> 
          <div className="break-all text-gray-600">{status.url}</div>
        </div>
        
        <div>
          <strong>API Key:</strong> 
          <div className="break-all text-gray-600">{status.key}</div>
        </div>
        
        <div>
          <strong>Подключение:</strong> 
          <span className={`ml-2 px-2 py-1 text-xs ${
            status.connection === 'loading' ? 'bg-yellow-100 text-yellow-800' :
            status.connection === 'success' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {status.connection === 'loading' ? 'Проверка...' :
             status.connection === 'success' ? '✅ Работает' :
             '❌ Ошибка'}
          </span>
        </div>
        
        {status.authStatus && (
          <div>
            <strong>Auth:</strong> 
            <div className="text-gray-600">{status.authStatus}</div>
          </div>
        )}
        
        {status.error && (
          <div>
            <strong>Ошибка:</strong> 
            <div className="text-red-600 break-all">{status.error}</div>
          </div>
        )}
      </div>
    </div>
  )
} 