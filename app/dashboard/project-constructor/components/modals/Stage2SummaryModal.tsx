'use client';

import React from 'react';
import { CheckCircle, Building, FileText, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Stage2SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualData: Record<number, any>;
  proceedToStage3: () => void;
}

export default function Stage2SummaryModal({
  isOpen,
  onClose,
  manualData,
  proceedToStage3,
}: Stage2SummaryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Сводка этапа 2: Подготовка инфраструктуры
          </DialogTitle>
          <DialogDescription>
            Все данные проверены и одобрены! Готовы к переходу к анимации сделки.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Статус одобрения */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-green-700 font-medium">✅ Все проверки пройдены</p>
                <p className="text-green-600 text-sm">
                  • Атомарный конструктор одобрен менеджером<br/>
                  • Чек об оплате подтвержден<br/>
                  • Реквизиты проверены и корректны
                </p>
              </div>
            </div>
          </div>

          {/* Краткая сводка по шагам */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Шаг 1 - Компания */}
            {manualData[1] && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Шаг 1: Компания
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Название:</span> {manualData[1].name || 'Не указано'}</div>
                  <div><span className="font-medium">ИНН:</span> {manualData[1].inn || 'Не указано'}</div>
                  <div><span className="font-medium">Email:</span> {manualData[1].email || 'Не указано'}</div>
                </div>
              </div>
            )}

            {/* Шаг 2 - Спецификация */}
            {manualData[2] && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Шаг 2: Спецификация
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Поставщик:</span> {manualData[2].supplier || 'Не указан'}</div>
                  <div><span className="font-medium">Валюта:</span> {manualData[2].currency || 'Не указана'}</div>
                  <div><span className="font-medium">Товаров:</span> {manualData[2].items?.length || 0}</div>
                </div>
              </div>
            )}

            {/* Шаг 4 - Способ оплаты */}
            {manualData[4] && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Шаг 4: Способ оплаты
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Метод:</span> {
                    manualData[4].method === 'bank-transfer' ? 'Банковский перевод' :
                    manualData[4].method === 'p2p' ? 'P2P платеж' :
                    manualData[4].method === 'crypto' ? 'Криптовалюта' :
                    manualData[4].method || 'Не указано'
                  }</div>
                  <div><span className="font-medium">Поставщик:</span> {manualData[4].supplier || 'Не указан'}</div>
                </div>
              </div>
            )}

            {/* Шаг 5 - Реквизиты */}
            {manualData[5] && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Шаг 5: Реквизиты
                </h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Банк:</span> {manualData[5].bankName || 'Не указан'}</div>
                  <div><span className="font-medium">Счет:</span> {manualData[5].accountNumber || 'Не указан'}</div>
                  <div><span className="font-medium">SWIFT:</span> {manualData[5].swift || 'Не указан'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Информация о платеже */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-yellow-800 font-medium">💳 Платеж подтвержден</p>
                <p className="text-yellow-700 text-sm">
                  Чек об оплате загружен и одобрен менеджером. Все готово для перехода к анимации сделки.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={proceedToStage3} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            🎬 Перейти к анимации сделки
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
