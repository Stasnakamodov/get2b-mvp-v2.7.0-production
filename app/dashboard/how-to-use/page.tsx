import { logger } from "@/src/shared/lib/logger"
import * as React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Как пользоваться | Get2B",
  description: "Руководство по использованию платформы Get2B для международных платежей",
}

export default function HowToUsePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Как пользоваться платформой</h1>
      </div>

      <div className="max-w-4xl">
        <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">
          Добро пожаловать в руководство по использованию платформы Get2B. Здесь вы найдете подробную информацию о том,
          как эффективно работать с нашими инструментами для международных платежей и управления поставками.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Начало работы</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Для начала работы с платформой Get2B вам необходимо выполнить несколько простых шагов:
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>Зарегистрируйтесь и создайте учетную запись</li>
              <li>Заполните свой цифровой профиль</li>
              <li>Загрузите необходимые документы для верификации</li>
              <li>Создайте свой первый проект</li>
            </ol>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <code className="text-sm">
                {`// Пример создания нового проекта
const newProject = {
name: "Импорт электроники из Китая",
supplier: "Guangzhou Electronics Ltd.",
amount: 350000,
currency: "RUB",
deliveryDate: "2025-04-15"
};

// Отправка запроса на создание проекта
const response = await api.projects.create(newProject);`}
              </code>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Работа с проектами</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Каждый проект проходит через несколько этапов, отображаемых в таймлайне. Вот что нужно делать на каждом
              этапе:
            </p>

            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Этапы проекта</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Данные клиента</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      На этом этапе необходимо заполнить или проверить данные вашей компании. Эта информация будет
                      использоваться для оформления документов и проведения платежей. Убедитесь, что все поля заполнены
                      корректно, особенно банковские реквизиты и контактные данные.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Спецификация</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Заполните форму спецификации, указав детали заказа: наименования товаров, количество, цены и
                      другую необходимую информацию. Вы можете добавлять, редактировать и удалять позиции в
                      спецификации. После заполнения всех данных отправьте заявку на одобрение.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Ожидание одобрения</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      На этом этапе ваша заявка проходит проверку нашими специалистами. Обычно это занимает от
                      нескольких минут до нескольких часов. Вы получите уведомление, когда заявка будет одобрена или
                      если потребуются дополнительные данные.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Получение платежки</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      После одобрения заявки вы получите счет на оплату. Нажмите кнопку "Получить платежку", чтобы
                      просмотреть и скачать счет. Оплатите счет по указанным реквизитам и загрузите подтверждение оплаты
                      через соответствующую форму.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Отправка чека</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Загрузите подтверждение оплаты (чек, платежное поручение или скриншот банковской операции). После
                      проверки платежа система автоматически перейдет к следующему этапу.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">6</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Получение счет-фактуры</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      После подтверждения оплаты вы получите счет-фактуру и другие необходимые документы. Скачайте и
                      сохраните эти документы для вашей бухгалтерии.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">7</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Подтверждение получения</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      На заключительном этапе вы получите подтверждение от поставщика о получении оплаты и начале
                      выполнения заказа. После этого проект переходит в стадию отслеживания доставки.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📦 Умный каталог поставщиков</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Get2B предлагает уникальную систему управления поставщиками с двумя зонами: ваша личная "Синяя комната" 
              и аккредитованный каталог Get2B. Здесь вы можете добавлять, редактировать и управлять поставщиками.
            </p>

            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Две зоны каталога</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">🔵</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Синяя комната</h4>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Ваши личные поставщики с историей проектов. Здесь вы можете добавлять новых поставщиков, 
                        редактировать их данные и управлять логотипами.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">Возможности синей комнаты:</h5>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>• ✏️ <b>Редактирование поставщиков</b> - изменяйте данные и логотипы</li>
                      <li>• 📤 <b>Добавление новых поставщиков</b> - 7-шаговая форма создания</li>
                      <li>• 🖼️ <b>Управление логотипами</b> - загрузка и изменение изображений</li>
                      <li>• 📊 <b>История проектов</b> - статистика по каждому поставщику</li>
                      <li>• 🔍 <b>Поиск и фильтрация</b> - быстрый доступ к нужным поставщикам</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <span className="text-orange-600 dark:text-orange-400 font-bold">🧠</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Каталог Get2B</h4>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Аккредитованные поставщики с AI-рекомендациями. Система анализирует ваши предпочтения 
                        и предлагает подходящих поставщиков.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 dark:text-white">Возможности каталога Get2B:</h5>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>• 🤖 <b>AI-рекомендации</b> - персональные предложения</li>
                      <li>• ✅ <b>Верифицированные поставщики</b> - проверенные партнеры</li>
                      <li>• 📈 <b>Статистика успешности</b> - рейтинги и отзывы</li>
                      <li>• ➕ <b>Добавление в синюю комнату</b> - копирование в личный список</li>
                      <li>• 🔥 <b>Популярные товары</b> - тренды и спрос</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-medium mb-4">✏️ Редактирование поставщиков</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Откройте синюю комнату</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Перейдите в раздел "Каталог" и убедитесь, что активна вкладка "Ваши поставщики" (синяя комната)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Нажмите "✏️ Редактировать"</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Найдите нужного поставщика и нажмите зеленую кнопку "✏️ Редактировать" в карточке поставщика
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Измените логотип</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      В первом шаге формы найдите блок "Логотип компании". Нажмите "Загрузить логотип" или "Изменить логотип" 
                      для загрузки нового изображения. Поддерживаются форматы: JPEG, PNG, WebP, SVG (до 5MB)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Отредактируйте данные</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Пройдите по всем шагам формы и внесите необходимые изменения в данные поставщика: 
                      основная информация, контактные данные, товары, способы оплаты и реквизиты
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Сохраните изменения</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Нажмите "Сохранить" на последнем шаге. Система автоматически обновит данные поставщика 
                      и вернет вас в каталог с обновленной информацией
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Полезные советы по работе с каталогом</h4>
              <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
                <li>• <b>Используйте поиск</b> для быстрого нахождения поставщиков по названию или описанию</li>
                <li>• <b>Фильтруйте по категориям</b> для работы с поставщиками определенной отрасли</li>
                <li>• <b>Добавляйте логотипы</b> для лучшего визуального восприятия каталога</li>
                <li>• <b>Изучайте статистику</b> проектов для выбора наиболее успешных поставщиков</li>
                <li>• <b>Копируйте из каталога Get2B</b> интересных поставщиков в свою синюю комнату</li>
                <li>• <b>Редактируйте данные</b> по мере изменения информации о поставщиках</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Управление платежами</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Платформа Get2B предоставляет удобные инструменты для управления международными платежами:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>Создание платежей в различных валютах</li>
              <li>Отслеживание статуса платежей в реальном времени</li>
              <li>Автоматический расчет комиссий и курсов обмена</li>
              <li>Формирование отчетов по проведенным операциям</li>
            </ul>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <code className="text-sm">
                {`// Пример создания платежа
const payment = {
projectId: "PRJ-2025-001",
recipient: "Shanghai Textile Group",
amount: 120000,
currency: "RUB",
purpose: "Оплата за текстильные изделия"
};

// Отправка запроса на создание платежа
const result = await api.payments.create(payment);`}
              </code>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Работа с шаблонами</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Для экономии времени при создании похожих проектов вы можете использовать шаблоны:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>Сохраняйте часто используемые конфигурации проектов как шаблоны</li>
              <li>Используйте шаблоны для быстрого создания новых проектов</li>
              <li>Редактируйте и удаляйте шаблоны по мере необходимости</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300">
              Для сохранения проекта как шаблона нажмите кнопку "Сохранить" на странице создания проекта и введите
              название шаблона. Для использования шаблона нажмите кнопку "Использовать шаблон" на карточке шаблона на
              главной странице.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Отслеживание поставок</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Система отслеживания поставок позволяет контролировать все этапы доставки товаров:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>Мониторинг статуса отправки в реальном времени</li>
              <li>Получение уведомлений об изменении статуса</li>
              <li>Доступ к документам по отправке</li>
              <li>Координация с логистическими партнерами</li>
            </ul>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <code className="text-sm">
                {`// Пример получения информации о поставке
const shipmentId = "SHP-2025-003";

// Запрос статуса поставки
const shipmentStatus = await api.shipments.getStatus(shipmentId);

// Вывод информации о местоположении
logger.info(\`Текущее местоположение: \${shipmentStatus.location}\`);
logger.info(\`Ожидаемая дата доставки: \${shipmentStatus.estimatedDelivery}\`);`}
              </code>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Работа с ИИ-ассистентом</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              ИИ-ассистент Get2B поможет вам быстро получить ответы на вопросы и решить задачи:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li>Получение информации о курсах валют</li>
              <li>Проверка статуса платежей и поставок</li>
              <li>Помощь в создании новых проектов</li>
              <li>Консультации по работе с платформой</li>
            </ul>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <code className="text-sm">
                {`// Примеры вопросов для ИИ-ассистента

"Какой текущий курс обмена USD к RUB?"
"Как создать новый платеж поставщику?"
"Где я могу отследить статус моей поставки?"
"Какие документы нужны для верификации аккаунта?"`}
              </code>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🤖 Telegram бот для аккредитации поставщиков</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Наш Telegram бот Get2B ChatHub Assistant теперь поддерживает управление аккредитацией поставщиков. 
              Менеджеры могут одобрять или отклонять заявки на аккредитацию прямо из Telegram.
            </p>

            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-medium mb-4">Подключение к боту</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Найдите бота</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Найдите бота в Telegram: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">@get2b_chathub_bot</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Отправьте /start</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Отправьте команду <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">/start</code> для начала работы с ботом
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Получите уведомления</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      При поступлении новых заявок на аккредитацию вы получите автоматические уведомления с кнопками для быстрых действий
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium mb-2">Команды для управления аккредитацией</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Просмотр заявок</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/accredit</code> - Общая информация</li>
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/accredit_pending</code> - Ожидающие заявки</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Управление заявками</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/accredit_view ID</code> - Детали заявки</li>
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/accredit_approve ID</code> - Одобрить</li>
                    <li><code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">/accredit_reject ID причина</code> - Отклонить</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Примеры использования</h4>
                <div className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
                  <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">/accredit_view 03e0c659-5323-4394-a8c0-22f73222f3fa</code></div>
                  <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">/accredit_approve 03e0c659-5323-4394-a8c0-22f73222f3fa</code></div>
                  <div><code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">/accredit_reject 03e0c659-5323-4394-a8c0-22f73222f3fa Недостаточно документов</code></div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">✅ Преимущества Telegram бота</h4>
              <ul className="space-y-1 text-sm text-green-600 dark:text-green-400">
                <li>• Мгновенные уведомления о новых заявках</li>
                <li>• Быстрое одобрение/отклонение одним кликом</li>
                <li>• Работа с мобильного устройства</li>
                <li>• История всех действий</li>
                <li>• Интеграция с веб-интерфейсом</li>
              </ul>
            </div>
          </section>

          {/* Советы и лайфхаки для быстрого старта */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Советы и лайфхаки для быстрого старта 🚀</h2>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li><b>Заполните профиль полностью</b> — это ускорит верификацию и одобрение проектов.</li>
              <li><b>Используйте шаблоны</b> для повторяющихся проектов — экономьте время на вводе данных.</li>
              <li><b>Загружайте документы в PDF или JPG</b> — эти форматы обрабатываются быстрее всего.</li>
              <li><b>Подключитесь к Telegram-боту</b> — получайте мгновенные уведомления о статусах проектов и заявках на аккредитацию.</li>
              <li><b>Используйте команды бота</b> — быстро одобряйте/отклоняйте заявки на аккредитацию прямо из Telegram.</li>
              <li><b>Проверяйте статус проекта</b> — если что-то зависло, обновите страницу или обратитесь в поддержку.</li>
              <li><b>Используйте поиск и фильтры</b> на вкладке "Ваши сделки" для быстрого доступа к нужным проектам.</li>
              <li><b>Редактируйте поставщиков в синей комнате</b> — используйте кнопку "✏️ Редактировать" для обновления данных и логотипов.</li>
              <li><b>Добавляйте логотипы поставщиков</b> — это улучшит визуальное восприятие каталога и упростит поиск.</li>
              <li><b>Изучайте AI-рекомендации</b> в каталоге Get2B — система анализирует ваши предпочтения и предлагает подходящих поставщиков.</li>
              <li><b>Копируйте интересных поставщиков</b> из каталога Get2B в свою синюю комнату для быстрого доступа.</li>
            </ul>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">FAQ — Часто задаваемые вопросы ❓</h2>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Как быстро проходит верификация?</h4>
                <p className="text-gray-700 dark:text-gray-300">Обычно верификация занимает от 10 минут до 2 часов в рабочее время. Если задержка больше — напишите в поддержку.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Можно ли редактировать проект после отправки?</h4>
                <p className="text-gray-700 dark:text-gray-300">Да, до этапа оплаты вы можете редактировать данные проекта и спецификацию. После оплаты — только через поддержку.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Как узнать, что проект одобрен?</h4>
                <p className="text-gray-700 dark:text-gray-300">Вы получите уведомление в Telegram и на email, а статус проекта изменится на "Одобрено".</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Что делать, если не приходит платежка?</h4>
                <p className="text-gray-700 dark:text-gray-300">Проверьте папку "Спам" на почте и сообщения от Telegram-бота. Если письма нет — обратитесь в поддержку.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Как связаться с поддержкой?</h4>
                <p className="text-gray-700 dark:text-gray-300">Внизу страницы есть чат поддержки, либо напишите на <a href="mailto:support@get2b.ru" className="text-blue-600 underline">support@get2b.ru</a>.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Как работает Telegram бот для аккредитации?</h4>
                <p className="text-gray-700 dark:text-gray-300">Найдите бота @get2b_chathub_bot, отправьте /start, и вы будете получать уведомления о новых заявках на аккредитацию с возможностью быстрого одобрения/отклонения.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Можно ли одобрять заявки на аккредитацию через Telegram?</h4>
                <p className="text-gray-700 dark:text-gray-300">Да! Используйте команды /accredit_approve ID или кнопки в уведомлениях для быстрого одобрения заявок на аккредитацию.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Как редактировать поставщиков в синей комнате?</h4>
                <p className="text-gray-700 dark:text-gray-300">Найдите поставщика в разделе "Ваши поставщики", нажмите кнопку "✏️ Редактировать" и внесите необходимые изменения. Вы можете обновить данные, загрузить новый логотип и изменить любую информацию о поставщике.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Какие форматы логотипов поддерживаются?</h4>
                <p className="text-gray-700 dark:text-gray-300">Поддерживаются форматы: JPEG, PNG, WebP, SVG. Максимальный размер файла: 5MB. Рекомендуется использовать квадратные изображения для лучшего отображения.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">В чем разница между синей комнатой и каталогом Get2B?</h4>
                <p className="text-gray-700 dark:text-gray-300">Синяя комната - ваши личные поставщики с возможностью редактирования. Каталог Get2B - аккредитованные поставщики с AI-рекомендациями, которых можно копировать в синюю комнату.</p>
              </div>
            </div>
          </section>

          {/* Типичные ошибки и как их избежать */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Типичные ошибки и как их избежать ⚠️</h2>
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
              <li><b>Ошибка загрузки документов:</b> Убедитесь, что файл не превышает 10 МБ и имеет допустимый формат (PDF, JPG, PNG).</li>
              <li><b>Не проходит оплата:</b> Проверьте правильность реквизитов и наличие средств на счёте. Если проблема не решается — обратитесь в банк или поддержку.</li>
              <li><b>Проект не отображается в списке:</b> Обновите страницу, проверьте фильтры и статус. Если не помогло — выйдите и войдите снова.</li>
              <li><b>Не приходят уведомления:</b> Проверьте настройки Telegram-бота и email, разрешите уведомления для приложения.</li>
              <li><b>Telegram бот не отвечает:</b> Убедитесь, что вы нашли правильного бота @get2b_chathub_bot и отправили команду /start.</li>
              <li><b>Не получаете уведомления об аккредитации:</b> Проверьте, что webhook настроен корректно и бот активен.</li>
              <li><b>Случайно удалили проект:</b> Восстановление возможно только через поддержку — напишите нам как можно скорее.</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-medium mb-2 text-blue-700 dark:text-blue-300">Нужна дополнительная помощь?</h3>
          <p className="text-gray-700 dark:text-gray-300">
            Если у вас возникли вопросы или вам требуется дополнительная помощь, вы всегда можете обратиться к нашей
            службе поддержки через раздел "Чат с ИИ ассистентом" или по электронной почте support@get2b.com.
          </p>
        </div>
      </div>
    </div>
  )
}
