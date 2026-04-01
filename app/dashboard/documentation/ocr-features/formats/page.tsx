import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileType,
  FileImage,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
  Monitor,
  Camera,
  ScanLine,
  Maximize2,
  Zap
} from "lucide-react"

export default function FormatsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
            <FileType className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Поддерживаемые форматы
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Форматы документов, требования к качеству и рекомендации для OCR
            </p>
          </div>
        </div>
      </div>

      {/* Форматы документов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Поддерживаемые форматы файлов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <FileText className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">PDF</h4>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Рекомендуется</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Электронные и отсканированные PDF. Электронные PDF с текстовым слоем
                  распознаются быстрее и точнее.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <FileImage className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">JPEG / JPG</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Фотографии и сканы документов. Убедитесь в достаточной резкости
                  и контрастности изображения.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <FileImage className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">PNG</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Изображения без потери качества. Подходят скриншоты и
                  высококачественные сканы.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <FileSpreadsheet className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">XLSX</h4>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Для инвойсов</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Файлы Excel со структурированными данными. Идеальны для
                  инвойсов и спецификаций.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">DOCX</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Документы Word. Подходят для карточек предприятий и договоров,
                  содержащих реквизиты.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Требования к изображениям */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-600" />
            Требования к изображениям
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <Maximize2 className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">Разрешение</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Минимум 300 DPI</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Рекомендуется 600 DPI</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <ScanLine className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">Чёткость</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Текст должен быть читаемым</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Без размытия и засветов</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <FileImage className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">Размер</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">До 20 MB на файл</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Оптимально 2-10 MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации по сканированию */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-600" />
            Рекомендации по сканированию
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Размещайте документ ровно</strong> — убедитесь, что текст
                расположен горизонтально, без наклона и перекоса.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Обеспечьте равномерное освещение</strong> — избегайте теней,
                бликов и неравномерной засветки при фотографировании.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Весь документ в кадре</strong> — текст не должен обрезаться
                по краям. Оставьте небольшие поля вокруг документа.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте сканер</strong> — планшетный сканер даёт
                значительно лучший результат, чем фотография на телефон.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Сохраняйте в PDF</strong> — при сканировании выбирайте
                формат PDF с оптическим распознаванием текста (OCR) в настройках сканера.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Что работает хорошо vs что нет */}
      <Card>
        <CardHeader>
          <CardTitle>Качество распознавания</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Хорошо распознаётся
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  Электронные PDF с текстовым слоем
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  Чёткие сканы при 300+ DPI
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  Печатный текст на белом фоне
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  Таблицы с чёткой структурой
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  Файлы XLSX с данными
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                  Стандартные формы документов
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Плохо распознаётся
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  Размытые фотографии с телефона
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  Документы с водяными знаками
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  Рукописный текст
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  Тёмный фон с светлым текстом
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  Смятые или порванные документы
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                  Фото под углом с перспективой
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Устранение проблем */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Устранение проблем с OCR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-700 dark:text-red-300">Текст не распознаётся</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Убедитесь, что изображение достаточно чёткое. Попробуйте отсканировать
                документ заново при 600 DPI или использовать электронную версию документа.
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300">Данные извлечены неправильно</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Проверьте, что документ расположен ровно, без наклона. Обрежьте лишние
                элементы вокруг текста и попробуйте загрузить снова.
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300">Файл не загружается</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Проверьте формат файла (PDF, JPG, PNG, XLSX, DOCX) и размер (до 20 MB).
                Переконвертируйте файл в поддерживаемый формат при необходимости.
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-purple-700 dark:text-purple-300">Распознаны не все поля</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Не все документы содержат полный набор данных. Заполните пропущенные
                поля вручную после автоматического распознавания.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Совет */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200">
              Совет
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Для регулярной работы с OCR настройте сканер на автоматическое
              сохранение в PDF с разрешением 300 DPI. Это обеспечит стабильно
              высокое качество распознавания и сэкономит время на обработку.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
