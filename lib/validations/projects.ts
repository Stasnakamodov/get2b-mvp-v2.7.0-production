import { z } from 'zod';

// Базовые схемы
const UUIDSchema = z.string().uuid('Неверный формат ID');

const EmailSchema = z.string()
  .email('Неверный формат email адреса')
  .min(1, 'Email не может быть пустым');

const PhoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Неверный формат телефона');

// Enum для статусов проекта (расширенный)
export const ProjectStatusSchema = z.enum([
  'draft',
  'active', 
  'completed',
  'cancelled',
  'negotiating',
  'payment_pending',
  'production',
  'shipping',
  'customs',
  'ready_pickup'
]);

// Enum для типов платежей
export const PaymentTypeSchema = z.enum([
  'prepayment_30',
  'prepayment_50', 
  'prepayment_70',
  'prepayment_100',
  'letter_of_credit',
  'cash_on_delivery',
  'bank_transfer',
  'custom'
]);

// Enum для условий доставки (Incoterms)
export const IncotermsSchema = z.enum([
  'EXW', 'FCA', 'FAS', 'FOB',
  'CFR', 'CIF', 'CPT', 'CIP', 
  'DAP', 'DPU', 'DDP'
]);

// Схема для Step 1: Данные компании
export const Step1CompanySchema = z.object({
  // Основная информация
  company_name: z.string()
    .min(1, 'Название компании не может быть пустым')
    .max(255, 'Название компании слишком длинное'),
  
  legal_form: z.enum(['ООО', 'ИП', 'АО', 'ЗАО', 'other']),
  
  // Регистрационные данные
  inn: z.string()
    .regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать 10 или 12 цифр')
    .optional(),
  
  kpp: z.string()
    .regex(/^\d{9}$/, 'КПП должен содержать 9 цифр')
    .optional(),
  
  ogrn: z.string()
    .regex(/^\d{13}$|^\d{15}$/, 'ОГРН должен содержать 13 или 15 цифр')
    .optional(),
  
  // Адреса
  legal_address: z.string()
    .min(1, 'Юридический адрес не может быть пустым')
    .max(500, 'Юридический адрес слишком длинный'),
  
  actual_address: z.string()
    .max(500, 'Фактический адрес слишком длинный')
    .optional(),
  
  // Контактная информация
  contact_person: z.string()
    .min(1, 'Контактное лицо не может быть пустым')
    .max(100, 'Имя контактного лица слишком длинное'),
  
  position: z.string()
    .max(100, 'Должность слишком длинная')
    .optional(),
  
  email: EmailSchema,
  phone: PhoneSchema,
  
  // Банковские реквизиты
  bank_name: z.string().max(255, 'Название банка слишком длинное').optional(),
  bank_account: z.string().max(50, 'Расчетный счет слишком длинный').optional(),
  correspondent_account: z.string().max(50, 'Корр. счет слишком длинный').optional(),
  bik: z.string()
    .regex(/^\d{9}$/, 'БИК должен содержать 9 цифр')
    .optional(),
});

// Схема для Step 2: Спецификация товаров
export const ProductSpecificationSchema = z.object({
  id: UUIDSchema.optional(),
  
  // Основная информация о товаре
  name: z.string()
    .min(1, 'Название товара не может быть пустым')
    .max(255, 'Название товара слишком длинное'),
  
  description: z.string()
    .max(2000, 'Описание товара слишком длинное')
    .optional(),
  
  // Коды и классификация
  hs_code: z.string()
    .regex(/^\d{4,10}$/, 'Неверный формат HS кода')
    .optional(),
  
  category: z.string().max(100, 'Категория слишком длинная'),
  
  // Количество и единицы измерения
  quantity: z.number()
    .positive('Количество должно быть положительным')
    .max(1000000, 'Количество слишком большое'),
  
  unit: z.enum(['pcs', 'kg', 'm', 'm2', 'm3', 'ton', 'pack', 'box', 'other']),
  unit_custom: z.string().max(20).optional(), // если unit = 'other'
  
  // Ценообразование
  unit_price: z.number()
    .positive('Цена за единицу должна быть положительной')
    .max(1000000, 'Цена слишком большая'),
  
  currency: z.enum(['USD', 'EUR', 'CNY', 'RUB']).default('USD'),
  
  total_amount: z.number()
    .positive('Общая сумма должна быть положительной')
    .optional(), // можно вычислить автоматически
  
  // Технические требования
  specifications: z.record(z.string(), z.string()).optional(),
  quality_requirements: z.string().max(1000).optional(),
  
  // Упаковка и маркировка
  packaging_requirements: z.string().max(500).optional(),
  labeling_requirements: z.string().max(500).optional(),
  
  // Сертификация
  required_certificates: z.array(z.string()).optional(),
  custom_requirements: z.string().max(1000).optional(),
});

export const Step2SpecificationSchema = z.object({
  products: z.array(ProductSpecificationSchema)
    .min(1, 'Добавьте хотя бы один товар')
    .max(50, 'Слишком много товаров в одном проекте'),
  
  // Общие требования к партии
  total_project_value: z.number().positive().optional(),
  preferred_currency: z.enum(['USD', 'EUR', 'CNY', 'RUB']).default('USD'),
  
  // Особые требования
  quality_control_required: z.boolean().default(false),
  inspection_required: z.boolean().default(false),
  sample_required: z.boolean().default(false),
  
  // Дополнительные услуги
  need_consultation: z.boolean().default(false),
  consultation_topics: z.array(z.string()).optional(),
});

// Схема для Step 3: Логистика
export const Step3LogisticsSchema = z.object({
  // Условия поставки
  incoterms: IncotermsSchema,
  delivery_location: z.string()
    .min(1, 'Место доставки не может быть пустым')
    .max(255, 'Место доставки слишком длинное'),
  
  // Временные рамки
  expected_delivery_date: z.string()
    .datetime('Неверный формат даты')
    .optional(),
  
  max_delivery_time_days: z.number()
    .int('Срок доставки должен быть целым числом')
    .min(1, 'Срок доставки должен быть больше 0')
    .max(365, 'Срок доставки слишком большой'),
  
  // Способ доставки
  preferred_shipping_method: z.enum([
    'sea_freight',
    'air_freight', 
    'rail_freight',
    'truck_delivery',
    'multimodal',
    'express_courier'
  ]),
  
  // Порты и логистические узлы
  departure_port: z.string().max(100).optional(),
  arrival_port: z.string().max(100).optional(),
  
  // Упаковка для транспортировки
  packaging_type: z.enum(['standard', 'reinforced', 'custom']).default('standard'),
  packaging_instructions: z.string().max(500).optional(),
  
  // Страхование
  insurance_required: z.boolean().default(false),
  insurance_coverage_percent: z.number()
    .min(0)
    .max(100)
    .optional(),
  
  // Таможенное оформление
  customs_clearance_included: z.boolean().default(false),
  customs_broker: z.string().max(255).optional(),
  
  // Документооборот
  required_documents: z.array(z.enum([
    'commercial_invoice',
    'packing_list', 
    'bill_of_lading',
    'certificate_of_origin',
    'quality_certificate',
    'conformity_certificate',
    'sanitary_certificate',
    'phytosanitary_certificate'
  ])).optional(),
  
  // Особые требования
  special_handling: z.boolean().default(false),
  special_instructions: z.string().max(1000).optional(),
});

// Схема для Step 4: Платежные условия
export const Step4PaymentSchema = z.object({
  // Тип платежа
  payment_type: PaymentTypeSchema,
  
  // Валюта платежа
  payment_currency: z.enum(['USD', 'EUR', 'CNY', 'RUB']).default('USD'),
  
  // Условия предоплаты
  prepayment_percent: z.number()
    .min(0, 'Процент предоплаты не может быть отрицательным')
    .max(100, 'Процент предоплаты не может быть больше 100')
    .optional(),
  
  // Банковские реквизиты для платежа
  payment_bank: z.string().max(255).optional(),
  swift_code: z.string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Неверный формат SWIFT кода')
    .optional(),
  
  // Аккредитив (если используется)
  letter_of_credit_terms: z.object({
    issuing_bank: z.string().max(255),
    validity_days: z.number().int().min(1).max(365),
    documents_required: z.array(z.string()),
    partial_shipments_allowed: z.boolean().default(false),
    transshipment_allowed: z.boolean().default(true),
  }).optional(),
  
  // Сроки платежей
  payment_terms_days: z.number()
    .int('Срок платежа должен быть целым числом')
    .min(0, 'Срок платежа не может быть отрицательным')
    .max(180, 'Срок платежа слишком большой')
    .optional(),
  
  // Штрафы и пени
  late_payment_penalty_percent: z.number()
    .min(0)
    .max(50)
    .optional(),
  
  // Валютное хеджирование
  currency_hedging_required: z.boolean().default(false),
  hedging_period_days: z.number().int().min(1).max(365).optional(),
  
  // Дополнительные условия
  payment_guarantees_required: z.boolean().default(false),
  performance_bond_percent: z.number().min(0).max(20).optional(),
  
  // Комиссии и расходы
  banking_fees_responsibility: z.enum(['buyer', 'seller', 'shared']).default('shared'),
  additional_payment_terms: z.string().max(1000).optional(),
});

// Схема для Step 5: Юридические аспекты
export const Step5LegalSchema = z.object({
  // Применимое право
  governing_law: z.enum(['russian', 'chinese', 'international', 'other']).default('russian'),
  governing_law_details: z.string().max(500).optional(),
  
  // Разрешение споров
  dispute_resolution: z.enum([
    'russian_courts',
    'chinese_courts', 
    'arbitration_russia',
    'arbitration_china',
    'international_arbitration',
    'mediation_first'
  ]).default('arbitration_russia'),
  
  arbitration_rules: z.string().max(255).optional(),
  arbitration_place: z.string().max(100).optional(),
  
  // Ответственность сторон
  liability_limitation: z.boolean().default(false),
  liability_cap_percent: z.number().min(0).max(200).optional(),
  
  force_majeure_clause: z.boolean().default(true),
  
  // Конфиденциальность
  nda_required: z.boolean().default(false),
  confidentiality_period_months: z.number().int().min(6).max(120).optional(),
  
  // Интеллектуальная собственность
  ip_protection_required: z.boolean().default(false),
  trademark_protection: z.boolean().default(false),
  design_protection: z.boolean().default(false),
  
  // Гарантии и возврат
  warranty_period_months: z.number()
    .int()
    .min(0, 'Гарантийный срок не может быть отрицательным')
    .max(60, 'Гарантийный срок слишком большой')
    .optional(),
  
  return_policy: z.enum(['no_returns', 'defective_only', 'satisfaction_guarantee']).default('defective_only'),
  
  // Соответствие требованиям
  regulatory_compliance: z.array(z.enum([
    'customs_union_tr',
    'gost_standards',
    'ce_marking',
    'rohs_compliance',
    'fda_approval',
    'other'
  ])).optional(),
  
  additional_legal_terms: z.string().max(2000).optional(),
});

// Схема для Step 6: Контроль качества
export const Step6QualitySchema = z.object({
  // Требования к качеству
  quality_standards: z.array(z.enum([
    'iso_9001',
    'iso_14001', 
    'ts_16949',
    'gmp',
    'haccp',
    'ce',
    'rohs',
    'reach',
    'gost',
    'custom'
  ])).optional(),
  
  custom_standards: z.array(z.string().max(100)).optional(),
  
  // Контроль на производстве
  factory_inspection_required: z.boolean().default(false),
  production_monitoring: z.boolean().default(false),
  
  // Контроль готовой продукции
  pre_shipment_inspection: z.boolean().default(false),
  third_party_inspection: z.boolean().default(false),
  inspection_company: z.string().max(255).optional(),
  
  // Образцы
  samples_required: z.boolean().default(false),
  sample_quantity: z.number().int().min(1).max(100).optional(),
  sample_approval_required: z.boolean().default(false),
  
  // Тестирование
  lab_testing_required: z.boolean().default(false),
  testing_standards: z.array(z.string()).optional(),
  testing_laboratory: z.string().max(255).optional(),
  
  // Сертификация
  certificates_required: z.array(z.string()).optional(),
  certificate_validity_check: z.boolean().default(true),
  
  // Процедуры при обнаружении дефектов
  defect_handling_procedure: z.enum([
    'immediate_replacement',
    'repair_on_site',
    'return_to_supplier',
    'discount_negotiation',
    'custom_procedure'
  ]).optional(),
  
  quality_guarantee_percent: z.number().min(90).max(100).optional(),
  
  // Дополнительные требования
  quality_documentation_required: z.boolean().default(false),
  continuous_improvement_required: z.boolean().default(false),
  
  special_quality_requirements: z.string().max(1000).optional(),
});

// Схема для Step 7: Финальная проверка и утверждение
export const Step7FinalSchema = z.object({
  // Подтверждения
  terms_confirmed: z.boolean().refine(val => val === true, {
    message: 'Необходимо подтвердить условия договора'
  }),
  
  specifications_confirmed: z.boolean().refine(val => val === true, {
    message: 'Необходимо подтвердить спецификации'
  }),
  
  budget_confirmed: z.boolean().refine(val => val === true, {
    message: 'Необходимо подтвердить бюджет'
  }),
  
  // Приоритеты проекта
  project_priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  
  // Коммуникация
  preferred_communication: z.array(z.enum([
    'email',
    'phone',
    'telegram', 
    'whatsapp',
    'wechat',
    'video_calls',
    'in_person'
  ])).min(1, 'Выберите хотя бы один способ связи'),
  
  communication_language: z.enum(['russian', 'english', 'chinese']).default('russian'),
  
  // Дополнительные услуги
  additional_services: z.array(z.enum([
    'market_research',
    'supplier_verification',
    'quality_inspection',
    'logistics_management',
    'customs_clearance',
    'insurance',
    'legal_support',
    'translation_services'
  ])).optional(),
  
  // Комментарии
  special_instructions: z.string().max(2000).optional(),
  internal_notes: z.string().max(1000).optional(),
  
  // Временные рамки
  project_deadline: z.string().datetime().optional(),
  milestones: z.array(z.object({
    name: z.string().max(255),
    date: z.string().datetime(),
    description: z.string().max(500).optional(),
  })).optional(),
});

// Основная схема проекта (все шаги вместе)
export const ProjectSchema = z.object({
  id: UUIDSchema.optional(),
  user_id: UUIDSchema,
  
  // Метаданные проекта
  project_name: z.string()
    .min(1, 'Название проекта не может быть пустым')
    .max(255, 'Название проекта слишком длинное'),
  
  project_number: z.string().max(50).optional(),
  
  status: ProjectStatusSchema.default('draft'),
  
  // Данные по шагам
  step1_company: Step1CompanySchema.optional(),
  step2_specification: Step2SpecificationSchema.optional(),
  step3_logistics: Step3LogisticsSchema.optional(),
  step4_payment: Step4PaymentSchema.optional(),
  step5_legal: Step5LegalSchema.optional(),
  step6_quality: Step6QualitySchema.optional(),
  step7_final: Step7FinalSchema.optional(),
  
  // Прогресс
  current_step: z.number().int().min(1).max(7).default(1),
  completed_steps: z.array(z.number().int().min(1).max(7)).default([]),
  
  // Финансовые данные
  estimated_total_value: z.number().positive().optional(),
  final_total_value: z.number().positive().optional(),
  
  // Временные метки
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  
  // Связанные данные
  assigned_manager_id: UUIDSchema.optional(),
  supplier_id: UUIDSchema.optional(),
  
  // Документы и файлы
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number().positive(),
    uploaded_at: z.string().datetime(),
  })).optional(),
  
  // Журнал изменений
  change_log: z.array(z.object({
    timestamp: z.string().datetime(),
    user_id: UUIDSchema,
    action: z.string(),
    changes: z.record(z.string(), z.any()),
  })).optional(),
});

// Схема для создания проекта
export const CreateProjectSchema = ProjectSchema.pick({
  project_name: true,
  user_id: true,
}).extend({
  step1_company: Step1CompanySchema.optional(),
});

// Схема для обновления проекта
export const UpdateProjectSchema = ProjectSchema.partial().extend({
  id: UUIDSchema,
});

// Схема для поиска и фильтрации проектов
export const ProjectFilterSchema = z.object({
  status: z.array(ProjectStatusSchema).optional(),
  user_id: UUIDSchema.optional(),
  manager_id: UUIDSchema.optional(),
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),
  value_from: z.number().positive().optional(),
  value_to: z.number().positive().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort_by: z.enum(['created_at', 'updated_at', 'project_name', 'estimated_total_value']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Типы для TypeScript
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type PaymentType = z.infer<typeof PaymentTypeSchema>;
export type Incoterms = z.infer<typeof IncotermsSchema>;
export type Step1Company = z.infer<typeof Step1CompanySchema>;
export type ProductSpecification = z.infer<typeof ProductSpecificationSchema>;
export type Step2Specification = z.infer<typeof Step2SpecificationSchema>;
export type Step3Logistics = z.infer<typeof Step3LogisticsSchema>;
export type Step4Payment = z.infer<typeof Step4PaymentSchema>;
export type Step5Legal = z.infer<typeof Step5LegalSchema>;
export type Step6Quality = z.infer<typeof Step6QualitySchema>;
export type Step7Final = z.infer<typeof Step7FinalSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type ProjectFilter = z.infer<typeof ProjectFilterSchema>; 