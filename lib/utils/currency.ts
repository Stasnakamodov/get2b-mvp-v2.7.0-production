/**
 * 💱 ВАЛЮТНЫЕ УТИЛИТЫ GET2B
 * Форматирование, конвертация, валидация валют
 */

export const SUPPORTED_CURRENCIES = {
  'USD': { name: 'Доллар США', symbol: '$', flag: '🇺🇸' },
  'EUR': { name: 'Евро', symbol: '€', flag: '🇪🇺' },
  'CNY': { name: 'Китайский юань', symbol: '¥', flag: '🇨🇳' },
  'RUB': { name: 'Российский рубль', symbol: '₽', flag: '🇷🇺' },
  'TRY': { name: 'Турецкая лира', symbol: '₺', flag: '🇹🇷' },
  'AED': { name: 'Дирхам ОАЭ', symbol: 'د.إ', flag: '🇦🇪' },
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

/**
 * 💰 Форматирование суммы с валютой
 */
export function formatCurrency(
  amount: number, 
  currency: SupportedCurrency, 
  locale: string = 'ru-RU'
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  if (!currencyInfo) {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }

  // Для рублей используем встроенное форматирование
  if (currency === 'RUB') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  }

  // Для других валют - кастомное форматирование
  const formattedAmount = amount.toLocaleString(locale, {
    minimumFractionDigits: currency === 'CNY' ? 2 : 2,
    maximumFractionDigits: currency === 'CNY' ? 2 : 2
  });

  return `${currencyInfo.symbol}${formattedAmount}`;
}

/**
 * 🏷️ Форматирование с флагом страны
 */
export function formatCurrencyWithFlag(
  amount: number, 
  currency: SupportedCurrency,
  showFullName: boolean = false
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  if (!currencyInfo) return `${amount} ${currency}`;

  const formatted = formatCurrency(amount, currency);
  const name = showFullName ? ` ${currencyInfo.name}` : '';
  
  return `${currencyInfo.flag} ${formatted}${name}`;
}

/**
 * 📊 Форматирование курса валют
 */
export function formatExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rate: number,
  trend?: 'up' | 'down' | 'stable'
): string {
  const fromInfo = SUPPORTED_CURRENCIES[fromCurrency];
  const toInfo = SUPPORTED_CURRENCIES[toCurrency];
  
  if (!fromInfo || !toInfo) {
    return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
  }

  const trendIcon = trend === 'up' ? ' ▲' : trend === 'down' ? ' ▼' : '';
  const formattedRate = rate.toFixed(4);
  
  return `${fromInfo.flag} 1 ${fromCurrency} = ${formattedRate} ${toInfo.symbol}${trendIcon}`;
}

/**
 * ✅ Валидация валюты
 */
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return currency in SUPPORTED_CURRENCIES;
}

/**
 * 💹 Расчет комиссии Get2B
 */
export function calculateGet2BFee(
  amount: number, 
  currency: SupportedCurrency,
  tier: 'basic' | 'standard' | 'premium' = 'standard'
): { fee: number; feePercent: number; totalAmount: number } {
  const feePercents = {
    basic: 12,    // До 1M
    standard: 10, // 1M - 3M  
    premium: 8    // 3M+
  };

  const feePercent = feePercents[tier];
  const fee = (amount * feePercent) / 100;
  
  return {
    fee,
    feePercent,
    totalAmount: amount + fee
  };
}

/**
 * 📈 Определение тира комиссии по сумме
 */
export function getFeeTier(amount: number, currency: SupportedCurrency): 'basic' | 'standard' | 'premium' {
  // Примерные конверсии в USD для единообразия
  const usdRates: Record<SupportedCurrency, number> = {
    'USD': 1,
    'EUR': 1.1,
    'CNY': 0.14,
    'RUB': 0.011,
    'TRY': 0.033,
    'AED': 0.27
  };

  const amountInUSD = amount * (usdRates[currency] || 1);

  if (amountInUSD >= 30000) return 'premium';   // 3M+ RUB
  if (amountInUSD >= 10000) return 'standard';  // 1M+ RUB  
  return 'basic';                               // До 1M RUB
}

/**
 * 🔢 Парсинг суммы из строки
 */
export function parseAmount(input: string): { amount: number; currency?: SupportedCurrency } {
  // Убираем лишние пробелы и приводим к верхнему регистру
  const cleaned = input.trim().toUpperCase();
  
  // Ищем валюту в конце строки
  let currency: SupportedCurrency | undefined;
  let numberString = cleaned;

  for (const [code, info] of Object.entries(SUPPORTED_CURRENCIES)) {
    if (cleaned.endsWith(code) || cleaned.endsWith(info.symbol)) {
      currency = code as SupportedCurrency;
      numberString = cleaned.replace(new RegExp(`${code}|${info.symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '').trim();
      break;
    }
  }

  // Парсим число, убирая разделители тысяч
  const amount = parseFloat(numberString.replace(/[^\d.,]/g, '').replace(',', '.'));

  return { amount: isNaN(amount) ? 0 : amount, currency };
}

/**
 * 🎯 Получение информации о валюте
 */
export function getCurrencyInfo(currency: SupportedCurrency) {
  return SUPPORTED_CURRENCIES[currency];
}

/**
 * 📋 Список всех поддерживаемых валют
 */
export function getSupportedCurrencies(): Array<{
  code: SupportedCurrency;
  name: string;
  symbol: string;
  flag: string;
}> {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code: code as SupportedCurrency,
    ...info
  }));
} 