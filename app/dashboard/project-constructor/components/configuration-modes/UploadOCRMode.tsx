'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  X,
  Eye,
  Upload,
  Loader,
  CheckCircle,
  Clock
} from 'lucide-react'

interface UploadOCRModeProps {
  lastHoveredStep: number | null
  ocrAnalyzing: Record<number, boolean>
  uploadedFiles: Record<number, string>
  ocrError: Record<number, string>
  ocrDebugData: Record<number, any>
  hasManagerReceipt: boolean
  clientReceiptUrl: string | null
  clientReceiptUploadError: string | null
  isUploadingClientReceipt: boolean
  onFileUpload: (stepId: number, file: File) => void
  onClose: () => void
  onClientReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveClientReceipt: () => void
  onShowProjectDetails: () => void
}

/**
 * MODE 4: Upload/OCR Interface
 * Component for document upload and OCR analysis
 * Extracted from monolithic page.tsx (lines 2204-2445)
 */
export function UploadOCRMode({
  lastHoveredStep,
  ocrAnalyzing,
  uploadedFiles,
  ocrError,
  ocrDebugData,
  hasManagerReceipt,
  clientReceiptUrl,
  clientReceiptUploadError,
  isUploadingClientReceipt,
  onFileUpload,
  onClose,
  onClientReceiptUpload,
  onRemoveClientReceipt,
  onShowProjectDetails
}: UploadOCRModeProps) {
  if (!lastHoveredStep) return null

  return (
    <div>
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700">Загрузка документа</h4>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {lastHoveredStep === 1 ? "Анализ карточки компании" : "Анализ спецификации"}
            </h3>
            <p className="text-sm text-slate-600">
              {lastHoveredStep === 1
                ? "Загрузите документ компании для автоматического извлечения данных"
                : "Загрузите инвойс или спецификацию для автоматического заполнения"
              }
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Drag & Drop zone */}
          <div
            className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                onFileUpload(lastHoveredStep, files[0]);
              }
            }}
            onClick={() => document.getElementById(`ocr-file-input-${lastHoveredStep}`)?.click()}
          >
            <Upload className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              Перетащите файл сюда или нажмите для выбора
            </p>
            <p className="text-sm text-slate-500">
              Поддерживаемые форматы: PDF, JPG, PNG, XLSX, DOCX
            </p>
            <input
              id={`ocr-file-input-${lastHoveredStep}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx,.doc"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileUpload(lastHoveredStep, file);
                }
              }}
            />
          </div>

          {/* Supported documents info */}
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-medium text-orange-800 mb-2">
              {lastHoveredStep === 1 ? "Поддерживаемые документы:" : "Поддерживаемые документы:"}
            </h4>
            <ul className="text-sm text-orange-700 space-y-1">
              {lastHoveredStep === 1 ? (
                <>
                  <li>• Карточки компаний</li>
                  <li>• Свидетельства о регистрации</li>
                  <li>• Договоры с реквизитами</li>
                  <li>• Банковские документы</li>
                </>
              ) : (
                <>
                  <li>• Инвойсы (счета-фактуры)</li>
                  <li>• Спецификации товаров</li>
                  <li>• Коммерческие предложения</li>
                  <li>• Прайс-листы</li>
                </>
              )}
            </ul>
          </div>

          {/* Upload and analysis status */}
          {ocrAnalyzing[lastHoveredStep] && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 font-medium">Анализируем документ...</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Пожалуйста, подождите, извлекаем данные
              </p>
            </div>
          )}

          {/* Success status */}
          {uploadedFiles[lastHoveredStep] && !ocrAnalyzing[lastHoveredStep] && !ocrError[lastHoveredStep] && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Файл загружен и проанализирован</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Данные автоматически заполнены в форму
              </p>
            </div>
          )}

          {/* Error status */}
          {ocrError[lastHoveredStep] && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">Ошибка анализа</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                {ocrError[lastHoveredStep]}
              </p>

              {/* Debug information */}
              {ocrDebugData[lastHoveredStep] && (
                <details className="mt-3">
                  <summary className="text-sm text-red-700 cursor-pointer">
                    Показать отладочную информацию
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(ocrDebugData[lastHoveredStep], null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Step 7: Manager receipt upload */}
          {hasManagerReceipt && (
            <div className="mt-6">
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800">
                  <Upload className="h-4 w-4" />
                  Шаг 7: Загрузите чек о получении средств
                </h4>

                {!clientReceiptUrl ? (
                  <div className="space-y-3">
                    <p className="text-sm text-orange-700">
                      Пожалуйста, загрузите чек или скриншот, подтверждающий что вы получили средства от поставщика.
                    </p>

                    {clientReceiptUploadError && (
                      <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        {clientReceiptUploadError}
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={onClientReceiptUpload}
                        className="hidden"
                        id="client-receipt-upload"
                      />

                      <Button
                        onClick={() => document.getElementById('client-receipt-upload')?.click()}
                        disabled={isUploadingClientReceipt}
                        variant="outline"
                        className="w-full border-orange-300 hover:border-orange-400 text-orange-800"
                      >
                        {isUploadingClientReceipt ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Загружаю чек...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Выбрать файл чека
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        Поддерживаются: JPG, PNG, PDF (макс. 50 МБ)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800">Чек загружен и отправлен менеджеру</p>
                        <a
                          href={clientReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:underline text-sm"
                        >
                          Просмотреть загруженный чек →
                        </a>
                      </div>
                      <Button
                        onClick={onRemoveClientReceipt}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:border-red-400"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Удалить
                      </Button>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-700">
                        ✅ Ваш чек отправлен менеджеру. Теперь вы можете завершить проект.
                      </p>
                    </div>

                    {/* "More details" button */}
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={onShowProjectDetails}
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее о проекте
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
