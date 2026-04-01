import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  Search,
  Filter,
  ShoppingCart,
  Heart,
  Star,
  Image,
  Link,
  Grid3X3,
  Users,
  Package,
  ArrowUpDown,
  Globe,
  CheckCircle,
  Layers,
  Tag,
  LayoutGrid,
  List
} from "lucide-react"

export default function Get2BCatalogPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Каталог Get2B (аккредитованные поставщики)
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              4800+ верифицированных товаров от проверенных поставщиков с гарантией качества
            </p>
          </div>
        </div>
      </div>

      {/* Описание каталога */}
      <Card>
        <CardHeader>
          <CardTitle>Что такое каталог Get2B?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Каталог Get2B — это централизованная база верифицированных товаров и поставщиков, прошедших
            аккредитацию платформы. Все поставщики в каталоге проверены командой Get2B на соответствие
            стандартам качества, надежности и соблюдения сроков поставок. Каталог содержит более 4800 товаров
            в различных категориях.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Package className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">4800+ товаров</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Проверенный ассортимент</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Аккредитация</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Гарантия качества</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Верифицированные</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Надежные партнеры</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Два режима просмотра */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Два режима просмотра</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-emerald-600" />
                Режим "Категории"
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Просматривайте товары по иерархическим категориям и подкатегориям:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  Иерархические категории с подкатегориями
                </li>
                <li className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  Карточки товаров с изображениями и ценами
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  Рейтинги и отзывы покупателей
                </li>
                <li className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  Бейджи наличия и минимальных партий
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Режим "Поставщики"
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Просматривайте аккредитованных поставщиков и их каталоги:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-gray-500" />
                  Сетка карточек поставщиков (Grid-вид)
                </li>
                <li className="flex items-center gap-2">
                  <List className="w-4 h-4 text-gray-500" />
                  Табличный список (List-вид)
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-500" />
                  Бейджи аккредитации и верификации
                </li>
                <li className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  Количество товаров и каталог каждого
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Поиск */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Умный поиск</h2>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Три способа поиска товаров</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Каталог поддерживает три метода поиска: текстовый, по изображению и по ссылке.
            Используйте тот, который удобнее в конкретной ситуации.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="w-5 h-5 text-blue-600" />
                Текстовый поиск
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Введите название товара, категорию или ключевые слова. Система найдет подходящие
                товары по названию и описанию.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Image className="w-5 h-5 text-purple-600" />
                Поиск по фото
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Загрузите фотографию товара, и система подберет визуально похожие позиции
                из каталога с помощью ИИ.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link className="w-5 h-5 text-orange-600" />
                Поиск по URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Вставьте ссылку на товар с другого сайта. Система извлечет данные и найдет
                аналоги в каталоге Get2B.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Фильтрация и сортировка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            Фильтрация и сортировка
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Используйте мощные фильтры для точного подбора нужных товаров:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Фильтры:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Диапазон цен (от/до)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Наличие на складе
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Страна производства/поставки
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Категория и подкатегория
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Сортировка:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  По цене (возрастание/убывание)
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  По рейтингу
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  По популярности
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  По дате добавления
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Карточка товара */}
      <Card>
        <CardHeader>
          <CardTitle>Что содержит карточка товара</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Каждый товар в каталоге имеет подробную карточку со всей необходимой информацией:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Основная информация</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>- Изображения товара (галерея)</li>
                <li>- Название и описание</li>
                <li>- Цена за единицу</li>
                <li>- Минимальный объем заказа (MOQ)</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">О поставщике</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>- Название компании-поставщика</li>
                <li>- Рейтинг поставщика</li>
                <li>- Страна поставки</li>
                <li>- Статус аккредитации</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Корзина и вишлист */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Корзина и избранное</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Корзина покупок
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Добавляйте товары в корзину и управляйте заказом:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Добавление товаров из карточек
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Установка количества для каждой позиции
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Просмотр итоговой суммы
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Создание проекта прямо из корзины
                </li>
              </ul>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Товары из корзины автоматически переносятся в новый проект при его создании.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Избранное (Wishlist)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400">
                Сохраняйте понравившиеся товары для быстрого доступа:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  Добавление в избранное одним нажатием
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  Отдельная страница со всеми сохраненными товарами
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  Быстрое добавление из избранного в корзину
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  Уведомления об изменении цен
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Коллекции */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-600" />
            Коллекции товаров
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-gray-600 dark:text-gray-400">
            Каталог содержит тематические коллекции — подборки товаров, собранные командой Get2B
            для удобства выбора:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-center">
              <p className="font-medium text-violet-800 dark:text-violet-200">Популярные товары</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">Топ продаж месяца</p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-center">
              <p className="font-medium text-violet-800 dark:text-violet-200">Новинки</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">Недавно добавленные</p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-center">
              <p className="font-medium text-violet-800 dark:text-violet-200">Рекомендации</p>
              <p className="text-xs text-violet-600 dark:text-violet-400">Подобранные для вас</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Аккредитация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Как работает аккредитация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Аккредитация Get2B — это процесс проверки поставщиков, гарантирующий качество
            и надежность сотрудничества. Аккредитованные поставщики отмечены специальным бейджем.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full font-bold shrink-0">
                1
              </span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Проверка документов</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Команда Get2B проверяет юридические документы, лицензии и сертификаты поставщика.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full font-bold shrink-0">
                2
              </span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Оценка качества</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Проводится аудит качества продукции, условий хранения и логистических процессов.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full font-bold shrink-0">
                3
              </span>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Присвоение статуса</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  После успешной проверки поставщик получает бейдж аккредитации и попадает в каталог Get2B.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Аккредитация регулярно подтверждается. Поставщики, не прошедшие повторную проверку,
              теряют статус и удаляются из каталога Get2B.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Полезные советы */}
      <Card>
        <CardHeader>
          <CardTitle>Полезные советы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Используйте фильтры</strong> — они помогут сузить выбор из 4800+ товаров до нужных позиций за считанные секунды.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Сохраняйте в избранное</strong> — добавляйте интересные товары, чтобы не потерять их при дальнейшем просмотре каталога.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Пробуйте поиск по фото</strong> — если у вас есть образец нужного товара, загрузите фотографию для быстрого поиска аналогов.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Создавайте проект из корзины</strong> — собрав все нужные товары, одним нажатием переведите их в новый проект для оформления закупки.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
