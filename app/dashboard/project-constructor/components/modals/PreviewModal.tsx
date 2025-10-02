'use client';

import React from 'react';
import { Building, Banknote, Mail, Package, CreditCard, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type PreviewType = 'company' | 'bank' | 'contacts' | 'product' | 'payment' | 'requisites';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewType: PreviewType | null;
  previewData: any;
  handleEditData: (type: PreviewType) => void;
}

export default function PreviewModal({
  isOpen,
  onClose,
  previewType,
  previewData,
  handleEditData,
}: PreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {previewType === 'company' && <Building className="h-5 w-5 text-blue-500" />}
            {previewType === 'bank' && <Banknote className="h-5 w-5 text-green-500" />}
            {previewType === 'contacts' && <Mail className="h-5 w-5 text-purple-500" />}
            {previewType === 'product' && <Package className="h-5 w-5 text-green-500" />}
            {previewType === 'payment' && <CreditCard className="h-5 w-5 text-indigo-500" />}
            {previewType === 'requisites' && <Banknote className="h-5 w-5 text-green-500" />}
            {previewType === 'company' && 'Данные компании'}
            {previewType === 'bank' && 'Банковские реквизиты'}
            {previewType === 'contacts' && 'Контактная информация'}
            {previewType === 'product' && 'Спецификация товаров'}
            {previewType === 'payment' && 'Способ оплаты'}
            {previewType === 'requisites' && (previewData?.type === 'crypto' ? 'Криптореквизиты' :
                                             previewData?.type === 'p2p' ? 'P2P реквизиты' :
                                             'Банковские реквизиты')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {previewType === 'company' && previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Название компании</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.name && previewData.name.trim() !== '' ? previewData.name : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Юридическое название</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.legal_name || previewData.legalName) && (previewData.legal_name || previewData.legalName)?.trim() !== '' ? (previewData.legal_name || previewData.legalName) : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">ИНН</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.inn && previewData.inn.trim() !== '' ? previewData.inn : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">КПП</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.kpp && previewData.kpp.trim() !== '' ? previewData.kpp : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">ОГРН</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.ogrn && previewData.ogrn.trim() !== '' ? previewData.ogrn : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Юридический адрес</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.legal_address || previewData.address) && (previewData.legal_address || previewData.address)?.trim() !== '' ? (previewData.legal_address || previewData.address) : 'Не указано'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewType === 'bank' && previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Название банка</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.bank_name || previewData.bankName) && (previewData.bank_name || previewData.bankName)?.trim() !== '' ? (previewData.bank_name || previewData.bankName) : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Расчетный счет</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.bank_account || previewData.bankAccount) && (previewData.bank_account || previewData.bankAccount)?.trim() !== '' ? `${previewData.bank_account || previewData.bankAccount}` : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Корр. счет</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.corr_account || previewData.bankCorrAccount) && (previewData.corr_account || previewData.bankCorrAccount)?.trim() !== '' ? (previewData.corr_account || previewData.bankCorrAccount) : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">БИК</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.bik || previewData.bankBik) && (previewData.bik || previewData.bankBik)?.trim() !== '' ? (previewData.bik || previewData.bankBik) : 'Не указано'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewType === 'contacts' && previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.email && previewData.email.trim() !== '' ? previewData.email : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Телефон</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.phone && previewData.phone.trim() !== '' ? previewData.phone : 'Не указано'}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Веб-сайт</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.website && previewData.website.trim() !== '' ? previewData.website : 'Не указано'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewType === 'product' && previewData && (
            <div className="space-y-4">
              {/* Сводная информация по спецификации */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">Сводная информация по спецификации</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                    <div className="mt-1 p-3 bg-white rounded-lg">
                      {(previewData.supplier && previewData.supplier.trim() !== '') ||
                       (previewData.supplier_name && previewData.supplier_name.trim() !== '') ?
                        (previewData.supplier || previewData.supplier_name) : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Количество позиций</Label>
                    <div className="mt-1 p-3 bg-white rounded-lg">
                      {previewData.items && previewData.items.length > 0 ?
                        `${previewData.items.length} позиций` : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Общее количество товаров</Label>
                    <div className="mt-1 p-3 bg-white rounded-lg">
                      {previewData.items && previewData.items.length > 0 ?
                        `${previewData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0)} шт` : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Общая сумма</Label>
                    <div className="mt-1 p-3 bg-white rounded-lg font-semibold">
                      {previewData.totalAmount ? `${previewData.totalAmount} ${previewData.currency || 'RUB'}` :
                       (previewData.items && previewData.items.length > 0 ?
                        `${previewData.items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0)} ${previewData.currency || 'RUB'}` : 'Не указано')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Список товаров (если есть) */}
              {previewData.items && previewData.items.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-3">Список товаров ({previewData.items.length})</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {previewData.items.map((item: any, index: number) => (
                      <div key={index} className="bg-white rounded p-2 border text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.name || item.item_name || `Товар ${index + 1}`}</span>
                          <span className="text-gray-600">{item.quantity || 0} шт × {item.price || 0} = {item.total || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {previewType === 'payment' && previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Способ оплаты</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {previewData.method && previewData.method.trim() !== '' ?
                      (previewData.method === 'bank-transfer' ? 'Банковский перевод' :
                       previewData.method === 'p2p' ? 'P2P платеж' :
                       previewData.method === 'crypto' ? 'Криптовалюта' :
                       previewData.method) : 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.supplier && previewData.supplier.trim() !== '') ||
                     (previewData.supplier_name && previewData.supplier_name.trim() !== '') ||
                     (previewData.recipientName && previewData.recipientName.trim() !== '') ?
                      (previewData.supplier || previewData.supplier_name || previewData.recipientName) : 'Не указано'}
                  </div>
                </div>
                {previewData.project_info && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Источник данных</Label>
                    <div className="mt-1 p-3 bg-indigo-50 rounded-lg">
                      <div className="text-indigo-700">
                        <strong>Проект:</strong> {previewData.project_info.project_name || 'Не указан'}
                      </div>
                      <div className="text-indigo-600 text-sm">
                        <strong>Дата:</strong> {previewData.project_info.project_date ? new Date(previewData.project_info.project_date).toLocaleDateString('ru-RU') : 'Не указана'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {previewType === 'requisites' && previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Крипто реквизиты */}
                {previewData.type === 'crypto' ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Сеть</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {(previewData.crypto_network && previewData.crypto_network.trim() !== '') ?
                          previewData.crypto_network :
                          (previewData.crypto_name && previewData.crypto_name.trim() !== '') ?
                            previewData.crypto_name : 'Не указана'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Адрес кошелька</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {previewData.crypto_address && previewData.crypto_address.trim() !== '' ? previewData.crypto_address : 'Не указан'}
                      </div>
                    </div>
                  </>
                ) : previewData.type === 'p2p' ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Банк карты</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {previewData.card_bank && previewData.card_bank.trim() !== '' ? previewData.card_bank : 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Номер карты</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {previewData.card_number && previewData.card_number.trim() !== '' ? `${previewData.card_number}` : 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Держатель карты</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {previewData.card_holder && previewData.card_holder.trim() !== '' ? previewData.card_holder : 'Не указан'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Название банка</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {(previewData.bank_name || previewData.bankName) && (previewData.bank_name || previewData.bankName)?.trim() !== '' ? (previewData.bank_name || previewData.bankName) : 'Не указано'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Номер счета</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {(previewData.accountNumber || previewData.account_number) && (previewData.accountNumber || previewData.account_number)?.trim() !== '' ? `${previewData.accountNumber || previewData.account_number}` : 'Не указано'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">SWIFT/BIC</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {previewData.swift && previewData.swift.trim() !== '' ? previewData.swift : 'Не указано'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Получатель</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {(previewData.recipientName || previewData.recipient_name) && (previewData.recipientName || previewData.recipient_name)?.trim() !== '' ? (previewData.recipientName || previewData.recipient_name) : 'Не указано'}
                      </div>
                    </div>
                  </>
                )}

                {/* Общие поля для всех типов */}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {(previewData.supplier && previewData.supplier.trim() !== '') ||
                     (previewData.supplier_name && previewData.supplier_name.trim() !== '') ||
                     (previewData.recipientName && previewData.recipientName.trim() !== '') ?
                      (previewData.supplier || previewData.supplier_name || previewData.recipientName) : 'Не указано'}
                  </div>
                </div>
                {previewData.project_info && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Источник данных</Label>
                    <div className="mt-1 p-3 bg-indigo-50 rounded-lg">
                      <div className="text-indigo-700">
                        <strong>Проект:</strong> {previewData.project_info.project_name || 'Не указан'}
                      </div>
                      <div className="text-indigo-600 text-sm">
                        <strong>Дата:</strong> {previewData.project_info.project_date ? new Date(previewData.project_info.project_date).toLocaleDateString('ru-RU') : 'Не указана'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
            {previewType && (
              <Button onClick={() => handleEditData(previewType)} className="gap-2">
                <Edit className="h-4 w-4" />
                Редактировать
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
