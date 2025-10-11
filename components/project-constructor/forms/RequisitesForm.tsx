'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Eraser, Eye } from 'lucide-react'
import type { FormProps } from '@/types/project-constructor.types'

// Старый интерфейс для RequisitesForm (до рефакторинга типов)
interface LegacyRequisitesData {
  type?: 'bank' | 'p2p' | 'crypto'
  // Bank fields
  bankName?: string
  accountNumber?: string
  swift?: string
  iban?: string
  recipientName?: string
  recipientAddress?: string
  transferCurrency?: string
  // P2P fields
  card_bank?: string
  card_number?: string
  card_holder?: string
  card_expiry?: string
  // Crypto fields
  crypto_name?: string
  crypto_address?: string
  crypto_network?: string
  // Common
  supplier?: string
  supplier_name?: string
  suggested?: boolean
  source?: string
}

interface RequisitesFormProps extends FormProps<LegacyRequisitesData> {}

const RequisitesForm = ({ onSave, onCancel, initialData }: RequisitesFormProps) => {
  const requisiteType = initialData?.type || 'bank'

  const [formData, setFormData] = useState({
    type: requisiteType,
    // Bank fields
    bankName: initialData?.bankName || '',
    accountNumber: initialData?.accountNumber || '',
    swift: initialData?.swift || '',
    iban: initialData?.iban || '',
    recipientName: initialData?.recipientName || initialData?.supplier_name || '',
    recipientAddress: initialData?.recipientAddress || '',
    transferCurrency: initialData?.transferCurrency || 'USD',
    // P2P fields
    card_bank: initialData?.card_bank || '',
    card_number: initialData?.card_number || '',
    card_holder: initialData?.card_holder || initialData?.supplier_name || '',
    card_expiry: initialData?.card_expiry || '',
    // Crypto fields
    crypto_name: initialData?.crypto_name || 'USDT',
    crypto_address: initialData?.crypto_address || '',
    crypto_network: initialData?.crypto_network || 'TRC20',
    // Common
    supplier: initialData?.supplier || initialData?.supplier_name || initialData?.recipientName || ''
  })

  // Обновляем formData при изменении initialData (когда форма переоткрывается с сохранёнными данными)
  // Используем JSON.stringify для глубокого сравнения
  useEffect(() => {
    if (initialData) {
      console.log('🔍 [RequisitesForm] useEffect сработал, обновляем formData:', initialData);
      setFormData({
        type: initialData.type || requisiteType,
        // Bank fields
        bankName: initialData.bankName || '',
        accountNumber: initialData.accountNumber || '',
        swift: initialData.swift || '',
        iban: initialData.iban || '',
        recipientName: initialData.recipientName || initialData.supplier_name || '',
        recipientAddress: initialData.recipientAddress || '',
        transferCurrency: initialData.transferCurrency || 'USD',
        // P2P fields
        card_bank: initialData.card_bank || '',
        card_number: initialData.card_number || '',
        card_holder: initialData.card_holder || initialData.supplier_name || '',
        card_expiry: initialData.card_expiry || '',
        // Crypto fields
        crypto_name: initialData.crypto_name || 'USDT',
        crypto_address: initialData.crypto_address || '',
        crypto_network: initialData.crypto_network || 'TRC20',
        // Common
        supplier: initialData.supplier || initialData.supplier_name || initialData.recipientName || ''
      })
    }
  }, [JSON.stringify(initialData), requisiteType])

  // 🔥 НОВОЕ: Автоматически заполняем поставщика из получателя
  useEffect(() => {
    if (formData.recipientName && !formData.supplier) {
      setFormData(prev => ({ ...prev, supplier: formData.recipientName }));
    }
  }, [formData.recipientName, formData.supplier]);

  // Если есть предложение из OCR, показываем его
  const hasSuggestion = initialData?.suggested && initialData?.source === 'ocr_invoice';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...formData, suggested: false, source: 'manual' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Показываем предложение из OCR */}
      {hasSuggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Предложение из инвойса</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            На основе банковских реквизитов в инвойсе предлагаем:
          </p>
          <div className="bg-white border border-blue-300 rounded p-3 space-y-2">
            {initialData?.accountNumber && (
              <div>
                <span className="text-xs text-gray-600">Номер счета:</span>
                <p className="text-sm font-medium">{initialData.accountNumber}</p>
              </div>
            )}
            {initialData?.swift && (
              <div>
                <span className="text-xs text-gray-600">SWIFT код:</span>
                <p className="text-sm font-medium">{initialData.swift}</p>
              </div>
            )}
            {initialData?.recipientName && (
              <div>
                <span className="text-xs text-gray-600">Получатель:</span>
                <p className="text-sm font-medium">{initialData.recipientName}</p>
              </div>
            )}
            {initialData?.transferCurrency && (
              <div>
                <span className="text-xs text-gray-600">Валюта:</span>
                <p className="text-sm font-medium">{initialData.transferCurrency}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* БАНКОВСКИЕ РЕКВИЗИТЫ */}
      {requisiteType === 'bank' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Название банка</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Введите название банка"
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Номер счета *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                required
                placeholder="Введите номер счета"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="swift">SWIFT код</Label>
              <Input
                id="swift"
                value={formData.swift}
                onChange={(e) => setFormData(prev => ({ ...prev, swift: e.target.value }))}
                placeholder="Введите SWIFT код"
              />
            </div>
            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                placeholder="Введите IBAN"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientName">Полное наименование получателя</Label>
              <Input
                id="recipientName"
                value={formData.recipientName}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                placeholder="Введите название получателя"
              />
            </div>
            <div>
              <Label htmlFor="transferCurrency">Валюта перевода</Label>
              <select
                id="transferCurrency"
                value={formData.transferCurrency}
                onChange={(e) => setFormData(prev => ({ ...prev, transferCurrency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RUB">RUB</option>
                <option value="CNY">CNY</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* P2P КАРТА */}
      {requisiteType === 'p2p' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="card_bank">Банк карты *</Label>
              <Input
                id="card_bank"
                value={formData.card_bank}
                onChange={(e) => setFormData(prev => ({ ...prev, card_bank: e.target.value }))}
                required
                placeholder="Введите банк карты"
              />
            </div>
            <div>
              <Label htmlFor="card_number">Номер карты *</Label>
              <Input
                id="card_number"
                value={formData.card_number}
                onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                required
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="card_holder">Держатель карты</Label>
              <Input
                id="card_holder"
                value={formData.card_holder}
                onChange={(e) => setFormData(prev => ({ ...prev, card_holder: e.target.value }))}
                placeholder="IVAN IVANOV"
              />
            </div>
            <div>
              <Label htmlFor="card_expiry">Срок действия</Label>
              <Input
                id="card_expiry"
                value={formData.card_expiry}
                onChange={(e) => setFormData(prev => ({ ...prev, card_expiry: e.target.value }))}
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
          </div>
        </>
      )}

      {/* КРИПТОКОШЕЛЁК */}
      {requisiteType === 'crypto' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crypto_name">Криптовалюта *</Label>
              <select
                id="crypto_name"
                value={formData.crypto_name}
                onChange={(e) => setFormData(prev => ({ ...prev, crypto_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <div>
              <Label htmlFor="crypto_network">Сеть *</Label>
              <select
                id="crypto_network"
                value={formData.crypto_network}
                onChange={(e) => setFormData(prev => ({ ...prev, crypto_network: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="TRC20">TRC20 (TRON)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="BEP20">BEP20 (BSC)</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="crypto_address">Адрес кошелька *</Label>
            <Input
              id="crypto_address"
              value={formData.crypto_address}
              onChange={(e) => setFormData(prev => ({ ...prev, crypto_address: e.target.value }))}
              required
              placeholder="Введите адрес криптокошелька"
              className="font-mono"
            />
          </div>
        </>
      )}

      {/* Общее поле - Поставщик */}
      <div>
        <Label htmlFor="supplier">Поставщик</Label>
        <Input
          id="supplier"
          value={formData.supplier}
          onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
          placeholder="Введите название поставщика"
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => {
          console.log('🔍 [RequisitesForm] Нажата кнопка "Сохранить и вернуться"');
          console.log('  - formData:', formData);

          // Сохраняем данные (useStepData автоматически закроет форму)
          const dataToSave = { ...formData, suggested: false, source: 'manual' };
          console.log('  - dataToSave:', dataToSave);

          onSave(dataToSave);
          console.log('  - onSave вызван, форма закроется автоматически');
        }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Сохранить и вернуться
        </Button>
        <Button type="button" onClick={() => {
          setFormData({
            type: requisiteType,
            // Bank
            bankName: '',
            accountNumber: '',
            swift: '',
            iban: '',
            recipientName: '',
            recipientAddress: '',
            transferCurrency: 'USD',
            // P2P
            card_bank: '',
            card_number: '',
            card_holder: '',
            card_expiry: '',
            // Crypto
            crypto_name: 'USDT',
            crypto_address: '',
            crypto_network: 'TRC20',
            // Common
            supplier: ''
          })
        }}>
          <Eraser className="h-4 w-4 mr-2" />
          Очистить форму
        </Button>
      </div>
    </form>
  )
}

export default RequisitesForm