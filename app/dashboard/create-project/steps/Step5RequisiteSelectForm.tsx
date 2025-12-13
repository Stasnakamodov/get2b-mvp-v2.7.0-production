import { logger } from "@/src/shared/lib/logger"
import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { supabase } from "@/lib/supabaseClient";
import { sendTelegramMessageClient } from '@/lib/telegram-client';
import { useProjectSupabase } from "../hooks/useProjectSupabase";
import { useProjectSpecification } from '../hooks/useProjectSpecification';
import { changeProjectStatus } from "@/lib/supabaseProjectStatus";
import { ProjectStatus } from "@/lib/types/project-status";
import { toast } from "@/components/ui/use-toast";
const requisiteTypeMap = {
  "bank-transfer": { table: "bank_accounts", type: "bank", label: "Банковский счёт" },
  "p2p": { table: "supplier_cards", type: "p2p", label: "Карта поставщика" },
  "crypto": { table: "crypto_wallets", type: "crypto", label: "Криптокошелёк" },
};

const countryOptions = [
  { id: "china", label: "Китай", flag: "🇨🇳" },
  { id: "turkey", label: "Турция", flag: "🇹🇷" },
  { id: "other", label: "Другая", flag: "🌍" },
];

// --- Форматирование реквизитов для Telegram ---
function formatRequisiteForTelegram(requisite: any): string {
  const keyLabels: Record<string, string> = {
    name: 'Название',
    country: 'Страна',
    recipientName: 'Получатель',
    recipientAddress: 'Юр. адрес получателя',
    bankName: 'Банк',
    bankAddress: 'Адрес банка',
    cnapsCode: 'CNAPS код',
    iban: 'IBAN',
    swift: 'SWIFT/BIC',
    accountNumber: 'Номер счета',
    transferCurrency: 'Валюта',
    paymentPurpose: 'Назначение платежа',
    otherDetails: 'Доп. информация',
    card_number: 'Номер карты',
    holder_name: 'Владелец карты',
    expiry_date: 'Срок действия',
    address: 'Адрес',
    network: 'Сеть',
  };
  const details = requisite.details || requisite;
  let text = '';
  for (const [key, value] of Object.entries(details)) {
    if (["id", "user_id", "created_at", "project_id"].includes(key)) continue;
    if (value) text += `\n${keyLabels[key] || key}: ${value}`;
  }
  return text.trim();
}

export default function Step5RequisiteSelectForm() {
  const { projectId, paymentMethod, setCurrentStep, maxStepReached, setMaxStepReached, projectName, companyData, specificationItems, setSpecificationItems, supplierData } = useCreateProjectContext();
  
  // 🔍 ВСЕГДА ЛОГИРУЕМ ПРИ КАЖДОМ РЕНДЕРЕ
  logger.info("🚨 [Step5] COMPONENT RENDER - ВСЯ ИНФОРМАЦИЯ:");
  logger.info("  projectId:", projectId);
  logger.info("  paymentMethod:", paymentMethod);
  logger.info("  supplierData:", supplierData);
  logger.info("  supplierData type:", typeof supplierData);
  logger.info("  supplierData keys:", supplierData ? Object.keys(supplierData) : "NO SUPPLIER DATA");
  if (supplierData?.crypto_wallets) {
    logger.info("  🪙 CRYPTO WALLETS FOUND:", supplierData.crypto_wallets);
  } else {
    logger.info("  ❌ NO CRYPTO WALLETS IN SUPPLIER DATA");
  }
  const [requisites, setRequisites] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<any>({ country: "china" });
  const [addError, setAddError] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [saveToBook, setSaveToBook] = useState(true);
  const { saveSpecification, updateStep, loadSpecification } = useProjectSupabase();
  const { items: specItems, fetchSpecification } = useProjectSpecification(projectId, 'client');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const requisiteMeta = requisiteTypeMap[paymentMethod as keyof typeof requisiteTypeMap];

  // 🎯 Получаем реквизиты поставщика на основе выбранного метода оплаты
  const supplierRequisites = useMemo(() => {
    logger.info("[Step5] 🔍 НАЧИНАЕМ ПРОВЕРКУ РЕКВИЗИТОВ ПОСТАВЩИКА");
    logger.info("[Step5] supplierData:", supplierData);
    logger.info("[Step5] paymentMethod:", paymentMethod);
    
    if (!supplierData) {
      logger.info("[Step5] ❌ НЕТ ДАННЫХ ПОСТАВЩИКА");
      return [];
    }
    
    if (!paymentMethod) {
      logger.info("[Step5] ❌ НЕТ ВЫБРАННОГО МЕТОДА ОПЛАТЫ");
      return [];
    }
    
    let result = [];
    switch (paymentMethod) {
      case 'bank-transfer':
        result = supplierData.bank_accounts || [];
        logger.info("[Step5] 🏦 БАНКОВСКИЕ СЧЕТА ПОСТАВЩИКА:", result);
        break;
      case 'p2p':
        result = supplierData.p2p_cards || [];
        logger.info("[Step5] 💳 P2P КАРТЫ ПОСТАВЩИКА:", result);
        break;
      case 'crypto':
        result = supplierData.crypto_wallets || [];
        logger.info("[Step5] 🪙 КРИПТОКОШЕЛЬКИ ПОСТАВЩИКА:", result);
        break;
      default:
        logger.info("[Step5] ❌ НЕИЗВЕСТНЫЙ МЕТОД ОПЛАТЫ:", paymentMethod);
        result = [];
    }
    
    logger.info("[Step5] ✅ ИТОГОВЫЕ РЕКВИЗИТЫ ПОСТАВЩИКА:", result);
    return result;
  }, [supplierData, paymentMethod]);

  useEffect(() => {
    if (!requisiteMeta || !projectId) return;
    setLoading(true);
    async function fetchRequisites() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setRequisites([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from(requisiteMeta.table)
        .select("*")
        .eq("user_id", userId);
      if (error) setRequisites([]);
      else setRequisites(data || []);
      setLoading(false);
    }
    fetchRequisites();
  }, [paymentMethod, projectId, showAddForm]);

  useEffect(() => {
    if (!projectId) return;
    async function fetchSpecById() {
      // Получаем specification_id из проекта
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('specification_id')
        .eq('id', projectId)
        .single();
      const specId = projectData?.specification_id;
      if (specId) {
        // Грузим спецификацию по id
        const { data: specData, error: specError } = await supabase
          .from('project_specifications')
          .select('*')
          .eq('id', specId)
          .single();
        if (specData) {
          setSpecificationItems([specData]);
          return;
        }
      }
      // Fallback: грузим по projectId/role (старый способ)
      fetchSpecification().then(() => {
        if (specItems && Array.isArray(specItems) && specItems.length > 0) {
          setSpecificationItems(specItems);
        }
      });
    }
    fetchSpecById();
  }, [projectId]);

  // 🎯 Умное автозаполнение при единственном реквизите поставщика
  useEffect(() => {
    if (supplierRequisites.length === 1 && !selectedId) {
      logger.info("[Step5] Автовыбираем единственный реквизит поставщика:", supplierRequisites[0]);
      // Создаем временный ID для реквизита поставщика
      const supplierId = `supplier_${paymentMethod}_0`;
      setSelectedId(supplierId);
    }
    // Отмечаем завершение инициализации после обработки
    if (initializing) {
      setInitializing(false);
    }
  }, [supplierRequisites, selectedId, paymentMethod, initializing]);

  const handleSave = async () => {
    if (!projectId) {
      toast({
        title: "Ошибка",
        description: "ID проекта не найден",
        variant: "destructive",
      });
      return;
    }

    logger.info("🔄 Начинаем сохранение и переход на 6 шаг...");
    setIsLoading(true);
    try {
      // Получаем текущего пользователя
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({
          title: "Ошибка",
          description: "Пользователь не авторизован",
          variant: "destructive",
        });
        return;
      }

      // Вычисляем сумму из спецификации
      const totalAmount = specificationItems.reduce((sum, item) => sum + (item.total || item.totalPrice || 0), 0);
      
      // Получаем выбранный реквизит (из пользовательских или поставщика)
      let selectedRequisite = requisites.find(r => r.id === selectedId);
      
      // ✅ ИСПРАВЛЕНО: Проверяем что selectedId это строка перед использованием startsWith
      const selectedIdString = typeof selectedId === 'string' ? selectedId : String(selectedId || '');
      
      // Если не найден в пользовательских, ищем среди реквизитов поставщика
      if (!selectedRequisite && selectedIdString.startsWith('supplier_')) {
        const supplierIndex = parseInt(selectedIdString.split('_')[2]);
        selectedRequisite = supplierRequisites[supplierIndex];
        logger.info("[Step5] Используем реквизит поставщика:", selectedRequisite);
      }
      
      if (!selectedRequisite) {
        toast({
          title: "Ошибка",
          description: "Выберите реквизит для сохранения",
          variant: "destructive",
        });
        return;
      }
      
      logger.info("💾 [STEP5] Сохраняем выбранный реквизит:", { 
        selectedId, 
        selectedRequisite, 
        paymentMethod,
        requisiteMeta,
        userId: userData.user.id
      });
      
      // Извлекаем только нужные поля из выбранного реквизита
      const cleanRequisiteData = selectedIdString.startsWith('supplier_') ? 
        // Реквизиты поставщика - используем их структуру напрямую
        {
          ...selectedRequisite,
          source: 'supplier' // Помечаем как реквизиты поставщика
        } :
        // Пользовательские реквизиты - используем старую логику
        {
          name: selectedRequisite.name,
          country: selectedRequisite.country,
          details: selectedRequisite.details,
          // Банковские поля (для совместимости с API эхо карточек)
          recipientName: selectedRequisite.details?.recipientName || selectedRequisite.recipientName,
          bankName: selectedRequisite.details?.bankName || selectedRequisite.bankName,
          accountNumber: selectedRequisite.details?.accountNumber || selectedRequisite.accountNumber,
          swift: selectedRequisite.details?.swift || selectedRequisite.swift,
          bankAddress: selectedRequisite.details?.bankAddress || selectedRequisite.bankAddress,
          recipientAddress: selectedRequisite.details?.recipientAddress || selectedRequisite.recipientAddress,
          cnapsCode: selectedRequisite.details?.cnapsCode || selectedRequisite.cnapsCode,
          // P2P поля
          card_number: selectedRequisite.card_number,
          holder_name: selectedRequisite.holder_name,
          expiry_date: selectedRequisite.expiry_date,
          bank: selectedRequisite.bank,
          // Crypto поля  
          address: selectedRequisite.address,
          network: selectedRequisite.network,
          source: 'user' // Помечаем как пользовательские реквизиты
        };

      logger.info("✅ [STEP5] Очищенные данные для сохранения:", cleanRequisiteData);
      
      // Сохраняем очищенные данные реквизита в project_requisites
      const { error: requisiteError } = await supabase
        .from("project_requisites")
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          data: cleanRequisiteData,
          type: requisiteMeta.type
        });
        
      if (requisiteError) {
        logger.error("❌ [STEP5] Ошибка сохранения реквизитов:", requisiteError);
        logger.error("❌ [STEP5] Детали ошибки:", JSON.stringify(requisiteError, null, 2));
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить реквизиты: " + (requisiteError.message || "Неизвестная ошибка"),
          variant: "destructive",
        });
        return;
      }
      
      logger.info("✅ [STEP5] Реквизиты успешно сохранены в project_requisites");
      
      // Сохраняем текущий шаг и обновляем сумму
      await saveSpecification({ 
        projectId, 
        currentStep: 5,
        paymentMethod: paymentMethod
      });
      
      // Обновляем сумму в базе данных
      if (totalAmount > 0) {
        logger.info(`💰 Обновляем сумму в БД: ${totalAmount}`);
        await supabase
          .from("projects")
          .update({ amount: totalAmount })
          .eq("id", projectId);
      }

      // Получаем текущий статус проекта для правильного перехода
      const { data: currentProject, error: fetchError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
        
      if (fetchError) {
        logger.error("❌ Ошибка получения статуса проекта:", fetchError);
        // Продолжаем с предположением о статусе
      }
      
      const currentStatus = currentProject?.status || "receipt_approved";
      logger.info("🔄 Текущий статус проекта:", currentStatus);
      
      // Правильная последовательность переходов статуса
      if (currentStatus === "receipt_approved") {
        logger.info("💾 Переходим от receipt_approved к filling_requisites");
        await changeProjectStatus({
          projectId,
          newStatus: "filling_requisites",
          changedBy: "client",
          comment: "Начинаем заполнение реквизитов"
        });
        
        // Затем переходим к ожиданию чека от менеджера
        logger.info("💾 Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Реквизиты заполнены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "filling_requisites") {
        logger.info("💾 Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Реквизиты заполнены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "waiting_manager_receipt") {
        logger.info("⚠️ Проект уже в статусе waiting_manager_receipt, пропускаем изменение статуса");
        // Не меняем статус, если уже в нужном
      } else {
        logger.info("⚠️ Неожиданный статус, пытаемся перейти к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Реквизиты заполнены, ожидание чека от менеджера"
        });
      }

      logger.info("✅ Статус изменен на waiting_manager_receipt, переходим на шаг 6");

      // Переходим на следующий шаг
      setCurrentStep(6);
      if (6 > maxStepReached) setMaxStepReached(6);
    } catch (error: any) {
      logger.error("❌ Ошибка при сохранении:", error);
      logger.error("❌ Детали ошибки:", JSON.stringify(error, null, 2));
      logger.error("❌ Тип ошибки:", typeof error);
      logger.error("❌ Конструктор ошибки:", error?.constructor?.name);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить данные: " + (error?.message || error?.toString() || "Неизвестная ошибка"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Добавление нового банковского реквизита ---
  const handleAddBankRequisite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      toast({
        title: "Ошибка",
        description: "ID проекта не найден",
        variant: "destructive",
      });
      return;
    }

    logger.info("🏦 Добавляем банковские реквизиты...");
    setIsLoading(true);

    try {
      // Получаем текущего пользователя
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({
          title: "Ошибка",
          description: "Пользователь не авторизован",
          variant: "destructive",
        });
        return;
      }

      // Валидация полей
      if (!addForm.details?.recipientName || !addForm.details?.recipientAddress || !addForm.details?.bankName || !addForm.details?.accountNumber) {
        toast({
          title: "Ошибка",
          description: "Заполните все обязательные поля",
          variant: "destructive",
        });
        return;
      }

      // Вычисляем сумму из спецификации
      const totalAmount = specificationItems.reduce((sum, item) => sum + (item.total || item.totalPrice || 0), 0);

      // Формируем данные реквизита
      const requisiteData = {
        name: addForm.name,
        country: addForm.country,
        details: addForm.details
      };

      logger.info("💾 [STEP5] Сохраняем новые банковские реквизиты:", { 
        requisiteData, 
        projectId,
        paymentMethod: "bank-transfer",
        userId: userData.user.id
      });

      // Сохраняем реквизит в project_requisites
      const { error: requisiteError } = await supabase
        .from("project_requisites")
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          data: requisiteData,
          type: "bank"
        });
        
      if (requisiteError) {
        logger.error("❌ Ошибка сохранения реквизитов:", requisiteError);
        logger.error("❌ Детали ошибки:", JSON.stringify(requisiteError, null, 2));
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить реквизиты: " + (requisiteError.message || "Неизвестная ошибка"),
          variant: "destructive",
        });
        return;
      }

      logger.info("✅ [STEP5] Банковские реквизиты успешно сохранены в project_requisites");

      // Сохраняем в шаблоны, если выбрано
      if (saveAsTemplate) {
        await supabase
          .from("bank_accounts")
          .insert({
            user_id: userData.user.id,
            name: addForm.name,
            country: addForm.country,
            details: addForm.details
          });
      }

      // Сохраняем банковские реквизиты
      await saveSpecification({ 
        projectId, 
        currentStep: 5,
        paymentMethod: "bank-transfer"
      });
      
      // Обновляем сумму в базе данных
      if (totalAmount > 0) {
        logger.info(`💰 Обновляем сумму в БД: ${totalAmount}`);
        await supabase
          .from("projects")
          .update({ amount: totalAmount })
          .eq("id", projectId);
      }

      // Получаем текущий статус проекта для правильного перехода
      const { data: currentProject, error: fetchError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
        
      if (fetchError) {
        logger.error("❌ Ошибка получения статуса проекта:", fetchError);
      }
      
      const currentStatus = currentProject?.status || "receipt_approved";
      logger.info("🔄 [BANK] Текущий статус проекта:", currentStatus);
      
      // Правильная последовательность переходов статуса для банковских реквизитов
      if (currentStatus === "receipt_approved") {
        logger.info("💾 [BANK] Переходим от receipt_approved к filling_requisites");
        await changeProjectStatus({
          projectId,
          newStatus: "filling_requisites",
          changedBy: "client",
          comment: "Начинаем заполнение банковских реквизитов"
        });
        
        logger.info("💾 [BANK] Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Банковские реквизиты добавлены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "filling_requisites") {
        logger.info("💾 [BANK] Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Банковские реквизиты добавлены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "waiting_manager_receipt") {
        logger.info("⚠️ [BANK] Проект уже в статусе waiting_manager_receipt, пропускаем изменение статуса");
      } else {
        logger.info("⚠️ [BANK] Неожиданный статус, пытаемся перейти к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Банковские реквизиты добавлены, ожидание чека от менеджера"
        });
      }

      logger.info("✅ Статус изменен на waiting_manager_receipt, переходим на шаг 6");

      // Переходим на следующий шаг
      setCurrentStep(6);
      if (6 > maxStepReached) setMaxStepReached(6);
    } catch (error: any) {
      logger.error("❌ Ошибка при добавлении банковских реквизитов:", error);
      logger.error("❌ Детали ошибки:", JSON.stringify(error, null, 2));
      logger.error("❌ Тип ошибки:", typeof error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить банковские реквизиты: " + (error?.message || error?.toString() || "Неизвестная ошибка"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Удаление шаблона ---
  const handleDelete = async (id: string) => {
    await supabase.from("bank_accounts").delete().eq("id", id);
    setRequisites(requisites.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // --- Динамическая форма для банковских реквизитов ---
  const renderBankForm = () => {
    const country = addForm.country;
    return (
      <form onSubmit={handleAddBankRequisite} className="bg-white rounded-xl border p-6 mb-8 space-y-2">
        <h3 className="text-lg font-bold mb-3">Реквизиты для международного банковского перевода</h3>
        <div className="flex gap-4 mb-3">
          {countryOptions.map(opt => (
            <Button key={opt.id} type="button" variant={addForm.country === opt.id ? "default" : "outline"} onClick={() => setAddForm((f: any) => ({ ...f, country: opt.id }))}>
              <span className="text-2xl mr-2">{opt.flag}</span>{opt.label}
            </Button>
          ))}
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Название шаблона</Label>
        <Input value={addForm.name || ""} onChange={e => setAddForm((f: any) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Полное наименование получателя</Label>
        <Input value={addForm.details?.recipientName || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, recipientName: e.target.value } }))} required />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Юридический адрес получателя</Label>
        <Input value={addForm.details?.recipientAddress || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, recipientAddress: e.target.value } }))} required />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Наименование банка</Label>
        <Input value={addForm.details?.bankName || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, bankName: e.target.value } }))} required />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Адрес банка</Label>
        <Input value={addForm.details?.bankAddress || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, bankAddress: e.target.value } }))} required />
        </div>
        {country === "china" && (
          <div className="space-y-1">
            <Label className="text-sm font-medium">CNAPS код</Label>
            <Input value={addForm.details?.cnapsCode || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, cnapsCode: e.target.value } }))} required />
          </div>
        )}
        {country === "turkey" && (
          <div className="space-y-1">
            <Label className="text-sm font-medium">IBAN</Label>
            <Input value={addForm.details?.iban || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, iban: e.target.value } }))} required />
          </div>
        )}
        {country === "other" && (
          <div className="space-y-1">
            <Label className="text-sm font-medium">SWIFT/BIC код</Label>
            <Input value={addForm.details?.swift || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, swift: e.target.value } }))} required />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Номер счета</Label>
        <Input value={addForm.details?.accountNumber || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, accountNumber: e.target.value } }))} required />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Валюта перевода</Label>
        <Input value={addForm.details?.transferCurrency || "USD"} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, transferCurrency: e.target.value } }))} required />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Назначение платежа</Label>
        <Input value={addForm.details?.paymentPurpose || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, paymentPurpose: e.target.value } }))} required />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Дополнительная информация</Label>
        <Input value={addForm.details?.otherDetails || ""} onChange={e => setAddForm((f: any) => ({ ...f, details: { ...f.details, otherDetails: e.target.value } }))} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input type="checkbox" id="saveAsTemplate" checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.target.checked)} />
          <Label htmlFor="saveAsTemplate" className="text-sm">Сохранить как шаблон</Label>
        </div>
        {addError && <div className="text-red-500 text-sm">{addError}</div>}
        <div className="flex gap-4 mt-4">
          <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Отмена</Button>
          <Button type="submit">Отправить</Button>
        </div>
      </form>
    );
  };

  // --- Добавление новой карты (p2p) ---
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      toast({
        title: "Ошибка",
        description: "ID проекта не найден",
        variant: "destructive",
      });
      return;
    }

    logger.info("💳 Добавляем карточные реквизиты...");
    setIsLoading(true);

    try {
      // Получаем текущего пользователя
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({
          title: "Ошибка",
          description: "Пользователь не авторизован",
          variant: "destructive",
        });
        return;
      }

      // Валидация полей
      if (!addForm.bank || !addForm.card_number || !addForm.holder_name || !addForm.expiry_date) {
        toast({
          title: "Ошибка",
          description: "Заполните все обязательные поля",
          variant: "destructive",
        });
        return;
      }

      // Вычисляем сумму из спецификации
      const totalAmount = specificationItems.reduce((sum, item) => sum + (item.total || item.totalPrice || 0), 0);

      // Формируем данные реквизита
      const requisiteData = {
        bank: addForm.bank,
        card_number: addForm.card_number,
        holder_name: addForm.holder_name,
        expiry_date: addForm.expiry_date
      };

      logger.info("💾 [STEP5] Сохраняем новый P2P реквизит:", { 
        requisiteData, 
        projectId,
        paymentMethod: "p2p",
        userId: userData.user.id
      });

      // Сохраняем реквизит в project_requisites
      const { error: requisiteError } = await supabase
        .from("project_requisites")
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          data: requisiteData,
          type: "p2p"
        });
        
      if (requisiteError) {
        logger.error("❌ [STEP5] Ошибка сохранения P2P реквизитов:", requisiteError);
        logger.error("❌ [STEP5] Детали ошибки:", JSON.stringify(requisiteError, null, 2));
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить реквизиты: " + (requisiteError.message || "Неизвестная ошибка"),
          variant: "destructive",
        });
        return;
      }

      logger.info("✅ [STEP5] P2P реквизиты успешно сохранены в project_requisites");

      // Сохраняем в шаблоны, если выбрано
      if (saveToBook) {
        await supabase
          .from("supplier_cards")
          .insert({
            user_id: userData.user.id,
            bank: addForm.bank,
            card_number: addForm.card_number,
            holder_name: addForm.holder_name,
            expiry_date: addForm.expiry_date
          });
      }

      // Сохраняем карточные реквизиты
      await saveSpecification({ 
        projectId, 
        currentStep: 5,
        paymentMethod: "p2p"
      });
      
      // Обновляем сумму в базе данных
      if (totalAmount > 0) {
        logger.info(`💰 Обновляем сумму в БД: ${totalAmount}`);
        await supabase
          .from("projects")
          .update({ amount: totalAmount })
          .eq("id", projectId);
      }

      // Получаем текущий статус проекта для правильного перехода
      const { data: currentProject, error: fetchError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
        
      if (fetchError) {
        logger.error("❌ Ошибка получения статуса проекта:", fetchError);
      }
      
      const currentStatus = currentProject?.status || "receipt_approved";
      logger.info("🔄 [P2P] Текущий статус проекта:", currentStatus);
      
      // Правильная последовательность переходов статуса для P2P реквизитов
      if (currentStatus === "receipt_approved") {
        logger.info("💾 [P2P] Переходим от receipt_approved к filling_requisites");
        await changeProjectStatus({
          projectId,
          newStatus: "filling_requisites",
          changedBy: "client",
          comment: "Начинаем заполнение P2P реквизитов"
        });
        
        logger.info("💾 [P2P] Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Карточные реквизиты добавлены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "filling_requisites") {
        logger.info("💾 [P2P] Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Карточные реквизиты добавлены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "waiting_manager_receipt") {
        logger.info("⚠️ [P2P] Проект уже в статусе waiting_manager_receipt, пропускаем изменение статуса");
      } else {
        logger.info("⚠️ [P2P] Неожиданный статус, пытаемся перейти к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Карточные реквизиты добавлены, ожидание чека от менеджера"
        });
      }

      logger.info("✅ Статус изменен на waiting_manager_receipt, переходим на шаг 6");

      // Переходим на следующий шаг
      setCurrentStep(6);
      if (6 > maxStepReached) setMaxStepReached(6);
    } catch (error: any) {
      logger.error("❌ Ошибка при добавлении карточных реквизитов:", error);
      logger.error("❌ Детали ошибки:", JSON.stringify(error, null, 2));
      logger.error("❌ Тип ошибки:", typeof error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить карточные реквизиты: " + (error?.message || error?.toString() || "Неизвестная ошибка"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Форма для добавления карты (p2p) ---
  const renderCardForm = () => (
    <form onSubmit={handleAddCard} className="bg-white rounded-xl border p-6 mb-8 space-y-2">
      <h3 className="text-lg font-bold mb-3">Добавить новую карту</h3>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Банк</Label>
      <Input value={addForm.bank || ""} onChange={e => setAddForm((f: any) => ({ ...f, bank: e.target.value }))} required />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Номер карты</Label>
      <Input value={addForm.card_number || ""} onChange={e => setAddForm((f: any) => ({ ...f, card_number: e.target.value }))} required />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Держатель</Label>
      <Input value={addForm.holder_name || ""} onChange={e => setAddForm((f: any) => ({ ...f, holder_name: e.target.value }))} required />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Срок действия</Label>
      <Input value={addForm.expiry_date || ""} onChange={e => setAddForm((f: any) => ({ ...f, expiry_date: e.target.value }))} required />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input type="checkbox" id="saveToBookP2P" checked={saveToBook} onChange={e => setSaveToBook(e.target.checked)} />
        <Label htmlFor="saveToBookP2P" className="text-sm">Сохранить в записную книжку</Label>
      </div>
      {addError && <div className="text-red-500 text-sm">{addError}</div>}
      <div className="flex gap-4 mt-4">
        <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Отмена</Button>
        <Button type="submit">Отправить</Button>
      </div>
    </form>
  );

  // --- Добавление нового кошелька (crypto) ---
  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId) {
      toast({
        title: "Ошибка",
        description: "ID проекта не найден",
        variant: "destructive",
      });
      return;
    }

    logger.info("🪙 Добавляем криптовалютные реквизиты...");
    setIsLoading(true);

    try {
      // Получаем текущего пользователя
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({
          title: "Ошибка",
          description: "Пользователь не авторизован",
          variant: "destructive",
        });
        return;
      }

      // Валидация полей
      if (!addForm.name || !addForm.address || !addForm.network) {
        toast({
          title: "Ошибка",
          description: "Заполните все обязательные поля",
          variant: "destructive",
        });
        return;
      }

      // Вычисляем сумму из спецификации
      const totalAmount = specificationItems.reduce((sum, item) => sum + (item.total || item.totalPrice || 0), 0);

      // Формируем данные реквизита
      const requisiteData = {
        name: addForm.name,
        address: addForm.address,
        network: addForm.network
      };

      logger.info("💾 [STEP5] Сохраняем новые криптовалютные реквизиты:", { 
        requisiteData, 
        projectId,
        paymentMethod: "crypto",
        userId: userData.user.id
      });

      // Сохраняем реквизит в project_requisites
      const { error: requisiteError } = await supabase
        .from("project_requisites")
        .insert({
          user_id: userData.user.id,
          project_id: projectId,
          data: requisiteData,
          type: "crypto"
        });
        
      if (requisiteError) {
        logger.error("❌ Ошибка сохранения реквизитов:", requisiteError);
        logger.error("❌ Детали ошибки:", JSON.stringify(requisiteError, null, 2));
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить реквизиты: " + (requisiteError.message || "Неизвестная ошибка"),
          variant: "destructive",
        });
        return;
      }

      logger.info("✅ [STEP5] Криптовалютные реквизиты успешно сохранены в project_requisites");

      // Сохраняем в шаблоны, если выбрано
      if (saveToBook) {
        await supabase
          .from("crypto_wallets")
          .insert({
            user_id: userData.user.id,
            name: addForm.name,
            address: addForm.address,
            network: addForm.network
          });
      }

      // Сохраняем криптовалютные реквизиты
      await saveSpecification({ 
        projectId, 
        currentStep: 5,
        paymentMethod: "crypto"
      });
      
      // Обновляем сумму в базе данных
      if (totalAmount > 0) {
        logger.info(`💰 Обновляем сумму в БД: ${totalAmount}`);
        await supabase
          .from("projects")
          .update({ amount: totalAmount })
          .eq("id", projectId);
      }

      // Получаем текущий статус проекта для правильного перехода
      const { data: currentProject, error: fetchError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
        
      if (fetchError) {
        logger.error("❌ Ошибка получения статуса проекта:", fetchError);
      }
      
      const currentStatus = currentProject?.status || "receipt_approved";
      logger.info("🔄 [CRYPTO] Текущий статус проекта:", currentStatus);
      
      // Правильная последовательность переходов статуса для криптовалютных реквизитов
      if (currentStatus === "receipt_approved") {
        logger.info("💾 [CRYPTO] Переходим от receipt_approved к filling_requisites");
        await changeProjectStatus({
          projectId,
          newStatus: "filling_requisites",
          changedBy: "client",
          comment: "Начинаем заполнение криптовалютных реквизитов"
        });
        
        logger.info("💾 [CRYPTO] Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Криптовалютные реквизиты добавлены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "filling_requisites") {
        logger.info("💾 [CRYPTO] Переходим от filling_requisites к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Криптовалютные реквизиты добавлены, ожидание чека от менеджера"
        });
      } else if (currentStatus === "waiting_manager_receipt") {
        logger.info("⚠️ [CRYPTO] Проект уже в статусе waiting_manager_receipt, пропускаем изменение статуса");
      } else {
        logger.info("⚠️ [CRYPTO] Неожиданный статус, пытаемся перейти к waiting_manager_receipt");
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_manager_receipt",
          changedBy: "client",
          comment: "Криптовалютные реквизиты добавлены, ожидание чека от менеджера"
        });
      }

      logger.info("✅ Статус изменен на waiting_manager_receipt, переходим на шаг 6");

      // Переходим на следующий шаг
      setCurrentStep(6);
      if (6 > maxStepReached) setMaxStepReached(6);
    } catch (error: any) {
      logger.error("❌ Ошибка при добавлении криптовалютных реквизитов:", error);
      logger.error("❌ Детали ошибки:", JSON.stringify(error, null, 2));
      logger.error("❌ Тип ошибки:", typeof error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить криптовалютные реквизиты: " + (error?.message || error?.toString() || "Неизвестная ошибка"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Форма для добавления кошелька (crypto) ---
  const renderWalletForm = () => (
    <form onSubmit={handleAddWallet} className="bg-white rounded-xl border p-6 mb-8 space-y-2">
      <h3 className="text-lg font-bold mb-3">Добавить новый криптокошелёк</h3>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Имя кошелька</Label>
      <Input value={addForm.name || ""} onChange={e => setAddForm((f: any) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Адрес</Label>
      <Input value={addForm.address || ""} onChange={e => setAddForm((f: any) => ({ ...f, address: e.target.value }))} required />
      </div>
      <div className="space-y-1">
        <Label className="text-sm font-medium">Сеть</Label>
      <Input value={addForm.network || ""} onChange={e => setAddForm((f: any) => ({ ...f, network: e.target.value }))} required placeholder="TRC20, ERC20 и т.д." />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input type="checkbox" id="saveToBookCrypto" checked={saveToBook} onChange={e => setSaveToBook(e.target.checked)} />
        <Label htmlFor="saveToBookCrypto" className="text-sm">Сохранить в записную книжку</Label>
      </div>
      {addError && <div className="text-red-500 text-sm">{addError}</div>}
      <div className="flex gap-4 mt-4">
        <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Отмена</Button>
        <Button type="submit">Отправить</Button>
      </div>
    </form>
  );

  // --- UI ---
  // Показываем загрузчик во время инициализации
  if (initializing) {
    return (
      <div className="max-w-2xl mx-auto mt-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Загрузка реквизитов...</p>
      </div>
    );
  }

  if (paymentMethod === "p2p") {
    return (
      <div className="max-w-2xl mx-auto mt-24">
        <h2 className="text-3xl font-bold text-center mb-2">Карта для P2P перевода</h2>
        <p className="text-center text-muted-foreground text-base mb-8">Выберите карту для оплаты или добавьте новую.</p>
        
        {/* ДОБАВЛЯЕМ: Блок статуса для P2P */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">5</span>
            </div>
            <div>
              <div className="font-semibold text-blue-800 dark:text-blue-200">Ввод реквизитов</div>
              <div className="text-sm text-blue-600 dark:text-blue-300">Выберите или добавьте карту для P2P оплаты.</div>
            </div>
          </div>
        </div>
        
        {/* Список карт */}
        {!showAddForm && requisites.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Сохранённые карты</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requisites.map((card) => (
                <Card
                  key={card.id}
                  className={`cursor-pointer transition-all border-2 ${selectedId === card.id ? "border-blue-600 shadow-lg bg-blue-50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700 hover:border-blue-400"}`}
                  onClick={() => setSelectedId(card.id)}
                >
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle>{card.bank || "Карта"}</CardTitle>
                      <CardDescription className="break-all text-sm max-w-full overflow-hidden">{card.card_number}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(card.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs text-gray-500">Владелец: {card.holder_name}</span><br />
                    <span className="text-xs text-gray-500">Срок: {card.expiry_date}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* 🎯 РЕКВИЗИТЫ ПОСТАВЩИКА ДЛЯ P2P */}
        {!showAddForm && supplierRequisites.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Карты поставщика</h3>
              <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                Рекомендуется
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supplierRequisites.map((card: any, index: number) => {
                const supplierId = `supplier_${paymentMethod}_${index}`;
                const isSelected = selectedId === supplierId;
                return (
                  <Card
                    key={supplierId}
                    className={`cursor-pointer transition-all border-2 ${isSelected ? "border-green-600 shadow-lg bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 hover:border-green-400"}`}
                    onClick={() => setSelectedId(supplierId)}
                  >
                    <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {card.bank || "Карта поставщика"}
                          <span className="text-green-600 text-sm">🏢</span>
                        </CardTitle>
                        <CardDescription className="break-all text-sm max-w-full overflow-hidden">{card.card_number}</CardDescription>
                      </div>
                      {supplierRequisites.length === 1 && (
                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          ✅ Автовыбор
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <span className="text-xs text-gray-500">Владелец: {card.holder_name}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Кнопка добавить новую карту */}
        {!showAddForm && (
          <Button variant="outline" className="w-full mb-8" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Добавить новую карту
          </Button>
        )}
        {/* Форма для новой карты */}
        {showAddForm && renderCardForm()}
        <div className="flex justify-between items-center gap-4">
          <Button variant="outline" onClick={() => setCurrentStep(4)}>Назад</Button>
          {!showAddForm && (requisites.length > 0 || supplierRequisites.length > 0) && (
            <Button onClick={handleSave} disabled={!selectedId}>Отправить</Button>
          )}
        </div>
        {debugLog.length > 0 && (
          <div style={{ background: "#f9f9f9", padding: 12, marginTop: 24, fontSize: 12, borderRadius: 8 }}>
            <b>DEBUG:</b>
            <pre>{debugLog.join('\n')}</pre>
          </div>
        )}
      </div>
    );
  }

  if (paymentMethod === "crypto") {
    return (
      <div className="max-w-2xl mx-auto mt-24">
        <h2 className="text-3xl font-bold text-center mb-2">Криптокошелёк для оплаты</h2>
        <p className="text-center text-muted-foreground text-base mb-8">Выберите кошелёк для оплаты или добавьте новый.</p>
        
        {/* ДОБАВЛЯЕМ: Блок статуса для криптовалют */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">5</span>
            </div>
            <div>
              <div className="font-semibold text-blue-800 dark:text-blue-200">Ввод реквизитов</div>
              <div className="text-sm text-blue-600 dark:text-blue-300">Выберите или добавьте криптокошелёк для оплаты.</div>
            </div>
          </div>
        </div>
        
        {/* Список кошельков */}
        {!showAddForm && requisites.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Сохранённые кошельки</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requisites.map((wallet) => (
                <Card
                  key={wallet.id}
                  className={`cursor-pointer transition-all border-2 ${selectedId === wallet.id ? "border-blue-600 shadow-lg bg-blue-50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700 hover:border-blue-400"}`}
                  onClick={() => setSelectedId(wallet.id)}
                >
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle>{wallet.name || "Кошелёк"}</CardTitle>
                      <CardDescription className="break-all text-sm max-w-full overflow-hidden">{wallet.address}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(wallet.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs text-gray-500">Сеть: {wallet.network}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* 🎯 РЕКВИЗИТЫ ПОСТАВЩИКА ДЛЯ КРИПТОВАЛЮТ */}
        {!showAddForm && supplierRequisites.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Кошельки поставщика</h3>
              <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                Рекомендуется
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supplierRequisites.map((wallet: any, index: number) => {
                const supplierId = `supplier_${paymentMethod}_${index}`;
                const isSelected = selectedId === supplierId;
                return (
                  <Card
                    key={supplierId}
                    className={`cursor-pointer transition-all border-2 ${isSelected ? "border-green-600 shadow-lg bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 hover:border-green-400"}`}
                    onClick={() => setSelectedId(supplierId)}
                  >
                    <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {wallet.network || "Кошелёк поставщика"}
                          <span className="text-green-600 text-sm">🏢</span>
                        </CardTitle>
                        <CardDescription className="break-all text-sm max-w-full overflow-hidden">{wallet.address}</CardDescription>
                      </div>
                      {supplierRequisites.length === 1 && (
                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          ✅ Автовыбор
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <span className="text-xs text-gray-500">Валюта: {wallet.currency}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Кнопка добавить новый кошелёк */}
        {!showAddForm && (
          <Button variant="outline" className="w-full mb-8" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />Добавить новый кошелёк
          </Button>
        )}
        {/* Форма для нового кошелька */}
        {showAddForm && renderWalletForm()}
        <div className="flex justify-between items-center gap-4">
          <Button variant="outline" onClick={() => setCurrentStep(4)}>Назад</Button>
          {!showAddForm && (requisites.length > 0 || supplierRequisites.length > 0) && (
            <Button onClick={handleSave} disabled={!selectedId}>Отправить</Button>
          )}
        </div>
        {debugLog.length > 0 && (
          <div style={{ background: "#f9f9f9", padding: 12, marginTop: 24, fontSize: 12, borderRadius: 8 }}>
            <b>DEBUG:</b>
            <pre>{debugLog.join('\n')}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-24">
      <h2 className="text-3xl font-bold text-center mb-2">Реквизиты для безналичного перевода</h2>
      <p className="text-center text-muted-foreground text-base mb-8">Выберите шаблон или заполните форму для новых реквизитов.</p>
      
      {/* ДОБАВЛЯЕМ: Блок статуса */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">5</span>
          </div>
          <div>
            <div className="font-semibold text-blue-800">Ввод реквизитов</div>
            <div className="text-sm text-blue-600 dark:text-blue-300">Выберите или добавьте реквизиты для получения оплаты.</div>
          </div>
        </div>
      </div>
      
      {/* Список шаблонов */}
      {!showAddForm && requisites.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Сохранённые шаблоны</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requisites.map((req) => (
              <Card
                key={req.id}
                className={`cursor-pointer transition-all border-2 ${selectedId === req.id ? "border-blue-600 shadow-lg bg-blue-50 dark:bg-blue-900/10" : "border-gray-200 dark:border-gray-700 hover:border-blue-400"}`}
                onClick={() => setSelectedId(req.id)}
              >
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>{req.name || "Шаблон реквизитов"}</CardTitle>
                    <CardDescription>{req.country ? countryOptions.find(c => c.id === req.country)?.label : ""}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(req.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-gray-500">ID: {req.id}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* 🎯 РЕКВИЗИТЫ ПОСТАВЩИКА */}
      {!showAddForm && supplierRequisites.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Реквизиты поставщика</h3>
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
              Рекомендуется
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supplierRequisites.map((req: any, index: number) => {
              const supplierId = `supplier_${paymentMethod}_${index}`;
              const isSelected = selectedId === supplierId;
              return (
                <Card
                  key={supplierId}
                  className={`cursor-pointer transition-all border-2 ${isSelected ? "border-green-600 shadow-lg bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 hover:border-green-400"}`}
                  onClick={() => setSelectedId(supplierId)}
                >
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {paymentMethod === 'bank-transfer' && req.bank_name}
                        {paymentMethod === 'p2p' && req.bank}
                        {paymentMethod === 'crypto' && req.network}
                        <span className="text-green-600 text-sm">🏢</span>
                      </CardTitle>
                      <CardDescription className="break-all text-sm max-w-full overflow-hidden">
                        {paymentMethod === 'bank-transfer' && req.account_number}
                        {paymentMethod === 'p2p' && req.card_number}
                        {paymentMethod === 'crypto' && req.address}
                      </CardDescription>
                    </div>
                    {supplierRequisites.length === 1 && (
                      <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        ✅ Автовыбор
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-gray-500">
                      {paymentMethod === 'bank-transfer' && (
                        <>
                          <div>SWIFT/BIC: {req.swift || req.bic}</div>
                          <div>Валюта: {req.currency}</div>
                        </>
                      )}
                      {paymentMethod === 'p2p' && (
                        <>
                          <div>Владелец: {req.holder_name}</div>
                        </>
                      )}
                      {paymentMethod === 'crypto' && (
                        <>
                          <div>Валюта: {req.currency}</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Кнопка добавить новый шаблон */}
      {!showAddForm && (
        <Button variant="outline" className="w-full mb-8" onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />Добавить новые реквизиты
        </Button>
      )}
      {/* Форма для новых реквизитов */}
      {showAddForm && renderBankForm()}
      <div className="flex justify-between items-center gap-4">
        <Button variant="outline" onClick={() => setCurrentStep(4)}>Назад</Button>
        {!showAddForm && (requisites.length > 0 || supplierRequisites.length > 0) && (
          <Button onClick={handleSave} disabled={!selectedId}>Отправить</Button>
        )}
      </div>
      {debugLog.length > 0 && (
        <div style={{ background: "#f9f9f9", padding: 12, marginTop: 24, fontSize: 12, borderRadius: 8 }}>
          <b>DEBUG:</b>
          <pre>{debugLog.join('\n')}</pre>
        </div>
      )}
    </div>
  );
} 