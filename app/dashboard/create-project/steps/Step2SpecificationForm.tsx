import React, { useState, useRef, useEffect } from "react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, UploadCloud, FileText, Save, Package, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useProjectSupabase } from "../hooks/useProjectSupabase";
import { useSaveTemplate, useProjectTemplates } from "../hooks/useSaveTemplate";
import { useToast } from "@/components/ui/use-toast";
import { useTelegramNotifications } from '../hooks/useTelegramNotifications';
import { sendTelegramMessageClient, sendTelegramDocumentClient } from '@/lib/telegram-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useProjectSpecification } from "../hooks/useProjectSpecification";
import { useProjectInvoices, ProjectInvoice } from "../hooks/useProjectInvoices";
import { useRouter } from "next/navigation";
import { changeProjectStatus } from "@/lib/supabaseProjectStatus";
import CatalogModal from "../components/CatalogModal";
import ProformaSelectionModal from "../components/ProformaSelectionModal";

const CURRENCY = "USD";

// Функция для очистки имени файла и частей пути
function sanitizeFileName(filename: string) {
  return filename
    .normalize('NFD')
    .replace(/[^\w.-]+/g, '_') // только латиница, цифры, _ . -
    .replace(/_+/g, '_') // несколько _ подряд в один
    .replace(/^_+|_+$/g, '') // убираем _ в начале и конце
    .substring(0, 50); // ограничиваем длину имени файла
}

// --- ВСТАВКА: TemplateSelectModal ---
function TemplateSelectModal({ open, onClose, onSelect }: { open: boolean, onClose: () => void, onSelect: (template: any) => void }) {
  const { templates, loading, error, fetchTemplates } = useProjectTemplates();
  useEffect(() => { if (open) fetchTemplates(); }, [open]);
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Выберите шаблон</DialogTitle>
        </DialogHeader>
        {loading && <div className="text-center py-8">Загрузка...</div>}
        {error && <div className="text-red-500 text-center py-8">{error}</div>}
        {!loading && !error && (
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
            {templates.length === 0 && <div className="text-gray-500 text-center">Нет сохранённых шаблонов</div>}
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
                <div className="text-sm text-gray-500">{template.description || ''}</div>
                <div className="text-xs text-gray-400">ID: {template.id}</div>
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
// --- КОНЕЦ ВСТАВКИ ---

export default function Step2SpecificationForm({ isTemplateMode = false }: { isTemplateMode?: boolean }) {
  const { projectId, setCurrentStep, companyData, setCompanyData, maxStepReached, setMaxStepReached, setSupplierData } = useCreateProjectContext();
  const [invoiceType, setInvoiceType] = useState<'create' | 'upload'>("create");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveSpecification, loadSpecification, updateStep, saveSupplierData } = useProjectSupabase();
  const { saveTemplate, isSaving, error: saveTemplateError, success } = useSaveTemplate();
  const { toast } = useToast();
  const { sendSpecificationToTelegram } = useTelegramNotifications();
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const [projectStatus, setProjectStatus] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const router = useRouter();
  const { saveProjectTemplate } = useProjectTemplates();
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  
  // ДОБАВЛЯЕМ: состояние для отслеживания загрузки изображений по каждому элементу
  const [uploadingImages, setUploadingImages] = useState<{ [id: string]: boolean }>({});
  
  // ДОБАВЛЯЕМ: состояние для каталога
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // ДОБАВЛЯЕМ: состояние для модала проформ поставщиков
  const [showProformaModal, setShowProformaModal] = useState(false);
  
  // ДОБАВЛЯЕМ: состояние для показа заполненной формы после анализа
  const [showFilledForm, setShowFilledForm] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
  
  // --- Новый хук для спецификации ---
  // TODO: определять роль динамически (например, из контекста или параметра)
  const role: 'client' | 'supplier' = 'client';
  const { items: specificationItems, loading: specLoading, fetchSpecification, addItem, addItems, updateItem, deleteItem } = useProjectSpecification(projectId, role);

  // --- Новый хук для инвойсов ---
  const { invoices, fetchInvoices, addInvoice, deleteInvoice, loading: invoicesLoading } = useProjectInvoices(projectId || '', role);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Восстановление второго шага при открытии проекта из дашборда
  useEffect(() => {
    async function restoreStep2() {
      if (!projectId) return;
      const data = await loadSpecification(projectId);
      console.log('[LOG:restoreStep2] projectId:', projectId, 'data из Supabase:', data);
      if (data) {
        setCompanyData(data.company_data || {});
        // --- Новая логика перехода на шаг 3, если проект уже одобрен ---
        if (data.status === 'waiting_receipt' || data.status === 'receipt_approved') {
          setCurrentStep(3);
          return;
        }
        // Если проект отклонён — можно добавить переход или уведомление
        if (data.status === 'rejected') {
          setIsWaitingApproval(false);
          setProjectStatus('rejected');
          return;
        }
      } else {
        setError("Не удалось загрузить данные проекта. Попробуйте обновить страницу.");
      }
    }
    restoreStep2();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // --- Новый useEffect для восстановления режима ожидания ---
  useEffect(() => {
    async function checkWaitingApproval() {
      if (!projectId) return;
      const data = await loadSpecification(projectId);
      if (data && (data.status === 'waiting_receipt' || data.status === 'waiting_approval')) {
        setIsWaitingApproval(true);
        setProjectStatus(data.status);
      }
    }
    checkWaitingApproval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Гарантируем загрузку спецификации из Supabase при монтировании и при возврате на шаг 2
  useEffect(() => {
    if (!projectId) return;
    fetchSpecification();
  }, [projectId]);

  // Debounce-таймеры для каждого item
  const debounceTimers = useRef<{ [id: string]: NodeJS.Timeout }>({});
  const recentlyUpdatedTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Новый локальный state для редактируемых значений ---
  const [localEdits, setLocalEdits] = useState<{ [id: string]: any }>({});
  const [lastIds, setLastIds] = useState<string[]>([]);

  // Сбрасываем локальные правки, если изменился состав строк (id)
  useEffect(() => {
    const ids = specificationItems.map((i:any)=>i.id).sort();
    if (JSON.stringify(ids) !== JSON.stringify(lastIds)) {
      setLocalEdits({});
      setLastIds(ids);
    }
  }, [specificationItems]);

  // При изменении поля — только обновляем локальный state
  const handleLocalItemChange = (id: string, field: string, value: any) => {
    setLocalEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        total: field === 'quantity' || field === 'price'
          ? (Number(field === 'quantity' ? value : (prev[id]?.quantity ?? specificationItems.find((i:any)=>i.id===id)?.quantity ?? 0)) || 0) *
            (Number(field === 'price' ? value : (prev[id]?.price ?? specificationItems.find((i:any)=>i.id===id)?.price ?? 0)) || 0)
          : (prev[id]?.total ?? specificationItems.find((i:any)=>i.id===id)?.total ?? 0)
      }
    }));
  };

  // По blur — отправляем update в Supabase и обновляем список
  const handleItemBlur = async (id: string) => {
    const original = specificationItems.find((i:any)=>i.id===id);
    const edited = localEdits[id];
    if (!original || !edited) return;
    const changed = Object.keys(edited).some(key => edited[key] !== original[key]);
    if (changed) {
      await updateItem(id, { ...original, ...edited });
      await fetchSpecification();
      if (projectId) await saveSpecification({ projectId, currentStep: 2 });
      await updateProjectAmountAndCurrency(); // Обновляем amount/currency
    }
    setLocalEdits(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const getFieldValue = (id: string, field: string) => {
    if (localEdits[id] && localEdits[id][field] !== undefined) return localEdits[id][field];
    const item = specificationItems.find((i:any)=>i.id===id);
    return item ? item[field] : '';
  };

  // Итоговая сумма
  const total = specificationItems.reduce((sum, item) => {
    const quantity = getFieldValue(item.id, 'quantity') || 0;
    const price = getFieldValue(item.id, 'price') || 0;
    return sum + (Number(quantity) * Number(price));
  }, 0);

  // Функция для обновления amount и currency в проекте
  const updateProjectAmountAndCurrency = async () => {
    if (!projectId) return;
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          amount: total,
          currency: CURRENCY,
          email: companyData?.email || null,
        })
        .eq("id", projectId);
      if (error) {
        console.error("[ERROR] Не удалось обновить amount/currency в проекте:", error);
      } else {
        console.log("[DEBUG] amount/currency обновлены в проекте:", { amount: total, currency: CURRENCY });
      }
    } catch (err) {
      console.error("[ERROR] Ошибка обновления amount/currency:", err);
    }
  };

  // Polling статуса проекта после отправки на проверку
  useEffect(() => {
    if (!isWaitingApproval || !projectId) return;
    // Функция для проверки статуса
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();
      if (!error && data && data.status) {
        setProjectStatus(data.status);
        if (data.status === 'waiting_receipt') {
          setIsWaitingApproval(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          // После одобрения обновляем currentStep на 3
          const nextStep = 3;
          setCurrentStep(nextStep);
          if (nextStep > maxStepReached) {
            setMaxStepReached(nextStep);
            if (projectId) await updateStep(projectId, nextStep, nextStep);
          } else if (projectId) {
            await updateStep(projectId, nextStep);
          }
        }
        if (data.status === 'rejected') {
          setIsWaitingApproval(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({ title: 'Проект отклонён менеджером', description: 'Пожалуйста, обратитесь в поддержку для уточнения причин.', variant: 'destructive' });
        }
      }
    };
    pollingRef.current = setInterval(checkStatus, 4000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWaitingApproval, projectId]);

  // --- Автозаполнение specification_id в проекте ---
  async function ensureSpecificationId() {
    if (!projectId) return;
    // Получаем текущий проект
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('specification_id')
      .eq('id', projectId)
      .single();
    if (projectError) return;
    if (!projectData?.specification_id) {
      // Получаем первую позицию спецификации
      const { data: specData } = await supabase
        .from('project_specifications')
        .select('id')
        .eq('project_id', projectId)
        .eq('role', role)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (specData?.id) {
        await supabase.from('projects').update({ specification_id: specData.id }).eq('id', projectId);
        console.log('[ensureSpecificationId] specification_id автозаполнен:', specData.id);
      }
    }
  }

  // Отправить на проверку (сохраняет и переводит на следующий шаг)
  const handleSubmit = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      // Получаем текущий статус проекта
      const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
      if (fetchError) throw new Error(fetchError.message);
      // Если проект в draft — сначала переводим в in_progress
      if (project.status === "draft") {
        await changeProjectStatus({
          projectId,
          newStatus: "in_progress",
          changedBy: "client",
          comment: "Начало заполнения спецификации",
        });
      }
      // Теперь переводим в waiting_approval
      await changeProjectStatus({
        projectId,
        newStatus: "waiting_approval",
        changedBy: "client",
        comment: "Отправлено на проверку",
      });
    } catch (e: any) {
      setError('Ошибка смены статуса: ' + (e.message || e.toString()));
      setIsLoading(false);
      return;
    }
    await ensureSpecificationId();
    
    // Получаем URL загруженного инвойса, если тип - upload
    let invoiceFileUrl = null;
    if (invoiceType === 'upload' && invoices.length > 0) {
      invoiceFileUrl = invoices[0].file_url; // Берем первый загруженный инвойс
    }
    
    // Используем всегда актуальные данные из specificationItems
    try {
    await sendSpecificationToTelegram({
      projectName: companyData?.name || '',
      specificationItems: specificationItems,
      currency: CURRENCY,
      invoiceType,
        invoiceFileUrl,
      projectId,
    });
    } catch (telegramError) {
      console.warn('⚠️ Telegram недоступен, но проект сохранен:', telegramError);
      // Показываем предупреждение вместо ошибки
      toast({
        title: "⚠️ Уведомление",
        description: "Спецификация сохранена в базе данных. Уведомление в Telegram не отправлено из-за технических проблем. Обратитесь к менеджеру для проверки проекта.",
        variant: "default"
      });
    }
    setIsWaitingApproval(true);
    setIsLoading(false);
  };

  // --- Получение актуальных данных компании из Supabase ---
  async function getActualCompanyData() {
    if (projectId) {
      const { data, error } = await supabase
        .from('projects')
        .select('company_data')
        .eq('id', projectId)
        .single();
      if (!error && data && data.company_data) {
        return data.company_data;
      }
    }
    return companyData;
  }

  // Сохранить шаблон
  const handleSaveSpecOnly = async () => {
    const actualCompanyData = await getActualCompanyData();
    await saveProjectTemplate({
      name: actualCompanyData?.name ? `Шаблон: ${actualCompanyData.name}` : "Шаблон спецификации",
      description: "",
      companyData: actualCompanyData,
      specification: specificationItems,
      role: 'client',
    });
    setShowSaveDialog(false);
    toast({ title: "Шаблон спецификации успешно сохранён!", variant: "default" });
  };
  const handleSaveCompanyAndSpec = async () => {
    const actualCompanyData = await getActualCompanyData();
    await saveProjectTemplate({
      name: actualCompanyData?.name ? `Шаблон: ${actualCompanyData.name}` : "Шаблон спецификации",
      description: "",
      companyData: actualCompanyData,
      specification: specificationItems,
      role: 'client',
    });
    setShowSaveDialog(false);
    toast({ title: "Шаблон (компания + спецификация) успешно сохранён!", variant: "default" });
  };

  // Загрузка инвойса
  const handleInvoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setIsUploading(true);
    setError(null);
    
    try {
      const sender = sanitizeFileName(companyData?.name || 'unknown');
      const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const timestamp = Date.now();
      const cleanName = sanitizeFileName(file.name);
      const filePath = `invoices/${projectId}/${date}_${timestamp}_${sender}_${cleanName}`;
      
      console.log("📤 Загружаем файл в Supabase Storage...");
      console.log("📁 Путь:", filePath);
      console.log("📄 Файл:", file.name, "Размер:", file.size, "Тип:", file.type);
      
      // Проверяем, существует ли файл
      const { data: existingFile } = await supabase.storage
        .from("step2-ready-invoices")
        .list(`invoices/${projectId}`, {
          search: cleanName
        });
      
      if (existingFile && existingFile.length > 0) {
        console.log("⚠️ Файл с похожим именем уже существует, используем уникальный путь");
      }
      
      const { data, error } = await supabase.storage.from("step2-ready-invoices").upload(filePath, file, {
        upsert: true // Перезаписываем файл, если он уже существует
      });
      if (error) {
        console.error("❌ Ошибка загрузки в Supabase Storage:", error);
        setError(`Ошибка загрузки файла: ${error.message}`);
        setIsUploading(false);
        return;
      }
      
      console.log("✅ Файл успешно загружен в Storage:", data);
      
      const { data: urlData } = supabase.storage.from("step2-ready-invoices").getPublicUrl(filePath);
      const fileUrl = (urlData?.publicUrl as string) || "";
      
      console.log("🔗 Публичный URL:", fileUrl);
      
      if (!fileUrl) {
        setError("Не удалось получить публичную ссылку на файл");
        setIsUploading(false);
        return;
      }
      
      try {
        await addInvoice(fileUrl, role);
        console.log("✅ Инвойс добавлен в базу данных");
      } catch (addError) {
        console.error("❌ Ошибка добавления инвойса в БД:", addError);
        setError("Файл загружен, но не удалось сохранить в базе данных");
        setIsUploading(false);
        return;
      }

      // 🔍 АНАЛИЗ ИНВОЙСА С ПОМОЩЬЮ YANDEX VISION
      let extractedData = null;
      let analysisText = "";
      
      try {
        console.log("🔍 Начинаем анализ инвойса с Yandex Vision...");
        
        const analysisResponse = await fetch('/api/document-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: fileUrl,
            fileType: file.type,
            documentType: 'invoice'
          })
        });

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          extractedData = analysisResult.suggestions;
          analysisText = analysisResult.extractedText;
          
          console.log("✅ Данные инвойса извлечены:", extractedData);
        console.log("📊 Детали извлеченных данных:");
        console.log("   - invoiceInfo:", extractedData.invoiceInfo);
        console.log("   - items count:", extractedData.items?.length || 0);
        console.log("   - items:", extractedData.items);
          
          // Автозаполнение спецификации извлеченными данными
          if (extractedData && extractedData.items && extractedData.items.length > 0) {
            // Очищаем существующие позиции
            for (const item of specificationItems) {
              await deleteItem(item.id);
            }
            
            // Добавляем новые позиции из инвойса
            for (const invoiceItem of extractedData.items) {
              await addItem({
                item_name: invoiceItem.name || "Товар из инвойса",
                item_code: invoiceItem.code || "",
                image_url: "",
                quantity: Number(invoiceItem.quantity) || 1,
                unit: "шт", // Стандартная единица измерения
                price: Number(invoiceItem.price) || 0,
                total: Number(invoiceItem.total) || 0,
              });
            }
            
            // Обновляем спецификацию
            await fetchSpecification();
            await updateProjectAmountAndCurrency();
            
            // Показываем уведомление об автозаполнении
            const totalAmount = extractedData.invoiceInfo?.totalAmount || 
              extractedData.items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
            
            toast({ 
              title: "✅ Инвойс проанализирован", 
              description: `Добавлено ${extractedData.items.length} позиций на сумму ${totalAmount} руб. Проверьте и при необходимости отредактируйте.`, 
              variant: "default" 
            });
          } else {
            // Если товары не найдены, показываем информацию об инвойсе
            if (extractedData && extractedData.invoiceInfo) {
              toast({ 
                title: "📄 Инвойс загружен", 
                description: `Найдена информация об инвойсе, но товары не извлечены. Добавьте позиции вручную.`, 
                variant: "default" 
              });
            }
          }
        } else {
          console.warn("⚠️ Анализ инвойса не удался, но файл загружен");
        }
      } catch (analysisError) {
        console.error("❌ Ошибка анализа инвойса:", analysisError);
        // Не прерываем загрузку файла, если анализ не удался
      }

      // Отправляем расширенное сообщение в Telegram
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user_email = userData?.user?.email || "(email не найден)";
        
        let tgText = `📄 Загружен инвойс для проекта ${projectId}\n\nКомпания: ${companyData?.name || '—'}\nEmail: ${user_email}\nФайл: ${fileUrl}`;
        
        // Добавляем результаты анализа в сообщение
        if (extractedData && Object.keys(extractedData).length > 0) {
          tgText += `\n\n🔍 ИЗВЛЕЧЕННЫЕ ДАННЫЕ:\n`;
          
          // Информация об инвойсе
          if (extractedData.invoiceInfo) {
            if (extractedData.invoiceInfo.number) tgText += `Номер: ${extractedData.invoiceInfo.number}\n`;
            if (extractedData.invoiceInfo.date) tgText += `Дата: ${extractedData.invoiceInfo.date}\n`;
            if (extractedData.invoiceInfo.seller) tgText += `Поставщик: ${extractedData.invoiceInfo.seller}\n`;
            if (extractedData.invoiceInfo.buyer) tgText += `Покупатель: ${extractedData.invoiceInfo.buyer}\n`;
            if (extractedData.invoiceInfo.totalAmount) tgText += `Сумма: ${extractedData.invoiceInfo.totalAmount} ${extractedData.invoiceInfo.currency || 'руб'}\n`;
            if (extractedData.invoiceInfo.vat) tgText += `НДС: ${extractedData.invoiceInfo.vat}\n`;
          }
          
          // Старая структура для обратной совместимости
          if (extractedData.totalAmount) tgText += `Общая сумма: ${extractedData.totalAmount} ${extractedData.currency || 'руб'}\n`;
          
          if (extractedData.items && extractedData.items.length > 0) {
            tgText += `\n📋 ПОЗИЦИИ (${extractedData.items.length}):\n`;
            extractedData.items.slice(0, 5).forEach((item: any, index: number) => {
              tgText += `${index + 1}. ${item.name || 'Товар'} - ${item.quantity} x ${item.price} = ${item.total}\n`;
            });
            if (extractedData.items.length > 5) {
              tgText += `... и еще ${extractedData.items.length - 5} позиций\n`;
            }
          }
        }
        
        if (analysisText) {
          tgText += `\n📄 ПОЛНЫЙ ТЕКСТ ИНВОЙСА:\n${analysisText.substring(0, 500)}${analysisText.length > 500 ? '...' : ''}`;
        }

        // Отправляем в Telegram
        const isImage = /\.(jpg|jpeg|png)$/i.test(file.name);
        if (isImage) {
          await sendTelegramDocumentClient(fileUrl, tgText);
        } else {
          await sendTelegramMessageClient(tgText);
        }
        
        toast({ 
          title: "Инвойс загружен", 
          description: extractedData ? "Инвойс проанализирован и позиции добавлены!" : "Файл отправлен менеджеру.", 
          variant: "default" 
        });
      } catch (telegramError) {
        console.error("❌ Ошибка отправки в Telegram:", telegramError);
      }
      
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
      // Показываем успешное уведомление, если не было ошибок
      if (!error) {
        toast({ 
          title: "✅ Файл загружен", 
          description: `Файл "${file.name}" успешно загружен и готов к анализу.`, 
          variant: "default" 
        });
      }
    }
  };
  const handleRemoveInvoiceFile = async (invoiceId: string) => {
    await deleteInvoice(invoiceId);
  };

  // ДОБАВЛЯЕМ: функция для анализа файла и показа заполненной формы
  const handleAnalyzeInvoiceFile = async (invoice: ProjectInvoice) => {
    console.log("🚀 НАЧИНАЕМ handleAnalyzeInvoiceFile для:", invoice);
    console.log("🔧 ProjectId:", projectId);
    console.log("🔧 Role:", role);
    console.log("🔧 SpecificationItems count:", specificationItems?.length || 0);
    
    setAnalyzingFile(invoice.id);
    setError(null);
    
    try {
      console.log("🔍 Начинаем анализ инвойса для показа формы...");
      
      // Определяем тип файла по URL или используем универсальный подход
      let fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; // По умолчанию DOCX
      
      if (invoice.file_url.toLowerCase().includes('.xlsx')) {
        fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (invoice.file_url.toLowerCase().includes('.docx')) {
        fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (invoice.file_url.toLowerCase().includes('.pdf')) {
        fileType = 'application/pdf';
      } else if (invoice.file_url.toLowerCase().includes('.jpg') || invoice.file_url.toLowerCase().includes('.jpeg')) {
        fileType = 'image/jpeg';
      } else if (invoice.file_url.toLowerCase().includes('.png')) {
        fileType = 'image/png';
      }
      
      console.log("📄 Определенный тип файла:", fileType);
      console.log("🌐 URL файла:", invoice.file_url);
      
      console.log("🚀 ОТПРАВЛЯЕМ ЗАПРОС К API...");
      const analysisResponse = await fetch('/api/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: invoice.file_url,
          fileType: fileType,
          documentType: 'invoice'
        })
      });
      
      console.log("📡 Ответ от сервера получен. Status:", analysisResponse.status);

      if (analysisResponse.ok) {
        console.log("✅ Ответ от API успешный!");
        const responseText = await analysisResponse.text();
        console.log("🔍 СЫРОЙ ОТВЕТ ОТ API:", responseText);
        
        const analysisResult = JSON.parse(responseText);
        console.log("🔍 ПАРСИНГ ОТВЕТА:", analysisResult);
        const extractedData = analysisResult.suggestions;
        
        console.log("✅ Данные инвойса извлечены для показа:", extractedData);
        console.log("📊 Детали извлеченных данных для показа:");
        console.log("   - invoiceInfo:", extractedData?.invoiceInfo);
        console.log("   - items count:", extractedData?.items?.length || 0);
        console.log("   - items:", extractedData?.items);
        console.log("   - extractedText length:", analysisResult.extractedText?.length || 0);
        console.log("   - extractedText preview:", analysisResult.extractedText?.substring(0, 200));
        
        // Автозаполнение спецификации извлеченными данными
        if (extractedData && extractedData.items && extractedData.items.length > 0) {
          console.log("🎯 НАЧИНАЕМ АВТОЗАПОЛНЕНИЕ! Количество позиций:", extractedData.items.length);
          
          // Очищаем существующие позиции
          console.log("🗑️ Очищаем существующие позиции...", specificationItems);
          for (const item of specificationItems) {
            console.log("🗑️ Удаляем позицию:", item.id);
            await deleteItem(item.id);
          }
          
          console.log("✅ Существующие позиции очищены");
          
          // Добавляем новые позиции из инвойса
          console.log("➕ Добавляем новые позиции из инвойса...");
          for (let i = 0; i < extractedData.items.length; i++) {
            const invoiceItem = extractedData.items[i];
            console.log(`➕ Добавляем позицию ${i+1}/${extractedData.items.length}:`, invoiceItem);
            
            const itemToAdd = {
              item_name: invoiceItem.name || "Товар из инвойса",
              item_code: invoiceItem.code || "",
              image_url: "",
              quantity: Number(invoiceItem.quantity) || 1,
              unit: "шт", // Стандартная единица измерения
              price: Number(invoiceItem.price) || 0,
              total: Number(invoiceItem.total) || 0,
            };
            
            console.log(`📄 Структура позиции для добавления:`, itemToAdd);
            
            try {
              await addItem(itemToAdd);
              console.log(`✅ Позиция ${i+1} добавлена успешно`);
            } catch (addError) {
              console.error(`❌ Ошибка добавления позиции ${i+1}:`, addError);
            }
          }
          
          console.log("✅ Все позиции из инвойса добавлены");
          
          // Обновляем спецификацию
          console.log("🔄 Обновляем спецификацию...");
          await fetchSpecification();
          console.log("🔄 Обновляем сумму проекта...");
          await updateProjectAmountAndCurrency();
          
          console.log("✅ Спецификация и сумма обновлены");
          
          // Переключаемся на режим создания для показа заполненной формы
          console.log("🎨 Переключаемся на режим создания формы...");
          setInvoiceType('create');
          setShowFilledForm(true);
          
          // Показываем уведомление об успешном анализе
          const totalAmount = extractedData.invoiceInfo?.totalAmount || 
            extractedData.items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
          
          console.log("🎉 Показываем toast уведомление...");
          toast({ 
            title: "✅ Форма заполнена!", 
            description: `Добавлено ${extractedData.items.length} позиций на сумму ${totalAmount} руб. Проверьте и при необходимости отредактируйте данные.`, 
            variant: "default" 
          });
          
          // Прокручиваем к форме
          console.log("📜 Прокручиваем к форме...");
          setTimeout(() => {
            const formElement = document.querySelector('[data-form-section="specification"]');
            console.log("📜 Элемент формы найден:", formElement);
            if (formElement) {
              formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              console.log("📜 Прокрутка выполнена");
            }
          }, 100);
          
        } else {
          toast({ 
            title: "📄 Анализ завершен", 
            description: "Информация об инвойсе найдена, но товары не извлечены. Добавьте позиции вручную.", 
            variant: "default" 
          });
        }
      } else {
        console.warn("⚠️ Анализ инвойса не удался");
        toast({ 
          title: "❌ Ошибка анализа", 
          description: "Не удалось проанализировать файл. Попробуйте другой файл или добавьте позиции вручную.", 
          variant: "destructive" 
        });
      }
    } catch (analysisError) {
      console.error("❌ Ошибка анализа инвойса:", analysisError);
      toast({ 
        title: "❌ Ошибка анализа", 
        description: "Произошла ошибка при анализе файла. Попробуйте позже.", 
        variant: "destructive" 
      });
    } finally {
      setAnalyzingFile(null);
    }
  };

  // Диагностика: логируем спецификацию при каждом изменении
  useEffect(() => {
    console.log('[DIAG] projectId:', projectId, 'role:', role, 'specificationItems:', specificationItems);
  }, [projectId, role, specificationItems]);

  useEffect(() => {
    console.log('[DIAG:specificationItems]', specificationItems);
    specificationItems.forEach((item, idx) => {
      console.log(`[DIAG:image_url][${idx}]`, item.image_url);
    });
  }, [specificationItems]);

  // --- Bulk insert спецификации и обновление specification_id в проекте ---
  async function bulkInsertSpecification(items: any[]) {
    if (!projectId) return;
    const specId = await addItems(items);
    if (specId) {
      await supabase.from('projects').update({ specification_id: specId }).eq('id', projectId);
      console.log('[bulkInsertSpecification] specification_id сохранён в проект:', specId);
    }
  }

  const handleTemplateSelect = async (template: any) => {
    setShowTemplateSelect(false);
    let spec = null;
    if (template.data?.specification) {
      spec = template.data.specification;
    } else if (template.specification) {
      spec = template.specification;
    }
    if (!spec || !Array.isArray(spec) || spec.length === 0) {
      toast({ title: 'Ошибка', description: 'В шаблоне не найдена спецификация', variant: 'destructive' });
      return;
    }
    // Фильтруем только осмысленные позиции
    const filteredSpec = spec.filter((item: any) =>
      (item.item_name && item.item_name.trim() !== "") ||
      Number(item.quantity) > 0 ||
      Number(item.price) > 0
    );
    await bulkInsertSpecification(filteredSpec.map((item: any) => ({
      item_name: item.item_name || item.name || '',
      item_code: item.item_code || item.code || '',
      quantity: Number(item.quantity) || 0,
      unit: item.unit || 'шт',
      price: Number(item.price) || 0,
      total: Number(item.total) || (Number(item.price) * Number(item.quantity)) || 0,
      image_url: item.image_url || item.image || '',
    })));
    await fetchSpecification();
    await ensureSpecificationId();
    await updateProjectAmountAndCurrency(); // Обновляем amount/currency
  };

  // Кнопка "Добавить позицию" теперь вызывает addItem напрямую
  const handleAddItem = async () => {
    await addItem({
      item_name: "",
      item_code: "",
      image_url: "",
      quantity: 0,
      unit: "шт",
      price: 0,
      total: 0,
    });
    await fetchSpecification();
    await ensureSpecificationId();
    if (projectId) await saveSpecification({ projectId, currentStep: 2 });
    await updateProjectAmountAndCurrency(); // Обновляем amount/currency
  };

  // Удаление позиции
  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
    await fetchSpecification();
    if (projectId) await saveSpecification({ projectId, currentStep: 2 });
  };

  // Обработчик выбора товаров из каталога
  const handleCatalogSelect = async (products: any[]) => {
    console.log('🎯 [Step2] Получены товары из каталога:', products);
    
    // 🎯 ЗАГРУЖАЕМ ДАННЫЕ ПОСТАВЩИКА ДЛЯ АВТОЗАПОЛНЕНИЯ ШАГОВ 4-5
    if (products.length > 0 && products[0].supplier_id) {
      const supplierId = products[0].supplier_id;
      const supplierName = products[0].supplier_name || 'Неизвестный поставщик';
      console.log('🔍 [Step2] Загружаем данные поставщика для автозаполнения:', { supplierId, supplierName });
      
      try {
        // Определяем тип поставщика по room_type или пытаемся найти в обеих таблицах
        let fullSupplierData = null;
        
        // Сначала пытаемся найти в verified поставщиках
        const { data: verifiedSupplier, error: verifiedError } = await supabase
          .from('catalog_verified_suppliers')
          .select('id, name, company_name, category, country, city, payment_methods, bank_accounts, crypto_wallets, p2p_cards')
          .eq('id', supplierId)
          .single();
        
        if (verifiedSupplier && !verifiedError) {
          fullSupplierData = { ...verifiedSupplier, room_type: 'verified' };
          console.log('✅ [Step2] Поставщик найден в verified:', fullSupplierData);
        } else {
          // Если не найден в verified, ищем в user поставщиках
          const { data: userSupplier, error: userError } = await supabase
            .from('catalog_user_suppliers')
            .select('id, name, company_name, category, country, city, payment_methods, bank_accounts, crypto_wallets, p2p_cards')
            .eq('id', supplierId)
            .single();
          
          if (userSupplier && !userError) {
            fullSupplierData = { ...userSupplier, room_type: 'user' };
            console.log('✅ [Step2] Поставщик найден в user:', fullSupplierData);
          } else {
            console.warn('⚠️ [Step2] Поставщик не найден в обеих таблицах:', { verifiedError, userError });
          }
        }
        
        // Сохраняем данные поставщика в контекст и БД для автозаполнения
        if (fullSupplierData) {
          console.log('💾 [Step2] Сохраняем данные поставщика в контекст для Steps 4-5');
          setSupplierData(fullSupplierData);
          
          // 🎯 СОХРАНЯЕМ В БД ДЛЯ ВОССТАНОВЛЕНИЯ ПРИ ОБНОВЛЕНИИ СТРАНИЦЫ
          if (projectId) {
            console.log('💾 [Step2] Сохраняем данные поставщика в БД');
            const supplierType = fullSupplierData.room_type === 'verified' ? 'catalog_verified' : 'catalog_user';
            // Не передаем supplierId чтобы избежать foreign key constraint error
            await saveSupplierData(projectId, fullSupplierData, undefined, supplierType);
          }
        }
        
      } catch (error) {
        console.error('❌ [Step2] Ошибка загрузки данных поставщика:', error);
      }
    }
    
    // Преобразуем товары каталога в формат спецификации
    const specItems = products.map(product => ({
      item_name: product.item_name || product.name || 'Товар из каталога',
      item_code: product.item_code || product.sku || '',
      quantity: product.quantity || 1,
      unit: 'шт',
      price: parseFloat(product.price) || 0,
      currency: product.currency || 'USD',
      total: (parseFloat(product.price) || 0) * (product.quantity || 1),
      supplier_name: product.supplier_name || 'Поставщик из каталога',
      image_url: product.image_url || product.images?.[0] || '',
      category_name: product.category_name || 'Из каталога',
      subcategory_name: product.subcategory_name
      // catalog_product_id временно отключен из-за foreign key ошибок
    }));
    
    console.log('🔍 [Step2] Преобразованные товары для addItems:', specItems);
    console.log('🔍 [Step2] Первый товар детально:', JSON.stringify(specItems[0], null, 2));
    
    // Добавляем товары в спецификацию
    try {
      const result = await addItems(specItems);
      console.log('✅ [Step2] Результат addItems:', result);
      await fetchSpecification();
      
      if (projectId) {
        await saveSpecification({ projectId, currentStep: 2 });
      }
      
      console.log(`✅ [Step2] Добавлено ${specItems.length} товаров в спецификацию`);
    } catch (error) {
      console.error('❌ [Step2] Ошибка в handleCatalogSelect:', error);
    }
  };

  // Загрузка изображения для позиции
  const handleImageUpload = async (id: string, file: File) => {
    setUploadingImages(prev => ({ ...prev, [id]: true }));
    try {
      // Проверяем, что у нас есть projectId
      if (!projectId) {
        throw new Error('ProjectId не найден');
      }

      // Проверяем размер файла (максимум 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error(`Файл слишком большой. Максимальный размер: 5MB`);
      }

      // Проверяем тип файла
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}`);
      }

      const sanitizedFileName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}_${sanitizedFileName}`;
      const filePath = `project_images/${projectId}/${fileName}`;
      
      console.log(`[DEBUG] Загружаем изображение для товара ${id}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: filePath,
        projectId: projectId
      });
      
      const { data, error } = await supabase.storage
        .from('project-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('[ERROR] Ошибка при загрузке файла:', {
          message: error.message,
          name: error.name
        });
        throw new Error(`Ошибка загрузки изображения: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Файл не был загружен (data is null)');
      }
      
      console.log(`[DEBUG] Файл загружен успешно:`, data);
      
      // Получаем публичную ссылку на файл
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);
      
      console.log(`[DEBUG] Публичная ссылка: ${publicUrl}`);
      
      // Обновляем image_url товара
      const updateResult = await updateItem(id, { image_url: publicUrl });
      console.log(`[DEBUG] Результат обновления товара:`, updateResult);
      
      await fetchSpecification();
      
      if (projectId) {
        await saveSpecification({ projectId, currentStep: 2 });
      }
      
      console.log(`[SUCCESS] Изображение успешно загружено для товара ${id}`);
      setError(null); // Очищаем ошибку при успехе
    } catch (err) {
      console.error('[ERROR] Неожиданная ошибка при загрузке изображения:', {
        error: err,
        message: err instanceof Error ? err.message : 'Неизвестная ошибка',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Неожиданная ошибка при загрузке изображения';
      setError(errorMessage);
    } finally {
      setUploadingImages(prev => ({ ...prev, [id]: false }));
    }
  };
  // Удаление изображения
  const handleImageDelete = async (id: string) => { 
    // ИСПРАВЛЕНИЕ: Сначала обновляем локальный стейт для мгновенного удаления
    setLocalEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        image_url: ""
      }
    }));
    
    // Затем обновляем в базе данных
    const original = specificationItems.find((i:any)=>i.id===id);
    if (original) {
      await updateItem(id, { ...original, image_url: "" });
      // Принудительно обновляем список из базы
      setTimeout(() => {
        fetchSpecification();
      }, 500);
    }
  };

  const getImageUrl = (id: string) => {
    if (localEdits[id] && localEdits[id]['image_url'] !== undefined) return localEdits[id]['image_url'];
    const item = specificationItems.find((i:any)=>i.id===id);
    return item ? item['image_url'] : '';
  };

  return (
    <div className="max-w-4xl mx-auto mt-16 text-gray-900">
      {/* Визуализация шагов шаблона - только в режиме создания шаблона */}
      {isTemplateMode && (
        <>
          <div className="flex items-center justify-center mb-10">
            {/* Кружок A1 - кликабельный */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => setCurrentStep(1)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold border-4 border-blue-400 shadow hover:bg-blue-700 hover:border-blue-500 transition-all duration-200 cursor-pointer"
              >
                I
              </button>
              <span className="mt-2 text-sm font-medium text-blue-700">A1</span>
              <span className="text-xs text-gray-500">Данные клиента</span>
            </div>
            {/* Линия */}
            <div className="w-12 h-1 bg-blue-400 mx-2 rounded" />
            {/* Кружок A2 - кликабельный */}
            <div className="flex flex-col items-center">
              <button 
                onClick={() => setCurrentStep(2)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold border-4 border-blue-400 shadow hover:bg-blue-700 hover:border-blue-500 transition-all duration-200 cursor-pointer"
              >
                II
              </button>
              <span className="mt-2 text-sm font-medium text-blue-700">A2</span>
              <span className="text-xs text-gray-500">Спецификация</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mb-4">💡 Кликните на любой шаг для перехода</p>
        </>
      )}
      
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Спецификация товаров</h3>
              <p className="text-blue-700 dark:text-blue-400">На этом шаге заполните данные спецификации. Добавьте необходимые позиции, укажите количество и цену.</p>
            </div>
          </div>
        </div>
        
        {/* Блок статуса проекта */}
        <div className={`rounded-xl p-6 mb-6 border shadow-sm ${
          isWaitingApproval 
            ? projectStatus === 'waiting_approval' 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-blue-200 dark:border-gray-600' 
              : projectStatus === 'rejected'
              ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900 dark:to-red-800 border-red-200 dark:border-red-600'
              : 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 border-slate-200 dark:border-gray-600'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-600'
        }`}>
          <div className="flex items-center gap-4">
            {isWaitingApproval ? (
              projectStatus === 'waiting_approval' ? (
                <>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-800">Ожидание одобрения менеджера</div>
                    <div className="text-sm text-blue-600">Спецификация отправлена на проверку. Ожидайте ответа.</div>
                  </div>
                </>
              ) : projectStatus === 'rejected' ? (
                <>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg font-bold">!</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-800">Проект отклонён</div>
                    <div className="text-sm text-red-600">Менеджер отклонил проект. Обратитесь в поддержку.</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg font-bold">✓</span>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-800">Готов к переходу</div>
                    <div className="text-sm text-blue-600">Спецификация одобрена. Можете перейти к следующему шагу.</div>
                  </div>
                </>
              )
            ) : (
              <>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">⚡</span>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-800 dark:text-green-300">В работе</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Заполните спецификацию и отправьте на проверку.</div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-6 border border-slate-200 dark:border-gray-600 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">Создание спецификации</h3>
              <p className="text-sm text-slate-600 dark:text-gray-400">Выберите способ формирования спецификации</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              type="button" 
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                invoiceType === 'create'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md'
                  : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-500 hover:shadow-sm'
              }`} 
              onClick={() => setInvoiceType('create')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  invoiceType === 'create' ? 'bg-blue-500' : 'bg-slate-100 dark:bg-gray-700'
                }`}>
                  <FileText className={`w-4 h-4 ${invoiceType === 'create' ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`} />
                </div>
                <div className="text-left">
                  <div className={`font-medium ${invoiceType === 'create' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-gray-300'}`}>
                    Создать новый
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Ручное добавление позиций</div>
                </div>
              </div>
            </button>
            
            <button 
              type="button" 
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                invoiceType === 'upload'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 shadow-md'
                  : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-500 hover:shadow-sm'
              }`} 
              onClick={() => setInvoiceType('upload')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  invoiceType === 'upload' ? 'bg-blue-500' : 'bg-slate-100 dark:bg-gray-700'
                }`}>
                  <UploadCloud className={`w-4 h-4 ${invoiceType === 'upload' ? 'text-white' : 'text-slate-600 dark:text-gray-300'}`} />
                </div>
                <div className="text-left">
                  <div className={`font-medium ${invoiceType === 'upload' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-gray-300'}`}>
                    Загрузить готовый
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">OCR анализ документа</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="relative p-4 rounded-xl border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-200"
              onClick={() => {
                setInvoiceType('create');
                setShowCatalogModal(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-700 dark:text-gray-300">
                    Добавить из каталога
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Добавить готовую позицию</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              className="relative p-4 rounded-xl border-2 border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-200"
              onClick={() => {
                setShowProformaModal(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-700 dark:text-gray-300">
                    Выбрать проформу
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">Проформы поставщиков</div>
                </div>
              </div>
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-blue-600">Загрузка...</div>
        ) : invoiceType === 'upload' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">Загрузка инвойса</h3>
                <p className="text-sm text-slate-600 dark:text-gray-400">Загрузите файл для автоматического анализа</p>
              </div>
            </div>
            
            <input type="file" accept=".pdf,.xls,.xlsx,.jpg,.jpeg,.png,.docx" className="hidden" ref={fileInputRef} onChange={handleInvoiceFileChange}/>
            
            <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-slate-400 dark:hover:border-gray-500 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-8 h-8 text-slate-600 dark:text-gray-300" />
              </div>
              <h4 className="text-lg font-medium text-slate-800 dark:text-gray-200 mb-2">Выберите файл инвойса</h4>
              
              {/* ⚠️ ВАЖНОЕ УВЕДОМЛЕНИЕ О ТАБЛИЧНОМ ФОРМАТЕ */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-4 text-left">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-amber-100 dark:bg-amber-800/50 rounded-full flex items-center justify-center mr-2">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs">⚠️</span>
                  </div>
                  <h5 className="font-medium text-amber-800 dark:text-amber-300">Загрузка готового инвойса</h5>
                </div>

                <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
                  <p className="flex items-start">
                    <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    <span>Автоматическое распознавание работает <strong>только с табличным форматом</strong> данных</span>
                  </p>
                  <p className="flex items-start">
                    <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    <span>Качество распознавания <strong>не гарантируется на 100%</strong> - требуется проверка</span>
                  </p>
                  <p className="flex items-start">
                    <span className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                    <span>Рекомендуется <strong>ручное заполнение</strong> для точного результата</span>
                  </p>
                </div>

                <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-800/30 border border-amber-300 dark:border-amber-600 rounded text-xs text-amber-800 dark:text-amber-300">
                  <strong>💡 Рекомендация:</strong> Используйте загрузку только для <strong>XLSX файлов</strong> с четкой табличной структурой товаров.
                </div>
              </div>
              <Button disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Загрузка...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Выбрать файл
                  </>
                )}
              </Button>
            </div>
            
            {invoicesLoading && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700">Загрузка файлов...</span>
                </div>
              </div>
            )}
            
            {invoices.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-slate-800 dark:text-gray-200 mb-3">Загруженные файлы</h4>
                <div className="space-y-2">
                  {invoices.map((inv: ProjectInvoice) => (
                    <div key={inv.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 p-3 rounded-lg border border-slate-200 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-800/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <a 
                          href={inv.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium truncate max-w-xs"
                        >
                          Просмотреть файл
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAnalyzeInvoiceFile(inv)}
                          disabled={analyzingFile === inv.id}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          {analyzingFile === inv.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                              Анализ...
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Проверить данные
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRemoveInvoiceFile(inv.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-gray-600 shadow-sm" data-form-section="specification">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-gray-200">Спецификация товаров</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400">Добавьте позиции в спецификацию</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800 dark:text-gray-200">{CURRENCY} {total.toFixed(2)}</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">Общая сумма</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-600">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Наименование</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Код</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Изображение</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Кол-во</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Ед. изм.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Цена за ед.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300">Сумма</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-gray-300"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-600">
                  {specificationItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <Input 
                          value={getFieldValue(item.id, 'item_name')} 
                          onChange={e=>handleLocalItemChange(item.id, 'item_name', e.target.value)} 
                          onBlur={()=>handleItemBlur(item.id)} 
                          className="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Название товара"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          value={getFieldValue(item.id, 'item_code')} 
                          onChange={e=>handleLocalItemChange(item.id, 'item_code', e.target.value)} 
                          onBlur={()=>handleItemBlur(item.id)} 
                          className="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Код"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {uploadingImages[item.id] ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-blue-600">Загрузка...</span>
                          </div>
                        ) : getImageUrl(item.id) && getImageUrl(item.id) !== "" ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={getImageUrl(item.id)} alt="img" className="w-12 h-12 object-cover rounded-lg border border-slate-200"/>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={()=>handleImageDelete(item.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Удалить
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e:any)=>{
                                const file = e.target.files[0];
                                if(file) handleImageUpload(item.id, file);
                              };
                              input.click();
                            }} 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            disabled={uploadingImages[item.id]}
                          >
                            Загрузить
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          min={0} 
                          value={getFieldValue(item.id, 'quantity')} 
                          onChange={e=>handleLocalItemChange(item.id, 'quantity', e.target.value)} 
                          onBlur={()=>handleItemBlur(item.id)} 
                          className="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-20"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          value={getFieldValue(item.id, 'unit')} 
                          onChange={e=>handleLocalItemChange(item.id, 'unit', e.target.value)} 
                          onBlur={()=>handleItemBlur(item.id)} 
                          className="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-16"
                          placeholder="шт"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          min={0} 
                          value={getFieldValue(item.id, 'price')} 
                          onChange={e=>handleLocalItemChange(item.id, 'price', e.target.value)} 
                          onBlur={()=>handleItemBlur(item.id)} 
                          className="bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 border-slate-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-24"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-gray-200">
                          {CURRENCY} {(getFieldValue(item.id, 'total') || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={()=>handleDeleteItem(item.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2"/>
                Добавить позицию
              </Button>
            </div>
          </div>
        )}
        <div className="flex justify-center items-center mt-8 gap-4">
          <Button
            variant="outline"
            className="rounded-xl border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 h-12 px-6 font-medium"
            onClick={() => setCurrentStep(1)}
          >
            ← Назад
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 h-12 px-6 font-medium" 
            onClick={() => setShowSaveDialog(true)} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Сохранить шаблон
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 h-12 px-6 font-medium" 
            onClick={() => setShowTemplateSelect(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Заполнить из шаблона
          </Button>
          {isWaitingApproval ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <div className="text-blue-600 dark:text-blue-400 font-semibold">Ожидание одобрения менеджера...</div>
              {projectStatus === 'waiting_receipt' && (
                <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white h-12 px-6" onClick={async () => {
                  const nextStep = 3;
                  setCurrentStep(nextStep);
                  if (nextStep > maxStepReached) {
                    setMaxStepReached(nextStep);
                    if (projectId) await updateStep(projectId, nextStep, nextStep);
                  } else if (projectId) {
                    await updateStep(projectId, nextStep);
                  }
                }}>
                  Перейти к следующему шагу
                </Button>
              )}
              {projectStatus === 'rejected' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-red-600 dark:text-red-400 font-semibold">Проект отклонён менеджером</div>
                  <div className="text-gray-700 dark:text-gray-300 text-sm mb-2">Пожалуйста, обратитесь в поддержку для уточнения причин.</div>
                  <a href="mailto:support@get2b.ru" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white h-12 px-6">Написать в поддержку</Button>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <Button
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center gap-2 h-12 px-8 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleSubmit}
              disabled={isWaitingApproval || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Отправка...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Отправить на проверку
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Что сохранить в шаблон?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button onClick={handleSaveSpecOnly} className="w-full">Только спецификацию</Button>
            <Button onClick={handleSaveCompanyAndSpec} className="w-full">Данные компании + спецификацию</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showTemplateSelect && (
        <TemplateSelectModal
          open={showTemplateSelect}
          onClose={() => setShowTemplateSelect(false)}
          onSelect={handleTemplateSelect}
        />
      )}
      {/* Дебаг-поле для вывода ошибок и логов */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm whitespace-pre-wrap">
          <b>DEBUG:</b> {error}
        </div>
      )}
      
      {/* Каталог товаров */}
      <CatalogModal
        open={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onAddProducts={handleCatalogSelect}
      />

      {/* Проформы поставщиков */}
      <ProformaSelectionModal
        open={showProformaModal}
        onClose={() => setShowProformaModal(false)}
        specificationItems={specificationItems}
        projectId={projectId || ''}
      />
      
      {/* Кнопка для тестирования загрузки изображения */}
      <div className="fixed bottom-4 right-4">
            <Button 
              variant="outline"
              size="sm"
              onClick={async () => {
            try {
              // Создаем тестовый файл
              const testContent = 'test image content';
              const testBlob = new Blob([testContent], { type: 'image/png' });
              const testFile = new File([testBlob], 'test.png', { type: 'image/png' });
              
              // Находим первый товар для тестирования
              const firstItem = specificationItems[0];
              if (firstItem) {
                console.log('🧪 Начинаем тест загрузки изображения...');
                console.log('Товар:', firstItem);
                console.log('Файл:', testFile);
                console.log('ProjectId:', projectId);
                
                await handleImageUpload(firstItem.id, testFile);
              } else {
                setError('Нет товаров для тестирования. Добавьте товар сначала.');
              }
            } catch (err) {
              console.error('Тест загрузки изображения:', err);
              setError(`Тест загрузки изображения: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
                }
              }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
          🧪 Тест загрузки изображения
            </Button>
          </div>

    </div>
  );
} 