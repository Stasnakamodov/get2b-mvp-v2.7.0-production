import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  UserPlus, 
  Mail, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Shield
} from "lucide-react"

export default function RegistrationPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Регистрация и создание аккаунта
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Пошаговое руководство по созданию аккаунта в Get2B и настройке базовых параметров
        </p>
      </div>

      {/* Основные шаги */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                1
              </span>
              Переход на страницу регистрации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Откройте главную страницу Get2B и нажмите кнопку "Регистрация" в правом верхнем углу.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <code className="text-sm">
                https://get2b.ru/register
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                2
              </span>
              Заполнение формы регистрации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Заполните обязательные поля в форме регистрации:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Email адрес</span>
                  <Badge variant="destructive">Обязательно</Badge>
                </div>
                <p className="text-sm text-gray-500">Используется для входа и уведомлений</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Пароль</span>
                  <Badge variant="destructive">Обязательно</Badge>
                </div>
                <p className="text-sm text-gray-500">Минимум 8 символов, включая буквы и цифры</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                3
              </span>
              Подтверждение email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              После регистрации проверьте почту и подтвердите email адрес, перейдя по ссылке в письме.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Важно!
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Проверьте папку "Спам" если письмо не пришло в течение 5 минут
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                4
              </span>
              Первый вход в систему
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              После подтверждения email войдите в систему, используя указанные при регистрации данные.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Готово!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Теперь вы можете приступить к настройке профиля и созданию первого проекта
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Требования к паролю */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" />
            Требования к паролю
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Обязательные требования:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Минимум 8 символов
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Хотя бы одна буква
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Хотя бы одна цифра
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Рекомендации:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Используйте специальные символы
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Не используйте личную информацию
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Используйте менеджер паролей
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Следующие шаги */}
      <Card>
        <CardHeader>
          <CardTitle>Следующие шаги</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              После успешной регистрации рекомендуем выполнить следующие действия:
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Настройка профиля компании
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Загрузка документов для верификации
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Создание первого проекта
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 