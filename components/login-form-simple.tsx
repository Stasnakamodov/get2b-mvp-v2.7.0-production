"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/simple-label"
import { ProfileSetupModal } from "@/components/profile-setup-modal"

export function LoginFormSimple({ className, ...props }: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showProfileSetup, setShowProfileSetup] = React.useState(false)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value
    
    console.log('[DEBUG] Attempting login...')
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    
    setLoading(false)
    if (signInError) {
      console.error('[DEBUG] Login error:', signInError)
      setError(signInError.message)
    } else {
      console.log('[DEBUG] Login successful!')
      
      // Проверяем наличие профиля у пользователя
      if (data.user) {
        setCurrentUserId(data.user.id)
        
        const { data: userProfiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .eq('is_primary', true)
        
        if (profileError) {
          console.error('[DEBUG] Profile check error:', profileError)
        }
        
        // Если у пользователя нет профилей, показываем модальное окно
        if (!userProfiles || userProfiles.length === 0) {
          setShowProfileSetup(true)
        } else {
          // Если профиль есть, переходим в дашборд
      router.push("/dashboard")
        }
      }
    }
  }

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false)
    router.push("/dashboard")
  }

  const handleProfileSetupClose = () => {
    setShowProfileSetup(false)
    // Перенаправляем в дашборд, даже если профиль не создан
    router.push("/dashboard")
  }

  return (
    <>
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Вход в личный кабинет</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Введите ваш email для входа в личный кабинет
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" type="password" required />
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          {loading ? "Загрузка..." : "Войти"}
        </Button>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        Нет аккаунта? Обратитесь к администратору
      </div>
    </form>

      {/* Модальное окно для создания профиля */}
      {currentUserId && (
        <ProfileSetupModal
          isOpen={showProfileSetup}
          onComplete={handleProfileSetupComplete}
          onClose={handleProfileSetupClose}
          userId={currentUserId}
        />
      )}
    </>
  )
} 