"use client"

import * as React from "react"
import type {
  ManualData,
  PartialStepConfigs,
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
  
  // Состояние для модального окна эхо данных
  const [echoDataModal, setEchoDataModal] = useState<{
    show: boolean;
    supplierName: string;
    echoData: any;
    projectInfo: any;
  } | null>(null)

  const [showPhantomOptions, setShowPhantomOptions] = useState<boolean>(false)

  // Состояние для отслеживания доступности эхо данных
  const [echoDataAvailable, setEchoDataAvailable] = useState<{ [key: number]: boolean }>({})

  // Состояние для отслеживания загрузки эхо данных
  const [echoDataLoading, setEchoDataLoading] = useState<boolean>(false)

  // Состояние для управления всплывающими подсказками эхо данных
  const [echoDataTooltips, setEchoDataTooltips] = useState<{ [key: number]: boolean }>({})

  // Состояние для лоадера эхо данных шагов 1 и 2
  const [echoDataLoadingSteps1_2, setEchoDataLoadingSteps1_2] = useState<boolean>(false)

  // Хук для работы с профилями клиентов
  const { profiles: clientProfiles, loading: clientProfilesLoading, fetchProfiles: fetchClientProfiles } = useClientProfiles(user?.id || null)

  // Хук для работы с профилями поставщиков
  const { profiles: supplierProfiles, loading: supplierProfilesLoading, fetchProfiles: fetchSupplierProfiles } = useSupplierProfiles(user?.id || null)

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
  const [managerReceiptUrl, setManagerReceiptUrl] = useState<string | null>(null)
  
  // Состояние для модального окна каталога товаров
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false)
  // Состояния каталога удалены - теперь управляются внутри CatalogModal
  const [hasManagerReceipt, setHasManagerReceipt] = useState(false)
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

  // Функция для проверки доступности эхо данных
  const checkEchoDataAvailability = async () => {
    console.log('🔍 Проверяем доступность эхо данных...')

    // Показываем лоадер
    setEchoDataLoading(true)

    // Ищем supplier в любом из заполненных шагов
    const supplierName = findSupplierInAnyStep()

    if (!supplierName) {
      console.log('❌ Не найден supplier ни в одном шаге')
      setEchoDataAvailable({})
      setEchoDataLoading(false)
      return
    }

    console.log('🔍 Проверяем эхо данные для поставщика:', supplierName)

    try {
      const echoData = await getEchoSupplierData(supplierName)
      if (echoData) {
        console.log('✅ Эхо данные доступны для шагов 4 и 5')
        setEchoDataAvailable({
          4: true,
          5: true
        })
        // Показываем всплывающие подсказки
        setEchoDataTooltips({
          4: true,
          5: true
        })

        // Автоматически скрываем подсказки через 10 секунд
        setTimeout(() => {
          setEchoDataTooltips(prev => ({
            ...prev,
            4: false,
            5: false
          }))
        }, TIMEOUTS.AUTO_HIDE_NOTIFICATION)
      } else {
        console.log('❌ Эхо данные недоступны')
        setEchoDataAvailable({})
        setEchoDataTooltips({})
      }
    } catch (error) {
      console.error('❌ Ошибка проверки эхо данных:', error)
      setEchoDataAvailable({})
      setEchoDataTooltips({})
    } finally {
      // Скрываем лоадер
      setEchoDataLoading(false)
    }
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

  // Получаем реальные шаблоны из базы данных
  const { templates, loading: templatesLoading, error: templatesError, fetchTemplates } = useProjectTemplates()

  // Загружаем шаблоны при монтировании компонента
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

  // Polling чека от менеджера (шаг 6)
  useEffect(() => {
    if (!projectRequestId || currentStage !== 3) return
    
    // Автоматически отправляем запрос менеджеру при переходе на этап 3
    if (!isRequestSent) {
      console.log('🚀 Автоматически отправляем запрос менеджеру при переходе на этап 3')
      sendManagerReceiptRequest()
    }
    
    const checkManagerReceipt = async () => {
      try {
        console.log('🔍 Проверяем чек от менеджера для projectRequestId:', projectRequestId)
        
        const { data: project, error } = await supabase
          .from('projects')
          .select('status, receipts')
          .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
          .single()
        
        if (error || !project) {
          console.log('📊 Проект не найден для проверки чека менеджера')
          return
        }
        
        console.log('📊 Статус проекта для чека менеджера:', project.status)
        
        // Проверяем наличие чека от менеджера
        let managerReceiptUrl = null
        
        if (project.receipts) {
          try {
            // Пробуем парсить как JSON (новый формат)
            const receiptsData = JSON.parse(project.receipts)
            if (receiptsData.manager_receipt) {
              managerReceiptUrl = receiptsData.manager_receipt
            }
          } catch {
            // Если не JSON, проверяем статус (старый формат)
            if (project.status === 'in_work') {
              managerReceiptUrl = project.receipts
            }
          }
        }
        
        if (managerReceiptUrl && !hasManagerReceipt) {
          console.log('✅ Чек от менеджера найден:', managerReceiptUrl)
          console.log('🔄 Устанавливаем hasManagerReceipt=true')
          setManagerReceiptUrl(managerReceiptUrl)
          setHasManagerReceipt(true)
          
          // Автоматически меняем статус если нужно
          if (project.status === 'waiting_manager_receipt') {
            await supabase
              .from('projects')
              .update({ 
                status: 'in_work',
                updated_at: new Date().toISOString()
              })
              .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
            console.log('✅ Статус изменен на in_work')
          }
        } else if (!managerReceiptUrl && hasManagerReceipt) {
          console.log('❌ Чек от менеджера удален')
          console.log('🔄 Устанавливаем hasManagerReceipt=false')
          setManagerReceiptUrl(null)
          setHasManagerReceipt(false)
        } else {
          console.log('📊 Статус чека менеджера не изменился:', { 
            hasManagerReceipt, 
            managerReceiptUrl: !!managerReceiptUrl,
            projectStatus: project.status 
          })
        }
        
      } catch (error) {
        console.error('❌ Ошибка проверки чека от менеджера:', error)
      }
    }
    
    // Проверяем каждые 5 секунд
    const interval = setInterval(checkManagerReceipt, POLLING_INTERVALS.MANAGER_RECEIPT_CHECK)
    
    // Первая проверка сразу
    checkManagerReceipt()
    
    return () => clearInterval(interval)
  }, [projectRequestId, currentStage, hasManagerReceipt, isRequestSent])

  // Функция для загрузки чека клиента о получении средств
  const handleClientReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !projectRequestId) return

    console.log("🚀 Начинаем загрузку чека клиента:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      projectRequestId
    })

    setIsUploadingClientReceipt(true)
    setClientReceiptUploadError(null)

    try {
      // Получаем ID пользователя для организации файлов
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id || 'unknown'

      // Генерируем уникальное имя файла
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const fileName = `client-receipt-${cleanProjectRequestId(projectRequestId)}-${Date.now()}.${fileExtension}`
      const filePath = `${userId}/${fileName}`

      console.log("📤 Загружаем чек клиента:", {
        fileName,
        size: file.size,
        type: file.type,
        projectRequestId
      })

      // Загружаем файл в Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("step7-client-confirmations")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error("❌ Ошибка загрузки в Storage:", uploadError)
        throw new Error("Не удалось загрузить файл: " + uploadError.message)
      }

      // Получаем публичный URL файла
      const { data: urlData } = supabase.storage
        .from("step7-client-confirmations")
        .getPublicUrl(filePath)

      const fileUrl = urlData.publicUrl
      console.log("✅ Файл загружен:", fileUrl)

      // Сохраняем URL в проект
      const { error: updateError } = await supabase
        .from("projects")
        .update({ 
          client_confirmation_url: fileUrl,
          updated_at: new Date().toISOString()
        })
        .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)

      if (updateError) {
        console.error("❌ Ошибка обновления проекта:", updateError)
        throw new Error("Не удалось сохранить ссылку на файл")
      }

      // Отправляем файл менеджеру в Telegram
      const telegramCaption = `📋 КЛИЕНТ ЗАГРУЗИЛ ЧЕК О ПОЛУЧЕНИИ СРЕДСТВ!\n\n` +
        `🆔 Проект: ${projectRequestId}\n` +
        `📛 Название: ${manualData[1]?.name || 'Атомарный проект'}\n` +
        `🏢 Компания: ${manualData[1]?.name || 'Не указано'}\n` +
        `📧 Email: ${manualData[1]?.email || 'Не указано'}\n` +
        `💰 Метод оплаты: ${manualData[4]?.method || 'Не указан'}\n\n` +
        `📄 Клиент подтвердил получение средств от поставщика чеком.\n` +
        `⚠️ Проверьте документ и завершите проект если все корректно.`

      console.log("📤 Отправляем в Telegram:", {
        fileUrl,
        telegramCaption,
        projectRequestId
      })

      try {
        console.log("🔧 Отправляем чек клиента через API с параметрами:", {
          fileUrl: fileUrl?.substring(0, 100) + "...",
          captionLength: telegramCaption?.length,
          projectRequestId
        })
        
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
          throw new Error(telegramResult.error || 'Неизвестная ошибка API')
        }
      } catch (telegramError) {
        console.error("⚠️ Ошибка отправки в Telegram:", telegramError)
        console.error("⚠️ Детали ошибки:", {
          message: telegramError instanceof Error ? telegramError.message : 'Неизвестная ошибка',
          stack: telegramError instanceof Error ? telegramError.stack : undefined
        })
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

  // Функция для удаления загруженного чека клиента
  const handleRemoveClientReceipt = async () => {
    if (!projectRequestId || !clientReceiptUrl) return

    try {
      // Удаляем URL из базы данных
      const { error: updateError } = await supabase
        .from("projects")
        .update({ 
          client_confirmation_url: null,
          updated_at: new Date().toISOString()
        })
        .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)

      if (updateError) {
        console.error("❌ Ошибка обновления проекта:", updateError)
        throw new Error("Не удалось удалить ссылку на файл")
      }

      setClientReceiptFile(null)
      setClientReceiptUrl(null)

      toast({
        title: "Чек удален",
        description: "Вы можете загрузить новый чек.",
        variant: "default"
      })

    } catch (error) {
      console.error("❌ Ошибка удаления чека:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чек.",
        variant: "destructive"
      })
    }
  }

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

  // Функция для получения списка шаблонов пользователя из реальной базы данных
  const getUserTemplates = () => {
    console.log('📋 [getUserTemplates] Проверяем шаблоны:', {
      templates: templates,
      loading: templatesLoading,
      error: templatesError,
      length: templates?.length || 0
    });
    
    if (!templates || templates.length === 0) {
      console.log('📋 [getUserTemplates] Шаблоны пусты');
      return []
    }
    
    const mappedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name || 'Без названия',
      description: template.description || 'Шаблон проекта',
      availableSteps: [1, 2], // По умолчанию шаблоны содержат шаги 1 и 2
      lastUsed: template.updated_at ? new Date(template.updated_at).toLocaleDateString('ru-RU') : 'Недавно'
    }));
    
    console.log('📋 [getUserTemplates] Преобразованные шаблоны:', mappedTemplates);
    return mappedTemplates;
  }

  // Функция для получения данных поставщика из каталога
  const getSupplierDataFromCatalog = async (supplierId: string) => {
    try {
      console.log('🔍 Запрос данных поставщика:', supplierId)

      const { data: supplier, error } = await supabase
        .from('catalog_verified_suppliers')
        .select(`
          id,
          name,
          company_name,
          category,
          contact_email,
          contact_phone,
          payment_methods,
          bank_accounts,
          p2p_cards,
          crypto_wallets
        `)
        .eq('id', supplierId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('❌ Ошибка получения данных поставщика:', error)
        return null
      }

      if (!supplier) {
        console.warn('⚠️ Поставщик не найден:', supplierId)
        return null
      }

      console.log('✅ Данные поставщика получены:', supplier.name)

      // Преобразуем данные в нужный формат
      const supplierData = {
        id: supplier.id,
        name: supplier.name,
        company_name: supplier.company_name,
        category: supplier.category,
        contact_email: supplier.contact_email,
        contact_phone: supplier.contact_phone,
        payment_methods: supplier.payment_methods || [],
        bank_accounts: supplier.bank_accounts || [],
        p2p_cards: supplier.p2p_cards || [],
        crypto_wallets: supplier.crypto_wallets || []
      }

      return supplierData

    } catch (error) {
      console.error('💥 Критическая ошибка запроса поставщика:', error)
      return null
    }
  }

  // Функция для получения товаров поставщика из каталога
  const getSupplierProducts = async (supplierId: string) => {
    try {
      console.log('🔍 Запрос товаров поставщика:', supplierId)

      const { data: products, error } = await supabase
        .from('catalog_verified_products')
        .select(`
          id,
          name,
          description,
          price,
          currency,
          category,
          sku,
          min_order,
          specifications
        `)
        .eq('supplier_id', supplierId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ Ошибка получения товаров поставщика:', error)
        return []
      }

      if (!products || products.length === 0) {
        console.warn('⚠️ Товары поставщика не найдены:', supplierId)
        return []
      }

      console.log(`✅ Получено ${products.length} товаров поставщика`)

      // Преобразуем данные в формат для спецификации
      const productsForSpec = products.map(product => ({
        item_name: product.name,
        quantity: 1, // Количество по умолчанию
        price: Number(product.price || 0),
        unit: 'шт', // Единица по умолчанию
        total: Number(product.price || 0),
        supplier_id: supplierId,
        supplier_name: '', // Будет заполнено из данных поставщика
        notes: product.description || '',
        sku: product.sku,
        category: product.category,
        currency: product.currency || 'USD',
        min_order: product.min_order,
        specifications: product.specifications
      }))

      return productsForSpec

    } catch (error) {
      console.error('💥 Критическая ошибка запроса товаров:', error)
      return []
    }
  }

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



  // Функция для получения эхо данных поставщика из прошлых проектов
  const getEchoSupplierData = async (supplierName: string) => {
    console.log('🔍 Поиск эхо данных для поставщика:', supplierName)
    
    try {
      // Получаем ID пользователя из сессии
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('❌ Пользователь не авторизован')
        return null
      }
      
      // 1. Находим проекты с указанным поставщиком в спецификациях
      const { data: specifications, error: specsError } = await supabase
        .from("project_specifications")
        .select(`project_id, supplier_name, created_at`)
        .eq("user_id", user.id)
        .ilike("supplier_name", `%${supplierName}%`)
        .order("created_at", { ascending: false })
      
      if (specsError) {
        console.error('❌ Ошибка получения спецификаций:', specsError)
        return null
      }
      
      if (!specifications || specifications.length === 0) {
        console.log('❌ Спецификации с поставщиком не найдены')
        return null
      }
      
      console.log('✅ Найдены спецификации:', specifications.length)
      
      // 2. Получаем ID проектов
      const projectIds = specifications.map(s => s.project_id)
      
      // 3. Получаем реквизиты для этих проектов
      const { data: projectRequisites, error: requisitesError } = await supabase
        .from("project_requisites")
        .select(`project_id, type, data, created_at`)
        .in("project_id", projectIds)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (requisitesError) {
        console.error('❌ Ошибка получения реквизитов:', requisitesError)
        return null
      }
      
      if (!projectRequisites || projectRequisites.length === 0) {
        console.log('❌ Реквизиты для проектов не найдены')
        return null
      }
      
      // 4. Получаем детали проектов
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(`id, name, payment_method, status, amount, currency, created_at, updated_at`)
        .in("id", projectIds)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
      
      if (projectsError) {
        console.error('❌ Ошибка получения проектов:', projectsError)
        return null
      }
      
      // 5. Находим самый релевантный проект с правильными реквизитами
      console.log('🔍 Анализ проектов и реквизитов:')
      
      // Создаем карту проектов для быстрого поиска
      const projectsMap = new Map(projects.map(p => [p.id, p]))
      
      // Ищем проект с наиболее полными и согласованными данными
      let bestProject = null
      let bestRequisite = null
      let bestScore = 0
      
      for (const requisite of projectRequisites) {
        const project = projectsMap.get(requisite.project_id)
        if (!project) continue
        
        // Проверяем соответствие способа оплаты и типа реквизитов
        const paymentMethodMap: { [key: string]: string } = {
          'bank-transfer': 'bank',
          'p2p': 'p2p',
          'crypto': 'crypto'
        }
        
        const expectedRequisiteType = paymentMethodMap[project.payment_method] || 'bank'
        const actualRequisiteType = requisite.type
        
        // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Пропускаем проекты с несоответствующими реквизитами
        if (expectedRequisiteType !== actualRequisiteType) {
          console.log(`❌ ПРОПУСКАЕМ проект "${project.name}": НЕСООТВЕТСТВИЕ payment_method="${project.payment_method}" vs тип реквизитов="${actualRequisiteType}"`)
          continue // Пропускаем этот проект полностью
        }
        
        // Вычисляем "релевантность" проекта
        let score = 0
        
        // Базовый балл за наличие данных
        score += 10
        
        // Бонус за соответствие типа реквизитов и способа оплаты (теперь всегда +50)
        score += 50
        console.log(`✅ Проект "${project.name}": payment_method="${project.payment_method}" соответствует типу реквизитов="${actualRequisiteType}"`)
        
        // Бонус за более новый проект
        const daysSinceUpdate = (Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceUpdate < 30) score += 20
        else if (daysSinceUpdate < 90) score += 10
        
        // Бонус за завершенные проекты
        if (project.status === 'completed') score += 15
        
        // Бонус за проекты с суммой
        if (project.amount && project.amount > 0) score += 5
        
        console.log(`📊 Проект "${project.name}": релевантность = ${score}`)
        
        if (score > bestScore) {
          bestScore = score
          bestProject = project
          bestRequisite = requisite
        }
      }
      
      if (!bestProject || !bestRequisite) {
        console.log('❌ Подходящий проект не найден')
        return null
      }
      
      // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Убеждаемся, что выбранный проект имеет правильные реквизиты
      const finalPaymentMethodMap: { [key: string]: string } = {
        'bank-transfer': 'bank',
        'p2p': 'p2p',
        'crypto': 'crypto'
      }
      
      const finalExpectedType = finalPaymentMethodMap[bestProject.payment_method] || 'bank'
      const finalActualType = bestRequisite.type
      
      if (finalExpectedType !== finalActualType) {
        console.error(`🚨 КРИТИЧЕСКАЯ ОШИБКА: Выбранный проект "${bestProject.name}" имеет несоответствие!`)
        console.error(`   Способ оплаты: ${bestProject.payment_method} (ожидается тип: ${finalExpectedType})`)
        console.error(`   Тип реквизитов: ${finalActualType}`)
        console.error(`   НЕ ВОЗВРАЩАЕМ НЕСООТВЕТСТВУЮЩИЕ ДАННЫЕ!`)
        return null
      }
      
      const requisiteData = bestRequisite.data
      
      console.log('✅ Выбран лучший проект:', bestProject.name)
      console.log('📋 Данные реквизита:', requisiteData)
      console.log('📋 Данные проекта:', bestProject)
      console.log('🔍 Тип реквизита:', bestRequisite.type)
      console.log('🔍 Способ оплаты проекта:', bestProject.payment_method)
      console.log('🏆 Релевантность:', bestScore)
      
      // Проверяем соответствие способа оплаты и типа реквизитов
      const paymentMethodMap: { [key: string]: string } = {
        'bank-transfer': 'bank',
        'p2p': 'p2p',
        'crypto': 'crypto'
      }
      
      const expectedRequisiteType = paymentMethodMap[bestProject.payment_method] || 'bank'
      const actualRequisiteType = bestRequisite.type
      
      if (expectedRequisiteType !== actualRequisiteType) {
        console.warn(`⚠️ НЕСООТВЕТСТВИЕ: Проект имеет payment_method="${bestProject.payment_method}" (ожидается тип="${expectedRequisiteType}"), но реквизит имеет тип="${actualRequisiteType}"`)
      }
      
      // Формируем реквизиты в зависимости от типа
      let requisites: any = {}
      
      if (actualRequisiteType === 'bank') {
        requisites = {
          bankName: requisiteData.bankName || requisiteData.details?.bankName || 'Банк поставщика',
          accountNumber: requisiteData.accountNumber || requisiteData.details?.accountNumber || '****0000',
          swift: requisiteData.swift || requisiteData.details?.swift || 'PHANTOM',
          recipientName: requisiteData.recipientName || requisiteData.details?.recipientName || 'Поставщик',
          supplier_id: `phantom-${bestProject.id}`
        }
      } else if (actualRequisiteType === 'p2p') {
        requisites = {
          card_bank: requisiteData.bank || requisiteData.details?.bank || 'Банк карты',
          card_number: requisiteData.card_number || requisiteData.details?.card_number || '****0000',
          card_holder: requisiteData.holder_name || requisiteData.details?.holder_name || 'Поставщик',
          supplier_id: `phantom-${bestProject.id}`
        }
      } else if (actualRequisiteType === 'crypto') {
        requisites = {
          crypto_network: requisiteData.network || requisiteData.details?.network || 'BTC',
          crypto_address: requisiteData.address || requisiteData.details?.address || 'Адрес кошелька',
          supplier_id: `phantom-${bestProject.id}`
        }
      }
      
      const result = {
        // Шаг IV: Способ оплаты
        payment_method: {
          method: bestProject.payment_method || 'bank-transfer',
          supplier_id: `phantom-${bestProject.id}`
        },
        
        // Шаг V: Реквизиты (правильные в зависимости от типа)
        requisites: {
          ...requisites,
          type: actualRequisiteType // Явно добавляем тип реквизитов
        },
        
        // Дополнительная информация
        project_info: {
          project_name: bestProject.name,
          project_date: bestProject.updated_at,
          amount: bestProject.amount,
          currency: bestProject.currency,
          status: bestProject.status
        }
      }
      
      console.log('🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ getEchoSupplierData:')
      console.log('  - Способ оплаты:', result.payment_method)
      console.log('  - Тип реквизитов:', result.requisites.type)
      console.log('  - Реквизиты:', result.requisites)
      console.log('  - Проверка соответствия:', result.payment_method.method === 'crypto' && result.requisites.type === 'crypto' ? '✅ КРИПТО' : 
                                                      result.payment_method.method === 'p2p' && result.requisites.type === 'p2p' ? '✅ P2P' :
                                                      result.payment_method.method === 'bank-transfer' && result.requisites.type === 'bank' ? '✅ БАНК' : '❌ НЕСООТВЕТСТВИЕ')
      
      return result
      
    } catch (error) {
      console.error('❌ Ошибка получения фантомных данных:', error)
      return null
    }
  }

  // Функция для получения данных профиля клиента
  const getProfileData = async (stepId: number) => {
    console.log('🔍 Получаем данные профиля для шага:', stepId)
    
    if (stepId === 1) {
      // Для шага 1 (данные компании) используем профиль клиента
      if (clientProfilesLoading) {
        console.log('⏳ Профили клиентов загружаются...')
        return null
      }
      
      if (!clientProfiles || clientProfiles.length === 0) {
        console.log('❌ Нет профилей клиентов')
        return null
      }
      
      // Если несколько профилей и не выбран конкретный - показываем выбор
      if (clientProfiles.length > 1 && !selectedProfileId) {
        console.log('🔍 Несколько профилей - показываем выбор')
        openModal('profileSelector')
        return null
      }
      
      // Определяем какой профиль использовать
      let targetProfile
      if (selectedProfileId) {
        targetProfile = clientProfiles.find(p => p.id === selectedProfileId)
      } else {
        targetProfile = clientProfiles.find(p => p.is_default) || clientProfiles[0]
      }
      
      if (!targetProfile) {
        console.log('❌ Не найден профиль клиента')
        return null
      }
      
      console.log('✅ Найден профиль клиента:', targetProfile.name)
      console.log('🏦 Банковские данные профиля:', {
        bank_name: targetProfile.bank_name,
        bank_account: targetProfile.bank_account,
        corr_account: targetProfile.corr_account,
        bik: targetProfile.bik
      })

      const result = {
        name: targetProfile.name || '',
        legal_name: targetProfile.legal_name || '',  // Исправлено: было legalName
        inn: targetProfile.inn || '',
        kpp: targetProfile.kpp || '',
        ogrn: targetProfile.ogrn || '',
        legal_address: targetProfile.legal_address || '',  // Исправлено: было address
        bank_name: targetProfile.bank_name || '',     // Исправлено: было bankName
        bank_account: targetProfile.bank_account || '',  // Исправлено: было bankAccount
        corr_account: targetProfile.corr_account || '',  // Исправлено: было bankCorrAccount
        bik: targetProfile.bik || '',                 // Исправлено: было bankBik
        email: targetProfile.email || '',
        phone: targetProfile.phone || '',
        website: targetProfile.website || ''
      }

      console.log('🎯 Возвращаемые данные getProfileData:', result)
      return result
    }
    
    // Для шагов 2, 4, 5 используем профили поставщиков
    if ([2, 4, 5].includes(stepId)) {
      if (supplierProfilesLoading) {
        console.log('⏳ Профили поставщиков загружаются...')
        return null
      }
      
      if (!supplierProfiles || supplierProfiles.length === 0) {
        console.log('❌ Нет профилей поставщиков')
        return null
      }
      
      // Если несколько профилей и не выбран конкретный - показываем выбор
      if (supplierProfiles.length > 1 && !selectedSupplierProfileId) {
        console.log('🔍 Несколько профилей поставщиков - показываем выбор')
        setShowSupplierProfileSelector(true)
        return null
      }
      
      // Определяем какой профиль использовать
      let targetProfile
      if (selectedSupplierProfileId) {
        targetProfile = supplierProfiles.find(p => p.id === selectedSupplierProfileId)
      } else {
        targetProfile = supplierProfiles.find(p => p.is_default) || supplierProfiles[0]
      }
      
      if (!targetProfile) {
        console.log('❌ Не найден профиль поставщика')
        return null
      }
      
      console.log('✅ Найден профиль поставщика:', targetProfile.name)
      
      // Возвращаем данные в зависимости от шага
      if (stepId === 2) {
        // Шаг 2: Название поставщика и валюта
        return {
          supplier: targetProfile.name,
          currency: targetProfile.transfer_currency || 'USD'
        }
      } else if (stepId === 4) {
        // Шаг 4: Методы оплаты
        return {
          method: targetProfile.payment_methods || 'bank-transfer'
        }
      } else if (stepId === 5) {
        // Шаг 5: Банковские реквизиты
        return {
          bankName: targetProfile.bank_name || '',
          accountNumber: targetProfile.account_number || '',
          swift: targetProfile.swift || '',
          iban: targetProfile.iban || '',
          recipientName: targetProfile.recipient_name || '',
          transferCurrency: targetProfile.transfer_currency || 'USD',
          paymentPurpose: targetProfile.payment_purpose || ''
        }
      }
    }
    
    // Для остальных шагов пока возвращаем null
    console.log('⚠️ Данные профиля для шага', stepId, 'пока не реализованы')
    return null
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
              setManualData(prev => ({
                ...prev,
                5: {
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



  // Функция для применения эхо данных (вызывается из модального окна)
  const applyEchoData = (echoData: any) => {
    console.log('✅ Применяем эхо данные:', echoData)
    console.log('🔍 Способ оплаты:', echoData.payment_method)
    console.log('🔍 Реквизиты:', echoData.requisites)
    console.log('🔍 Тип реквизитов:', echoData.requisites?.type)
    
    // Применяем данные для шагов 4 и 5
    // Фильтруем методы оплаты, исключая cash (наличные) и убираем дубликаты
    const rawMethods = (echoData.payment_method as any)?.available_methods || [echoData.payment_method?.method] || ['bank_transfer']
    const normalizedEchoMethods = rawMethods
      .map((method: string) => method === 'bank_transfer' ? 'bank-transfer' : method) // Нормализуем формат
      .filter((method: string) => method !== 'cash') // Исключаем наличные
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) // Убираем дубликаты
    const availableEchoMethods = normalizedEchoMethods.length > 0 ? normalizedEchoMethods : ['bank-transfer']

    const step4Data = {
      ...echoData.payment_method,
      type: 'multiple',
      methods: availableEchoMethods,
      user_choice: true,
      source: 'echoData',
      supplier_name: echoData.supplier_name,
      project_info: echoData.project_info
    }
    
    const step5Data = {
      ...echoData.requisites,
      user_choice: true,
      source: 'echoData',
      supplier_name: echoData.supplier_name,
      project_info: echoData.project_info,
      // Явно сохраняем тип реквизитов
      type: echoData.requisites?.type || 
            (echoData.payment_method?.method === 'crypto' ? 'crypto' : 
             echoData.payment_method?.method === 'p2p' ? 'p2p' : 'bank')
    }
    
    console.log('🔍 Тип реквизитов в step5Data:', step5Data.type)
    console.log('🔍 Способ оплаты:', echoData.payment_method?.method)
    
    console.log('📋 Step 4 Data:', step4Data)
    console.log('📋 Step 5 Data:', step5Data)
    
    setManualData(prev => {
      const newData = {
      ...prev,
      4: step4Data,
      5: step5Data
      }
      console.log('🔄 Новые manualData:', newData)
      return newData
    })
    
    // Устанавливаем источник данных
    setStepConfigs(prev => ({
      ...prev,
      4: 'echoData',
      5: 'echoData'
    }))
    
    // Очищаем доступность эхо данных (звездочки исчезнут)
    setEchoDataAvailable(prev => ({
      ...prev,
      4: false,
      5: false
    }))
    
    // Скрываем всплывающие подсказки
    setEchoDataTooltips(prev => ({
      ...prev,
      4: false,
      5: false
    }))
    
    // Закрываем модальное окно
    setEchoDataModal(null)
    
    // Показываем уведомление
    alert('Эхо данные успешно применены!')
  }

  // Функция для отклонения эхо данных
  const rejectEchoData = () => {
    console.log('❌ Пользователь отклонил эхо данные')

    // Очищаем доступность эхо данных (звездочки исчезнут)
    setEchoDataAvailable(prev => ({
      ...prev,
      4: false,
      5: false
    }))

    // Скрываем всплывающие подсказки
    setEchoDataTooltips(prev => ({
      ...prev,
      4: false,
      5: false
    }))

    // ВАЖНО: НЕ сбрасываем stepConfigs[5] = 'catalog'
    // Он уже установлен в autoFillStepsFromSupplier для показа рекомендаций из каталога
    console.log('✅ stepConfigs[5] остаётся = catalog для показа рекомендаций из каталога')

    setEchoDataModal(null)
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

  const handleEchoCardsSource = async () => {
    if (!catalogSourceStep) return
    
    console.log('🔄 Загружаем данные из эхо карточек для шага:', catalogSourceStep)
    
    try {
      const data = await fetchCatalogData('echo-cards')
      
      if (data.echoCards && data.echoCards.length > 0) {
        // Показываем выбор эхо карточки
        console.log('✅ Найдены эхо карточки:', data.echoCards.length)
        // TODO: Показать модальное окно выбора эхо карточки
      } else {
        console.log('❌ Нет эхо карточек')
        // TODO: Показать сообщение об отсутствии эхо карточек
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки эхо карточек:', error)
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

  // СИСТЕМА 1: Поиск эхо данных по имени поставщика (текущая)
  const suggestEchoDataByName = async (supplierName: string) => {
    try {
      console.log('🔍 === СИСТЕМА 1: Поиск по имени ===')
      console.log('🔍 Ищем поставщика по имени:', supplierName)
      
      const suppliers = await fetchCatalogData('user-suppliers', { search: supplierName })
      
      if (suppliers.length > 0) {
        const supplier = suppliers[0]
        console.log('✅ Найден поставщик по имени:', supplier.name)
        
        return {
          step1: {
            clients: [{
              name: supplier.contact_person || supplier.name,
              company_name: supplier.company_name,
              inn: supplier.inn,
              address: supplier.address,
              email: supplier.contact_email,
              phone: supplier.contact_phone
            }],
            source: 'nameSearch',
            description: `Данные поставщика по имени: ${supplier.name}`
          }
        }
      }
      
      console.log('❌ Поставщик по имени не найден')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска по имени:', error)
      return null
    }
  }

  // СИСТЕМА 2: Поиск эхо данных по реквизитам
  const suggestEchoDataByRequisites = async () => {
    try {
      console.log('🔍 === СИСТЕМА 2: Поиск по реквизитам ===')
      
      // Получаем реквизиты из шага 5
      const step5Data = manualData[5]
      if (!step5Data || !step5Data.requisites) {
        console.log('❌ Нет реквизитов в шаге 5')
        return null
      }
      
      console.log('🔍 Реквизиты из шага 5:', step5Data.requisites)
      
      // Ищем поставщика по реквизитам
      const supplier = await findSupplierByRequisites(step5Data.requisites[0]) // Берем первый выбранный
      
      if (supplier) {
        console.log('✅ Найден поставщик по реквизитам:', supplier.name)
        
        // Получаем товары поставщика
        const productsData = await fetchFromApi(`/api/catalog/user-suppliers/${supplier.id}/products`)
        const products = productsData.products || []
        
        return {
          step2: {
            products: products,
            source: 'requisitesSearch',
            description: `Товары поставщика по реквизитам: ${supplier.name}`
          }
        }
      }
      
      console.log('❌ Поставщик по реквизитам не найден')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска по реквизитам:', error)
      return null
    }
  }

  // СИСТЕМА 3: Поиск эхо данных по историческим проектам
  const suggestEchoDataByHistory = async () => {
    try {
      console.log('🔍 === СИСТЕМА 3: Поиск по истории ===')
      
      // Получаем реквизиты из шага 5
      const step5Data = manualData[5]
      if (!step5Data || !step5Data.requisites) {
        console.log('❌ Нет реквизитов в шаге 5')
        return null
      }
      
      // Ищем исторические проекты с такими реквизитами
      const historicalProjects = await findHistoricalProjectsByRequisites(step5Data.requisites[0])
      
      if (historicalProjects.length > 0) {
        const bestProject = historicalProjects[0] // Берем самый релевантный
        console.log('✅ Найден исторический проект:', bestProject.project_name)
        
        return {
          step1: {
            clients: bestProject.client_profiles ? [bestProject.client_profiles] : [],
            source: 'historySearch',
            description: `Данные клиента из истории: ${bestProject.project_name}`
          },
          step2: {
            products: bestProject.project_specifications?.[0]?.items || [],
            source: 'historySearch',
            description: `Товары из истории: ${bestProject.project_name}`
          }
        }
      }
      
      console.log('❌ Исторические проекты не найдены')
      return null
      
    } catch (error) {
      console.error('❌ Ошибка поиска по истории:', error)
      return null
    }
  }

  // ГЛАВНАЯ ФУНКЦИЯ: Объединяет все системы поиска
  const suggestEchoDataForSteps = async (supplierData?: any) => {
    try {
      console.log('🎯 === НАЧАЛО suggestEchoDataForSteps ===')
      console.log('🎯 supplierData:', supplierData)
      console.log('🎯 Текущий manualData:', manualData)
      console.log('🎯 Текущий stepConfigs:', stepConfigs)
      
      // Показываем лоадер
      setEchoDataLoadingSteps1_2(true)
      
      // Собираем результаты от всех систем
      const allResults = {}
      
      // СИСТЕМА 1: Поиск по имени (если есть supplierData)
      if (supplierData) {
        const supplierName = supplierData.name || supplierData.company_name
        console.log('🎯 Запускаем СИСТЕМУ 1 (по имени):', supplierName)
        
        const result1 = await suggestEchoDataByName(supplierName)
        if (result1) {
          Object.assign(allResults, result1)
          console.log('✅ СИСТЕМА 1 дала результат:', result1)
        }
      }
      
      // СИСТЕМА 2: Поиск по реквизитам (если заполнен шаг 5)
      if (manualData[5] && manualData[5].requisites) {
        console.log('🎯 Запускаем СИСТЕМУ 2 (по реквизитам)')
        
        const result2 = await suggestEchoDataByRequisites()
        if (result2) {
          Object.assign(allResults, result2)
          console.log('✅ СИСТЕМА 2 дала результат:', result2)
        }
      }
      
      // СИСТЕМА 3: Поиск по истории (если заполнен шаг 5)
      if (manualData[5] && manualData[5].requisites) {
        console.log('🎯 Запускаем СИСТЕМУ 3 (по истории)')
        
        const result3 = await suggestEchoDataByHistory()
        if (result3) {
          Object.assign(allResults, result3)
          console.log('✅ СИСТЕМА 3 дала результат:', result3)
        }
      }
      
      // Сохраняем все найденные эхо данные
      if (Object.keys(allResults).length > 0) {
        setManualData(prev => ({
          ...prev,
          echoSuggestions: allResults
        }))
        
        console.log('✅ Все эхо данные сохранены:', allResults)
      } else {
        console.log('❌ Ни одна система не нашла эхо данных')
      }
      
      // Скрываем лоадер
      setEchoDataLoadingSteps1_2(false)
      
    } catch (error) {
      console.error('❌ Ошибка в suggestEchoDataForSteps:', error)
      setEchoDataLoadingSteps1_2(false)
    }
  }

  // Функция отправки данных менеджеру

  // Компонент для шага 3 - Платёжка (использует ту же логику, что и обычный стартап проектов)
  const PaymentForm = () => {
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
    }, [receiptApprovalStatus, projectRequestId, setCurrentStage])

    // Загрузка чека (использует ту же логику, что и обычный стартап проектов)
    const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      
      setIsUploading(true)
      setError(null)
      setReceiptFile(file)
      
      try {
        // Используем тот же bucket, что и в обычном стартапе проектов
        const date = generateFileDate()
        const cleanName = cleanFileName(file.name)
        const filePath = `step3-supplier-receipts/${projectRequestId}/${date}_${cleanName}`
        
        const { data, error } = await supabase.storage
          .from("step3-supplier-receipts")
          .upload(filePath, file)
        
        if (error) {
          throw new Error(error.message)
        }
        
        const { data: urlData } = supabase.storage
          .from("step3-supplier-receipts")
          .getPublicUrl(filePath)
        
        setReceiptUrl(urlData?.publicUrl || "")
        setReceiptApprovalStatus('waiting')
        
        // Обновляем статус проекта на waiting_receipt (как в обычном стартапе)
        if (projectRequestId) {
          try {
            const { error: updateError } = await supabase
              .from('projects')
              .update({ 
                status: 'waiting_receipt',
                updated_at: new Date().toISOString()
              })
              .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
            
            if (updateError) {
              console.warn('⚠️ Не удалось обновить статус проекта:', updateError)
            }
            
            // Отправляем чек менеджеру через Telegram
            await sendTelegramMessage({
              endpoint: 'telegram/send-receipt',
              payload: {
                projectRequestId,
                receiptUrl: urlData?.publicUrl,
                fileName: file.name
              }
            })
          } catch (error) {
            console.warn('⚠️ Ошибка обработки чека:', error)
          }
        }
        
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

    // Рендер платёжных реквизитов
    const renderPaymentDetails = () => (
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 shadow-md">
        <h3 className="text-xl font-bold mb-6 text-center">Платёжные реквизиты</h3>
        <div className="flex flex-col md:flex-row gap-8 mb-6">
          {/* Плательщик */}
          <div className="flex-1 min-w-[220px]">
            <div className="text-lg font-semibold mb-2 text-gray-700">Плательщик</div>
            <div className="grid grid-cols-1 gap-y-1 text-sm">
              <div><span className="text-gray-500">Компания:</span> <span className="font-medium">{companyData.name || 'Не указано'}</span></div>
              <div><span className="text-gray-500">ИНН:</span> {companyData.inn || 'Не указано'}</div>
              <div><span className="text-gray-500">Банк:</span> {(companyData as any).bank_name || 'Не указано'}</div>
              <div><span className="text-gray-500">Счёт:</span> {(companyData as any).bank_account || 'Не указано'}</div>
              <div><span className="text-gray-500">БИК:</span> {(companyData as any).bik || 'Не указано'}</div>
            </div>
          </div>
          {/* Получатель */}
          <div className="flex-1 min-w-[220px]">
            <div className="text-lg font-semibold mb-2 text-gray-700">Получатель</div>
            <div className="grid grid-cols-1 gap-y-1 text-sm">
              <div><span className="text-gray-500">Компания:</span> <span className="font-medium">ООО "СтройМаркет-Москва"</span></div>
              <div><span className="text-gray-500">Банк:</span> АО "Альфа-Банк"</div>
              <div><span className="text-gray-500">Счёт:</span> 40702810400000012345</div>
              <div><span className="text-gray-500">БИК:</span> 044525593</div>
            </div>
          </div>
        </div>
        {/* Информация о платеже */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 mb-2">
            <div className="flex-1">
              <div className="text-gray-500 text-sm">Назначение платежа</div>
              <div className="font-semibold text-blue-700">Оплата по атомарной сделке</div>
              <div className="text-gray-500 text-xs mt-1">ID запроса: {projectRequestId}</div>
            </div>
            <div className="flex-1 flex md:justify-end mt-4 md:mt-0">
              <div>
                <div className="text-gray-500 text-sm">Сумма к оплате</div>
                <div className="text-2xl font-bold text-green-700">{totalAmount > 0 ? `${totalAmount} USD` : '—'}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Спецификация */}
        {items.length > 0 && (
          <>
            <h4 className="font-semibold mt-6 mb-2 text-gray-800">Спецификация</h4>
            <table className="min-w-full text-sm border rounded overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-3 py-2 text-left font-medium">Наименование</th>
                  <th className="px-3 py-2 text-left font-medium">Код</th>
                  <th className="px-3 py-2 text-left font-medium">Кол-во</th>
                  <th className="px-3 py-2 text-left font-medium">Ед. изм.</th>
                  <th className="px-3 py-2 text-left font-medium">Цена</th>
                  <th className="px-3 py-2 text-left font-medium">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.code || '—'}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.unit || 'шт'}</td>
                    <td className="px-3 py-2">{item.price}</td>
                    <td className="px-3 py-2">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    )

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
          <div id="payment-details-html">{renderPaymentDetails()}</div>
          
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
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Шаги конструктора</h2>
              <p className="text-gray-600">Выберите источники данных для каждого шага</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">Этап {currentStage}: </span>
                <span className="text-gray-600">
                  {currentStage === 1 ? 'Подготовка данных' : 
                   currentStage === 2 ? 'Подготовка инфраструктуры' : 
                   'Анимация сделки'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Все 7 кубиков в одной горизонтальной линии */}
          <div className="grid grid-cols-7 gap-4">
            {constructorSteps.map((step) => {
              const isEnabled = isStepEnabled(step.id)
              

              
              return (
              <div
                key={step.id}
                  className={`relative transition-all duration-300 ${
                    isEnabled ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-50'
                  }`}
                onMouseEnter={() => isEnabled ? handleStepHover(step.id) : null}
                  onClick={() => isEnabled ? handleStepClick(step.id) : null}
              >

                
                <div className={`
                    aspect-square rounded-lg border-2 p-4 flex flex-col items-center justify-center relative group
                  ${(stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                    (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                    (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                    (step.id === 3 && receiptApprovalStatus === 'approved') ||
                    (step.id === 6 && hasManagerReceipt) ||
                    (step.id === 7 && clientReceiptUrl)
                                          ? 'border-blue-500 border-dashed bg-blue-50'
                                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2) && isEnabled
                                            ? 'border-purple-400 bg-purple-50 hover:border-purple-500'
                                            : isEnabled
                                              ? 'border-gray-300 hover:border-blue-400'
                                              : 'border-gray-200 bg-gray-50'
                                        }
                  `}>
                               {/* Индикатор заблокированного шага с tooltip */}
             {!isEnabled && (
               <div className="absolute inset-0 bg-gray-100/80 rounded-lg flex items-center justify-center group">
                 <div className="text-center">
                   <Lock className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                   <p className="text-xs text-gray-500">Этап {getCurrentStage() === 1 ? '2' : '1'}</p>
                 </div>
                 
                 {/* Tooltip при наведении */}
                 <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                   <div className="text-center">
                     <p className="font-medium">
                       {step.id === 3 ? 'Документы проекта' :
                        step.id === 6 ? 'Финансовые условия' :
                        step.id === 7 ? 'Запуск проекта' : 'Откроется в следующем этапе'}
                     </p>
                     <p className="text-gray-300">
                       {step.id === 3 ? 'Загрузка документов и спецификаций' :
                        step.id === 6 ? 'Настройка условий оплаты и доставки' :
                        step.id === 7 ? 'Финальная проверка и запуск сделки' : 'Заполните шаги 1, 2, 4, 5 для продолжения'}
                     </p>
                   </div>
                   {/* Стрелка вниз */}
                   <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                 </div>
               </div>
             )}
                    {/* Иконка замка для заблокированных шагов */}
                    {!isEnabled && (
                      <div className="absolute top-2 left-2">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    
                    
                                        
                                        {/* Индикатор эхо данных для шагов 1 и 2 */}
                                        {(step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2) && (
                      <div className="absolute top-2 left-2">
                                            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                              <span className="text-white text-xs">📊</span>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Лоадер эхо данных для шагов 1 и 2 */}
                                        {(step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && echoDataLoadingSteps1_2 && (
                      <div className="absolute top-2 left-2">
                                            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                              <Loader className="w-3 h-3 text-white animate-spin" />
                                            </div>
                                          </div>
                                        )}
                    
                  {/* Римская цифра в правом верхнем углу */}
                  <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isEnabled 
                        ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                           (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                           (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                           (step.id === 3 && receiptApprovalStatus === 'approved') ||
                           (step.id === 6 && hasManagerReceipt) ||
                           (step.id === 7 && clientReceiptUrl)
                          ? 'bg-blue-500 text-white'
                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-400 text-white'
                        : 'bg-gray-300 text-gray-500'
                    }`}>
                    {step.id === 1 ? 'I' : step.id === 2 ? 'II' : step.id === 3 ? 'III' : 
                     step.id === 4 ? 'IV' : step.id === 5 ? 'V' : step.id === 6 ? 'VI' : 'VII'}
                  </div>
                  
                  {/* Иконка шага в центре */}
                  <div className="mb-2">
                    {stepIcons[step.id] && React.createElement(stepIcons[step.id] as React.ComponentType<any>, { 
                        className: `h-6 w-6 ${
                          isEnabled 
                            ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                               (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                               (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                               (step.id === 3 && receiptApprovalStatus === 'approved')
                              ? 'text-blue-600'
                              : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                                ? 'text-purple-600'
                                : 'text-gray-600'
                            : 'text-gray-400'
                        }` 
                    })}
                  </div>
                  
                  {/* Название и описание */}
                    <div className={`text-sm font-medium text-center ${
                      isEnabled 
                        ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                           (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                           (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                           (step.id === 3 && receiptApprovalStatus === 'approved')
                          ? 'text-gray-800' 
                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                            ? 'text-purple-800'
                            : 'text-gray-600'
                        : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className={`text-xs text-center mt-1 ${
                      isEnabled 
                        ? (stepConfigs[step.id] && manualData[step.id]?.user_choice) || 
                           (stepConfigs[step.id] && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) || 
                           (manualData[step.id] && Object.keys(manualData[step.id]).length > 0 && (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5)) ||
                           (step.id === 3 && receiptApprovalStatus === 'approved')
                          ? 'text-gray-500' 
                          : (step.id === 1 || step.id === 2 || step.id === 4 || step.id === 5) && ((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2)
                            ? 'text-purple-600'
                            : 'text-gray-400'
                        : 'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                  
                  {/* Бейдж с источником данных */}
                  {stepConfigs[step.id] && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {dataSources[stepConfigs[step.id] as keyof typeof dataSources]?.name}
                      </Badge>
                    </div>
                  )}
                    

                </div>
              </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

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

          {/* Этап 2: Ожидание апрува менеджера или платежка */}
          {currentStage === 2 ? (
            <div className="min-h-[400px] flex items-center justify-center">
                          <div className="text-center">
              <div className="text-lg font-semibold mb-4">Этап 2: Подготовка инфраструктуры</div>
              <div className="text-sm text-gray-600 mb-4">
                Статус менеджера: {managerApprovalStatus || 'null'}
              </div>
              {managerApprovalStatus === 'pending' && <WaitingApprovalLoader projectRequestId={projectRequestId} />}
              {managerApprovalStatus === 'approved' && <PaymentForm />}
              {managerApprovalStatus === 'rejected' && <RejectionMessage managerApprovalMessage={managerApprovalMessage} onRejectionReset={() => { setManagerApprovalStatus(null); setCurrentStage(1); }} />}
              {!managerApprovalStatus && (
                <div className="text-red-500">
                  Ошибка: статус менеджера не установлен
                </div>
              )}
            </div>
            </div>
          ) : currentStage === 3 && receiptApprovalStatus !== 'approved' ? (
            <div className="min-h-[400px] bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 relative overflow-hidden">
              {/* Статус анимации */}
              <div className="text-center mb-6">
                <div className="text-lg font-semibold text-gray-800 mb-2">
                  {dealAnimationStatus}
                </div>
                <div className="text-sm text-gray-600">
                  Шаг {dealAnimationStep + 1} из 4
                </div>
              </div>

              {/* Анимационная сцена */}
              <div className="relative h-64 bg-white rounded-lg shadow-lg border-2 border-gray-200">
                {/* Клиент (синий) - слева */}
                <div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-2000 ease-in-out"
                  style={{
                    transform: `translateY(-50%) translateX(${dealAnimationStep >= 1 ? 200 : 0}px) translateY(${dealAnimationStep >= 3 ? -20 : 0}px)`
                  }}
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    👤
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-blue-700">
                    Клиент
                  </div>
                </div>

                {/* Поставщик (зеленый) - справа */}
                <div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-2000 ease-in-out"
                  style={{
                    transform: `translateY(-50%) translateX(${dealAnimationStep >= 1 ? -200 : 0}px) translateY(${dealAnimationStep >= 3 ? -20 : 0}px)`
                  }}
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    🏢
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-green-700">
                    Поставщик
                  </div>
                </div>

                {/* Менеджер (оранжевый) - в центре */}
                <div
                  className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                  style={{
                    transform: `translateX(-50%) translateY(-50%) scale(${dealAnimationStep >= 2 ? 1.2 : 1}) translateY(${dealAnimationStep >= 3 ? -20 : 0}px)`
                  }}
                >
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    👨‍💼
                  </div>
                  <div className="text-center mt-2 text-xs font-medium text-orange-700">
                    Менеджер
                  </div>
                </div>

                {/* Линии соединения */}
                {dealAnimationStep >= 3 && (
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                    style={{ opacity: 1 }}
                  >
                    <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 rounded-full"></div>
                  </div>
                )}

                {/* Успешное завершение */}
                {dealAnimationComplete && (
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-all duration-500"
                    style={{ opacity: 1, transform: 'scale(1)' }}
                  >
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🎉</div>
                      <div className="text-green-800 font-semibold">Сделка завершена!</div>
                      <div className="text-green-600 text-sm">Все участники встретились</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Прогресс анимации */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Начало</span>
                  <span>Движение</span>
                  <span>Проверка</span>
                  <span>Завершение</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((dealAnimationStep + 1) / 4) * 100}%` }}
                  />
                </div>
              </div>


            </div>
          ) : currentStage === 3 && receiptApprovalStatus === 'approved' ? (
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



          ) : currentStage === 4 ? (
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

          ) : (
            <div className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
            {/* Кнопки действий в правом верхнем углу внутри контейнера */}
            {lastHoveredStep && stepConfigs[lastHoveredStep] && (
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {/* Кнопка удаления */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemoveSource(lastHoveredStep)}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <X className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="font-medium">Удалить данные</span>
                  </div>
                </Button>

                {/* Кнопка просмотра всех данных */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditData('company')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="font-medium">Посмотреть все данные</span>
                  </div>
                </Button>

                {/* Кнопка добавления товаров из каталога (только для шага 2) */}
                {lastHoveredStep === 2 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAddProductsFromCatalog()}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                        <Plus className="h-3 w-3 text-orange-600" />
                      </div>
                      <span className="font-medium">Добавить товары</span>
                    </div>
                  </Button>
                )}
              </div>
            )}
            

            <AnimatePresence>
              {lastHoveredStep && isStepEnabled(lastHoveredStep) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ height: '100%' }}
                >
                  {/* Заголовок выбранного шага */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {lastHoveredStep === 1 ? 'I' : lastHoveredStep === 2 ? 'II' : lastHoveredStep === 3 ? 'III' : 
                         lastHoveredStep === 4 ? 'IV' : lastHoveredStep === 5 ? 'V' : lastHoveredStep === 6 ? 'VI' : 'VII'}
                      </div>
                      <h3 className="text-lg font-semibold">
                        {constructorSteps.find(s => s.id === lastHoveredStep)?.name}
                      </h3>
                    </div>
                    <p className="text-gray-600">
                      {constructorSteps.find(s => s.id === lastHoveredStep)?.description}
                    </p>
                  </div>

                  {/* Показываем выбор шаблонов пользователя */}
                  {templateSelection ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold text-gray-800">Выберите шаблон</h4>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fetchTemplates()}
                            disabled={templatesLoading}
                          >
                            {templatesLoading ? 'Загрузка...' : 'Обновить'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setTemplateSelection(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-4">
                        {templatesLoading ? (
                          <div className="flex items-center justify-center p-8">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-gray-600">Загрузка шаблонов...</span>
                          </div>
                        ) : templatesError ? (
                          <div className="text-center py-8 text-red-500">
                            <p>Ошибка загрузки шаблонов: {templatesError}</p>
                            <div className="flex gap-2 mt-4 justify-center">
                              <Button 
                                onClick={() => fetchTemplates()}
                                variant="outline" 
                              >
                                Попробовать снова
                              </Button>
                              <Button 
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/check-project-templates')
                                    const data = await response.json()
                                    console.log('🔍 Результат проверки таблицы:', data)
                                    alert(`Проверка таблицы: ${JSON.stringify(data, null, 2)}`)
                                  } catch (error) {
                                    console.error('Ошибка проверки:', error)
                                    alert('Ошибка проверки таблицы')
                                  }
                                }}
                                variant="outline" 
                              >
                                Проверить таблицу
                              </Button>
                              <Button 
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/create-project-templates-table', {
                                      method: 'POST'
                                    })
                                    const data = await response.json()
                                    console.log('🔧 Результат создания таблицы:', data)
                                    if (data.success) {
                                      alert('Таблица создана успешно! Обновите страницу.')
                                      window.location.reload()
                                    } else {
                                      alert(`Ошибка создания таблицы: ${data.error}`)
                                    }
                                  } catch (error) {
                                    console.error('Ошибка создания:', error)
                                    alert('Ошибка создания таблицы')
                                  }
                                }}
                                variant="outline" 
                                className="bg-green-50 hover:bg-green-100"
                              >
                                Создать таблицу
                              </Button>
                              <Button 
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/api/analyze-database-structure')
                                    const data = await response.json()
                                    console.log('🔍 Результат анализа БД:', data)
                                    alert(`Анализ БД: ${JSON.stringify(data.summary, null, 2)}`)
                                  } catch (error) {
                                    console.error('Ошибка анализа:', error)
                                    alert('Ошибка анализа БД')
                                  }
                                }}
                                variant="outline" 
                                className="bg-blue-50 hover:bg-blue-100"
                              >
                                Анализ БД
                              </Button>
                            </div>
                          </div>
                        ) : getUserTemplates().length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>У вас пока нет сохраненных шаблонов</p>
                            <p className="text-sm mt-2">Создайте шаблон в разделе "Создать проект"</p>
                          </div>
                        ) : (
                          getUserTemplates().map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => handleTemplateSelect(template.id)}
                            >
                              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-semibold text-gray-800 mb-1">{template.name}</div>
                                <div className="text-sm text-gray-600 leading-relaxed">{template.description}</div>
                                <div className="text-xs text-gray-500 mt-1">Использован: {template.lastUsed}</div>
                              </div>
                              <div className="text-blue-500">
                                <ArrowRight className="h-5 w-5" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : templateStepSelection ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-base font-semibold text-gray-800">Выберите шаг для заполнения из шаблона</h4>
                        <Button variant="outline" size="sm" onClick={() => setTemplateStepSelection(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Кнопка "Заполнить все шаги" */}
                      {templateStepSelection.availableSteps.length > 1 && (
                        <div className="mb-4">
                          <Button 
                            onClick={handleFillAllTemplateSteps}
                            variant="outline"
                            className="w-full h-10 text-sm font-medium border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Заполнить все шаги из шаблона
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid gap-4">
                        {templateStepSelection.availableSteps.map((stepId) => {
                          const step = constructorSteps.find(s => s.id === stepId)
                          return (
                            <div
                              key={stepId}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => handleTemplateStepSelect(stepId)}
                            >
                              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-lg">
                                  {stepId === 1 ? 'I' : stepId === 2 ? 'II' : stepId === 3 ? 'III' : 
                                   stepId === 4 ? 'IV' : stepId === 5 ? 'V' : stepId === 6 ? 'VI' : 'VII'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-semibold text-gray-800 mb-1">{step?.name}</div>
                                <div className="text-sm text-gray-600 leading-relaxed">{step?.description}</div>
                              </div>
                              <div className="text-blue-500">
                                <ArrowRight className="h-5 w-5" />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                  ) : selectedSource === "manual" ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">Заполнение вручную</h4>
                        <Button variant="outline" size="sm" onClick={handleCancelSource}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Формы для разных шагов */}
                      {lastHoveredStep === 1 && editingType === 'company' && (
                        <CompanyForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep] as any}
                        />
                      )}
                      
                      {lastHoveredStep === 1 && editingType === 'contacts' && (
                        <ContactsForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep] as any}
                        />
                      )}
                      
                      {lastHoveredStep === 1 && editingType === 'bank' && (
                        <BankForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep] as any}
                        />
                      )}
                      
                      {lastHoveredStep === 1 && !editingType && (
                        <CompanyForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep] as any}
                        />
                      )}
                      
                      {lastHoveredStep === 2 && (
                        <SpecificationForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep] as any}
                        />
                      )}
                      
                      {lastHoveredStep === 3 && (
                        <FileUploadForm 
                          onSave={(data) => {
                            if (data.file) {
                              handleFileUpload(lastHoveredStep, data.file)
                            }
                            handleManualDataSave(lastHoveredStep, data)
                          }}
                          onCancel={handleCancelSource}
                        />
                      )}
                      
                      {lastHoveredStep === 4 && (
                        <PaymentMethodForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep] as any}
                          getStepData={(stepId) => manualData[stepId]}
                        />
                      )}
                      
                      {lastHoveredStep === 5 && (
                        <RequisitesForm 
                          onSave={(data) => handleManualDataSave(lastHoveredStep, data)}
                          onCancel={handleCancelSource}
                          initialData={manualData[lastHoveredStep] as any}
                        />
                      )}
                    </div>
                  ) : selectedSource === "upload" ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">Загрузка документа</h4>
                        <Button variant="outline" size="sm" onClick={handleCancelSource}>
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
                          {/* Drag & Drop зона */}
                          <div 
                            className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const files = e.dataTransfer.files;
                              if (files.length > 0) {
                                handleFileUpload(lastHoveredStep, files[0]);
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
                                  handleFileUpload(lastHoveredStep, file);
                                }
                              }}
                            />
                          </div>
                          
                          {/* Информация о поддерживаемых документах */}
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
                          
                          {/* Статус загрузки и анализа */}
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
                          
                          {/* Статус успешной загрузки */}
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
                          
                          {/* Статус ошибки */}
                          {ocrError[lastHoveredStep] && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <X className="w-5 h-5 text-red-600" />
                                <span className="text-red-800 font-medium">Ошибка анализа</span>
                              </div>
                              <p className="text-sm text-red-600 mt-1">
                                {ocrError[lastHoveredStep]}
                              </p>
                              
                              {/* Отладочная информация */}
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

                {/* Блок для 7-го шага - Подтверждение получения */}
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
                              onChange={handleClientReceiptUpload}
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
                  </div>
                )}
              </div>
            </div>
                    </div>
                  ) : stepConfigs[lastHoveredStep] ? (
                    // Только 3 кубика с данными для первого шага
                    <div className="flex justify-center">
                      {lastHoveredStep === 1 && manualData[lastHoveredStep] && (
                        <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
                          {/* Кубик 1: Данные компании - кликабельный */}
                          <div 
                            className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 hover:scale-105"
                            onClick={() => handlePreviewData('company', manualData[lastHoveredStep])}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <Building className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Данные компании</div>
                                <div className="text-xs text-gray-500">Основная информация</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800 font-medium">{manualData[lastHoveredStep].name}</div>
                            <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                              <span>Нажмите для просмотра</span>
                              <Eye className="h-3 w-3" />
                            </div>
                          </div>
                          
                          {/* Кубик 2: Данные расчетного счета - кликабельный */}
                          <div 
                            className="bg-white border-2 border-green-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300 hover:scale-105"
                            onClick={() => handlePreviewData('bank', manualData[lastHoveredStep])}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <Banknote className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Расчетный счет</div>
                                <div className="text-xs text-gray-500">Банковские реквизиты</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800">{manualData[lastHoveredStep].bankName}</div>
                            {manualData[lastHoveredStep].bankAccount && (
                              <div className="text-xs text-gray-500">{manualData[lastHoveredStep].bankAccount}</div>
                            )}
                            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <span>Нажмите для просмотра</span>
                              <Eye className="h-3 w-3" />
                            </div>
                          </div>
                          
                          {/* Кубик 3: Дополнительные данные - кликабельный */}
                          <div 
                            className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-purple-300 hover:scale-105"
                            onClick={() => handlePreviewData('contacts', manualData[lastHoveredStep])}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-800">Дополнительно</div>
                                <div className="text-xs text-gray-500">Контакты и детали</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-800">{manualData[lastHoveredStep].email}</div>
                            {manualData[lastHoveredStep].phone && (
                              <div className="text-sm text-gray-800 mt-1">{manualData[lastHoveredStep].phone}</div>
                            )}
                            <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                              <span>Нажмите для просмотра</span>
                              <Eye className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Полная форма данных шага */}
                      

                      
                      {/* Эхо предложения для шага 2 */}
                      {lastHoveredStep === 2 && (manualData as any).echoSuggestions?.step2 && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                              <span className="text-white text-xs">📊</span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">Эхо данные найдены!</div>
                              <div className="text-xs text-gray-600">{(manualData as any).echoSuggestions.step2.description}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 mb-3">
                            Найдено {(manualData as any).echoSuggestions.step2.products.length} товаров поставщика
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                // Применяем товары из эхо данных
                                const products = (manualData as any).echoSuggestions.step2.products
                                if (products && products.length > 0) {
                                  setManualData(prev => ({
                                    ...prev,
                                    2: {
                                      supplier: products[0].supplier || products[0].supplier_name,
                                      currency: products[0].currency || 'USD',
                                      items: products.map((product: any) => ({
                                        item_name: product.name,
                                        item_code: product.name,
                                        quantity: 1,
                                        price: product.price || 0,
                                        unit: 'шт'
                                      }))
                                    }
                                  }))
                                  setStepConfigs(prev => ({ ...prev, 2: 'echo' }))
                                  alert('Товары поставщика из эхо данных применены!')

                                  // ЭХО ДАННЫЕ ОТКЛЮЧЕНЫ: Автозаполнение шагов 4-5 из эхо данных отключено
                                }
                              }}
                            >
                              Применить товары поставщика
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setManualData(prev => {
                                  const { echoSuggestions, ...rest } = prev as any
                                  return rest
                                })
                              }}
                            >
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Глобальные эхо предложения - показываются независимо от lastHoveredStep */}
                      {((manualData as any).echoSuggestions?.step1 || (manualData as any).echoSuggestions?.step2) && (
                        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                              <span className="text-white text-xs">📊</span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">Найдены эхо данные!</div>
                              <div className="text-xs text-gray-600">
                                {(manualData as any).echoSuggestions?.step1 && 'Данные клиента • '}
                                {(manualData as any).echoSuggestions?.step2 && 'Товары поставщика'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Эхо данные для шага 1 */}
                            {(manualData as any).echoSuggestions?.step1 && (
                              <div className="p-3 bg-white rounded border">
                                <div className="text-sm font-medium text-gray-800 mb-2">
                                  👤 Данные клиента: {(manualData as any).echoSuggestions.step1.description}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Найдено {(manualData as any).echoSuggestions.step1.clients.length} клиентов
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    const firstClient = (manualData as any).echoSuggestions.step1.clients[0]
                                    if (firstClient) {
                                      setManualData(prev => ({
                                        ...prev,
                                        1: {
                                          name: firstClient.name || firstClient.company_name,
                                          legalName: firstClient.company_name || '',
                                          inn: firstClient.inn || '',
                                          address: firstClient.address || '',
                                          email: firstClient.email || '',
                                          phone: firstClient.phone || ''
                                        }
                                      }))
                                      setStepConfigs(prev => ({ ...prev, 1: 'echo' }))
                                      alert('Данные клиента из эхо истории применены!')
                                    }
                                  }}
                                >
                                  Применить данные клиента
                                </Button>
                              </div>
                            )}
                            
                            {/* Эхо данные для шага 2 */}
                            {(manualData as any).echoSuggestions?.step2 && (
                              <div className="p-3 bg-white rounded border">
                                <div className="text-sm font-medium text-gray-800 mb-2">
                                  📦 Товары поставщика: {(manualData as any).echoSuggestions.step2.description}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Найдено {(manualData as any).echoSuggestions.step2.products.length} товаров
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    const products = (manualData as any).echoSuggestions.step2.products
                                    if (products && products.length > 0) {
                                      setManualData(prev => ({
                                        ...prev,
                                        2: {
                                          supplier: products[0].supplier || products[0].supplier_name,
                                          currency: products[0].currency || 'USD',
                                          items: products.map((product: any) => ({
                                            item_name: product.name,
                                            item_code: product.name,
                                            quantity: 1,
                                            price: product.price || 0,
                                            unit: 'шт'
                                          }))
                                        }
                                      }))
                                      setStepConfigs(prev => ({ ...prev, 2: 'echo' }))
                                      alert('Товары поставщика из эхо данных применены!')

                                      // ЭХО ДАННЫЕ ОТКЛЮЧЕНЫ: Автозаполнение шагов 4-5 из эхо данных отключено
                                    }
                                  }}
                                >
                                  Применить товары поставщика
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setManualData(prev => {
                                  const { echoSuggestions, ...rest } = prev as any
                                  return rest
                                })
                              }}
                            >
                              Отклонить все эхо данные
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Шаг 2: Горизонтальный слайдер товаров */}
                      {lastHoveredStep === 2 && manualData[lastHoveredStep] && (
                        <div className="flex justify-center">
                          <div className="w-full max-w-6xl">
                            {/* Слайдер товаров */}
                            {manualData[lastHoveredStep]?.items && manualData[lastHoveredStep].items.length > 0 && (
                              <div className="mb-6">
                                {/* Заголовок слайдера */}
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    Товары ({manualData[lastHoveredStep].items.length})
                                  </h3>
                                  {/* Пагинация удалена - используются точки-индикаторы внизу */}
                          </div>
                          
                                {/* Контейнер слайдера */}
                                <div className="relative">
                                  {/* Кнопка "Назад" */}
                                  {currentProductIndex > 0 && (
                                    <button
                                      onClick={() => setCurrentProductIndex(prev => Math.max(0, prev - productsPerView))}
                                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200"
                                    >
                                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                                    </button>
                                  )}
                                  
                                  {/* Кнопка "Вперед" */}
                                  {currentProductIndex + productsPerView < (manualData[lastHoveredStep]?.items?.length || 0) && (
                                    <button
                                      onClick={() => setCurrentProductIndex(prev => Math.min((manualData[lastHoveredStep]?.items?.length || 0) - productsPerView, prev + productsPerView))}
                                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200"
                                    >
                                      <ChevronRight className="h-5 w-5 text-gray-600" />
                                    </button>
                                  )}
                                  
                                  {/* Текущие товары (по 3) */}
                                  <div className="grid grid-cols-3 gap-4 mx-12">
                                    {Array.from({ length: productsPerView }, (_, i) => {
                                      const itemIndex = currentProductIndex + i;
                                      const item = manualData[lastHoveredStep]?.items?.[itemIndex];
                                      
                                      if (!item) return null;
                                      
                                      return (
                                        <div 
                                          key={itemIndex}
                                className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-400 hover:scale-105"
                                          onClick={() => handlePreviewData('product', manualData[lastHoveredStep])}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-white" />
                                          </div>
                                          <div>
                                              <div className="text-sm font-semibold text-gray-800">
                                                Товар {itemIndex + 1}
                                              </div>
                                    <div className="text-xs text-gray-500">Спецификация</div>
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">📦</span>
                                              <span className="text-gray-800 font-medium text-sm truncate">
                                                {item.item_name || item.name || 'Товар без названия'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">🏷️</span>
                                              <span className="text-gray-800 text-sm">
                                                {(item as any).item_code || 'Без артикула'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">💰</span>
                                              <span className="text-gray-800 text-sm">
                                                {item.price} {manualData[lastHoveredStep]?.currency || 'RUB'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">📊</span>
                                              <span className="text-gray-800 text-sm">
                                                {item.quantity} шт
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-gray-400">💳</span>
                                              <span className="text-gray-800 font-semibold text-sm">
                                                {item.total} {manualData[lastHoveredStep]?.currency || 'RUB'}
                                            </span>
                                          </div>
                                        </div>
                                
                                <div className="text-xs text-green-600 mt-3 flex items-center gap-1">
                                  <span>Нажмите для просмотра</span>
                                  <Eye className="h-3 w-3" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                {/* Индикаторы слайдера */}
                                <div className="flex justify-center gap-2 mt-4">
                                  {Array.from({ length: Math.ceil(manualData[lastHoveredStep].items.length / productsPerView) }, (_, groupIndex) => (
                                    <button
                                      key={groupIndex}
                                      onClick={() => setCurrentProductIndex(groupIndex * productsPerView)}
                                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                        Math.floor(currentProductIndex / productsPerView) === groupIndex
                                          ? 'bg-blue-500' 
                                          : 'bg-gray-300 hover:bg-gray-400'
                                      }`}
                                    />
                                  ))}
                                      </div>
                                  </div>
                                )}
                                
                            {/* Сводная информация */}
                            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Сводка</div>
                                  <div className="text-xs text-gray-500">Общая информация</div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">🏪</span>
                                  <span className="text-gray-800 font-medium">
                                    {manualData[lastHoveredStep]?.supplier || 
                                     manualData[lastHoveredStep]?.items?.[0]?.item_name || 
                                     'Не указано'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">📦</span>
                                  <span className="text-gray-800">
                                    {manualData[lastHoveredStep]?.items?.length || 0} позиций
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">💰</span>
                                  <span className="text-gray-800">{manualData[lastHoveredStep]?.currency || 'Не указано'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Шаг 4: Методы оплаты - показываем кубики для каждого метода */}
                      {lastHoveredStep === 4 && manualData[lastHoveredStep] && (
                        <div className="flex justify-center">
                          <div className="grid grid-cols-3 gap-4 w-full">
                            {['bank-transfer', 'p2p', 'crypto'].map((method: string, index: number) => {
                                // Проверяем, выбран ли этот метод
                                const isSelected = manualData[4]?.selectedMethod === method ||
                                                 manualData[4]?.method === method ||
                                                 manualData[4]?.defaultMethod === method

                                // Проверяем, есть ли данные поставщика для этого метода
                                let hasSupplierData = false;

                                // Приоритет 1: Проверяем selectedSupplierData (самый актуальный источник)
                                if (selectedSupplierData) {
                                  if ((method === 'bank-transfer' || method === 'bank') && (selectedSupplierData.bank_accounts?.length && selectedSupplierData.bank_accounts.length > 0 || selectedSupplierData.payment_methods?.includes('bank-transfer' as any))) {
                                    hasSupplierData = true;
                                  }
                                  if (method === 'p2p' && (selectedSupplierData.p2p_cards?.length && selectedSupplierData.p2p_cards.length > 0 || selectedSupplierData.payment_methods?.includes('p2p'))) {
                                    hasSupplierData = true;
                                  }
                                  if (method === 'crypto' && (selectedSupplierData.crypto_wallets?.length && selectedSupplierData.crypto_wallets.length > 0 || selectedSupplierData.payment_methods?.includes('crypto'))) {
                                    hasSupplierData = true;
                                  }
                                }

                                // Приоритет 2: Проверяем через manualData[4] (если selectedSupplierData недоступен)
                                if (!hasSupplierData && manualData[4]) {
                                  // Проверяем по методам из manualData[4] (из каталога)
                                  if (manualData[4].methods && manualData[4].methods.includes(method)) {
                                    hasSupplierData = true;
                                  }
                                  // Проверяем по доступным данным поставщика в manualData[4]
                                  if (!hasSupplierData && manualData[4].supplier_data) {
                                    const supplier = manualData[4].supplier_data;
                                    if ((method === 'bank-transfer' || method === 'bank') && (supplier.bank_accounts?.length > 0 || supplier.payment_methods?.includes('bank-transfer' as any))) {
                                      hasSupplierData = true;
                                    }
                                    if (method === 'p2p' && (supplier.p2p_cards?.length > 0 || supplier.payment_methods?.includes('p2p'))) {
                                      hasSupplierData = true;
                                    }
                                    if (method === 'crypto' && (supplier.crypto_wallets?.length > 0 || supplier.payment_methods?.includes('crypto'))) {
                                      hasSupplierData = true;
                                    }
                                  }
                                }

                                console.log('🔍 [DEBUG] Method Check:', {
                                  method,
                                  hasSupplierData,
                                  manualData4: manualData[4],
                                  selectedSupplierData: {
                                    name: selectedSupplierData?.name,
                                    payment_methods: selectedSupplierData?.payment_methods,
                                    bank_accounts: selectedSupplierData?.bank_accounts,
                                    p2p_cards: selectedSupplierData?.p2p_cards,
                                    crypto_wallets: selectedSupplierData?.crypto_wallets
                                  }
                                });
                                return <div
                                  key={index}
                                  className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                    isSelected
                                      ? (method === 'crypto' ? 'ring-4 ring-green-400 border-green-500 bg-green-100' :
                                         method === 'p2p' ? 'ring-4 ring-blue-400 border-blue-500 bg-blue-100' :
                                         'ring-4 ring-orange-400 border-orange-500 bg-orange-100')
                                      : hasSupplierData
                                        ? (method === 'crypto' ? 'border-green-300 bg-green-50 hover:border-green-400' :
                                           method === 'p2p' ? 'border-blue-300 bg-blue-50 hover:border-blue-400' :
                                           'border-orange-300 bg-orange-50 hover:border-orange-400')
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                  }`}
                                  onClick={() => handlePaymentMethodSelect(method, selectedSupplierData)}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isSelected
                                        ? (method === 'crypto' ? 'bg-green-600 ring-2 ring-green-300' :
                                           method === 'p2p' ? 'bg-blue-600 ring-2 ring-blue-300' :
                                           'bg-orange-600 ring-2 ring-orange-300')
                                        : hasSupplierData
                                          ? (method === 'crypto' ? 'bg-green-500' :
                                             method === 'p2p' ? 'bg-blue-500' :
                                             'bg-orange-500')
                                          : 'bg-gray-400'
                                    }`}>
                                      {isSelected ? <CheckCircle2 className="h-4 w-4 text-white" /> : <CreditCard className="h-4 w-4 text-white" />}
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">
                                        {method === 'crypto' ? 'Криптовалюта' :
                                         method === 'p2p' ? 'P2P перевод' :
                                         'Банковский перевод'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {method === 'crypto' ? 'Крипто платеж' :
                                         method === 'p2p' ? 'P2P платеж' :
                                         'Банковский платеж'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    Статус
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {isSelected ? 'ВЫБРАН' : hasSupplierData ? 'Автозаполнение' : 'Ручное заполнение'}
                                  </div>
                                  <div className={`text-xs mt-2 flex items-center gap-1 ${
                                    isSelected
                                      ? (method === 'crypto' ? 'text-green-600 font-bold' :
                                         method === 'p2p' ? 'text-blue-600 font-bold' :
                                         'text-orange-600 font-bold')
                                      : method === 'crypto' ? 'text-green-600' :
                                        method === 'p2p' ? 'text-blue-600' :
                                        'text-gray-600'
                                  }`}>
                                    <span>{isSelected ? 'ВЫБРАНО' : 'Выбрать'}</span>
                                    {isSelected ? <CheckCircle2 className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                  </div>
                                </div>
                              })
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Шаг 5: Реквизиты - показываем форму если реквизиты были заполнены */}
                      {(() => {
                        const step5HasData = !!manualData[5];
                        const step5HasUserChoice = manualData[5]?.user_choice;
                        const step5HasType = manualData[5]?.type;
                        const shouldShowStep5Form = lastHoveredStep === 5 && step5HasData && step5HasUserChoice && step5HasType;

                        console.log('🔍 [Step 5 Debug]:', {
                          lastHoveredStep,
                          step5HasData,
                          step5HasUserChoice,
                          step5HasType,
                          shouldShowStep5Form,
                          manualData5: manualData[5]
                        });

                        return shouldShowStep5Form;
                      })() && (
                        <div className="flex justify-center">
                          <div className="grid grid-cols-3 gap-4 w-full">
                            {manualData[lastHoveredStep].type === 'multiple' && manualData[lastHoveredStep].requisites ? (
                              // Показываем все кубики реквизитов
                              manualData[lastHoveredStep].requisites.map((requisite: any, index: number) => (
                                <div 
                                  key={index}
                                  className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                    requisite.type === 'crypto' ? 'border-green-200 hover:border-green-300' :
                                    requisite.type === 'p2p' ? 'border-blue-200 hover:border-blue-300' :
                                    'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => handlePreviewData('requisites', requisite)}
                                >
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      requisite.type === 'crypto' ? 'bg-green-500' :
                                      requisite.type === 'p2p' ? 'bg-blue-500' :
                                      'bg-gray-500'
                                    }`}>
                                      <Banknote className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-800">
                                        {requisite.type === 'crypto' ? 'Криптокошелек' :
                                         requisite.type === 'p2p' ? 'Карта поставщика' :
                                         'Расчетный счет'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {requisite.type === 'crypto' ? 'Криптореквизиты' :
                                         requisite.type === 'p2p' ? 'P2P реквизиты' :
                                         'Банковские реквизиты'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    {requisite.type === 'crypto' ? 'Сеть' :
                                     requisite.type === 'p2p' ? 'Банк карты' :
                                     'Банк поставщика'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {requisite.type === 'crypto' ? (requisite.crypto_network || 'Не указана') :
                                     requisite.type === 'p2p' ? (requisite.card_bank || 'Не указан') :
                                     `${requisite.accountNumber || 'Не указано'}`}
                                  </div>
                                  <div className={`text-xs mt-2 flex items-center gap-1 ${
                                    requisite.type === 'crypto' ? 'text-green-600' :
                                    requisite.type === 'p2p' ? 'text-blue-600' :
                                    'text-gray-600'
                                  }`}>
                                    <span>Нажмите для просмотра</span>
                                    <Eye className="h-3 w-3" />
                                  </div>
                                </div>
                              ))
                            ) : (
                              // Показываем один кубик для одиночного типа
                              <div
                                className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 col-span-3 ring-4 ${
                                  manualData[5]?.type === 'crypto' ? 'border-green-500 bg-green-100 hover:border-green-600 ring-green-400' :
                                  manualData[5]?.type === 'p2p' ? 'border-blue-500 bg-blue-100 hover:border-blue-600 ring-blue-400' :
                                  'border-orange-500 bg-orange-100 hover:border-orange-600 ring-orange-400'
                                }`}
                                onClick={() => handlePreviewData('requisites', manualData[5])}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ${
                                    manualData[5]?.type === 'crypto' ? 'bg-green-600 ring-green-300' :
                                    manualData[5]?.type === 'p2p' ? 'bg-blue-600 ring-blue-300' :
                                    'bg-orange-600 ring-orange-300'
                                  }`}>
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">
                                      {manualData[lastHoveredStep].type === 'crypto' ? 'Криптокошелек' :
                                       manualData[lastHoveredStep].type === 'p2p' ? 'Карта поставщика' :
                                       'Расчетный счет'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {manualData[lastHoveredStep].type === 'crypto' ? 'Криптореквизиты' :
                                       manualData[lastHoveredStep].type === 'p2p' ? 'P2P реквизиты' :
                                       'Банковские реквизиты'}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-800">
                                  {manualData[lastHoveredStep].type === 'crypto' ? 'Сеть' :
                                   manualData[lastHoveredStep].type === 'p2p' ? 'Банк карты' :
                                   'Банк поставщика'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {manualData[lastHoveredStep].type === 'crypto' ? (manualData[lastHoveredStep].crypto_network || 'Не указана') :
                                   manualData[lastHoveredStep].type === 'p2p' ? (manualData[lastHoveredStep].card_bank || 'Не указан') :
                                   `${manualData[lastHoveredStep].accountNumber || 'Не указано'}`}
                                </div>
                                <div className={`text-xs mt-2 flex items-center gap-1 font-bold ${
                                  manualData[5]?.type === 'crypto' ? 'text-green-600' :
                                  manualData[5]?.type === 'p2p' ? 'text-blue-600' :
                                  'text-orange-600'
                                }`}>
                                  <span>ЗАПОЛНЕНО</span>
                                  <CheckCircle2 className="h-3 w-3" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* СПЕЦИАЛЬНО для шага 5: показываем кубики выбора когда есть stepConfigs[5] = 'catalog' - позволяем пользователю менять тип реквизитов даже после автозаполнения */}
                      {lastHoveredStep === 5 && (() => {
                        console.log('🔍 [DEBUG Step 5] Наведение на шаг 5:');
                        console.log('  - lastHoveredStep:', lastHoveredStep);
                        console.log('  - stepConfigs[5]:', stepConfigs[5]);
                        console.log('  - stepConfigs:', stepConfigs);
                        console.log('  - manualData[5]:', manualData[5]);
                        console.log('  - selectedSupplierData:', selectedSupplierData);

                        const shouldShowCubes = ['catalog', 'blue_room', 'orange_room'].includes(stepConfigs[5]) || (manualData[5] && Object.keys(manualData[5]).length > 0);
                        console.log('  - shouldShowCubes (stepConfigs[5] in ["catalog", "blue_room", "orange_room"] OR has manualData[5]):', shouldShowCubes);

                        return shouldShowCubes;
                      })() && (() => {
                        // Проверяем доступные методы поставщика
                        const checkMethodAvailability = (method: string) => {
                          // Приоритет 1: selectedSupplierData
                          if (selectedSupplierData) {
                            if (method === 'bank-transfer' && ((selectedSupplierData.bank_accounts?.length || 0) > 0 || selectedSupplierData.payment_methods?.includes('bank-transfer'))) {
                              return true;
                            }
                            if (method === 'p2p' && ((selectedSupplierData.p2p_cards?.length || 0) > 0 || selectedSupplierData.payment_methods?.includes('p2p'))) {
                              return true;
                            }
                            if (method === 'crypto' && ((selectedSupplierData.crypto_wallets?.length || 0) > 0 || selectedSupplierData.payment_methods?.includes('crypto'))) {
                              return true;
                            }
                          }

                          // Приоритет 2: manualData[4]
                          if (manualData[4]) {
                            if (manualData[4].methods && manualData[4].methods.includes(method)) {
                              return true;
                            }
                            if (manualData[4].supplier_data) {
                              const supplier = manualData[4].supplier_data;
                              if (method === 'bank-transfer' && (supplier.bank_accounts?.length > 0 || supplier.payment_methods?.includes('bank-transfer'))) {
                                return true;
                              }
                              if (method === 'p2p' && (supplier.p2p_cards?.length > 0 || supplier.payment_methods?.includes('p2p'))) {
                                return true;
                              }
                              if (method === 'crypto' && (supplier.crypto_wallets?.length > 0 || supplier.payment_methods?.includes('crypto'))) {
                                return true;
                              }
                            }
                          }

                          return false;
                        };

                        const bankAvailable = checkMethodAvailability('bank-transfer');
                        const p2pAvailable = checkMethodAvailability('p2p');
                        const cryptoAvailable = checkMethodAvailability('crypto');

                        return (
                          <div className="mb-6">
                            <h4 className="text-base font-semibold text-gray-800 mb-4">Выберите тип реквизитов:</h4>
                            <div className="grid grid-cols-3 gap-4 w-full">
                            {/* Банковский перевод */}
                            <div
                              className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                bankAvailable
                                  ? 'border-orange-400 bg-orange-100 hover:border-orange-500 ring-2 ring-orange-200'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                // Обновляем шаг 5 (реквизиты)
                                setManualData(prev => ({
                                  ...prev,
                                  4: {
                                    ...prev[4],
                                    selectedMethod: 'bank-transfer',
                                    method: 'bank-transfer',
                                    user_choice: true
                                  },
                                  5: {
                                    type: 'bank',
                                    bankName: '',
                                    accountNumber: '',
                                    swift: '',
                                    recipientName: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 4: 'manual', 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                  <Banknote className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Банковский перевод</div>
                                  <div className="text-xs text-gray-500">Банковские реквизиты</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать банковские реквизиты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                SWIFT, IBAN, счета
                              </div>
                            </div>

                            {/* P2P переводы */}
                            <div
                              className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                p2pAvailable
                                  ? 'border-blue-400 bg-blue-100 hover:border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                // Обновляем шаги 4 и 5 (двусторонняя связь)
                                setManualData(prev => ({
                                  ...prev,
                                  4: {
                                    ...prev[4],
                                    selectedMethod: 'p2p',
                                    method: 'p2p',
                                    user_choice: true
                                  },
                                  5: {
                                    type: 'p2p',
                                    card_bank: '',
                                    card_number: '',
                                    card_holder: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 4: 'manual', 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">P2P переводы</div>
                                  <div className="text-xs text-gray-500">Карта поставщика</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать P2P карты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                Банковские карты
                              </div>
                            </div>

                            {/* Криптовалюта */}
                            <div
                              className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                cryptoAvailable
                                  ? 'border-green-400 bg-green-100 hover:border-green-500 ring-2 ring-green-200'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                // Обновляем шаги 4 и 5 (двусторонняя связь)
                                setManualData(prev => ({
                                  ...prev,
                                  4: {
                                    ...prev[4],
                                    selectedMethod: 'crypto',
                                    method: 'crypto',
                                    user_choice: true
                                  },
                                  5: {
                                    type: 'crypto',
                                    crypto_wallet: '',
                                    crypto_network: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 4: 'manual', 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <Coins className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Криптовалюта</div>
                                  <div className="text-xs text-gray-500">Криптокошелек</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать криптовалюты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                BTC, ETH, USDT и др.
                              </div>
                            </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Для других шагов - обычная карточка */}
                      {lastHoveredStep !== 1 && lastHoveredStep !== 2 && lastHoveredStep !== 4 && lastHoveredStep !== 5 && manualData[lastHoveredStep] && (
                        <div 
                          className={`border-2 border-gray-200 rounded-xl p-6 shadow-lg max-w-md w-full transition-all duration-200
                            ${manualData[lastHoveredStep].echo_data 
                              ? 'bg-white/60 backdrop-blur-sm border-indigo-200' 
                              : 'bg-white'}
                          `}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              stepConfigs[lastHoveredStep] === "profile" ? "bg-blue-500" :
                              stepConfigs[lastHoveredStep] === "template" ? "bg-green-500" :
                              (stepConfigs[lastHoveredStep] === "blue_room" || stepConfigs[lastHoveredStep] === "orange_room" || stepConfigs[lastHoveredStep] === "echo_cards") ? "bg-purple-500" :
                              stepConfigs[lastHoveredStep] === "echo" ? "bg-orange-500" :
                              stepConfigs[lastHoveredStep] === "echoData" ? "bg-indigo-500" :
                              stepConfigs[lastHoveredStep] === "manual" ? "bg-gray-500" : "bg-emerald-500"
                            }`}>
                              {stepConfigs[lastHoveredStep] === "profile" ? <Users className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "template" ? <FileText className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "blue_room" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "orange_room" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "echo_cards" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "catalog" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "echo" ? <FileText className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "echoData" ? <Clock className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "manual" ? <Plus className="h-4 w-4 text-white" /> : <CheckCircle className="h-4 w-4 text-white" />}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {dataSources[stepConfigs[lastHoveredStep] as keyof typeof dataSources]?.name}
                              </div>
                              {stepConfigs[lastHoveredStep] === "template" && manualData[lastHoveredStep]?.templateName && (
                                <div className="text-xs text-gray-500">{manualData[lastHoveredStep].templateName}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4">
                            {lastHoveredStep === 3 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">📄</span>
                                <span className="text-gray-800">{uploadedFiles[lastHoveredStep]}</span>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full ml-auto">
                                  ✓ Загружен
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Для шага 5: показываем кубики выбора типа реквизитов */}
                      {lastHoveredStep === 5 && (() => {
                        // Проверяем доступные методы поставщика
                        const checkMethodAvailability = (method: string) => {
                          // Приоритет 1: selectedSupplierData
                          if (selectedSupplierData) {
                            if (method === 'bank-transfer' && ((selectedSupplierData.bank_accounts?.length || 0) > 0 || selectedSupplierData.payment_methods?.includes('bank-transfer'))) {
                              return true;
                            }
                            if (method === 'p2p' && ((selectedSupplierData.p2p_cards?.length || 0) > 0 || selectedSupplierData.payment_methods?.includes('p2p'))) {
                              return true;
                            }
                            if (method === 'crypto' && ((selectedSupplierData.crypto_wallets?.length || 0) > 0 || selectedSupplierData.payment_methods?.includes('crypto'))) {
                              return true;
                            }
                          }

                          // Приоритет 2: manualData[4]
                          if (manualData[4]) {
                            if (manualData[4].methods && manualData[4].methods.includes(method)) {
                              return true;
                            }
                            if (manualData[4].supplier_data) {
                              const supplier = manualData[4].supplier_data;
                              if (method === 'bank-transfer' && (supplier.bank_accounts?.length > 0 || supplier.payment_methods?.includes('bank-transfer'))) {
                                return true;
                              }
                              if (method === 'p2p' && (supplier.p2p_cards?.length > 0 || supplier.payment_methods?.includes('p2p'))) {
                                return true;
                              }
                              if (method === 'crypto' && (supplier.crypto_wallets?.length > 0 || supplier.payment_methods?.includes('crypto'))) {
                                return true;
                              }
                            }
                          }

                          return false;
                        };

                        const bankAvailable = checkMethodAvailability('bank-transfer');
                        const p2pAvailable = checkMethodAvailability('p2p');
                        const cryptoAvailable = checkMethodAvailability('crypto');


                        return (
                          <div className="mb-6">
                            <h4 className="text-base font-semibold text-gray-800 mb-4">Выберите тип реквизитов:</h4>
                            <div className="grid grid-cols-3 gap-4 w-full">
                            {/* Банковский перевод */}
                            <div
                              className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                bankAvailable
                                  ? 'border-orange-400 bg-orange-100 hover:border-orange-500 ring-2 ring-orange-200'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                // Обновляем шаги 4 и 5 (двусторонняя связь)
                                setManualData(prev => ({
                                  ...prev,
                                  4: {
                                    ...prev[4],
                                    selectedMethod: 'bank-transfer',
                                    method: 'bank-transfer',
                                    user_choice: true
                                  },
                                  5: {
                                    type: 'bank',
                                    bankName: '',
                                    accountNumber: '',
                                    swift: '',
                                    recipientName: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 4: 'manual', 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                  <Banknote className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Банковский перевод</div>
                                  <div className="text-xs text-gray-500">Банковские реквизиты</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать банковские реквизиты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                SWIFT, IBAN, счета
                              </div>
                            </div>

                            {/* P2P переводы */}
                            <div
                              className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                p2pAvailable
                                  ? 'border-blue-400 bg-blue-100 hover:border-blue-500 ring-2 ring-blue-200'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                // Обновляем шаги 4 и 5 (двусторонняя связь)
                                setManualData(prev => ({
                                  ...prev,
                                  4: {
                                    ...prev[4],
                                    selectedMethod: 'p2p',
                                    method: 'p2p',
                                    user_choice: true
                                  },
                                  5: {
                                    type: 'p2p',
                                    card_bank: '',
                                    card_number: '',
                                    card_holder: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 4: 'manual', 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">P2P переводы</div>
                                  <div className="text-xs text-gray-500">Карта поставщика</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать P2P карты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                Банковские карты
                              </div>
                            </div>

                            {/* Криптовалюта */}
                            <div
                              className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                cryptoAvailable
                                  ? 'border-green-400 bg-green-100 hover:border-green-500 ring-2 ring-green-200'
                                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                // Обновляем шаги 4 и 5 (двусторонняя связь)
                                setManualData(prev => ({
                                  ...prev,
                                  4: {
                                    ...prev[4],
                                    selectedMethod: 'crypto',
                                    method: 'crypto',
                                    user_choice: true
                                  },
                                  5: {
                                    type: 'crypto',
                                    crypto_network: '',
                                    crypto_address: '',
                                    user_choice: true
                                  }
                                }));
                                setStepConfigs(prev => ({ ...prev, 4: 'manual', 5: 'manual' }));
                                setLastHoveredStep(0);
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                  <Coins className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Криптовалюта</div>
                                  <div className="text-xs text-gray-500">Криптокошелек</div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-800">
                                Использовать криптовалюты
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                BTC, ETH, USDT и др.
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })()}

                      <h4 className="text-base font-semibold text-gray-800 mb-4">Доступные источники данных:</h4>
                      <div className="grid gap-4">
                        {constructorSteps.find(s => s.id === lastHoveredStep)?.sources.map((source) => {
                          const sourceInfo = dataSources[source as keyof typeof dataSources]
                          const SourceIcon = sourceInfo?.icon
                          return (
                            <div
                              key={source}
                              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
                              onClick={() => handleSourceSelect(source)}
                            >
                              <div className={`w-12 h-12 rounded-full ${sourceInfo?.color} flex items-center justify-center shadow-sm`}>
                                <SourceIcon className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-semibold text-gray-800 mb-1">{sourceInfo?.name}</div>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                  {source === "profile" && (lastHoveredStep === 1 ? "Использовать данные из профиля клиента" : "Использовать данные из профиля поставщика")}
                                  {source === "template" && "Выбрать из сохраненных шаблонов"}
                                  {source === "catalog" && "Из синей и оранжевой комнат каталога (включая эхо карточки)"}
                                  {source === "manual" && "Заполнить самостоятельно"}
                                  {source === "automatic" && "Автоматическая обработка"}
                                        </div>
      </div>

      {/* Диалог деталей проекта */}
      {projectDetailsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Детали проекта</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectDetailsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {projectDetails && (
              <div className="space-y-6">
                {/* Основная информация */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Основная информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">ID проекта</p>
                      <p className="font-medium">{projectDetails.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Статус</p>
                      <p className="font-medium">{projectDetails.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Текущий этап</p>
                      <p className="font-medium">{projectDetails.currentStage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Создан</p>
                      <p className="font-medium">
                        {new Date(projectDetails.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Обновлен</p>
                      <p className="font-medium">
                        {new Date(projectDetails.updated_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Данные шагов */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Данные шагов</h3>
                  <div className="space-y-4">
                    {Object.entries(projectDetails.manualData || {}).map(([stepId, data]: [string, any]) => (
                      <div key={stepId} className="border border-gray-200 rounded p-3">
                        <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                        <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Конфигурации шагов */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Конфигурации шагов</h3>
                  <div className="space-y-4">
                    {Object.entries(projectDetails.stepConfigs || {}).map(([stepId, config]: [string, any]) => (
                      <div key={stepId} className="border border-gray-200 rounded p-3">
                        <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                        <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(config, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Дополнительные данные проекта */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Дополнительные данные</h3>
                  <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(projectDetails, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : lastHoveredStep && !isStepEnabled(lastHoveredStep) ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Blocks className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">Сначала настройте основные шаги (I и II)</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Blocks className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Наведите на кубик для выбора источника данных</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Block 3: Сводка и запуск проекта */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-6">Сводка проекта</h2>
          
          {/* Прогресс бар с мини-кубиками */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Прогресс настройки</span>
              <span className="text-sm text-gray-500">{getProgressWithContext(createValidationContext())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressWithContext(createValidationContext())}%` }}
              />
            </div>
            
            {/* Мини-кубики прогресса */}
            <div className="flex gap-2 mt-4">
              {constructorSteps.map((step) => (
                <div
                  key={step.id}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
                    stepConfigs[step.id]
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.id}
                </div>
              ))}
            </div>
          </div>

                    {/* Сводка настроенных шагов */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Настроенные шаги:</h3>
            {configuredStepsSummary.length > 0 ? (
              <div className="space-y-2">
                {configuredStepsSummary.map((item) => (
                  <div 
                    key={item.stepId} 
                    className={`flex items-center gap-3 p-3 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 border-2 relative z-10 ${
                      item.source === 'echoData' 
                        ? 'bg-purple-50 hover:bg-purple-100 border-purple-400 hover:border-purple-500' 
                        : 'bg-gray-50 hover:bg-gray-100 border-blue-400 hover:border-blue-500'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                    onClick={() => handleStepCardClick(item)}
                  >
                    <div className={`w-8 h-8 rounded text-white flex items-center justify-center text-sm font-bold ${
                      item.source === 'echoData' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {item.stepId}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.stepName}</div>
                      <div className={`text-sm ${
                        item.source === 'echoData' ? 'text-purple-600' : 'text-gray-500'
                      }`}>
                        Источник: {item.sourceName}
                        {item.source === 'echoData' && ' ✨'}
                      </div>

                    </div>
                    <ChevronRight className={`h-4 w-4 ${
                      item.source === 'echoData' ? 'text-purple-400' : 'text-gray-400'
                    }`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Blocks className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Настройте хотя бы один шаг для продолжения</p>
              </div>
            )}
          </div>

          {/* Кнопка запуска */}
          <div className="flex justify-end">
            <Button 
              className="gap-2"
              disabled={configuredStepsSummary.length === 0}
            >
              Запустить атомарную сделку
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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

