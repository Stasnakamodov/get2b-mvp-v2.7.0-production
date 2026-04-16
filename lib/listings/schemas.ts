import { z } from 'zod'

export const LISTING_UNITS = [
  'шт', 'кг', 'м', 'м²', 'м³', 'литр', 'комплект', 'упаковка', 'тонна',
] as const

export const LISTING_STATUSES = ['draft', 'open', 'closed', 'expired'] as const
export type ListingStatus = typeof LISTING_STATUSES[number]

const MAX_EXPIRES_DAYS = 60

const isoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'invalid datetime' })

export const CreateListingInput = z
  .object({
    title: z.string().min(10).max(150),
    description: z.string().min(20).max(2000),
    quantity: z.number().positive(),
    unit: z.string().min(1).max(50),
    category_id: z.string().uuid().nullable().optional(),
    deadline_date: z.string().date().nullable().optional(),
    is_urgent: z.boolean().optional().default(false),
    expires_at: isoDateTime,
    author_client_profile_id: z.string().uuid(),
  })
  .refine(
    (data) => {
      const expires = new Date(data.expires_at).getTime()
      return expires > Date.now()
    },
    { message: 'expires_at must be in the future', path: ['expires_at'] }
  )
  .refine(
    (data) => {
      const expires = new Date(data.expires_at).getTime()
      const maxAllowed = Date.now() + MAX_EXPIRES_DAYS * 24 * 60 * 60 * 1000
      return expires <= maxAllowed
    },
    { message: `expires_at must be within ${MAX_EXPIRES_DAYS} days`, path: ['expires_at'] }
  )

export type CreateListingInputType = z.infer<typeof CreateListingInput>

const BATCH_MAX_ITEMS = 30

export const BatchListingItem = z.object({
  title: z.string().min(10).max(150),
  description: z.string().min(20).max(2000),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(50),
  category_id: z.string().uuid().nullable().optional(),
})

export const BatchCreateListingInput = z
  .object({
    items: z.array(BatchListingItem).min(1).max(BATCH_MAX_ITEMS),
    deadline_date: z.string().date().nullable().optional(),
    is_urgent: z.boolean().optional().default(false),
    expires_at: isoDateTime,
    author_client_profile_id: z.string().uuid(),
  })
  .refine(
    (data) => {
      const expires = new Date(data.expires_at).getTime()
      return expires > Date.now()
    },
    { message: 'expires_at must be in the future', path: ['expires_at'] }
  )
  .refine(
    (data) => {
      const expires = new Date(data.expires_at).getTime()
      const maxAllowed = Date.now() + MAX_EXPIRES_DAYS * 24 * 60 * 60 * 1000
      return expires <= maxAllowed
    },
    { message: `expires_at must be within ${MAX_EXPIRES_DAYS} days`, path: ['expires_at'] }
  )

export type BatchCreateListingInputType = z.infer<typeof BatchCreateListingInput>
export type BatchListingItemType = z.infer<typeof BatchListingItem>

export const UpdateListingInput = z
  .object({
    title: z.string().min(10).max(150).optional(),
    description: z.string().min(20).max(2000).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().min(1).max(50).optional(),
    category_id: z.string().uuid().nullable().optional(),
    deadline_date: z.string().date().nullable().optional(),
    is_urgent: z.boolean().optional(),
    expires_at: isoDateTime.optional(),
  })
  .refine(
    (data) => {
      if (!data.expires_at) return true
      return new Date(data.expires_at).getTime() > Date.now()
    },
    { message: 'expires_at must be in the future', path: ['expires_at'] }
  )

export type UpdateListingInputType = z.infer<typeof UpdateListingInput>

export const LIST_SORT_FIELDS = ['newest', 'deadline', 'urgent'] as const
export type ListSortField = typeof LIST_SORT_FIELDS[number]

export const ListListingsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  category_id: z.string().uuid().optional(),
  search: z.string().min(1).max(200).optional(),
  urgent: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  sort: z.enum(LIST_SORT_FIELDS).default('newest'),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  exclude_own: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
})

export type ListListingsQueryType = z.infer<typeof ListListingsQuery>

export const ContactListingInput = z.object({
  supplier_profile_id: z.string().uuid(),
})

export type ContactListingInputType = z.infer<typeof ContactListingInput>

export interface Listing {
  id: string
  author_id: string
  author_client_profile_id: string | null
  title: string
  description: string
  quantity: number
  unit: string
  category_id: string | null
  deadline_date: string | null
  is_urgent: boolean
  status: ListingStatus
  expires_at: string
  views_count: number
  contacts_count: number
  created_at: string
  updated_at: string
}
