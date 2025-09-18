import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Plus, 
  Edit, 
  Image, 
  Search, 
  Filter,
  History,
  Star,
  Eye,
  Trash2
} from "lucide-react"

export default function BlueRoomPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Синяя комната
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Ваши личные поставщики с историей проектов и возможностью редактирования
            </p>
          </div>
        </div>
      </div>

      {/* Описание */}
      <Card>
        <CardHeader>
          <CardTitle>Что такое "Синяя комната"?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            "Синяя комната" — это ваш персональный каталог поставщиков, где вы можете хранить информацию 
            о всех партнерах, с которыми работаете. Здесь вы можете добавлять новых поставщиков, 
            редактировать их данные, загружать логотипы и отслеживать историю совместных проектов.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Личные поставщики</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Только ваши партнеры</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Edit className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Полное редактирование</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Изменяйте любые данные</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <History className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">История проектов</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Статистика сотрудничества</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Основные функции */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Основные функции</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Добавление поставщиков
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                7-шаговая форма для добавления нового поставщика с полной информацией:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Основная информация о компании
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Контактные данные
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Товары и услуги
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Способы оплаты
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Банковские реквизиты
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Дополнительная информация
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Подтверждение и сохранение
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Редактирование данных
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Возможность изменения любой информации о поставщике:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                  Название и описание компании
                </li>
                <li className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                  Контактные данные и адреса
                </li>
                <li className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                  Список товаров и услуг
                </li>
                <li className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                  Способы оплаты
                </li>
                <li className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                  Банковские реквизиты
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-600" />
                Управление логотипами
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Загрузка и изменение логотипов поставщиков:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Поддерживаемые форматы</Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">JPEG, PNG, WebP, SVG</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Максимальный размер</Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">5 MB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Рекомендуемый размер</Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">200x200px</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Логотипы отображаются в карточках поставщиков и улучшают визуальное восприятие каталога.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-orange-600" />
                Поиск и фильтрация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Быстрый поиск и фильтрация поставщиков:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  Поиск по названию компании
                </li>
                <li className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  Фильтрация по категориям товаров
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  Сортировка по рейтингу
                </li>
                <li className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  Фильтр по дате добавления
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Пошаговое руководство */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Как добавить поставщика</h2>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  1
                </span>
                Откройте каталог
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Перейдите в раздел "Каталог" в главном меню и убедитесь, что активна вкладка "Ваши поставщики".
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  2
                </span>
                Нажмите "Добавить поставщика"
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Найдите кнопку "Добавить поставщика" в правом верхнем углу и нажмите на неё.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  3
                </span>
                Заполните форму
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Пройдите все 7 шагов формы, заполнив необходимую информацию о поставщике. 
                Обязательно загрузите логотип для лучшего отображения.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  4
                </span>
                Сохраните поставщика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                На последнем шаге нажмите "Сохранить". Поставщик появится в вашей синей комнате 
                и будет доступен для использования в проектах.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Полезные советы */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Полезные советы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Добавляйте логотипы</strong> — это улучшит визуальное восприятие каталога и упростит поиск нужного поставщика.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте поиск</strong> — для быстрого нахождения поставщиков по названию или описанию.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Регулярно обновляйте данные</strong> — поддерживайте актуальность информации о поставщиках.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Изучайте статистику</strong> — анализируйте историю проектов для выбора наиболее успешных партнеров.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 