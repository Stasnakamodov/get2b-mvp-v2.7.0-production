import { z } from 'zod'

// ========================================
// БАЗОВЫЕ ТИПЫ ДАННЫХ
// ========================================

export type StepConfig = 'catalog' | 'manual' | 'profile' | 'template' | 'upload' | 'automatic' | 'echo' | 'echoData' | 'blue_room' | 'orange_room' | 'ocr_suggestion'
export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7

// ========================================
// ШАГ 1: ИНФОРМАЦИЯ О КОМПАНИИ
// ========================================

export const CompanyDataSchema = z.object({
  name: z.string().min(1, 'Название компании обязательно'),
  legal_name: z.string().optional(),
  inn: z.string().optional(),
  kpp: z.string().optional(),
  ogrn: z.string().optional(),
  legal_address: z.string().optional(),
  email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Неверный формат URL').optional().or(z.literal('')),
})

export type CompanyData = z.infer<typeof CompanyDataSchema>

// Legacy compatibility fields for CompanyData
export interface ExtendedCompanyData extends CompanyData {
  legalName?: string
  address?: string
  bankName?: string
  bankAccount?: string
  bankCorrAccount?: string
  bankBik?: string
  director?: string
  correspondentAccount?: string
  bank_name?: string
  bank_account?: string
  corr_account?: string
  bik?: string
  supplier?: string
  supplier_name?: string
  currency?: string
  items?: ExtendedSpecificationItem[]
  method?: string
  recipientName?: string
}

// ========================================
// ШАГ 2: КОНТАКТНАЯ ИНФОРМАЦИЯ
// ========================================

export const ContactsDataSchema = z.object({
  contact_person: z.string().min(1, 'Контактное лицо обязательно'),
  position: z.string().optional(),
  phone: z.string().min(1, 'Телефон обязателен'),
  email: z.string().email('Неверный формат email'),
  telegram: z.string().optional(),
  additional_info: z.string().optional(),
})

export type ContactsData = z.infer<typeof ContactsDataSchema>

// Legacy compatibility fields for ContactsData (also used for specification)
export interface ExtendedContactsData extends ContactsData {
  supplier?: string
  supplier_name?: string
  currency?: string
  items?: ExtendedSpecificationItem[]
  totalAmount?: number
  total_amount?: number
  auto_filled?: boolean
  legal_address?: string
  name?: string
  legal_name?: string
  inn?: string
  kpp?: string
  ogrn?: string
  bank_name?: string
  bank_account?: string
  bik?: string
  corr_account?: string
  website?: string
  director?: string
  method?: string
  recipientName?: string
}

// ========================================
// ШАГ 3: БАНКОВСКИЕ РЕКВИЗИТЫ
// ========================================

export const BankDataSchema = z.object({
  bank_name: z.string().min(1, 'Название банка обязательно'),
  bank_account: z.string().min(1, 'Номер счёта обязателен'),
  corr_account: z.string().min(1, 'Корреспондентский счёт обязателен'),
  bik: z.string().min(9, 'БИК должен содержать 9 цифр').max(9, 'БИК должен содержать 9 цифр'),
  inn: z.string().optional(),
  kpp: z.string().optional(),
})

export type BankData = z.infer<typeof BankDataSchema>

// Extended BankData with legacy fields
export interface ExtendedBankData extends BankData {
  auto_filled?: boolean
  method?: string
  supplier?: string
  supplier_name?: string
  recipientName?: string
  items?: ExtendedSpecificationItem[]
  name?: string
  legal_name?: string
  legal_address?: string
  ogrn?: string
  email?: string
  phone?: string
  website?: string
  director?: string
  currency?: string
}

// ========================================
// ШАГ 4: СПОСОБЫ ОПЛАТЫ
// ========================================

export const PaymentMethodSchema = z.enum(['bank', 'p2p', 'crypto', 'bank-transfer'])
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export const PaymentMethodsDataSchema = z.object({
  payment_methods: z.array(PaymentMethodSchema).min(1, 'Выберите хотя бы один способ оплаты'),
  bank_accounts: z.array(z.object({
    bank_name: z.string(),
    account_number: z.string(),
    additional_info: z.string().optional(),
  })).optional(),
  p2p_cards: z.array(z.object({
    card_number: z.string(),
    card_holder: z.string(),
    bank_name: z.string(),
    additional_info: z.string().optional(),
  })).optional(),
  crypto_wallets: z.array(z.object({
    currency: z.string(),
    wallet_address: z.string(),
    network: z.string().optional(),
    additional_info: z.string().optional(),
  })).optional(),
  supplier_data: z.object({
    id: z.string(),
    name: z.string(),
    company_name: z.string(),
    payment_methods: z.array(PaymentMethodSchema),
    bank_accounts: z.any().optional(),
    p2p_cards: z.any().optional(),
    crypto_wallets: z.any().optional(),
  }).optional(),
})

export type PaymentMethodsData = z.infer<typeof PaymentMethodsDataSchema>

// Legacy compatibility fields for PaymentMethodsData
export interface ExtendedPaymentMethodsData extends PaymentMethodsData {
  method?: string
  selectedMethod?: string
  defaultMethod?: string
  methods?: string[]
  type?: string
  payment_method?: string
  auto_filled?: boolean
  supplier_name?: string
  supplier?: string
  echo_source?: any
  user_choice?: boolean
  echo_data?: any
  available_methods?: string[]
  catalog_source?: string
  name?: string
  legal_name?: string
  inn?: string
  kpp?: string
  ogrn?: string
  legal_address?: string
  bank_name?: string
  bank_account?: string
  bik?: string
  corr_account?: string
  email?: string
  phone?: string
  website?: string
  director?: string
  currency?: string
  items?: ExtendedSpecificationItem[]
  recipientName?: string
}

// ========================================
// ШАГ 5: СПЕЦИФИКАЦИЯ
// ========================================

export const SpecificationItemSchema = z.object({
  item_name: z.string().min(1, 'Название товара обязательно'),
  quantity: z.number().min(1, 'Количество должно быть больше 0'),
  unit: z.string().min(1, 'Единица измерения обязательна'),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  total: z.number().min(0, 'Сумма не может быть отрицательной'),
  supplier_name: z.string().optional(),
  supplier_id: z.string().optional(),
  notes: z.string().optional(),
})

// Extended SpecificationItem with legacy fields - making required fields optional for flexibility
export interface ExtendedSpecificationItem extends Partial<SpecificationItem> {
  supplier?: string
  name?: string
  supplier_id?: any
}

export const SpecificationDataSchema = z.object({
  items: z.array(SpecificationItemSchema).min(1, 'Добавьте хотя бы один товар'),
  total_amount: z.number().min(0, 'Общая сумма не может быть отрицательной'),
  currency: z.string().default('RUB'),
  notes: z.string().optional(),
})

export type SpecificationItem = z.infer<typeof SpecificationItemSchema>
export type SpecificationData = z.infer<typeof SpecificationDataSchema>

// Legacy compatibility fields for SpecificationData
export interface ExtendedSpecificationData extends Omit<SpecificationData, 'items'> {
  supplier?: string
  supplier_name?: string
  requisites?: any
  auto_filled?: boolean
  echo_source?: any
  echo_data?: any
  user_choice?: boolean
  type?: string
  bankName?: string
  accountNumber?: string
  swift?: string
  recipientName?: string
  recipientAddress?: string
  transferCurrency?: string
  project_info?: any
  crypto_network?: string
  crypto_name?: string
  crypto_address?: string
  card_bank?: string
  card_number?: string
  card_holder?: string
  iban?: string
  paymentPurpose?: string
  method?: string
  items?: ExtendedSpecificationItem[]
  name?: string
  legal_name?: string
  inn?: string
  kpp?: string
  ogrn?: string
  legal_address?: string
  bank_name?: string
  bank_account?: string
  bik?: string
  corr_account?: string
  email?: string
  phone?: string
  website?: string
  director?: string
}

// ========================================
// ШАГ 6: ФАЙЛЫ И ДОКУМЕНТЫ
// ========================================

export const FileUploadDataSchema = z.object({
  files: z.array(z.object({
    id: z.string(),
    name: z.string(),
    size: z.number(),
    type: z.string(),
    url: z.string(),
    uploaded_at: z.string(),
  })),
  notes: z.string().optional(),
})

export type FileUploadData = z.infer<typeof FileUploadDataSchema>

// Extended FileUploadData with legacy fields
export interface ExtendedFileUploadData extends FileUploadData {
  method?: string
  supplier?: string
  supplier_name?: string
  recipientName?: string
  name?: string
  legal_name?: string
  inn?: string
  kpp?: string
  ogrn?: string
  legal_address?: string
  bank_name?: string
  bank_account?: string
  bik?: string
  corr_account?: string
  email?: string
  phone?: string
  website?: string
  director?: string
  currency?: string
  items?: ExtendedSpecificationItem[]
}

// ========================================
// ШАГ 7: РЕКВИЗИТЫ ПОЛУЧАТЕЛЯ
// ========================================

export const RequisitesDataSchema = z.object({
  recipient_name: z.string().min(1, 'Название получателя обязательно'),
  recipient_inn: z.string().optional(),
  recipient_kpp: z.string().optional(),
  recipient_address: z.string().optional(),
  recipient_bank_name: z.string().min(1, 'Название банка получателя обязательно'),
  recipient_account: z.string().min(1, 'Счёт получателя обязателен'),
  recipient_bik: z.string().min(9, 'БИК должен содержать 9 цифр').max(9),
  payment_purpose: z.string().min(1, 'Назначение платежа обязательно'),
})

export type RequisitesData = z.infer<typeof RequisitesDataSchema>

// Extended RequisitesData with legacy fields
export interface ExtendedRequisitesData extends RequisitesData {
  method?: string
  supplier?: string
  supplier_name?: string
  name?: string
  legal_name?: string
  inn?: string
  kpp?: string
  ogrn?: string
  legal_address?: string
  bank_name?: string
  bank_account?: string
  bik?: string
  corr_account?: string
  email?: string
  phone?: string
  website?: string
  director?: string
  currency?: string
  items?: ExtendedSpecificationItem[]
  recipientName?: string
}

// ========================================
// ОБЪЕДИНЕННЫЕ ТИПЫ ВСЕХ ШАГОВ
// ========================================

export type StepData = {
  1: ExtendedCompanyData
  2: ExtendedContactsData
  3: ExtendedBankData
  4: ExtendedPaymentMethodsData
  5: ExtendedSpecificationData
  6: ExtendedFileUploadData
  7: ExtendedRequisitesData
}

// Тип для manualData состояния with flexible typing for partial data
export type ManualData = {
  [K in StepNumber]?: Partial<StepData[K]>
} & { [index: number]: any }

// Тип для stepConfigs состояния
export type StepConfigs = {
  [K in StepNumber]: StepConfig
}

// Тип для частичных stepConfigs (для инициализации)
export type PartialStepConfigs = {
  [K in StepNumber]?: StepConfig
} & { [index: number]: string | undefined }

// ========================================
// СОСТОЯНИЯ КОМПОНЕНТА
// ========================================

export interface User {
  id: string
  email?: string
  name?: string
  role?: string
}

export interface ProjectDetails {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
  user_id: string
  currentStage?: number
  activeScenario?: string
  manualData?: ManualData
  stepConfigs?: StepConfigs
}

export interface SupplierData {
  id: string
  name: string
  company_name: string
  category: string
  payment_methods: PaymentMethod[]
  bank_accounts?: any[]
  p2p_cards?: any[]
  crypto_wallets?: any[]
  is_featured?: boolean
  public_rating?: number
  contact_email?: string
  contact_phone?: string
  city?: string
  created_at?: string
}

export interface StepDataToView {
  stepId: StepNumber
  data: StepData[StepNumber]
  type?: string
  name?: string
  legalName?: string
  legal_name?: string
  inn?: string
  kpp?: string
  ogrn?: string
  address?: string
  legal_address?: string
  bankName?: string
  bank_name?: string
  bankAccount?: string
  bank_account?: string
  bankCorrAccount?: string
  corr_account?: string
  bankBik?: string
  bik?: string
  email?: string
  phone?: string
  website?: string
  supplier?: string
  supplier_name?: string
  currency?: string
  items?: SpecificationItem[]
  totalAmount?: number
  method?: string
  recipientName?: string
  project_info?: any
  crypto_network?: string
  crypto_name?: string
  crypto_address?: string
  card_bank?: string
  card_number?: string
  card_holder?: string
  accountNumber?: string
  swift?: string
}

// Legacy payment method data type
export interface LegacyPaymentMethodData {
  method: string
  supplier: string
  suggested?: boolean
  source?: string
}

// Legacy requisites data type
export interface LegacyRequisitesData {
  bankName: string
  accountNumber: string
  swift: string
  recipientName: string
  recipientAddress: string
  transferCurrency: string
  suggested?: boolean
  source?: string
}

// ========================================
// КОМПОНЕНТНЫЕ ПРОПСЫ
// ========================================

export interface FormProps<T> {
  onSave: (data: T) => void
  onCancel: () => void
  initialData?: T
}

// ========================================
// OCR И АНАЛИЗ ДАННЫХ
// ========================================

export interface OcrDebugData {
  [stepId: number]: {
    raw_text?: string
    confidence?: number
    analysis_result?: any
    timestamp?: string
  }
}

// ========================================
// СХЕМЫ ВАЛИДАЦИИ ДЛЯ ВСЕХ ШАГОВ
// ========================================

export const StepDataSchemas = {
  1: CompanyDataSchema,
  2: ContactsDataSchema,
  3: BankDataSchema,
  4: PaymentMethodsDataSchema,
  5: SpecificationDataSchema,
  6: FileUploadDataSchema,
  7: RequisitesDataSchema,
} as const

// Хелпер для валидации данных шага
export function validateStepData<T extends StepNumber>(
  stepNumber: T,
  data: unknown
): { success: true; data: StepData[T] } | { success: false; errors: string[] } {
  try {
    const validatedData = StepDataSchemas[stepNumber].parse(data)
    return { success: true, data: validatedData as StepData[T] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return { success: false, errors: ['Неизвестная ошибка валидации'] }
  }
}