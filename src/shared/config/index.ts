// FSD: shared/config - Конфигурация приложения

// Экспорт всех констант каталога
export * from './catalog.constants'

// Реэкспорт основных констант для удобства
export {
  PRODUCTS_PER_PAGE,
  SUPPLIERS_PER_PAGE,
  SUPPLIER_FORM_STEPS,
  ROOM_TYPES,
  DEFAULT_SUPPLIER_FORM_DATA,
  DEFAULT_PRODUCT_FORM_DATA,
  CATALOG_MODES,
  VIEW_MODES,
  SUPPLIER_MODAL_TABS,
  COUNTRIES,
  CURRENCIES,
  DEFAULT_CURRENCY,
  PAYMENT_METHODS,
  CRYPTO_NETWORKS,
  API_ENDPOINTS,
  toRoman,
  formatPrice,
  formatDate,
  getInitials,
  isValidEmail,
  isValidUrl,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './catalog.constants'