'use client'

import { useEffect, useMemo, useState } from 'react'
import { db } from '@/lib/db/client'
import { logger } from '@/src/shared/lib/logger'
import {
  buildSupplierRecommendation,
  type BuildInput,
  type CatalogSupplierInput,
  type EchoSupplierInput,
  type SupplierRecommendationResult,
} from '@/lib/suppliers/supplierRecommendationEngine'
import type { ParsedInvoice } from '@/lib/services/YandexGPTService'

/**
 * Преобразует supplierData (в любой из используемых shapes) в инпуты движка:
 * - catalog shape (с id / room_type / массивами реквизитов)
 * - OCR hints shape из invoiceHintsToSupplierData (source='ocr_invoice')
 */
function normalizeSupplierData(supplierData: any): {
  catalogSupplier: CatalogSupplierInput | null
  ocrInvoice: ParsedInvoice | null
} {
  if (!supplierData || typeof supplierData !== 'object') {
    return { catalogSupplier: null, ocrInvoice: null }
  }

  if (supplierData.source === 'ocr_invoice') {
    const firstBank = Array.isArray(supplierData.bank_accounts) ? supplierData.bank_accounts[0] : null
    if (!firstBank) return { catalogSupplier: null, ocrInvoice: null }
    const ocrInvoice: ParsedInvoice = {
      items: [],
      invoiceInfo: {
        seller: supplierData.name || supplierData.company_name || undefined,
        currency: firstBank.currency || undefined,
      },
      bankInfo: {
        bankName: firstBank.bank_name || '',
        accountNumber: firstBank.account_number || '',
        swift: firstBank.swift || '',
        recipientName: firstBank.recipient_name || '',
        recipientAddress: firstBank.recipient_address || '',
        transferCurrency: firstBank.currency || '',
      },
    }
    return { catalogSupplier: null, ocrInvoice }
  }

  return {
    catalogSupplier: {
      name: supplierData.name,
      company_name: supplierData.company_name,
      payment_methods: supplierData.payment_methods,
      bank_accounts: supplierData.bank_accounts,
      p2p_cards: supplierData.p2p_cards,
      crypto_wallets: supplierData.crypto_wallets,
    },
    ocrInvoice: null,
  }
}

async function loadEchoSupplier(projectId: string): Promise<EchoSupplierInput | null> {
  try {
    const { data: specs } = await db
      .from('project_specifications')
      .select('supplier_name')
      .eq('project_id', projectId)
      .not('supplier_name', 'is', null)
      .not('supplier_name', 'eq', '')

    if (!specs || specs.length === 0) return null

    const names = [...new Set(specs.map((s: any) => s.supplier_name))] as string[]
    if (names.length === 0) return null

    for (const name of names) {
      const safeName = name.replace(/%/g, '\\%').replace(/_/g, '\\_')
      const { data: rows } = await db
        .from('catalog_verified_suppliers')
        .select('id, name, company_name, payment_methods, bank_accounts, crypto_wallets, p2p_cards')
        .ilike('name', `%${safeName}%`)
        .limit(1)

      const hit = rows?.[0]
      if (hit) {
        return {
          name: hit.name || name,
          payment_methods: hit.payment_methods || [],
          bank_accounts: hit.bank_accounts || [],
          p2p_cards: hit.p2p_cards || [],
          crypto_wallets: hit.crypto_wallets || [],
        }
      }
    }
  } catch (error) {
    logger.error('[useSupplierRecommendation] echo lookup failed:', error)
  }
  return null
}

export interface UseSupplierRecommendationOptions {
  projectId: string | null | undefined
  supplierData: any
  enableEchoFallback?: boolean
}

export function useSupplierRecommendation(options: UseSupplierRecommendationOptions): {
  recommendation: SupplierRecommendationResult | null
  loading: boolean
} {
  const { projectId, supplierData, enableEchoFallback = true } = options

  const normalized = useMemo(() => normalizeSupplierData(supplierData), [supplierData])
  const [echoSupplier, setEchoSupplier] = useState<EchoSupplierInput | null>(null)
  const [loading, setLoading] = useState(false)

  const hasAnySupplierData = Boolean(normalized.catalogSupplier || normalized.ocrInvoice)

  useEffect(() => {
    let cancelled = false
    if (!enableEchoFallback || !projectId || hasAnySupplierData) {
      setEchoSupplier(null)
      return
    }
    setLoading(true)
    loadEchoSupplier(projectId)
      .then((result) => {
        if (!cancelled) setEchoSupplier(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, enableEchoFallback, hasAnySupplierData])

  const recommendation = useMemo(() => {
    const input: BuildInput = {
      catalogSupplier: normalized.catalogSupplier,
      ocrInvoice: normalized.ocrInvoice,
      echoSupplier,
    }
    if (!input.catalogSupplier && !input.ocrInvoice && !input.echoSupplier) {
      return null
    }
    return buildSupplierRecommendation(input)
  }, [normalized, echoSupplier])

  return { recommendation, loading }
}
