"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Lock, Eye, EyeOff, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { PresentationViewer } from "@/components/presentation-viewer"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/simple-label"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const [showRegister, setShowRegister] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [activePresentation, setActivePresentation] = React.useState<number | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = e.target as HTMLFormElement
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value
    const email = (form.elements.namedItem("email-register") as HTMLInputElement)?.value
    const password = (form.elements.namedItem("password-register") as HTMLInputElement)?.value
    const confirmPassword = (form.elements.namedItem("confirm-password") as HTMLInputElement)?.value
    if (password !== confirmPassword) {
      setError("Пароли не совпадают")
      setLoading(false)
      return
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
    } else {
      setShowRegister(false)
      alert("Проверьте почту для подтверждения регистрации!")
      
      // После регистрации пользователь должен будет создать профиль при первом входе
      // Здесь можно добавить логику для автоматического создания профиля, если нужно
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = e.target as HTMLFormElement
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showRegister ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleRegister}>
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-start gap-1">
                  <h1 className="text-2xl font-bold">Регистрация</h1>
                  <p className="text-balance text-sm text-muted-foreground">Создайте новый аккаунт Get2B</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={() => setShowRegister(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Имя</Label>
                  <div className="relative">
                    <Input id="name" type="text" placeholder="Иван Иванов" required className="pl-10" />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email-register">Email</Label>
                  <div className="relative">
                    <Input id="email-register" type="email" placeholder="m@example.com" required className="pl-10" />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password-register">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="password-register"
                      type={showPassword ? "text" : "password"}
                      required
                      className="pl-10 pr-10"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="pl-10 pr-10"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {error && <div className="text-red-500 text-sm">{error}</div>}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? "Загрузка..." : "Создать аккаунт"}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
              <div className="flex flex-col items-center gap-2 text-center animate-fade-in">
                <h1 className="text-2xl font-bold">Вход в личный кабинет</h1>
                <p className="text-balance text-sm text-muted-foreground">
                  Введите ваш email для входа в личный кабинет
                </p>
              </div>
              <div className="grid gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="grid gap-2"
                >
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input id="email" type="email" placeholder="m@example.com" required className="pl-10" />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="grid gap-2"
                >
                  <div className="flex items-center">
                    <Label htmlFor="password">Пароль</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline text-primary/80 hover:text-primary transition-colors duration-300"
                    >
                      Забыли пароль?
                    </a>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} required className="pl-10 pr-10" />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </motion.div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Button
                    type="submit"
                    className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? "Загрузка..." : "Войти"}
                  </Button>
                </motion.div>
              </div>
              <div className="mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivePresentation(1)}
                  className="w-full flex items-center justify-center gap-2 p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Info className="h-4 w-4 text-gray-500" />
                  <span>Узнать больше о Get2B</span>
                </motion.button>
              </div>
              <div className="text-center text-sm">
                Нет аккаунта?{" "}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="text-primary/80 hover:text-primary underline underline-offset-4 transition-colors duration-300"
                >
                  Зарегистрироваться
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activePresentation !== null && (
          <PresentationViewer presentationId={activePresentation} onClose={() => setActivePresentation(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
