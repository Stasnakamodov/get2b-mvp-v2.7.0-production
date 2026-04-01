import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  FileText,
  Plus,
  Save,
  Settings,
  Trash2,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Tag,
  Layers,
  PenLine,
  Eye,
  FolderOpen
} from "lucide-react"

export default function ProjectTemplatesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Copy className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Шаблоны проектов
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Создавайте и используйте шаблоны для быстрого запуска типовых проектов
            </p>
          </div>
        </div>
      </div>

      {/* Что такое шаблоны */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Что такое шаблоны и зачем они нужны
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Шаблоны проектов позволяют сохранить часто используемые данные компаний и спецификаций,
            чтобы не заполнять их заново при создании каждого нового проекта. Это особенно полезно,
            если вы регулярно работаете с одними и теми же клиентами или поставщиками.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Copy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Быстрый старт</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Создание проекта в один клик</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Без ошибок</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Проверенные данные из шаблона</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Layers className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Стандартизация</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Единый формат для всей команды</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Типы шаблонов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Типы шаблонов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            На платформе доступны два типа шаблонов, каждый из которых сохраняет данные
            для соответствующей стороны сделки.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Шаблон клиента</h3>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Client</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Сохраняет данные компании-клиента: название, адрес, ИНН, контактные данные.
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Данные компании (Шаг 1)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Контактная информация</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Юридические данные</li>
              </ul>
            </div>
            <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Шаблон поставщика</h3>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Supplier</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Сохраняет данные поставщика: спецификации, реквизиты, условия работы.
              </p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Спецификация товаров (Шаг 2)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Банковские реквизиты</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Предпочтительный способ оплаты</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Создание шаблона */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Создание шаблона</h2>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                1
              </span>
              Перейдите на страницу создания проекта
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              Откройте страницу "Создать проект" из главного меню. В верхней части страницы
              переключите режим на <strong>"Шаблон"</strong> (параметр mode=template).
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <code className="text-sm text-gray-700 dark:text-gray-300">
                /dashboard/create-project?mode=template
              </code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                2
              </span>
              Заполните данные шаблона
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              Заполните те же поля, что и при создании обычного проекта. Все введенные данные
              будут сохранены в шаблоне для повторного использования.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  В режиме шаблона не нужно загружать документы -- сохраняются только текстовые данные
                  и параметры конфигурации.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full font-bold">
                3
              </span>
              Сохраните шаблон
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              На финальном шаге укажите метаданные шаблона для удобного поиска и использования.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Название шаблона</span>
                  <Badge variant="destructive" className="ml-2">Обязательно</Badge>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Краткое понятное название, например "Клиент -- ООО Альфа"</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PenLine className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Описание</span>
                  <Badge variant="outline" className="ml-2">Опционально</Badge>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Дополнительные заметки о шаблоне</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Роль (тип)</span>
                  <Badge variant="destructive" className="ml-2">Обязательно</Badge>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Клиент или Поставщик</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Использование шаблона */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            Использование шаблона
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Чтобы создать новый проект на основе шаблона, выполните следующие действия:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs flex-shrink-0 mt-0.5">1</span>
              <p className="text-gray-600 dark:text-gray-400">
                Откройте список шаблонов на странице создания проекта
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs flex-shrink-0 mt-0.5">2</span>
              <p className="text-gray-600 dark:text-gray-400">
                Найдите нужный шаблон в списке карточек
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs flex-shrink-0 mt-0.5">3</span>
              <p className="text-gray-600 dark:text-gray-400">
                Нажмите кнопку <strong>"Создать проект"</strong> на карточке шаблона
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs flex-shrink-0 mt-0.5">4</span>
              <p className="text-gray-600 dark:text-gray-400">
                Данные из шаблона будут автоматически заполнены в форме создания проекта
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold text-xs flex-shrink-0 mt-0.5">5</span>
              <p className="text-gray-600 dark:text-gray-400">
                Проверьте и при необходимости отредактируйте данные, затем сохраните проект
              </p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Совет:</strong> Данные из шаблона можно редактировать перед сохранением
                проекта. Шаблон остается без изменений.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Управление шаблонами */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-orange-600" />
            Управление шаблонами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Все ваши шаблоны доступны на странице создания проекта. Для каждого шаблона
            доступны следующие действия:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900 dark:text-white">Просмотр</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Откройте карточку шаблона, чтобы увидеть сохраненные данные: компания, спецификация, роль.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900 dark:text-white">Создать проект</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Запустите новый проект с автозаполненными данными из шаблона.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-gray-900 dark:text-white">Удаление</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Удалите ненужный шаблон. Существующие проекты, созданные из него, не будут затронуты.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Что сохраняется */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-blue-600" />
            Какие данные сохраняются в шаблоне
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Сохраняется
              </h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Название и описание компании
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Юридический адрес и реквизиты
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Контактные данные
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Спецификации товаров/услуг
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Предпочтительный способ оплаты
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" /> Не сохраняется
              </h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Загруженные файлы и документы
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Квитанции об оплате
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Статусы шагов проекта
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  История уведомлений
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Комментарии и переписка
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Лучшие практики */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Лучшие практики
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте понятные названия</strong> -- включите имя компании и роль,
                например "Клиент -- ООО Глобал Трейд" или "Поставщик -- Shenzhen Electronics".
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Создавайте шаблоны для постоянных партнеров</strong> -- если работаете
                с компанией более 2 раз, сохраните её данные как шаблон.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Обновляйте шаблоны</strong> -- если у компании изменились реквизиты,
                удалите старый шаблон и создайте новый с актуальными данными.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Добавляйте описания</strong> -- заметки в описании шаблона помогут
                быстро вспомнить контекст работы с данным партнером.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Разделяйте клиентов и поставщиков</strong> -- используйте разные шаблоны
                для каждой стороны сделки, даже если это одна и та же компания.
              </p>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Важно:</strong> Шаблоны привязаны к вашему аккаунту. Другие пользователи
                не видят ваши шаблоны и не могут их использовать.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Связанные разделы */}
      <Card>
        <CardHeader>
          <CardTitle>Связанные разделы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/projects/steps'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Этапы проекта -- полное описание 7-шагового процесса
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/getting-started/first-project'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Создание первого проекта -- пошаговое руководство
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/dashboard/documentation/projects/tracking'}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Отслеживание проектов -- управление всеми сделками
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
