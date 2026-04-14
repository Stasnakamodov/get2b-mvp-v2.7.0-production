export interface CompanyData {
  name: string
  legalName: string
  inn: string
  kpp: string
  ogrn: string
  address: string
  bankName: string
  bankAccount: string
  bankCorrAccount: string
  bankBik: string
  email: string
  phone: string
  website: string
}

export interface ProjectTemplatePayload {
  company: CompanyData
  specification: unknown[]
}

export interface ProjectTemplateRow {
  id?: string
  user_id: string
  name: string
  description: string | null
  role: 'client' | 'supplier'
  data: ProjectTemplatePayload
}

export const EMPTY_COMPANY_DATA: CompanyData = {
  name: '',
  legalName: '',
  inn: '',
  kpp: '',
  ogrn: '',
  address: '',
  bankName: '',
  bankAccount: '',
  bankCorrAccount: '',
  bankBik: '',
  email: '',
  phone: '',
  website: '',
}

export function toCompanyData(input: unknown): CompanyData {
  if (!input || typeof input !== 'object') return { ...EMPTY_COMPANY_DATA }
  const i = input as Record<string, unknown>
  return {
    name: String(i.name ?? ''),
    legalName: String(i.legalName ?? ''),
    inn: String(i.inn ?? ''),
    kpp: String(i.kpp ?? ''),
    ogrn: String(i.ogrn ?? ''),
    address: String(i.address ?? ''),
    bankName: String(i.bankName ?? ''),
    bankAccount: String(i.bankAccount ?? ''),
    bankCorrAccount: String(i.bankCorrAccount ?? ''),
    bankBik: String(i.bankBik ?? ''),
    email: String(i.email ?? ''),
    phone: String(i.phone ?? ''),
    website: String(i.website ?? ''),
  }
}

export function templatePayload(row: unknown): ProjectTemplatePayload {
  const r = (row ?? {}) as { data?: { company?: unknown; specification?: unknown } }
  const data = r.data ?? {}
  return {
    company: toCompanyData(data.company),
    specification: Array.isArray(data.specification) ? data.specification : [],
  }
}

export function buildTemplateRow(input: {
  user_id: string
  name: string
  description?: string | null
  role?: 'client' | 'supplier'
  companyData: unknown
  specification?: unknown[]
}): Omit<ProjectTemplateRow, 'id'> {
  return {
    user_id: input.user_id,
    name: input.name,
    description: input.description ?? null,
    role: input.role ?? 'client',
    data: {
      company: toCompanyData(input.companyData),
      specification: Array.isArray(input.specification) ? input.specification : [],
    },
  }
}
