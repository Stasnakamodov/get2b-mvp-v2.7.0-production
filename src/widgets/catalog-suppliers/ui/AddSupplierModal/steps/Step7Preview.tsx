/**
 * Шаг 7: Превью данных поставщика
 * FSD: widgets/catalog-suppliers/ui/AddSupplierModal/steps
 */

import React from 'react'
import type { SupplierFormData } from '@/src/entities/supplier'

interface Step7PreviewProps {
  formData: SupplierFormData
}

export const Step7Preview: React.FC<Step7PreviewProps> = ({ formData }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Проверьте данные перед сохранением</h3>

      <div className="space-y-3">
        {/* Основная информация */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Основная информация</h4>
          <p><strong>Название:</strong> {formData.name}</p>
          <p><strong>Компания:</strong> {formData.company_name}</p>
          <p><strong>Категория:</strong> {formData.category}</p>
          <p><strong>Локация:</strong> {formData.country}, {formData.city}</p>
          {formData.description && (
            <p><strong>Описание:</strong> {formData.description}</p>
          )}
        </div>

        {/* Контакты */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Контакты</h4>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Телефон:</strong> {formData.phone}</p>
          <p><strong>Контактное лицо:</strong> {formData.contact_person}</p>
          {formData.website && (
            <p><strong>Веб-сайт:</strong> {formData.website}</p>
          )}
        </div>

        {/* Бизнес */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Бизнес</h4>
          <p><strong>Мин. заказ:</strong> {formData.min_order}</p>
          <p><strong>Время ответа:</strong> {formData.response_time}</p>
          <p><strong>Сотрудников:</strong> {formData.employees}</p>
          <p><strong>Год основания:</strong> {formData.established}</p>
        </div>

        {/* Сертификации */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Сертификации ({formData.certifications.length})</h4>
          <p>{formData.certifications.join(', ') || 'Не указаны'}</p>
        </div>

        {/* Товары */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Товары ({formData.products.length})</h4>
          {formData.products.length > 0 ? (
            formData.products.map((p, i) => (
              <p key={i}>{i + 1}. {p.name} - {p.price}</p>
            ))
          ) : (
            <p className="text-gray-500">Нет добавленных товаров</p>
          )}
        </div>

        {/* Платежные реквизиты */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Платежные реквизиты</h4>
          {formData.bank_name && formData.bank_account && (
            <div className="mb-2">
              <p className="font-medium">Банковский перевод:</p>
              <p>{formData.bank_name} - {formData.bank_account}</p>
              {formData.swift_code && <p>SWIFT: {formData.swift_code}</p>}
            </div>
          )}
          {formData.card_bank && formData.card_number && (
            <div className="mb-2">
              <p className="font-medium">P2P карта:</p>
              <p>{formData.card_bank} - {formData.card_number}</p>
              {formData.card_holder && <p>Владелец: {formData.card_holder}</p>}
            </div>
          )}
          {formData.crypto_network && formData.crypto_address && (
            <div className="mb-2">
              <p className="font-medium">Криптовалюта:</p>
              <p>{formData.crypto_network}</p>
              <p className="text-xs font-mono">{formData.crypto_address}</p>
            </div>
          )}
          {!formData.bank_name && !formData.card_bank && !formData.crypto_network && (
            <p className="text-gray-500">Не указаны</p>
          )}
        </div>
      </div>
    </div>
  )
}
