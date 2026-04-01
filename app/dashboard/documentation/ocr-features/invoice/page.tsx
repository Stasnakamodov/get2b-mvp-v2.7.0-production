import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Table,
  Package,
  DollarSign,
  Hash,
  ScanLine,
  ClipboardCheck,
  Zap
} from "lucide-react"

export default function InvoiceOcrPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              OCR инвойсов
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Автоматическое заполнение спецификации из загруженных инвойсов
            </p>
          </div>
        </div>
      </div>

      {/* Что это такое */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Что делает OCR инвойсов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            OCR инвойсов автоматически извлекает данные о товарах и услугах из загруженных
            инвойсов (счетов) поставщиков. Вместо ручного заполнения таблицы спецификации
            система считывает все позиции, количества, цены и суммы, формируя готовую
            спецификацию для вашего проекта.
          </p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <ScanLine className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200">
                  Используется на Шаге 2 проекта
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  OCR инвойсов интегрирован в конструктор проектов. На этапе
                  &laquo;Спецификация&raquo; (Шаг 2) вы можете загрузить инвойс
                  вместо ручного заполнения таблицы товаров.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Пошаговая инструкция */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Как использовать
        </h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                  1
                </span>
                Откройте создание проекта
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Перейдите в раздел <Badge variant="outline">Создать проект</Badge> и
                заполните данные на первом шаге (информация о клиенте и поставщике).
                Перейдите к Шагу 2 — &laquo;Спецификация&raquo;.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                  2
                </span>
                Загрузите инвойс
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Найдите кнопку &laquo;Загрузить инвойс&raquo; в верхней части
                формы спецификации. Перетащите файл в зону загрузки или нажмите
                для выбора файла.
              </p>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800/50">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Перетащите инвойс сюда или нажмите для выбора
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  PDF, JPG, PNG, XLSX, DOCX
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                  3
                </span>
                Дождитесь обработки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Yandex Vision API обработает инвойс и извлечёт все товарные позиции.
                Время обработки обычно составляет 10-30 секунд в зависимости от
                количества позиций и качества документа.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                  4
                </span>
                Проверьте извлечённые позиции
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Распознанные позиции отобразятся в таблице спецификации. Проверьте
                каждую строку, скорректируйте при необходимости и подтвердите данные.
                Вы можете добавить недостающие позиции вручную или удалить лишние.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Извлекаемые данные */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5 text-green-600" />
            Извлекаемые данные
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Hash className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Коды товаров (артикулы, HS-коды)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Package className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Наименования товаров и услуг</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <ClipboardCheck className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Количество и единицы измерения</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Цена за единицу</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Общая сумма по каждой позиции</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Итоговая сумма инвойса</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Поддерживаемые форматы инвойсов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Поддерживаемые форматы инвойсов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Proforma Invoice</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Предварительный счёт от поставщика</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Commercial Invoice</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Коммерческий инвойс с детализацией</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Счёт-фактура</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Российские счета и счета-фактуры</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Табличные файлы (XLSX)</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Excel-файлы со структурированными данными</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Советы для лучших результатов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Электронные инвойсы лучше</strong> — PDF-файлы, полученные
                по email, распознаются значительно точнее, чем сканы бумажных документов.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Табличная структура обязательна</strong> — инвойс должен содержать
                чёткую таблицу с позициями. Свободная форма без таблицы распознаётся хуже.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте цены</strong> — особое внимание уделяйте числовым
                значениям: количеству, ценам и итоговым суммам.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Один инвойс — один загрузка</strong> — для многостраничных
                инвойсов загружайте единый PDF-файл, а не отдельные страницы.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>XLSX работает идеально</strong> — если у вас есть инвойс в
                формате Excel, используйте его, так как структурированные данные
                распознаются без ошибок.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Предупреждения */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Обязательно проверяйте результат
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Автоматическое распознавание может допускать ошибки, особенно
              в числовых данных и при низком качестве сканов. Всегда сверяйте
              таблицу спецификации с оригинальным инвойсом перед подтверждением.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
