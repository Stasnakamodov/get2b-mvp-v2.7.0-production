/**
 * Общая конфигурация приложения
 * Shared layer - самый нижний слой в FSD
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  SUPPLIERS_PER_PAGE: 10,
  PRODUCTS_PER_PAGE: 8,
}

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[0-9\s\-\(\)]+$/,
  URL_REGEX: /^(https?:\/\/)?[\da-z\.-]+\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
}

export const ROUTES = {
  DASHBOARD: '/dashboard',
  CATALOG: '/dashboard/catalog',
  SUPPLIERS: '/dashboard/catalog/suppliers',
  PRODUCTS: '/dashboard/catalog/products',
  CART: '/dashboard/cart',
  PROJECT_CONSTRUCTOR: '/dashboard/project-constructor',
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  CART_ITEMS: 'cart_items',
  USER_PREFERENCES: 'user_preferences',
  SELECTED_ROOM: 'selected_room',
  SELECTED_CATEGORY: 'selected_category',
}