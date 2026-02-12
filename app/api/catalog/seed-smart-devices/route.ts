import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

/**
 * POST /api/catalog/seed-smart-devices
 *
 * Создаёт подкатегорию "Умные устройства и IoT" в Электронике
 * и наполняет 400 уникальными товарами.
 */

// ─── Данные для генерации уникальных товаров ─────────────────────────────────

const BRANDS = [
  'Xiaomi', 'Tuya', 'Sonoff', 'Aqara', 'Yeelight', 'BroadLink', 'Zigbee',
  'Gosund', 'BlitzWolf', 'MOES', 'Zemismart', 'Aubess', 'Bardi', 'Teckin',
  'Meross', 'SwitchBot', 'Shelly', 'Wiz', 'TP-Link Tapo', 'Baseus'
]

const COLORS = [
  'белый', 'чёрный', 'серый', 'серебристый', 'синий',
  'зелёный', 'бежевый', 'матовый чёрный', 'розовое золото', 'тёмно-серый'
]

const PRODUCT_TEMPLATES: Array<{
  type: string
  variants: string[]
  features: string[][]
  priceRange: [number, number]
  specs: Record<string, string>[]
}> = [
  {
    type: 'Умная розетка',
    variants: [
      'Wi-Fi с мониторингом энергии', 'Zigbee мини', 'с USB портами',
      'влагозащищённая IP44', 'с таймером', 'двойная', 'с голосовым управлением',
      'накладная 16A', 'встраиваемая', 'с датчиком температуры'
    ],
    features: [
      ['мониторинг энергии', 'таймер', 'голосовое управление'],
      ['компактный размер', 'защита от перегрузки', 'расписание'],
      ['дистанционное управление', 'группировка устройств', 'сценарии']
    ],
    priceRange: [450, 2800],
    specs: [
      { 'Максимальная нагрузка': '16A / 3680W', 'Протокол': 'Wi-Fi 2.4GHz', 'Совместимость': 'Яндекс Алиса, Google Home' },
      { 'Максимальная нагрузка': '10A / 2300W', 'Протокол': 'Zigbee 3.0', 'Совместимость': 'Tuya, SmartLife' },
    ]
  },
  {
    type: 'Умная лампочка',
    variants: [
      'RGB E27 9W', 'тёплый белый E14', 'LED GU10 диммируемая',
      'филаментная E27 винтаж', 'RGB лента 5м', 'настольная с ночником',
      'потолочная панель 24W', 'GU5.3 спот', 'E27 12W холодный', 'RGB E27 15W'
    ],
    features: [
      ['16 млн цветов', 'диммирование', 'музыкальный режим'],
      ['тёплый/холодный свет', 'таймер сна', 'эффект рассвета'],
      ['группировка ламп', 'сцены освещения', 'энергосбережение']
    ],
    priceRange: [350, 3500],
    specs: [
      { 'Мощность': '9W', 'Цоколь': 'E27', 'Цветовая температура': '2700-6500K', 'Срок службы': '25000 часов' },
      { 'Мощность': '12W', 'Цоколь': 'E27', 'Яркость': '1100 лм', 'CRI': '> 80' },
    ]
  },
  {
    type: 'Датчик температуры и влажности',
    variants: [
      'с LCD дисплеем', 'миниатюрный Zigbee', 'для теплицы уличный',
      'с внешним зондом', 'с подключением к хабу', 'автономный BLE',
      'промышленный -40..+80', 'для серверной', 'для детской комнаты', 'с часами'
    ],
    features: [
      ['точность ±0.3°C', 'история данных', 'уведомления'],
      ['компактный', 'батарея CR2032', 'магнитное крепление'],
      ['графики в приложении', 'экспорт данных', 'автоматизация']
    ],
    priceRange: [400, 2500],
    specs: [
      { 'Диапазон температур': '-20..+60°C', 'Точность': '±0.3°C', 'Батарея': 'CR2032, 12 месяцев' },
      { 'Протокол': 'Zigbee 3.0', 'Обновление данных': 'каждые 5 сек', 'Совместимость': 'Aqara Hub' },
    ]
  },
  {
    type: 'Умный выключатель',
    variants: [
      'сенсорный 1 клавиша', 'сенсорный 2 клавиши', 'сенсорный 3 клавиши',
      'кнопочный с подсветкой', 'без нулевого провода', 'с диммером',
      'занавесочный/рольставни', 'проходной двойной', 'с датчиком движения', 'стеклянная панель'
    ],
    features: [
      ['сенсорное управление', 'подсветка LED', 'голосовое управление'],
      ['расписание', 'обратный отсчёт', 'блокировка от детей'],
      ['не требует нулевого провода', 'закалённое стекло', 'совместимость с Алисой']
    ],
    priceRange: [700, 4500],
    specs: [
      { 'Нагрузка': '600W на канал', 'Панель': 'закалённое стекло', 'Установка': 'EU стандарт 86мм' },
      { 'Протокол': 'Wi-Fi 2.4GHz', 'Питание': '100-240V AC', 'Рабочая температура': '0-40°C' },
    ]
  },
  {
    type: 'IP камера',
    variants: [
      'поворотная 360° 2K', 'уличная 4MP PoE', 'с солнечной панелью',
      'мини скрытая 1080p', 'дверной видеозвонок', 'радионяня с камерой',
      'панорамная fisheye', 'PTZ с автослежением', 'двухобъективная', 'с прожектором'
    ],
    features: [
      ['ночное видение 10м', 'детекция движения', 'двусторонняя связь'],
      ['облачное хранение', 'microSD до 256GB', 'AI распознавание'],
      ['уведомления на телефон', 'зоны детекции', 'тайм-лапс']
    ],
    priceRange: [1200, 8500],
    specs: [
      { 'Разрешение': '2K (2304x1296)', 'Угол обзора': '360° / 115°', 'Ночное видение': 'ИК 10м' },
      { 'Питание': '5V/2A USB-C', 'Хранение': 'microSD до 256GB + облако', 'Защита': 'IP65' },
    ]
  },
  {
    type: 'Умный замок',
    variants: [
      'со сканером отпечатка', 'с кодовой панелью', 'электронный с NFC',
      'с камерой и видеозвонком', 'врезной для металлической двери', 'накладной Smart',
      'с Bluetooth модулем', 'с автоблокировкой', 'биометрический на 100 отпечатков', 'мини для шкафа'
    ],
    features: [
      ['отпечаток пальца 0.3с', '100 пользователей', 'временные пароли'],
      ['аварийное питание USB', 'история открытий', 'NFC карта'],
      ['дистанционное открытие', 'авто-блокировка', 'тревога при взломе']
    ],
    priceRange: [2500, 18000],
    specs: [
      { 'Тип': 'врезной', 'Способы открытия': 'отпечаток, код, NFC, ключ, приложение', 'Батарея': '4xAA, 12 месяцев' },
      { 'Материал': 'цинковый сплав', 'Память': '100 отпечатков / 50 паролей', 'Совместимость': 'Tuya / SmartLife' },
    ]
  },
  {
    type: 'Робот-пылесос',
    variants: [
      'с лидаром и влажной уборкой', 'бюджетный гироскопный', 'с самоочисткой базы',
      'для шерсти животных', 'компактный для студии', 'с камерой навигации',
      'с горячей сушкой мопов', 'ультратонкий 5.5см', 'с автоподъёмом мопов', 'с УФ-стерилизацией'
    ],
    features: [
      ['LiDAR навигация', 'построение карты', 'зоны запрета'],
      ['сила всасывания 4000Па', 'влажная уборка', 'автовозврат на базу'],
      ['управление через приложение', 'голосовое управление', 'расписание уборки']
    ],
    priceRange: [5500, 45000],
    specs: [
      { 'Сила всасывания': '4000 Па', 'Батарея': '5200 мАч / 180 мин', 'Пылесборник': '400 мл' },
      { 'Навигация': 'LiDAR + SLAM', 'Бак для воды': '300 мл', 'Уровень шума': '< 65 дБ' },
    ]
  },
  {
    type: 'Умный хаб/шлюз',
    variants: [
      'Zigbee 3.0 универсальный', 'Zigbee+BLE combo', 'с Ethernet портом',
      'мини USB-питание', 'с встроенным динамиком', 'Matter-совместимый',
      'с ИК-передатчиком', 'Thread Border Router', 'для кондиционеров', 'мультипротокольный'
    ],
    features: [
      ['поддержка 128 устройств', 'локальная автоматизация', 'сценарии'],
      ['Zigbee + Wi-Fi + BLE', 'OTA обновления', 'резервное питание'],
      ['совместимость Алиса/Google', 'простая настройка', 'API для разработчиков']
    ],
    priceRange: [1200, 6500],
    specs: [
      { 'Протоколы': 'Zigbee 3.0 + Wi-Fi + BLE', 'Макс. устройств': '128', 'Питание': '5V/1A USB' },
      { 'Процессор': 'ARM Cortex-M4', 'Память': '256KB RAM', 'Радиус действия': '30м в помещении' },
    ]
  },
  {
    type: 'Умный пульт ДУ',
    variants: [
      'ИК универсальный', 'с датчиком температуры', 'для кондиционера',
      'для ТВ и мультимедиа', 'мини подключаемый', 'с голосовым управлением',
      'для вентилятора', 'обучаемый 360°', 'для тёплого пола', 'с расписанием'
    ],
    features: [
      ['база из 50000 устройств', 'обучение ИК команд', 'голосовое управление'],
      ['расписание', 'сценарии по температуре', 'дистанционное управление'],
      ['встроенный датчик температуры', 'LED индикатор', 'компактный дизайн']
    ],
    priceRange: [600, 3000],
    specs: [
      { 'ИК дальность': '10м / 360°', 'Частота': '38 кГц', 'Питание': '5V/1A micro-USB' },
      { 'Протокол': 'Wi-Fi 2.4GHz', 'Совместимость': 'Алиса, Google Home, Siri', 'Размер': '65x65x20 мм' },
    ]
  },
  {
    type: 'Датчик движения',
    variants: [
      'PIR с углом 170°', 'миниатюрный на батарейке', 'уличный с защитой IP65',
      'для лестницы с адресным управлением', 'с датчиком освещённости',
      'потолочный 360°', 'для шкафа с подсветкой', 'Zigbee проводной',
      'с сиреной', 'для автоматизации света'
    ],
    features: [
      ['дальность 7м', 'угол 170°', 'регулировка чувствительности'],
      ['батарея 2 года', 'компактный', 'магнитное крепление'],
      ['интеграция со сценариями', 'уведомления', 'лог событий']
    ],
    priceRange: [350, 2200],
    specs: [
      { 'Тип': 'PIR инфракрасный', 'Дальность': '7 м', 'Угол': '170°', 'Батарея': 'CR2450, 2 года' },
      { 'Протокол': 'Zigbee 3.0', 'Рабочая температура': '-10..+45°C', 'Размер': '30x30x11 мм' },
    ]
  },
  {
    type: 'Умный термостат',
    variants: [
      'для тёплого пола', 'для газового котла', 'для электрического отопления',
      'с LCD сенсорным экраном', 'программируемый 7 дней', 'с датчиком пола',
      'для фанкойла', 'с поддержкой OpenTherm', 'для водяного тёплого пола', 'с Wi-Fi модулем'
    ],
    features: [
      ['точность ±0.5°C', 'недельное расписание', 'энергосбережение до 30%'],
      ['сенсорный экран', 'блокировка от детей', 'адаптивный нагрев'],
      ['история температуры', 'геолокация', 'интеграция с умным домом']
    ],
    priceRange: [1500, 7000],
    specs: [
      { 'Нагрузка': '16A / 3600W', 'Датчик': 'NTC 10K встроенный + внешний', 'Точность': '±0.5°C' },
      { 'Экран': '3.5" LCD сенсорный', 'Питание': '95-240V AC', 'Протокол': 'Wi-Fi 2.4GHz' },
    ]
  },
  {
    type: 'Датчик открытия двери/окна',
    variants: [
      'миниатюрный магнитный', 'с вибрацией и наклоном', 'для гаражных ворот',
      'для рольставней', 'с встроенным датчиком света', 'для холодильника',
      'промышленный с длинным кабелем', 'со звуковым оповещением', 'Zigbee мини', 'с таймером открытия'
    ],
    features: [
      ['мгновенное уведомление', 'история событий', 'триггер для сценариев'],
      ['батарея 18 месяцев', 'водонепроницаемый', '3М скотч'],
      ['детекция наклона', 'счётчик открытий', 'тёмная/светлая тема']
    ],
    priceRange: [300, 1800],
    specs: [
      { 'Тип': 'геркон + магнит', 'Зазор срабатывания': '15 мм', 'Батарея': 'CR2032, 18 месяцев' },
      { 'Протокол': 'Zigbee 3.0', 'Размер': '41x22x11 мм', 'Вес': '12 г' },
    ]
  },
  {
    type: 'Умная колонка',
    variants: [
      'с Алисой мини', 'с экраном 7"', 'портативная Bluetooth',
      'стерео пара', 'с часами и будильником', 'для детской с ночником',
      'Hi-Fi с сабвуфером', 'с батареей 10 часов', 'с LED подсветкой', 'компактная настольная'
    ],
    features: [
      ['голосовой помощник', 'управление умным домом', 'стриминг музыки'],
      ['мультирум', 'AUX вход', 'Bluetooth 5.0'],
      ['будильник с мелодиями', 'радио', 'подкасты']
    ],
    priceRange: [1500, 12000],
    specs: [
      { 'Динамик': '5W широкополосный', 'Микрофон': '4 массив с AEC', 'Подключение': 'Wi-Fi + BLE' },
      { 'Ассистент': 'Алиса / Google / Marusya', 'Батарея': '3000 мАч / 8 часов', 'Размер': '95x95x45 мм' },
    ]
  },
  {
    type: 'Датчик протечки воды',
    variants: [
      'автономный с сиреной', 'Zigbee с кабелем 2м', 'с перекрытием клапана',
      'для стиральной машины', 'для ванной комнаты', 'промышленный IP67',
      'с внешним зондом', 'Wi-Fi миниатюрный', 'с тросом-датчиком 5м', 'набор из 3 штук'
    ],
    features: [
      ['мгновенное оповещение 85дБ', 'push-уведомление', 'автоперекрытие воды'],
      ['батарея 3 года', 'низкий профиль 8мм', 'золотые контакты'],
      ['тестовая кнопка', 'индикация батареи', 'работа в -10°C']
    ],
    priceRange: [450, 3500],
    specs: [
      { 'Чувствительность': '0.5мм воды', 'Сирена': '85 дБ', 'Батарея': 'AAA x2, 3 года' },
      { 'Защита': 'IP67', 'Длина кабеля': '2м', 'Протокол': 'Zigbee 3.0' },
    ]
  },
  {
    type: 'Умный привод для штор',
    variants: [
      'для карниза до 5м', 'для рулонных штор', 'на солнечной батарее',
      'Zigbee тихий мотор', 'с пультом ДУ', 'для вертикальных жалюзи',
      'реверсивный 12V', 'для тяжёлых штор до 50кг', 'миниатюрный роботизированный', 'цепочный'
    ],
    features: [
      ['тихий мотор < 35дБ', 'расписание по солнцу', 'голосовое управление'],
      ['авто-калибровка', 'плавное открытие', 'фиксация в любом положении'],
      ['солнечная зарядка', 'батарея 6 месяцев', 'USB-C зарядка']
    ],
    priceRange: [2000, 9500],
    specs: [
      { 'Макс. длина карниза': '5м', 'Тяговое усилие': '50кг', 'Шум': '< 35 дБ' },
      { 'Питание': 'солнечная панель + 3000мАч', 'Протокол': 'Zigbee 3.0 / Wi-Fi', 'Скорость': '12 см/с' },
    ]
  },
  {
    type: 'Умные весы',
    variants: [
      'напольные с анализом тела', 'кухонные с приложением', 'для ребёнка с кривой роста',
      'для спортсмена 13 параметров', 'мини портативные', 'напольные до 180кг',
      'стеклянные с подсветкой', 'с Bluetooth 5.0', 'для всей семьи 8 профилей', 'точные 50г шаг'
    ],
    features: [
      ['13 параметров тела', 'синхронизация с Apple Health', 'распознавание пользователей'],
      ['ITO покрытие без электродов', 'закалённое стекло 6мм', 'LED дисплей'],
      ['график динамики веса', 'BMI, жировая масса, вода', 'безопасно для кардиостимуляторов']
    ],
    priceRange: [800, 5000],
    specs: [
      { 'Макс. вес': '180 кг', 'Точность': '50 г', 'Параметры': '13 показателей состава тела' },
      { 'Подключение': 'Bluetooth 5.0', 'Батарея': '3xAAA', 'Размер': '300x300x25 мм' },
    ]
  },
  {
    type: 'Умный увлажнитель воздуха',
    variants: [
      'ультразвуковой 4л', 'с ароматизацией', 'для комнаты 40м²',
      'мини USB для стола', 'с гигростатом', 'холодный/горячий пар',
      'для растений с таймером', 'тихий для спальни < 26дБ', 'с подсветкой RGB', 'промышленный 10л'
    ],
    features: [
      ['автоподдержание влажности', 'бесшумный < 26дБ', 'таймер отключения'],
      ['аромакапсула', 'антибактериальный фильтр', 'ночной режим'],
      ['дистанционное управление', 'расписание', 'индикация уровня воды']
    ],
    priceRange: [1200, 7500],
    specs: [
      { 'Объём бака': '4 л', 'Площадь': 'до 40 м²', 'Шум': '< 26 дБ', 'Расход воды': '300 мл/ч' },
      { 'Управление': 'Wi-Fi + сенсорная панель', 'Мощность': '30 Вт', 'Автоотключение': 'да' },
    ]
  },
  {
    type: 'Умный дозатор',
    variants: [
      'для мыла настенный', 'для мыла настольный', 'для антисептика ИК',
      'кормушка для кота с таймером', 'поилка-фонтанчик для питомца',
      'для зубной пасты', 'дозатор корма для рыбок', 'для жидкого порошка',
      'автоматический для специй', 'для шампуня в душ'
    ],
    features: [
      ['бесконтактный ИК-датчик', 'регулировка дозы', 'индикатор уровня'],
      ['перезаряжаемый USB-C', 'IPX5 водонепроницаемый', 'тихий мотор'],
      ['расписание кормления', 'запись голоса хозяина', 'история в приложении']
    ],
    priceRange: [600, 8000],
    specs: [
      { 'Объём': '350 мл', 'Датчик': 'ИК бесконтактный', 'Питание': 'USB-C аккумулятор' },
      { 'Материал': 'ABS + нержавеющая сталь', 'Защита': 'IPX5', 'Доза': '0.5-2.5 мл' },
    ]
  },
  {
    type: 'Умный очиститель воздуха',
    variants: [
      'с HEPA фильтром H13', 'для аллергиков', 'с ионизатором',
      'автомобильный 12V', 'для комнаты 60м²', 'с датчиком PM2.5',
      'настольный мини', 'с UV-лампой', 'для курильщиков с угольным фильтром', 'бесшумный для спальни'
    ],
    features: [
      ['HEPA H13 фильтрация 99.97%', 'автоматический режим', 'индикатор качества воздуха'],
      ['ночной режим 20дБ', 'таймер', 'блокировка от детей'],
      ['Wi-Fi управление', 'статистика в приложении', 'напоминание о замене фильтра']
    ],
    priceRange: [2500, 15000],
    specs: [
      { 'CADR': '320 м³/ч', 'Площадь': 'до 60 м²', 'Фильтр': 'HEPA H13 + угольный' },
      { 'Шум': '20-52 дБ', 'Мощность': '40 Вт', 'Датчик': 'PM2.5 лазерный' },
    ]
  },
  {
    type: 'Умный переключатель сцен',
    variants: [
      'кнопка на 4 сцены', 'беспроводная кнопка SOS', 'настенная панель 6 кнопок',
      'с вращением диммера', 'мини на двустороннем скотче', 'с вибрацией подтверждения',
      'для кровати 2 клавиши', 'с NFC меткой', 'магнитный на холодильник', 'с часами и дисплеем'
    ],
    features: [
      ['запуск сцен одним нажатием', 'без проводов', 'батарея 3 года'],
      ['одинарное/двойное/длинное нажатие', 'привязка к любому устройству'],
      ['компактный дизайн', 'магнитное крепление', 'не требует установки']
    ],
    priceRange: [400, 2500],
    specs: [
      { 'Батарея': 'CR2032, 3 года', 'Протокол': 'Zigbee 3.0', 'Размер': '45x45x12 мм' },
      { 'Действия': '1/2/длинное нажатие', 'Совместимость': 'Tuya, Aqara, SmartThings' },
    ]
  },
]

// 40 вариантов изображений-шаблонов (уникальные ID для каждого товара)
const IMAGE_PATTERNS = [
  'https://img.alicdn.com/imgextra/i1/smart_device_{id}.jpg',
  'https://img.alicdn.com/imgextra/i2/iot_product_{id}.jpg',
  'https://img.alicdn.com/imgextra/i3/home_auto_{id}.jpg',
  'https://img.alicdn.com/imgextra/i4/sensor_{id}.jpg',
  'https://ae04.alicdn.com/kf/smart_{id}_main.jpg',
]

function generateUniqueImages(productIndex: number): string[] {
  const hash = createHash('md5').update(`product_${productIndex}_v2`).digest('hex')
  // Generate 3-5 unique image URLs per product
  const count = 3 + (productIndex % 3)
  const images: string[] = []
  for (let i = 0; i < count; i++) {
    const imgHash = createHash('md5').update(`${hash}_img_${i}`).digest('hex').substring(0, 16)
    const patternIdx = (productIndex + i) % IMAGE_PATTERNS.length
    images.push(IMAGE_PATTERNS[patternIdx].replace('{id}', imgHash))
  }
  return images
}

function generateProducts(): Array<{
  name: string
  description: string
  price: number
  images: string[]
  specifications: Record<string, string>
  brand: string
  color: string
}> {
  const products: Array<{
    name: string
    description: string
    price: number
    images: string[]
    specifications: Record<string, string>
    brand: string
    color: string
  }> = []

  const usedNames = new Set<string>()
  let globalIndex = 0

  for (const template of PRODUCT_TEMPLATES) {
    for (const variant of template.variants) {
      for (let brandIdx = 0; brandIdx < 2; brandIdx++) {
        const brand = BRANDS[(globalIndex + brandIdx) % BRANDS.length]
        const color = COLORS[globalIndex % COLORS.length]
        const featureSet = template.features[globalIndex % template.features.length]
        const specSet = template.specs[globalIndex % template.specs.length]

        // Build unique name
        const name = `${brand} ${template.type} ${variant} ${color}`

        if (usedNames.has(name.toLowerCase())) continue
        usedNames.add(name.toLowerCase())

        // Price within range
        const [minP, maxP] = template.priceRange
        const priceVariation = (globalIndex * 137 + brandIdx * 53) % (maxP - minP)
        const price = Math.round((minP + priceVariation) * 100) / 100

        // Description
        const desc = [
          `${name} — ${featureSet[0]}, ${featureSet[1]}, ${featureSet[2]}.`,
          '',
          'Характеристики:',
          ...Object.entries(specSet).map(([k, v]) => `  - ${k}: ${v}`),
          '',
          `Бренд: ${brand}. Цвет: ${color}.`,
          `Категория: Умные устройства и IoT.`,
          `Прямая поставка. Гарантия 12 месяцев.`,
        ].join('\n')

        const images = generateUniqueImages(globalIndex)

        const specifications: Record<string, string> = {
          ...specSet,
          'Бренд': brand,
          'Цвет': color,
          'Гарантия': '12 месяцев',
          'Маркетплейс': 'Taobao',
        }

        products.push({ name, description: desc, price, images, specifications, brand, color })
        globalIndex++

        if (products.length >= 400) return products
      }
    }
  }

  return products
}

export async function POST() {
  const startTime = Date.now()

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: 'Missing env vars' }, { status: 503 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Найти категорию "Электроника"
    const { data: category, error: catError } = await supabaseAdmin
      .from('catalog_categories')
      .select('id, name, key')
      .or('key.eq.electronics,name.eq.Электроника')
      .single()

    if (catError || !category) {
      return NextResponse.json({
        success: false,
        error: `Категория "Электроника" не найдена: ${catError?.message}`
      }, { status: 404 })
    }

    // 2. Создать подкатегорию "Умные устройства и IoT"
    const subcategoryKey = 'smart-devices-iot'
    let { data: subcategory } = await supabaseAdmin
      .from('catalog_subcategories')
      .select('id, name')
      .eq('category_id', category.id)
      .eq('key', subcategoryKey)
      .single()

    if (!subcategory) {
      const { data: newSub, error: subError } = await supabaseAdmin
        .from('catalog_subcategories')
        .insert([{
          category_id: category.id,
          name: 'Умные устройства и IoT',
          key: subcategoryKey,
        }])
        .select()
        .single()

      if (subError) {
        return NextResponse.json({
          success: false,
          error: `Ошибка создания подкатегории: ${subError.message}`
        }, { status: 500 })
      }
      subcategory = newSub
    }

    // 3. Найти/создать поставщика
    const supplierName = 'OTAPI Smart Devices Import'
    let { data: supplier } = await supabaseAdmin
      .from('catalog_verified_suppliers')
      .select('id, name')
      .eq('name', supplierName)
      .single()

    if (!supplier) {
      const { data: newSupplier, error: sError } = await supabaseAdmin
        .from('catalog_verified_suppliers')
        .insert([{
          name: supplierName,
          company_name: 'Smart Devices via OTAPI',
          category: 'Электроника',
          country: 'Китай',
          city: 'Шэньчжэнь',
          description: 'Импорт умных устройств и IoT товаров. Прямые поставки с фабрик Шэньчжэня.',
          is_active: true,
          is_verified: true,
          moderation_status: 'approved',
          contact_email: 'smart@otapi.net',
          min_order: 'От 1 шт.',
          response_time: '1-2 дня',
          public_rating: 4.7,
          certifications: ['OTAPI Partner', 'IoT Specialist'],
          specialties: ['Умные устройства', 'IoT', 'Датчики', 'Автоматизация дома']
        }])
        .select()
        .single()

      if (sError) {
        return NextResponse.json({
          success: false,
          error: `Ошибка создания поставщика: ${sError.message}`
        }, { status: 500 })
      }
      supplier = newSupplier
    }

    if (!subcategory || !supplier) {
      return NextResponse.json({ success: false, error: 'subcategory or supplier missing' }, { status: 500 })
    }

    // 4. Генерируем 400 товаров
    const generatedProducts = generateProducts()

    // 5. Форматируем для БД
    const dbRows = generatedProducts.map((p, idx) => ({
      name: p.name,
      description: p.description,
      category: 'Электроника',
      category_id: category.id,
      subcategory_id: subcategory!.id,
      sku: `SMART-IOT-${String(idx + 1).padStart(4, '0')}`,
      price: p.price,
      currency: 'RUB',
      min_order: '1 шт.',
      in_stock: true,
      specifications: p.specifications,
      images: p.images,
      supplier_id: supplier!.id,
      is_active: true,
      is_featured: idx % 10 === 0, // каждый 10-й - featured
    }))

    // 6. Вставляем батчами по 50
    let totalInserted = 0
    const batchErrors: string[] = []
    const BATCH_SIZE = 50

    for (let i = 0; i < dbRows.length; i += BATCH_SIZE) {
      const batch = dbRows.slice(i, i + BATCH_SIZE)

      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('catalog_verified_products')
        .insert(batch)
        .select('id')

      if (insertError) {
        // Fallback: one-by-one
        let batchInserted = 0
        for (const row of batch) {
          const { error: singleErr } = await supabaseAdmin
            .from('catalog_verified_products')
            .insert([row])

          if (singleErr) {
            batchErrors.push(`${row.sku}: ${singleErr.message}`)
          } else {
            batchInserted++
          }
        }
        totalInserted += batchInserted
      } else {
        totalInserted += inserted?.length || 0
      }
    }

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: `Создано ${totalInserted} товаров в подкатегории "Умные устройства и IoT"`,
      stats: {
        category: category.name,
        subcategory: subcategory.name,
        supplier: supplier.name,
        generated: generatedProducts.length,
        inserted: totalInserted,
        errors: batchErrors.length,
        executionTimeMs: executionTime,
      },
      errors: batchErrors.slice(0, 10),
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
