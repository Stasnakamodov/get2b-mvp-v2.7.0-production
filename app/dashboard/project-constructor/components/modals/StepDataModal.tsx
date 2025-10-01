'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StepDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepDataToView: {
    stepId: number;
    data: any;
  } | null;
}

export default function StepDataModal({
  isOpen,
  onClose,
  stepDataToView,
}: StepDataModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            Данные шага {stepDataToView?.stepId === 1 ? 'I (Данные клиента)' : stepDataToView?.stepId === 2 ? 'II (Спецификация)' : stepDataToView?.stepId}
          </DialogTitle>
          <DialogDescription>
            Просмотр всех данных, заполненных для этого шага
          </DialogDescription>
        </DialogHeader>

        {stepDataToView && (
          <div className="space-y-6">
            {/* JSON представление данных */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Структура данных (JSON)</h3>
              <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-auto max-h-64">
                {JSON.stringify(stepDataToView.data, null, 2)}
              </pre>
            </div>

            {/* Детальный просмотр для шага 1 */}
            {stepDataToView.stepId === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">Основная информация</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Название:</span> {stepDataToView.data.name || 'Не указано'}</div>
                    <div><span className="font-medium">Юридическое название:</span> {stepDataToView.data.legal_name || 'Не указано'}</div>
                    <div><span className="font-medium">ИНН:</span> {stepDataToView.data.inn || 'Не указано'}</div>
                    <div><span className="font-medium">КПП:</span> {stepDataToView.data.kpp || 'Не указано'}</div>
                    <div><span className="font-medium">ОГРН:</span> {stepDataToView.data.ogrn || 'Не указано'}</div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-800 mb-3">Банковские реквизиты</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Банк:</span> {stepDataToView.data.bank_name || 'Не указано'}</div>
                    <div><span className="font-medium">Расчетный счет:</span> {stepDataToView.data.bank_account || 'Не указано'}</div>
                    <div><span className="font-medium">БИК:</span> {stepDataToView.data.bik || 'Не указано'}</div>
                    <div><span className="font-medium">Корр. счет:</span> {stepDataToView.data.corr_account || 'Не указано'}</div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-800 mb-3">Контакты</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Email:</span> {stepDataToView.data.email || 'Не указано'}</div>
                    <div><span className="font-medium">Телефон:</span> {stepDataToView.data.phone || 'Не указано'}</div>
                    <div><span className="font-medium">Сайт:</span> {stepDataToView.data.website || 'Не указано'}</div>
                    <div><span className="font-medium">Директор:</span> {stepDataToView.data.director || 'Не указано'}</div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-orange-800 mb-3">Адрес</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Адрес:</span> {stepDataToView.data.legal_address || 'Не указано'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Детальный просмотр для шага 2 */}
            {stepDataToView.stepId === 2 && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">Информация о поставщике</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Поставщик:</span> {
                      stepDataToView.data.supplier ||
                      stepDataToView.data.supplier_name ||
                      'Не указано'
                    }</div>
                    <div><span className="font-medium">Валюта:</span> {stepDataToView.data.currency || 'Не указано'}</div>
                  </div>
                </div>

                {stepDataToView.data.items && stepDataToView.data.items.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-800 mb-3">Товары ({stepDataToView.data.items.length})</h3>
                    <div className="space-y-3">
                      {stepDataToView.data.items.map((item: any, index: number) => (
                        <div key={index} className="bg-white rounded p-3 border">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div><span className="font-medium">Название:</span> {item.name || item.item_name || 'Не указано'}</div>
                            <div><span className="font-medium">Код:</span> {item.code || item.item_code || 'Не указано'}</div>
                            <div><span className="font-medium">Количество:</span> {item.quantity || 'Не указано'}</div>
                            <div><span className="font-medium">Цена:</span> {item.price || 'Не указано'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Детальный просмотр для шага 4 */}
            {stepDataToView.stepId === 4 && (
              <div className="space-y-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-indigo-800 mb-3">Способ оплаты</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Метод:</span> {
                      stepDataToView.data.method === 'bank-transfer' ? 'Банковский перевод' :
                      stepDataToView.data.method === 'p2p' ? 'P2P платеж' :
                      stepDataToView.data.method === 'crypto' ? 'Криптовалюта' :
                      stepDataToView.data.method || 'Не указано'
                    }</div>
                    <div><span className="font-medium">Поставщик:</span> {
                      stepDataToView.data.supplier ||
                      stepDataToView.data.supplier_name ||
                      stepDataToView.data.recipientName ||
                      'Не указано'
                    }</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
