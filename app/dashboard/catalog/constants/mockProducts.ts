/**
 * Моковые данные товаров для демонстрации
 * Вынесено из page.tsx (строки 1355-1398)
 * Безопасно для выноса - никаких зависимостей
 */

export interface MockProduct {
  id: number
  name: string
  price: string
  description: string
  category: string
  stock: number
  specifications: Record<string, any>
}

export const ALL_PRODUCTS: MockProduct[] = [
  {
    id: 1,
    name: 'Смартфон Samsung Galaxy S24',
    price: '$899',
    description: 'Флагманский смартфон с AI-функциями',
    category: 'Электроника',
    stock: 150,
    specifications: {
      screen: '6.2"',
      memory: '256GB',
      camera: '50MP',
      battery: '4000mAh'
    }
  },
  {
    id: 2,
    name: 'Беспроводные наушники AirPods Pro',
    price: '$249',
    description: 'Премиальные TWS наушники с шумоподавлением',
    category: 'Электроника',
    stock: 85,
    specifications: {
      battery: '6h+24h',
      bluetooth: '5.3',
      weight: '56g',
      anc: 'Активное'
    }
  },
  {
    id: 3,
    name: 'Умные часы Apple Watch Series 9',
    price: '$399',
    description: 'Продвинутые смарт-часы для здоровья и фитнеса',
    category: 'Электроника',
    stock: 45,
    specifications: {
      display: '45mm',
      waterproof: '50m',
      battery: '18h',
      sensors: 'ЭКГ, SpO2'
    }
  },
  {
    id: 4,
    name: 'Портативное зарядное Anker 20K',
    price: '$49',
    description: 'Быстрая зарядка для всех устройств',
    category: 'Электроника',
    stock: 200,
    specifications: {
      capacity: '20000mAh',
      ports: '2 USB-C + 1 USB-A',
      weight: '490g',
      fastcharge: '22.5W'
    }
  },
  {
    id: 5,
    name: 'Bluetooth колонка JBL Charge 5',
    price: '$129',
    description: 'Мощная портативная колонка с защитой IP67',
    category: 'Электроника',
    stock: 120,
    specifications: {
      power: '40W',
      waterproof: 'IP67',
      battery: '20h',
      bluetooth: '5.1'
    }
  },
  {
    id: 6,
    name: 'Игровая мышь Logitech G Pro X',
    price: '$79',
    description: 'Профессиональная беспроводная игровая мышь',
    category: 'Электроника',
    stock: 95,
    specifications: {
      dpi: '25600',
      buttons: '8',
      weight: '63g',
      battery: '70h'
    }
  },
  {
    id: 7,
    name: 'Клавиатура механическая Keychron K8',
    price: '$89',
    description: 'Беспроводная механическая клавиатура',
    category: 'Электроника',
    stock: 75,
    specifications: {
      switches: 'Cherry MX',
      battery: '240h',
      backlight: 'RGB',
      layout: 'TKL'
    }
  },
  {
    id: 8,
    name: 'Веб-камера Logitech C920',
    price: '$69',
    description: 'Full HD веб-камера для стриминга',
    category: 'Электроника',
    stock: 30,
    specifications: {
      resolution: '1080p 30fps',
      microphone: 'Стерео',
      autofocus: 'Да',
      fov: '78°'
    }
  },
  {
    id: 9,
    name: 'SSD накопитель Samsung 980 PRO 1TB',
    price: '$149',
    description: 'Высокоскоростной NVMe SSD',
    category: 'Электроника',
    stock: 180,
    specifications: {
      capacity: '1TB',
      interface: 'PCIe 4.0',
      read: '7000 MB/s',
      write: '5000 MB/s'
    }
  },
  {
    id: 10,
    name: 'Монитор ASUS ProArt 27"',
    price: '$449',
    description: 'Профессиональный 4K монитор',
    category: 'Электроника',
    stock: 25,
    specifications: {
      size: '27"',
      resolution: '4K UHD',
      panel: 'IPS',
      refresh: '60Hz'
    }
  },
  {
    id: 11,
    name: 'Роутер Wi-Fi 6 ASUS AX6000',
    price: '$299',
    description: 'Игровой роутер с Wi-Fi 6',
    category: 'Электроника',
    stock: 60,
    specifications: {
      standard: 'Wi-Fi 6',
      speed: '6000 Mbps',
      ports: '8x Gigabit',
      coverage: '5000 кв.ф'
    }
  },
  {
    id: 12,
    name: 'Планшет iPad Air 5-го поколения',
    price: '$599',
    description: 'Мощный планшет с процессором M1',
    category: 'Электроника',
    stock: 40,
    specifications: {
      screen: '10.9"',
      chip: 'Apple M1',
      storage: '256GB',
      camera: '12MP'
    }
  },
  {
    id: 13,
    name: 'Наушники Sony WH-1000XM5',
    price: '$399',
    description: 'Флагманские наушники с шумоподавлением',
    category: 'Электроника',
    stock: 90,
    specifications: {
      anc: 'Адаптивное',
      battery: '30h',
      drivers: '30mm',
      weight: '250g'
    }
  },
  {
    id: 14,
    name: 'Смарт-TV Samsung 55" QLED',
    price: '$899',
    description: 'Премиальный QLED телевизор',
    category: 'Электроника',
    stock: 15,
    specifications: {
      size: '55"',
      resolution: '4K',
      hdr: 'HDR10+',
      os: 'Tizen'
    }
  },
  {
    id: 15,
    name: 'Консоль PlayStation 5',
    price: '$499',
    description: 'Игровая консоль нового поколения',
    category: 'Электроника',
    stock: 8,
    specifications: {
      cpu: 'AMD Zen 2',
      gpu: 'RDNA 2',
      storage: '825GB SSD',
      ray_tracing: 'Да'
    }
  },
  {
    id: 16,
    name: 'Фитнес-браслет Xiaomi Band 8',
    price: '$39',
    description: 'Доступный фитнес-трекер',
    category: 'Электроника',
    stock: 300,
    specifications: {
      display: '1.62"',
      battery: '16 дней',
      waterproof: '5ATM',
      sensors: 'SpO2, Пульс'
    }
  },
  {
    id: 17,
    name: 'Дрон DJI Mini 3',
    price: '$759',
    description: 'Компактный дрон с 4K камерой',
    category: 'Электроника',
    stock: 12,
    specifications: {
      camera: '4K/60fps',
      flight_time: '38 мин',
      weight: '249g',
      range: '10км'
    }
  },
  {
    id: 18,
    name: 'Принтер HP LaserJet Pro',
    price: '$199',
    description: 'Лазерный принтер для офиса',
    category: 'Электроника',
    stock: 55,
    specifications: {
      type: 'Лазерный ЧБ',
      speed: '23 стр/мин',
      duplex: 'Авто',
      connectivity: 'Wi-Fi, USB'
    }
  }
]

// Вспомогательные функции для работы с моковыми данными
export const getMockProductById = (id: number): MockProduct | undefined => {
  return ALL_PRODUCTS.find(product => product.id === id)
}

export const getMockProductsByCategory = (category: string): MockProduct[] => {
  return ALL_PRODUCTS.filter(product => product.category === category)
}

export const getMockProductsPaginated = (page: number, perPage: number): {
  products: MockProduct[]
  totalPages: number
  currentPage: number
} => {
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  const products = ALL_PRODUCTS.slice(startIndex, endIndex)
  const totalPages = Math.ceil(ALL_PRODUCTS.length / perPage)

  return {
    products,
    totalPages,
    currentPage: page
  }
}