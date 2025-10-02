import React from 'react'
import { Upload, CheckCircle, X, Eye, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClientReceiptUploadSectionProps {
  clientReceiptUrl: string | null
  clientReceiptUploadError: string | null
  isUploadingClientReceipt: boolean
  handleClientReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveClientReceipt: () => void
  handleShowProjectDetails: () => void
  setCurrentStage: (stage: number) => void
}

export const ClientReceiptUploadSection: React.FC<ClientReceiptUploadSectionProps> = ({
  clientReceiptUrl,
  clientReceiptUploadError,
  isUploadingClientReceipt,
  handleClientReceiptUpload,
  handleRemoveClientReceipt,
  handleShowProjectDetails,
  setCurrentStage
}) => {
  return (
    <div className="min-h-[400px] bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-8 relative overflow-hidden">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
          <Upload className="h-5 w-5 text-orange-600" />
          Шаг 7: Подтверждение получения средств
        </h3>

        <div className="space-y-4">
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-800">
              <Upload className="h-4 w-4" />
              Загрузите чек о получении средств
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
                    onChange={handleClientReceiptUpload}
                    className="hidden"
                    id="client-receipt-upload-stage4"
                  />

                  <Button
                    onClick={() => document.getElementById('client-receipt-upload-stage4')?.click()}
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
                    onClick={handleRemoveClientReceipt}
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

                {/* Кнопка "Подробнее" */}
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={handleShowProjectDetails}
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

          {/* Кнопка возврата к 6-му шагу */}
          <div className="mt-4">
            <Button
              onClick={() => setCurrentStage(3)}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к Шагу 6
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
