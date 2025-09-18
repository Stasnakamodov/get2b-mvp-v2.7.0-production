"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ProfileSetupModal } from './profile-setup-modal'

interface ProfileGuardProps {
  children: React.ReactNode
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    // Добавляем таймаут для предотвращения зависания
    const timeoutId = setTimeout(() => {
      console.log('[ProfileGuard] Timeout reached, allowing access')
      setLoading(false)
      setHasProfile(true)
    }, 5000) // 5 секунд таймаут

    checkUserProfile()

    return () => clearTimeout(timeoutId)
  }, [])

  const checkUserProfile = async () => {
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      setLoading(true)
      console.log('[ProfileGuard] Starting profile check...')
      
      // Устанавливаем таймаут
      timeoutId = setTimeout(() => {
        console.log('[ProfileGuard] Timeout reached, allowing access')
        setLoading(false)
        setHasProfile(true)
      }, 5000)

      // Проверяем аутентификацию
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('[ProfileGuard] No user found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('[ProfileGuard] User found:', user.id)
      setCurrentUserId(user.id)

      // Проверяем наличие профиля
      console.log('[ProfileGuard] Checking user_profiles table...')
      
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)

      if (profileError) {
        console.error('[ProfileGuard] Error checking user profile:', profileError)
        
        // Если таблица не существует, пропускаем проверку профиля
        if (profileError.message.includes('does not exist')) {
          console.log('[ProfileGuard] user_profiles table does not exist, allowing access')
          setHasProfile(true)
          setLoading(false)
          return
        }
        
        setLoading(false)
        return
      }

      console.log('[ProfileGuard] User profiles found:', userProfiles)

      if (!userProfiles || userProfiles.length === 0) {
        // У пользователя нет профиля - показываем модальное окно
        console.log('[ProfileGuard] No profiles found, showing setup modal')
        setShowProfileSetup(true)
        setHasProfile(false)
      } else {
        // У пользователя есть профиль
        console.log('[ProfileGuard] Profile found, allowing access')
        setHasProfile(true)
      }
    } catch (error) {
      console.error('[ProfileGuard] Error in ProfileGuard:', error)
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      setLoading(false)
    }
  }

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false)
    setHasProfile(true)
  }

  const handleProfileSetupClose = () => {
    setShowProfileSetup(false)
    // Перенаправляем в дашборд, даже если профиль не создан
    router.push('/dashboard')
  }

  // Показываем загрузку
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка профиля...</p>
        </div>
      </div>
    )
  }

  // Если нет профиля, показываем модальное окно
  if (!hasProfile && currentUserId) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Перенаправление на создание профиля...</p>
          </div>
        </div>
        
        <ProfileSetupModal
          isOpen={showProfileSetup}
          onComplete={handleProfileSetupComplete}
          onClose={handleProfileSetupClose}
          userId={currentUserId}
        />
      </>
    )
  }

  // Если есть профиль, показываем содержимое
  return <>{children}</>
} 