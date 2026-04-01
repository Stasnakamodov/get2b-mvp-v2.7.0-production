import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  UserCog,
  Building2,
  Upload,
  Camera,
  Phone,
  Mail,
  Globe,
  Landmark,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Image,
  ShieldCheck,
  Users,
  FileSearch,
  Save,
  Plus
} from "lucide-react"

export default function ProfileSetupPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <UserCog className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Настройка профиля
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Настройте профили клиентов и поставщиков для начала работы с проектами
            </p>
          </div>
        </div>
      </div>

      {/* Зачем нужен профиль */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Зачем нужна настройка профиля
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Профиль компании — основа для создания проектов в Get2B. Без заполненного
            профиля невозможно оформить сделку, так как данные компании используются
            в агентском договоре и платёжных документах.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileSearch className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Юридическое соответствие</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Данные для документов и договоров</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Быстрое создание проектов</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Данные подставляются автоматически</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Верификация через Контур</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Проверка данных через EniCheck</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Два типа профилей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Типы профилей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Профиль клиента</h4>
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-100">
                  Основной
                </Badge>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Данные вашей компании: реквизиты, контакты, банковская информация.
                Используется при создании проектов в качестве заказчика.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-200">Профиль поставщика</h4>
                <Badge variant="outline">Опционально</Badge>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Данные вашего поставщика: компания, реквизиты, товары.
                Можно добавить через каталог или вручную на странице профиля.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Шаги настройки клиентского профиля */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Настройка профиля клиента
        </h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold text-sm">
                1
              </span>
              Перейдите на страницу профиля
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Откройте раздел «Профиль» в боковом меню дашборда. Здесь отображаются
              все ваши профили компаний.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold text-sm">
                2
              </span>
              Нажмите «Добавить клиента»
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              Нажмите кнопку «Добавить клиента» в верхней части страницы.
              Откроется модальное окно с выбором способа заполнения.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Plus className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">Ручной ввод</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Заполните все поля вручную</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Camera className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">OCR загрузка</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Загрузите карточку компании (Yandex Vision)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold text-sm">
                3
              </span>
              Заполните данные компании
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Укажите основные реквизиты вашей организации:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Название компании</span>
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5">Обяз.</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Юридическое название</span>
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5">Обяз.</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <FileSearch className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">ИНН</span>
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5">Обяз.</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <FileSearch className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">КПП</span>
                <Badge variant="outline" className="ml-auto text-[10px] px-1.5">Опц.</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <FileSearch className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">ОГРН</span>
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5">Обяз.</Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Юридический адрес</span>
                <Badge variant="outline" className="ml-auto text-[10px] px-1.5">Опц.</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold text-sm">
                4
              </span>
              Добавьте контактную информацию
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Email</span>
                  <p className="text-xs text-gray-500">Корпоративная почта</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Phone className="w-4 h-4 text-green-600 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Телефон</span>
                  <p className="text-xs text-gray-500">Контактный номер</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Сайт</span>
                  <p className="text-xs text-gray-500">URL компании</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold text-sm">
                5
              </span>
              Укажите банковские реквизиты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Банковские реквизиты необходимы для формирования агентского договора
              и документов на оплату.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Landmark className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Название банка</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Landmark className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Расчётный счёт</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Landmark className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Корреспондентский счёт</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Landmark className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">БИК</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold text-sm">
                6
              </span>
              Загрузите логотип компании
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              Логотип помогает быстро идентифицировать профиль при работе с несколькими компаниями.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Форматы</Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">JPEG, PNG, WebP, SVG</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Макс. размер</Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">5 MB</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Рекомендация</Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">200x200px</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-sm">
                7
              </span>
              Сохраните профиль
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Нажмите кнопку «Сохранить». Профиль будет доступен при создании новых проектов
              и автоматически подставляется на первом шаге конструктора проектов.
            </p>
            <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  После сохранения профиль сразу доступен для использования в проектах.
                  Вы можете создать несколько профилей для разных юридических лиц.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Настройка профиля поставщика */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            Настройка профиля поставщика
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Профили поставщиков можно добавить двумя способами:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Через каталог Get2B
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Выберите поставщика из каталога 10 000+ верифицированных товаров.
                Данные заполнятся автоматически.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-600" />
                Вручную (Синяя комната)
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Добавьте своего поставщика вручную через раздел «Каталог» &rarr;
                «Ваши поставщики» &rarr; «Добавить поставщика».
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Верификация через Контур */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Верификация через Контур.EniCheck
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get2B интегрирован с сервисом Контур.EniCheck для автоматической проверки
            данных компании. Верификация подтверждает, что указанные реквизиты соответствуют
            реальной организации.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Что нужно для проверки:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-100">
                ИНН
              </Badge>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 hover:bg-blue-100">
                ОГРН
              </Badge>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Заполните ИНН и ОГРН, затем нажмите кнопку «Проверить». Система
              автоматически проверит данные и отобразит статус верификации.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Верификация не является обязательной, но рекомендуется для повышения
                доверия и ускорения обработки сделок.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Полезные советы */}
      <Card>
        <CardHeader>
          <CardTitle>Полезные советы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте OCR</strong> — загрузите фото карточки компании, и система
                автоматически распознает реквизиты через Yandex Vision. Это значительно ускоряет заполнение.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Создавайте несколько профилей</strong> — если вы работаете с несколькими
                юридическими лицами, создайте отдельный профиль для каждого.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Обновляйте данные</strong> — при изменении реквизитов компании
                не забудьте обновить профиль. Это предотвратит ошибки в документах.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Пройдите верификацию</strong> — проверка через Контур.EniCheck
                ускоряет обработку ваших проектов и повышает уровень доверия.
              </p>
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
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              После настройки профиля вы можете приступить к созданию первого проекта:
            </p>
            <Button variant="outline" className="w-full justify-start">
              <ArrowRight className="w-4 h-4 mr-2" />
              Создание первого проекта
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
