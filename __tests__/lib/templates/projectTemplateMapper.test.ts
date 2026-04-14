import {
  CompanyData,
  EMPTY_COMPANY_DATA,
  toCompanyData,
  templatePayload,
  buildTemplateRow,
} from '@/lib/templates/projectTemplateMapper'

describe('projectTemplateMapper', () => {
  const FILLED: CompanyData = {
    name: 'ООО «ТехноГрупп»',
    legalName: 'ООО «ТехноГрупп»',
    inn: '7701234567',
    kpp: '770101001',
    ogrn: '1027700132195',
    address: 'г. Москва, ул. Тверская, д. 1',
    bankName: 'АО «Тинькофф Банк»',
    bankAccount: '40702810900001234567',
    bankCorrAccount: '30101810145250000974',
    bankBik: '044525974',
    email: 'stas@gmail.com',
    phone: '+7 (995) 412-87-33',
    website: 'technogrupp.ru',
  }

  describe('toCompanyData', () => {
    it('returns EMPTY_COMPANY_DATA clone for null', () => {
      const result = toCompanyData(null)
      expect(result).toEqual(EMPTY_COMPANY_DATA)
      expect(result).not.toBe(EMPTY_COMPANY_DATA)
    })

    it('returns EMPTY_COMPANY_DATA clone for undefined', () => {
      expect(toCompanyData(undefined)).toEqual(EMPTY_COMPANY_DATA)
    })

    it('returns EMPTY_COMPANY_DATA for non-object', () => {
      expect(toCompanyData('not-an-object')).toEqual(EMPTY_COMPANY_DATA)
      expect(toCompanyData(42)).toEqual(EMPTY_COMPANY_DATA)
    })

    it('fills missing fields with empty strings', () => {
      const result = toCompanyData({ name: 'Acme' })
      expect(result.name).toBe('Acme')
      expect(result.legalName).toBe('')
      expect(result.inn).toBe('')
      expect(result.bankBik).toBe('')
      expect(result.website).toBe('')
    })

    it('preserves all 13 fields from full input', () => {
      expect(toCompanyData(FILLED)).toEqual(FILLED)
    })

    it('coerces non-string field values to strings', () => {
      const result = toCompanyData({ inn: 7701234567 })
      expect(result.inn).toBe('7701234567')
    })
  })

  describe('templatePayload', () => {
    it('returns empty payload for null row', () => {
      expect(templatePayload(null)).toEqual({
        company: EMPTY_COMPANY_DATA,
        specification: [],
      })
    })

    it('returns empty payload for empty object', () => {
      expect(templatePayload({})).toEqual({
        company: EMPTY_COMPANY_DATA,
        specification: [],
      })
    })

    it('returns empty payload when data is null', () => {
      expect(templatePayload({ data: null })).toEqual({
        company: EMPTY_COMPANY_DATA,
        specification: [],
      })
    })

    it('returns empty company when data.company is null', () => {
      expect(templatePayload({ data: { company: null } }).company).toEqual(
        EMPTY_COMPANY_DATA,
      )
    })

    it('decodes full ООО ТехноГрупп row', () => {
      const row = {
        id: 'bc58696d-1e12-48fc-814d-88abdea02797',
        name: 'ООО «ТехноГрупп»',
        role: 'client',
        data: {
          company: FILLED,
          specification: [],
        },
      }
      const payload = templatePayload(row)
      expect(payload.company).toEqual(FILLED)
      expect(payload.specification).toEqual([])
    })

    it('preserves specification array as-is', () => {
      const items = [
        { name: 'Item 1', quantity: 2 },
        { name: 'Item 2', quantity: 5 },
      ]
      const payload = templatePayload({ data: { specification: items } })
      expect(payload.specification).toEqual(items)
    })

    it('coerces non-array specification to empty array', () => {
      expect(
        templatePayload({ data: { specification: 'not-an-array' } }).specification,
      ).toEqual([])
    })
  })

  describe('buildTemplateRow', () => {
    it('builds row with all fields and defaults', () => {
      const row = buildTemplateRow({
        user_id: 'user-123',
        name: 'My template',
        companyData: FILLED,
      })
      expect(row).toEqual({
        user_id: 'user-123',
        name: 'My template',
        description: null,
        role: 'client',
        data: {
          company: FILLED,
          specification: [],
        },
      })
    })

    it('respects explicit description and role', () => {
      const row = buildTemplateRow({
        user_id: 'user-123',
        name: 'Supplier template',
        description: 'для оптовых закупок',
        role: 'supplier',
        companyData: FILLED,
        specification: [{ name: 'Steel' }],
      })
      expect(row.description).toBe('для оптовых закупок')
      expect(row.role).toBe('supplier')
      expect(row.data.specification).toEqual([{ name: 'Steel' }])
    })

    it('normalizes empty companyData to EMPTY_COMPANY_DATA', () => {
      const row = buildTemplateRow({
        user_id: 'u',
        name: 'n',
        companyData: null,
      })
      expect(row.data.company).toEqual(EMPTY_COMPANY_DATA)
    })
  })

  describe('round-trip', () => {
    it('buildTemplateRow → templatePayload preserves company data', () => {
      const row = buildTemplateRow({
        user_id: 'u',
        name: 'n',
        companyData: FILLED,
        specification: [{ code: 'SKU-1' }],
      })
      const payload = templatePayload(row)
      expect(payload.company).toEqual(FILLED)
      expect(payload.specification).toEqual([{ code: 'SKU-1' }])
    })
  })
})
