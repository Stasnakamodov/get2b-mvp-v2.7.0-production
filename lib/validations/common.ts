import { z } from 'zod';

// Базовые примитивы
export const UUIDSchema = z.string().uuid('Неверный формат ID');

export const EmailSchema = z.string()
  .email('Неверный формат email адреса')
  .min(1, 'Email не может быть пустым')
  .max(255, 'Email слишком длинный');

export const PhoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Неверный формат телефона')
  .optional();

export const URLSchema = z.string()
  .url('Неверный формат URL')
  .max(2048, 'URL слишком длинный')
  .optional()
  .or(z.literal(''));

export const RequiredURLSchema = z.string()
  .url('Неверный формат URL')
  .max(2048, 'URL слишком длинный');

export const SlugSchema = z.string()
  .regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы')
  .min(3, 'Slug должен содержать минимум 3 символа')
  .max(50, 'Slug слишком длинный');

// Схемы для пагинации
export const PaginationSchema = z.object({
  page: z.number()
    .int('Номер страницы должен быть целым числом')
    .min(1, 'Номер страницы должен быть больше 0')
    .default(1),
  
  limit: z.number()
    .int('Лимит должен быть целым числом')
    .min(1, 'Лимит должен быть больше 0')
    .max(100, 'Максимальный лимит 100 записей')
    .default(20),
  
  offset: z.number()
    .int('Смещение должно быть целым числом')
    .min(0, 'Смещение не может быть отрицательным')
    .optional(),
});

// Схема для сортировки
export const SortingSchema = z.object({
  sort_by: z.string()
    .min(1, 'Поле сортировки не может быть пустым')
    .max(50, 'Название поля слишком длинное')
    .optional(),
  
  sort_order: z.enum(['asc', 'desc', 'ASC', 'DESC'])
    .transform(val => val.toLowerCase())
    .default('desc'),
});

// Схема для поиска
export const SearchSchema = z.object({
  q: z.string()
    .min(1, 'Поисковый запрос не может быть пустым')
    .max(255, 'Поисковый запрос слишком длинный')
    .transform(val => val.trim())
    .optional(),
  
  search_fields: z.array(z.string())
    .max(10, 'Слишком много полей для поиска')
    .optional(),
});

// Схема для фильтрации по датам
export const DateRangeSchema = z.object({
  date_from: z.string()
    .datetime('Неверный формат даты начала')
    .optional(),
  
  date_to: z.string()
    .datetime('Неверный формат даты окончания')
    .optional(),
}).refine(data => {
  if (data.date_from && data.date_to) {
    return new Date(data.date_from) <= new Date(data.date_to);
  }
  return true;
}, {
  message: 'Дата начала должна быть меньше даты окончания',
  path: ['date_to']
});

// Схема для фильтрации по числовому диапазону
export const NumericRangeSchema = z.object({
  min_value: z.number()
    .min(0, 'Минимальное значение не может быть отрицательным')
    .optional(),
  
  max_value: z.number()
    .positive('Максимальное значение должно быть положительным')
    .optional(),
}).refine(data => {
  if (data.min_value !== undefined && data.max_value !== undefined) {
    return data.min_value <= data.max_value;
  }
  return true;
}, {
  message: 'Минимальное значение должно быть меньше максимального',
  path: ['max_value']
});

// Объединенная схема для списочных запросов
export const ListRequestSchema = PaginationSchema
  .merge(SortingSchema)
  .merge(SearchSchema)
  .extend({
    date_from: z.string().datetime('Неверный формат даты начала').optional(),
    date_to: z.string().datetime('Неверный формат даты окончания').optional(),
  })
  .refine(data => {
    if (data.date_from && data.date_to) {
      return new Date(data.date_from) <= new Date(data.date_to);
    }
    return true;
  }, {
    message: 'Дата начала должна быть меньше даты окончания',
    path: ['date_to']
  });

// Схема для ответа с пагинацией
export const PaginatedResponseSchema = <T>(itemSchema: z.ZodType<T>) => 
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      totalPages: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
    filters: z.record(z.string(), z.any()).optional(),
    sorting: z.object({
      field: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional(),
    }).optional(),
  });

// Схема для массовых операций
export const BulkActionSchema = z.object({
  action: z.enum([
    'delete',
    'activate', 
    'deactivate',
    'archive',
    'restore',
    'update',
    'export'
  ]),
  
  ids: z.array(UUIDSchema)
    .min(1, 'Выберите хотя бы одну запись')
    .max(1000, 'Слишком много записей для массовой операции'),
  
  // Дополнительные данные для операций обновления
  update_data: z.record(z.string(), z.any()).optional(),
  
  // Подтверждение для опасных операций
  confirm_destructive: z.boolean().optional(),
});

// Схема для загрузки файлов
export const FileUploadSchema = z.object({
  name: z.string()
    .min(1, 'Имя файла не может быть пустым')
    .max(255, 'Имя файла слишком длинное'),
  
  type: z.string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Неверный MIME тип'),
  
  size: z.number()
    .int('Размер файла должен быть целым числом')
    .min(1, 'Файл не может быть пустым')
    .max(50 * 1024 * 1024, 'Максимальный размер файла 50MB'),
  
  url: RequiredURLSchema,
  
  // Дополнительные метаданные
  alt_text: z.string().max(255).optional(),
  caption: z.string().max(500).optional(),
  uploaded_by: UUIDSchema.optional(),
  uploaded_at: z.string().datetime().optional(),
});

// Схема для метаданных
export const MetadataSchema = z.object({
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: UUIDSchema.optional(),
  updated_by: UUIDSchema.optional(),
  version: z.number().int().min(1).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(2000).optional(),
});

// Схема для настроек уведомлений
export const NotificationPreferencesSchema = z.object({
  email_enabled: z.boolean().default(true),
  sms_enabled: z.boolean().default(false),
  push_enabled: z.boolean().default(true),
  telegram_enabled: z.boolean().default(false),
  
  // Типы уведомлений
  order_updates: z.boolean().default(true),
  payment_reminders: z.boolean().default(true),
  marketing_emails: z.boolean().default(false),
  system_alerts: z.boolean().default(true),
  
  // Частота уведомлений
  digest_frequency: z.enum(['never', 'daily', 'weekly', 'monthly']).default('weekly'),
  quiet_hours: z.object({
    enabled: z.boolean().default(false),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }).optional(),
});

// Схема для адреса
export const AddressSchema = z.object({
  street: z.string()
    .min(1, 'Улица не может быть пустой')
    .max(255, 'Название улицы слишком длинное'),
  
  house: z.string()
    .min(1, 'Номер дома не может быть пустым')
    .max(20, 'Номер дома слишком длинный'),
  
  apartment: z.string()
    .max(20, 'Номер квартиры слишком длинный')
    .optional(),
  
  city: z.string()
    .min(1, 'Город не может быть пустым')
    .max(100, 'Название города слишком длинное'),
  
  region: z.string()
    .max(100, 'Название региона слишком длинное')
    .optional(),
  
  postal_code: z.string()
    .regex(/^\d{6}$/, 'Почтовый индекс должен содержать 6 цифр')
    .optional(),
  
  country: z.string()
    .min(2, 'Код страны должен содержать минимум 2 символа')
    .max(3, 'Код страны слишком длинный')
    .default('RU'),
  
  // Координаты
  latitude: z.number()
    .min(-90, 'Широта должна быть от -90 до 90')
    .max(90, 'Широта должна быть от -90 до 90')
    .optional(),
  
  longitude: z.number()
    .min(-180, 'Долгота должна быть от -180 до 180')
    .max(180, 'Долгота должна быть от -180 до 180')
    .optional(),
});

// Схема для контактной информации
export const ContactInfoSchema = z.object({
  email: EmailSchema.optional(),
  phone: PhoneSchema,
  mobile: PhoneSchema,
  whatsapp: PhoneSchema,
  telegram: z.string()
    .max(50, 'Telegram ID слишком длинный')
    .optional(),
  wechat: z.string()
    .max(50, 'WeChat ID слишком длинный')
    .optional(),
  skype: z.string()
    .max(50, 'Skype ID слишком длинный')
    .optional(),
});

// Схема для валют и денежных сумм
export const CurrencySchema = z.enum(['USD', 'EUR', 'CNY', 'RUB', 'GBP', 'JPY', 'CHF']);

export const MoneySchema = z.object({
  amount: z.number()
    .positive('Сумма должна быть положительной')
    .max(999999999.99, 'Сумма слишком большая'),
  
  currency: CurrencySchema.default('USD'),
  
  // Конвертированная сумма (если нужно)
  converted_amount: z.number().positive().optional(),
  converted_currency: CurrencySchema.optional(),
  exchange_rate: z.number().positive().optional(),
  exchange_date: z.string().datetime().optional(),
});

// Схема для статистики и метрик
export const StatisticsSchema = z.object({
  total_count: z.number().int().min(0),
  active_count: z.number().int().min(0),
  inactive_count: z.number().int().min(0),
  
  // Суммы
  total_value: MoneySchema.optional(),
  average_value: MoneySchema.optional(),
  
  // Временные метрики
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  
  // Дополнительные метрики
  growth_rate: z.number().optional(),
  completion_rate: z.number().min(0).max(100).optional(),
  
  breakdown: z.record(z.string(), z.number()).optional(),
});

// Схема для экспорта данных
export const ExportConfigSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json', 'pdf']),
  
  // Какие поля включать
  fields: z.array(z.string())
    .min(1, 'Выберите хотя бы одно поле для экспорта')
    .max(50, 'Слишком много полей'),
  
  // Фильтры для экспорта
  filters: z.record(z.string(), z.any()).optional(),
  
  // Настройки формата
  include_headers: z.boolean().default(true),
  date_format: z.enum(['iso', 'dd.mm.yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd']).default('dd.mm.yyyy'),
  
  // Сжатие
  compress: z.boolean().default(false),
  
  // Уведомления
  notify_when_ready: z.boolean().default(true),
  notification_email: EmailSchema.optional(),
});

// Схема для настроек приложения
export const AppSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.enum(['ru', 'en', 'zh']).default('ru'),
  timezone: z.string().default('Europe/Moscow'),
  
  // Настройки интерфейса
  compact_mode: z.boolean().default(false),
  show_tooltips: z.boolean().default(true),
  auto_save: z.boolean().default(true),
  
  // Настройки безопасности
  two_factor_enabled: z.boolean().default(false),
  session_timeout_minutes: z.number().int().min(15).max(480).default(60),
  
  // Интеграции
  integrations: z.record(z.string(), z.object({
    enabled: z.boolean(),
    config: z.record(z.string(), z.any()),
  })).optional(),
});

// Типы для TypeScript
export type PaginationParams = z.infer<typeof PaginationSchema>;
export type SortingParams = z.infer<typeof SortingSchema>;
export type SearchParams = z.infer<typeof SearchSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type NumericRange = z.infer<typeof NumericRangeSchema>;
export type ListRequest = z.infer<typeof ListRequestSchema>;
export type BulkAction = z.infer<typeof BulkActionSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Statistics = z.infer<typeof StatisticsSchema>;
export type ExportConfig = z.infer<typeof ExportConfigSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;

// Утилитарные функции для валидации
export const validateUUID = (id: string): boolean => {
  return UUIDSchema.safeParse(id).success;
};

export const validateEmail = (email: string): boolean => {
  return EmailSchema.safeParse(email).success;
};

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>'"]/g, '') // Удаляем потенциально опасные символы
    .substring(0, 255); // Обрезаем до максимальной длины
};

// Функция для создания схемы с пагинацией
export const createPaginatedSchema = <T>(itemSchema: z.ZodType<T>) => {
  return z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    q: z.string().optional(),
    search_fields: z.array(z.string()).optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
    items: z.array(itemSchema),
  });
}; 