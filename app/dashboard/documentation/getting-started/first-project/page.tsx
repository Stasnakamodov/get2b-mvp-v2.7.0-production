import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Rocket,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Building2,
  FileText,
  CreditCard,
  Wallet,
  UserCheck,
  Receipt,
  ClipboardList,
  Plus,
  ShoppingCart,
  Bell,
  Users,
  Copy,
  Lightbulb,
  MessageSquare,
  Clock
} from "lucide-react"

export default function FirstProjectPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Rocket className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Создание первого проекта
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Пошаговое руководство по созданию и оформлению вашей первой сделки в Get2B
            </p>
          </div>
        </div>
      </div>

      {/* Предварительные требования */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-red-600" />
            Что нужно перед началом
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Перед созданием проекта убедитесь, что выполнены следующие условия:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Зарегистрированный аккаунт</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Подтверждённый email и активная учётная запись</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Минимум один профиль клиента</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Заполненные реквизиты компании (ИНН, ОГРН, банковские данные)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Выбранный поставщик</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Из каталога Get2B или добавленный вручную в Синюю комнату</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Если у вас ещё нет профиля клиента, перейдите в раздел «Профиль» и создайте его.
                Без профиля создание проекта невозможно.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Быстрый старт */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-orange-600" />
            Быстрый старт
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Создать новый проект можно несколькими способами:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
              <Plus className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm text-gray-900 dark:text-white">Кнопка на дашборде</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Нажмите «Новый проект»</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <ShoppingCart className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm text-gray-900 dark:text-white">Из корзины каталога</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Добавьте товары и оформите</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <Copy className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm text-gray-900 dark:text-white">Из шаблона</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Повторите предыдущую сделку</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Обзор 7 шагов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Обзор 7 шагов проекта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-xs shrink-0">1</span>
              <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Данные компании</span>
              <Badge variant="outline" className="ml-auto text-[10px]">~5 мин</Badge>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-xs shrink-0">2</span>
              <FileText className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Спецификация товара</span>
              <Badge variant="outline" className="ml-auto text-[10px]">~10 мин</Badge>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex items-center justify-center w-7 h-7 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs shrink-0">3</span>
              <CreditCard className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Пополнение агента</span>
              <Badge variant="outline" className="ml-auto text-[10px]">~1 день</Badge>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex items-center justify-center w-7 h-7 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs shrink-0">4</span>
              <Wallet className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Способ оплаты поставщику</span>
              <Badge variant="outline" className="ml-auto text-[10px]">~2 мин</Badge>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex items-center justify-center w-7 h-7 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold text-xs shrink-0">5</span>
              <UserCheck className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Реквизиты поставщика</span>
              <Badge variant="outline" className="ml-auto text-[10px]">~5 мин</Badge>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex items-center justify-center w-7 h-7 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold text-xs shrink-0">6</span>
              <Receipt className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Подтверждение менеджером</span>
              <Badge variant="outline" className="ml-auto text-[10px]">1-3 дня</Badge>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <span className="flex items-center justify-center w-7 h-7 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs shrink-0">7</span>
              <CheckCircle className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Завершение сделки</span>
              <Badge className="ml-auto bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 text-[10px]">Готово</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Шаг 1 подробно */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Подробно: первые шаги</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">
                1
              </span>
              Выбор или создание профиля клиента
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              На первом шаге конструктора вам нужно выбрать компанию-заказчика.
              Если у вас уже есть сохранённые профили, они появятся в выпадающем списке.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Существующий профиль
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Выберите профиль из списка. Все реквизиты подставятся
                  автоматически. Это самый быстрый способ.
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-600" />
                  Новый профиль
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Нажмите «Добавить клиента» прямо из конструктора. Заполните
                  реквизиты и продолжите создание проекта.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Данные клиента используются в агентском договоре и платёжных документах.
                  Убедитесь, что ИНН, ОГРН и банковские реквизиты указаны верно.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm">
                2
              </span>
              Создание спецификации
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              На втором шаге укажите, какие товары вы хотите заказать. Есть несколько
              способов создать спецификацию:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Ручной ввод</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Добавьте позиции вручную: название, количество, цена, описание
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Из корзины каталога</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Если вы добавили товары в корзину из каталога Get2B,
                    они автоматически станут спецификацией проекта
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Receipt className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">OCR загрузка инвойса</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Загрузите фото или скан инвойса — система распознает позиции
                    автоматически через Yandex Vision
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Что происходит после создания */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Что происходит после создания проекта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-bold shrink-0 mt-0.5">1</div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Уведомление в Telegram</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Вы получите уведомление о создании проекта в Telegram-бот Get2B
                  с номером проекта и основными данными.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-bold shrink-0 mt-0.5">2</div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Назначение менеджера</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Персональный менеджер Get2B получит уведомление и свяжется с вами
                  для подтверждения деталей сделки.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs font-bold shrink-0 mt-0.5">3</div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Отслеживание в CRM</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Проект появится в разделе «Активные проекты» с текущим статусом
                  и прогрессом по 7 шагам.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Шаблоны */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-green-600" />
            Использование шаблонов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Для повторяющихся заказов используйте шаблоны проектов. Шаблон сохраняет
            все данные предыдущего проекта и позволяет создать новый в несколько кликов.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Что сохраняется
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-6">
                <li>Данные клиента</li>
                <li>Спецификация товаров</li>
                <li>Реквизиты поставщика</li>
                <li>Предпочтительный способ оплаты</li>
              </ul>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                Что нужно обновить
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-6">
                <li>Количество товаров</li>
                <li>Актуальные цены</li>
                <li>Сумму пополнения</li>
                <li>Дату и сроки</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы для новичков */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Советы для первого проекта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Первая сделка бесплатна</strong> — Get2B не берёт комиссию за первый проект.
                Используйте это, чтобы оценить качество сервиса.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Начните с небольшой суммы</strong> — для первого знакомства
                с платформой рекомендуем сделку на небольшую сумму.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте каталог</strong> — если у вас ещё нет поставщика,
                начните с каталога Get2B. Все поставщики верифицированы.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Подключите Telegram-бот</strong> — получайте уведомления о статусе
                проекта в реальном времени прямо в мессенджер.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Не стесняйтесь спрашивать</strong> — менеджер Get2B поможет на каждом
                этапе. Поддержка работает 24/7 в Telegram.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Сроки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Сколько времени занимает первый проект
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-xl font-bold text-blue-600">15-20 мин</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Заполнение данных (шаги 1-2, 4-5)</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-xl font-bold text-green-600">1 день</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Пополнение агента (шаг 3)</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="text-xl font-bold text-orange-600">1-3 дня</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Обработка и оплата (шаги 6-7)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Следующие шаги */}
      <Card>
        <CardHeader>
          <CardTitle>Что дальше?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              После создания первого проекта изучите дополнительные возможности платформы:
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Этапы проекта — подробно о каждом шаге
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Отслеживание проектов — CRM и аналитика
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="w-4 h-4 mr-2" />
                Каталог поставщиков — 10 000+ товаров
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
