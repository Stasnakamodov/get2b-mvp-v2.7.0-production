"use client"
import { db } from "@/lib/db/client"

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
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { uploadFileToStorage, sendTelegramMessage, fetchFromApi, fetchCatalogData } from '@/utils/ApiUtils'
import { findSupplierInAnyStep } from '@/utils/project-constructor/SupplierFinder'
import { isStepEnabled as isStepEnabledUtil } from '@/utils/project-constructor/StepValidation'
import { SummaryBlock } from '@/components/project-constructor/SummaryBlock'
import { StepCubes } from '@/components/project-constructor/StepCubes'
import { AutoFillService } from '@/lib/services/AutoFillService'
import { TemplateSelectionMode } from './components/configuration-modes/TemplateSelectionMode'
import { TemplateStepSelectionMode } from './components/configuration-modes/TemplateStepSelectionMode'
import { ManualFormEntryMode } from './components/configuration-modes/ManualFormEntryMode'
import { UploadOCRMode } from './components/configuration-modes/UploadOCRMode'
import { EmptyState } from './components/EmptyState'
import { Step1CompanyCubes } from './components/filled-state/Step1CompanyCubes'
import { Step3SpecificationSlider } from './components/filled-state/Step3SpecificationSlider'
import { Step4PaymentMethodCubes } from './components/filled-state/Step4PaymentMethodCubes'
import { Step5RequisitesDisplay } from './components/filled-state/Step5RequisitesDisplay'
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
  FileText,
  Store,
  Users,
  Plus,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  CreditCard,
  Banknote,
  Coins,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  Edit,
  Lock,
  Check,
  Loader,
  User,
  GitBranch,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useProjectTemplates } from "../create-project/hooks/useProjectTemplates"
import CompanyForm from '@/components/project-constructor/forms/CompanyForm'
import ContactsForm from '@/components/project-constructor/forms/ContactsForm'
import BankForm from '@/components/project-constructor/forms/BankForm'
import { WaitingApprovalLoader, WaitingManagerReceiptLoader, RejectionMessage } from '@/components/project-constructor/status/StatusLoaders'
import { StageRouter } from '@/components/project-constructor/StageRouter'
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
import { useCatalogCartImport } from "@/hooks/useCatalogCartImport"
import { cleanProjectRequestId } from "@/utils/IdUtils"
import { generateFileDate } from "@/utils/DateUtils"
import { cleanFileName } from "@/utils/FileUtils"
import {
  isStepFilledByUser,
  checkSummaryReadiness as checkSummaryReadinessUtil,
  getConfiguredStepsSummary as getConfiguredStepsSummaryUtil,
  type StepValidationContext
} from "@/components/project-constructor/utils/StepValidationUtils"
import { useToast } from "@/hooks/use-toast"
import CatalogModal from "../create-project/components/CatalogModal"
import { AutoFillNotification } from "@/components/project-constructor/notifications/AutoFillNotification"
import { useTemplateSystem } from "@/hooks/project-constructor/useTemplateSystem"
import { useOcrUpload } from "@/hooks/project-constructor/useOcrUpload"
import { useStepData } from "@/hooks/project-constructor/useStepData"
import { useManagerPolling } from "@/hooks/project-constructor/useManagerPolling"
import { useReceiptPolling } from "@/hooks/project-constructor/useReceiptPolling"
import { useScenarioMode } from "@/hooks/project-constructor/useScenarioMode"
import { POLLING_INTERVALS, TIMEOUTS } from "@/components/project-constructor/config/PollingConstants"
import { ModalProvider, useModals } from "./components/modals/ModalContext"
import ModalManager from "./components/modals/ModalManager"
import { ScenarioTreePanel } from "@/components/project-constructor/scenario/ScenarioTreePanel"

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
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [catalogSuggestions, setCatalogSuggestions] = useState<Record<number, any>>({})
  // ===== СТАРЫЙ КОД (закомментирован, т.к. переехал в useTemplateSystem хук) =====
  // const [templateStepSelection, setTemplateStepSelection] = useState<{templateId: string, availableSteps: number[]} | null>(null)
  // const [templateSelection, setTemplateSelection] = useState<boolean>(false)
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

  // ===== СТАРЫЕ СОСТОЯНИЯ OCR (закомментированы, т.к. переехали в useOcrUpload хук) =====
  // const [ocrAnalyzing, setOcrAnalyzing] = useState<Record<number, boolean>>({})
  // const [ocrError, setOcrError] = useState<Record<number, string>>({})
  // const [ocrDebugData, setOcrDebugData] = useState<OcrDebugData>({})
  const [currentProductIndex, setCurrentProductIndex] = useState<number>(0)
  const productsPerView = PRODUCT_DISPLAY_CONFIG.PRODUCTS_PER_VIEW

  // showPhantomOptions удалена (мёртвый state - не используется)
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

  // Хук для импорта товаров из каталога
  const {
    step2Data: catalogStep2Data,
    hasImportedFromCatalog,
    isLoaded: catalogCartLoaded,
    clearCatalogCart,
    totalItems: catalogTotalItems,
    totalAmount: catalogTotalAmount
  } = useCatalogCartImport()

  // Автоматический импорт товаров из каталога при загрузке
  useEffect(() => {
    if (catalogCartLoaded && hasImportedFromCatalog && catalogStep2Data) {
      console.log('📦 [Constructor] Импорт товаров из каталога:', catalogStep2Data.items.length)

      // Заполняем шаг 2 данными из каталога
      setManualData(prev => ({
        ...prev,
        2: catalogStep2Data
      }))

      // Помечаем шаг 2 как заполненный из каталога
      setStepConfigs(prev => ({
        ...prev,
        2: 'catalog'
      }))

      // Показываем уведомление
      toast({
        title: '🛒 Товары загружены из каталога',
        description: `Добавлено ${catalogTotalItems} товаров на сумму ${catalogTotalAmount.toLocaleString('ru-RU')} ₽`,
        duration: 5000
      })

      // Загружаем данные поставщика для автозаполнения шагов 4 и 5
      const firstItem = catalogStep2Data.items[0]
      const supplierName = firstItem?.supplier_name || catalogStep2Data.supplier
      const supplierId = firstItem?.supplier_id
      if (supplierName) {
        console.log('🔍 [Cart→Constructor] Загружаем данные поставщика для шагов 4/5:', supplierName)

        // Вспомогательная: проверяет наличие реальных payment-данных у поставщика
        const hasPaymentData = (s: any) =>
          (Array.isArray(s.payment_methods) && s.payment_methods.length > 0) ||
          (Array.isArray(s.bank_accounts) && s.bank_accounts.length > 0) ||
          (Array.isArray(s.p2p_cards) && s.p2p_cards.length > 0) ||
          (Array.isArray(s.crypto_wallets) && s.crypto_wallets.length > 0)

        // Вспомогательная: собирает payment-массивы из плоских полей supplier_profiles
        const buildPaymentFromProfile = (profile: any) => {
          const methods: string[] = []
          const bankAccounts: any[] = []
          const p2pCards: any[] = []
          const cryptoWallets: any[] = []

          if (profile.bank_name || profile.account_number || profile.swift || profile.iban) {
            methods.push('bank-transfer')
            bankAccounts.push({
              bank_name: profile.bank_name || '',
              account_number: profile.account_number || '',
              swift_code: profile.swift || '',
              iban: profile.iban || '',
              currency: profile.transfer_currency || 'USD',
              recipient_name: profile.recipient_name || profile.company_name || profile.name
            })
          }
          if (profile.p2p_card_number || profile.p2p_bank) {
            methods.push('p2p')
            p2pCards.push({
              bank: profile.p2p_bank || '',
              number: profile.p2p_card_number || '',
              holder: profile.p2p_holder_name || '',
              expiry: profile.p2p_expiry_date || ''
            })
          }
          if (profile.crypto_address || profile.crypto_name) {
            methods.push('crypto')
            cryptoWallets.push({
              currency: profile.crypto_name || 'USDT',
              address: profile.crypto_address || '',
              network: profile.crypto_network || 'TRC20'
            })
          }

          // Дополняем из payment_methods jsonb если есть
          if (Array.isArray(profile.payment_methods)) {
            for (const m of profile.payment_methods) {
              const normalized = m === 'bank_transfer' ? 'bank-transfer' : m
              if (!methods.includes(normalized) && normalized !== 'cash') {
                methods.push(normalized)
              }
            }
          }

          return {
            payment_methods: methods.length > 0 ? methods : null,
            bank_accounts: bankAccounts.length > 0 ? bankAccounts : [],
            p2p_cards: p2pCards.length > 0 ? p2pCards : [],
            crypto_wallets: cryptoWallets.length > 0 ? cryptoWallets : []
          }
        }

        // Вспомогательная: устанавливает suggestions для шагов 4/5
        const applySuggestions = (supplier: any) => {
          const normalizedMethods = (supplier.payment_methods || ['bank_transfer'])
            .map((method: string) => method === 'bank_transfer' ? 'bank-transfer' : method)
            .filter((method: string) => method !== 'cash')
            .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
          const availableMethods = normalizedMethods.length > 0 ? normalizedMethods : ['bank-transfer']

          const step4Data = {
            type: 'multiple',
            methods: availableMethods,
            payment_method: availableMethods[0] || 'bank_transfer',
            auto_filled: true,
            supplier_name: supplier.name,
            supplier_data: supplier,
            catalog_source: supplier._source || 'verified_supplier'
          }

          const primaryType = supplier.payment_methods?.includes('bank-transfer') || supplier.bank_accounts?.length > 0 ? 'bank' :
                              supplier.payment_methods?.includes('p2p') || supplier.p2p_cards?.length > 0 ? 'p2p' :
                              supplier.payment_methods?.includes('crypto') || supplier.crypto_wallets?.length > 0 ? 'crypto' : 'bank'

          const step5Data = {
            type: primaryType,
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
            catalog_source: supplier._source || 'verified_supplier'
          }

          const currentState = { stepConfigs, manualData }
          const newSuggestions: Record<number, any> = {}

          if (AutoFillService.canAutoFill(4, 'catalog', currentState)) {
            newSuggestions[4] = step4Data
            console.log('💡 [Cart→Constructor] Предложение для Step 4:', availableMethods)
          }

          const stateWithStep4 = {
            stepConfigs: { ...stepConfigs, 4: 'catalog' },
            manualData: { ...manualData, 4: step4Data }
          }
          if (AutoFillService.canAutoFill(5, 'catalog', stateWithStep4)) {
            newSuggestions[5] = step5Data
            console.log('💡 [Cart→Constructor] Предложение для Step 5:', primaryType)
          }

          if (Object.keys(newSuggestions).length > 0) {
            setCatalogSuggestions(newSuggestions)
            console.log('✅ [Cart→Constructor] Предложения для шагов 4/5 установлены')
          }
        }

        // Шаг 1: Ищем в catalog_verified_suppliers
        fetchCatalogData('suppliers', { verified: 'true', search: supplierName })
          .then(async (data) => {
            const supplier = data.suppliers?.find((s: any) =>
              s.name.toLowerCase().includes(supplierName.toLowerCase())
            )

            if (supplier && hasPaymentData(supplier)) {
              console.log('✅ [Cart→Constructor] Найден поставщик с payment-данными:', supplier.name)
              applySuggestions(supplier)
              return
            }

            // Шаг 2: Fallback — ищем в supplier_profiles
            console.log('🔄 [Cart→Constructor] Нет payment-данных в каталоге, ищем в supplier_profiles...')
            try {
              const profilesRes = await fetch('/api/profile/supplier-profiles')
              if (profilesRes.ok) {
                const profilesJson = await profilesRes.json()
                const profile = profilesJson.profiles?.find((p: any) =>
                  p.name?.toLowerCase().includes(supplierName.toLowerCase()) ||
                  p.company_name?.toLowerCase().includes(supplierName.toLowerCase())
                )

                if (profile) {
                  const paymentData = buildPaymentFromProfile(profile)
                  if (paymentData.payment_methods) {
                    console.log('✅ [Cart→Constructor] Найден профиль поставщика с payment-данными:', profile.name)
                    // Мержим данные каталога с payment-данными из профиля
                    const enrichedSupplier = {
                      ...(supplier || {}),
                      name: supplier?.name || profile.name,
                      company_name: supplier?.company_name || profile.company_name,
                      ...paymentData,
                      _source: 'supplier_profile'
                    }
                    applySuggestions(enrichedSupplier)
                    return
                  }
                }
              }
            } catch (err) {
              console.warn('⚠️ [Cart→Constructor] Ошибка загрузки supplier_profiles:', err)
            }

            // Шаг 3: Fallback — supplier-autofill API (phantom data из прошлых проектов)
            if (supplierId) {
              console.log('🔄 [Cart→Constructor] Пробуем supplier-autofill API для:', supplierId)
              try {
                const autofillRes = await fetch(`/api/catalog/supplier-autofill/${supplierId}?include_phantom=true`)
                if (autofillRes.ok) {
                  const autofillJson = await autofillRes.json()
                  if (autofillJson.success && autofillJson.autofill_data) {
                    const af = autofillJson.autofill_data
                    const methods = af.step4_data?.payment_methods_available || ['bank-transfer']
                    // Собираем supplier-like объект из autofill response
                    const autofillSupplier = {
                      name: af.supplier_info?.name || supplierName,
                      company_name: af.supplier_info?.company_name || '',
                      payment_methods: methods,
                      bank_accounts: af.step5_data?.requisites?.bank_accounts || [],
                      p2p_cards: af.step5_data?.requisites?.p2p_cards || [],
                      crypto_wallets: af.step5_data?.requisites?.crypto_wallets || [],
                      _source: 'autofill_phantom'
                    }
                    if (hasPaymentData(autofillSupplier) || methods.length > 0) {
                      console.log('✅ [Cart→Constructor] Данные из autofill API:', methods)
                      applySuggestions(autofillSupplier)
                      return
                    }
                  }
                }
              } catch (err) {
                console.warn('⚠️ [Cart→Constructor] Ошибка supplier-autofill:', err)
              }
            }

            console.log('ℹ️ [Cart→Constructor] Payment-данные поставщика не найдены, шаги 4/5 — ручное заполнение')
          })
          .catch(error => {
            console.error('❌ [Cart→Constructor] Ошибка загрузки данных поставщика:', error)
          })
      }

      // Очищаем корзину каталога
      clearCatalogCart()
    }
  }, [catalogCartLoaded, hasImportedFromCatalog, catalogStep2Data, catalogTotalItems, catalogTotalAmount, clearCatalogCart, toast])

  // Состояние для выбора профиля клиента
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)

  // Состояние для выбора профиля поставщика
  const [selectedSupplierProfileId, setSelectedSupplierProfileId] = useState<string | null>(null)

  // Состояние для обработки ошибок загрузки шаблонов
  const [templateError, setTemplateError] = useState<string | null>(null)
  // templateLoading удалена (мёртвый state - не используется)
  
  // Состояние для отслеживания текущего этапа
  const [currentStage, setCurrentStage] = useState<number>(1)

  // Временно добавлено для совместимости со старым кодом (будет удалено)
  const [catalogSourceStep, setCatalogSourceStep] = useState<number | null>(null)

  // Состояние для модального окна перехода на следующий этап
  const [dontShowStageTransition, setDontShowStageTransition] = useState<boolean>(false)
  const [stageTransitionShown, setStageTransitionShown] = useState<boolean>(false)
  
  // sendingToManager и managerNotification перенесены в Stage2Container

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

  // Ref для таймеров анимации (cleanup memory leak fix)
  const dealAnimationTimersRef = useRef<NodeJS.Timeout[]>([])

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
    setEditingType,
    setLastHoveredStep
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

  // Объявление sendManagerReceiptRequest для useProjectPolling (мемоизировано для предотвращения перезапуска polling)
  const sendManagerReceiptRequest = useCallback(async () => {
    if (!projectRequestId || isRequestSent) {
      console.log('🔄 Запрос уже отправлен или нет projectRequestId')
      return
    }

    try {
      setIsRequestSent(true)
      console.log('📤 Отправляем запрос менеджеру на загрузку чека')

      // Получаем данные проекта
      const { data: project, error } = await db
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
        const { data: requisiteData } = await db
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
      await db
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
  }, [projectRequestId, isRequestSent])

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
  // ✅ ОБНОВЛЕНО: Добавлена проверка приоритетов через AutoFillService
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

      // ✅ НОВОЕ: Проверяем возможность автозаполнения через AutoFillService
      if (hasStep5AutofillData && stepConfigs[5] !== 'catalog') {
        const currentState = { stepConfigs, manualData };
        const canFill = AutoFillService.canAutoFill(5, 'catalog', currentState);

        if (canFill) {
          setStepConfigs(prev => ({
            ...prev,
            5: 'catalog'
          }));
          console.log('✅ [Step 5 Auto Config] Установлен stepConfigs[5] = "catalog" - есть данные автозаполнения');
        } else {
          console.log('⏸️ [Step 5 Auto Config] Пропущена установка stepConfigs[5] = "catalog" - приоритет источника выше');
        }
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

  // findSupplierInAnyStep извлечена в utils/project-constructor/SupplierFinder.ts

  // Удалён useEffect для showPhantomOptions (мёртвый код)

  // Загружаем шаблоны при монтировании компонента (хук useProjectTemplates объявлен выше)
  React.useEffect(() => {
    // Проверяем аутентификацию перед загрузкой
    const checkAuthAndLoad = async () => {
      try {
        console.log('🔍 Проверка авторизации...')
      const { data: { user } } = await db.auth.getUser()
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
  useManagerPolling(projectRequestId, currentStage, managerApprovalStatus, setManagerApprovalStatus)

  // Polling статуса одобрения чека
  useReceiptPolling(
    projectRequestId,
    currentStage,
    managerApprovalStatus,
    receiptApprovalStatus,
    setManagerApprovalStatus,
    setReceiptApprovalStatus,
    setCurrentStage
  )

  // Polling чека от менеджера - теперь обрабатывается хуком useProjectPolling

  // Сценарный режим (Scenario Mode)
  const scenarioMode = useScenarioMode(projectDetails?.id || null)

  // Загрузка дерева сценариев при наличии проекта
  React.useEffect(() => {
    if (projectDetails?.id && scenarioMode.enabled) {
      scenarioMode.fetchScenarioTree()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDetails?.id])

  // Обработчик переключения сценария — загружает resolved данные
  const handleSwitchScenario = useCallback((scenarioId: string) => {
    scenarioMode.switchScenario(scenarioId, (newStepConfigs, newManualData) => {
      setStepConfigs(newStepConfigs)
      setManualData(newManualData)
    })
  }, [scenarioMode.switchScenario])

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
      const { data: projects, error } = await db
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
  // autoFillStepsFromSupplier удалена (для шаблонов/профилей не нужна)
  // Автозаполнение шага 5 для ОКР/каталога работает через useEffect (строки 424-466)

  // ===== НОВЫЙ ХУК: Template System =====
  // Извлекаем логику работы с шаблонами в отдельный хук
  const templateSystem = useTemplateSystem({
    templates,
    setStepConfigs,
    setManualData,
    setSelectedSource
  })

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

  // ===== СТАРЫЙ КОД (закомментирован, т.к. переехал в useTemplateSystem хук) =====
  /*
  // Функция для получения данных шаблона (симуляция)
  const getTemplateData = (templateId: string) => { ... }
  const applyTemplateStep = (stepId: number, templateData: any) => { ... }
  const handleTemplateSelect = (templateId: string) => { ... }
  const handleTemplateStepSelect = (stepId: number) => { ... }
  const handleFillAllTemplateSteps = () => { ... }
  */

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

    // Для шагов 4 и 5: обновляем lastHoveredStep для показа области настройки
    if (stepId === 4 || stepId === 5) {
      console.log(`🎯 Обрабатываем клик по шагу ${stepId}`)

      // ВАЖНО: Обновляем lastHoveredStep чтобы показать область настройки
      handleStepHover(stepId)

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
        templateSystem.setTemplateSelection(true)
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

  // Функция для перехода к этапу 2 (упрощена после извлечения Stage2Container)
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

    // Отправка данных менеджеру теперь обрабатывается в Stage2Container
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

    // Очищаем предыдущие таймеры перед запуском новых
    dealAnimationTimersRef.current.forEach(clearTimeout)
    dealAnimationTimersRef.current = []

    setDealAnimationStep(0)
    setDealAnimationStatus('Начинаем анимацию...')
    setDealAnimationComplete(false)

    // Шаг 1: Клиент и поставщик начинают движение
    const timer1 = setTimeout(() => {
      setDealAnimationStep(1)
      setDealAnimationStatus('Клиент и поставщик идут к центру...')
    }, 1000)

    // Шаг 2: Менеджер проверяет перевод
    const timer2 = setTimeout(() => {
      setDealAnimationStep(2)
      setDealAnimationStatus('Менеджер проверяет перевод...')
    }, 3000)

    // Шаг 3: Все встречаются в центре
    const timer3 = setTimeout(() => {
      setDealAnimationStep(3)
      setDealAnimationStatus('Сделка завершена!')
      setDealAnimationComplete(true)
    }, 5000)

    // Сохраняем таймеры для cleanup
    dealAnimationTimersRef.current = [timer1, timer2, timer3]
  }

  // Cleanup таймеров анимации при unmount
  useEffect(() => {
    return () => {
      dealAnimationTimersRef.current.forEach(clearTimeout)
    }
  }, [])



  // Функция для перехода к третьему этапу
  const proceedToStage3 = () => {
    console.log('🎬 Переход к этапу 3: Анимация сделки')
    closeModal('stage2Summary')
    setCurrentStage(3)
    startDealAnimation()
  }

  // getSourceDisplayName извлечена в отдельный утиль

  // Проверка доступности шага
  // Step enablement logic extracted to StepValidation.ts
  const isStepEnabled = (stepId: number) => {
    return isStepEnabledUtil(stepId, currentStage)
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

  // handleManualDataSave удалена (мёртвый код - не вызывается)

  // ===== СТАРЫЙ OCR КОД УДАЛЕН (строки 1499-1908) =====
  // handleFileUpload, analyzeCompanyCard, analyzeSpecification, extractBankRequisitesFromInvoice
  // Весь функционал OCR переехал в hooks/project-constructor/useOcrUpload.ts

  // 🔥 НОВАЯ ФУНКЦИЯ: Предложение способа оплаты и реквизитов
  const suggestPaymentMethodAndRequisites = (bankRequisites: any, ocrSupplierName: string) => {
    console.log("💡 OCR: Предлагаем способ оплаты и реквизиты:", bankRequisites);
    console.log("🏢 OCR: Поставщик из OCR (переданный):", ocrSupplierName);

    // Используем переданное имя поставщика
    let supplierName = ocrSupplierName || '';

    // Если OCR не нашел поставщика, пробуем из банковских реквизитов
    if (!supplierName) {
      supplierName = bankRequisites.recipientName || '';
      console.log("🔍 OCR: Поставщик из банковских реквизитов (fallback):", supplierName);
    }

    // Fallback to step 2 data if still empty (though it should be passed now)
    if (!supplierName && manualData[2]?.supplier) {
      supplierName = manualData[2].supplier;
      console.log("🔍 OCR: Поставщик из шага 2 (fallback):", supplierName);
    }

    console.log("🏢 OCR: Финальный поставщик для шага 4:", supplierName);

    // Подготавливаем данные для автозаполнения
    const paymentMethodData = {
      method: 'bank-transfer',
      supplier: supplierName,
      suggested: true,
      source: 'ocr_invoice'
    };

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

    console.log("🔍 OCR: ДЕТАЛЬНАЯ ОТЛАДКА РЕКВИЗИТОВ:");
    console.log("   - bankRequisites.bankName:", bankRequisites.bankName);
    console.log("   - bankRequisites.accountNumber:", bankRequisites.accountNumber);
    console.log("   - bankRequisites.swift:", bankRequisites.swift);
    console.log("   - bankRequisites.recipientName:", bankRequisites.recipientName);

    // ✅ НОВОЕ: Проверка приоритетов через AutoFillService
    const currentState = { stepConfigs, manualData };

    const canFillStep4 = AutoFillService.canAutoFill(4, 'ocr_suggestion', currentState);
    const canFillStep5 = AutoFillService.canAutoFill(5, 'ocr_suggestion', currentState);

    if (!canFillStep4 && !canFillStep5) {
      console.log("⏸️ OCR: Пропускаем автозаполнение - уже заполнено источником с выше приоритетом");
      return;
    }

    // Заполняем только разрешенные шаги
    if (canFillStep4) {
      AutoFillService.safeAutoFill(
        4,
        paymentMethodData,
        'ocr_suggestion',
        currentState,
        (newManualData, newStepConfigs) => {
          setManualData(prev => ({ ...prev, ...newManualData }));  // ← Functional update!
          setStepConfigs(prev => ({ ...prev, ...newStepConfigs }));
        }
      );
    }

    if (canFillStep5) {
      // Обновляем currentState если Step 4 был заполнен
      const updatedState = canFillStep4
        ? { stepConfigs: { ...stepConfigs, 4: 'ocr_suggestion' }, manualData: { ...manualData, 4: paymentMethodData } }
        : currentState;

      AutoFillService.safeAutoFill(
        5,
        requisitesData,
        'ocr_suggestion',
        updatedState,
        (newManualData, newStepConfigs) => {
          setManualData(prev => ({ ...prev, ...newManualData }));  // ← Functional update!
          setStepConfigs(prev => ({ ...prev, ...newStepConfigs }));
        }
      );
    }

    console.log("✅ OCR: Предложения обработаны (Step 4:", canFillStep4, ", Step 5:", canFillStep5, ")");
  };

  // ===== НОВЫЙ ХУК: OCR Upload =====
  // Извлекаем логику загрузки файлов и OCR анализа в отдельный хук
  // Подключаем ПОСЛЕ всех функций, которые используются внутри хука
  const ocrUpload = useOcrUpload({
    db,
    setManualData,
    setStepConfigs,
    setSelectedSource,
    suggestPaymentMethodAndRequisites,
    uploadFileToStorage,
    generateFileDate,
    cleanFileName,
    bucketMap
  })

  // ===== НОВЫЙ ХУК: Step Data Management =====
  // Извлекаем логику сохранения/удаления данных шагов
  // Этот хук НЕ содержит state - работает с внешним manualData
  // ⚠️ НЕ вызывает autoFill* - это только для ручного ввода!
  const stepData = useStepData({
    manualData,
    setManualData,
    setSelectedSource,
    setEditingType,
    setStepConfigs,
    setLastHoveredStep,
    checkSummaryReadiness,
    currentStage,
    setSelectedProfileId,
    setSelectedSupplierProfileId
  })

  // Обработчик отмены выбора источника

  // Удалено: функция handleViewStepData больше не нужна - используем инлайн-формы

  // handleRemoveSource удалена (мёртвый код - не вызывается)

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
    setEditingType(type)
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
      const catalogItems = products.map(product => {
        const quantity = product.quantity || 1
        const price = parseFloat(product.price) || 0
        return {
          item_name: product.name || product.item_name || 'Товар из каталога',
          name: product.name || product.item_name || 'Товар из каталога',
          quantity,
          unit: product.unit || 'шт',
          price,
          total: quantity * price,
          currency: product.currency || 'USD',
          supplier_id: product.supplier_id,
          supplier_name: product.supplier_name,
          image_url: product.image_url || product.images?.[0] || '',
          sku: product.sku || product.item_code || '',
          item_code: product.sku || product.item_code || ''
        }
      })

      // Создаём данные для Step 2
      const step2Data = {
        supplier: catalogItems[0]?.supplier_name || '',
        currency: catalogItems[0]?.currency || 'USD',
        items: [...(manualData[2]?.items || []), ...catalogItems]
      }

      console.log(`✅ [ATOMIC] Добавлено ${catalogItems.length} товаров в спецификацию`)
      console.log(`📦 [ATOMIC] step2Data:`, step2Data)

      // Вызываем автоматическое заполнение для Step II данных (обратная связь)
      // 🎯 АВТОЗАПОЛНЕНИЕ ДАННЫХ ПОСТАВЩИКА ДЛЯ ШАГОВ IV И V
      const firstProduct = products[0]
      if (firstProduct?.supplier_id) {
        console.log('🔍 [ATOMIC] Загружаем данные поставщика для автозаполнения:', firstProduct.supplier_name)

        // ПРИОРИТЕТ КАТАЛОГА: Когда товары из каталога, ВСЕГДА используем свежие данные каталога
        console.log('🎯 [ATOMIC] Товары добавлены из каталога - приоритет данных каталога над эхо данными')

        // Сначала загружаем АКТУАЛЬНЫЕ данные каталога
        fetchCatalogData('suppliers', { verified: 'true', search: firstProduct.supplier_name })
          .then(data => {
            console.log('🔍 [ATOMIC] Ответ API suppliers:', data)
            const supplier = data.suppliers?.find((s: any) =>
              s.name.toLowerCase().includes(firstProduct.supplier_name.toLowerCase())
            )

            if (supplier) {
              console.log('✅ [ATOMIC] Найден поставщик в каталоге:', supplier)

              // Фильтруем методы оплаты, исключая cash (наличные) и убираем дубликаты
              const normalizedMethods = (supplier.payment_methods || ['bank_transfer'])
                .map((method: string) => method === 'bank_transfer' ? 'bank-transfer' : method)
                .filter((method: string) => method !== 'cash')
                .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
              const availableMethods = normalizedMethods.length > 0 ? normalizedMethods : ['bank-transfer']

              console.log('🎯 [ATOMIC] Заполняю Steps 2, 4, 5 с данными поставщика:', supplier.name)
              console.log('💳 [ATOMIC] Доступные методы оплаты:', availableMethods)

              const step4Data = {
                type: 'multiple',
                methods: availableMethods,
                payment_method: availableMethods[0] || 'bank_transfer',
                auto_filled: true,
                supplier_name: supplier.name,
                supplier_data: supplier,
                catalog_source: 'verified_supplier'
              }

              // Определяем тип по первому доступному методу оплаты
              const primaryType = supplier.payment_methods?.includes('bank-transfer') || supplier.bank_accounts?.length > 0 ? 'bank' :
                                  supplier.payment_methods?.includes('p2p') || supplier.p2p_cards?.length > 0 ? 'p2p' :
                                  supplier.payment_methods?.includes('crypto') || supplier.crypto_wallets?.length > 0 ? 'crypto' : 'bank';

              const step5Data = {
                type: primaryType,
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
                catalog_source: 'verified_supplier'
              }

              // ✅ Заполняем только Step 2
              setManualData(prev => ({ ...prev, 2: step2Data }))
              setStepConfigs(prev => ({ ...prev, 2: 'catalog' }))

              console.log('✅ [CATALOG] Step 2 заполнен товарами из каталога')

              // 💡 Сохраняем предложения для Steps 4/5 (не заполняем автоматически!)
              const currentState = { stepConfigs, manualData }
              const suggestions: Record<number, any> = {}

              if (AutoFillService.canAutoFill(4, 'catalog', currentState)) {
                suggestions[4] = step4Data
                console.log('💡 [CATALOG] Доступно предложение для Step 4')
              }

              const stateWithStep4 = {
                stepConfigs: { ...stepConfigs, 4: 'catalog' },
                manualData: { ...manualData, 4: step4Data }
              }
              if (AutoFillService.canAutoFill(5, 'catalog', stateWithStep4)) {
                suggestions[5] = step5Data
                console.log('💡 [CATALOG] Доступно предложение для Step 5')
              }

              // ✅ Сохраняем suggestions в state для показа подсвеченных кубиков
              setCatalogSuggestions(suggestions)
              console.log('💡 [CATALOG] Доступные предложения сохранены:', Object.keys(suggestions))
            } else {
              console.log('❌ [CATALOG] Поставщик не найден в каталоге')

              // Заполняем только Step 2
              setManualData(prev => ({ ...prev, 2: step2Data }))
              setStepConfigs(prev => ({ ...prev, 2: 'catalog' }))

              console.log('✅ [CATALOG] Step 2 заполнен (fallback - поставщик не найден)')
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


  // handleBlueRoomSource и handleOrangeRoomSource удалены (мёртвый код - не вызываются)


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
      
      const { data: projects, error } = await db
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

  // Функция отправки данных менеджеру (перенесена в Stage2Container)
  // Оставлена заглушка для обратной совместимости
  const handleSendToManager = async () => {
    console.log('⚠️ handleSendToManager вызвана из монолита - используйте Stage2Container')
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
        <div className="flex gap-4 justify-end items-center">
          {/* Кнопка режима сценариев */}
          <Button
            variant="outline"
            className="gap-2 relative"
            onClick={scenarioMode.toggleSidePanel}
          >
            <GitBranch className="w-4 h-4" />
            Сценарии
            {scenarioMode.treeData.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                {scenarioMode.treeData.length}
              </Badge>
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
        catalogSuggestions={catalogSuggestions}
        receiptApprovalStatus={receiptApprovalStatus}
        hasManagerReceipt={hasManagerReceipt}
        clientReceiptUrl={clientReceiptUrl}
        isStepEnabled={isStepEnabled}
        getCurrentStage={getCurrentStage}
        handleStepHover={handleStepHover}
        handleStepClick={handleStepClick}
        stepIcons={stepIcons}
        dataSources={dataSources}
        scenarioHighlightedSteps={scenarioMode.highlightedSteps}
        scenarioMode={scenarioMode.enabled}
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
            db={db}
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
            {/* ============================================================ */}
            {/* BLOCK 2: Configuration Area (Область настройки)             */}
            {/* Lines 2050-3400 | 5 render modes based on step state       */}
            {/* ============================================================ */}
            <div className="min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
            <AnimatePresence>
              {lastHoveredStep && isStepEnabled(lastHoveredStep) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ height: '100%' }}
                >
                  {/* Заголовок выбранного шага + Кнопки действий */}
                  <div className="relative mb-6">
                    {/* Заголовок по центру */}
                    <div className="text-center">
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

                    {/* Кнопки действий справа (absolute) */}
                    {(stepConfigs[lastHoveredStep] || catalogSuggestions[lastHoveredStep]) && (
                      <div className="absolute top-0 right-0 flex flex-col gap-2">
                        {stepConfigs[lastHoveredStep] && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => stepData.removeStepData(lastHoveredStep)}
                              className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                            >
                              <X className="h-4 w-4 mr-2" />
                              <span className="font-medium">Удалить данные</span>
                            </Button>

                            {/* Скрываем кнопку "Посмотреть все данные" для:
                                - Step 4: всего 2 поля
                                - Step 5 при ручном заполнении: кнопка нужна только для просмотра рекомендаций из каталога
                            */}
                            {lastHoveredStep !== 4 && !(lastHoveredStep === 5 && stepConfigs[5] === 'manual') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditData('company')}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                <span className="font-medium">Посмотреть все данные</span>
                              </Button>
                            )}
                          </>
                        )}

                        {lastHoveredStep === 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddProductsFromCatalog()}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="font-medium">Добавить товары</span>
                          </Button>
                        )}

                        {(stepConfigs[lastHoveredStep] === 'ocr_suggestion' ||
                          (stepConfigs[lastHoveredStep] === 'catalog' && lastHoveredStep !== 2) ||
                          catalogSuggestions[lastHoveredStep]) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Удаляем рекомендацию из catalogSuggestions
                              if (catalogSuggestions[lastHoveredStep]) {
                                setCatalogSuggestions(prev => {
                                  const newSugg = {...prev}
                                  delete newSugg[lastHoveredStep]
                                  return newSugg
                                })
                              }
                              // И очищаем данные шага
                              stepData.removeStepData(lastHoveredStep)
                            }}
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                          >
                            <X className="h-4 w-4 mr-2" />
                            <span className="font-medium">Отменить рекомендацию</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ========== MODE 1: Template Selection ========== */}
                  {templateSystem.templateSelection ? (
                    <TemplateSelectionMode
                      templates={getUserTemplates()}
                      templatesLoading={templatesLoading}
                      templatesError={templatesError}
                      onTemplateSelect={(templateId) => templateSystem.handleTemplateSelect(templateId)}
                      onRefresh={() => fetchTemplates()}
                      onClose={() => templateSystem.setTemplateSelection(false)}
                      onCheckTable={async () => {
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
                      onCreateTable={async () => {
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
                      onAnalyzeDB={async () => {
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
                    />
                  ) : templateSystem.templateStepSelection ? (
                    <TemplateStepSelectionMode
                      availableSteps={templateSystem.templateStepSelection.availableSteps}
                      constructorSteps={constructorSteps}
                      onStepSelect={(stepId) => templateSystem.handleTemplateStepSelect(stepId)}
                      onFillAllSteps={templateSystem.handleFillAllTemplateSteps}
                      onClose={() => templateSystem.setTemplateStepSelection(null)}
                    />

                  ) : (() => {
                    // Step 4: исключён (используются кубики)
                    // Step 5: СПЕЦИАЛЬНАЯ ЛОГИКА
                    if (lastHoveredStep === 5) {
                      // Проверяем заполненность реквизитов Step 5
                      const step5Data = manualData[5];
                      const hasType = step5Data?.type;

                      // Если тип НЕ выбран → показываем кубики выбора (не форму)
                      if (!hasType) return false;

                      // Если тип выбран, проверяем заполненность данных
                      let isFullyFilled = false;
                      if (hasType === 'crypto') {
                        isFullyFilled = !!(step5Data.crypto_address && step5Data.crypto_name && step5Data.supplier);
                      } else if (hasType === 'p2p') {
                        isFullyFilled = !!(step5Data.card_number && step5Data.card_bank && step5Data.supplier);
                      } else if (hasType === 'bank') {
                        isFullyFilled = !!(step5Data.accountNumber && step5Data.bankName && step5Data.supplier);
                      }

                      // Если данные ПОЛНОСТЬЮ заполнены → НЕ показываем форму (покажется кубик)
                      // Если данные НЕ заполнены → показываем форму для заполнения
                      return !isFullyFilled;
                    }

                    // Для других шагов стандартная логика
                    const shouldShowManual = (selectedSource === "manual" || (lastHoveredStep && stepConfigs[lastHoveredStep] === 'manual'))
                      && lastHoveredStep !== 4;

                    console.log('🔍 [DEBUG ManualFormEntryMode]');
                    console.log('  - lastHoveredStep:', lastHoveredStep);
                    console.log('  - selectedSource:', selectedSource);
                    console.log('  - stepConfigs[lastHoveredStep]:', lastHoveredStep ? stepConfigs[lastHoveredStep] : 'N/A');
                    console.log('  - shouldShowManual:', shouldShowManual);
                    console.log('  - manualData[5]:', manualData[5]);
                    return shouldShowManual;
                  })() ? (
                    <ManualFormEntryMode
                      lastHoveredStep={lastHoveredStep}
                      editingType={editingType}
                      manualData={manualData}
                      onSave={(stepId, data) => stepData.saveStepData(stepId as 1 | 2 | 3 | 4 | 5 | 6 | 7, data)}
                      onCancel={handleCancelSource}
                      onFileUpload={ocrUpload.handleFileUpload}
                      getStepData={(stepId) => manualData[stepId]}
                    />
                  ) : selectedSource === "upload" ? (
                    <UploadOCRMode
                      lastHoveredStep={lastHoveredStep}
                      ocrAnalyzing={ocrUpload.ocrAnalyzing}
                      uploadedFiles={ocrUpload.uploadedFiles}
                      ocrError={ocrUpload.ocrError}
                      ocrDebugData={ocrUpload.ocrDebugData}
                      hasManagerReceipt={hasManagerReceipt}
                      clientReceiptUrl={clientReceiptUrl}
                      clientReceiptUploadError={clientReceiptUploadError}
                      isUploadingClientReceipt={isUploadingClientReceipt}
                      onFileUpload={ocrUpload.handleFileUpload}
                      onClose={handleCancelSource}
                      onClientReceiptUpload={handleClientReceiptUpload}
                      onRemoveClientReceipt={handleRemoveClientReceipt}
                      onShowProjectDetails={handleShowProjectDetails}
                    />
                  ) : stepConfigs[lastHoveredStep] || (lastHoveredStep === 4 && catalogSuggestions[4]) || (lastHoveredStep === 5 && catalogSuggestions[5]) ? (
                    <>
                      {/* ========== MODE 5: Filled State (Cubes/Sliders) ========== */}
                      {lastHoveredStep === 1 && manualData[lastHoveredStep] && (
                        <div className="mt-24">
                          <Step1CompanyCubes
                            data={manualData[lastHoveredStep]}
                            onPreview={handlePreviewData}
                          />
                        </div>
                      )}
                      
                      {/* Полная форма данных шага */}
                      

                      
                      
                      {/* Шаг 2: Горизонтальный слайдер товаров */}
                      {lastHoveredStep === 2 && manualData[lastHoveredStep] && (
                        <div className="mt-24">
                          <Step3SpecificationSlider
                            data={manualData[lastHoveredStep]}
                            onPreview={handlePreviewData}
                          />
                        </div>
                      )}

                      {/* Шаг 3: Спецификация (использует тот же слайдер) */}
                      {lastHoveredStep === 3 && manualData[lastHoveredStep] && (
                        <div className="mt-24">
                          <Step3SpecificationSlider
                            data={manualData[lastHoveredStep]}
                            onPreview={handlePreviewData}
                          />
                        </div>
                      )}

                      {/* Шаг 4: Методы оплаты - показываем кубики для каждого метода */}
                      {lastHoveredStep === 4 && manualData[lastHoveredStep] && (
                        <div className="mt-24">
                          <Step4PaymentMethodCubes
                            manualData={manualData}
                            selectedSupplierData={selectedSupplierData}
                            onMethodSelect={handlePaymentMethodSelect}
                          />
                        </div>
                      )}

                      {/* Шаг 4: Если есть РЕКОМЕНДАЦИЯ из каталога ИЛИ ручное заполнение И метод ЕЩЁ НЕ ВЫБРАН - показываем ТРИ КУБИКА выбора */}
                      {lastHoveredStep === 4 && (catalogSuggestions[4] || selectedSource === "manual") && !manualData[4]?.method && (() => {
                        console.log('🎯 [Step 4 CUBES] Рендер трёх кубиков выбора!');
                        console.log('  - catalogSuggestions[4]:', catalogSuggestions[4]);
                        console.log('  - manualData[4]?.method:', manualData[4]?.method);

                        // Для ручного заполнения все методы доступны (серые кубики)
                        const isManualEntry = selectedSource === "manual";

                        const checkMethodAvailability = (method: string) => {
                          // Если ручное заполнение - все методы доступны
                          if (isManualEntry) return false; // false = серый цвет

                          if (catalogSuggestions[4].methods?.includes(method)) return true;
                          const supplier = catalogSuggestions[4].supplier_data;
                          if (!supplier) return false;
                          if (method === 'bank-transfer' && (supplier.bank_accounts?.length > 0 || supplier.payment_methods?.includes('bank-transfer'))) return true;
                          if (method === 'p2p' && (supplier.p2p_cards?.length > 0 || supplier.payment_methods?.includes('p2p') || supplier.payment_methods?.includes('card'))) return true;
                          if (method === 'crypto' && (supplier.crypto_wallets?.length > 0 || supplier.payment_methods?.includes('crypto'))) return true;
                          return false;
                        };

                        const bankAvailable = checkMethodAvailability('bank-transfer');
                        const p2pAvailable = checkMethodAvailability('p2p');
                        const cryptoAvailable = checkMethodAvailability('crypto');

                        return (
                          <div className="mb-6 mt-24">
                            <h4 className="text-base font-semibold text-gray-800 mb-4">Выберите метод оплаты:</h4>
                            <div className="grid grid-cols-3 gap-4 w-full">
                              {/* Банковский перевод */}
                              <div
                                className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${
                                  bankAvailable
                                    ? 'border-orange-400 bg-orange-100 hover:border-orange-500 ring-2 ring-orange-200'
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }`}
                                onClick={() => {
                                  setManualData(prev => ({
                                    ...prev,
                                    4: { ...(catalogSuggestions[4] || {}), selectedMethod: 'bank-transfer', method: 'bank-transfer', user_choice: true }
                                  }));
                                  setStepConfigs(prev => ({ ...prev, 4: 'catalog' }));
                                  // Очищаем рекомендации для Steps 4 и 5
                                  setCatalogSuggestions(prev => { const newSugg = {...prev}; delete newSugg[4]; delete newSugg[5]; return newSugg; });
                                  // Вызываем handlePaymentMethodSelect с данными поставщика (если есть) или null
                                  const supplierData = catalogSuggestions[4]?.supplier_data || selectedSupplierData || null;
                                  handlePaymentMethodSelect('bank-transfer', supplierData);
                                }}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    bankAvailable ? 'bg-orange-500' : 'bg-gray-400'
                                  }`}>
                                    <Banknote className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">Банковский перевод</div>
                                    <div className="text-xs text-gray-500">Банковские реквизиты</div>
                                  </div>
                                </div>
                                <div className={`text-sm font-medium mt-2 ${
                                  bankAvailable ? 'text-orange-600' : 'text-gray-600'
                                }`}>
                                  {bankAvailable ? 'Автозаполнение доступно' : 'Ручное заполнение'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
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
                                  setManualData(prev => ({
                                    ...prev,
                                    4: { ...(catalogSuggestions[4] || {}), selectedMethod: 'p2p', method: 'p2p', user_choice: true }
                                  }));
                                  setStepConfigs(prev => ({ ...prev, 4: 'catalog' }));
                                  // Очищаем рекомендации для Steps 4 и 5
                                  setCatalogSuggestions(prev => { const newSugg = {...prev}; delete newSugg[4]; delete newSugg[5]; return newSugg; });
                                  // Вызываем handlePaymentMethodSelect с данными поставщика (если есть) или null
                                  const supplierData = catalogSuggestions[4]?.supplier_data || selectedSupplierData || null;
                                  handlePaymentMethodSelect('p2p', supplierData);
                                }}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    p2pAvailable ? 'bg-blue-500' : 'bg-gray-400'
                                  }`}>
                                    <CreditCard className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">P2P переводы</div>
                                    <div className="text-xs text-gray-500">Карта поставщика</div>
                                  </div>
                                </div>
                                <div className={`text-sm font-medium mt-2 ${
                                  p2pAvailable ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                  {p2pAvailable ? 'Автозаполнение доступно' : 'Ручное заполнение'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
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
                                  setManualData(prev => ({
                                    ...prev,
                                    4: { ...(catalogSuggestions[4] || {}), selectedMethod: 'crypto', method: 'crypto', user_choice: true }
                                  }));
                                  setStepConfigs(prev => ({ ...prev, 4: 'catalog' }));
                                  // Очищаем рекомендации для Steps 4 и 5
                                  setCatalogSuggestions(prev => { const newSugg = {...prev}; delete newSugg[4]; delete newSugg[5]; return newSugg; });
                                  // Вызываем handlePaymentMethodSelect с данными поставщика (если есть) или null
                                  const supplierData = catalogSuggestions[4]?.supplier_data || selectedSupplierData || null;
                                  handlePaymentMethodSelect('crypto', supplierData);
                                }}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    cryptoAvailable ? 'bg-green-500' : 'bg-gray-400'
                                  }`}>
                                    <Coins className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">Криптовалюта</div>
                                    <div className="text-xs text-gray-500">Криптокошелек</div>
                                  </div>
                                </div>
                                <div className={`text-sm font-medium mt-2 ${
                                  cryptoAvailable ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {cryptoAvailable ? 'Автозаполнение доступно' : 'Ручное заполнение'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  BTC, ETH, USDT
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Шаг 5: Реквизиты - показываем заполненный кубик если данные полные */}
                      {(() => {
                        if (lastHoveredStep !== 5) return false;

                        const step5Data = manualData[5];
                        const hasType = step5Data?.type;

                        // Если типа нет - показываем кубики выбора (не filled state)
                        if (!hasType) return false;

                        // Проверяем ПОЛНОТУ заполнения данных
                        let isFullyFilled = false;
                        if (hasType === 'crypto') {
                          isFullyFilled = !!(step5Data.crypto_address && step5Data.crypto_name && step5Data.supplier);
                        } else if (hasType === 'p2p') {
                          isFullyFilled = !!(step5Data.card_number && step5Data.card_bank && step5Data.supplier);
                        } else if (hasType === 'bank') {
                          isFullyFilled = !!(step5Data.accountNumber && step5Data.bankName && step5Data.supplier);
                        }

                        console.log('🔍 [Step5RequisitesDisplay Debug]:', {
                          lastHoveredStep,
                          hasType,
                          isFullyFilled,
                          step5Data
                        });

                        // Показываем кубик ТОЛЬКО если данные ПОЛНОСТЬЮ заполнены
                        return isFullyFilled;
                      })() && (
                        <div className="mt-24">
                          <Step5RequisitesDisplay
                            data={manualData[lastHoveredStep]}
                            onPreview={handlePreviewData}
                          />
                        </div>
                      )}

                      {/* СПЕЦИАЛЬНО для шага 5: показываем кубики выбора когда есть рекомендация из каталога ИЛИ stepConfigs[5] */}
                      {lastHoveredStep === 5 && (() => {
                        console.log('🔍 [DEBUG Step 5 Cubes] Проверка показа кубиков:');
                        console.log('  - catalogSuggestions[5]:', catalogSuggestions[5]);
                        console.log('  - stepConfigs[5]:', stepConfigs[5]);
                        console.log('  - manualData[5]:', manualData[5]);

                        // Показываем кубики ТОЛЬКО если тип ЕЩЁ НЕ ВЫБРАН (нет type)
                        const shouldShowCubes = !manualData[5]?.type && (
                          catalogSuggestions[5] ||
                          selectedSource === "manual" ||
                          stepConfigs[5] === 'manual' ||
                          (stepConfigs[5] && ['catalog', 'blue_room', 'orange_room'].includes(stepConfigs[5]))
                        );
                        console.log('  - shouldShowCubes:', shouldShowCubes);
                        console.log('  - manualData[5]?.type:', manualData[5]?.type);

                        return shouldShowCubes;
                      })() && (() => {
                        // Для ручного заполнения все методы доступны (серые кубики)
                        const isManualEntry = selectedSource === "manual";

                        // Проверяем доступные методы поставщика
                        const checkMethodAvailability = (method: string) => {
                          // Если ручное заполнение - все методы доступны (серые)
                          if (isManualEntry) return false; // false = серый цвет

                          // Приоритет 1: catalogSuggestions[5] (рекомендация из каталога)
                          if (catalogSuggestions[5]) {
                            if (catalogSuggestions[5].methods?.includes(method)) return true;
                            const supplier = catalogSuggestions[5].supplier_data;
                            if (supplier) {
                              if (method === 'bank-transfer' && (supplier.bank_accounts?.length > 0 || supplier.payment_methods?.includes('bank-transfer'))) return true;
                              if (method === 'p2p' && (supplier.p2p_cards?.length > 0 || supplier.payment_methods?.includes('p2p') || supplier.payment_methods?.includes('card'))) return true;
                              if (method === 'crypto' && (supplier.crypto_wallets?.length > 0 || supplier.payment_methods?.includes('crypto'))) return true;
                            }
                          }

                          // Приоритет 2: selectedSupplierData
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

                          // Приоритет 3: manualData[4]
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

                          // Приоритет 4: Проверяем OCR данные в manualData[4] (после автозаполнения из инвойса)
                          if (manualData[4]?.method === method) {
                            return true;
                          }

                          return false;
                        };

                        const bankAvailable = checkMethodAvailability('bank-transfer');
                        const p2pAvailable = checkMethodAvailability('p2p');
                        const cryptoAvailable = checkMethodAvailability('crypto');

                        return (
                          <div className="mb-6 mt-24">
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
                                if (isManualEntry) {
                                  // Ручное заполнение - сохраняем существующие данные и устанавливаем type
                                  setManualData(prev => ({
                                    ...prev,
                                    5: {
                                      ...(prev[5] || {}),
                                      type: 'bank',
                                      user_choice: true,
                                      source: 'manual'
                                    }
                                  }));
                                } else {
                                  // Автозаполнение через handlePaymentMethodSelect
                                  const supplierData = catalogSuggestions[5]?.supplier_data || selectedSupplierData;

                                  // Обновляем Step 4
                                  setManualData(prev => ({
                                    ...prev,
                                    4: {
                                      ...prev[4],
                                      ...(catalogSuggestions[5] || {}),
                                      selectedMethod: 'bank-transfer',
                                      method: 'bank-transfer',
                                      user_choice: true
                                    }
                                  }));
                                  setStepConfigs(prev => ({ ...prev, 4: 'catalog' }));

                                  // Очищаем рекомендации для Steps 4 и 5 (метод выбран)
                                  setCatalogSuggestions(prev => {
                                    const newSugg = {...prev};
                                    delete newSugg[4];
                                    delete newSugg[5];
                                    return newSugg;
                                  });

                                  // Автозаполняем Step 5 через общую функцию
                                  handlePaymentMethodSelect('bank-transfer', supplierData);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  bankAvailable ? 'bg-orange-500' : 'bg-gray-400'
                                }`}>
                                  <Banknote className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Банковский перевод</div>
                                  <div className="text-xs text-gray-500">Банковские реквизиты</div>
                                </div>
                              </div>
                              <div className={`text-sm font-medium mt-2 ${
                                bankAvailable ? 'text-orange-600' : 'text-gray-600'
                              }`}>
                                {bankAvailable ? 'Автозаполнение доступно' : 'Ручное заполнение'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
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
                                if (isManualEntry) {
                                  // Ручное заполнение - сохраняем существующие данные и устанавливаем type
                                  setManualData(prev => ({
                                    ...prev,
                                    5: {
                                      ...(prev[5] || {}),
                                      type: 'p2p',
                                      user_choice: true,
                                      source: 'manual'
                                    }
                                  }));
                                } else {
                                  // Автозаполнение через handlePaymentMethodSelect
                                  const supplierData = catalogSuggestions[5]?.supplier_data || selectedSupplierData;

                                  // Обновляем Step 4
                                  setManualData(prev => ({
                                    ...prev,
                                    4: {
                                      ...prev[4],
                                      ...(catalogSuggestions[5] || {}),
                                      selectedMethod: 'p2p',
                                      method: 'p2p',
                                      user_choice: true
                                    }
                                  }));
                                  setStepConfigs(prev => ({ ...prev, 4: 'catalog' }));

                                  // Очищаем рекомендации для Steps 4 и 5 (метод выбран)
                                  setCatalogSuggestions(prev => {
                                    const newSugg = {...prev};
                                    delete newSugg[4];
                                    delete newSugg[5];
                                    return newSugg;
                                  });

                                  // Автозаполняем Step 5 через общую функцию
                                  handlePaymentMethodSelect('p2p', supplierData);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  p2pAvailable ? 'bg-blue-500' : 'bg-gray-400'
                                }`}>
                                  <CreditCard className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">P2P переводы</div>
                                  <div className="text-xs text-gray-500">Карта поставщика</div>
                                </div>
                              </div>
                              <div className={`text-sm font-medium mt-2 ${
                                p2pAvailable ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {p2pAvailable ? 'Автозаполнение доступно' : 'Ручное заполнение'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
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
                                if (isManualEntry) {
                                  // Ручное заполнение - сохраняем существующие данные и устанавливаем type
                                  setManualData(prev => ({
                                    ...prev,
                                    5: {
                                      ...(prev[5] || {}),
                                      type: 'crypto',
                                      user_choice: true,
                                      source: 'manual'
                                    }
                                  }));
                                } else {
                                  // Автозаполнение через handlePaymentMethodSelect
                                  const supplierData = catalogSuggestions[5]?.supplier_data || selectedSupplierData;

                                  // Обновляем Step 4
                                  setManualData(prev => ({
                                    ...prev,
                                    4: {
                                      ...prev[4],
                                      ...(catalogSuggestions[5] || {}),
                                      selectedMethod: 'crypto',
                                      method: 'crypto',
                                      user_choice: true
                                    }
                                  }));
                                  setStepConfigs(prev => ({ ...prev, 4: 'catalog' }));

                                  // Очищаем рекомендации для Steps 4 и 5 (метод выбран)
                                  setCatalogSuggestions(prev => {
                                    const newSugg = {...prev};
                                    delete newSugg[4];
                                    delete newSugg[5];
                                    return newSugg;
                                  });

                                  // Автозаполняем Step 5 через общую функцию
                                  handlePaymentMethodSelect('crypto', supplierData);
                                  setStepConfigs(prev => ({ ...prev, 4: 'catalog', 5: 'catalog' }));
                                  setLastHoveredStep(0);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  cryptoAvailable ? 'bg-green-500' : 'bg-gray-400'
                                }`}>
                                  <Coins className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-800">Криптовалюта</div>
                                  <div className="text-xs text-gray-500">Криптокошелек</div>
                                </div>
                              </div>
                              <div className={`text-sm font-medium mt-2 ${
                                cryptoAvailable ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {cryptoAvailable ? 'Автозаполнение доступно' : 'Ручное заполнение'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                BTC, ETH, USDT и др.
                              </div>
                            </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Для других шагов - обычная карточка */}
                      {lastHoveredStep !== 1 && lastHoveredStep !== 2 && lastHoveredStep !== 4 && lastHoveredStep !== 5 && manualData[lastHoveredStep] && (
                        <div className="border-2 border-gray-200 rounded-xl p-6 shadow-lg max-w-md w-full transition-all duration-200 bg-white">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              stepConfigs[lastHoveredStep] === "profile" ? "bg-blue-500" :
                              stepConfigs[lastHoveredStep] === "template" ? "bg-green-500" :
                              (stepConfigs[lastHoveredStep] === "blue_room" || stepConfigs[lastHoveredStep] === "orange_room") ? "bg-purple-500" :
                              stepConfigs[lastHoveredStep] === "manual" ? "bg-gray-500" : "bg-emerald-500"
                            }`}>
                              {stepConfigs[lastHoveredStep] === "profile" ? <Users className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "template" ? <FileText className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "blue_room" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "orange_room" ? <Store className="h-4 w-4 text-white" /> :
                               stepConfigs[lastHoveredStep] === "catalog" ? <Store className="h-4 w-4 text-white" /> :
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
                            {lastHoveredStep === 3 && ocrUpload.uploadedFiles[lastHoveredStep] && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">📄</span>
                                <span className="text-gray-800">{ocrUpload.uploadedFiles[lastHoveredStep]}</span>
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full ml-auto">
                                  ✓ Загружен
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      {/* ========== UNFILLED STATE: Source Selection Menu ========== */}
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
                <EmptyState type="disabled-step" />
              ) : (
                <EmptyState type="hover-prompt" />
              )}
            </AnimatePresence>
          </div>
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

      {/* managerNotification удалён - теперь обрабатывается в Stage2Container */}


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

      {/* Боковая панель дерева сценариев */}
      <ScenarioTreePanel
        open={scenarioMode.sidePanelOpen}
        onOpenChange={(open) => {
          if (!open) scenarioMode.toggleSidePanel()
        }}
        treeData={scenarioMode.treeData}
        activeScenarioId={scenarioMode.activeScenarioId}
        onCreateBranch={scenarioMode.createScenarioBranch}
        onSelectScenario={scenarioMode.selectScenario}
        onSwitchScenario={handleSwitchScenario}
        onDeleteScenario={scenarioMode.deleteScenario}
        loading={scenarioMode.loading}
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

