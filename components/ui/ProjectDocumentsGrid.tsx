"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, ExternalLink, Download, CheckCircle, Clock, Calendar, Info, User, CreditCard, Banknote, X, ZoomIn, ZoomOut } from "lucide-react"

interface ProjectDocument {
  url?: string
  uploadedAt?: string
  stepNumber: number
  stepTitle: string
  stepDescription: string
}

interface StatusHistoryItem {
  status: string
  previous_status: string
  step: number
  changed_at: string
  changed_by: string | null
  comment: string | null
}

interface Project {
  id: string
  name: string
  company_data?: {
    name?: string
  }
  status: string
  current_step: number
  // Реальные поля документов из базы данных
  company_card_file?: string // Шаг 1: карточка компании
  receipts?: string // Шаг 3: чеки (может быть JSON)
  client_confirmation_url?: string // Шаг 7: подтверждение клиента
  // Дополнительные поля проекта для предосмотра
  payment_method?: string
  selected_requisite_type?: string
  amount?: number
  currency?: string
  // Временные метки
  created_at?: string
  updated_at?: string
}

interface ProjectDocumentsGridProps {
  project: Project
  statusHistory?: StatusHistoryItem[]
}

const ProjectDocumentsGrid: React.FC<ProjectDocumentsGridProps> = ({ project, statusHistory = [] }) => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [previewDocument, setPreviewDocument] = useState<{ url: string; title: string; type: string } | null>(null)

  // Обработка чеков из поля receipts (может быть JSON)
  const getReceiptData = () => {
    if (!project.receipts) return { client_receipt: null, manager_receipt: null }
    
    try {
      // Если receipts это JSON строка
      const receiptsData = JSON.parse(project.receipts)
      return {
        client_receipt: receiptsData.client_receipt || null,
        manager_receipt: receiptsData.manager_receipt || null
      }
    } catch {
      // Если receipts это простая строка (старый формат)
      return {
        client_receipt: project.receipts,
        manager_receipt: null
      }
    }
  }

  const { client_receipt, manager_receipt } = getReceiptData()

  // Вспомогательная функция для преобразования null в undefined
  const nullToUndefined = (value: string | null | undefined): string | undefined => {
    return value === null ? undefined : value
  }

  // Функция для получения даты завершения шага из истории статусов
  const getStepCompletionDate = (stepNumber: number): string | undefined => {
    // Определяем какие статусы означают завершение каждого шага
    const stepCompletionStatuses: Record<number, string[]> = {
      1: ["in_progress"], // Шаг 1 завершается при переходе к шагу 2
      2: ["waiting_approval"], // Шаг 2 завершается когда отправлено на одобрение
      3: ["receipt_approved"], // Шаг 3 завершается когда чек одобрен
      4: ["filling_requisites"], // Шаг 4 завершается когда начинается заполнение (метод выбран)
      5: ["waiting_manager_receipt"], // Шаг 5 завершается когда реквизиты заполнены
      6: ["in_work"], // Шаг 6 завершается когда чек менеджера загружен
      7: ["completed"] // Шаг 7 завершается при завершении проекта
    }

    const completionStatuses = stepCompletionStatuses[stepNumber]
    if (!completionStatuses) return undefined

    // Ищем в истории первое появление статуса завершения этого шага
    const completionEvent = statusHistory.find(item => 
      completionStatuses.includes(item.status)
    )

    return completionEvent ? completionEvent.changed_at : undefined
  }

  // Функция для получения детальной информации о шаге
  const getStepDetails = (stepNumber: number) => {
    const completionDate = getStepCompletionDate(stepNumber)
    
    switch (stepNumber) {
      case 1:
        return {
          title: "Данные клиента",
          details: project.company_data ? [
            `Название: ${project.company_data.name || 'Не указано'}`,
            `Создано: ${project.created_at ? new Date(project.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}`,
            project.company_card_file ? 'Файл карточки загружен' : 'Данные введены вручную'
          ] : ['Данные компании не заполнены'],
          hasDocument: !!project.company_card_file,
          documentUrl: nullToUndefined(project.company_card_file)
        }
      
      case 2:
        return {
          title: "Спецификация товаров",
          details: [
            'Товары добавлены в спецификацию',
            completionDate ? `Отправлено на одобрение: ${new Date(completionDate).toLocaleDateString('ru-RU')}` : 'В процессе заполнения'
          ],
          hasDocument: false,
          documentUrl: undefined
        }

      case 3:
        return {
          title: "Пополнение агента",
          details: client_receipt ? [
            'Чек оплаты загружен',
            `Сумма: ${project.amount || 0} ${project.currency || 'USD'}`,
            completionDate ? `Одобрено: ${new Date(completionDate).toLocaleDateString('ru-RU')}` : 'Ожидает одобрения'
          ] : ['Чек пополнения не загружен'],
          hasDocument: !!client_receipt,
          documentUrl: nullToUndefined(client_receipt)
        }

      case 4:
        const hasPaymentMethod = project.payment_method && 
                                 project.payment_method !== 'null' && 
                                 project.payment_method !== 'NULL' &&
                                 project.payment_method.trim() !== ''
        
        const result = {
          title: "Способ оплаты поставщику",
          details: hasPaymentMethod ? [
            `Выбранный метод: ${getPaymentMethodLabel(project.payment_method)}`
          ] : [
            'Способ оплаты не выбран'
          ],
          hasDocument: false,
          documentUrl: undefined
        }
        
        return result

      case 5:
        const hasRequisiteType = project.selected_requisite_type && project.selected_requisite_type !== 'null'
        return {
          title: "Реквизиты для отправки",
          details: hasRequisiteType ? [
            `Тип реквизитов: ${getRequisiteTypeLabel(project.selected_requisite_type)}`
          ] : [
            'Реквизиты не заполнены'
          ],
          hasDocument: false,
          documentUrl: undefined
        }

      case 6:
        return {
          title: "Получение средств поставщиком",
          details: manager_receipt ? [
            'Чек от менеджера получен',
            'Средства отправлены поставщику',
            completionDate ? `Получено: ${new Date(completionDate).toLocaleDateString('ru-RU')}` : 'В процессе'
          ] : ['Ожидается чек от менеджера'],
          hasDocument: !!manager_receipt,
          documentUrl: nullToUndefined(manager_receipt)
        }

      case 7:
        return {
          title: "Подтверждение завершения",
          details: project.client_confirmation_url ? [
            'Подтверждение от клиента получено',
            'Сделка завершена успешно',
            completionDate ? `Завершено: ${new Date(completionDate).toLocaleDateString('ru-RU')}` : 'В процессе'
          ] : ['Ожидается подтверждение от клиента'],
          hasDocument: !!project.client_confirmation_url,
          documentUrl: nullToUndefined(project.client_confirmation_url)
        }

      default:
        return {
          title: "Неизвестный шаг",
          details: ['Информация недоступна'],
          hasDocument: false,
          documentUrl: undefined
        }
    }
  }

  // Вспомогательные функции для читаемых названий
  const getPaymentMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      'bank-transfer': 'Банковский перевод',
      'p2p': 'P2P перевод',
      'crypto': 'Криптовалюта'
    }
    return labels[method || ''] || method || 'Не выбрано'
  }

  const getRequisiteTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      'bank': 'Банковские реквизиты',
      'p2p': 'P2P реквизиты', 
      'crypto': 'Криптовалютный адрес'
    }
    return labels[type || ''] || type || 'Не выбрано'
  }

  const documents: ProjectDocument[] = [
    {
      url: project.company_card_file,
      uploadedAt: getStepCompletionDate(1),
      stepNumber: 1,
      stepTitle: "Данные клиента",
      stepDescription: "Данные компании"
    },
    {
      url: undefined,
      uploadedAt: getStepCompletionDate(2),
      stepNumber: 2,
      stepTitle: "Спецификация",
      stepDescription: "Спецификация"
    },
    {
      url: client_receipt || undefined,
      uploadedAt: getStepCompletionDate(3),
      stepNumber: 3,
      stepTitle: "Пополнение агента",
      stepDescription: "Чек оплаты"
    },
    {
      url: undefined,
      uploadedAt: getStepCompletionDate(4),
      stepNumber: 4,
      stepTitle: "Метод",
      stepDescription: "Способ оплаты"
    },
    {
      url: undefined,
      uploadedAt: getStepCompletionDate(5),
      stepNumber: 5,
      stepTitle: "Реквизиты",
      stepDescription: "Банковские данные"
    },
    {
      url: manager_receipt || undefined,
      uploadedAt: getStepCompletionDate(6),
      stepNumber: 6,
      stepTitle: "Получение",
      stepDescription: "Чек поставщика"
    },
    {
      url: project.client_confirmation_url,
      uploadedAt: getStepCompletionDate(7),
      stepNumber: 7,
      stepTitle: "Подтверждение",
      stepDescription: "Завершение сделки"
    }
  ]

  const handleDocumentView = (url: string, title: string = "Документ") => {
    const fileExtension = url.split('.').pop()?.toLowerCase() || 'unknown'
    setPreviewDocument({
      url: url,
      title: title,
      type: fileExtension
    })
  }

  const handleClosePreview = () => {
    setPreviewDocument(null)
  }

  const handleDocumentDownload = async (url: string, stepTitle: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${project.name}_${stepTitle}_${new Date().toISOString().split('T')[0]}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Ошибка скачивания документа:', error)
    }
  }

  const handleStepClick = (stepNumber: number) => {
    setSelectedStep(selectedStep === stepNumber ? null : stepNumber)
  }

  const selectedStepDetails = selectedStep ? getStepDetails(selectedStep) : null

  // Компонент для предосмотра документа
  const DocumentPreviewModal = ({ document, onClose }: { document: { url: string; title: string; type: string } | null; onClose: () => void }) => {
    if (!document) return null

    const isImage = document.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
    const isPDF = document.url.toLowerCase().includes('.pdf')

    return (
      <Dialog open={!!document} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {document.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDocumentDownload(document.url, document.title)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Скачать
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(document.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Открыть в новой вкладке
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4">
            {isImage ? (
              <div className="flex justify-center">
                <img 
                  src={document.url} 
                  alt={document.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden text-center text-gray-500 p-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>Не удалось загрузить изображение</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => window.open(document.url, '_blank')}
                  >
                    Открыть в новой вкладке
                  </Button>
                </div>
              </div>
            ) : isPDF ? (
              <div className="h-[70vh]">
                <iframe
                  src={document.url}
                  className="w-full h-full border-0 rounded-lg"
                  title={document.title}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 p-8">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">Предосмотр недоступен для этого типа файла</p>
                <p className="text-sm text-gray-400 mb-4">Формат: {document.type}</p>
                <Button onClick={() => window.open(document.url, '_blank')}>
                  Открыть в новой вкладке
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-6">Документы проекта</h2>
      
      {/* Сетка документов 7 шагов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-6">
        {documents.map((doc) => (
          <Card 
            key={doc.stepNumber} 
            className={`relative transition-all duration-300 hover:shadow-lg cursor-pointer ${
              selectedStep === doc.stepNumber ? 'ring-2 ring-blue-500 border-blue-300' :
              doc.url ? 'border-green-200 hover:border-green-300' : 
              doc.uploadedAt ? 'border-blue-200 hover:border-blue-300' : 'border-gray-200'
            }`}
            onClick={() => handleStepClick(doc.stepNumber)}
          >
            <CardContent className="p-4">
              {/* Номер шага и статус */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="text-xs">
                  Шаг {doc.stepNumber}
                </Badge>
                {doc.url ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : doc.uploadedAt ? (
                  <Calendar className="h-4 w-4 text-blue-500" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
              </div>

              {/* Иконка документа */}
              <div className="flex items-center justify-center mb-3">
                <FileText 
                  className={`h-8 w-8 ${
                    doc.url ? 'text-green-500' : 
                    doc.uploadedAt ? 'text-blue-500' : 'text-gray-400'
                  }`} 
                />
              </div>

              {/* Заголовок и описание */}
              <div className="text-center mb-3">
                <h3 className="font-medium text-sm mb-1">{doc.stepTitle}</h3>
                <p className="text-xs text-gray-500">{doc.stepDescription}</p>
              </div>

              {/* Дата завершения или загрузки */}
              {doc.uploadedAt && (
                <div className="text-xs text-gray-400 text-center mb-3">
                  {doc.url ? 'Загружено' : 'Завершено'}: {new Date(doc.uploadedAt).toLocaleDateString("ru-RU")}
                </div>
              )}

              {/* Кнопки действий */}
              <div className="space-y-2">
                {doc.url ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDocumentView(doc.url!, doc.stepTitle)
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Открыть
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDocumentDownload(doc.url!, doc.stepTitle)
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Скачать
                    </Button>
                  </>
                ) : doc.uploadedAt ? (
                  <div className="text-xs text-blue-600 text-center py-2">
                    ✓ Шаг завершён
                  </div>
                ) : doc.stepNumber === 4 ? (
                  <div className="text-xs text-center py-2">
                    {project.payment_method && project.payment_method !== 'null' && project.payment_method !== 'NULL' ? (
                      <span className="text-blue-600">✓ {getPaymentMethodLabel(project.payment_method)}</span>
                    ) : (
                      <span className="text-gray-400">Не выбрано</span>
                    )}
                  </div>
                ) : doc.stepNumber === 5 ? (
                  <div className="text-xs text-center py-2">
                    {project.selected_requisite_type && project.selected_requisite_type !== 'null' && project.selected_requisite_type !== 'NULL' ? (
                      <span className="text-blue-600">✓ {getRequisiteTypeLabel(project.selected_requisite_type)}</span>
                    ) : (
                      <span className="text-gray-400">Не заполнено</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center py-2">
                    Шаг не начат
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Зона предосмотра выбранного шага */}
      {selectedStepDetails && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white text-lg font-bold">
                {selectedStep}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-3 text-blue-900">
                  {selectedStepDetails.title}
                </h3>
                
                <div className="space-y-2 mb-4">
                  {selectedStepDetails.details.map((detail, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-blue-800">{detail}</span>
                    </div>
                  ))}
                </div>

                {/* Действия для документов */}
                {selectedStepDetails.hasDocument && selectedStepDetails.documentUrl && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDocumentView(selectedStepDetails.documentUrl!, selectedStepDetails.title)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть документ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDocumentDownload(selectedStepDetails.documentUrl!, selectedStepDetails.title)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Скачать
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Статистика документов */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Документов загружено: {documents.filter(doc => doc.url).length}
          </span>
          <span className="text-gray-600">
            Шагов завершено: {project.status === 'completed' ? 7 : documents.filter(doc => doc.uploadedAt).length} из 7
          </span>
          <span className="text-gray-600">
            Проект: {project.status === 'completed' ? 'Завершён' : 'В работе'}
          </span>
        </div>
        
        {!selectedStep && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 Нажмите на любой шаг выше, чтобы увидеть подробную информацию
          </div>
        )}
      </div>
      
      {/* Модальное окно предосмотра документа */}
      <DocumentPreviewModal 
        document={previewDocument} 
        onClose={handleClosePreview} 
      />
    </div>
  )
}

export default ProjectDocumentsGrid 