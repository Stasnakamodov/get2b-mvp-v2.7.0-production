'use client';

import React from 'react';
import { CheckCircle, Building, FileText, CreditCard, Banknote, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { PartialStepConfigs } from '@/types/project-constructor.types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualData: Record<number, any>;
  stepConfigs: PartialStepConfigs;
  getSourceDisplayName: (source: string) => string;
  returnToStage1Editing: () => void;
  goToNextStage: () => void;
}

export default function SummaryModal({
  isOpen,
  onClose,
  manualData,
  stepConfigs,
  getSourceDisplayName,
  returnToStage1Editing,
  goToNextStage,
}: SummaryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Предварительная сводка атомарной сделки
          </DialogTitle>
          <DialogDescription>
            Все основные данные собраны! Проверьте информацию перед подготовкой инфраструктуры.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Шаг 1 - Данные компании */}
          {manualData[1] && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-500" />
                  Шаг 1: Данные компании
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    Источник: {getSourceDisplayName(stepConfigs[1] || 'manual')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Название компании</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[1].name || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Юридическое название</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[1].legalName || manualData[1].legal_name || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">ИНН</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[1].inn || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[1].email || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Телефон</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[1].phone || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Юридический адрес</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[1].address || manualData[1].legal_address || 'Не указано'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Шаг 2 - Спецификация товаров */}
          {manualData[2] && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  Шаг 2: Спецификация товаров
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                    Источник: {getSourceDisplayName(stepConfigs[2] || 'manual')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[2].supplier || 'Не указан'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Валюта</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[2].currency || 'Не указана'}
                  </div>
                </div>
              </div>
              {manualData[2].items && manualData[2].items.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Товары</Label>
                  <div className="mt-2 space-y-2">
                    {manualData[2].items.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{item.name || item.item_name || 'Без названия'}</span>
                          <span className="text-sm text-gray-600">{item.quantity || 0} шт.</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Цена: {item.price || 0} {manualData[2]?.currency || 'RUB'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Шаг 4 - Способ оплаты */}
          {manualData[4] && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  Шаг 4: Способ оплаты
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                    Источник: {getSourceDisplayName(stepConfigs[4] || 'manual')}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Метод оплаты</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {manualData[4].payment_method || manualData[4].method || 'Не указан'}
                </div>
              </div>
            </div>
          )}

          {/* Шаг 5 - Реквизиты */}
          {manualData[5] && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-orange-500" />
                  Шаг 5: {manualData[5].type === 'crypto' ? 'Криптореквизиты' :
                          manualData[5].type === 'p2p' ? 'P2P реквизиты' :
                          'Банковские реквизиты'}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                    Источник: {getSourceDisplayName(stepConfigs[5] || 'manual')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {manualData[5].type === 'crypto' ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Сеть</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {manualData[5].crypto_network || 'Не указана'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Адрес</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                        {manualData[5].crypto_address || 'Не указан'}
                      </div>
                    </div>
                  </>
                ) : manualData[5].type === 'p2p' ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Банк</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {manualData[5].card_bank || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Номер карты</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                        {manualData[5].card_number || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Держатель</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {manualData[5].card_holder || 'Не указан'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Банк</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {manualData[5].bankName || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Получатель</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {manualData[5].recipientName || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Номер счета</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                        {manualData[5].accountNumber || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">SWIFT</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                        {manualData[5].swift || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">IBAN</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg font-mono">
                        {manualData[5].iban || 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Валюта перевода</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        {manualData[5].transferCurrency || 'Не указана'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Статистика сделки */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Статистика сделки</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Заполнено шагов:</span>
                <p className="text-blue-900">4 из 7</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Прогресс:</span>
                <p className="text-blue-900">57%</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Статус:</span>
                <p className="text-blue-900">Готово к подготовке инфраструктуры</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t relative z-50">
          <Button
            variant="outline"
            onClick={returnToStage1Editing}
            className="relative z-50"
          >
            Отмена
          </Button>
          <Button
            onClick={goToNextStage}
            className="gap-2 relative z-50"
          >
            <ArrowRight className="h-4 w-4" />
            Перейти к подготовке инфраструктуры
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
