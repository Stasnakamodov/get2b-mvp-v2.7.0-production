"use client"

import { db } from "@/lib/db/client"
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { logger } from "@/src/shared/lib/logger"
import {
  Building,
  FileText,
  Clock,
  CheckCircle,
  Save,
  Share2,
  Info,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  CreditCard,
  Landmark,
  Wallet,
  Settings,
  ShoppingCart,
  Plus,
  Trash2,
  Users,
  Upload,
  Edit,
} from "lucide-react"

// Add these imports at the top with the other imports
import { useSearchParams, useRouter } from "next/navigation"
import {
  sendTelegramMessageClient,
  sendTelegramDocumentClient,
  sendTelegramProjectApprovalRequestClient,
  sendSupplierReceiptRequestToManagerClient,
  sendClientConfirmationRequestToTelegramClient,
} from "@/lib/telegram-client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AnimatePresence } from "framer-motion"
import { useCreateProjectContext, CreateProjectProvider } from "./context/CreateProjectContext"
import { useProjectSupabase } from "./hooks/useProjectSupabase"
import { useProjectTemplates } from "./hooks/useProjectTemplates"
import { useClientProfiles } from "@/hooks/useClientProfiles"
import { useSupplierProfiles } from "@/hooks/useSupplierProfiles"
import { getStepByStatus } from "@/lib/types/project-status"
import ProjectTimeline from "@/components/ui/ProjectTimeline"
import Step1CompanyForm from "./steps/Step1CompanyForm"
import Step2SpecificationForm from "./steps/Step2SpecificationForm"
import Step3PaymentForm from "./steps/Step3PaymentForm"
import Step4PaymentMethodForm from "./steps/Step4PaymentMethodForm"
import Step5RequisiteSelectForm from "./steps/Step5RequisiteSelectForm"
import Step6ReceiptForClient from "./steps/Step6ReceiptForClient"
import Step7ClientConfirmationForm from "./steps/Step7ClientConfirmationForm"
// --- ДОБАВЬ: функция для отправки данных в Telegram ---
async function sendCompanyDataToTelegram(companyData: any) {
  try {
    // Проверяем, что данные не пустые
    if (!companyData || !companyData.name) {
      logger.error("Данные компании пустые, отправка отменена")
      return
    }

    const text = `Данные клиента заполнены!\n\nНазвание: ${companyData.name}\nЮр. название: ${companyData.legalName}\nИНН: ${companyData.inn}\nКПП: ${companyData.kpp}\nОГРН: ${companyData.ogrn}\nАдрес: ${companyData.address}\nБанк: ${companyData.bankName}\nСчёт: ${companyData.bankAccount}\nEmail: ${companyData.email}\nТелефон: ${companyData.phone}`

    await sendTelegramMessageClient(text)
  } catch (error) {
    logger.error("❌ Ошибка отправки данных компании в Telegram:", error)
    alert("Ошибка отправки данных в Telegram: " + (error instanceof Error ? error.message : String(error)))
  }
}

// --- Функция для отправки спецификации в Telegram ---
async function sendSpecificationToTelegram({
  projectName,
  specificationItems,
  currency,
  invoiceType,
  invoiceFile,
  projectId,
}: {
  projectName: string
  specificationItems: any[]
  currency: string
  invoiceType: string
  invoiceFile: { url: string } | null
  projectId: string | null
}) {
  try {
    let text = `Проект: ${projectName}\nСпецификация:\n`
    specificationItems.forEach((item: any, idx: number) => {
      text += `\n${idx + 1}. ${item.name} | Код: ${item.code} | Кол-во: ${item.quantity} ${item.unit} | Цена: ${currency} ${item.pricePerUnit} | Сумма: ${currency} ${item.totalPrice}`
    })
    text += `\nИтого: ${currency} ${specificationItems.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0)}`

    if (invoiceType === "ready" && invoiceFile && invoiceFile.url) {
      try {
        await sendTelegramDocumentClient(invoiceFile.url, text)
      } catch {
        await sendTelegramMessageClient(`${text}\nСсылка на файл спецификации: ${invoiceFile.url}`)
      }
      if (projectId) {
        await sendTelegramProjectApprovalRequestClient(text, projectId)
      }
      return
    }
    if (projectId) {
      await sendTelegramProjectApprovalRequestClient(text, projectId)
    } else {
      await sendTelegramMessageClient(text)
    }
  } catch (error) {
    logger.error("❌ Ошибка отправки спецификации в Telegram:", error)
    alert("Ошибка отправки спецификации в Telegram: " + (error instanceof Error ? error.message : String(error)))
  }
}

// --- Функция для отправки чека в Telegram ---
async function sendReceiptToTelegram(receiptUrl: string, projectName: string) {
  try {
    await sendTelegramDocumentClient(receiptUrl, `Проект: ${projectName}\nЗагружен чек об оплате`)
  } catch {
    await sendTelegramMessageClient(`Проект: ${projectName}\nСсылка на чек: ${receiptUrl}`)
  }
}

// --- Функция для отправки выбранного способа оплаты в Telegram ---
async function sendPaymentMethodToTelegram(method: string, projectName: string) {
  const text = `Проект: ${projectName}\nВыбран способ оплаты: ${method}`
  await sendTelegramMessageClient(text)
}

// --- Функция для отправки реквизитов в Telegram ---
async function sendPaymentDetailsToTelegram(details: any, projectName: string) {
  let text = `Проект: ${projectName}\nРеквизиты для оплаты:`
  Object.entries(details).forEach(([key, value]) => {
    text += `\n${key}: ${value}`
  })
  await sendTelegramMessageClient(text)
}

// --- Функция для отправки чека в Telegram с кнопками апрува ---
async function sendReceiptApprovalRequestToTelegram(receiptUrl: string, projectName: string, projectId: string) {
  const text = `Проект: ${projectName}\nЗагружен чек об оплате`
  await sendTelegramProjectApprovalRequestClient(text + `\nЧек: ${receiptUrl}`, projectId, "receipt")
}

// Функции экспортированы в utils/telegram.ts

const steps = [
  { id: 1, title: "Данные клиента", description: "Данные компании", icon: Building },
  { id: 2, title: "Спецификация", description: "Спецификация", icon: FileText },
  { id: 3, title: "Пополнение агента", description: "Пополнение счёта", icon: CreditCard },
  { id: 4, title: "Метод оплаты", description: "Метод оплаты", icon: Landmark },
  { id: 5, title: "Реквизиты поставщика", description: "Реквизиты для оплаты", icon: Wallet },
  { id: 6, title: "Пополнение поставщика", description: "Получение средств", icon: Settings },
  { id: 7, title: "Подтверждение оплаты", description: "Завершение", icon: CheckCircle },
]

function CreateProjectPageContent() {
  const { currentStep, setCurrentStep, maxStepReached, setMaxStepReached, setCompanyData, setProjectName, setSpecificationItems, projectId, setSupplierData, hasCartItems } = useCreateProjectContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams?.get("templateId");
  const fromCart = searchParams?.get("from_cart");
  const defaultCompanyData = useMemo(() => ({
    name: "",
    legalName: "",
    inn: "",
    kpp: "",
    ogrn: "",
    address: "",
    bankName: "",
    bankAccount: "",
    bankCorrAccount: "",
    bankBik: "",
    email: "",
    phone: "",
    website: "",
  }), []);
  useEffect(() => {
    // ❌ НЕ сбрасываем данные если пользователь пришел из корзины каталога
    if (fromCart === 'true') {
      return;
    }

    // ❌ НЕ сбрасываем данные если в контексте есть товары из корзины
    if (hasCartItems) {
      return;
    }

    // Если нет templateId и projectId — сбрасываем всё в дефолт
    if (!projectId && !templateId) {
      setCompanyData(defaultCompanyData);
      setProjectName("");
      setSpecificationItems([]);
      setMaxStepReached(1); // Сброс maxStepReached только при новом проекте/шаблоне
    }
  }, [projectId, templateId, fromCart, hasCartItems, setCompanyData, setProjectName, setSpecificationItems, setMaxStepReached, defaultCompanyData]);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setIsSaveDialogOpen, setSetIsSaveDialogOpen] = useState(false);

  // --- Новое: обработчик клика по шагу ---
  const handleStepClick = (step: number) => {
    if (step <= maxStepReached) {
      setCurrentStep(step);
        if (projectId) {
        router.push(`/dashboard/create-project?projectId=${projectId}&step=${step}`);
      }
    }
  };

  // --- Гарантируем, что maxStepReached не уменьшается при возврате назад ---
  React.useEffect(() => {
    if (currentStep > maxStepReached) {
      setMaxStepReached(currentStep);
    }
  }, [currentStep, maxStepReached, setMaxStepReached]);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <ProjectTimeline steps={steps} currentStep={currentStep} maxStepReached={maxStepReached} onStepClick={handleStepClick} />
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <Step1CompanyForm
            isLoading={isLoading}
            isVerified={isVerified}
            isVerifying={isVerifying}
            setIsSaveDialogOpen={setSetIsSaveDialogOpen}
          />
        )}
        {currentStep === 2 && <Step2SpecificationForm isTemplateMode={false} />}
        {currentStep === 3 && <Step3PaymentForm />}
        {currentStep === 4 && <Step4PaymentMethodForm />}
        {currentStep === 5 && <Step5RequisiteSelectForm />}
        {currentStep === 6 && <Step6ReceiptForClient />}
        {currentStep === 7 && <Step7ClientConfirmationForm />}
        {/* Здесь будут остальные шаги: currentStep === 6 и т.д. */}
      </AnimatePresence>
    </div>
  );
}

function ProjectIdLoader({ onLoaded }: { onLoaded: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams?.get("projectId");
  const stepParam = searchParams?.get("step");
  const { setProjectId, setCurrentStep, setProjectName, setCompanyData, setSpecificationItems, setMaxStepReached, setPaymentMethod, setSupplierData } = useCreateProjectContext();
  const { loadSpecification } = useProjectSupabase();
  const [isStepLoading, setIsStepLoading] = useState(true);

  React.useEffect(() => {
    async function fetchStep() {
      if (!projectId) {
        setIsStepLoading(false);
        
        // Проверяем, есть ли товары поставщика для сохранения
        const pendingItems = localStorage.getItem('pendingSupplierItems');
        if (pendingItems) {
          // Очищаем localStorage
          localStorage.removeItem('pendingSupplierItems');
          
          // Сохраняем товары после создания проекта
          setTimeout(async () => {
            try {
              const items = JSON.parse(pendingItems);
              
              // Ждем создания проекта
              const checkProjectId = setInterval(async () => {
                const currentProjectId = new URLSearchParams(window.location.search).get('projectId');
                if (currentProjectId) {
                  clearInterval(checkProjectId);
                  
                  const { data: { session } } = await db.auth.getSession();
                  if (!session?.access_token) {
                    logger.error('[ProjectIdLoader] Нет access_token');
                    return;
                  }
                  const response = await fetch('/api/project-specifications/bulk-insert', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      projectId: currentProjectId,
                      items: items,
                      role: 'client'
                    }),
                  });

                  if (!response.ok) logger.error('[ProjectIdLoader] Ошибка сохранения:', response.status);
                  const result = await response.json();
                }
              }, 100);
              
              // Останавливаем проверку через 10 секунд
              setTimeout(() => clearInterval(checkProjectId), 10000);
              
            } catch (error) {
              logger.error('[ProjectIdLoader] Ошибка сохранения товаров поставщика:', error);
            }
          }, 1000);
        }
        
        onLoaded();
        return;
      }
      
      const data = await loadSpecification(projectId);
      
      if (data) {
        
        if (data.name) setProjectName(data.name);
        if (data.company_data) {
          setCompanyData(data.company_data);
        }
        if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
        
        // 🎯 ВОССТАНАВЛИВАЕМ ДАННЫЕ ПОСТАВЩИКА ИЗ БД
        if (data.supplier_data) {
          setSupplierData(data.supplier_data);
        } else {
        }
        
        // Определяем шаг по статусу
        if (data.status) {
          const statusStep = getStepByStatus(data.status);
          
          // Не переопределяем шаг, если пользователь уже находится на том же шаге или дальше
          // Это предотвращает "возврат" при переходах между шагами
          const currentStepFromUrl = Number(stepParam) || 1;
          if (currentStepFromUrl >= statusStep) {
            setCurrentStep(currentStepFromUrl);
            setMaxStepReached(Math.max(currentStepFromUrl, statusStep));
      } else {
            setCurrentStep(statusStep);
            setMaxStepReached(statusStep);
          }
    } else {
          setCurrentStep(1);
          setMaxStepReached(1);
        }
      }
      setIsStepLoading(false);
      onLoaded();
    }
    fetchStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  React.useEffect(() => {
    if (projectId) setProjectId(projectId);
  }, [projectId, setProjectId]);

  if (isStepLoading) {
    return null;
  }
  return null;
}

function StartProjectStepper({ open, onClose, onSelect, fromCart = false }: { open: boolean, onClose: () => void, onSelect: (role: 'client' | 'supplier', method: 'profile' | 'manual' | 'upload' | 'template', templateData?: any) => void, fromCart?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState<'classic' | 'constructor' | 'catalog' | null>(null);
  const [method, setMethod] = useState<'profile' | 'manual' | 'upload' | 'template' | null>(null);
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const handleNext = () => {
    if (step === 1 && projectType) {
      if (projectType === 'constructor') {
        onClose();
        router.push('/dashboard/project-constructor');
        return;
      }
      if (projectType === 'catalog') {
        onClose();
        router.push('/dashboard/catalog');
        return;
      }
      setStep(2);
    }
    if (step === 2 && method) {
      if (method === 'template') {
        setShowTemplateSelect(true);
        return;
      }
      onSelect('client', method);
      onClose();
    }
  };
  const handleBack = () => {
    if (step === 2) setStep(1);
  };
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setShowTemplateSelect(false);
    onSelect('client', 'template', template);
    onClose();
  };
  return (
    <>
      <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? 'Как вы хотите создать проект?' : 'Как вы хотите начать проект?'}
            </DialogTitle>
            <DialogDescription className="sr-only">Выберите способ создания проекта</DialogDescription>
          </DialogHeader>
          {step === 1 && (
            <div className="flex flex-col gap-4 mt-4">
              <Button variant={projectType === 'classic' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setProjectType('classic')}><FileText className="h-5 w-5" /> Классический стартер</Button>
              <Button variant={projectType === 'constructor' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setProjectType('constructor')}><Settings className="h-5 w-5" /> Конструктор проектов</Button>
              {!fromCart && <Button variant={projectType === 'catalog' ? 'default' : 'outline'} className="flex items-center gap-2 border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50" onClick={() => setProjectType('catalog')}><ShoppingCart className="h-5 w-5" /> Из каталога</Button>}
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-4 mt-4">
              <Button variant={method === 'profile' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setMethod('profile')}><FileText className="h-5 w-5" /> Выбрать из профиля</Button>
              <Button variant={method === 'manual' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setMethod('manual')}><Edit className="h-5 w-5" /> Заполнить вручную</Button>
              <Button variant={method === 'upload' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setMethod('upload')}><Upload className="h-5 w-5" /> Загрузить карточку</Button>
              <Button variant={method === 'template' ? 'default' : 'outline'} className="flex items-center gap-2" onClick={() => setMethod('template')}><Save className="h-5 w-5" /> Создать по шаблону</Button>
            </div>
          )}
          <DialogFooter className="mt-6 flex justify-between">
            {step === 2 && <Button variant="outline" onClick={handleBack}>Назад</Button>}
            <Button onClick={handleNext} disabled={step === 1 ? !projectType : !method}>Далее</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showTemplateSelect && (
        <TemplateSelectModal open={showTemplateSelect} onClose={() => setShowTemplateSelect(false)} onSelect={handleTemplateSelect} />
      )}
    </>
  );
}

function ProfileCardSelectModal({
  open,
  onClose,
  role,
  onSelect,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  role: 'client' | 'supplier';
  onSelect: (profile: any) => void;
  userId: string | null;
}) {
  const clientProfiles = useClientProfiles(role === 'client' ? userId : null);
  const supplierProfiles = useSupplierProfiles(role === 'supplier' ? userId : null);
  const profiles = role === 'client' ? clientProfiles.profiles : supplierProfiles.profiles;
  const loading = role === 'client' ? clientProfiles.loading : supplierProfiles.loading;
  const error = role === 'client' ? clientProfiles.error : supplierProfiles.error;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => { setSelectedId(null); }, [open, role]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Выберите карточку {role === 'client' ? 'клиента' : 'поставщика'}</DialogTitle>
          <DialogDescription className="sr-only">Список сохранённых карточек</DialogDescription>
        </DialogHeader>
        {loading && <div className="text-center py-8">Загрузка...</div>}
        {error && <div className="text-red-500 text-center py-8">{error}</div>}
        {!loading && !error && (
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
            {profiles.length === 0 && <div className="text-muted-foreground text-center">Нет сохранённых карточек</div>}
            {profiles.map((profile: any) => (
              <div
                key={profile.id}
                className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col gap-1 transition-all ${selectedId === profile.id ? (role === 'client' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50') : 'border-border hover:border-blue-300'}`}
                onClick={() => setSelectedId(profile.id)}
              >
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {role === 'client' ? <Users className="h-5 w-5 text-blue-500" /> : <Building className="h-5 w-5 text-green-500" />}
                  {profile.name || 'Без названия'}
                </div>
                <div className="text-sm text-muted-foreground">Страна: {profile.country || '—'}</div>
                <div className="text-xs text-muted-foreground">ID: {profile.id}</div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={() => { const p = profiles.find((x: any) => x.id === selectedId); if (p) onSelect(p); }} disabled={!selectedId}>Выбрать</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Модалка выбора шаблона (новая версия)
function TemplateSelectModal({ open, onClose, onSelect }: { open: boolean, onClose: () => void, onSelect: (template: any) => void }) {
  const { templates, loading, error, fetchTemplates } = useProjectTemplates();
  useEffect(() => { if (open) fetchTemplates(); }, [open]);
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Выберите шаблон</DialogTitle>
          <DialogDescription className="sr-only">Список сохранённых шаблонов</DialogDescription>
        </DialogHeader>
        {loading && <div className="text-center py-8">Загрузка...</div>}
        {error && <div className="text-red-500 text-center py-8">{error}</div>}
        {!loading && !error && (
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
            {templates.length === 0 && <div className="text-muted-foreground text-center">Нет сохранённых шаблонов</div>}
            {templates.map((template: any) => (
              <div
                key={template.id}
                className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col gap-1 transition-all hover:border-blue-400`}
                onClick={() => onSelect(template)}
              >
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Save className="h-5 w-5 text-blue-500" />
                  {template.name || 'Без названия'}
                </div>
                <div className="text-sm text-muted-foreground">{template.description || ''}</div>
                <div className="text-xs text-muted-foreground">ID: {template.id}</div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="mt-6 flex justify-between">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Новый компонент для stepper и выбора карточки ---
function ProjectStartFlow({ fromCart = false }: { fromCart?: boolean }) {
  const [showStepper, setShowStepper] = useState(true);
  const [startRole, setStartRole] = useState<'client' | 'supplier' | null>(null);
  const [startMethodLocal, setStartMethodLocal] = useState<'profile' | 'manual' | 'upload' | 'template' | null>(null);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [projectInsertError, setProjectInsertError] = useState<string | null>(null);
  const { setCompanyData, setStartMethod, setProjectId, setCurrentStep, setProjectName, specificationItems, hasCartItems, projectId: ctxProjectId } = useCreateProjectContext();
  const { createProject } = useProjectSupabase();
  const router = useRouter();

  useEffect(() => {
    db.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

  // После выбора способа старта
  // templateData теперь — это весь объект шаблона из project_templates
  const handleStepperSelect = async (role: 'client' | 'supplier', method: 'profile' | 'manual' | 'upload' | 'template', templateData?: any) => {
    setStartRole(role);
    setStartMethodLocal(method);
    setShowStepper(false);
    setStartMethod(method); // сохраняем в контекст
    setCreating(true);
    setProjectInsertError(null);
    try {
      // Создаём проект в Supabase
      const { data: userData, error: userError } = await db.auth.getUser();
      if (!userData?.user) {
        alert('Ошибка: пользователь не найден. Пожалуйста, войдите в систему заново.');
        if (typeof window !== 'undefined') {
        }
        setCreating(false);
        return;
      }
      if (userError) throw new Error('Не удалось получить пользователя: ' + userError.message);
      const user_id = userData.user.id;
      let projectId = null;
      if (method === 'template' && templateData) {
        // Создаём проект с автозаполнением из нормализованных полей шаблона
        const { data: project, error: projectError } = await db
          .from('projects')
        .insert([
          {
              user_id,
              initiator_role: role,
              start_method: 'template',
              status: 'draft',
              current_step: 1,
              name: (templateData.name || '').trim() || `Проект ${new Date().toLocaleDateString('ru-RU')}`,
              company_data: {
                name: (templateData.company_name || '').trim(),
                legalName: (templateData.company_legal || '').trim(),
                inn: (templateData.company_inn || '').replace(/[^0-9]/g, '').trim(),
                kpp: (templateData.company_kpp || '').replace(/[^0-9]/g, '').trim(),
                ogrn: (templateData.company_ogrn || '').replace(/[^0-9]/g, '').trim(),
                address: (templateData.company_address || '').trim(),
                bankName: (templateData.company_bank || '').trim(),
                bankAccount: (templateData.company_account || '').trim(),
                bankCorrAccount: (templateData.company_corr || '').trim(),
                bankBik: (templateData.company_bik || '').trim(),
                email: (templateData.company_email || '').trim(),
                phone: (templateData.company_phone || '').trim(),
                website: (templateData.company_website || '').trim(),
              },
            },
          ])
          .select('id')
          .single();
        if (projectError) {
          setProjectInsertError('Ошибка создания проекта: ' + JSON.stringify(projectError));
          logger.error('Ошибка создания проекта:', projectError);
        }
        if (projectError || !project?.id) throw new Error(projectError?.message || 'Ошибка создания проекта');
        const projectId: string = project.id;
        
        // Добавляем запись в историю статусов для создания проекта
        await db
          .from("project_status_history")
          .insert([
            {
              project_id: projectId,
              status: "draft",
              previous_status: null,
              step: 1,
              changed_by: user_id,
              comment: "Проект создан из шаблона",
            },
          ]);
        
        setProjectId(projectId);
        setCurrentStep(1);
        // --- Копируем спецификацию из шаблона в project_specifications ---
        if (Array.isArray(templateData.specification) && templateData.specification.length > 0) {
          // --- ЛОГИРОВАНИЕ bulk insert спецификации ---
          const specRows = templateData.specification.map((item: any) => ({
            item_name: item.name || item.item_name || "",
            item_code: item.code || item.item_code || "",
            image_url: item.image_url || item.image || "",
            quantity: item.quantity || 0,
            unit: item.unit || "",
            price: item.pricePerUnit ?? item.price ?? 0,
            total: item.totalPrice ?? item.total ?? ((item.pricePerUnit ?? item.price ?? 0) * (item.quantity ?? 0)),
            project_id: projectId,
            role: 'client',
            user_id,
          }));
          const { data: insertData, error: specError } = await db
            .from('project_specifications')
            .insert(specRows);
          if (specError) {
            alert('Ошибка копирования спецификации: ' + specError.message);
            logger.error('Ошибка копирования спецификации:', specError);
          }
          // --- Polling: ждём, пока все позиции появятся в Supabase ---
          const waitForSpec = async () => {
            for (let i = 0; i < 10; i++) { // максимум 10 попыток (5 секунд)
              const { data: specData } = await db
                .from('project_specifications')
                .select('id')
                .eq('project_id', projectId)
                .eq('role', 'client');
              if (Array.isArray(specData) && specData.length >= specRows.length) return true;
              await new Promise(res => setTimeout(res, 500));
            }
            return false;
          };
          await waitForSpec();
          // Переводим проект на шаг 2
          await db.from('projects').update({ current_step: 2 }).eq('id', projectId);
          setCurrentStep(2);
          // Перенаправляем сразу на шаг 2
          router.replace(`?projectId=${projectId}&step=2`);
          setCreating(false);
          return;
        }
      } else {
      const { data, error } = await db
          .from('projects')
        .insert([
          {
              name: `Проект ${new Date().toLocaleDateString('ru-RU')}`,
              user_id,
              initiator_role: role,
              start_method: method,
              status: 'draft',
              current_step: 1,
            },
          ])
          .select('id')
          .single();
        if (error || !data?.id) throw new Error(error?.message || 'Ошибка создания проекта');
        const projectId: string = data.id;
        
        // Добавляем запись в историю статусов для создания проекта
        await db
          .from("project_status_history")
          .insert([
            {
              project_id: projectId,
              status: "draft",
              previous_status: null,
              step: 1,
              changed_by: user_id,
              comment: "Проект создан",
            },
          ]);
        
        setProjectId(projectId);
        setCurrentStep(1);
        // Синхронизируем имя проекта в контексте с тем, что записано в БД
        setProjectName(`Проект ${new Date().toLocaleDateString('ru-RU')}`);
        // Обновляем URL чтобы projectId сохранялся при перезагрузке страницы
        router.replace(`/dashboard/create-project?projectId=${projectId}`);

        // BUG-1 fix: если пришли из корзины каталога, сохраняем товары в БД
        if (hasCartItems && specificationItems.length > 0) {
          const specRows = specificationItems.map((item: any) => ({
            item_name: item.name || item.item_name || '',
            item_code: item.code || item.item_code || '',
            image_url: item.image_url || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'шт',
            price: item.pricePerUnit ?? item.price ?? 0,
            total: item.totalPrice ?? item.total ?? ((item.pricePerUnit ?? item.price ?? 0) * (item.quantity ?? 1)),
            description: item.description || '',
            supplier_name: item.supplier_name || '',
            supplier_id: item.supplier_id || null,
            currency: item.currency || 'RUB',
            catalog_product_id: item.catalog_product_id || null,
            catalog_product_source: item.catalog_product_source || null,
            category_name: item.category || item.category_name || null,
            subcategory_name: item.subcategory || item.subcategory_name || null,
            project_id: projectId,
            role: 'client',
            user_id,
          }));
          const { error: specError } = await db
            .from('project_specifications')
            .insert(specRows);
          if (specError) {
            logger.error('[handleStepperSelect] Ошибка сохранения товаров из корзины:', specError);
          } else {
            logger.info('[handleStepperSelect] Товары из корзины сохранены в БД:', specRows.length);
          }
        }

        if (method === 'profile') {
          setShowProfileSelect(true);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Ошибка создания проекта');
      } finally {
      setCreating(false);
    }
  };

  // После выбора карточки профиля
  const handleProfileSelect = async (profile: any) => {
    setShowProfileSelect(false);
    const companyData = {
      name: profile.name || '',
      legalName: profile.legal_name || '',
      inn: profile.inn || '',
      kpp: profile.kpp || '',
      ogrn: profile.ogrn || '',
      address: profile.legal_address || '',
      bankName: profile.bank_name || '',
      bankAccount: profile.bank_account || '',
      bankCorrAccount: profile.corr_account || '',
      bankBik: profile.bik || '',
      email: profile.email || '',
      phone: profile.phone || '',
      website: profile.website || '',
    };
    setCompanyData(companyData);
    setProjectName(profile.name || '');
    // --- Обновляем проект в Supabase ---
    if (ctxProjectId) {
      await db
        .from('projects')
        .update({
          name: profile.name || '',
          company_data: companyData,
        })
        .eq('id', ctxProjectId);
      // Обновляем URL чтобы projectId был доступен при перезагрузке
      router.replace(`/dashboard/create-project?projectId=${ctxProjectId}`);
    }
    // setCurrentStep(1); // если нужно явно перейти к шагу 1
  };

  return (
    <>
      <StartProjectStepper open={showStepper} onClose={() => setShowStepper(false)} onSelect={handleStepperSelect} fromCart={fromCart} />
      {creating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-8 shadow-xl flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-lg font-semibold">Создаём проект...</div>
                  </div>
                      </div>
      )}
      {showProfileSelect && startRole && userId && (
        <ProfileCardSelectModal open={showProfileSelect} onClose={() => setShowProfileSelect(false)} role={startRole} onSelect={handleProfileSelect} userId={userId} />
      )}
      {projectInsertError && (
        <div style={{ background: '#fee', color: '#900', padding: 16, borderRadius: 8, margin: 16, fontWeight: 'bold', fontSize: 16 }}>
          {projectInsertError}
                  </div>
      )}
    </>
  );
}

// Компонент для режима создания шаблона
function TemplateModeContent() {
  const { currentStep, setCurrentStep, maxStepReached } = useCreateProjectContext();
  
  // Шаги для режима создания шаблона (только A1 и A2)
  const templateSteps = [
    { id: 1, title: "A1", description: "Данные клиента", icon: Building },
    { id: 2, title: "A2", description: "Спецификация", icon: FileText }
  ];

  const handleStepClick = (step: number) => {
    if (step <= maxStepReached) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <Step1CompanyForm isTemplateMode={true} />
        )}
        {currentStep === 2 && (
          <Step2SpecificationForm isTemplateMode={true} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CreateProjectPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("templateId");
  const projectId = searchParams?.get("projectId");
  const mode = searchParams?.get("mode");
  const role = searchParams?.get("role");
  const fromCart = searchParams?.get("from_cart");
  // Уникальный ключ для сброса контекста при новом проекте/шаблоне
  const contextKey = projectId || templateId || mode || "new";
  const [isStepLoaded, setIsStepLoaded] = useState(false);

  // --- Новый режим: создание шаблона клиента ---
  if (mode === 'template' && role === 'client') {
    return (
      <CreateProjectProvider key={contextKey}>
        <TemplateModeContent />
      </CreateProjectProvider>
    );
  }

  return (
    <CreateProjectProvider key={contextKey}>
      <ProjectIdLoader onLoaded={() => setIsStepLoaded(true)} />
      <SupplierLoader />
      <CartLoader />
      {isStepLoaded && (
        <>
          {!templateId && !projectId && mode !== 'catalog' && <ProjectStartFlow fromCart={!!fromCart} />}
          <TemplateLoader />
          <CreateProjectPageContent />
        </>
      )}
    </CreateProjectProvider>
  );
}

// Компонент для загрузки шаблона и автозаполнения контекста
function TemplateLoader() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("templateId");
  const projectId = searchParams?.get("projectId");
  const fromCart = searchParams?.get("from_cart");
  const { setProjectName, setCompanyData, setSpecificationItems } = useCreateProjectContext();
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  useEffect(() => {
    // ВАЖНО: Если есть projectId, то проект уже создан и данные загружены в ProjectIdLoader
    // TemplateLoader должен работать только при создании нового проекта БЕЗ projectId
    if (projectId) {
      return;
    }

    // Если пришли из корзины — CartLoader сам заполнит спецификацию
    if (fromCart === 'true') {
      return;
    }

    if (!templateId) {
      // Сбросить всё в дефолт, если нет templateId
      setProjectName("");
      setCompanyData({
        name: "",
        legalName: "",
        inn: "",
        kpp: "",
        ogrn: "",
        address: "",
        bankName: "",
        bankAccount: "",
        bankCorrAccount: "",
        bankBik: "",
        email: "",
        phone: "",
        website: "",
      });
      setSpecificationItems([]);
      return;
    }
    async function fetchTemplate() {
      setIsTemplateLoading(true);
      // Ищем шаблон в project_templates
      const { data, error } = await db
        .from("project_templates")
        .select("*")
        .eq("id", templateId)
        .single();
      if (!error && data) {
        setProjectName(data.name || "");
        setCompanyData({
          name: data.company_name || "",
          legalName: data.company_legal || "",
          inn: data.company_inn || "",
          kpp: data.company_kpp || "",
          ogrn: data.company_ogrn || "",
          address: data.company_address || "",
          bankName: data.company_bank || "",
          bankAccount: data.company_account || "",
          bankCorrAccount: data.company_corr || "",
          bankBik: data.company_bik || "",
          email: data.company_email || "",
          phone: data.company_phone || "",
          website: data.company_website || "",
        });
        setSpecificationItems(data.specification || []);
      }
      setIsTemplateLoading(false);
    }
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, projectId, fromCart]);

  if (isTemplateLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Загрузка шаблона...</p>
                                  </div>
    );
  }
  return null;
}

// Компонент для загрузки данных из корзины каталога
function CartLoader() {
  const searchParams = useSearchParams();
  const fromCart = searchParams?.get("from_cart");
  const cartData = searchParams?.get("cart"); // Legacy: данные корзины в URL
  const { setSpecificationItems, setCurrentStep, setMaxStepReached, setHasCartItems } = useCreateProjectContext();
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartProcessed, setCartProcessed] = useState(false);

  useEffect(() => {
    // Проверяем что пришли из корзины
    if (fromCart !== 'true') {
      return;
    }

    // Если корзина уже обработана, не обрабатываем повторно
    if (cartProcessed) {
      return;
    }

    async function loadCartData() {
      setIsCartLoading(true);

      try {
        let cartItems: any[] = [];

        // Способ 1: из URL параметра cart (legacy)
        if (cartData) {
          cartItems = JSON.parse(decodeURIComponent(cartData));
        }
        // Способ 2: из sessionStorage (основной — из каталога)
        else if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('project_cart');
          if (stored) {
            cartItems = JSON.parse(stored);
            sessionStorage.removeItem('project_cart');
          }
        }
        
        
        if (cartItems && cartItems.length > 0) {
          // Преобразуем товары из корзины в формат спецификации
          const specItems = cartItems.map((item: any) => ({
            name: item.name || item.product_name || "",
            code: item.sku || item.code || "",
            quantity: item.quantity || 1,
            unit: item.unit || "шт",
            pricePerUnit: parseFloat(item.price) || 0,
            totalPrice: item.total_price || (item.quantity * parseFloat(item.price)) || 0,
            description: item.description || "",
            image_url: item.images && item.images[0] ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url) : item.image_url || "",
            supplier_name: item.supplier_name || "",
            supplier_id: item.supplier_id || "",
            catalog_product_id: item.catalog_product_id || null,
            category: item.category || "",
            subcategory: item.subcategory || "",
            currency: item.currency || "RUB",
            catalog_product_source: item.catalog_product_source || null,
          }));
          
          
          // Устанавливаем товары в контекст
          setSpecificationItems(specItems);
          setHasCartItems(true); // Устанавливаем флаг

          // Сохраняем в localStorage как запасной вариант
          localStorage.setItem('cart_items_temp', JSON.stringify(specItems));

          // Остаемся на первом шаге, но товары уже загружены и доступ к шагу 2 открыт
          setCurrentStep(1);

          // Шаг 2 доступен если есть товары (оплата и реквизиты заполняются позже)
          setMaxStepReached(2);

          // Отмечаем что корзина обработана
          setCartProcessed(true);

          logger.info("[CartLoader] Данные успешно загружены", {
            товары: specItems.length,
          });
        }
      } catch (error) {
        logger.error("[CartLoader] Ошибка загрузки данных корзины:", error);
      } finally {
        setIsCartLoading(false);
      }
    }
    
    loadCartData();
  }, [fromCart, cartData, cartProcessed, setSpecificationItems, setCurrentStep, setMaxStepReached, setHasCartItems]);

  if (isCartLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border p-6 rounded-xl shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span>Загружаем товары из корзины...</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Добавить новый компонент SupplierLoader после TemplateLoader
function SupplierLoader() {
  const searchParams = useSearchParams();
  const supplierId = searchParams?.get("supplierId");
  const supplierName = searchParams?.get("supplierName");
  const mode = searchParams?.get("mode");
  const projectId = searchParams?.get("projectId");
  const { setCompanyData, setProjectName, setSpecificationItems, fillSupplierData } = useCreateProjectContext();
  const [isSupplierLoading, setIsSupplierLoading] = useState(false);

  useEffect(() => {
    // Только для режима каталога и если есть supplierId
    if (mode !== 'catalog' || !supplierId) {
      return;
    }

    async function loadSupplierData() {
      setIsSupplierLoading(true);
      
      try {
        // Получаем данные поставщика из каталога
        // Получаем токен авторизации
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
          logger.error("[SupplierLoader] Нет активной сессии для загрузки поставщика");
          return;
        }

        // Сначала пробуем загрузить из пользовательских поставщиков
        let response = await fetch(`/api/catalog/user-suppliers?id=${supplierId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        let data = await response.json();
        
        // Если не найден в пользовательских, пробуем в аккредитованных
        if (!data.supplier) {
          response = await fetch(`/api/catalog/suppliers?verified=true&id=${supplierId}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          data = await response.json();
        }
        
        if (data.supplier) {
          const supplier = data.supplier;
          
          // Создаем объект эхо карточки для совместимости с существующим механизмом импорта
          const supplierAsEcho = {
            id: supplier.id,
            supplier_info: {
              name: supplier.name,
              company_name: supplier.company_name || supplier.name,
              legal_name: supplier.company_name || supplier.name,
              inn: supplier.inn || '',
              kpp: supplier.kpp || '',
              ogrn: supplier.ogrn || '',
              address: supplier.address || '',
              bank_name: supplier.bank_name || '',
              bank_account: supplier.bank_account || '',
              corr_account: supplier.corr_account || '',
              bik: supplier.bik || '',
              contact_email: supplier.contact_email,
              contact_phone: supplier.contact_phone,
              website: supplier.website || '',
              city: supplier.city,
              country: supplier.country,
              payment_type: 'bank-transfer'
            },
            // Данные для Step 4 - методы оплаты
            payment_methods: {
              bank: supplier.payment_methods?.bank || null,
              card: supplier.payment_methods?.card || null,
              crypto: supplier.payment_methods?.crypto || null,
              p2p: supplier.payment_methods?.p2p || null
            },
            // Данные для Step 5 - реквизиты
            requisites: {
              bank: supplier.payment_methods?.bank ? {
                bankName: supplier.payment_methods.bank.bank_name,
                recipientName: supplier.name,
                accountNumber: supplier.payment_methods.bank.account_number,
                swift: supplier.payment_methods.bank.swift_code,
                iban: supplier.payment_methods.bank.iban || '',
                transferCurrency: supplier.currency || 'RUB'
              } : null,
              card: supplier.payment_methods?.card ? {
                cardBank: supplier.payment_methods.card.bank,
                cardNumber: supplier.payment_methods.card.number,
                cardHolder: supplier.payment_methods.card.holder,
                cardExpiry: supplier.payment_methods.card.expiry || ''
              } : null,
              crypto: supplier.payment_methods?.crypto ? {
                cryptoName: supplier.payment_methods.crypto.network || 'ETH',
                cryptoAddress: supplier.payment_methods.crypto.address,
                cryptoNetwork: supplier.payment_methods.crypto.network || 'ETH'
              } : null
            },
            products: (supplier.catalog_user_products || supplier.catalog_verified_products) ? 
              (supplier.catalog_user_products || supplier.catalog_verified_products).map((p: any) => ({
                id: p.id,
                item_name: p.name,
                item_code: p.sku || '',
                quantity: '1',
                price: p.price || '0',
                currency: p.currency || 'USD',
                total: p.price || '0',
                description: p.description || '',
                category: p.category || '',
                image_url: p.images && p.images[0] ? p.images[0] : ''
              })) : [],
            statistics: { 
              success_rate: 0,
              total_spent: 0, 
              products_count: (supplier.catalog_user_products || supplier.catalog_verified_products) ? 
                (supplier.catalog_user_products || supplier.catalog_verified_products).length : 0, 
              total_projects: 0, 
              successful_projects: 0, 
              last_project_date: '' 
            },
            extraction_info: { completeness_score: 100, needs_manual_review: false }
          };
          
          // Автоматически импортируем данные поставщика согласно архитектуре
          const selectedSteps = {
            step1: false, // НЕ импортируем данные компании поставщика как данные клиента
            step2: (supplier.catalog_user_products || supplier.catalog_verified_products) && 
                   (supplier.catalog_user_products || supplier.catalog_verified_products).length > 0, // Импортируем товары если есть
            step4: true, // Импортируем методы оплаты поставщика
            step5: true  // Импортируем реквизиты поставщика
          };
          
          fillSupplierData(supplierAsEcho as any, selectedSteps);
          
          // Устанавливаем имя проекта как название поставщика для удобства
          setProjectName(`Проект с ${supplier.name}`);
          
          // Если есть товары и projectId еще не создан, сохраняем их после создания проекта
          if (selectedSteps.step2 && (supplier.catalog_user_products || supplier.catalog_verified_products) && 
              (supplier.catalog_user_products || supplier.catalog_verified_products).length > 0 && !projectId) {
            // Сохраняем товары в localStorage для последующего сохранения
            const itemsToSave = supplier.catalog_user_products.map((p: any) => ({
              name: p.name,
              code: p.sku || '',
              quantity: 1,
              unit: 'шт',
              pricePerUnit: p.price || 0,
              totalPrice: p.price || 0,
              description: p.description || '',
              image_url: p.images && p.images[0] ? p.images[0] : ''
            }));
            localStorage.setItem('pendingSupplierItems', JSON.stringify(itemsToSave));
          }
          
        } else {
          logger.warn("[SupplierLoader] Поставщик не найден:", supplierId);
        }
      } catch (error) {
        logger.error("[SupplierLoader] Ошибка загрузки поставщика:", error);
      } finally {
        setIsSupplierLoading(false);
      }
    }

    loadSupplierData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, supplierName, mode, projectId]);

  if (isSupplierLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Загрузка данных поставщика...</p>
      </div>
    );
  }
  
  return null;
}
