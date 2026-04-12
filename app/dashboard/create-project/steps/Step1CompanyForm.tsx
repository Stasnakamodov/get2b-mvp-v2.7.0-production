import { db } from "@/lib/db/client"
import { logger } from "@/src/shared/lib/logger"
import React, { useState, useEffect, useRef } from "react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight, CheckCircle, Info, Save, UploadCloud, Users, Building } from "lucide-react";
import { motion } from "framer-motion";
import { useProjectTemplates } from "../hooks/useProjectTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useProjectSupabase } from "../hooks/useProjectSupabase";
import { sendTelegramMessageClient, sendTelegramDocumentClient, sendTelegramProjectApprovalRequestClient } from "@/lib/telegram-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useSupplierProfiles } from '@/hooks/useSupplierProfiles';
import { useRealtimeProjectData } from "../hooks/useRealtimeProjectData";
import { getStepByStatus } from '@/lib/types/project-status';
import { changeProjectStatus } from '@/lib/supabaseProjectStatus';
import { getCatalogSupplierType, hasSupplierRecommendations } from '@/lib/suppliers/loadCatalogSupplier';

export default function Step1CompanyForm(props: {
  isLoading?: boolean;
  isVerified?: boolean;
  isVerifying?: boolean;
  handleVerifyCompany?: () => void;
  setIsSaveDialogOpen?: (open: boolean) => void;
  isTemplateMode?: boolean;
}) {
  const { companyData, setCompanyData, projectName, setProjectName, setCurrentStep, setProjectId, projectId, maxStepReached, setMaxStepReached, startMethod, specificationItems, supplierData, setSupplierData } = useCreateProjectContext();
  const { isLoading, isVerified, isVerifying } = props;
  const [isSaveDialogOpen, setIsSaveDialogOpenState] = useState(false);
  const { saveProjectTemplate, saving: isSavingNew, error: saveProjectTemplateError, success: successNew } = useProjectTemplates();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const { createProject, error: createProjectError, isLoading: isProjectCreating, updateStep, saveSpecification, saveSupplierData } = useProjectSupabase();
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("templateId");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [startRole, setStartRole] = useState<'client' | 'supplier' | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<{ companyData: any; projectName: string }>({ companyData, projectName });
  const { isTemplateMode = false } = props;
  
  // 🔥 НОВОЕ: Состояние для confidence показателей
  const [fieldConfidence, setFieldConfidence] = useState<{[key: string]: number}>({});
  const [extractionInfo, setExtractionInfo] = useState<{
    overallConfidence: number;
    extractedFields: number;
    timestamp?: string;
  } | null>(null);

  // 🎨 Функция для получения цвета границы на основе confidence
  const getFieldBorderClass = (fieldName: string): string => {
    const confidence = fieldConfidence[fieldName];
    if (!confidence) return "";
    
    if (confidence >= 90) return "border-green-500 bg-green-50";
    if (confidence >= 75) return "border-yellow-500 bg-yellow-50";
    if (confidence >= 60) return "border-orange-500 bg-orange-50";
    return "border-red-500 bg-red-50";
  };

  // 🎯 Функция для получения текста уверенности
  const getConfidenceText = (fieldName: string): string => {
    const confidence = fieldConfidence[fieldName];
    if (!confidence) return "";
    
    if (confidence >= 90) return `✅ ${confidence}%`;
    if (confidence >= 75) return `⚠️ ${confidence}%`;
    return `❌ ${confidence}%`;
  };

  // 🔄 Функция для повторного анализа
  const handleRetryAnalysis = async () => {
    if (!uploadedFileUrl) return;
    
    setUploading(true);
    try {
      // Повторный вызов анализа документа
      // Здесь можно добавить логику повторного анализа
      toast({
        title: "🔄 Повторный анализ",
        description: "Запущен повторный анализ документа...",
        variant: "default"
      });
    } catch (error) {
      logger.error("Ошибка повторного анализа:", error);
    } finally {
      setUploading(false);
    }
  };
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showTemplateSelect, setShowTemplateSelect] = useState(false);
  const { project, loading: projectLoading } = useRealtimeProjectData(projectId);
  const [loadingNext, setLoadingNext] = useState(false);
  const [showFormAfterUpload, setShowFormAfterUpload] = useState(false);

  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData({
      ...companyData,
      [name]: value,
    });
  };

  const handleSaveTemplate = async () => {
    // Сохраняем в новую таблицу project_templates с ролью client
    await saveProjectTemplate({
      name: projectName || "Без названия",
      description: "", // Можно добавить отдельное поле для описания
      companyData,
      role: 'client',
    });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!projectName.trim()) newErrors.projectName = "Название проекта обязательно";
    if (!companyData.name.trim()) newErrors.name = "Название компании обязательно";
    if (!companyData.legalName.trim()) newErrors.legalName = "Юридическое название обязательно";
    if (!companyData.inn.trim()) newErrors.inn = "ИНН обязателен";
    if (!companyData.kpp.trim()) newErrors.kpp = "КПП обязателен";
    if (!companyData.ogrn.trim()) newErrors.ogrn = "ОГРН обязателен";
    if (!companyData.address.trim()) newErrors.address = "Юридический адрес обязателен";
    if (!companyData.bankName.trim()) newErrors.bankName = "Название банка обязательно";
    if (!companyData.bankAccount.trim()) newErrors.bankAccount = "Расчетный счет обязателен";
    if (!companyData.bankCorrAccount.trim()) newErrors.bankCorrAccount = "Корр. счет обязателен";
    if (!companyData.bankBik.trim()) newErrors.bankBik = "БИК обязателен";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    logger.info("[Step1] handleNextStep вызван, specificationItems:", specificationItems);
    setLocalError(null);
    if (loadingNext) return;
    if (validate()) {
      setLoadingNext(true);
      // Получаем user_id и email пользователя из Supabase
      const { data: userData, error: userError } = await db.auth.getUser();
      if (userError || !userData?.user?.id) {
        setLocalError("Не удалось получить пользователя");
        setLoadingNext(false);
        logger.error("[Step1] Ошибка получения пользователя:", userError);
        return;
      }
      const user_id = userData.user.id;
      const user_email = userData.user.email || "(email не найден)";
      let currentProjectId = projectId;
      let company = companyData;
      if (currentProjectId) {
        let initiatorRole = startMethod === 'template' ? 'client' : startMethod;
        if (!initiatorRole) {
          const { data: projectData, error: projectError } = await db
            .from("projects")
            .select("initiator_role")
            .eq("id", currentProjectId)
            .single();
          initiatorRole = projectData?.initiator_role || 'client';
        }
        // --- UPDATE project name/company_data/role ---
        const { error: updateError } = await db
          .from("projects")
          .update({
            name: projectName,
            company_data: companyData,
            initiator_role: initiatorRole,
          })
          .eq("id", currentProjectId);
        if (updateError) {
          setLocalError("Ошибка обновления проекта: " + updateError.message);
          setLoadingNext(false);
          logger.error("[Step1] Ошибка update проекта:", updateError);
          return;
        }

        // Cart items уже были вставлены в БД в ProjectStartFlow.handleStepperSelect
        // (единая точка вставки). Здесь только чистим временное хранилище.
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart_items_temp');
        }

        // --- SAVE SPECIFICATION (если нужно) ---
        let saveSpecResult = true;
        try {
          saveSpecResult = await saveSpecification({
            projectId: currentProjectId,
            currentStep: 2,
          });
        } catch (err) {
          setLocalError("Ошибка saveSpecification: " + (err instanceof Error ? err.message : String(err)));
          setLoadingNext(false);
          logger.error("[Step1] Ошибка saveSpecification:", err);
          return;
        }
        if (!saveSpecResult) {
          setLocalError("Ошибка: saveSpecification вернул false");
          setLoadingNext(false);
          logger.error("[Step1] saveSpecification вернул false");
          return;
        }
        // --- СМЕНА СТАТУСА НА in_progress ---
        // Получаем текущий статус
        const { data: statusData, error: statusError } = await db
          .from("projects")
          .select("status")
          .eq("id", currentProjectId)
          .single();
        if (statusError) {
          setLocalError("Ошибка получения статуса проекта: " + statusError.message);
          setLoadingNext(false);
          logger.error("[Step1] Ошибка select статуса перед сменой:", statusError);
          return;
        }
        if (statusData?.status !== "in_progress") {
          try {
            await changeProjectStatus({
              projectId: currentProjectId,
              newStatus: "in_progress",
              changedBy: user_id,
            });
          } catch (err) {
            setLocalError("Ошибка смены статуса: " + (err instanceof Error ? err.message : String(err)));
            setLoadingNext(false);
            logger.error("[Step1] Ошибка смены статуса:", err);
            return;
          }
        }
        // --- ОТПРАВКА В TELEGRAM ---
        try {
          const tgText = `🆕 Новый проект создан или обновлён!\n\nНомер проекта: ${currentProjectId}\nПользователь: ${user_id}\nEmail пользователя: ${user_email}\nНазвание проекта: ${projectName}\n\nДанные компании:\n- Название: ${company.name}\n- Юр. название: ${company.legalName}\n- ИНН: ${company.inn}\n- КПП: ${company.kpp}\n- ОГРН: ${company.ogrn}\n- Адрес: ${company.address}\n- Банк: ${company.bankName}\n- Счёт: ${company.bankAccount}\n- Корр. счёт: ${company.bankCorrAccount}\n- БИК: ${company.bankBik}`;
          await sendTelegramMessageClient(tgText);
        } catch (err) {
          toast({
            title: "Не удалось отправить сообщение в Telegram",
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive",
          });
          logger.error("[Step1] Ошибка отправки в Telegram:", err);
        }
        // --- SELECT STATUS ---
        const { data: projectData, error: selectError } = await db
          .from("projects")
          .select("status")
          .eq("id", currentProjectId)
          .single();
        if (selectError) {
          setLocalError("Ошибка получения статуса проекта: " + selectError.message);
          setLoadingNext(false);
          logger.error("[Step1] Ошибка select статуса:", selectError);
          return;
        }
        if (!projectData?.status) {
          setLocalError("Статус проекта не найден после select!");
          setLoadingNext(false);
          logger.error("[Step1] Статус проекта не найден после select!", projectData);
          return;
        }
        const step = getStepByStatus(projectData.status);
        logger.info("[Step1] Статус из базы:", projectData.status, "→ шаг:", step);
        setCurrentStep(step);
        setMaxStepReached(step);
        setLoadingNext(false);
        return;
      }
      // --- Если projectId нет — создаём новый проект (старый сценарий) ---
      const initiatorRole: 'client' | 'supplier' = startRole === 'client' || startRole === 'supplier' ? startRole : 'client';
      let newProjectId = null;
      try {
        newProjectId = await createProject({
          name: projectName,
          companyData,
          user_id,
          initiator_role: initiatorRole,
          start_method: (startMethod as 'template' | 'profile' | 'manual' | 'upload') || 'manual',
        });
      } catch (err) {
        setLocalError("Ошибка создания проекта: " + (err instanceof Error ? err.message : String(err)));
        setLoadingNext(false);
        logger.error("[Step1] Ошибка создания проекта:", err);
        return;
      }
        if (!newProjectId) {
          setLocalError(createProjectError || "Ошибка создания проекта");
        setLoadingNext(false);
        logger.error('Ошибка создания проекта:', createProjectError);
          return;
        }
        setProjectId(newProjectId);

        // Cart items уже были вставлены в БД в ProjectStartFlow.handleStepperSelect
        // (единая точка вставки). Здесь только чистим временное хранилище.
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart_items_temp');
        }

        // 🎯 СОХРАНЯЕМ ДАННЫЕ ПОСТАВЩИКА ИЗ КАТАЛОГА В БД
        // supplierData попадает в контекст через CartLoader (при flow "корзина → проект").
        // Восстанавливаем его из localStorage если контекст сбросился (например, при ре-маунте).
        try {
          let supplierToSave: any = hasSupplierRecommendations(supplierData) ? supplierData : null;
          if (!supplierToSave && typeof window !== 'undefined') {
            const stored = localStorage.getItem('supplier_data_temp');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (hasSupplierRecommendations(parsed)) {
                supplierToSave = parsed;
                setSupplierData(parsed);
              }
            }
          }
          if (supplierToSave) {
            logger.info("[Step1] Сохраняем supplierData в БД для проекта:", newProjectId);
            const supplierType = getCatalogSupplierType(supplierToSave);
            await saveSupplierData(newProjectId, supplierToSave, supplierToSave.id || undefined, supplierType);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('supplier_data_temp');
            }
          }
        } catch (supplierSaveError) {
          logger.error("[Step1] Ошибка сохранения supplierData в БД (не критично):", supplierSaveError);
        }

      // --- СМЕНА СТАТУСА НА in_progress ---
      // Получаем текущий статус
      const { data: statusData2, error: statusError2 } = await db
        .from("projects")
        .select("status")
        .eq("id", newProjectId)
            .single();
      if (statusError2) {
        setLocalError("Ошибка получения статуса проекта: " + statusError2.message);
        setLoadingNext(false);
        logger.error("[Step1] Ошибка select статуса перед сменой:", statusError2);
        return;
      }
      if (statusData2?.status !== "in_progress") {
        try {
          await changeProjectStatus({
            projectId: newProjectId,
            newStatus: "in_progress",
            changedBy: user_id,
          });
        } catch (err) {
          setLocalError("Ошибка смены статуса: " + (err instanceof Error ? err.message : String(err)));
          setLoadingNext(false);
          logger.error("[Step1] Ошибка смены статуса:", err);
          return;
        }
      }
      // --- ОТПРАВКА В TELEGRAM ---
        try {
          logger.info("📤 [Step1] Начинаем отправку в Telegram...");
          const tgText = `🆕 Новый проект создан!\n\nНомер проекта: ${newProjectId}\nПользователь: ${user_id}\nEmail пользователя: ${user_email}\nНазвание проекта: ${projectName}\n\nДанные компании:\n- Название: ${company.name}\n- Юр. название: ${company.legalName}\n- ИНН: ${company.inn}\n- КПП: ${company.kpp}\n- ОГРН: ${company.ogrn}\n- Адрес: ${company.address}\n- Банк: ${company.bankName}\n- Счёт: ${company.bankAccount}\n- Корр. счёт: ${company.bankCorrAccount}\n- БИК: ${company.bankBik}`;
          logger.info("📝 [Step1] Текст для Telegram:", tgText.substring(0, 100) + "...");
          await sendTelegramMessageClient(tgText);
          logger.info("✅ [Step1] Сообщение в Telegram отправлено успешно!");
        } catch (err) {
          logger.error("❌ [Step1] Ошибка отправки в Telegram:", err);
          toast({
            title: "Не удалось отправить сообщение в Telegram",
            description: err instanceof Error ? err.message : String(err),
            variant: "destructive",
          });
      }
      // --- SELECT STATUS ---
      const { data: projectData, error: selectError } = await db
        .from("projects")
        .select("status")
        .eq("id", newProjectId)
        .single();
      if (selectError) {
        setLocalError("Ошибка получения статуса проекта: " + selectError.message);
        setLoadingNext(false);
        logger.error("[Step1] Ошибка select статуса:", selectError);
        return;
      }
      if (!projectData?.status) {
        setLocalError("Статус проекта не найден после select!");
        setLoadingNext(false);
        logger.error("[Step1] Статус проекта не найден после select!", projectData);
        return;
      }
      const step = getStepByStatus(projectData.status);
      logger.info("[Step1] Статус из базы:", projectData.status, "→ шаг:", step);
      setCurrentStep(step);
      setMaxStepReached(step);
      setLoadingNext(false);
    }
  };

  useEffect(() => {
    // Попробуем получить роль из localStorage или window, если она не хранится в контексте
    if (typeof window !== 'undefined') {
      const role = window.sessionStorage?.getItem('startRole');
      if (role === 'client' || role === 'supplier') setStartRole(role);
    }
  }, []);

  useEffect(() => {
    db.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

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
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const projectId = url.searchParams.get('projectId');
        if (projectId) {
        await db
          .from('projects')
          .update({
            name: profile.name || '',
            company_data: companyData,
          })
          .eq('id', projectId);
      }
    }
  };

  // --- Загрузка файла карточки компании ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      // Получаем user_id
      const { data: userData, error: userError } = await db.auth.getUser();
      if (userError || !userData?.user?.id) {
        setUploadError("Не удалось получить пользователя");
        setUploading(false);
        return;
      }
      const user_id = userData.user.id;
      const user_email = userData.user.email || "(email не найден)";
      
      // Генерируем уникальное имя файла
      const ext = file.name.split('.').pop();
      const filePath = `company_cards/${user_id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      
      // Загружаем файл в Supabase Storage
      const { data, error } = await db.storage.from('step-a1-ready-company').upload(filePath, file);
      if (error) {
        setUploadError(error.message);
        setUploading(false);
        return;
      }
      
      // Получаем публичную ссылку
      const { data: publicUrlData } = db.storage.from('step-a1-ready-company').getPublicUrl(filePath);
      const url = publicUrlData?.publicUrl;
      setUploadedFileUrl(url);
      
      // Сохраняем ссылку в проекте (если уже есть projectId)
      if (projectId && url) {
        await db.from('projects').update({ company_card_file: url }).eq('id', projectId);
      }

      // 🔍 АНАЛИЗ ДОКУМЕНТА С ПОМОЩЬЮ YANDEX VISION
      let extractedData = null;
      let analysisText = "";
      
      try {
        logger.info("🔍 Начинаем анализ документа с Yandex Vision...");
        logger.info("📄 Параметры анализа:", {
          fileUrl: url,
          fileType: file.type,
          fileName: file.name,
          fileSize: file.size
        });
        
        const analysisResponse = await fetch('/api/document-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: url,
            fileType: file.type,
            documentType: 'company_card'
          })
        });

        logger.info("📡 Ответ от API анализа:", {
          status: analysisResponse.status,
          ok: analysisResponse.ok
        });

        if (analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          extractedData = analysisResult.suggestions;
          analysisText = analysisResult.extractedText;
          
          logger.info("✅ Данные извлечены:", extractedData);
          logger.info("📄 Извлеченный текст:", analysisText.substring(0, 200) + "...");
          
          // Автозаполнение формы извлеченными данными с учетом confidence
          if (extractedData && Object.keys(extractedData).length > 0) {
            const newCompanyData = { ...companyData };
            const newFieldConfidence: {[key: string]: number} = {};
            
            // Основные данные компании
            if (extractedData.companyName) {
              newCompanyData.name = extractedData.companyName;
              newFieldConfidence.name = extractedData.companyNameConfidence || 0;
            }
            if (extractedData.legalName) {
              newCompanyData.legalName = extractedData.legalName;
              newFieldConfidence.legalName = extractedData.legalNameConfidence || 0;
            }
            if (extractedData.inn) {
              newCompanyData.inn = extractedData.inn;
              newFieldConfidence.inn = extractedData.innConfidence || 0;
            }
            if (extractedData.kpp) {
              newCompanyData.kpp = extractedData.kpp;
              newFieldConfidence.kpp = extractedData.kppConfidence || 0;
            }
            if (extractedData.ogrn) {
              newCompanyData.ogrn = extractedData.ogrn;
              newFieldConfidence.ogrn = extractedData.ogrnConfidence || 0;
            }
            if (extractedData.address) {
              newCompanyData.address = extractedData.address;
              newFieldConfidence.address = extractedData.addressConfidence || 0;
            }
            
            // Банковские реквизиты
            if (extractedData.bankName) {
              newCompanyData.bankName = extractedData.bankName;
              newFieldConfidence.bankName = extractedData.bankNameConfidence || 0;
            }
            if (extractedData.bankAccount) {
              newCompanyData.bankAccount = extractedData.bankAccount;
              newFieldConfidence.bankAccount = extractedData.bankAccountConfidence || 0;
            }
            if (extractedData.bankCorrAccount) {
              logger.info('🔍 [Step1] Заполняем bankCorrAccount:', extractedData.bankCorrAccount);
              newCompanyData.bankCorrAccount = extractedData.bankCorrAccount;
              newFieldConfidence.bankCorrAccount = extractedData.bankCorrAccountConfidence || 0;
            } else {
              logger.info('❌ [Step1] bankCorrAccount не найден в extractedData');
            }
            if (extractedData.bankBik) {
              newCompanyData.bankBik = extractedData.bankBik;
              newFieldConfidence.bankBik = extractedData.bankBikConfidence || 0;
            }
            
            // Контактные данные
            if (extractedData.phone) {
              newCompanyData.phone = extractedData.phone;
              newFieldConfidence.phone = extractedData.phoneConfidence || 0;
            }
            if (extractedData.email) {
              newCompanyData.email = extractedData.email;
              newFieldConfidence.email = extractedData.emailConfidence || 0;
            }
            if (extractedData.website) {
              newCompanyData.website = extractedData.website;
              newFieldConfidence.website = extractedData.websiteConfidence || 0;
            }
            
            setCompanyData(newCompanyData);
            setFieldConfidence(newFieldConfidence);
            
            // Сохраняем информацию об извлечении
            if (extractedData.extractionInfo) {
              setExtractionInfo(extractedData.extractionInfo);
            }
            
            // Автозаполнение названия проекта (перезаписываем дефолтное «Проект DD.MM.YYYY»)
            if (extractedData.companyName) {
              const isDefaultName = !projectName || /^Проект \d{2}\.\d{2}\.\d{4}$/.test(projectName.trim());
              if (isDefaultName) {
                setProjectName(extractedData.companyName);
              }
            }
            
            // НЕ показываем форму автоматически - только после нажатия кнопки
            
            logger.info("✅ Форма автозаполнена новыми данными:", newCompanyData);
            logger.info("📋 Название проекта установлено:", extractedData.companyName);
            
            // Показываем уведомление об успешном автозаполнении с confidence информацией
            const totalFields = Object.keys(newFieldConfidence).length;
            const avgConfidence = totalFields > 0 
              ? Math.round(Object.values(newFieldConfidence).reduce((sum, conf) => sum + conf, 0) / totalFields)
              : 0;
            
            toast({
              title: "✅ Данные извлечены!",
              description: `Автоматически заполнено ${totalFields} полей. Средняя уверенность: ${avgConfidence}%. Проверьте данные ниже.`,
              variant: "default",
            });
            
            // Показываем уведомление об автозаполнении
            toast({ 
              title: "Данные извлечены", 
              description: "Форма автозаполнена из документа. Проверьте и при необходимости отредактируйте.", 
              variant: "default" 
            });
          } else {
            logger.info("⚠️ Данные не извлечены или пусты");
          }
        } else {
          const errorText = await analysisResponse.text();
          logger.error("❌ Анализ документа не удался:", {
            status: analysisResponse.status,
            error: errorText
          });
        }
      } catch (analysisError) {
        logger.error("❌ Ошибка анализа документа:", analysisError);
        // Не прерываем загрузку файла, если анализ не удался
        toast({ 
          title: "OCR временно недоступен", 
          description: "Файл загружен, но автоматический анализ не работает. Данные нужно заполнить вручную.", 
          variant: "destructive" 
        });
      }

                  // Формируем расширенный текст для Telegram с результатами анализа
            const roleText = startRole === 'client' ? 'Клиент' : startRole === 'supplier' ? 'Поставщик' : 'Неизвестно';
            let tgText = `🆕 Новый проект создан через загрузку карточки!\n\nНомер проекта: ${projectId || '—'}\nПользователь: ${user_id}\nEmail пользователя: ${user_email}\nИнициатор: ${roleText}\nНазвание проекта: ${projectName || '—'}\n\n📄 Файл: ${url}\n📁 Тип файла: ${file.type}\n📏 Размер: ${(file.size / 1024).toFixed(1)} KB`;
      
      // Добавляем результаты анализа в сообщение
      if (extractedData && Object.keys(extractedData).length > 0) {
        tgText += `\n\n🔍 ИЗВЛЕЧЕННЫЕ ДАННЫЕ:\n`;
        if (extractedData.companyName) tgText += `Компания: ${extractedData.companyName}\n`;
        if (extractedData.legalName) tgText += `Юр. название: ${extractedData.legalName}\n`;
        if (extractedData.inn) tgText += `ИНН: ${extractedData.inn}\n`;
        if (extractedData.kpp) tgText += `КПП: ${extractedData.kpp}\n`;
        if (extractedData.ogrn) tgText += `ОГРН: ${extractedData.ogrn}\n`;
        if (extractedData.address) tgText += `Адрес: ${extractedData.address}\n`;
        if (extractedData.bankName) tgText += `Банк: ${extractedData.bankName}\n`;
        if (extractedData.bankAccount) tgText += `Счет: ${extractedData.bankAccount}\n`;
        if (extractedData.bankCorrAccount) tgText += `Корр. счет: ${extractedData.bankCorrAccount}\n`;
        if (extractedData.bankBik) tgText += `БИК: ${extractedData.bankBik}\n`;
        if (extractedData.phone) tgText += `Телефон: ${extractedData.phone}\n`;
        if (extractedData.email) tgText += `Email: ${extractedData.email}\n`;
        if (extractedData.website) tgText += `Сайт: ${extractedData.website}\n`;
      }
      
      if (analysisText) {
        tgText += `\n📄 ПОЛНЫЙ ТЕКСТ ДОКУМЕНТА:\n${analysisText.substring(0, 500)}${analysisText.length > 500 ? '...' : ''}`;
      }

      // Отправляем в Telegram
      const isImage = /\.(jpg|jpeg|png)$/i.test(file.name);
      if (url) {
        if (isImage) {
          await sendTelegramDocumentClient(url, tgText);
        } else {
          await sendTelegramMessageClient(tgText);
        }
        toast({ 
          title: "Файл успешно загружен", 
          description: extractedData ? "Документ проанализирован и данные извлечены!" : "Ссылка отправлена менеджеру.", 
          variant: "default" 
        });
      }
    } catch (err: any) {
      setUploadError(err.message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  // --- Drag & Drop обработчики ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Вызываем handleFileUpload напрямую с файлом
      handleFileUpload({ target: { files: [file] } } as any);
    }
  };

  // --- Обработчик клика по зоне загрузки ---
  const handleZoneClick = () => {
    if (!uploading) {
      document.getElementById('company-card-upload')?.click();
    }
  };

  // --- Удаление файла ---
  const handleDeleteFile = async () => {
    setUploadedFileUrl(null);
    if (projectId) {
      await db.from('projects').update({ company_card_file: null }).eq('id', projectId);
    }
  };

  useEffect(() => {
    if (successNew) {
      setIsSaveDialogOpenState(false);
    }
  }, [successNew]);

  useEffect(() => {
      if (!projectId) return;
    async function fetchCompanyData() {
      const { data, error } = await db
        .from('projects')
        .select('company_data')
        .eq('id', projectId)
        .single();
      if (!error && data && data.company_data) {
        setCompanyData(data.company_data);
      }
    }
    fetchCompanyData();
  }, [projectId, setCompanyData]);

  // --- Автосохранение companyData и projectName ---
  useEffect(() => {
    if (!projectId) return;
    // Если данные не изменились — не сохраняем
    if (
      JSON.stringify(companyData) === JSON.stringify(lastSavedData.current.companyData) &&
      projectName === lastSavedData.current.projectName
    ) return;
    setAutoSaveStatus('saving');
    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    autoSaveTimeout.current = setTimeout(async () => {
      try {
        await db.from('projects').update({ company_data: companyData, name: projectName }).eq('id', projectId);
        lastSavedData.current = { companyData, projectName };
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 1500);
      } catch (e) {
        setAutoSaveStatus('error');
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyData, projectName, projectId]);

  // --- Новый обработчик для шаблона ---
  const handleSaveTemplateAndRedirect = async () => {
    await handleSaveTemplate();
    toast({ title: 'Шаблон сохранён', description: 'Шаблон успешно сохранён!', variant: 'default' });
  };

  // --- Проверка валидности формы без setErrors ---
  const isFormValid = !!(
    projectName.trim() &&
    companyData.name.trim() &&
    companyData.legalName.trim() &&
    companyData.inn.trim() &&
    companyData.kpp.trim() &&
    companyData.ogrn.trim() &&
    companyData.address.trim() &&
    companyData.bankName.trim() &&
    companyData.bankAccount.trim() &&
    companyData.bankCorrAccount.trim() &&
    companyData.bankBik.trim() &&
    companyData.phone.trim()
  );

  // --- ВСТАВКА: ProfileCardSelectModal ---
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
          </DialogHeader>
          {loading && <div className="text-center py-8">Загрузка...</div>}
          {error && <div className="text-red-500 text-center py-8">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
              {profiles.length === 0 && <div className="text-gray-500 text-center">Нет сохранённых карточек</div>}
              {profiles.map((profile: any) => (
                <div
                  key={profile.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer flex flex-col gap-1 transition-all ${selectedId === profile.id ? (role === 'client' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50') : 'border-gray-200 hover:border-blue-300'}`}
                  onClick={() => setSelectedId(profile.id)}
                >
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    {role === 'client' ? <Users className="h-5 w-5 text-blue-500" /> : <Building className="h-5 w-5 text-green-500" />}
                    {profile.name || 'Без названия'}
                  </div>
                  <div className="text-sm text-gray-500">Страна: {profile.country || '—'}</div>
                  <div className="text-xs text-gray-400">ID: {profile.id}</div>
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
  // --- КОНЕЦ ВСТАВКИ ---

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

  const handleTemplateSelect = (template: any) => {
    setShowTemplateSelect(false);
    let companyData: any = null;
    // 1. Новый формат: companyData или company_data
    if (template.data?.companyData) {
      companyData = template.data.companyData;
    } else if (template.data?.company_data) {
      companyData = template.data.company_data;
    } else if (template.data?.company) {
      companyData = template.data.company;
    } else if (
      template.company_name || template.company_inn || template.company_ogrn
    ) {
      companyData = {
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
        website: template.company_website || '',
      };
    }
    if (!companyData) {
      toast({ title: 'Ошибка', description: 'В шаблоне не найдены данные компании', variant: 'destructive' });
      return;
    }
    // Гарантируем все обязательные поля (даже если пустые)
    setCompanyData({
      name: companyData.name || '',
      legalName: companyData.legalName || '',
      inn: companyData.inn || '',
      kpp: companyData.kpp || '',
      ogrn: companyData.ogrn || '',
      address: companyData.address || '',
      bankName: companyData.bankName || '',
      bankAccount: companyData.bankAccount || '',
      bankCorrAccount: companyData.bankCorrAccount || '',
      bankBik: companyData.bankBik || '',
      email: companyData.email || '',
      phone: companyData.phone || '',
      website: companyData.website || '',
    });
    setProjectName(template.name || '');
    // --- Обновляем проект в Supabase ---
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const projectId = url.searchParams.get('projectId');
      if (projectId) {
        db
          .from('projects')
          .update({
            name: template.name || '',
            company_data: companyData,
          })
          .eq('id', projectId);
      }
    }
  };

  useEffect(() => {
    if (project) {
      if (project.name) setProjectName(project.name);
      if (project.company_data) setCompanyData(project.company_data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  if (isTemplateMode) {
    // Форма для заполнения projectName и companyData (как в обычном A1)
    return (
      <div className="max-w-2xl mx-auto py-12">
        {/* Визуализация шагов шаблона */}
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
        <h2 className="text-2xl font-bold mb-6">Создание шаблона клиента</h2>
        {/* Поле для названия шаблона */}
        <div className="mb-8">
          <Label htmlFor="project-name" className="text-xl font-semibold mb-3 block">Название шаблона <span className="text-red-500">*</span></Label>
          <Input
            id="project-name"
            name="projectName"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="mt-2 bg-gray-50 dark:bg-gray-800/50 text-lg font-semibold h-12 px-4 py-2 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 transition-all"
            required
          />
          {errors.projectName && <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>}
        </div>
        {/* Основные поля компании */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="company-name">Название компании <span className="text-red-500">*</span></Label>
              {getConfidenceText('name') && (
                <span className="text-xs font-medium">{getConfidenceText('name')}</span>
              )}
            </div>
            <Input 
              id="company-name" 
              name="name" 
              value={companyData.name} 
              onChange={handleCompanyFormChange} 
              className={`${getFieldBorderClass('name')} ${companyData.name && !getFieldBorderClass('name') ? "border-green-500 bg-green-50" : ""}`}
              required 
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            {fieldConfidence.name && fieldConfidence.name < 80 && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Проверьте название компании (низкая уверенность)
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="company-legal-name">Юридическое название <span className="text-red-500">*</span></Label>
            <Input id="company-legal-name" name="legalName" value={companyData.legalName} onChange={handleCompanyFormChange} required />
            {errors.legalName && <p className="text-red-500 text-sm mt-1">{errors.legalName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="company-inn">ИНН <span className="text-red-500">*</span></Label>
                {getConfidenceText('inn') && (
                  <span className="text-xs font-medium">{getConfidenceText('inn')}</span>
                )}
              </div>
              <Input 
                id="company-inn" 
                name="inn" 
                value={companyData.inn} 
                onChange={handleCompanyFormChange} 
                className={`${getFieldBorderClass('inn')} ${companyData.inn && !getFieldBorderClass('inn') ? "border-green-500 bg-green-50" : ""}`}
                required 
              />
              {errors.inn && <p className="text-red-500 text-sm mt-1">{errors.inn}</p>}
              {fieldConfidence.inn && fieldConfidence.inn < 80 && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Проверьте ИНН (низкая уверенность)
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="company-kpp">КПП <span className="text-red-500">*</span></Label>
              <Input 
                id="company-kpp" 
                name="kpp" 
                value={companyData.kpp} 
                onChange={handleCompanyFormChange} 
                className={companyData.kpp ? "border-green-500 bg-green-50" : ""}
                required 
              />
              {errors.kpp && <p className="text-red-500 text-sm mt-1">{errors.kpp}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="company-ogrn">ОГРН <span className="text-red-500">*</span></Label>
            <Input 
              id="company-ogrn" 
              name="ogrn" 
              value={companyData.ogrn} 
              onChange={handleCompanyFormChange} 
              className={companyData.ogrn ? "border-green-500 bg-green-50" : ""}
              required 
            />
            {errors.ogrn && <p className="text-red-500 text-sm mt-1">{errors.ogrn}</p>}
          </div>
          <div>
            <Label htmlFor="company-address">Юридический адрес <span className="text-red-500">*</span></Label>
            <Input id="company-address" name="address" value={companyData.address} onChange={handleCompanyFormChange} required />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>
          {/* Банковские реквизиты */}
          <div>
            <Label htmlFor="bank-name">Название банка <span className="text-red-500">*</span></Label>
            <Input 
              id="bank-name" 
              name="bankName" 
              value={companyData.bankName} 
              onChange={handleCompanyFormChange} 
              className={companyData.bankName ? "border-green-500 bg-green-50" : ""}
              required 
            />
            {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
          </div>
          <div>
            <Label htmlFor="bank-account">Расчетный счет <span className="text-red-500">*</span></Label>
            <Input id="bank-account" name="bankAccount" value={companyData.bankAccount} onChange={handleCompanyFormChange} required />
            {errors.bankAccount && <p className="text-red-500 text-sm mt-1">{errors.bankAccount}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank-corr-account">Корр. счет <span className="text-red-500">*</span></Label>
              <Input id="bank-corr-account" name="bankCorrAccount" value={companyData.bankCorrAccount} onChange={handleCompanyFormChange} required />
              {errors.bankCorrAccount && <p className="text-red-500 text-sm mt-1">{errors.bankCorrAccount}</p>}
            </div>
            <div>
              <Label htmlFor="bank-bik">БИК <span className="text-red-500">*</span></Label>
              <Input id="bank-bik" name="bankBik" value={companyData.bankBik} onChange={handleCompanyFormChange} required />
              {errors.bankBik && <p className="text-red-500 text-sm mt-1">{errors.bankBik}</p>}
            </div>
          </div>
          {/* Контакты */}
          <div>
            <Label htmlFor="company-email">Email</Label>
            <Input id="company-email" name="email" type="email" value={companyData.email} onChange={handleCompanyFormChange} />
          </div>
          <div>
            <Label htmlFor="company-phone">Телефон <span className="text-red-500">*</span></Label>
            <Input id="company-phone" name="phone" value={companyData.phone} onChange={handleCompanyFormChange} required />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>
          <div>
            <Label htmlFor="company-website">Веб-сайт</Label>
            <Input id="company-website" name="website" value={companyData.website} onChange={handleCompanyFormChange} />
          </div>
        </div>
        {/* Кнопки действий */}
        <div className="flex justify-between items-center mt-8">
          <Button onClick={handleSaveTemplateAndRedirect} disabled={isSavingNew || !isFormValid} variant="outline">
            {isSavingNew ? 'Сохраняем...' : 'Сохранить шаблон'}
          </Button>
          <Button onClick={handleNextStep} disabled={!isFormValid} className="bg-blue-500 hover:bg-blue-600">
            Далее
          </Button>
        </div>
        {successNew && <div className="text-green-600 mt-4">Шаблон успешно сохранён!</div>}
        {saveProjectTemplateError && <div className="text-red-600 mt-4">Ошибка: {saveProjectTemplateError}</div>}
      </div>
    );
  }

  return (
    <div
      className="max-w-4xl mx-auto mt-24"
    >
      {/* Индикатор автосохранения */}
      <div className="mb-2 text-right text-xs text-gray-500 min-h-[20px]">
        {autoSaveStatus === 'saving' && 'Сохраняется...'}
        {autoSaveStatus === 'saved' && <span className="text-green-600">Сохранено</span>}
        {autoSaveStatus === 'error' && <span className="text-red-500">Ошибка автосохранения</span>}
      </div>
      {/* Если выбран upload — показываем секцию загрузки файла или форму после OCR */}
      {startMethod === 'upload' && !showFormAfterUpload ? (
        <div className="mb-8">
          {/* Заголовок с иконкой */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Загрузить карточку компании</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Загрузите документ с данными вашей компании для автоматического заполнения формы
            </p>
          </div>

          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.json,.xml"
            id="company-card-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />

          {!uploadedFileUrl ? (
            /* Drag & Drop зона */
            <div className="relative">
                                           <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleZoneClick}
                className={`
                  block w-full p-12 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300
                  ${uploading
                    ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                    : isDragOver
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900/20 scale-[1.02] shadow-lg'
                    : 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-900/10 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 active:scale-[0.98]'
                  }
                `}
              >
                {uploading ? (
                  /* Состояние загрузки */
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Загрузка файла...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Пожалуйста, подождите</p>
                    </div>
                  </div>
                ) : (
                  /* Состояние готовности к загрузке */
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                      <UploadCloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-2">
                                           <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                       {isDragOver ? 'Отпустите файл для загрузки' : 'Перетащите файл сюда или нажмите для выбора'}
                     </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Поддерживаются PDF, DOC, DOCX, JPG, PNG, JSON, XML
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="mt-4 bg-white hover:bg-gray-50 border-blue-300 text-blue-700 hover:text-blue-800"
                      onClick={() => document.getElementById('company-card-upload')?.click()}
                    >
                      Выбрать файл
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Дополнительная информация */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Файл будет автоматически проанализирован с помощью AI</span>
                </div>
              </div>
            </div>
          ) : (
            /* Состояние после загрузки */
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Файл успешно загружен</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Данные клиента готовы к обработке</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Просмотреть
                    </a>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDeleteFile}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить
                  </Button>
                </div>
              </div>
              
              {/* Информация об AI анализе */}
              <div className="mt-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">AI анализ активирован</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Документ будет проанализирован для автоматического извлечения данных компании
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Кнопка для перехода к форме */}
              <div className="mt-4">
                <Button 
                  onClick={() => {
                    setShowFormAfterUpload(true);
                    
                    // Показываем уведомление
                    toast({
                      title: "📋 Форма показана!",
                      description: "Прокрутите вниз для просмотра заполненных полей",
                      variant: "default",
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl"
                >
                  Проверить данные
                </Button>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-red-900">Ошибка загрузки</p>
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Поле для названия проекта */}
      <div className="mb-8" data-form-section>
        <Label htmlFor="project-name" className="text-2xl font-bold mb-3 block">Название проекта <span className="text-red-500">*</span></Label>
        <Input
          id="project-name"
          name="projectName"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          className="mt-2 bg-gray-50 dark:bg-gray-800/50 text-xl font-semibold h-16 px-6 py-4 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/40 transition-all"
          required
        />
        {errors.projectName && <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>}
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Проверка данных компании...</p>
        </div>
      ) : isVerified ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800 mb-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
            Данные компании проверены
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Данные вашей компании успешно проверены. Переходим к следующему шагу...
          </p>
        </motion.div>
      ) : (
        <>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 mb-8">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-400">
                На этом шаге вы можете создать новую спецификацию или загрузить готовый инвойс. Выберите
                подходящий вариант и заполните необходимые данные.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Основная информация */}
            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div>
                <h2 className="text-xl font-bold mb-2">Основная информация</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Данные вашей компании, используемые для оформления документов
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">
                    Название компании <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    name="name"
                    value={companyData.name}
                    onChange={handleCompanyFormChange}
                    className="bg-gray-50 dark:bg-gray-800/50"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-legal-name">
                    Юридическое название <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-legal-name"
                    name="legalName"
                    value={companyData.legalName}
                    onChange={handleCompanyFormChange}
                    className="bg-gray-50 dark:bg-gray-800/50"
                    required
                  />
                  {errors.legalName && <p className="text-red-500 text-sm mt-1">{errors.legalName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-inn">
                      ИНН <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company-inn"
                      name="inn"
                      value={companyData.inn}
                      onChange={handleCompanyFormChange}
                      className="bg-gray-50 dark:bg-gray-800/50"
                      required
                    />
                    {errors.inn && <p className="text-red-500 text-sm mt-1">{errors.inn}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-kpp">
                      КПП <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company-kpp"
                      name="kpp"
                      value={companyData.kpp}
                      onChange={handleCompanyFormChange}
                      className="bg-gray-50 dark:bg-gray-800/50"
                      required
                    />
                    {errors.kpp && <p className="text-red-500 text-sm mt-1">{errors.kpp}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-ogrn">
                    ОГРН <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-ogrn"
                    name="ogrn"
                    value={companyData.ogrn}
                    onChange={handleCompanyFormChange}
                    className="bg-gray-50 dark:bg-gray-800/50"
                    required
                  />
                  {errors.ogrn && <p className="text-red-500 text-sm mt-1">{errors.ogrn}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-address">
                    Юридический адрес <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-address"
                    name="address"
                    value={companyData.address}
                    onChange={handleCompanyFormChange}
                    className="bg-gray-50 dark:bg-gray-800/50"
                    required
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Банковские реквизиты */}
            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div>
                <h2 className="text-xl font-bold mb-2">Банковские реквизиты</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Данные для проведения платежей</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">
                    Название банка <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bank-name"
                    name="bankName"
                    value={companyData.bankName}
                    onChange={handleCompanyFormChange}
                    placeholder="АО «Сбербанк»"
                    className="bg-gray-50 dark:bg-gray-800/50"
                    required
                  />
                  {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank-account">
                    Расчетный счет <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bank-account"
                    name="bankAccount"
                    value={companyData.bankAccount}
                    onChange={handleCompanyFormChange}
                    placeholder="40702810123450101230"
                    className="bg-gray-50 dark:bg-gray-800/50"
                    required
                  />
                  {errors.bankAccount && <p className="text-red-500 text-sm mt-1">{errors.bankAccount}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-corr-account">
                      Корреспондентский счет <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bank-corr-account"
                      name="bankCorrAccount"
                      value={companyData.bankCorrAccount}
                      onChange={handleCompanyFormChange}
                      placeholder="30101810400000000225"
                      className="bg-gray-50 dark:bg-gray-800/50"
                      required
                    />
                    {errors.bankCorrAccount && <p className="text-red-500 text-sm mt-1">{errors.bankCorrAccount}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank-bik">
                      БИК <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="bank-bik"
                      name="bankBik"
                      value={companyData.bankBik}
                      onChange={handleCompanyFormChange}
                      placeholder="044525225"
                      className="bg-gray-50 dark:bg-gray-800/50"
                      required
                    />
                    {errors.bankBik && <p className="text-red-500 text-sm mt-1">{errors.bankBik}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Контактная информация */}
            <div className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div>
                <h2 className="text-xl font-bold mb-2">Контактная информация</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Контактные данные для связи и уведомлений
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-email">
                    Email
                  </Label>
                  <Input
                    id="company-email"
                    type="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleCompanyFormChange}
                    className="bg-gray-50 dark:bg-gray-800/50"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-phone">
                    Телефон <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-phone"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleCompanyFormChange}
                    className="bg-gray-50 dark:bg-gray-800/50"
                    required
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-website">Веб-сайт</Label>
                  <Input
                    id="company-website"
                    name="website"
                    value={companyData.website}
                    onChange={handleCompanyFormChange}
                    className="bg-gray-50 dark:bg-gray-800/50"
                  />
                </div>
              </div>
            </div>

            {/* Примечание о обязательных полях */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Поля, отмеченные звездочкой (<span className="text-red-500">*</span>), обязательны для
                  заполнения.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                disabled={isVerifying}
                className="rounded-full"
                onClick={() => setIsSaveDialogOpenState(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить шаблон
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setShowProfileSelect(true)}
                disabled={isVerifying || isProjectCreating}
              >
                Заполнить из профиля
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setShowTemplateSelect(true)}
                disabled={isVerifying || isProjectCreating}
              >
                Заполнить из шаблона
              </Button>
            </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleNextStep}
                    disabled={isVerifying || isProjectCreating || loadingNext}
                className="gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {(isVerifying || isProjectCreating) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isProjectCreating ? "Создание проекта..." : "Проверка данных..."}
                  </>
                ) : (
                  <>
                    Проверить и продолжить
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>
            </>
          )}
        </>
      )}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpenState}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить шаблон?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Вы действительно хотите сохранить текущие данные как шаблон?</p>
            {isSavingNew && <p className="text-blue-500 mt-2">Сохраняем шаблон...</p>}
            {saveProjectTemplateError && <p className="text-red-500 mt-2">Ошибка: {saveProjectTemplateError}</p>}
            {successNew && <p className="text-green-600 mt-2 font-bold">Шаблон успешно сохранён!</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSaveDialogOpenState(false)} variant="outline">Отмена</Button>
            <Button onClick={handleSaveTemplateAndRedirect} disabled={isSavingNew || successNew} className="bg-blue-500 text-white">Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showProfileSelect && userId && (
        <ProfileCardSelectModal
          open={showProfileSelect}
          onClose={() => setShowProfileSelect(false)}
          role={'client'}
          onSelect={handleProfileSelect}
          userId={userId}
        />
      )}
      {showTemplateSelect && (
        <TemplateSelectModal
          open={showTemplateSelect}
          onClose={() => setShowTemplateSelect(false)}
          onSelect={handleTemplateSelect}
        />
      )}

      {localError && <p className="text-red-500 text-sm mt-2">{localError}</p>}
    </div>
  );
} 