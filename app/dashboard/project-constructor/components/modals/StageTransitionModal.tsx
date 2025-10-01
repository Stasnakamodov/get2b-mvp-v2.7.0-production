'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: number;
  dontShowStageTransition: boolean;
  setDontShowStageTransition: (value: boolean) => void;
  returnToStage1Editing: () => void;
  proceedToStage2: () => void;
}

export default function StageTransitionModal({
  isOpen,
  onClose,
  currentStage,
  dontShowStageTransition,
  setDontShowStageTransition,
  returnToStage1Editing,
  proceedToStage2,
}: StageTransitionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            Переход на следующий этап
          </DialogTitle>
          <DialogDescription>
            {currentStage === 1
              ? "Вы готовы перейти к подготовке инфраструктуры. Все основные данные собраны!"
              : "Вы готовы перейти к анимации сделки. Инфраструктура настроена!"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Текущий этап */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-500 text-white flex items-center justify-center text-sm font-bold">
                {currentStage}
              </div>
              Текущий этап: {currentStage === 1 ? 'Подготовка данных' : 'Подготовка инфраструктуры'}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              {currentStage === 1 ? (
                <>
                  <p>✅ Шаг 1: Данные компании - заполнен</p>
                  <p>✅ Шаг 2: Спецификация товаров - заполнен</p>
                  <p>✅ Шаг 4: Способ оплаты - заполнен</p>
                  <p>✅ Шаг 5: Реквизиты - заполнен</p>
                </>
              ) : (
                <>
                  <p>✅ Шаг 3: Документы - настроен</p>
                  <p>✅ Шаг 6: Получение средств - настроено</p>
                  <p>✅ Шаг 7: Подтверждение - настроено</p>
                </>
              )}
            </div>
          </div>

          {/* Следующий этап */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                {currentStage + 1}
              </div>
              Следующий этап: {currentStage === 1 ? 'Подготовка инфраструктуры' : 'Анимация сделки'}
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              {currentStage === 1 ? (
                <>
                  <p>🔧 Шаг 3: Загрузка документов</p>
                  <p>🔧 Шаг 6: Настройка получения средств</p>
                  <p>🔧 Шаг 7: Настройка подтверждения</p>
                  <p className="font-medium mt-2">Все шаги станут доступными для настройки</p>
                </>
              ) : (
                <>
                  <p>🎬 Блок 2 превратится в анимацию сделки</p>
                  <p>🎬 Реальное отслеживание статуса</p>
                  <p>🎬 Интерактивные уведомления</p>
                  <p className="font-medium mt-2">Сделка перейдет в активную фазу</p>
                </>
              )}
            </div>
          </div>

          {/* Предупреждение */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                !
              </div>
              <div>
                <h5 className="font-medium text-yellow-900 mb-1">Внимание</h5>
                <p className="text-sm text-yellow-700">
                  {currentStage === 1
                    ? "После перехода данные будут отправлены менеджеру на проверку. Ожидайте подтверждения."
                    : "После перехода сделка станет активной. Убедитесь, что все настройки корректны."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Галочка "Больше не показывать" */}
          {currentStage === 1 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowStageTransition}
                onChange={(e) => setDontShowStageTransition(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="dontShowAgain" className="text-sm text-gray-600">
                Больше не показывать это окно
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={returnToStage1Editing}
          >
            Отмена
          </Button>
          <Button
            onClick={proceedToStage2}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight className="h-4 w-4" />
            {currentStage === 1 ? 'Продолжить' : 'Перейти к анимации сделки'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
