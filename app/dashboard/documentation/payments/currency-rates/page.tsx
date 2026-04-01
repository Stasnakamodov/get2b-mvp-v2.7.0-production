import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Calculator,
  Globe,
  Zap,
  BarChart3,
  ArrowRightLeft,
  Info,
  Lightbulb
} from "lucide-react"

export default function CurrencyRatesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Курсы валют
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Поддерживаемые валюты, обменные курсы и расчет сумм на платформе Get2B
            </p>
          </div>
        </div>
      </div>

      {/* Supported Currencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Поддерживаемые валюты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get2B поддерживает четыре основные валюты для международных переводов между
            Россией и Китаем. Вы можете создавать проекты в любой из этих валют.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-3xl font-bold text-blue-600 mb-1">RUB</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Российский рубль</p>
              <Badge className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Основная</Badge>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 mb-1">CNY</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Китайский юань</p>
              <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Основная</Badge>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-3xl font-bold text-yellow-600 mb-1">USD</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Доллар США</p>
              <Badge variant="outline" className="mt-2">Дополнительная</Badge>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-3xl font-bold text-purple-600 mb-1">EUR</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Евро</p>
              <Badge variant="outline" className="mt-2">Дополнительная</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Rates Work */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Как работают курсы на платформе
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Курсы валют на Get2B формируются на основе рыночных данных с учетом
            специфики международных переводов между Россией и Китаем.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Рыночный курс</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  За основу берется актуальный рыночный курс ЦБ РФ и межбанковский курс.
                  Курс обновляется регулярно для обеспечения актуальности.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Конвертация</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  При создании проекта вы указываете сумму в валюте поставщика (обычно CNY).
                  Система автоматически рассчитает эквивалент в рублях по текущему курсу.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Фиксация курса</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Курс фиксируется на момент подтверждения проекта менеджером. Это защищает
                  вас от колебаний валюты во время обработки платежа.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Обновление и актуальность курсов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Частота обновления:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Курсы обновляются несколько раз в день
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Основной источник: ЦБ РФ + межбанковский рынок
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Курс CNY обновляется с учетом спроса
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Индикаторы актуальности:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Актуальный</Badge>
                  Обновлен менее 1 часа назад
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Обновляется</Badge>
                  Ожидается новый курс
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Выходной</Badge>
                  Курс предыдущего торгового дня
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Обратите внимание</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  В выходные и праздничные дни используется курс последнего торгового дня.
                  Итоговый курс может незначительно отличаться при фиксации менеджером.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Selection in Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            Выбор валюты в проекте
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            При создании проекта вы выбираете валюту инвойса (счета от поставщика). Обычно
            китайские поставщики выставляют счета в CNY (юань) или USD (доллар).
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">1</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Загрузите инвойс от поставщика</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">OCR автоматически распознает валюту и сумму из документа</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">2</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Проверьте или выберите валюту</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Если OCR не распознал валюту, выберите вручную из списка: CNY, USD, EUR</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">3</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Система рассчитает сумму в рублях</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Автоматический расчет суммы к оплате в RUB по текущему курсу + комиссия</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-600" />
            Примеры расчета сумм
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Ниже приведены примеры расчета итоговой суммы к оплате с учетом конвертации
            и комиссии Get2B (условные курсы для демонстрации).
          </p>

          {/* Example 1: CNY */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">Пример 1: Оплата в юанях (CNY)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Сумма инвойса:</span>
                <span className="font-medium">50 000 CNY</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Курс CNY/RUB:</span>
                <span className="font-medium">12.80 RUB за 1 CNY</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Сумма в рублях:</span>
                <span className="font-medium">640 000 RUB</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Комиссия Get2B (3.5%):</span>
                <span className="font-medium">22 400 RUB</span>
              </div>
              <div className="border-t border-green-300 dark:border-green-700 pt-2 flex justify-between font-bold text-green-800 dark:text-green-200">
                <span>Итого к оплате:</span>
                <span>662 400 RUB</span>
              </div>
            </div>
          </div>

          {/* Example 2: USD */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">Пример 2: Оплата в долларах (USD)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Сумма инвойса:</span>
                <span className="font-medium">10 000 USD</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Курс USD/RUB:</span>
                <span className="font-medium">92.50 RUB за 1 USD</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Сумма в рублях:</span>
                <span className="font-medium">925 000 RUB</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Комиссия Get2B (3.5%):</span>
                <span className="font-medium">32 375 RUB</span>
              </div>
              <div className="border-t border-blue-300 dark:border-blue-700 pt-2 flex justify-between font-bold text-blue-800 dark:text-blue-200">
                <span>Итого к оплате:</span>
                <span>957 375 RUB</span>
              </div>
            </div>
          </div>

          {/* Example 3: Large amount */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-3">Пример 3: Крупная поставка (сниженная комиссия)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Сумма инвойса:</span>
                <span className="font-medium">500 000 CNY</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Курс CNY/RUB:</span>
                <span className="font-medium">12.80 RUB за 1 CNY</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Сумма в рублях:</span>
                <span className="font-medium">6 400 000 RUB</span>
              </div>
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Комиссия Get2B (2%):</span>
                <span className="font-medium">128 000 RUB</span>
              </div>
              <div className="border-t border-purple-300 dark:border-purple-700 pt-2 flex justify-between font-bold text-purple-800 dark:text-purple-200">
                <span>Итого к оплате:</span>
                <span>6 528 000 RUB</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-500 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Курсы в примерах условные и приведены для демонстрации расчета. Актуальные курсы
                отображаются при создании проекта и могут отличаться.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips for Best Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Советы для лучшего курса
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Следите за рынком</strong> -- курс юаня к рублю может колебаться на 1-3% в течение недели. Создавайте проект, когда курс выгодный.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Объединяйте поставки</strong> -- чем больше сумма сделки, тем ниже комиссия. Вместо трех платежей по 200 000 RUB лучше сделать один на 600 000 RUB.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Оплачивайте быстро</strong> -- после создания проекта переводите средства как можно скорее, пока зафиксированный курс актуален.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Обсудите курс с менеджером</strong> -- для крупных сделок (от 5 000 000 RUB) возможны индивидуальные условия по курсу.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Выбирайте валюту инвойса</strong> -- если поставщик принимает CNY и USD, сравните итоговые суммы в обеих валютах и выберите более выгодный вариант.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-currency Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            Мультивалютные проекты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get2B поддерживает работу с несколькими валютами в рамках разных проектов.
            Каждый проект фиксируется в одной валюте, но вы можете иметь параллельные
            проекты в разных валютах.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Типичные сценарии:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Инвойс в CNY -- оплата в RUB
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Инвойс в USD -- оплата в RUB
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Инвойс в EUR -- оплата в RUB
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Несколько проектов в разных валютах одновременно
                </li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Важно знать:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Оплата на агентский счет всегда в RUB
                </li>
                <li className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Get2B конвертирует в валюту поставщика
                </li>
                <li className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Курс фиксируется при подтверждении проекта
                </li>
                <li className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Разные проекты могут иметь разные курсы
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-indigo-800 dark:text-indigo-200">Совет</h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                  При работе с несколькими поставщиками в Китае, большинство выставляют инвойсы
                  в CNY (юань). Это самый выгодный вариант, так как перевод идет напрямую
                  без промежуточной конвертации через доллар.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Следующие шаги</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Связанные разделы документации:
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/payments/methods'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Способы оплаты
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/payments/tracking'}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Отслеживание платежей
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/getting-started/first-project'}>
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