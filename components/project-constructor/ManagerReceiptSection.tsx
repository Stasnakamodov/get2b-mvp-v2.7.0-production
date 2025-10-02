import React from 'react'
import { Download, Upload, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WaitingManagerReceiptLoader } from '@/components/project-constructor/status/StatusLoaders'

interface ManagerReceiptSectionProps {
  hasManagerReceipt: boolean
  managerReceiptUrl: string | null
  isRequestSent: boolean
  showFullLoader: boolean
  setShowFullLoader: (show: boolean) => void
  projectRequestId: string
  sendManagerReceiptRequest: () => void
  setCurrentStage: (stage: number) => void
}

export const ManagerReceiptSection: React.FC<ManagerReceiptSectionProps> = ({
  hasManagerReceipt,
  managerReceiptUrl,
  isRequestSent,
  showFullLoader,
  setShowFullLoader,
  projectRequestId,
  sendManagerReceiptRequest,
  setCurrentStage
}) => {
  return (
    <div className="min-h-[400px] bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 relative overflow-hidden">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
          <Download className="h-5 w-5 text-green-600" />
          Шаг 6: Получение средств
        </h3>

        {hasManagerReceipt ? (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Чек от менеджера готов!</span>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Менеджер загрузил чек об оплате поставщику. Вы можете скачать его.
              </p>
              {managerReceiptUrl && (
                <Button
                  onClick={() => window.open(managerReceiptUrl, '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Скачать чек
                </Button>
              )}

              {/* Кнопка перехода на 7-й шаг */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-700 mb-3">
                    Теперь вы можете перейти к загрузке чека о получении средств от поставщика
                  </p>
                  <Button
                    onClick={() => setCurrentStage(4)}
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Перейти к Шагу 7: Загрузить чек о получении
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isRequestSent ? (
              <div className="space-y-4">
                {showFullLoader ? (
                  <WaitingManagerReceiptLoader projectRequestId={projectRequestId} />
                ) : (
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="font-semibold text-blue-800">Ожидаем чек от менеджера</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Агент выполняет перевод поставщику и отправит чек. Мы уведомим вас, когда чек будет готов.
                    </p>
                    <div className="mt-3 text-xs text-blue-600">
                      <strong>ID проекта:</strong> {projectRequestId}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullLoader(true)}
                      className="mt-3 text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Показать подробности
                    </Button>
                  </div>
                )}
                {showFullLoader && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullLoader(false)}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Скрыть подробности
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="font-semibold text-yellow-800">Готово к отправке запроса</span>
                </div>
                <p className="text-yellow-700 text-sm mb-3">
                  Нажмите кнопку ниже, чтобы отправить запрос менеджеру на загрузку чека.
                </p>
                <Button
                  onClick={sendManagerReceiptRequest}
                  disabled={isRequestSent}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  📤 Отправить запрос менеджеру
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
