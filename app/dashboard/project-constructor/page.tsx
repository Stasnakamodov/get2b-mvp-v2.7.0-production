"use client"

import * as React from "react"
import type {
  ManualData,
  PartialStepConfigs,
  StepConfig,
  User as UserType,
  ProjectDetails,
  SupplierData,
  StepDataToView,
  OcrDebugData,
  StepNumber,
} from '@/types/project-constructor.types'
import { validateStepData } from '@/types/project-constructor.types'

// CSS стили извлечены в отдельный файл
import { useState, useEffect, useRef, useMemo } from "react"
import { uploadFileToStorage, sendTelegramMessage, fetchFromApi, fetchCatalogData } from '@/utils/ApiUtils'
import { SummaryBlock } from '@/components/project-constructor/SummaryBlock'
import { StepCubes } from '@/components/project-constructor/StepCubes'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Blocks,
  Building,
  FileText,
  Store,
  Users,
  Plus,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Banknote,
  Coins,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  Package,
  Mail,
  Edit,
  Lock,
  Check,
  Loader,
  Eye,
  User,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useProjectTemplates } from "../create-project/hooks/useSaveTemplate"
import CompanyForm from '@/components/project-constructor/forms/CompanyForm'
import ContactsForm from '@/components/project-constructor/forms/ContactsForm'
import BankForm from '@/components/project-constructor/forms/BankForm'
import { WaitingApprovalLoader, WaitingManagerReceiptLoader, RejectionMessage } from '@/components/project-constructor/status/StatusLoaders'
import { StageRouter } from '@/components/project-constructor/StageRouter'
import { Stage1Container } from '@/components/project-constructor/Stage1Container'
import { PaymentDetailsCard } from '@/components/project-constructor/PaymentDetailsCard'
import FileUploadForm from '@/components/project-constructor/forms/FileUploadForm'
import PaymentMethodForm from '@/components/project-constructor/forms/PaymentMethodForm'
import RequisitesForm from '@/components/project-constructor/forms/RequisitesForm'
import { constructorSteps, dataSources, stepIcons } from '@/components/project-constructor/config/ConstructorConfig'
import { STAGE_CONFIG, PRODUCT_DISPLAY_CONFIG } from '@/components/project-constructor/config/ConstructorConstants'
import { getSourceDisplayName } from '@/components/project-constructor/utils/SourceUtils'
import { getProgress, getPreviewType, getProgressWithContext } from '@/components/project-constructor/utils/ProgressUtils'
import { bucketMap } from '@/components/project-constructor/utils/UploadUtils'
import { phantomDataStyles } from '@/components/project-constructor/styles/PhantomStyles'
import SpecificationForm from '@/components/project-constructor/forms/SpecificationForm'
import { useClientProfiles } from "@/hooks/useClientProfiles"
import { useSupplierProfiles } from "@/hooks/useSupplierProfiles"
import { useModalHandlers } from "@/hooks/useModalHandlers"
import { useStageHandlers } from "@/hooks/useStageHandlers"
import { useCatalogHandlers } from "@/hooks/useCatalogHandlers"
import { useTouchHandlers } from "@/hooks/useTouchHandlers"
import { useManagerCommunication } from "@/hooks/useManagerCommunication"
import { useFileUpload } from "@/hooks/useFileUpload"
import { useProjectPolling } from "@/hooks/useProjectPolling"
import { useCatalogData } from "@/hooks/useCatalogData"
import { useReceiptRemoval } from "@/hooks/useReceiptRemoval"
import { cleanProjectRequestId } from "@/utils/IdUtils"
import { generateFileDate } from "@/utils/DateUtils"
import { cleanFileName } from "@/utils/FileUtils"
import {
  isStepFilledByUser,
  checkSummaryReadiness as checkSummaryReadinessUtil,
  getConfiguredStepsSummary as getConfiguredStepsSummaryUtil,
  type StepValidationContext
} from "@/components/project-constructor/utils/StepValidationUtils"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/components/ui/use-toast"
import CatalogModal from "../create-project/components/CatalogModal"
import { AutoFillNotification } from "@/components/project-constructor/notifications/AutoFillNotification"
import { POLLING_INTERVALS, TIMEOUTS } from "@/components/project-constructor/config/PollingConstants"
import { ModalProvider, useModals } from "./components/modals/ModalContext"
import ModalManager from "./components/modals/ModalManager"

// Константы конфигурации извлечены в отдельный файл

// CompanyForm, ContactsForm, BankForm и SpecificationForm теперь импортируются из отдельных файлов



// FileUploadForm извлечен в отдельный компонент

// Компонент формы метода оплаты (Шаг IV)
// PaymentMethodForm извлечен в отдельный компонент

// RequisitesForm извлечен в отдельный компонент

function ProjectConstructorContent() {
  // Добавляем CSS стили для фантомных данных
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = phantomDataStyles
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Модальная система
  const { modals, openModal, closeModal } = useModals()

  // Состояния для управления конструктором
  const [stepConfigs, setStepConfigs] = useState<PartialStepConfigs>({})
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [lastHoveredStep, setLastHoveredStep] = useState<number | null>(null)
  const [manualData, setManualData] = useState<ManualData>({})
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, string>>({})
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [templateStepSelection, setTemplateStepSelection] = useState<{templateId: string, availableSteps: number[]} | null>(null)
  const [templateSelection, setTemplateSelection] = useState<boolean>(false)
  const [previewData, setPreviewData] = useState<StepDataToView | null>(null)
  const [previewType, setPreviewType] = useState<string>('')
  const [editingType, setEditingType] = useState<string>('')
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [user, setUser] = useState<UserType | null>(null)
  const [autoFillNotification, setAutoFillNotification] = useState<{
    show: boolean;
    message: string;
    supplierName: string;
    filledSteps: number[];
  } | null>(null)
  
  // Состояния для OCR анализа
  const [ocrAnalyzing, setOcrAnalyzing] = useState<Record<number, boolean>>({})
  const [ocrError, setOcrError] = useState<Record<number, string>>({})
  const [ocrDebugData, setOcrDebugData] = useState<OcrDebugData>({})
  const [currentProductIndex, setCurrentProductIndex] = useState<number>(0)
  const productsPerView = PRODUCT_DISPLAY_CONFIG.PRODUCTS_PER_VIEW

  const [showPhantomOptions, setShowPhantomOptions] = useState<boolean>(false)
  const [showSupplierProfileSelector, setShowSupplierProfileSelector] = useState<boolean>(false)
  const [showCatalogSourceModal, setShowCatalogSourceModal] = useState<boolean>(false)

  // Хук для работы с профилями клиентов
  const { profiles: clientProfiles, loading: clientProfilesLoading, fetchProfiles: fetchClientProfiles } = useClientProfiles(user?.id || null)

  // Хук для работы с профилями поставщиков
  const { profiles: supplierProfiles, loading: supplierProfilesLoading, fetchProfiles: fetchSupplierProfiles } = useSupplierProfiles(user?.id || null)

  // Хук для работы с шаблонами проектов
  const { templates, loading: templatesLoading, error: templatesError, fetchTemplates } = useProjectTemplates()

  // Хук для уведомлений
  const { toast } = useToast()

  // Состояние для выбора профиля клиента
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  // Состояние для выбора профиля поставщика
  const [selectedSupplierProfileId, setSelectedSupplierProfileId] = useState<string | null>(null)

  // Состояние для обработки ошибок загрузки шаблонов
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState<boolean>(false)
  
  // Состояние для отслеживания текущего этапа
  const [currentStage, setCurrentStage] = useState<number>(1)

  // Временно добавлено для совместимости со старым кодом (будет удалено)
  const [catalogSourceStep, setCatalogSourceStep] = useState<number | null>(null)

  // Состояние для модального окна перехода на следующий этап
  const [dontShowStageTransition, setDontShowStageTransition] = useState<boolean>(false)
  const [stageTransitionShown, setStageTransitionShown] = useState<boolean>(false)
  
  // Состояние для отправки менеджеру
  const [sendingToManager, setSendingToManager] = useState<boolean>(false)
  const [managerNotification, setManagerNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  } | null>(null)

  // Состояние для модального окна выбора поставщика из синей комнаты
  const [blueRoomSuppliers, setBlueRoomSuppliers] = useState<SupplierData[]>([])
  const [blueRoomLoading, setBlueRoomLoading] = useState<boolean>(false)

  // Состояние для модального окна выбора поставщика из оранжевой комнаты
  const [orangeRoomSuppliers, setOrangeRoomSuppliers] = useState<SupplierData[]>([])
  const [orangeRoomLoading, setOrangeRoomLoading] = useState<boolean>(false)
  const [selectedSupplierData, setSelectedSupplierData] = useState<SupplierData | null>(null)

  // Состояния для анимации сделки
  const [dealAnimationStep, setDealAnimationStep] = useState<number>(0) // 0-3: шаги анимации
  const [dealAnimationStatus, setDealAnimationStatus] = useState<string>('') // статус анимации
  const [dealAnimationComplete, setDealAnimationComplete] = useState<boolean>(false)

  // Состояния для степера инфраструктуры (шаги 3, 6, 7)
  const [infrastructureStepperStep, setInfrastructureStepperStep] = useState<number>(0) // 0-2: шаги степера
  const [infrastructureStepperStatus, setInfrastructureStepperStatus] = useState<string>('') // статус степера

  // Состояния для управления статусом апрува менеджера
  const [managerApprovalStatus, setManagerApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [managerApprovalMessage, setManagerApprovalMessage] = useState<string>('')
  const [projectRequestId, setProjectRequestId] = useState<string>('')

  // Состояния для модальных окон после одобрения чека
  const [receiptApprovalStatus, setReceiptApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | 'waiting' | null>(null)

  // Состояние для модального окна каталога товаров
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false)
  // Состояния каталога удалены - теперь управляются внутри CatalogModal
  const [isRequestSent, setIsRequestSent] = useState(false)
  const [showFullLoader, setShowFullLoader] = useState(false)
  const [clientReceiptFile, setClientReceiptFile] = useState<File | null>(null)
  const [clientReceiptUrl, setClientReceiptUrl] = useState<string | null>(null)
  const [isUploadingClientReceipt, setIsUploadingClientReceipt] = useState(false)
  const [clientReceiptUploadError, setClientReceiptUploadError] = useState<string | null>(null)
  const [projectDetailsDialogOpen, setProjectDetailsDialogOpen] = useState(false)
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)

  // Модальные обработчики
  const { openStageTransitionModal, handleCancelSource } = useModalHandlers(
    () => openModal('stageTransition'),
    setStageTransitionShown,
    setSelectedSource,
    setEditingType
  )

  // Manager Communication хук
  const {
    error: managerCommError,
    setError: setManagerCommError,
    sendClientReceipt,
    sendSupplierReceiptRequest,
    sendSupplierReceipt
  } = useManagerCommunication({
    projectRequestId,
    receiptApprovalStatus,
    setReceiptApprovalStatus,
    setCurrentStage
  })

  // File Upload хук
  const {
    isUploading,
    uploadError,
    setUploadError,
    uploadClientReceipt,
    uploadSupplierReceipt
  } = useFileUpload({
    projectRequestId
  })

  // Объявление sendManagerReceiptRequest для useProjectPolling
  const sendManagerReceiptRequest = async () => {
    if (!projectRequestId || isRequestSent) {
      console.log('🔄 Запрос уже отправлен или нет projectRequestId')
      return
    }

    try {
      setIsRequestSent(true)
      console.log('📤 Отправляем запрос менеджеру на загрузку чека')

      // Получаем данные проекта
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
        .single()

      if (error || !project) {
        throw new Error('Проект не найден')
      }

      // Получаем реквизиты
      let requisiteText = ''
      try {
        const { data: requisiteData } = await supabase
          .from('project_requisites')
          .select('data')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (requisiteData?.data) {
          const req = requisiteData.data
          const details = req.details || req

          if (project.payment_method === 'bank-transfer') {
            requisiteText = `\n\n📋 Реквизиты для оплаты:\n• Получатель: ${details.recipientName || '-'}\n• Банк: ${details.bankName || '-'}\n• Счет: ${details.accountNumber || '-'}\n• SWIFT/BIC: ${details.swift || details.cnapsCode || details.iban || '-'}\n• Валюта: ${details.transferCurrency || 'USD'}`
          } else if (project.payment_method === 'p2p') {
            requisiteText = `\n\n💳 Карта для P2P:\n• Банк: ${req.bank || '-'}\n• Номер карты: ${req.card_number || '-'}\n• Держатель: ${req.holder_name || '-'}`
          } else if (project.payment_method === 'crypto') {
            requisiteText = `\n\n🪙 Криптокошелек:\n• Адрес: ${req.address || '-'}\n• Сеть: ${req.network || '-'}`
          }
        }
      } catch (error) {
        console.warn('⚠️ Не удалось получить реквизиты:', error)
      }

      // Отправляем запрос в Telegram
      const response = await sendTelegramMessage({
        endpoint: 'telegram/send-supplier-receipt-request',
        payload: {
          projectId: project.id,
          email: project.email || 'email@example.com',
          companyName: project.company_data?.name || 'Проект',
          amount: project.amount || 0,
          currency: project.currency || 'USD',
          paymentMethod: project.payment_method || 'bank-transfer',
          requisites: requisiteText
        }
      })

      console.log('✅ Запрос менеджеру отправлен успешно')

      // Обновляем статус проекта на waiting_manager_receipt
      await supabase
        .from('projects')
        .update({
          status: 'waiting_manager_receipt',
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)

    } catch (error) {
      console.error('❌ Ошибка отправки запроса менеджеру:', error)
      setIsRequestSent(false)
    }
  }

  // Project Polling хук
  const {
    managerReceiptUrl,
    hasManagerReceipt,
    setManagerReceiptUrl,
    setHasManagerReceipt
  } = useProjectPolling({
    projectRequestId,
    currentStage,
    isRequestSent,
    sendManagerReceiptRequest
  })

  // Catalog Data хук
  const {
    getUserTemplates,
    getSupplierDataFromCatalog,
    getSupplierProducts,
    getProfileData
  } = useCatalogData({
    templates,
    templatesLoading,
    templatesError,
    clientProfiles,
    clientProfilesLoading,
    supplierProfiles,
    supplierProfilesLoading,
    selectedProfileId,
    selectedSupplierProfileId,
    openModal: (modalName: string) => openModal(modalName as any),
    setShowSupplierProfileSelector
  })

  // Receipt Removal хук
  const { handleRemoveClientReceipt } = useReceiptRemoval({
    projectRequestId,
    clientReceiptUrl,
    setClientReceiptFile,
    setClientReceiptUrl,
    toast
  })

  // Обработчики этапов реквизитов
  const { confirmRequisites, editRequisites } = useStageHandlers(
    () => openModal('requisitesConfirmation'),
    () => openModal('stage2Summary'),
    setCurrentStage,
    setSelectedSource as React.Dispatch<React.SetStateAction<string>>,
    setEditingType
  )

  // Обработчики каталога
  const { handleAddProductsFromCatalog } = useCatalogHandlers(
    setShowCatalogModal
  )

  // Обработчики touch событий
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchHandlers({
    lastHoveredStep,
    manualData,
    onItemIndexChange: setCurrentItemIndex
  })

  // useEffect для автоматической установки stepConfigs[5] = 'catalog' когда есть данные автозаполнения
  useEffect(() => {
    // Проверяем есть ли у выбранного поставщика данные для автозаполнения 5-го шага
    if (selectedSupplierData || (manualData[4] && (manualData[4].methods || manualData[4].supplier_data))) {
      let hasStep5AutofillData = false;

      // Проверяем selectedSupplierData (высший приоритет)
      if (selectedSupplierData) {
        if (selectedSupplierData.bank_accounts?.length && selectedSupplierData.bank_accounts.length > 0 ||
            selectedSupplierData.p2p_cards?.length && selectedSupplierData.p2p_cards.length > 0 ||
            selectedSupplierData.crypto_wallets?.length && selectedSupplierData.crypto_wallets.length > 0 ||
            selectedSupplierData.payment_methods?.some((method: string) =>
              ['bank-transfer', 'p2p', 'crypto'].includes(method))) {
          hasStep5AutofillData = true;
        }
      }

      // Проверяем manualData[4] если selectedSupplierData не дал результата
      if (!hasStep5AutofillData && manualData[4]) {
        if (manualData[4] && 'methods' in manualData[4] && manualData[4].methods?.length && manualData[4].methods.length > 0) {
          hasStep5AutofillData = true;
        }
        if (!hasStep5AutofillData && manualData[4].supplier_data) {
          const supplier = manualData[4].supplier_data;
          if (supplier.bank_accounts?.length > 0 ||
              supplier.p2p_cards?.length > 0 ||
              supplier.crypto_wallets?.length > 0 ||
              supplier.payment_methods?.some((method: string) =>
                ['bank-transfer', 'p2p', 'crypto'].includes(method))) {
            hasStep5AutofillData = true;
          }
        }
      }

      // Устанавливаем stepConfigs[5] = 'catalog' если есть данные автозаполнения
      if (hasStep5AutofillData && stepConfigs[5] !== 'catalog') {
        setStepConfigs(prev => ({
          ...prev,
          5: 'catalog'
        }));
        console.log('✅ [Step 5 Auto Config] Установлен stepConfigs[5] = "catalog" - есть данные автозаполнения');
      }
    }
  }, [selectedSupplierData, manualData[4], stepConfigs[5]]);

  // Helper функция для создания контекста валидации шагов
  const createValidationContext = (): StepValidationContext => ({
    stepConfigs,
    manualData,
    receiptApprovalStatus,
    hasManagerReceipt,
    clientReceiptUrl
  })

  // Мемоизированная сводка настроенных шагов (вызывается 3 раза в рендере)
  const configuredStepsSummary = useMemo(() => {
    return getConfiguredStepsSummaryUtil(constructorSteps, dataSources, createValidationContext())
  }, [stepConfigs, manualData, receiptApprovalStatus, hasManagerReceipt, clientReceiptUrl])

  // Wrapper для isStepFilledByUser с контекстом
  const isStepFilledByUserWithContext = (stepId: number) => {
    return isStepFilledByUser(stepId, createValidationContext())
  }

  // Функция для поиска supplier в любом из заполненных шагов
  const findSupplierInAnyStep = () => {
    console.log('🔍 Ищем supplier в любом из заполненных шагов...')
    console.log('🔍 manualData:', manualData)
    console.log('🔍 selectedSupplierData:', selectedSupplierData)
    
    // Проверяем шаг 2 (товары)
    const step2Data = manualData[2]
    console.log('🔍 step2Data:', step2Data)
    if (step2Data) {
      if (step2Data.supplier) {
        console.log('✅ Найден supplier в шаге 2:', step2Data.supplier)
        return step2Data.supplier
      }
      if (step2Data.items && step2Data.items.length > 0) {
        const firstItem = step2Data.items[0]
        if (firstItem.supplier_name) {
          console.log('✅ Найден supplier_name в шаге 2:', firstItem.supplier_name)
          return firstItem.supplier_name
        }
        if (firstItem.supplier) {
          console.log('✅ Найден supplier в товаре шага 2:', firstItem.supplier)
          return firstItem.supplier
        }
      }
    }
    
    // Проверяем шаг 4 (способы оплаты) - может содержать данные поставщика
    const step4Data = manualData[4]
    console.log('🔍 step4Data:', step4Data)
    if (step4Data) {
      if (step4Data.supplier_name) {
        console.log('✅ Найден supplier_name в шаге 4:', step4Data.supplier_name)
        return step4Data.supplier_name
      }
      if (step4Data.supplier) {
        console.log('✅ Найден supplier в шаге 4:', step4Data.supplier)
        return step4Data.supplier
      }
    }
    
    // Проверяем шаг 5 (реквизиты) - может содержать данные поставщика
    const step5Data = manualData[5]
    console.log('🔍 step5Data:', step5Data)
    if (step5Data) {
      if (step5Data.supplier_name) {
        console.log('✅ Найден supplier_name в шаге 5:', step5Data.supplier_name)
        return step5Data.supplier_name
      }
      if (step5Data.supplier) {
        console.log('✅ Найден supplier в шаге 5:', step5Data.supplier)
        return step5Data.supplier
      }
    }
    
    // Проверяем selectedSupplierData (если был выбран из каталога)
    if (selectedSupplierData) {
      if (selectedSupplierData.name) {
        console.log('✅ Найден supplier в selectedSupplierData:', selectedSupplierData.name)
        return selectedSupplierData.name
      }
      if (selectedSupplierData.company_name) {
        console.log('✅ Найден company_name в selectedSupplierData:', selectedSupplierData.company_name)
        return selectedSupplierData.company_name
      }
    }
    
    console.log('❌ Supplier не найден ни в одном шаге')
    console.log('🔍 Детали manualData:')
    Object.keys(manualData).forEach(key => {
      const numericKey = parseInt(key)
      if (!isNaN(numericKey)) {
        console.log(`  ${key}:`, manualData[numericKey])
      }
    })
    return null
  }

  // Закрытие выпадающего списка при клике вне его области
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.phantom-options-dropdown')) {
        setShowPhantomOptions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Загружаем шаблоны при монтировании компонента (хук useProjectTemplates объявлен выше)
  React.useEffect(() => {
    // Проверяем аутентификацию перед загрузкой
    const checkAuthAndLoad = async () => {
      try {
        console.log('🔍 Проверка авторизации...')
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          console.log('✅ Пользователь авторизован:', user.email)
          setUser(user)
          console.log('📋 Загружаем шаблоны...')
          await fetchTemplates()
          console.log('👤 Загружаем профили клиентов...')
          await fetchClientProfiles()
          console.log('🏭 Загружаем профили поставщиков...')
          await fetchSupplierProfiles()
        } else {
          console.log('❌ Пользователь не авторизован')
        }
      } catch (error) {
        console.error('❌ Ошибка при проверке авторизации:', error)
      }
    }
    
    checkAuthAndLoad()
  }, []) // Убираем fetchTemplates из зависимостей

  // Polling статуса модерации атомарного конструктора
  useEffect(() => {
    if (!projectRequestId || currentStage !== 2) return
    
    const checkManagerStatus = async () => {
      try {
        console.log('🔍 Проверяем статус для projectRequestId:', projectRequestId)
        const cleanRequestId = cleanProjectRequestId(projectRequestId)
        console.log('🧹 Очищенный requestId для поиска:', cleanRequestId)
        
        const { data: projects, error } = await supabase
          .from('projects')
          .select('atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanRequestId}%`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ Ошибка проверки статуса модерации:', error)
          return
        }

        if (projects && projects.length > 0 && projects[0].atomic_moderation_status) {
          const status = projects[0].atomic_moderation_status
          console.log('📊 Статус модерации обновлен:', status)
          setManagerApprovalStatus(status)
          
          // Если одобрено, показываем платёжку (шаг 3)
          if (status === 'approved') {
            console.log('✅ Атомарный конструктор одобрен - показываем платёжку')
            // НЕ переходим к этапу 3, остаемся на этапе 2 для показа платёжки
          }
        } else {
          console.log('📊 Записи не найдены или статус пустой')
        }
      } catch (error) {
        console.error('❌ Ошибка polling статуса модерации:', error)
      }
    }

    // Проверяем статус каждые 4 секунды
    const interval = setInterval(checkManagerStatus, POLLING_INTERVALS.MANAGER_STATUS_CHECK)
    
    // Первая проверка сразу
    checkManagerStatus()
    
    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, setCurrentStage])

  // Polling статуса одобрения чека
  useEffect(() => {
    if (!projectRequestId || currentStage !== 2) return
    
    const checkReceiptStatus = async () => {
      try {
        console.log('🔍 Проверяем статус чека для projectRequestId:', projectRequestId)
        const cleanRequestId = cleanProjectRequestId(projectRequestId)
        console.log('🧹 Очищенный requestId для поиска чека:', cleanRequestId)
        
        const { data: projects, error } = await supabase
          .from('projects')
          .select('status, atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanRequestId}%`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('❌ Ошибка проверки статуса чека:', error)
          return
        }

        console.log('📊 [DEBUG] Найденные проекты для чека:', projects)

        if (projects && projects.length > 0) {
          const project = projects[0]
          console.log('📊 [DEBUG] Проект найден:', {
            status: project.status,
            atomic_moderation_status: project.atomic_moderation_status
          })
          
          // Обновляем статус менеджера если он не установлен
          if (project.atomic_moderation_status && managerApprovalStatus !== project.atomic_moderation_status) {
            console.log('📊 Обновляем статус менеджера:', project.atomic_moderation_status)
            setManagerApprovalStatus(project.atomic_moderation_status)
          }
          
          if (project.status) {
            const status = project.status
            console.log('📊 Статус чека обновлен:', status)
            
            if (status === 'receipt_approved' && receiptApprovalStatus !== 'approved') {
              console.log('✅ Чек одобрен - переходим к этапу 3 (анимация сделки)')
              setReceiptApprovalStatus('approved')
              setCurrentStage(3) // Переходим к этапу 3: анимация сделки
            } else if (status === 'receipt_rejected' && receiptApprovalStatus !== 'rejected') {
              console.log('❌ Чек отклонен')
              setReceiptApprovalStatus('rejected')
            } else if (status === 'waiting_receipt' && receiptApprovalStatus !== 'waiting') {
              console.log('⏳ Чек загружен, ждет одобрения')
              setReceiptApprovalStatus('waiting')
            }
          } else {
            console.log('📊 Статус чека пустой')
          }
        } else {
          console.log('📊 Записи не найдены')
        }
      } catch (error) {
        console.error('❌ Ошибка polling статуса чека:', error)
      }
    }

    // Проверяем статус каждые 4 секунды
    const interval = setInterval(checkReceiptStatus, POLLING_INTERVALS.RECEIPT_STATUS_CHECK)
    
    // Первая проверка сразу
    checkReceiptStatus()
    
    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, managerApprovalStatus, receiptApprovalStatus])

  // Polling чека от менеджера - теперь обрабатывается хуком useProjectPolling

  // Функция для загрузки чека клиента о получении средств
  const handleClientReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !projectRequestId) return

    setIsUploadingClientReceipt(true)
    setClientReceiptUploadError(null)

    try {
      // Загружаем файл через хук
      const fileUrl = await uploadClientReceipt(file)
      if (!fileUrl) throw new Error("Не удалось получить URL файла")

      // Отправляем файл менеджеру в Telegram
      const telegramCaption = `📋 КЛИЕНТ ЗАГРУЗИЛ ЧЕК О ПОЛУЧЕНИИ СРЕДСТВ!\n\n` +
        `🆔 Проект: ${projectRequestId}\n` +
        `📛 Название: ${manualData[1]?.name || 'Атомарный проект'}\n` +
        `🏢 Компания: ${manualData[1]?.name || 'Не указано'}\n` +
        `📧 Email: ${manualData[1]?.email || 'Не указано'}\n` +
        `💰 Метод оплаты: ${manualData[4]?.method || 'Не указан'}\n\n` +
        `📄 Клиент подтвердил получение средств от поставщика чеком.\n` +
        `⚠️ Проверьте документ и завершите проект если все корректно.`

      try {
        // Отправляем файл менеджеру в Telegram через API endpoint
        const telegramResult = await sendTelegramMessage({
          endpoint: 'telegram/send-client-receipt',
          payload: {
            documentUrl: fileUrl,
            caption: telegramCaption,
            projectRequestId
          }
        })

        if (telegramResult.success) {
          console.log("✅ Чек с кнопками одобрения отправлен менеджеру в Telegram:", telegramResult)
        } else {
          console.error("❌ Ошибка API при отправке чека:", telegramResult.error)
        }
      } catch (telegramError) {
        console.error("⚠️ Ошибка отправки в Telegram:", telegramError)
        // Продолжаем выполнение даже если Telegram недоступен
      }

      setClientReceiptFile(file)
      setClientReceiptUrl(fileUrl)

      toast({
        title: "Чек загружен!",
        description: "Ваш чек успешно загружен и отправлен менеджеру.",
        variant: "default"
      })

    } catch (error) {
      console.error("❌ Ошибка загрузки чека:", error)
      setClientReceiptUploadError(error instanceof Error ? error.message : "Неизвестная ошибка")

      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить чек. Попробуйте еще раз.",
        variant: "destructive"
      })
    } finally {
      setIsUploadingClientReceipt(false)
    }
  }

  // handleRemoveClientReceipt теперь в useReceiptRemoval хуке

  // Функция для показа деталей проекта
  const handleShowProjectDetails = async () => {
    if (!projectRequestId) return

    console.log("🔍 Загружаем детали проекта:", projectRequestId)

    try {
      // Получаем данные проекта
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("❌ Ошибка загрузки проекта:", error)
        throw new Error("Не удалось загрузить данные проекта")
      }

      if (!projects || projects.length === 0) {
        throw new Error("Проект не найден")
      }

      const project = projects[0]
      setProjectDetails({
        ...project,
        manualData,
        stepConfigs,
        currentStage: getCurrentStage()
      })
      setProjectDetailsDialogOpen(true)

      console.log("✅ Детали проекта загружены:", project)
    } catch (error) {
      console.error("❌ Ошибка загрузки деталей проекта:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить детали проекта",
        variant: "destructive",
      })
    }
  }

  // Функция для отправки запроса менеджеру на загрузку чека (шаг 6)
  // sendManagerReceiptRequest перенесена выше для useProjectPolling хука

  // getUserTemplates, getSupplierDataFromCatalog, getSupplierProducts теперь в useCatalogData хуке

  // Функция автоматического заполнения шагов IV и V на основе данных шага II
  const autoFillStepsFromSupplier = async (stepData: any) => {
    console.log('=== АВТОМАТИЧЕСКОЕ ЗАПОЛНЕНИЕ ШАГОВ IV и V ===')
    console.log('Данные для проверки:', stepData)

    // Проверяем, есть ли товары в данных
    if (stepData && stepData.items && stepData.items.length > 0) {
      console.log('Найдены товары:', stepData.items)

      // Получаем данные поставщика из первого товара
      const firstItem = stepData.items[0]

      // Если есть supplier_id или supplier name, устанавливаем stepConfigs[5] = 'catalog'
      // для показа рекомендаций из каталога
      // ЭХО ДАННЫЕ в атомарном конструкторе ОТКЛЮЧЕНЫ для упрощения работы
      if (firstItem?.supplier_id || stepData.supplier) {
        console.log('✅ Данные поставщика найдены, устанавливаем stepConfigs[5] = catalog')
        console.log('   supplier_id:', firstItem?.supplier_id)
        console.log('   supplier:', stepData.supplier)

        // Устанавливаем stepConfigs[5] = 'catalog' для показа рекомендаций из каталога
        setStepConfigs(prev => ({
          ...prev,
          5: 'catalog'
        }))

        console.log('✅ stepConfigs[5] = catalog установлен для показа рекомендаций из каталога')
        return true
      } else {
        console.log('❌ supplier не найден в данных')
        return false
      }
    } else {
      console.log('❌ Товары не найдены в данных')
      return false
    }
  }

  // Функция автоматического заполнения шага II на основе данных шагов IV или V
  const autoFillStepFromRequisites = async (stepData: any, stepId: number) => {
    console.log(`=== АВТОМАТИЧЕСКОЕ ЗАПОЛНЕНИЕ ШАГА II НА ОСНОВЕ ШАГА ${stepId} ===`)
    console.log('Данные для проверки:', stepData)

    // Проверяем, есть ли supplier_id в данных
    let supplierId = stepData.supplier_id
    if (!supplierId) {
      console.log('supplier_id не найден в данных шага', stepId)
      return false
    }

    console.log('Найден supplier_id:', supplierId)

    try {
      // Получаем данные поставщика
      const supplierData = await getSupplierDataFromCatalog(supplierId)

      if (supplierData) {
        console.log('Данные поставщика найдены:', supplierData.name)

        // Получаем товары поставщика
        const supplierProducts = await getSupplierProducts(supplierId)

        if (supplierProducts && supplierProducts.length > 0) {
          // Автоматически заполняем шаг II (спецификация товаров)
          setManualData(prev => ({
            ...prev,
            2: {
              supplier: supplierData.name,
              currency: 'RUB',
              items: supplierProducts.map(product => ({
                ...product,
                supplier_id: supplierId,
                supplier_name: supplierData.name
              })),
              auto_filled: true
            }
          }))

          // Устанавливаем источник данных для шага II
          setStepConfigs(prev => ({
            ...prev,
            2: "catalog"
          }))
        
        // Показываем уведомление об автоматическом заполнении
        setAutoFillNotification({
          show: true,
          message: `Товары поставщика автоматически добавлены в спецификацию`,
          supplierName: supplierData.name,
          filledSteps: [2]
        })
        
        // Скрываем уведомление через 5 секунд
        setTimeout(() => {
          setAutoFillNotification(null)
        }, 5000)
        
        // ЭХО ДАННЫЕ ОТКЛЮЧЕНЫ: Автозаполнение шагов 4-5 из эхо данных отключено
        // Пользователь увидит рекомендации из каталога (оранжевые кубики)
        
        console.log('✅ Шаг II автоматически заполнен товарами поставщика')
        return true
      } else {
        console.log('❌ Товары поставщика не найдены')
      }
    } else {
      console.log('❌ Данные поставщика не найдены для ID:', supplierId)
    }

    } catch (error) {
      console.error('💥 Критическая ошибка автозаполнения шага II:', error)
      return false
    }

    return false
  }

  // Функция для получения данных из шаблонов для конкретного шага
  const getTemplateDataForStep = async (stepId: number) => {
    console.log('Запрос данных из шаблонов для шага:', stepId)
    
    try {
      // Используем уже загруженные шаблоны из хука
      if (!templates || templates.length === 0) {
        console.log('❌ У пользователя нет шаблонов')
        return null
      }
      
      console.log('✅ Используем загруженные шаблоны:', templates.length)
      
      // Берем первый шаблон (можно добавить выбор)
      const template = templates[0]
      
      // Преобразуем данные шаблона в формат для конкретного шага
      switch (stepId) {
        case 1: // Данные компании
          return {
            name: template.company_name || '',
            legalName: template.company_legal || '',
            inn: template.company_inn || '',
            kpp: template.company_kpp || '',
            ogrn: template.company_ogrn || '',
            address: template.company_address || '',
            bankName: template.company_bank || '',
            bankAccount: template.company_account || '',
            bankCorrAccount: template.company_corr || '',
            bankBik: template.company_bik || '',
            email: template.company_email || '',
            phone: template.company_phone || '',
            website: template.company_website || ''
          }
          
        case 2: // Спецификация товаров
          return {
            supplier: template.supplier_name || '',
            currency: template.currency || 'RUB',
            items: template.specification || []
          }
          
        default:
          return null
      }
      
    } catch (error) {
      console.error('❌ Ошибка получения данных шаблона:', error)
      throw new Error('Ошибка при обработке данных шаблона')
    }
  }



  // getProfileData теперь в useCatalogData хуке WITH BUG FIX (company_name fallback)

  // Функция для применения выбранного профиля клиента к шагу 1
  const applyClientProfile = async () => {
    console.log('🔄 Применяем профиль клиента к шагу 1')

    if (!selectedProfileId) {
      console.error('❌ Не выбран профиль клиента')
      return
    }

    const profileData = await getProfileData(1)
    if (profileData) {
      setManualData(prev => ({
        ...prev,
        1: profileData
      }))
      setStepConfigs(prev => ({
        ...prev,
        1: 'profile'
      }))
      closeModal('profileSelector')
      console.log('✅ Профиль клиента применен к шагу 1')
    }
  }

  // Функция для получения данных шаблона (симуляция)
  const getTemplateData = (templateId: string) => {
    // Находим реальный шаблон в базе данных
    const template = templates?.find(t => t.id === templateId)
    
    if (!template) {
      console.error('Шаблон не найден:', templateId)
      return null
    }
    
    console.log('=== ДАННЫЕ ШАБЛОНА ДЛЯ СПЕЦИФИКАЦИИ ===')
    console.log('template:', template)
    console.log('template.items:', template.items)
    console.log('template.specification:', template.specification)
    console.log('template.data?.specification:', template.data?.specification)
    
    return {
      id: template.id,
      name: template.name || 'Без названия',
      availableSteps: [1, 2], // По умолчанию шаблоны содержат шаги 1 и 2
              data: {
          1: {
            name: template.company_name || '',
            legalName: template.company_legal || '',
            inn: template.company_inn || '',
            kpp: template.company_kpp || '',
            ogrn: template.company_ogrn || '',
            address: template.company_address || '',
            bankName: template.company_bank || '',
            bankAccount: template.company_account || '',
            bankCorrAccount: template.company_corr_account || template.company_corr || '',
            bankBik: template.company_bik || '',
            email: template.company_email || '',
            phone: template.company_phone || '',
            website: template.company_website || ''
          },
        2: {
          supplier: template.supplier_name || template.data?.supplier_name || template.data?.supplier || '',
          currency: template.currency || 'RUB',
          items: template.items || template.specification || template.data?.specification || []
        }
      }
    }
  }

  // Функция для применения данных шаблона к конкретному шагу
  const applyTemplateStep = (stepId: number, templateData: any) => {
    console.log(`=== ПРИМЕНЕНИЕ ШАБЛОНА ДЛЯ ШАГА ${stepId} ===`)
    console.log('templateData:', templateData)
    console.log('templateData.data:', templateData.data)
    console.log(`templateData.data[${stepId}]:`, templateData.data[stepId as keyof typeof templateData.data])
    
    if (templateData.data[stepId as keyof typeof templateData.data]) {
      // Применяем данные шаблона
      setStepConfigs(prev => ({
        ...prev,
        [stepId]: "template"
      }))
      const stepData = templateData.data[stepId as keyof typeof templateData.data]
      setManualData(prev => ({
        ...prev,
        [stepId]: stepData
      }))
      setSelectedSource(null)
      setTemplateStepSelection(null)
      console.log(`✅ Применены данные шаблона для шага ${stepId}:`, stepData)
      
      // Проверяем, нужно ли автоматическое заполнение (если это шаг II)
      if (stepId === 2) {
        autoFillStepsFromSupplier(stepData)
      }
      
      // Проверяем, нужно ли автоматическое заполнение (если это шаги IV или V)
      if (stepId === 4 || stepId === 5) {
        autoFillStepFromRequisites(stepData, stepId).catch(error => {
          console.error('Ошибка автозаполнения из шага', stepId, ':', error)
        })
      }
    } else {
      console.log(`❌ Нет данных шаблона для шага ${stepId}`)
    }
  }

  // Обработчик выбора шаблона
  const handleTemplateSelect = (templateId: string) => {
    const templateData = getTemplateData(templateId)
    if (!templateData) return
    
    const availableSteps = templateData.availableSteps
    
    // Если шаблон содержит несколько шагов, показываем выбор
    if (availableSteps.length > 1) {
      setTemplateStepSelection({
        templateId: templateId,
        availableSteps: availableSteps
      })
      setTemplateSelection(false)
    } else if (availableSteps.length === 1) {
      // Если только один шаг, применяем его автоматически
      applyTemplateStep(availableSteps[0], templateData)
      setTemplateSelection(false)
    }
  }

  // Обработчик выбора шага в шаблоне
  const handleTemplateStepSelect = (stepId: number) => {
    if (templateStepSelection) {
      const templateData = getTemplateData(templateStepSelection.templateId)
      if (templateData) {
        applyTemplateStep(stepId, templateData)
      }
    }
  }

  // Обработчик заполнения всех шагов из шаблона
  const handleFillAllTemplateSteps = () => {
    if (templateStepSelection) {
      const templateData = getTemplateData(templateStepSelection.templateId)
      if (!templateData) return
      
      // Применяем данные для всех доступных шагов
      templateStepSelection.availableSteps.forEach(stepId => {
        if (templateData.data[stepId as keyof typeof templateData.data]) {
          const stepData = templateData.data[stepId as keyof typeof templateData.data]
          setStepConfigs(prev => ({
            ...prev,
            [stepId]: "template"
          }))
          setManualData(prev => ({
            ...prev,
            [stepId]: stepData
          }))
          
          // Проверяем, нужно ли автоматическое заполнение (если это шаг II)
          if (stepId === 2) {
            // Используем setTimeout, чтобы дать время для обновления состояния
            setTimeout(async () => {
              await autoFillStepsFromSupplier(stepData)
            }, 100)
          }
          
          // Проверяем, нужно ли автоматическое заполнение (если это шаги IV или V)
          if (stepId === 4 || stepId === 5) {
            // Используем setTimeout, чтобы дать время для обновления состояния
            setTimeout(() => {
              autoFillStepFromRequisites(stepData, stepId).catch(error => {
                console.error('Ошибка отложенного автозаполнения из шага', stepId, ':', error)
              })
            }, 100)
          }
        }
      })
      
      setSelectedSource(null)
      setTemplateStepSelection(null)
      console.log(`Применены данные шаблона для всех шагов: ${templateStepSelection.availableSteps.join(', ')}`)
    }
  }

  // Обработчик наведения на кубик
  const handleStepHover = (stepId: number) => {
    console.log('🎯 handleStepHover called:', { stepId, enabled: isStepEnabled(stepId) });
    if (isStepEnabled(stepId)) {
      setHoveredStep(stepId)
      setLastHoveredStep(stepId)
      console.log('✅ setLastHoveredStep:', stepId);
    }
  }

  // Обработчик клика по кубику (теперь не нужен, так как выбор происходит в Block 2)
  const handleStepClick = (stepId: number) => {
    console.log(`🖱️ Клик по шагу ${stepId}`)
    console.log(`📊 manualData[${stepId}]:`, manualData[stepId])
    console.log(`📊 stepConfigs[${stepId}]:`, stepConfigs[stepId])
    
    // Для шагов 4 и 5: показываем модальное окно с предложением данных
    if (stepId === 4 || stepId === 5) {
      console.log(`🎯 Обрабатываем клик по шагу ${stepId}`)
      
      // Если данные уже применены, не показываем ничего (просмотр только через карточки в блоке 2)
      if (manualData[stepId]?.user_choice && stepConfigs[stepId] === 'echoData') {
        console.log('✅ Эхо данные уже применены, просмотр доступен только через карточки в блоке 2')
        return
      }
      
      // ЭХО ДАННЫЕ ОТКЛЮЧЕНЫ: Клик по кубикам 4 и 5 больше не показывает модалку с эхо данными
      // Пользователь может заполнить вручную или выбрать из рекомендаций (оранжевые кубики)
      console.log('❌ Эхо данные отключены. Заполните вручную или используйте рекомендации.')
      return
    }
    
    // Для остальных шагов: стандартная логика hover
    handleStepHover(stepId)
  }

  // Обработчик выбора источника данных
  const handleSourceSelect = (source: string) => {
    if (lastHoveredStep) {
      // Если выбран шаблон, показываем выбор шаблонов пользователя
      if (source === "template") {
        setTemplateSelection(true)
        return
      }
      
      // Для других источников применяем стандартную логику
      setStepConfigs(prev => ({
        ...prev,
        [lastHoveredStep]: source
      }))
      setSelectedSource(source)
      
      // Если выбран каталог, открываем полный каталог напрямую
      if (source === "catalog") {
        console.log("Выбран каталог для шага", lastHoveredStep)
        setShowCatalogModal(true)
        return
      }
      
      // Если выбран загрузка документа, показываем OCR форму
      if (source === "upload") {
        console.log("Выбрана загрузка документа для шага", lastHoveredStep)
        setSelectedSource("upload")
        return
      }
      
      // Если выбран профиль, применяем данные из профиля
      if (source === "profile") {
        console.log('🔍 Применяем данные профиля для шага:', lastHoveredStep)
        getProfileData(lastHoveredStep).then(profileData => {
        if (profileData) {
          console.log('📝 Применяемые данные профиля:', profileData)
          setManualData(prev => ({
            ...prev,
            [lastHoveredStep]: profileData
          }))
            console.log(`✅ Применены данные профиля для шага ${lastHoveredStep}`)
          } else {
            console.log(`❌ Не удалось получить данные профиля для шага ${lastHoveredStep}`)
        }
        }).catch(error => {
          console.error('❌ Ошибка получения данных профиля:', error)
        })
      }
      
      // Если выбраны шаблоны, применяем данные из шаблонов
      if (source === "template") {
        try {
          // Проверяем, есть ли загруженные шаблоны
          if (!templates || templates.length === 0) {
            setTemplateError('Нет доступных шаблонов. Создайте шаблон в разделе "Создать проект".')
            return
          }
          
          // Берем первый шаблон
          const template = templates[0]
          let templateData = null
          
          // Преобразуем данные шаблона в формат для конкретного шага
          if (lastHoveredStep === 1) {
            templateData = {
              name: template.company_name || '',
              legalName: template.company_legal || '',
              inn: template.company_inn || '',
              kpp: template.company_kpp || '',
              ogrn: template.company_ogrn || '',
              address: template.company_address || '',
              bankName: template.company_bank || '',
              bankAccount: template.company_account || '',
              bankCorrAccount: template.company_corr || '',
              bankBik: template.company_bik || '',
              email: template.company_email || '',
              phone: template.company_phone || '',
              website: template.company_website || ''
            }
          } else if (lastHoveredStep === 2) {
            templateData = {
              supplier: template.supplier_name || '',
              currency: template.currency || 'RUB',
              items: template.specification || []
            }
          }
          
          if (templateData) {
            setManualData(prev => ({
              ...prev,
              [lastHoveredStep]: templateData
            }))
            console.log(`✅ Применены данные шаблона для шага ${lastHoveredStep}`)

            // ЭХО ДАННЫЕ ОТКЛЮЧЕНЫ: Шаблоны НЕ заполняют шаги 4 и 5 автоматически
          } else {
            setTemplateError(`Шаблон не содержит данных для шага ${lastHoveredStep}`)
          }
        } catch (error) {
          console.error('❌ Ошибка применения данных шаблона:', error)
          setTemplateError('Ошибка при обработке данных шаблона')
        }
      }
    }
  }

  // Определение текущего этапа
  const getCurrentStage = () => {
    // Проверяем, заполнены ли все основные шаги этапа 1
    const context = createValidationContext()
    const step1Filled = isStepFilledByUser(1, context)
    const step2Filled = isStepFilledByUser(2, context)
    const step4Filled = isStepFilledByUser(4, context)
    const step5Filled = isStepFilledByUser(5, context)
    
    console.log('🔍 Проверка этапа:', { step1Filled, step2Filled, step4Filled, step5Filled })
    
    const stage1Completed = step1Filled && step2Filled && step4Filled && step5Filled
    
    if (stage1Completed && currentStage === 1) {
      console.log('✅ Этап 1 завершен, переходим к этапу 2')
      
      // Автоматически показываем сводку при завершении этапа 1
      setTimeout(() => {
        console.log('🎯 Автоматически показываем сводку при завершении этапа 1')
        checkSummaryReadiness()
      }, 100)
      
      return 2 // Этап 2: Подготовка инфраструктуры
    } else {
      console.log('⏳ Этап 1 еще не завершен или уже в этапе 2')
      return currentStage // Возвращаем текущий этап
    }
  }

  // getActiveScenario извлечена в ProgressUtils


  // Функция для перехода к следующему этапу
  const goToNextStage = async () => {
    console.log('🚀 Переход к следующему этапу')
    console.log('  - Текущий этап:', currentStage)
    console.log('  - stageTransitionShown:', stageTransitionShown)
    console.log('  - dontShowStageTransition:', dontShowStageTransition)

    // Проверяем, находимся ли мы в модальном окне предварительного просмотра
    if (modals.summary.isOpen) {
      console.log('📋 Мы в модальном окне предварительного просмотра')

      // Закрываем модальное окно предварительного просмотра
      closeModal('summary')
      console.log('✅ Модальное окно предварительного просмотра закрыто')

      // Показываем модальное окно перехода к этапу 2 только один раз
      if (!stageTransitionShown && !dontShowStageTransition) {
        console.log('📋 Показываем модальное окно перехода')
        openModal('stageTransition')
        setStageTransitionShown(true)
      } else {
        // Если уже показывали или отключено - сразу переходим к этапу 2
        console.log('⚡ Сразу переходим к этапу 2')
        await proceedToStage2()
      }
    } else if (currentStage === 2) {
      // Переходим к этапу 3: Анимация сделки
      setCurrentStage(3)
      console.log('✅ Переход к этапу 3: Анимация сделки')
      
      // Запускаем анимацию сделки
      startDealAnimation()
    } else {
      console.log('❌ Неизвестное состояние для перехода')
    }
  }

  // Функция для перехода к этапу 2 (после подтверждения модального окна)
  const proceedToStage2 = async () => {
    console.log('✅ Переход к этапу 2: Подготовка инфраструктуры')

    // Закрываем модальное окно перехода
    closeModal('stageTransition')

    // Переходим к этапу 2
    setCurrentStage(2)
    console.log('✅ Этап изменен на 2')
    
    // Сбрасываем состояние показа модального окна перехода
    setStageTransitionShown(false)
    
    // Устанавливаем статус ожидания апрува менеджера
    setManagerApprovalStatus('pending')
    console.log('✅ Статус менеджера установлен в pending')
    
    // Автоматически отправляем данные менеджеру (с обработкой ошибок)
    console.log('📤 Автоматическая отправка данных менеджеру при переходе к этапу 2')
    try {
      await handleSendToManager()
      console.log('✅ Данные успешно отправлены менеджеру')
    } catch (error) {
      console.error('❌ Ошибка отправки менеджеру:', error)
      // Показываем уведомление об ошибке, но продолжаем
      setManagerNotification({
        show: true,
        type: 'error',
        message: 'Ошибка отправки в Telegram, но переход к этапу 2 выполнен'
      })
    }
  }


  // Функция для возврата к редактированию на первом этапе
  const returnToStage1Editing = () => {
    console.log('🔄 Возврат к редактированию на первом этапе')
    console.log('  - Текущий этап до возврата:', currentStage)
    console.log('  - showSummaryModal до возврата:', modals.summary.isOpen)
    console.log('  - showStageTransitionModal до возврата:', modals.stageTransition.isOpen)

    closeModal('summary')
    closeModal('stageTransition')
    setCurrentStage(1)
    // Сбрасываем состояние показа модального окна перехода
    setStageTransitionShown(false)
    
    console.log('✅ Все модальные окна закрыты, этап установлен в 1, состояния сброшены')
  }

  // Функция для запуска анимации сделки
  const startDealAnimation = () => {
    console.log('🎬 Запускаем анимацию сделки...')
    setDealAnimationStep(0)
    setDealAnimationStatus('Начинаем анимацию...')
    setDealAnimationComplete(false)
    
    // Шаг 1: Клиент и поставщик начинают движение
    setTimeout(() => {
      setDealAnimationStep(1)
      setDealAnimationStatus('Клиент и поставщик идут к центру...')
    }, 1000)
    
    // Шаг 2: Менеджер проверяет перевод
    setTimeout(() => {
      setDealAnimationStep(2)
      setDealAnimationStatus('Менеджер проверяет перевод...')
    }, 3000)
    
    // Шаг 3: Все встречаются в центре
    setTimeout(() => {
      setDealAnimationStep(3)
      setDealAnimationStatus('Сделка завершена!')
      setDealAnimationComplete(true)
    }, 5000)
  }



  // Функция для перехода к третьему этапу
  const proceedToStage3 = () => {
    console.log('🎬 Переход к этапу 3: Анимация сделки')
    closeModal('stage2Summary')
    setCurrentStage(3)
    startDealAnimation()
  }

  // getSourceDisplayName извлечена в отдельный утиль

  // Проверка доступности шага
  const isStepEnabled = (stepId: number) => {
    // Этап 1: Подготовка данных
    if (currentStage === 1) {
      // Активные шаги в этапе 1: 1, 2, 4, 5
      if ([1, 2, 4, 5].includes(stepId)) {
        return true
      }
      
      // Закрытые шаги в этапе 1: 3, 6, 7
      if ([3, 6, 7].includes(stepId)) {
        return false
      }
    }
    
    // Этап 2: Подготовка инфраструктуры
    if (currentStage === 2) {
      // Все шаги доступны в этапе 2
      return true
    }
    
    // Этап 3: Анимация сделки
    if (currentStage === 3) {
      // Все шаги доступны в этапе 3
      return true
    }
    
    return false
  }

  // Получение прогресса
  // getProgress извлечена в ProgressUtils


  // Функция проверки готовности к показу сводки
  const checkSummaryReadiness = () => {
    const requiredSteps = STAGE_CONFIG.STAGE_1_REQUIRED_STEPS
    const context = createValidationContext()
    const filledSteps = requiredSteps.filter(stepId => isStepFilledByUser(stepId, context))
    
    console.log('🔍 Проверка готовности к сводке:')
    console.log('  - Текущий этап:', currentStage)
    console.log('  - Требуемые шаги:', requiredSteps)
    console.log('  - Заполненные шаги:', filledSteps)
    console.log('  - manualData:', manualData)
    console.log('  - stepConfigs:', stepConfigs)
    
    // НЕ показываем модальное окно предварительного просмотра, если мы уже на этапе 2 или выше
    if (currentStage >= 2) {
      console.log('⏭️ Пропускаем показ модального окна предварительного просмотра - уже на этапе 2+')
      return
    }

    // НЕ показываем модальное окно предварительного просмотра, если уже есть активные модальные окна
    if (modals.summary.isOpen || modals.stageTransition.isOpen) {
      console.log('⏭️ Пропускаем показ модального окна предварительного просмотра - уже есть активные модальные окна')
      return
    }
    
    requiredSteps.forEach(stepId => {
      const isFilled = isStepFilledByUser(stepId, context)
      console.log(`  - Шаг ${stepId}: ${isFilled ? '✅ Заполнен' : '❌ Не заполнен'}`)
    })

    if (filledSteps.length === requiredSteps.length) {
      console.log('✅ Все основные шаги заполнены - показываем сводку')
      openModal('summary')
    } else {
      console.log(`❌ Не все шаги заполнены: ${filledSteps.length}/${requiredSteps.length}`)
    }
  }

  // Обработчик сохранения данных формы
  const handleManualDataSave = (stepId: StepNumber, data: any) => {
    // Валидация данных перед сохранением
    const validation = validateStepData(stepId, data)
    if (!validation.success) {
      console.error(`Ошибка валидации шага ${stepId}:`, validation.errors)
      // Показываем пользователю первую ошибку
      alert(`Ошибка валидации: ${validation.errors[0]}`)
      return
    }
    console.log('=== СОХРАНЕНИЕ ДАННЫХ ===')
    console.log('stepId:', stepId)
    console.log('data для сохранения:', data)
    
    setManualData(prev => {
      console.log('Текущие manualData:', prev)
      
      // Для шага 1 объединяем данные с существующими
      if (stepId === 1) {
        const existingData = prev[stepId] || {}
        const mergedData = { ...existingData, ...data }
        console.log('Объединенные данные:', mergedData)
        const newData = { ...prev, [stepId]: mergedData }
        
              // Проверяем готовность к сводке после обновления данных (только если не на этапе 2+)
      setTimeout(() => {
        if (currentStage < 2) {
          checkSummaryReadiness()
        }
      }, 100)
      return newData
      }
      
      // Для остальных шагов просто заменяем
      const newData = { ...prev, [stepId]: data }
      
      // Автоматическое заполнение шагов IV и V после заполнения шага II
      if (stepId === 2) {
        autoFillStepsFromSupplier(data)
      }
      
      // Автоматическое заполнение шага II после заполнения шагов IV или V
      if (stepId === 4 || stepId === 5) {
        autoFillStepFromRequisites(data, stepId).catch(error => {
          console.error('Ошибка автозаполнения при сохранении шага', stepId, ':', error)
        })
      }
      
      // Проверяем готовность к сводке после обновления данных (только если не на этапе 2+)
      setTimeout(() => {
        if (currentStage < 2) {
          checkSummaryReadiness()
        }
      }, 100)
      return newData
    })
    
    // Проверяем переход между этапами
    setTimeout(() => {
      const currentStage = getCurrentStage()
      const previousStage = getCurrentStage() // Это будет предыдущий этап
      
      if (currentStage === 2 && previousStage === 1) {
        // Показываем уведомление о переходе к этапу 2
        setAutoFillNotification({
          show: true,
          message: '🎉 Этап 1 завершен! Теперь доступны шаги 3, 6, 7 для завершения сделки.',
          supplierName: '',
          filledSteps: [3, 6, 7]
        })
      }
    }, 100)
    
    setSelectedSource(null) // Скрываем форму после сохранения
    setEditingType('') // Сбрасываем тип редактирования
  }

  // Обработчик загрузки файла
  const handleFileUpload = async (stepId: number, file: File) => {
    // Сразу показываем индикатор загрузки
    setOcrAnalyzing(prev => ({ ...prev, [stepId]: true }));
    setOcrError(prev => ({ ...prev, [stepId]: '' }));
    
    try {
      console.log(`🔍 Начинаем загрузку файла для шага ${stepId}:`, file.name)
      console.log(`📄 Тип файла: ${file.type}`)
      console.log(`📏 Размер файла: ${file.size} байт`)
      
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Необходима авторизация для загрузки файлов');
      }

      // Определяем bucket для загрузки в зависимости от шага

      const bucket = bucketMap[stepId as keyof typeof bucketMap] || 'project-files';
      console.log(`📦 Используем bucket: ${bucket}`)
      
      // Генерируем уникальное имя файла (как в обычном конструкторе)
      const date = generateFileDate();
      const timestamp = Date.now();
      const cleanName = cleanFileName(file.name);

      const { url: fileUrl } = await uploadFileToStorage(file, {
        bucket,
        folder: `invoices/atomic`,
        projectRequestId: `${date}_${timestamp}_atomic-constructor`,
        date: ''
      })

      console.log(`🔗 Публичный URL: ${fileUrl}`);
      
      // Сохраняем ссылку на файл
      setUploadedFiles(prev => ({ ...prev, [stepId]: fileUrl }))
      
      // Устанавливаем конфигурацию шага как upload
      setStepConfigs(prev => ({ ...prev, [stepId]: 'upload' }))

      // 🔍 OCR АНАЛИЗ В ЗАВИСИМОСТИ ОТ ШАГА
      console.log(`🔍 Начинаем OCR анализ для шага ${stepId}...`)
      if (stepId === 1) {
        // Анализ карточки компании
        await analyzeCompanyCard(fileUrl, file.type);
      } else if (stepId === 2) {
        // Анализ спецификации/инвойса
        await analyzeSpecification(fileUrl, file.type);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки файла:', error);
      // Показываем ошибку пользователю
      setOcrError(prev => ({ ...prev, [stepId]: `Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` }));
    }
  }

  // 🔍 АНАЛИЗ КАРТОЧКИ КОМПАНИИ
  const analyzeCompanyCard = async (fileUrl: string, fileType: string) => {
    const stepId = 1;
    // setOcrAnalyzing уже установлен в handleFileUpload
    setOcrError(prev => ({ ...prev, [stepId]: '' }));
    
    try {
      console.log("🔍 Начинаем анализ карточки компании...");
      
      const analysisResponse = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: fileUrl,
          fileType: fileType,
          documentType: 'company_card'
        })
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("❌ Ошибка API:", analysisResponse.status, errorText);
        throw new Error(`Ошибка анализа документа: ${analysisResponse.status} - ${errorText}`);
      }

      const analysisResult = await analysisResponse.json();
      
      // Проверяем успешность анализа
      if (!analysisResult.success) {
        console.log("⚠️ Анализ не удался:", analysisResult.error);
        setOcrError(prev => ({ 
          ...prev, 
          [stepId]: analysisResult.error || 'Не удалось извлечь данные из документа' 
        }));
        return;
      }
      
      const extractedData = analysisResult.suggestions;
      
      console.log("✅ Данные компании извлечены:", extractedData);
      console.log("📊 Ключи в extractedData:", Object.keys(extractedData));
      console.log("📊 extractedData.companyName:", extractedData.companyName);
      console.log("📊 extractedData.inn:", extractedData.inn);
      console.log("📊 extractedData.phone:", extractedData.phone);
      console.log("📊 extractedData.email:", extractedData.email);
      console.log("📊 extractedData.bankBik:", extractedData.bankBik);
      console.log("📊 extractedData.bankCorrAccount:", extractedData.bankCorrAccount);
      
      // Сохраняем отладочные данные
      setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }));
      
      // Автозаполнение данных компании
      if (extractedData && Object.keys(extractedData).length > 0) {
        const companyData = {
          name: extractedData.companyName || extractedData.name || '',
          legalName: extractedData.legalName || extractedData.companyName || '',
          inn: extractedData.inn || '',
          kpp: extractedData.kpp || '',
          ogrn: extractedData.ogrn || '',
          address: extractedData.address || '',
          phone: extractedData.phone || '',
          email: extractedData.email || '',
          website: extractedData.website || '',
          director: extractedData.director || '',
          bankName: extractedData.bankName || '',
          bankAccount: extractedData.bankAccount || '',
          bik: extractedData.bankBik || extractedData.bik || '',
          correspondentAccount: extractedData.bankCorrAccount || extractedData.correspondentAccount || ''
        };
        
        // Проверяем, есть ли хотя бы какие-то данные
        const hasData = Object.values(companyData).some(value => value && value.toString().trim() !== '');
        
        if (hasData) {
          // Сохраняем извлеченные данные
          setManualData(prev => ({ ...prev, [stepId]: companyData }));
          console.log("✅ Данные компании автозаполнены:", companyData);
          console.log("📊 Проверяем контактные данные:");
          console.log("📊 companyData.phone:", companyData.phone);
          console.log("📊 companyData.email:", companyData.email);

          // ✅ ЗАКРЫВАЕМ МОДАЛ ТОЛЬКО ПРИ УСПЕШНОМ OCR
          setSelectedSource(null);
        } else {
          console.log("⚠️ Данные извлечены, но все поля пустые");
          setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь данные из документа' }));
        }
      } else {
        console.log("⚠️ extractedData пустой или не содержит данных");
        setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь данные из документа' }));
      }
    } catch (error) {
      console.error("❌ Ошибка анализа карточки компании:", error);
      setOcrError(prev => ({ ...prev, [stepId]: 'Ошибка соединения с сервером' }));
    } finally {
      setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }));
    }
  }

  // 🔍 АНАЛИЗ СПЕЦИФИКАЦИИ/ИНВОЙСА (скопировано из обычного конструктора)
  const analyzeSpecification = async (fileUrl: string, fileType: string) => {
    const stepId = 2;
    // setOcrAnalyzing уже установлен в handleFileUpload
    setOcrError(prev => ({ ...prev, [stepId]: '' }));
    
    try {
      console.log("🔍 Начинаем анализ спецификации...");
      
      const analysisResponse = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: fileUrl,
          fileType: fileType,
          documentType: 'invoice'
        })
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("❌ Ошибка API:", analysisResponse.status, errorText);
        throw new Error(`Ошибка анализа документа: ${analysisResponse.status} - ${errorText}`);
      }

      const analysisResult = await analysisResponse.json();
      const extractedData = analysisResult.suggestions;
      const analysisText = analysisResult.extractedText;
        
        console.log("✅ Данные спецификации извлечены:", extractedData);
        console.log("📊 Ключи в extractedData:", Object.keys(extractedData));
        console.log("📊 extractedData.items:", extractedData.items);
        console.log("📊 extractedData.invoiceInfo:", extractedData.invoiceInfo);
        console.log("📊 extractedData.bankInfo:", extractedData.bankInfo);
        console.log("📊 Детали извлеченных данных:");
        console.log("   - invoiceInfo:", extractedData.invoiceInfo);
        console.log("   - seller:", extractedData.invoiceInfo?.seller);
        console.log("   - items count:", extractedData.items?.length || 0);
        console.log("   - items:", extractedData.items);
        console.log("   - bankInfo:", extractedData.bankInfo);
        console.log("   - analysisText (первые 500 символов):", analysisText?.substring(0, 500));
        
        // Сохраняем отладочные данные
        setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }));
        
        // Очищаем название поставщика от лишних символов (всегда)
        let supplierName = extractedData.invoiceInfo?.seller || extractedData.seller || '';
        
        if (supplierName) {
          // Убираем префиксы типа "| Agent: ", "| Buyer:", "Поставщик:", "Продавец:" и т.д.
          supplierName = supplierName
            .replace(/^\|\s*(Agent|Buyer|Seller|Поставщик|Продавец|Покупатель):\s*/i, '')
            .replace(/^\|\s*/g, '')
            .trim();
        }
        
        console.log("🏢 Поставщик из OCR:", supplierName);
        
        // 🔥 НОВОЕ: Извлекаем банковские реквизиты из инвойса
        const bankRequisites = extractBankRequisitesFromInvoice(extractedData, analysisText);
        console.log("🏦 Извлеченные банковские реквизиты:", bankRequisites);
        
        // Автозаполнение спецификации извлеченными данными (как в обычном конструкторе)
        if (extractedData && extractedData.items && extractedData.items.length > 0) {
          const specificationItems = extractedData.items.map((invoiceItem: any) => ({
            name: invoiceItem.name || "Товар из инвойса", // Основное поле name
            item_name: invoiceItem.name || "Товар из инвойса", // Дублируем для совместимости с UI
            item_code: invoiceItem.code || "", // Используем item_code для совместимости с UI
            code: invoiceItem.code || "", // Дублируем для совместимости
            quantity: Number(invoiceItem.quantity) || 1,
            unit: "шт", // Стандартная единица измерения
            price: Number(invoiceItem.price) || 0,
            total: Number(invoiceItem.total) || 0,
            description: invoiceItem.description || ""
          }));
          
          // Сохраняем извлеченные данные
          const specificationData = {
            supplier: supplierName,
            items: specificationItems,
            totalAmount: extractedData.invoiceInfo?.totalAmount || 
              extractedData.items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0),
            currency: extractedData.invoiceInfo?.currency || extractedData.currency || 'RUB'
          };
          
          setManualData(prev => {
            const newData = { ...prev, [stepId]: specificationData };
            console.log("🔄 Обновляем manualData для шага", stepId);
            console.log("📊 Новые данные:", newData);
            console.log("📊 manualData после обновления:", newData);
            return newData;
          });
          console.log("✅ Спецификация автозаполнена:", specificationData);
          console.log(`✅ Добавлено ${specificationItems.length} позиций на сумму ${specificationData.totalAmount} руб.`);

          // ✅ ЗАКРЫВАЕМ МОДАЛ ТОЛЬКО ПРИ УСПЕШНОМ OCR
          setSelectedSource(null);
          
          // 🔥 НОВОЕ: Автоматически предлагаем способ оплаты и реквизиты
          if (bankRequisites.hasRequisites) {
            suggestPaymentMethodAndRequisites(bankRequisites, supplierName);
          }
        } else {
          // Если товары не найдены, но есть информация о поставщике, сохраняем её
          if (extractedData && extractedData.invoiceInfo && supplierName) {
            const specificationData = {
              supplier: supplierName,
              items: [],
              totalAmount: 0,
              currency: extractedData.invoiceInfo?.currency || extractedData.currency || 'RUB'
            };
            
            setManualData(prev => ({ ...prev, [stepId]: specificationData }));
            console.log("✅ Поставщик сохранен:", specificationData);
            setOcrError(prev => ({ ...prev, [stepId]: 'Найдена информация об инвойсе, но товары не извлечены. Добавьте позиции вручную.' }));

            // ✅ ЗАКРЫВАЕМ МОДАЛ ДАЖЕ ЕСЛИ НЕ ВСЕ ДАННЫЕ ИЗВЛЕЧЕНЫ (частичный успех)
            setSelectedSource(null);
            
            // 🔥 НОВОЕ: Предлагаем реквизиты даже если нет товаров
            if (bankRequisites.hasRequisites) {
              suggestPaymentMethodAndRequisites(bankRequisites, supplierName);
            }
          } else {
            console.log("⚠️ Товары не найдены в документе");
            setOcrError(prev => ({ ...prev, [stepId]: 'Не удалось извлечь товары из документа' }));
          }
        }
    } catch (error) {
      console.error("❌ Ошибка анализа спецификации:", error);
      setOcrError(prev => ({ ...prev, [stepId]: 'Ошибка соединения с сервером' }));
    } finally {
      setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }));
    }
  }

  // 🔥 НОВАЯ ФУНКЦИЯ: Извлечение банковских реквизитов из инвойса
  const extractBankRequisitesFromInvoice = (extractedData: any, analysisText: string) => {
    console.log("🏦 Начинаем извлечение банковских реквизитов из инвойса...");
    
    const requisites = {
      bankName: '',
      accountNumber: '',
      swift: '',
      recipientName: '',
      recipientAddress: '',
      transferCurrency: '',
      hasRequisites: false
    };

    // Извлекаем данные из структурированных полей
    if (extractedData.bankInfo) {
      requisites.bankName = extractedData.bankInfo.bankName || '';
      requisites.accountNumber = extractedData.bankInfo.accountNumber || '';
      requisites.swift = extractedData.bankInfo.swift || '';
      requisites.recipientName = extractedData.bankInfo.recipientName || '';
      requisites.recipientAddress = extractedData.bankInfo.recipientAddress || '';
      requisites.transferCurrency = extractedData.bankInfo.currency || '';
    }

    // 🔥 НОВОЕ: Очищаем recipientName от лишних символов
    if (requisites.recipientName) {
      requisites.recipientName = requisites.recipientName
        .replace(/\(账户名称\):\s*/i, '') // Убираем китайский текст
        .replace(/\(Account Name\):\s*/i, '') // Убираем английский текст
        .replace(/^[^a-zA-Z0-9]*/, '') // Убираем символы в начале
        .trim();
      console.log("🧹 Очищенное recipientName:", requisites.recipientName);
    }

    // Если структурированные данные не найдены, ищем в тексте
    if (!requisites.accountNumber && analysisText) {
      // Поиск номера счета (USD A/C NO., EUR A/C NO., Account Number)
      const accountPatterns = [
        /USD\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /EUR\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /Account\s*Number\s*:?\s*(\d+)/i,
        /A\/C\s*NO\.?\s*:?\s*(\d+)/i,
        /Номер\s*счета\s*:?\s*(\d+)/i
      ];
      
      for (const pattern of accountPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.accountNumber = match[1];
          console.log("✅ Найден номер счета:", requisites.accountNumber);
          break;
        }
      }

      // Поиск SWIFT кода
      const swiftPatterns = [
        /SWIFT\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
        /SWIFT\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
        /BIC\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i
      ];
      
      for (const pattern of swiftPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.swift = match[1];
          console.log("✅ Найден SWIFT код:", requisites.swift);
          break;
        }
      }

      // Поиск названия получателя (ACCOUNT NAME, BENEFICIARY)
      const recipientPatterns = [
        /ACCOUNT\s*NAME\s*:?\s*([^\n]+)/i,
        /BENEFICIARY\s*NAME\s*:?\s*([^\n]+)/i,
        /Получатель\s*:?\s*([^\n]+)/i
      ];
      
      for (const pattern of recipientPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.recipientName = match[1].trim();
          console.log("✅ Найдено название получателя:", requisites.recipientName);
          break;
        }
      }

      // Поиск адреса получателя
      const addressPatterns = [
        /BENEFICIARY'?S?\s*ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i,
        /ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i,
        /Адрес\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i
      ];
      
      for (const pattern of addressPatterns) {
        const match = analysisText.match(pattern);
        if (match) {
          requisites.recipientAddress = match[1].trim();
          console.log("✅ Найден адрес получателя:", requisites.recipientAddress);
          break;
        }
      }

      // Определение валюты из номера счета
      if (analysisText.includes('USD A/C NO.') || analysisText.includes('USD')) {
        requisites.transferCurrency = 'USD';
      } else if (analysisText.includes('EUR A/C NO.') || analysisText.includes('EUR')) {
        requisites.transferCurrency = 'EUR';
      }
    }

    // Проверяем, есть ли хотя бы основные реквизиты
    requisites.hasRequisites = !!(requisites.accountNumber || requisites.swift || requisites.recipientName);
    
    console.log("🏦 Результат извлечения реквизитов:", requisites);
    return requisites;
  };

  // 🔥 НОВАЯ ФУНКЦИЯ: Предложение способа оплаты и реквизитов
  const suggestPaymentMethodAndRequisites = (bankRequisites: any, ocrSupplierName: string) => {
    console.log("💡 Предлагаем способ оплаты и реквизиты:", bankRequisites);
    console.log("🏢 Поставщик из OCR (переданный):", ocrSupplierName);
    
    // Используем переданное имя поставщика
    let supplierName = ocrSupplierName || '';
    
    // Если OCR не нашел поставщика, пробуем из банковских реквизитов
    if (!supplierName) {
      supplierName = bankRequisites.recipientName || '';
      console.log("🔍 Поставщик из банковских реквизитов (fallback):", supplierName);
    }
    
    // Fallback to step 2 data if still empty (though it should be passed now)
    if (!supplierName && manualData[2]?.supplier) {
      supplierName = manualData[2].supplier;
      console.log("🔍 Поставщик из шага 2 (fallback):", supplierName);
    }
    
    console.log("🏢 Финальный поставщик для шага 4:", supplierName);
    
    console.log("🏢 Поставщик для модального окна:", supplierName);
    
    // Автоматически предлагаем "Банковский перевод" как способ оплаты
    const paymentMethodData = {
      method: 'bank-transfer',
      supplier: supplierName,
      suggested: true,
      source: 'ocr_invoice'
    };
    
    // Подготавливаем реквизиты как предложения
    const requisitesData = {
      type: 'bank',  // Устанавливаем тип для корректного отображения
      bankName: bankRequisites.bankName || '',
      accountNumber: bankRequisites.accountNumber || '',
      swift: bankRequisites.swift || '',
      recipientName: bankRequisites.recipientName || '',
      recipientAddress: bankRequisites.recipientAddress || '',
      transferCurrency: bankRequisites.transferCurrency || 'USD',
      suggested: true,
      source: 'ocr_invoice'
    };
    
    // 🔥 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА
    console.log("🔍 ДЕТАЛЬНАЯ ОТЛАДКА РЕКВИЗИТОВ:");
    console.log("   - bankRequisites.bankName:", bankRequisites.bankName);
    console.log("   - bankRequisites.accountNumber:", bankRequisites.accountNumber);
    console.log("   - bankRequisites.swift:", bankRequisites.swift);
    console.log("   - bankRequisites.recipientName:", bankRequisites.recipientName);
    console.log("   - requisitesData.bankName:", requisitesData.bankName);
    console.log("   - requisitesData.accountNumber:", requisitesData.accountNumber);
    console.log("   - requisitesData.swift:", requisitesData.swift);
    
    // Сохраняем предложения в manualData
    setManualData(prev => {
      const newData = {
        ...prev,
        4: paymentMethodData,  // Шаг 4 - Способ оплаты
        5: requisitesData      // Шаг 5 - Реквизиты
      };
      console.log("💾 Сохраняем в manualData[5]:", newData[5]);
      return newData;
    });
    
    // Устанавливаем источники данных
    setStepConfigs(prev => ({
      ...prev,
      4: 'ocr_suggestion',
      5: 'ocr_suggestion'
    }));
    
    console.log("✅ Предложения сохранены:");
    console.log("   - Шаг 4 (Способ оплаты):", paymentMethodData);
    console.log("   - Шаг 5 (Реквизиты):", requisitesData);
  };

  // Обработчик отмены выбора источника

  // Удалено: функция handleViewStepData больше не нужна - используем инлайн-формы

  const handleRemoveSource = (stepId: number) => {
    // Удаляем источник данных для конкретного шага
    setStepConfigs(prev => {
      const newConfigs = { ...prev }
      delete newConfigs[stepId]
      return newConfigs
    })
    
    // Очищаем сохраненные данные
    setManualData(prev => {
      const newData = { ...prev }
      delete newData[stepId]
      return newData
    })
    
    // Очищаем загруженные файлы
    setUploadedFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[stepId]
      return newFiles
    })
    
    // Сбрасываем выбранный источник
    setSelectedSource(null)
  }

  // Функция для открытия предварительного просмотра данных
  const handlePreviewData = (type: string, data: any) => {
    console.log('=== ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР ===')
    console.log('type:', type)
    console.log('data для просмотра:', data)
    console.log('manualData[1]:', manualData[1])
    
    // 🔥 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА ДЛЯ РЕКВИЗИТОВ
    if (type === 'requisites') {
      console.log('🔍 ОТЛАДКА РЕКВИЗИТОВ:')
      console.log('   - bankName:', data.bankName)
      console.log('   - accountNumber:', data.accountNumber)
      console.log('   - swift:', data.swift)
      console.log('   - recipientName:', data.recipientName)
      console.log('   - supplier:', data.supplier)
      console.log('   - suggested:', data.suggested)
      console.log('   - source:', data.source)
    }
    
    // 🔥 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА ДЛЯ СПОСОБА ОПЛАТЫ
    if (type === 'payment') {
      console.log('🔍 ОТЛАДКА СПОСОБА ОПЛАТЫ:')
      console.log('   - method:', data.method)
      console.log('   - supplier:', data.supplier)
      console.log('   - suggested:', data.suggested)
      console.log('   - source:', data.source)
    }
    
    setPreviewType(type)
    setPreviewData(data)
    openModal('preview', { previewType: type, previewData: data })
  }

  // Функция для открытия формы редактирования
  const handleEditData = (type: string) => {
    setSelectedSource("manual")
    closeModal('preview')
    // ВСЕ типы редактирования теперь открывают полную форму компании
    setEditingType('company')
  }

  // Функция удалена - счетчики теперь управляются в CatalogModal

  
  // Обработчик добавления товаров из каталога
  const handleCatalogProductsAdd = (products: any[]) => {
    try {
      console.error('🚨🚨🚨 ATOMIC CATALOG ADD CALLED! Products:', products?.length || 0)
      alert('🚨 ATOMIC: Товары получены! Количество: ' + (products?.length || 0))
      console.log('🔥 [ATOMIC] ВЫЗОВ handleCatalogProductsAdd функции!', products?.length || 0, 'товаров')
      console.log('📦 [ATOMIC] Получены товары из каталога:', products)

      // Преобразуем товары в формат Step II
      const catalogItems = products.map(product => ({
        name: product.name || product.item_name || 'Товар из каталога',
        quantity: product.quantity || 1,
        price: parseFloat(product.price) || 0,
        currency: product.currency || 'USD',
        supplier_id: product.supplier_id,
        supplier_name: product.supplier_name,
        image_url: product.image_url || product.images?.[0] || '',
        sku: product.sku || product.item_code || ''
      }))

      // Добавляем товары в Step II
      setManualData(prev => ({
        ...prev,
        2: {
          ...prev[2],
          supplier: catalogItems[0]?.supplier_name || prev[2]?.supplier,
          currency: catalogItems[0]?.currency || prev[2]?.currency || 'USD',
          items: [...(prev[2]?.items || []), ...catalogItems]
        }
      }))

      // Устанавливаем источник данных для Step II
      setStepConfigs(prev => ({
        ...prev,
        2: 'catalog'
      }))

      console.log(`✅ [ATOMIC] Добавлено ${catalogItems.length} товаров в спецификацию`)

      // Вызываем автоматическое заполнение для Step II данных (обратная связь)
      const step2Data = {
        supplier: catalogItems[0]?.supplier_name,
        currency: catalogItems[0]?.currency || 'USD',
        items: catalogItems,
        supplier_id: catalogItems[0]?.supplier_id // Добавляем supplier_id для правильной работы autoFillStepFromRequisites
      }

      // Используем setTimeout для правильной последовательности обновлений состояния
      setTimeout(() => {
        if (catalogItems[0]?.supplier_id) {
          autoFillStepFromRequisites(step2Data, 2).catch(error => {
            console.error('Ошибка автозаполнения из каталога:', error)
          })
        }
      }, 100)

      // 🎯 АВТОЗАПОЛНЕНИЕ ДАННЫХ ПОСТАВЩИКА ДЛЯ ШАГОВ IV И V
      const firstProduct = products[0]
      if (firstProduct?.supplier_id) {
        console.log('🔍 [ATOMIC] Загружаем данные поставщика для автозаполнения:', firstProduct.supplier_name)

        // ПРИОРИТЕТ КАТАЛОГА: Когда товары из каталога, ВСЕГДА используем свежие данные каталога
        console.log('🎯 [ATOMIC] Товары добавлены из каталога - приоритет данных каталога над эхо данными')

        // Сначала загружаем АКТУАЛЬНЫЕ данные каталога
        fetchCatalogData('verified-suppliers', { search: firstProduct.supplier_name })
          .then(data => {
            console.log('🔍 [ATOMIC] Ответ API verified-suppliers:', data)
            const supplier = data.suppliers?.find((s: any) =>
              s.name.toLowerCase().includes(firstProduct.supplier_name.toLowerCase())
            )

            if (supplier) {
              console.log('✅ [ATOMIC] Найден поставщик в каталоге:', supplier)

              // Заполняем Step IV с РЕАЛЬНЫМИ методами оплаты из каталога
              console.log('🎯 [ATOMIC] Заполняю Step 4 с данными поставщика:', supplier.name)
              console.log('💳 [ATOMIC] Доступные методы оплаты:', supplier.payment_methods)

              // Фильтруем методы оплаты, исключая cash (наличные) и убираем дубликаты
              const normalizedMethods = (supplier.payment_methods || ['bank_transfer'])
                .map((method: string) => method === 'bank_transfer' ? 'bank-transfer' : method) // Нормализуем формат
                .filter((method: string) => method !== 'cash') // Исключаем наличные
                .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) // Убираем дубликаты
              const availableMethods = normalizedMethods.length > 0 ? normalizedMethods : ['bank-transfer']

              const step4Data = {
                type: 'multiple',
                methods: availableMethods,
                payment_method: availableMethods[0] || 'bank_transfer',
                auto_filled: true,
                supplier_name: supplier.name,
                supplier_data: supplier,
                catalog_source: 'verified_supplier',
                user_choice: true
              }

              console.log('📋 [ATOMIC] Step 4 Data:', step4Data)

              setManualData(prev => ({
                ...prev,
                4: step4Data
              }))

              // Заполняем Step V с РЕАЛЬНЫМИ реквизитами из каталога
              // Определяем тип по первому доступному методу оплаты
              const primaryType = supplier.payment_methods?.includes('bank-transfer') || supplier.bank_accounts?.length > 0 ? 'bank' :
                                  supplier.payment_methods?.includes('p2p') || supplier.p2p_cards?.length > 0 ? 'p2p' :
                                  supplier.payment_methods?.includes('crypto') || supplier.crypto_wallets?.length > 0 ? 'crypto' : 'bank';

              setManualData(prev => ({
                ...prev,
                5: {
                  type: primaryType,  // ✅ Добавляем type для корректного отображения кубика с данными
                  supplier_name: supplier.name,
                  supplier_data: supplier,
                  bank_accounts: supplier.bank_accounts || [],
                  crypto_wallets: supplier.crypto_wallets || [],
                  p2p_cards: supplier.p2p_cards || [],
                  requisites: {
                    bank_accounts: supplier.bank_accounts || [],
                    crypto_wallets: supplier.crypto_wallets || [],
                    p2p_cards: supplier.p2p_cards || []
                  },
                  auto_filled: true,
                  catalog_source: 'verified_supplier',
                  user_choice: false
                }
              }))

              // Устанавливаем конфигурацию как каталожную
              setStepConfigs(prev => ({
                ...prev,
                4: 'catalog',
                5: 'catalog'
              }))

              console.log('✅ [ATOMIC] Шаги 4 и 5 заполнены РЕАЛЬНЫМИ данными каталога')

              // Показываем уведомление с реальными данными
              setAutoFillNotification({
                show: true,
                message: `Данные поставщика "${supplier.name}" из каталога применены. Доступно методов: ${supplier.payment_methods?.length || 0}`,
                supplierName: supplier.name,
                filledSteps: [4, 5]
              })

              // Скрываем уведомление через 7 секунд
              setTimeout(() => {
                setAutoFillNotification(null)
              }, 7000)
            } else {
              console.log('❌ [ATOMIC] Поставщик не найден в каталоге')

              // ЭХО ДАННЫЕ ОТКЛЮЧЕНЫ: Fallback с эхо данными отключен
              // Пользователь увидит рекомендации из каталога или заполнит вручную
              console.log('❌ [ATOMIC] Нет данных поставщика, пользователь заполнит вручную')

              // Fallback с базовыми данными
              setManualData(prev => ({
                ...prev,
                4: {
                  type: 'multiple',
                  methods: ['bank_transfer'],
                  payment_method: 'bank_transfer',
                  auto_filled: true,
                  supplier_name: firstProduct.supplier_name,
                  catalog_source: 'unknown_supplier',
                  user_choice: true
                }
              }))

              setStepConfigs(prev => ({
                ...prev,
                4: 'catalog'
              }))
            }
          }).catch(error => {
            console.error('❌ [ATOMIC] Ошибка загрузки данных каталога:', error)
          })
      }

      // Закрываем модальное окно каталога
      setShowCatalogModal(false)

    } catch (error) {
      console.error('❌ [ATOMIC] КРИТИЧЕСКАЯ ОШИБКА в handleCatalogProductsAdd:', error)
      alert('🚨 ОШИБКА: ' + error)
    }
  }




  // ЭХО ДАННЫЕ ОТКЛЮЧЕНЫ: Автоматическая проверка доступности эхо данных отключена
  // Больше не показываем звёздочки (⭐) на кубиках шагов при наличии эхо данных
  // useEffect(() => {
  //   // Проверяем, есть ли данные в любом из шагов 2, 4, 5
  //   const hasAnyStepData = manualData[2] || manualData[4] || manualData[5] || selectedSupplierData
  //
  //   if (hasAnyStepData) {
  //     checkEchoDataAvailability()
  //   } else {
  //     setEchoDataAvailable({})
  //   }
  // }, [manualData[2], manualData[4], manualData[5], selectedSupplierData])
  
  // ЭХО ДАННЫЕ в атомарном конструкторе ОТКЛЮЧЕНЫ для упрощения работы
  // Автоматический поиск эхо данных для шагов 1 и 2 временно отключён
  // useEffect(() => {
  //   const hasAnyStepData = manualData[2] || manualData[4] || manualData[5] || selectedSupplierData
  //   if (hasAnyStepData && !(manualData as any).echoSuggestions?.step1) {
  //     suggestEchoDataForSteps()
  //   }
  // }, [manualData[2], manualData[4], manualData[5], selectedSupplierData])

  // Обработчик клика по карточке шага в блоке 2
  const handleStepCardClick = (item: any) => {
    // Открываем модальное окно для всех карточек в блоке 2
    handlePreviewData(getPreviewType(item.stepId), item.data)
  }

  // getPreviewType извлечена в ProgressUtils


  // Функции для обработки источников каталога
  const handleBlueRoomSource = async () => {
    if (!catalogSourceStep) return
    
    console.log('🔵 Загружаем данные из синей комнаты для шага:', catalogSourceStep)
    
    setBlueRoomLoading(true)
    setShowCatalogSourceModal(false)
    
    try {
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 [DEBUG] Сессия:', session ? 'Есть' : 'Нет');
      
      if (!session) {
        console.error('❌ Нет активной сессии для загрузки синей комнаты');
        alert('Ошибка авторизации. Войдите в систему.');
        return;
      }

      console.log('🔍 [DEBUG] Токен доступа:', session.access_token ? 'Есть' : 'Нет');
      console.log('🔍 [DEBUG] User ID:', session.user?.id);

      const data = await fetchCatalogData('user-suppliers', {}, session);
      console.log('🔍 [DEBUG] Данные ответа:', data);
      
      if (data.suppliers && data.suppliers.length > 0) {
        console.log('✅ Найдены поставщики в синей комнате:', data.suppliers.length)
        setBlueRoomSuppliers(data.suppliers)
        openModal('blueRoomSupplier')
      } else {
        console.log('❌ Нет поставщиков в синей комнате')
        console.log('🔍 [DEBUG] Полный ответ API:', data);
        alert('В синей комнате нет поставщиков. Добавьте поставщиков в каталог.')
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки синей комнаты:', error)
      alert('Ошибка загрузки поставщиков из синей комнаты')
    } finally {
      setBlueRoomLoading(false)
    }
  }

  const handleOrangeRoomSource = async () => {
    if (!catalogSourceStep) return
    
    console.log('🟠 Загружаем данные из оранжевой комнаты для шага:', catalogSourceStep)
    
    try {
      // Получаем токен авторизации
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Нет активной сессии для загрузки оранжевой комнаты');
        alert('Ошибка авторизации. Войдите в систему.');
        return;
      }

      const data = await fetchCatalogData('verified-suppliers', {}, session);
      
      if (data.suppliers && data.suppliers.length > 0) {
        console.log('✅ Найдены поставщики в оранжевой комнате:', data.suppliers.length)
        setOrangeRoomSuppliers(data.suppliers)
        openModal('orangeRoomSupplier')
      } else {
        console.log('❌ Нет поставщиков в оранжевой комнате')
        alert('В оранжевой комнате нет поставщиков.')
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки оранжевой комнаты:', error)
      alert('Ошибка загрузки поставщиков из оранжевой комнаты')
    }
    
    setShowCatalogSourceModal(false)
  }


  // Функция выбора поставщика из синей комнаты
  // Функция выбора метода оплаты и автоматического заполнения реквизитов
  const handlePaymentMethodSelect = (method: string, supplier: any) => {
    console.log('🎯 Выбран метод оплаты:', method)

    // Обновляем шаг 4 - СОХРАНЯЕМ существующие данные и устанавливаем выбранный метод
    setManualData(prev => ({
      ...prev,
      4: {
        ...prev[4], // ВАЖНО: сохраняем все существующие данные
        type: 'single',
        method: method,
        selectedMethod: method,
        defaultMethod: method,
        user_choice: true // Указываем что пользователь сделал выбор
      }
    }))
    
    // Автоматически заполняем шаг 5 соответствующими реквизитами
    let requisitesData = {
      user_choice: true,
      type: method === 'bank-transfer' ? 'bank' : method,
      source: 'catalog'
    }

    // Используем правильную структуру данных поставщика
    const supplierData = supplier || selectedSupplierData

    console.log('🔍 [SUPPLIER DEBUG] supplier:', supplier)
    console.log('🔍 [SUPPLIER DEBUG] selectedSupplierData:', selectedSupplierData)
    console.log('🔍 [SUPPLIER DEBUG] final supplierData:', supplierData)
    console.log('🔍 [SUPPLIER DEBUG] crypto_wallets:', supplierData?.crypto_wallets)

    if (method === 'crypto' && supplierData?.crypto_wallets?.length > 0) {
      const wallet = supplierData.crypto_wallets[0]
      console.log('🔍 [CRYPTO DEBUG] wallet data:', wallet)
      console.log('🔍 [CRYPTO DEBUG] wallet.network:', wallet.network)

      requisitesData = {
        ...requisitesData,
        type: 'crypto',
        crypto_name: wallet.currency || wallet.network || 'USDT',
        crypto_address: wallet.address,
        crypto_network: wallet.network || 'USDT TRC20'
      } as any

      console.log('🔍 [CRYPTO DEBUG] final requisitesData:', requisitesData)
    } else if (method === 'p2p' && supplierData?.p2p_cards?.length > 0) {
      const card = supplierData.p2p_cards[0]
      requisitesData = {
        ...requisitesData,
        type: 'p2p',
        card_bank: card.bank,
        card_number: card.number,
        card_holder: card.holder,
        card_expiry: card.expiry || ''
      } as any
    } else if ((method === 'bank-transfer' || method === 'bank') && supplierData?.bank_accounts?.length > 0) {
      const bank = supplierData.bank_accounts[0]
      requisitesData = {
        ...requisitesData,
        type: 'bank',
        bankName: bank.bank_name,
        recipientName: supplierData.name || supplierData.company_name,
        accountNumber: bank.account_number,
        swift: bank.swift_code,
        iban: bank.iban || '',
        transferCurrency: bank.currency || 'RUB'
      } as any
    }
    
    // Сохраняем реквизиты в шаге 5
    setManualData(prev => ({
      ...prev,
      5: requisitesData
    }))
    
    // Устанавливаем источник данных для шага 5
    setStepConfigs(prev => ({
      ...prev,
      5: 'catalog'
    }))
    
    console.log('✅ Автоматически заполнены реквизиты для метода:', method)
    console.log('📋 manualData[4]:', manualData[4])
    console.log('📋 manualData[5]:', requisitesData)
    console.log('📋 stepConfigs[5]:', 'catalog')

    // Показываем уведомление
    alert(`Выбран метод оплаты: ${method === 'crypto' ? 'Криптовалюта' : method === 'p2p' ? 'P2P перевод' : 'Банковский перевод'}. Реквизиты автоматически заполнены.`)
  }

  const handleSelectBlueRoomSupplier = async (supplier: any) => {
    console.log('🎯 === НАЧАЛО handleSelectBlueRoomSupplier ===')
    console.log('🎯 supplier:', supplier)
    console.log('🎯 catalogSourceStep:', catalogSourceStep)
    console.log('🎯 lastHoveredStep:', lastHoveredStep)
    
    if (!catalogSourceStep) {
      console.log('❌ catalogSourceStep не установлен, выходим')
      return
    }
    
    try {
      // Используем данные поставщика напрямую (они уже включают catalog_user_products)
      const fullSupplier = supplier
      
      // Сохраняем данные поставщика для использования в других шагах
      setSelectedSupplierData(fullSupplier)
      
      // АВТОМАТИЧЕСКИ заполняем связанные шаги при выборе поставщика!
      console.log('🎯 Автоматически заполняем связанные шаги для поставщика:', fullSupplier.name)
      
      // Шаг 2: Товары поставщика (ОБЯЗАТЕЛЬНО!)
      const specificationData = {
        supplier: fullSupplier.name,
        currency: fullSupplier.currency || 'USD',
        items: fullSupplier.catalog_user_products?.map((product: any) => ({
          name: product.name,
          description: product.description || '',
          quantity: 1,
          price: product.price || 0,
          unit: product.unit || 'шт'
        })) || [],
        user_choice: true
      }
      
      // Шаг 4: Методы оплаты поставщика
      const paymentMethods = []
      if (fullSupplier.payment_methods?.bank) {
        paymentMethods.push('bank')
      }
      if (fullSupplier.payment_methods?.card) {
        paymentMethods.push('p2p')
      }
      if (fullSupplier.payment_methods?.crypto) {
        paymentMethods.push('crypto')
      }
      
      const paymentData = {
        type: 'multiple',
        methods: paymentMethods,
        defaultMethod: paymentMethods[0] || 'bank',
        supplier: fullSupplier.name,
        user_choice: true
      }
      
      // Шаг 5: Реквизиты поставщика
      const allRequisites = []
      if (fullSupplier.payment_methods?.bank) {
        allRequisites.push({
          type: 'bank',
          bankName: fullSupplier.payment_methods.bank.bank_name,
          accountNumber: fullSupplier.payment_methods.bank.account_number,
          bik: fullSupplier.payment_methods.bank.bik,
          correspondentAccount: fullSupplier.payment_methods.bank.correspondent_account,
          supplier: fullSupplier.name
        })
      }
      if (fullSupplier.payment_methods?.card) {
        allRequisites.push({
          type: 'p2p',
          card_number: fullSupplier.payment_methods.card.number,
          card_bank: fullSupplier.payment_methods.card.bank,
          card_holder: fullSupplier.payment_methods.card.holder,
          supplier: fullSupplier.name
        })
      }
      if (fullSupplier.payment_methods?.crypto) {
        allRequisites.push({
          type: 'crypto',
          crypto_address: fullSupplier.payment_methods.crypto.address,
          crypto_network: fullSupplier.payment_methods.crypto.network,
          supplier: fullSupplier.name
        })
      }
      
      const requisitesData = {
        type: 'multiple',
        requisites: allRequisites,
        defaultRequisite: allRequisites[0] || null,
        supplier: fullSupplier.name,
        user_choice: true
      }
      
      // Сохраняем данные для шагов 2, 4, 5 (НЕ шаг 1!)
      setManualData(prev => ({
        ...prev,
        2: specificationData,
        4: paymentData,
        5: requisitesData
      }))
      
      // Устанавливаем источники для шагов 2, 4, 5
      setStepConfigs(prev => ({
        ...prev,
        2: 'blue_room',
        4: 'blue_room',
        5: 'blue_room'
      }))
      
      console.log('✅ Автоматически заполнены связанные шаги для поставщика:')
      console.log('  - Шаг 2 (товары):', specificationData.items.length, 'товаров')
      console.log('  - Шаг 4 (оплата):', paymentMethods.length, 'методов')
      console.log('  - Шаг 5 (реквизиты):', allRequisites.length, 'реквизитов')
      console.log('  - Шаг 1 (клиент): НЕ заполняется (пользователь выберет сам)')
      
      // Закрываем модальное окно каталога
      setShowCatalogSourceModal(false)
      setCatalogSourceStep(null)
      
      // Показываем уведомление об успешном заполнении
      console.log(`✅ Данные поставщика "${fullSupplier.name}" успешно применены ко ВСЕМ шагам!`)

      // ЭХО ДАННЫЕ в атомарном конструкторе ОТКЛЮЧЕНЫ для упрощения работы
      // Рекомендации из каталога показываются через stepConfigs[5] = 'catalog'

    } catch (error) {
      console.error('❌ Ошибка при выборе поставщика:', error)
      alert('Ошибка при выборе поставщика')
    }

    closeModal('blueRoomSupplier')
  }

  // Обработчик выбора поставщика из оранжевой комнаты (аккредитованные поставщики)
  const handleSelectOrangeRoomSupplier = async (supplier: any) => {
    console.log('🟠 === НАЧАЛО handleSelectOrangeRoomSupplier ===')
    console.log('🟠 supplier:', supplier)
    console.log('🟠 catalogSourceStep:', catalogSourceStep)

    if (!catalogSourceStep) {
      console.log('❌ catalogSourceStep не установлен, выходим')
      return
    }

    try {
      // Используем данные аккредитованного поставщика
      const fullSupplier = supplier

      // Сохраняем данные поставщика для использования в других шагах
      setSelectedSupplierData(fullSupplier)

      console.log('🟠 Автоматически заполняем связанные шаги для аккредитованного поставщика:', fullSupplier.name)

      // Шаг 2: Товары поставщика
      const specificationData = {
        supplier: fullSupplier.name,
        currency: fullSupplier.currency || 'USD',
        items: fullSupplier.catalog_verified_products?.map((product: any) => ({
          name: product.name,
          description: product.description || '',
          quantity: 1,
          price: product.price || 0,
          unit: product.unit || 'шт'
        })) || [],
        user_choice: true
      }

      // Шаг 4: Методы оплаты
      const paymentMethods = fullSupplier.payment_methods || []
      const paymentData = {
        type: 'multiple',
        methods: paymentMethods,
        defaultMethod: paymentMethods[0] || 'bank',
        supplier: fullSupplier.name,
        user_choice: true
      }

      // Шаг 5: Реквизиты
      const allRequisites: any[] = []
      if (fullSupplier.bank_accounts?.length > 0) {
        fullSupplier.bank_accounts.forEach((account: any) => {
          allRequisites.push({
            type: 'bank',
            bankName: account.bank_name,
            accountNumber: account.account_number,
            bik: account.bik,
            correspondentAccount: account.correspondent_account,
            supplier: fullSupplier.name
          })
        })
      }
      if (fullSupplier.p2p_cards?.length > 0) {
        fullSupplier.p2p_cards.forEach((card: any) => {
          allRequisites.push({
            type: 'p2p',
            card_number: card.card_number,
            card_bank: card.bank_name,
            card_holder: card.card_holder,
            supplier: fullSupplier.name
          })
        })
      }
      if (fullSupplier.crypto_wallets?.length > 0) {
        fullSupplier.crypto_wallets.forEach((wallet: any) => {
          allRequisites.push({
            type: 'crypto',
            crypto_address: wallet.wallet_address,
            crypto_network: wallet.network,
            supplier: fullSupplier.name
          })
        })
      }

      const requisitesData = {
        type: 'multiple',
        requisites: allRequisites,
        defaultRequisite: allRequisites[0] || null,
        supplier: fullSupplier.name,
        user_choice: true
      }

      // Сохраняем данные для шагов 2, 4, 5
      setManualData(prev => ({
        ...prev,
        2: specificationData,
        4: paymentData,
        5: requisitesData
      }))

      // Устанавливаем источники для шагов 2, 4, 5
      setStepConfigs(prev => ({
        ...prev,
        2: 'orange_room',
        4: 'orange_room',
        5: 'orange_room'
      }))

      console.log('✅ Автоматически заполнены связанные шаги для аккредитованного поставщика:')
      console.log('  - Шаг 2 (товары):', specificationData.items.length, 'товаров')
      console.log('  - Шаг 4 (оплата):', paymentMethods.length, 'методов')
      console.log('  - Шаг 5 (реквизиты):', allRequisites.length, 'реквизитов')

    } catch (error) {
      console.error('❌ Ошибка при выборе аккредитованного поставщика:', error)
      alert('Ошибка при выборе поставщика')
    }

    closeModal('orangeRoomSupplier')
  }

  // Функция поиска поставщика в каталоге по реквизитам
  const findSupplierByRequisites = async (requisites: any) => {
    try {
      console.log('🔍 Поиск поставщика по реквизитам:', requisites)
      
      // Получаем всех поставщиков из каталога
      const suppliers = await fetchCatalogData('user-suppliers')
      
      if (!suppliers || suppliers.length === 0) {
        console.log('❌ Нет поставщиков в каталоге')
        return null
      }
      
      // Ищем поставщика с совпадающими реквизитами
      for (const supplier of suppliers) {
        console.log('🔍 Проверяем поставщика:', supplier.name)
        
        // Проверяем банковские реквизиты
        if (requisites.type === 'bank' && supplier.payment_methods?.bank) {
          const bankMatch = 
            supplier.payment_methods.bank.account_number === requisites.accountNumber ||
            supplier.payment_methods.bank.bank_name === requisites.bankName
          
          if (bankMatch) {
            console.log('✅ Найден поставщик по банковским реквизитам:', supplier.name)
            return supplier
          }
        }
        
        // Проверяем P2P реквизиты
        if (requisites.type === 'p2p' && supplier.payment_methods?.card) {
          const p2pMatch = 
            supplier.payment_methods.card.number === requisites.card_number ||
            supplier.payment_methods.card.bank === requisites.card_bank
          
          if (p2pMatch) {
            console.log('✅ Найден поставщик по P2P реквизитам:', supplier.name)
            return supplier
          }
        }
        
        // Проверяем крипто реквизиты
        if (requisites.type === 'crypto' && supplier.payment_methods?.crypto) {
          const cryptoMatch = 
            supplier.payment_methods.crypto.address === requisites.crypto_address ||
            supplier.payment_methods.crypto.network === requisites.crypto_network
          
          if (cryptoMatch) {
            console.log('✅ Найден поставщик по крипто реквизитам:', supplier.name)
            return supplier
          }
        }
      }
      
      console.log('❌ Поставщик с такими реквизитами не найден')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска поставщика по реквизитам:', error)
      return null
    }
  }

  // Функция поиска исторических проектов по реквизитам поставщика
  const findHistoricalProjectsByRequisites = async (supplierRequisites: any) => {
    try {
      console.log('🔍 Поиск исторических проектов по реквизитам:', supplierRequisites)
      
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          project_name,
          created_at,
          status,
          client_profiles!inner(
            id,
            name,
            company_name,
            inn,
            address,
            email,
            phone
          ),
          project_specifications!inner(
            id,
            items
          ),
          project_requisites!inner(
            id,
            type,
            crypto_address,
            crypto_network,
            card_number,
            card_bank,
            account_number,
            bank_name
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) {
        console.error('❌ Ошибка поиска проектов:', error?.message || error || 'Неизвестная ошибка')
        return []
      }
      
      // Фильтруем проекты по совпадению реквизитов
      const matchingProjects = projects?.filter(project => {
        const projectRequisites = project.project_requisites
        
        // Проверяем совпадение по типу реквизитов
        return projectRequisites.some((req: any) => {
          if (supplierRequisites.type === 'crypto' && req.type === 'crypto') {
            return req.crypto_network === supplierRequisites.crypto_network
          }
          if (supplierRequisites.type === 'p2p' && req.type === 'p2p') {
            return req.card_bank === supplierRequisites.card_bank
          }
          if (supplierRequisites.type === 'bank' && req.type === 'bank') {
            return req.bank_name === supplierRequisites.bankName
          }
          return false
        })
      }) || []
      
      console.log('✅ Найдено проектов с совпадающими реквизитами:', matchingProjects.length)
      return matchingProjects
      
    } catch (error) {
      console.error('❌ Ошибка при поиске исторических проектов:', error)
      return []
    }
  }


  // Функция отправки данных менеджеру
  const handleSendToManager = async () => {
    try {
      setSendingToManager(true)
      
      console.log('🚀 Отправка данных менеджеру:', {
        stepConfigs,
        manualData,
        uploadedFiles,
        currentStage: getCurrentStage()
      })

      const response = await fetchFromApi('/api/atomic-constructor/send-to-manager', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          stepConfigs,
          manualData,
          uploadedFiles,
          user,
          currentStage: getCurrentStage()
        })
      })

      const result = await response.json()

      if (result.success) {
        // Устанавливаем статус ожидания и ID запроса
        setManagerApprovalStatus('pending')
        setProjectRequestId(result.requestId || `atomic_${Date.now()}`)
        
        setManagerNotification({
          show: true,
          type: 'success',
          message: `Данные отправлены менеджеру! ID запроса: ${result.requestId}`
        })
      } else {
        throw new Error(result.error || 'Неизвестная ошибка')
      }

    } catch (error) {
      console.error('❌ Ошибка отправки менеджеру:', error)
      setManagerNotification({
        show: true,
        type: 'error',
        message: `Ошибка отправки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      })
    } finally {
      setSendingToManager(false)
    }
  }

  // ========================================
  // HELPER FUNCTIONS ДЛЯ STAGE1CONTAINER
  // ========================================

  // Получить доступные источники данных для текущего шага
  const availableSources: StepConfig[] = lastHoveredStep
    ? (['profile', 'template', 'catalog', 'manual'] as StepConfig[])
    : []

  // Получить информацию об источнике
  const getSourceInfo = (source: StepConfig) => {
    return dataSources[source as keyof typeof dataSources] || { name: source, color: 'bg-gray-500' }
  }

  // Получить иконку источника
  const getSourceIcon = (source: StepConfig) => {
    const sourceData = dataSources[source as keyof typeof dataSources]
    return sourceData?.icon || Plus
  }

  return (
    <div className="container mx-auto py-8 pb-24">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Blocks className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Конструктор атомарных сделок</h1>
          <div className="text-sm text-gray-600 ml-4">
            Этап: {currentStage} | Статус менеджера: {managerApprovalStatus || 'null'} | Статус чека: {receiptApprovalStatus || 'null'}
          </div>
        </div>
        <div className="flex gap-4 justify-end">
          <Button 
            onClick={handleSendToManager}
            disabled={sendingToManager}
            className="gap-2"
            variant="outline"
          >
            {sendingToManager ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Отправка...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Отправить менеджеру
              </>
            )}
          </Button>
          <Button className="gap-2">
            Запустить проект
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>



      {/* Block 1: 7 кубиков-шагов */}
      <StepCubes
        constructorSteps={constructorSteps}
        currentStage={currentStage}
        stepConfigs={stepConfigs}
        manualData={manualData}
        receiptApprovalStatus={receiptApprovalStatus}
        hasManagerReceipt={hasManagerReceipt}
        clientReceiptUrl={clientReceiptUrl}
        isStepEnabled={isStepEnabled}
        getCurrentStage={getCurrentStage}
        handleStepHover={handleStepHover}
        handleStepClick={handleStepClick}
        stepIcons={stepIcons}
        dataSources={dataSources}
      />

      {/* Block 2: Интерактивная область с вариантами заполнения или анимация сделки */}
      <Card className="mb-8">
        <CardContent className="p-6">
          {currentStage === 3 ? (
                            <h2 className="text-xl font-bold mb-6">📊 Монитор сделки</h2>
          ) : (
            <h2 className="text-xl font-bold mb-6">Область настройки</h2>
          )}
          
          {/* Уведомление об автоматическом заполнении */}
          <AutoFillNotification
            show={autoFillNotification?.show || false}
            message={autoFillNotification?.message || ''}
            supplierName={autoFillNotification?.supplierName || ''}
            filledSteps={autoFillNotification?.filledSteps || []}
            currentStage={currentStage}
            onDismiss={() => setAutoFillNotification(null)}
          />

          <StageRouter
            currentStage={currentStage}
            setCurrentStage={setCurrentStage}
            managerApprovalStatus={managerApprovalStatus}
            setManagerApprovalStatus={setManagerApprovalStatus}
            managerApprovalMessage={managerApprovalMessage}
            receiptApprovalStatus={receiptApprovalStatus}
            setReceiptApprovalStatus={setReceiptApprovalStatus}
            projectRequestId={projectRequestId}
            manualData={manualData}
            uploadSupplierReceipt={uploadSupplierReceipt}
            supabase={supabase}
            POLLING_INTERVALS={POLLING_INTERVALS}
            dealAnimationStep={dealAnimationStep}
            dealAnimationStatus={dealAnimationStatus}
            dealAnimationComplete={dealAnimationComplete}
            hasManagerReceipt={hasManagerReceipt}
            managerReceiptUrl={managerReceiptUrl}
            isRequestSent={isRequestSent}
            showFullLoader={showFullLoader}
            setShowFullLoader={setShowFullLoader}
            sendManagerReceiptRequest={sendManagerReceiptRequest}
            clientReceiptUrl={clientReceiptUrl}
            clientReceiptUploadError={clientReceiptUploadError}
            isUploadingClientReceipt={isUploadingClientReceipt}
            handleClientReceiptUpload={handleClientReceiptUpload}
            handleRemoveClientReceipt={handleRemoveClientReceipt}
            handleShowProjectDetails={handleShowProjectDetails}
          >
            <Stage1Container
              stepConfigs={stepConfigs as Record<number, StepConfig>}
              manualData={manualData}
              lastHoveredStep={lastHoveredStep}
              constructorSteps={constructorSteps}
              templateSelection={templateSelection}
              setTemplateSelection={setTemplateSelection}
              templates={templates}
              templatesLoading={templatesLoading}
              fetchTemplates={fetchTemplates}
              projectDetailsDialogOpen={projectDetailsDialogOpen}
              setProjectDetailsDialogOpen={setProjectDetailsDialogOpen}
              projectDetails={projectDetails}
              handleRemoveSource={handleRemoveSource}
              handleEditData={handleEditData}
              handleAddProductsFromCatalog={handleAddProductsFromCatalog}
              handleSourceSelect={handleSourceSelect}
              handleTemplateSelect={handleTemplateSelect}
              isStepEnabled={isStepEnabled}
              availableSources={availableSources}
              getSourceInfo={getSourceInfo}
              getSourceIcon={getSourceIcon}
            />
          </StageRouter>
        </CardContent>
      </Card>

      {/* Block 3: Сводка и запуск проекта */}
      <SummaryBlock
        constructorSteps={constructorSteps}
        stepConfigs={stepConfigs}
        configuredStepsSummary={configuredStepsSummary}
        progress={getProgressWithContext(createValidationContext())}
        onStepCardClick={handleStepCardClick}
      />

      {/* ✂️ Все модальные окна удалены - теперь управляются через ModalManager */}

      {/* Уведомления о статусе отправки менеджеру */}
      {managerNotification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          managerNotification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {managerNotification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
            <span className="font-medium">
              {managerNotification.type === 'success' ? 'Успешно!' : 'Ошибка!'}
            </span>
          </div>
          <p className="mt-1 text-sm">{managerNotification.message}</p>
          <button
            onClick={() => setManagerNotification(null)}
            className="absolute top-2 right-2 text-white hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* 🛒 Модальное окно каталога товаров */}
      <CatalogModal
        open={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onAddProducts={handleCatalogProductsAdd}
      />

      {/* Централизованный менеджер модальных окон */}
      <ModalManager
        handleEditData={handleEditData}
        clientProfiles={clientProfiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={setSelectedProfileId}
        onApplyProfile={applyClientProfile}
        manualData={manualData}
        stepConfigs={stepConfigs}
        getSourceDisplayName={getSourceDisplayName}
        returnToStage1Editing={returnToStage1Editing}
        goToNextStage={goToNextStage}
        currentStage={currentStage}
        nextStage={currentStage + 1}
        dontShowStageTransition={dontShowStageTransition}
        setDontShowStageTransition={setDontShowStageTransition}
        proceedToNextStage={proceedToStage2}
        blueRoomSuppliers={blueRoomSuppliers}
        blueRoomLoading={blueRoomLoading}
        catalogSourceStep={catalogSourceStep || 0}
        handleSelectBlueRoomSupplier={handleSelectBlueRoomSupplier}
        orangeRoomSuppliers={orangeRoomSuppliers}
        orangeRoomLoading={orangeRoomLoading}
        handleSelectOrangeRoomSupplier={handleSelectOrangeRoomSupplier}
        editRequisites={editRequisites}
        confirmRequisites={confirmRequisites}
        proceedToStage3={proceedToStage3}
      />

    </div>
  )
}

export default function ProjectConstructorPage() {
  return (
    <ModalProvider>
      <ProjectConstructorContent />
    </ModalProvider>
  )
}

