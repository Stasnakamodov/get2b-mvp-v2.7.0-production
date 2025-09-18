import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Edit, 
  Image, 
  Save, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  Trash2
} from "lucide-react"

export default function SupplierEditingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Edit className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Редактирование поставщиков
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Пошаговое руководство по изменению данных и логотипов поставщиков в синей комнате
            </p>
          </div>
        </div>
      </div>

      {/* Пошаговое руководство */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Как редактировать поставщика</h2>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  1
                </span>
                Откройте синюю комнату
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Перейдите в раздел "Каталог" в главном меню и убедитесь, что активна вкладка "Ваши поставщики" (синяя комната).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  2
                </span>
                Найдите поставщика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Используйте поиск или прокрутите список, чтобы найти нужного поставщика. 
                Каждый поставщик отображается в отдельной карточке с основной информацией.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  3
                </span>
                Нажмите "✏️ Редактировать"
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                В карточке поставщика найдите зеленую кнопку "✏️ Редактировать" и нажмите на неё. 
                Откроется модальное окно с формой редактирования.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  4
                </span>
                Измените логотип (опционально)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                В первом шаге формы найдите блок "Логотип компании":
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Если логотипа нет:</span>
                  <Badge variant="outline">Загрузить логотип</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Если логотип есть:</span>
                  <Badge variant="outline">Изменить логотип</Badge>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Поддерживаемые форматы:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <div>• JPEG, PNG</div>
                  <div>• WebP, SVG</div>
                  <div>• Максимум 5MB</div>
                  <div>• Рекомендуется 200x200px</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  5
                </span>
                Отредактируйте данные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Пройдите по всем шагам формы и внесите необходимые изменения:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Шаг 1: Основная информация</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Название компании</li>
                    <li>• Описание</li>
                    <li>• Логотип</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Шаг 2: Контактные данные</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Email и телефон</li>
                    <li>• Адрес</li>
                    <li>• Веб-сайт</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Шаг 3: Товары и услуги</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Категории товаров</li>
                    <li>• Описание товаров</li>
                    <li>• Минимальные заказы</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Шаг 4: Способы оплаты</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Банковский перевод</li>
                    <li>• Кредитные карты</li>
                    <li>• Другие методы</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Шаг 5: Реквизиты</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• ИНН, КПП, ОГРН</li>
                    <li>• Банковские реквизиты</li>
                    <li>• Юридический адрес</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Шаг 6: Дополнительно</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Примечания</li>
                    <li>• Специальные условия</li>
                    <li>• Документы</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full font-bold">
                  6
                </span>
                Сохраните изменения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                На последнем шаге нажмите кнопку "Сохранить". Система автоматически обновит данные поставщика 
                и вернет вас в каталог с обновленной информацией.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Особенности редактирования */}
      <Card>
        <CardHeader>
          <CardTitle>Особенности редактирования</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">✅ Что можно изменить:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Любые данные о компании
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Контактную информацию
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Список товаров и услуг
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Способы оплаты
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Банковские реквизиты
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Логотип компании
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">⚠️ Ограничения:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  Нельзя изменить ID поставщика
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  История проектов сохраняется
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  Статистика не сбрасывается
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Советы по редактированию */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Советы по редактированию</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Регулярно обновляйте данные</strong> — поддерживайте актуальность информации о поставщиках для эффективной работы.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте качественные логотипы</strong> — квадратные изображения в формате PNG или SVG лучше всего отображаются.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Проверяйте реквизиты</strong> — убедитесь в правильности банковских данных перед сохранением.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Добавляйте примечания</strong> — используйте поле "Дополнительная информация" для важных деталей о поставщике.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Устранение проблем */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Устранение проблем</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-700 dark:text-red-300">Ошибка 401 Unauthorized</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Выйдите из системы и войдите снова. Проверьте, что вы авторизованы.
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium text-yellow-700 dark:text-yellow-300">Логотип не загружается</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Проверьте формат файла и размер. Используйте JPEG, PNG, WebP или SVG до 5MB.
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-blue-700 dark:text-blue-300">Изменения не сохраняются</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Проверьте интернет-соединение и попробуйте снова. Убедитесь, что все обязательные поля заполнены.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 