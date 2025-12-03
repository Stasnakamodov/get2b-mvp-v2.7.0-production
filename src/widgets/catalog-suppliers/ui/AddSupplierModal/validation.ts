/**
 * Zod схемы валидации для формы поставщика
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal
 */

import { z } from 'zod'
import { ERROR_MESSAGES } from '@/src/shared/config'

/**
 * Схема для Шага 1: Основная информация
 */
export const Step1Schema = z.object({
  name: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  company_name: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  category: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  country: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  city: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  description: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  logo_url: z.string().optional()
})

/**
 * Схема для Шага 2: Контактная информация
 */
export const Step2Schema = z.object({
  email: z.string()
    .min(1, ERROR_MESSAGES.REQUIRED_FIELD)
    .email(ERROR_MESSAGES.INVALID_EMAIL),
  phone: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  contact_person: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  website: z.string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || /^https?:\/\/.+/.test(val),
      ERROR_MESSAGES.INVALID_URL
    )
})

/**
 * Схема для Шага 3: Бизнес-профиль
 */
export const Step3Schema = z.object({
  min_order: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  response_time: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  employees: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD),
  established: z.string().min(1, ERROR_MESSAGES.REQUIRED_FIELD)
})

/**
 * Схема для Шага 4: Сертификации
 */
export const Step4Schema = z.object({
  certifications: z.array(z.string()).min(1, 'Выберите хотя бы одну сертификацию'),
  specialties: z.array(z.string()).optional()
})

/**
 * Схема для товара
 */
const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Название товара обязательно'),
  price: z.string().min(1, 'Цена обязательна'),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  specifications: z.record(z.any()).optional(),
  category: z.string().optional(),
  inStock: z.boolean().optional(),
  minOrder: z.string().optional()
})

/**
 * Схема для Шага 5: Товары
 */
export const Step5Schema = z.object({
  products: z.array(ProductSchema).min(1, 'Добавьте хотя бы один товар')
})

/**
 * Схема для Шага 6: Платежные реквизиты (базовая)
 */
export const Step6SchemaBase = z.object({
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  swift_code: z.string().optional(),
  bank_address: z.string().optional(),
  payment_terms: z.string().optional(),
  currency: z.string().optional(),
  card_bank: z.string().optional(),
  card_number: z.string().optional(),
  card_holder: z.string().optional(),
  crypto_network: z.string().optional(),
  crypto_address: z.string().optional(),
  payment_methods: z.array(z.string()).optional()
})

/**
 * Схема для Шага 6: Платежные реквизиты (с валидацией)
 */
export const Step6Schema = Step6SchemaBase.refine(
  (data) => {
    // Проверяем, что заполнен хотя бы один способ оплаты
    const hasBankTransfer = data.bank_name && data.bank_account
    const hasCardPayment = data.card_bank && data.card_number
    const hasCrypto = data.crypto_network && data.crypto_address

    return hasBankTransfer || hasCardPayment || hasCrypto
  },
  {
    message: 'Заполните хотя бы один способ приёма платежей',
    path: ['payment_methods']
  }
)

/**
 * Полная схема формы поставщика (все шаги)
 */
export const SupplierFormSchema = Step1Schema
  .merge(Step2Schema)
  .merge(Step3Schema)
  .merge(Step4Schema)
  .merge(Step5Schema)
  .merge(Step6SchemaBase)

/**
 * Тип данных формы поставщика (инферируется из схемы)
 */
export type SupplierFormData = z.infer<typeof SupplierFormSchema>

/**
 * Функция валидации конкретного шага
 */
export function validateStep(step: number, data: Partial<SupplierFormData>): { success: boolean; errors?: Record<string, string> } {
  try {
    switch (step) {
      case 1:
        Step1Schema.parse({
          name: data.name,
          company_name: data.company_name,
          category: data.category,
          country: data.country,
          city: data.city,
          description: data.description,
          logo_url: data.logo_url
        })
        break
      case 2:
        Step2Schema.parse({
          email: data.email,
          phone: data.phone,
          contact_person: data.contact_person,
          website: data.website
        })
        break
      case 3:
        Step3Schema.parse({
          min_order: data.min_order,
          response_time: data.response_time,
          employees: data.employees,
          established: data.established
        })
        break
      case 4:
        Step4Schema.parse({
          certifications: data.certifications,
          specialties: data.specialties
        })
        break
      case 5:
        Step5Schema.parse({
          products: data.products
        })
        break
      case 6:
        Step6Schema.parse({
          bank_name: data.bank_name,
          bank_account: data.bank_account,
          swift_code: data.swift_code,
          bank_address: data.bank_address,
          payment_terms: data.payment_terms,
          currency: data.currency,
          card_bank: data.card_bank,
          card_number: data.card_number,
          card_holder: data.card_holder,
          crypto_network: data.crypto_network,
          crypto_address: data.crypto_address,
          payment_methods: data.payment_methods
        })
        break
      case 7:
        // Шаг 7 - превью, валидация не требуется
        break
      default:
        return { success: false, errors: { general: 'Неизвестный шаг' } }
    }

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { success: false, errors }
    }

    return { success: false, errors: { general: 'Ошибка валидации' } }
  }
}
