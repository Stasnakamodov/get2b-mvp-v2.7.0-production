import { z } from 'zod';

// Базовые схемы для повторного использования
const UUIDSchema = z.string().uuid('Неверный формат ID');

const EmailSchema = z.string()
  .email('Неверный формат email адреса')
  .min(1, 'Email не может быть пустым');

const PhoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Неверный формат телефона')
  .optional();

const URLSchema = z.string()
  .url('Неверный формат URL')
  .optional()
  .or(z.literal(''));

// Схема для валидации поставщика
export const SupplierSchema = z.object({
  id: UUIDSchema.optional(),
  user_id: UUIDSchema.optional(),
  
  // Основная информация
  company_name: z.string()
    .min(1, 'Название компании не может быть пустым')
    .max(255, 'Название компании слишком длинное'),
  
  contact_person: z.string()
    .min(1, 'Имя контактного лица не может быть пустым')
    .max(100, 'Имя контактного лица слишком длинное'),
  
  // Контактная информация
  email: EmailSchema,
  phone: PhoneSchema,
  whatsapp: PhoneSchema,
  wechat: z.string().max(50, 'WeChat ID слишком длинный').optional(),
  
  // Адреса
  address: z.string()
    .max(500, 'Адрес слишком длинный')
    .optional(),
  
  // Веб-ресурсы
  website: URLSchema,
  alibaba_url: URLSchema,
  
  // Категории и специализация
  categories: z.array(z.string()).optional(),
  specialization: z.string().max(500, 'Специализация слишком длинная').optional(),
  
  // Финансовая информация
  min_order_amount: z.number()
    .positive('Минимальная сумма заказа должна быть положительной')
    .optional(),
  min_order_currency: z.enum(['USD', 'EUR', 'CNY', 'RUB']).optional(),
  
  payment_terms: z.string().max(200, 'Условия платежа слишком длинные').optional(),
  
  // Логистика
  delivery_terms: z.string().max(200, 'Условия доставки слишком длинные').optional(),
  lead_time_days: z.number()
    .int('Время производства должно быть целым числом')
    .min(0, 'Время производства не может быть отрицательным')
    .max(365, 'Время производства слишком большое')
    .optional(),
  
  // Качество и сертификация
  quality_certificates: z.array(z.string()).optional(),
  factory_audit_date: z.string().datetime().optional(),
  
  // Рейтинг и статус
  rating: z.number()
    .min(0, 'Рейтинг не может быть отрицательным')
    .max(5, 'Рейтинг не может быть больше 5')
    .optional(),
  
  is_verified: z.boolean().default(false),
  verification_level: z.enum(['basic', 'premium', 'gold']).optional(),
  
  // Заметки
  notes: z.string().max(1000, 'Заметки слишком длинные').optional(),
  
  // Метаданные
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  
  // Статистика
  total_orders: z.number().int().min(0).optional(),
  last_order_date: z.string().datetime().optional(),
  average_order_value: z.number().positive().optional(),
});

// Схема для создания поставщика (обязательные поля)
export const CreateSupplierSchema = SupplierSchema.pick({
  company_name: true,
  contact_person: true,
  email: true,
  phone: true,
  address: true,
  categories: true,
}).extend({
  user_id: UUIDSchema, // Обязательно при создании
});

// Схема для обновления поставщика (все поля опциональные)
export const UpdateSupplierSchema = SupplierSchema.partial().extend({
  id: UUIDSchema, // ID обязательно при обновлении
});

// Схема для поиска поставщиков
export const SearchSuppliersSchema = z.object({
  q: z.string().optional(), // Поисковый запрос
  categories: z.array(z.string()).optional(),
  min_rating: z.number().min(0).max(5).optional(),
  verified_only: z.boolean().optional(),
  min_order_from: z.number().positive().optional(),
  min_order_to: z.number().positive().optional(),
  has_certificates: z.boolean().optional(),
  country: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort_by: z.enum(['rating', 'created_at', 'company_name', 'last_order_date']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Схема для продукта поставщика
export const SupplierProductSchema = z.object({
  id: UUIDSchema.optional(),
  supplier_id: UUIDSchema,
  
  // Основная информация о продукте
  name: z.string()
    .min(1, 'Название продукта не может быть пустым')
    .max(255, 'Название продукта слишком длинное'),
  
  description: z.string()
    .max(2000, 'Описание продукта слишком длинное')
    .optional(),
  
  // Коды и артикулы
  sku: z.string().max(50, 'SKU слишком длинный').optional(),
  model_number: z.string().max(50, 'Номер модели слишком длинный').optional(),
  hs_code: z.string()
    .regex(/^\d{4,10}$/, 'Неверный формат HS кода')
    .optional(),
  
  // Категоризация
  category: z.string().max(100, 'Категория слишком длинная'),
  subcategory: z.string().max(100, 'Подкатегория слишком длинная').optional(),
  tags: z.array(z.string().max(50)).optional(),
  
  // Ценообразование
  price_min: z.number().positive('Минимальная цена должна быть положительной').optional(),
  price_max: z.number().positive('Максимальная цена должна быть положительной').optional(),
  currency: z.enum(['USD', 'EUR', 'CNY', 'RUB']).default('USD'),
  price_per_unit: z.string().max(20).optional(), // "per piece", "per kg", etc.
  
  // Минимальный заказ
  moq: z.number().int().positive('MOQ должен быть положительным').optional(),
  moq_unit: z.string().max(20).optional(),
  
  // Технические характеристики
  specifications: z.record(z.string(), z.string()).optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    unit: z.enum(['mm', 'cm', 'm', 'g', 'kg']).optional(),
  }).optional(),
  
  // Изображения и документы
  images: z.array(z.object({
    url: z.string().url(),
    is_primary: z.boolean().default(false),
    alt_text: z.string().optional(),
  })).optional(),
  
  certificates: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    expiry_date: z.string().datetime().optional(),
  })).optional(),
  
  // Логистические данные
  lead_time_days: z.number().int().min(0).max(365).optional(),
  packaging_details: z.string().max(500).optional(),
  
  // Статус и доступность
  is_active: z.boolean().default(true),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'on_order']).optional(),
  
  // Метаданные
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Схема для создания продукта
export const CreateProductSchema = SupplierProductSchema.pick({
  supplier_id: true,
  name: true,
  category: true,
  price_min: true,
  currency: true,
}).extend({
  description: z.string().optional(),
});

// Схема для обновления продукта
export const UpdateProductSchema = SupplierProductSchema.partial().extend({
  id: UUIDSchema,
});

// Схема для фильтрации продуктов
export const FilterProductsSchema = z.object({
  supplier_id: UUIDSchema.optional(),
  category: z.string().optional(),
  price_from: z.number().positive().optional(),
  price_to: z.number().positive().optional(),
  currency: z.enum(['USD', 'EUR', 'CNY', 'RUB']).optional(),
  in_stock_only: z.boolean().optional(),
  with_certificates: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

// Схема для импорта поставщика из внешних источников
export const ImportSupplierSchema = z.object({
  source: z.enum(['alibaba', 'made_in_china', 'manual']),
  source_url: URLSchema,
  auto_fill_products: z.boolean().default(false),
  
  // Данные поставщика (частично заполнены)
  supplier_data: SupplierSchema.partial(),
  
  // Опциональные продукты для импорта
  products: z.array(SupplierProductSchema.partial()).optional(),
});

// Схема для экспорта каталога
export const ExportCatalogSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']),
  include_products: z.boolean().default(true),
  include_inactive: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
});

// Схема для массовых операций
export const BulkOperationSchema = z.object({
  operation: z.enum(['delete', 'activate', 'deactivate', 'update_category', 'export']),
  supplier_ids: z.array(UUIDSchema).min(1, 'Выберите хотя бы одного поставщика'),
  
  // Параметры для операций обновления
  update_data: z.object({
    category: z.string().optional(),
    is_verified: z.boolean().optional(),
    verification_level: z.enum(['basic', 'premium', 'gold']).optional(),
  }).optional(),
});

// Типы для TypeScript
export type Supplier = z.infer<typeof SupplierSchema>;
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplier = z.infer<typeof UpdateSupplierSchema>;
export type SearchSuppliers = z.infer<typeof SearchSuppliersSchema>;
export type SupplierProduct = z.infer<typeof SupplierProductSchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type FilterProducts = z.infer<typeof FilterProductsSchema>;
export type ImportSupplier = z.infer<typeof ImportSupplierSchema>;
export type ExportCatalog = z.infer<typeof ExportCatalogSchema>;
export type BulkOperation = z.infer<typeof BulkOperationSchema>; 