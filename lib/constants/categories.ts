// Единый источник правды для всех категорий в системе
// ВАЖНО: Эти категории должны точно соответствовать категориям в БД

export const SYSTEM_CATEGORIES = [
  "Автотовары",
  "Дом и быт",
  "Здоровье и медицина",
  "Продукты питания",
  "Промышленность",
  "Строительство",
  "Текстиль и одежда",
  "Электроника"
] as const;

export type SystemCategory = typeof SYSTEM_CATEGORIES[number];

// Для обратной совместимости и удобства
export const CATEGORIES_MAP = {
  AUTO: "Автотовары",
  HOME: "Дом и быт",
  HEALTH: "Здоровье и медицина",
  FOOD: "Продукты питания",
  INDUSTRY: "Промышленность",
  CONSTRUCTION: "Строительство",
  TEXTILE: "Текстиль и одежда",
  ELECTRONICS: "Электроника"
} as const;

// Функция валидации категории
export function isValidCategory(category: string): category is SystemCategory {
  return SYSTEM_CATEGORIES.includes(category as SystemCategory);
}

// Эмоджи для категорий (для UI)
export const CATEGORY_ICONS: Record<SystemCategory, string> = {
  "Автотовары": "🚗",
  "Дом и быт": "🏠",
  "Здоровье и медицина": "⚕️",
  "Продукты питания": "🍔",
  "Промышленность": "🏭",
  "Строительство": "🏗️",
  "Текстиль и одежда": "👕",
  "Электроника": "💻"
};