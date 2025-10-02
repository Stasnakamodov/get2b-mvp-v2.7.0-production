"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { PaymentDetailsCard } from '@/components/project-constructor/PaymentDetailsCard'
import { sendTelegramMessage } from '@/utils/ApiUtils'
import { cleanProjectRequestId } from "@/utils/IdUtils"
import type { SupabaseClient } from '@supabase/supabase-js'

interface PaymentFormProps {
  receiptApprovalStatus: string | null
  setReceiptApprovalStatus: React.Dispatch<React.SetStateAction<"pending" | "waiting" | "approved" | "rejected" | null>>
  projectRequestId: string
  manualData: Record<number, any>
  setCurrentStage: (stage: number) => void
  uploadSupplierReceipt: (file: File) => Promise<string | null>
  supabase: SupabaseClient
  POLLING_INTERVALS: { PROJECT_STATUS_CHECK: number }
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  receiptApprovalStatus,
  setReceiptApprovalStatus,
  projectRequestId,
  manualData,
  setCurrentStage,
  uploadSupplierReceipt,
  supabase,
  POLLING_INTERVALS
}) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [projectStatus, setProjectStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Используем глобальное состояние вместо локального
  const isWaitingApproval = receiptApprovalStatus === 'waiting'

  // Получаем данные для платёжки из атомарного конструктора
  const companyData = manualData[1] || {}
  const specificationData = manualData[2] || {}
  const items = specificationData.items || []
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)

  // Polling статуса проекта (используем обычную логику проектов)
  useEffect(() => {
    if (receiptApprovalStatus !== 'waiting' || !projectRequestId) return

    const checkStatus = async () => {
      try {
        // Ищем проект по atomic_request_id
        const { data, error } = await supabase
          .from('projects')
          .select('status, atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
          .single()

        if (error) {
          console.error('❌ Ошибка проверки статуса:', error)
          return
        }

        if (data) {
          // Используем обычный статус проекта для логики чеков
          if (data.status === 'receipt_approved') {
            setReceiptApprovalStatus('approved')
            if (pollingRef.current) clearInterval(pollingRef.current)

            // Переходим к следующему этапу (анимация сделки)
            setCurrentStage(3)
            console.log('✅ Чек одобрен - переходим к этапу 3')
          }

          if (data.status === 'receipt_rejected') {
            setReceiptApprovalStatus('rejected')
            if (pollingRef.current) clearInterval(pollingRef.current)
            setError('Чек отклонён менеджером. Пожалуйста, загрузите новый чек.')
          }
        }
      } catch (error) {
        console.error('❌ Ошибка polling статуса:', error)
      }
    }

    pollingRef.current = setInterval(checkStatus, POLLING_INTERVALS.PROJECT_STATUS_CHECK)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [receiptApprovalStatus, projectRequestId, setCurrentStage, setReceiptApprovalStatus, supabase, POLLING_INTERVALS])

  // Загрузка чека (использует ту же логику, что и обычный стартап проектов)
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setReceiptFile(file)

    try {
      // Загружаем файл через хук
      const fileUrl = await uploadSupplierReceipt(file)
      if (!fileUrl) throw new Error("Не удалось получить URL файла")

      setReceiptUrl(fileUrl)
      setReceiptApprovalStatus('waiting')

      // Отправляем чек менеджеру через Telegram
      await sendTelegramMessage({
        endpoint: 'telegram/send-receipt',
        payload: {
          projectRequestId,
          receiptUrl: fileUrl,
          fileName: file.name
        }
      })

    } catch (error: any) {
      console.error('❌ Ошибка загрузки чека:', error)
      setError("Ошибка загрузки чека: " + error.message)
    } finally {
      console.log('🔍 Завершение загрузки, isUploading = false')
      setIsUploading(false)
    }
  }

  const handleRemoveReceiptFile = async () => {
    setReceiptFile(null)
    setReceiptUrl(null)
    setReceiptApprovalStatus(null)
    setProjectStatus(null)
    setError(null)
  }


  return (
    <div className="max-w-2xl mx-auto mt-8 text-gray-900">
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <span className="text-blue-800">
            {isWaitingApproval
              ? "Чек загружен, ожидаем подтверждения менеджера"
              : "Ожидаем загрузки чека об оплате"}
          </span>
        </div>

        {/* Платёжка */}
        <div id="payment-details-html">
          <PaymentDetailsCard
            companyData={companyData}
            items={items}
            totalAmount={totalAmount}
            projectRequestId={projectRequestId}
          />
        </div>

        {/* Форма загрузки чека или лоудер */}
        {!isWaitingApproval ? (
          <div className="bg-white rounded-lg p-6 mb-6 flex flex-col items-center border border-gray-200">
            <Label className="mb-2 text-lg font-semibold">Загрузите чек</Label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleReceiptFileChange}
            />
            {!receiptUrl ? (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mb-2 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Upload className="w-5 h-5 mr-2"/> Загрузить чек
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Посмотреть чек
                </a>
                <Button variant="destructive" onClick={handleRemoveReceiptFile}>
                  Удалить чек
                </Button>
              </div>
            )}
            {isUploading && <div className="text-blue-500 mt-2">Загрузка...</div>}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Ожидание подтверждения оплаты
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  Ваш чек успешно загружен и отправлен менеджеру на проверку.
                  Мы уведомим вас, как только получим подтверждение.
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-blue-700 font-medium">На проверке</span>
                    </div>
                    <div className="text-blue-600 font-mono text-xs">
                      ID: {projectRequestId?.slice(-8)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    Статус: <span className="font-medium">waiting_receipt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Информационная панель */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Ожидание ответа</p>
                    <p className="text-xs text-gray-500">Менеджер проверяет чек</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Обновление каждые 4 секунды...
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            {projectStatus === 'approved' && (
              <div className="mt-6 text-center">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setCurrentStage(3)}
                >
                  Перейти к анимации сделки
                </Button>
              </div>
            )}
            {projectStatus === 'rejected' && (
              <div className="mt-6 text-center">
                <div className="text-red-600 font-semibold mb-2">Атомарный конструктор отклонён менеджером</div>
                <div className="text-gray-700 text-sm mb-4">
                  Пожалуйста, внесите изменения и отправьте повторно.
                </div>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={handleRemoveReceiptFile}
                >
                  Загрузить новый чек
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Дебаг-поле для вывода ошибок */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm whitespace-pre-wrap">
            <b>Ошибка:</b> {error}
          </div>
        )}
      </div>
    </div>
  )
}
