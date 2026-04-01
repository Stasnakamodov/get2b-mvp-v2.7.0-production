import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Image,
  Upload,
  Sun,
  Moon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  FileImage,
  HardDrive,
  Palette,
  Monitor,
  Maximize2,
  Info,
  RefreshCw,
  XCircle
} from "lucide-react"

export default function LogosManagementPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Image className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Управление логотипами
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Загрузка, настройка и управление логотипами поставщиков в каталоге
            </p>
          </div>
        </div>
      </div>

      {/* Описание */}
      <Card>
        <CardHeader>
          <CardTitle>Зачем нужны логотипы?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Логотипы поставщиков улучшают визуальное восприятие каталога, упрощают поиск
            нужных партнеров и придают профессиональный вид карточкам. Логотипы отображаются
            в нескольких местах интерфейса: карточки поставщиков, модальные окна с деталями,
            профили компаний и списки при создании проектов.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FileImage className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">В карточках</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Grid и List виды каталога</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Monitor className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">В модальных окнах</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Детали поставщика</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Edit className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">В профиле</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Страница компании</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Поддерживаемые форматы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-indigo-600" />
            Поддерживаемые форматы
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">JPEG</Badge>
              <p className="text-xs text-gray-600 dark:text-gray-400">Фотографии, растр</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">PNG</Badge>
              <p className="text-xs text-gray-600 dark:text-gray-400">С прозрачностью</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
              <Badge variant="outline" className="mb-2">WebP</Badge>
              <p className="text-xs text-gray-600 dark:text-gray-400">Сжатие без потерь</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
              <Badge className="mb-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">SVG</Badge>
              <p className="text-xs text-gray-600 dark:text-gray-400">Векторный, темы</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Максимальный размер</Badge>
            <span className="text-sm text-gray-600 dark:text-gray-400">5 MB на файл</span>
          </div>
        </CardContent>
      </Card>

      {/* Способы загрузки */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Способы загрузки</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Выбор файла
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Стандартный способ загрузки логотипа с устройства:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Нажмите "Загрузить логотип" в форме поставщика
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Выберите файл из файловой системы
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Файл конвертируется в base64 или загружается в хранилище
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Предпросмотр отобразится в форме
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-600" />
                Supabase Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Загрузка в облачное хранилище для надежного хранения:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Файл загружается в бакет Supabase Storage
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Генерируется публичный URL
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  URL сохраняется в профиле поставщика
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Быстрая загрузка из CDN
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SVG темизация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-600" />
            SVG-логотипы с поддержкой тем
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            SVG-логотипы автоматически адаптируются под светлую и темную тему интерфейса.
            Это обеспечивает корректное отображение логотипа в любом режиме.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <h4 className="font-medium text-gray-900 dark:text-white">Светлая тема</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Логотип отображается в темных тонах на светлом фоне. SVG автоматически
                применяет цвета, подходящие для светлого интерфейса.
              </p>
            </div>
            <div className="p-4 bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-5 h-5 text-blue-400" />
                <h4 className="font-medium text-white">Темная тема</h4>
              </div>
              <p className="text-sm text-gray-300">
                Логотип автоматически инвертируется или переключает цветовую схему
                для читаемости на темном фоне.
              </p>
            </div>
          </div>

          <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
            <h4 className="font-medium text-violet-800 dark:text-violet-200 mb-2">Как это работает</h4>
            <p className="text-sm text-violet-700 dark:text-violet-300">
              Система анализирует SVG-файл и применяет CSS-фильтры или заменяет цвета fill/stroke
              в зависимости от текущей темы. Для наилучшего результата используйте одноцветные SVG
              без встроенных стилей.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Изменение и удаление */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Изменение и удаление логотипов</h2>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Замена логотипа
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Чтобы заменить логотип поставщика:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm shrink-0">
                    1
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Откройте редактирование поставщика (кнопка "Редактировать" в карточке)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm shrink-0">
                    2
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    На первом шаге формы найдите секцию "Логотип компании"
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm shrink-0">
                    3
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Нажмите "Изменить логотип" и выберите новый файл
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold text-sm shrink-0">
                    4
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Сохраните изменения на последнем шаге формы
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Удаление логотипа
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                При удалении логотипа вместо него будет отображаться иконка-заглушка с первой буквой
                названия компании. Для удаления:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Откройте редактирование поставщика
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  В секции логотипа нажмите кнопку удаления
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Подтвердите удаление и сохраните изменения
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Лучшие практики */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Лучшие практики
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Рекомендуемые параметры</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-gray-500" />
                  Размер: 200x200 пикселей (квадрат)
                </li>
                <li className="flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-gray-500" />
                  Формат: SVG (лучший) или PNG с прозрачностью
                </li>
                <li className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  Одноцветный SVG для автоматической темизации
                </li>
                <li className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  Размер файла: до 500 КБ (оптимально)
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Чего следует избегать</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Фотографии низкого разрешения
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Логотипы с белым непрозрачным фоном
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Слишком сложные SVG (&gt;500 КБ)
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  Прямоугольные изображения без обрезки
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Устранение проблем */}
      <Card>
        <CardHeader>
          <CardTitle>Устранение проблем</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-700 dark:text-red-300">Логотип не загружается</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Проверьте формат файла (JPEG, PNG, WebP, SVG) и размер (не более 5 МБ).
                Убедитесь, что файл не поврежден — попробуйте открыть его в браузере.
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300">Логотип отображается некорректно в темной теме</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Используйте SVG без встроенных CSS-стилей. Если логотип содержит фиксированные цвета
                (например, белый текст), он может быть невидим на белом фоне. Используйте одноцветный SVG.
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300">Логотип размытый или пиксельный</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Используйте изображение минимум 200x200 пикселей. Для наилучшего качества
                загружайте SVG — он масштабируется без потери качества.
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium text-orange-700 dark:text-orange-300">Ошибка загрузки в Supabase Storage</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Проверьте подключение к интернету. Если ошибка повторяется, попробуйте уменьшить
                размер файла или конвертировать в другой формат. Обратитесь в поддержку при постоянных сбоях.
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-purple-700 dark:text-purple-300">Старый логотип отображается после замены</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Это может быть связано с кешированием браузера. Обновите страницу (Ctrl+Shift+R)
                или очистите кеш. Новый логотип появится после обновления.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы */}
      <Card>
        <CardHeader>
          <CardTitle>Полезные советы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Выбирайте SVG</strong> — векторный формат обеспечивает идеальное качество при любом масштабе и автоматическую адаптацию под тему.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте прозрачный фон</strong> — PNG и SVG с прозрачностью лучше всего вписываются в карточки поставщиков.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Делайте квадратные логотипы</strong> — пропорция 1:1 гарантирует правильное отображение во всех видах каталога.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте обе темы</strong> — после загрузки переключите тему интерфейса, чтобы убедиться в корректном отображении логотипа.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
