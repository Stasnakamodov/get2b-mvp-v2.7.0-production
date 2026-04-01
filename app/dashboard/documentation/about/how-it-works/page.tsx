import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Building2,
  FileText,
  CreditCard,
  Wallet,
  UserCheck,
  Receipt,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Zap,
  Users,
  Globe,
  Handshake,
  ArrowDown,
  Info
} from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Как работает Get2B
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Подробная схема работы платформы от первого шага до завершения сделки
            </p>
          </div>
        </div>
      </div>

      {/* Схема бизнес-модели */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-blue-600" />
            Бизнес-модель
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get2B выступает платёжным агентом между вашей компанией и китайским поставщиком.
            Мы принимаем средства от вас по агентскому договору и осуществляем оплату поставщику
            от своего имени, обеспечивая полную легальность и прозрачность операции.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm min-w-[140px]">
              <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Ваша компания</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Заказчик</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
              <ArrowDown className="w-6 h-6 text-gray-400 md:hidden" />
              <span className="text-xs text-gray-500">Агентский договор</span>
            </div>

            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm border-2 border-green-300 dark:border-green-700 min-w-[140px]">
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Get2B</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Платёжный агент</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
              <ArrowDown className="w-6 h-6 text-gray-400 md:hidden" />
              <span className="text-xs text-gray-500">Оплата поставщику</span>
            </div>

            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm min-w-[140px]">
              <Globe className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Поставщик</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Китай / Турция</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Агентский договор */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Агентский договор
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Агентский договор — это юридический документ, по которому Get2B (агент) действует
            от своего имени, но за счёт вашей компании (принципала). Это полностью
            соответствует главе 52 Гражданского кодекса РФ.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Почему это безопасно
              </h4>
              <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                  Законная схема работы по ГК РФ
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                  Все документы для налоговой
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                  Прозрачная отчётность
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 shrink-0"></span>
                  Валютный контроль соблюдён
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Что включает договор
              </h4>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  Предмет — оплата поставщику
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  Размер агентского вознаграждения
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  Порядок отчётности агента
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                  Ответственность сторон
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7 шагов */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">7 шагов сделки</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">
                  1
                </span>
                Данные компании
                <Badge variant="outline" className="ml-auto">~5 мин</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Заполните данные вашей компании один раз: название, ИНН, КПП, ОГРН, банковские
                реквизиты. При повторных сделках данные подставляются автоматически. Можно использовать
                OCR для автоматического распознавания карточки компании.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">
                  2
                </span>
                Спецификация товара
                <Badge variant="outline" className="ml-auto">~10 мин</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Выберите товары из каталога Get2B или загрузите свою спецификацию. Укажите
                количество, характеристики и требования к товару. Поддерживается загрузка
                инвойсов с автоматическим распознаванием через OCR.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-sm">
                  3
                </span>
                Пополнение агента
                <Badge variant="outline" className="ml-auto">~1 день</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Переведите средства на счёт Get2B по агентскому договору. После получения
                средств начинается процесс оплаты поставщику.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Средства хранятся на специальном агентском счёте и используются
                    исключительно для оплаты вашему поставщику.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-sm">
                  4
                </span>
                Способ оплаты
                <Badge variant="outline" className="ml-auto">~2 мин</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Выберите, как Get2B оплатит поставщику. Каждый способ имеет свои сроки и особенности:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">Банковский перевод</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1-3 рабочих дня</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <Wallet className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">P2P перевод</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">~1 час</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <Zap className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">Криптовалюта</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">~30 минут</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold text-sm">
                  5
                </span>
                Реквизиты поставщика
                <Badge variant="outline" className="ml-auto">~5 мин</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Укажите платёжные реквизиты вашего поставщика: банковский счёт, название
                компании, SWIFT/BIC код. Если поставщик из каталога Get2B — реквизиты
                подставятся автоматически.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold text-sm">
                  6
                </span>
                Подтверждение менеджером
                <Badge variant="outline" className="ml-auto">1-3 дня</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Менеджер Get2B проверяет все данные и осуществляет платёж. Вы получаете
                подтверждение (receipt) об оплате поставщику с полной информацией о транзакции.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    На этом этапе вы получите уведомление в Telegram и email
                    с подтверждением платежа.
                  </p>
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
                Завершение
                <Badge className="ml-auto bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                  Готово
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Сделка завершена. Все документы сохранены в CRM. Вы можете отслеживать
                статус доставки, просматривать историю и скачивать закрывающие документы.
                Полная прозрачность на каждом этапе.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ключевые отличия */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Чем Get2B отличается
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Не просто маркетплейс</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Полный сервис от поиска поставщика до закрывающих документов
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Не просто CRM</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Реальные платёжные операции, а не только учёт и отчётность
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Мультивалютность</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Работа с RUB, CNY, USD, EUR и криптовалютами
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Персональный менеджер</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Выделенный специалист для каждого клиента с поддержкой 24/7
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Типичные сроки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Типичные сроки сделки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-xl font-bold text-green-600">1-2 дня</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Быстрая сделка (крипто/P2P)</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-xl font-bold text-blue-600">3-5 дней</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Стандартная сделка (банк)</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="text-xl font-bold text-orange-600">5-7 дней</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Первая сделка (верификация)</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                При повторных сделках процесс ускоряется, так как данные компании и
                поставщика уже сохранены в системе.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Следующие шаги */}
      <Card>
        <CardHeader>
          <CardTitle>Готовы начать?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              Начните работу с Get2B уже сегодня. Первая сделка — бесплатно.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="justify-start">
                <UserCheck className="w-4 h-4 mr-2" />
                Настроить профиль
              </Button>
              <Button variant="outline" className="justify-start">
                <Receipt className="w-4 h-4 mr-2" />
                Создать первый проект
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
