import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ScanLine,
  Upload,
  FileCheck,
  Building2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Eye,
  MousePointerClick,
  FileText,
  Zap
} from "lucide-react"

export default function CompanyCardOcrPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <ScanLine className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              OCR карточек компаний
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Автоматическое извлечение данных компании из документов с помощью Yandex Vision
            </p>
          </div>
        </div>
      </div>

      {/* Что это такое */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Что делает OCR карточек
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            OCR (оптическое распознавание символов) автоматически считывает данные компании
            из загруженных документов и заполняет форму профиля клиента. Вместо ручного
            ввода реквизитов достаточно загрузить карточку предприятия, свидетельство о
            регистрации или договор, содержащий данные компании.
          </p>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200">
                  Технология Yandex Vision
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  OCR работает на базе Yandex Vision API, обеспечивающего высокую точность
                  распознавания текста на русском и английском языках, включая рукописный текст
                  и печати.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Как использовать */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Как использовать
        </h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold">
                  1
                </span>
                Перейдите в профиль клиента
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Откройте раздел <Badge variant="outline">Профиль</Badge> и нажмите
                кнопку <Badge variant="outline">Добавить клиента</Badge> или выберите
                существующего клиента для редактирования. Выберите опцию
                &laquo;Загрузить карточку&raquo; для автозаполнения данных.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold">
                  2
                </span>
                Загрузите документ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Перетащите файл в зону загрузки (drag & drop) или нажмите на область,
                чтобы выбрать файл через проводник. Поддерживаются форматы PDF, JPEG,
                PNG, XLSX и DOCX.
              </p>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800/50">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Перетащите файл сюда или нажмите для выбора
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
                <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold">
                  3
                </span>
                Дождитесь распознавания
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Система отправит документ на обработку в Yandex Vision API.
                Обычно распознавание занимает 5-15 секунд в зависимости от
                размера и качества документа. Индикатор загрузки покажет
                прогресс обработки.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold">
                  4
                </span>
                Проверьте и сохраните данные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Извлечённые данные автоматически заполнят соответствующие поля формы.
                Проверьте корректность каждого поля и внесите исправления при
                необходимости, затем нажмите &laquo;Сохранить&raquo;.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Какие данные извлекаются */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-green-600" />
            Извлекаемые данные
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Название компании (полное и сокращённое)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">ИНН (идентификационный номер)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">КПП (код причины постановки на учёт)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">ОГРН (основной государственный регистрационный номер)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Юридический и фактический адрес</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Email и телефон</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Банковские реквизиты (р/с, к/с, БИК)</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Наименование банка</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Какие документы подходят */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Какие документы подходят
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Карточка предприятия</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Стандартная форма с реквизитами компании</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Свидетельство о регистрации</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">ОГРН, наименование, дата регистрации</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Договоры с реквизитами</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Любой договор, содержащий полные реквизиты сторон</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">Выписка из ЕГРЮЛ</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Полные данные о юридическом лице</p>
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
            Советы для лучшего распознавания
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте чёткие сканы</strong> — разрешение от 300 DPI обеспечивает
                наилучшее качество распознавания.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Избегайте фотографий под углом</strong> — документ должен быть
                расположен ровно, без перспективных искажений.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте извлечённые данные</strong> — всегда сверяйте распознанные
                ИНН, КПП и ОГРН с оригиналом документа.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>PDF работает лучше всего</strong> — электронные PDF-документы
                распознаются быстрее и точнее, чем сканы изображений.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Предупреждение */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Важно
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              OCR-распознавание не является 100% точным. Всегда проверяйте
              извлечённые данные перед сохранением. Особое внимание уделяйте
              числовым полям: ИНН, КПП, ОГРН и банковским реквизитам.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
