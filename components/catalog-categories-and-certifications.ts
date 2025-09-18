// Категории и сертификаты для каталога поставщиков (релевантно B2B и международной торговле)

import { SYSTEM_CATEGORIES } from '@/lib/constants/categories';

// Экспорт категорий для обратной совместимости
export { SYSTEM_CATEGORIES };

export const CATEGORY_CERTIFICATIONS = [
  {
    category: "Автотовары",
    certifications: [
      "ISO 9001",
      "ISO/TS 16949",
      "CE",
      "EAC",
      "DOT",
      "ECE"
    ]
  },
  {
    category: "Дом и быт",
    certifications: [
      "ISO 9001",
      "CE",
      "RoHS",
      "BSCI",
      "SEDEX"
    ]
  },
  {
    category: "Здоровье и медицина",
    certifications: [
      "CE Medical",
      "FDA",
      "ISO 13485",
      "GMP",
      "MDR",
      "ISO 9001"
    ]
  },
  {
    category: "Продукты питания",
    certifications: [
      "HACCP",
      "ISO 22000",
      "BRC",
      "IFS",
      "Halal",
      "Kosher",
      "ISO 9001",
      "Organic"
    ]
  },
  {
    category: "Промышленность",
    certifications: [
      "CE",
      "ISO 9001",
      "ISO 14001",
      "EAC",
      "TUV",
      "ATEX"
    ]
  },
  {
    category: "Строительство",
    certifications: [
      "CE",
      "ISO 9001",
      "ISO 14001",
      "EAC",
      "GOST",
      "EN"
    ]
  },
  {
    category: "Текстиль и одежда",
    certifications: [
      "OEKO-TEX",
      "BSCI",
      "ISO 9001",
      "SEDEX",
      "GOTS",
      "WRAP",
      "Fair Trade"
    ]
  },
  {
    category: "Электроника",
    certifications: [
      "CE",
      "FCC",
      "RoHS",
      "UL",
      "ISO 9001",
      "CCC",
      "CB"
    ]
  }
]; 