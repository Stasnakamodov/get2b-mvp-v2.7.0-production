'use client';

import React from 'react';
import { CheckCircle, CreditCard, Building } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RequisitesConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualData: Record<number, any>;
  editRequisites: () => void;
  confirmRequisites: () => void;
}

export default function RequisitesConfirmationModal({
  isOpen,
  onClose,
  manualData,
  editRequisites,
  confirmRequisites,
}: RequisitesConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Подтверждение реквизитов
          </DialogTitle>
          <DialogDescription>
            Проверьте, что все реквизиты указаны правильно и соответствуют данным поставщика.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Реквизиты из шага 5 */}
          {manualData[5] && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-500" />
                Банковские реквизиты
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Название банка</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[5].bankName || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Номер счета</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[5].accountNumber || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">SWIFT/BIC</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[5].swift || 'Не указано'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Получатель</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[5].recipientName || 'Не указано'}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Адрес получателя</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {manualData[5].recipientAddress || 'Не указано'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Данные поставщика для сравнения */}
          {manualData[2] && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-500" />
                Данные поставщика
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Поставщик</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    {manualData[2].supplier || 'Не указан'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Валюта</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                    {manualData[2].currency || 'Не указана'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={editRequisites}>
            ✏️ Редактировать
          </Button>
          <Button onClick={confirmRequisites}>
            ✅ Все правильно
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
