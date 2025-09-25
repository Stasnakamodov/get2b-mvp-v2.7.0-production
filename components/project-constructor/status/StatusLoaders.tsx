'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface StatusLoadersProps {
  projectRequestId?: string
  managerApprovalMessage?: string
  onRejectionReset?: () => void
}

export const WaitingApprovalLoader = ({ projectRequestId }: Pick<StatusLoadersProps, 'projectRequestId'>) => (
  <div className="max-w-2xl mx-auto">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-orange-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          Ожидание подтверждения менеджера
        </h3>

        <p className="text-gray-600 mb-6 leading-relaxed">
          Ваши данные отправлены на проверку менеджеру.
          Мы уведомим вас, как только получим подтверждение.
        </p>

        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-orange-700 font-medium">На рассмотрении</span>
            </div>
            <div className="text-orange-600 font-mono text-xs">
              ID: {projectRequestId?.slice(-8)}
            </div>
          </div>
          <div className="mt-2 text-xs text-orange-600">
            Статус: <span className="font-medium">waiting_approval</span>
          </div>
        </div>
      </div>
    </div>

    {/* Информационная панель */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Ожидание ответа</p>
            <p className="text-xs text-gray-500">Менеджер проверяет данные</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Обновление каждые 4 секунды...
        </div>
      </div>
    </div>
  </div>
)

export const WaitingManagerReceiptLoader = ({ projectRequestId }: Pick<StatusLoadersProps, 'projectRequestId'>) => (
  <div className="max-w-2xl mx-auto">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-green-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          Ожидание чека от менеджера
        </h3>

        <p className="text-gray-600 mb-6 leading-relaxed">
          Агент выполняет перевод поставщику и отправит чек.
          Мы уведомим вас, как только получим подтверждение.
        </p>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">В процессе</span>
            </div>
            <div className="text-green-600 font-mono text-xs">
              ID: {projectRequestId?.slice(-8)}
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600">
            Статус: <span className="font-medium">waiting_manager_receipt</span>
          </div>
        </div>
      </div>
    </div>

    {/* Информационная панель */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Выполняется перевод</p>
            <p className="text-xs text-gray-500">Агент переводит средства поставщику</p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Обновление каждые 5 секунд...
        </div>
      </div>
    </div>
  </div>
)

export const RejectionMessage = ({
  managerApprovalMessage,
  onRejectionReset
}: Pick<StatusLoadersProps, 'managerApprovalMessage' | 'onRejectionReset'>) => (
  <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-white rounded-lg shadow-lg">
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
      <X className="h-8 w-8 text-red-500" />
    </div>
    <div className="text-center">
      <h3 className="text-xl font-semibold text-red-700 mb-2">
        Запрос отклонен
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {managerApprovalMessage || 'Менеджер отклонил ваш запрос. Проверьте данные и попробуйте снова.'}
      </p>
      <Button
        onClick={onRejectionReset}
        className="bg-red-500 hover:bg-red-600"
      >
        Вернуться к редактированию
      </Button>
    </div>
  </div>
)