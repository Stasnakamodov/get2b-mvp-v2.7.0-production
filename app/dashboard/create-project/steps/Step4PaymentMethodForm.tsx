import { logger } from "@/src/shared/lib/logger"
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Landmark, CreditCard, Wallet, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { useToast } from "@/hooks/use-toast";
import { useProjectSupabase } from "../hooks/useProjectSupabase";
import { sendPaymentMethodToTelegram } from "../utils/telegram";
import { db } from "@/lib/db/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useSupplierRecommendation } from "@/hooks/useSupplierRecommendation";
import type { PaymentMethodId, MethodRecommendation, RequisiteSource } from "@/lib/suppliers/supplierRecommendationEngine";

const paymentMethods: Array<{
  id: PaymentMethodId;
  title: string;
  description: string;
  icon: typeof Landmark;
  luxuryAccent: string;
  commission: string;
  time: string;
}> = [
  {
    id: "bank-transfer",
    title: "Банковский перевод",
    description: "Классический SWIFT/SEPA перевод на расчётный счёт",
    icon: Landmark,
    luxuryAccent: "from-blue-500 to-indigo-500",
    commission: "от 0,5%",
    time: "1-3 дня",
  },
  {
    id: "p2p",
    title: "P2P перевод",
    description: "Моментальный перевод на карту поставщика",
    icon: CreditCard,
    luxuryAccent: "from-green-500 to-lime-500",
    commission: "1%",
    time: "до 1 часа",
  },
  {
    id: "crypto",
    title: "Криптовалюта",
    description: "USDT, BTC, ETH и другие сети",
    icon: Wallet,
    luxuryAccent: "from-yellow-400 to-orange-500",
    commission: "0%",
    time: "до 30 мин",
  },
];

function sourceLabel(source: RequisiteSource | null): string {
  switch (source) {
    case 'catalog':
      return 'Реквизиты поставщика'
    case 'ocr_invoice':
      return 'По данным из инвойса'
    case 'echo':
      return 'Реквизиты из похожего проекта'
    default:
      return 'Реквизиты поставщика'
  }
}

export default function Step4PaymentMethodForm() {
  const { setCurrentStep, maxStepReached, setMaxStepReached, projectName, paymentMethod, setPaymentMethod, projectId, supplierData, setSupplierData } = useCreateProjectContext();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(paymentMethod as PaymentMethodId | null);
  const { toast } = useToast();
  const { saveSpecification, updateStep, error: supabaseError } = useProjectSupabase();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🎯 Единый движок рекомендаций: catalog + OCR + echo → MethodRecommendation
  const { recommendation } = useSupplierRecommendation({
    projectId,
    supplierData,
    enableEchoFallback: true,
  });

  // Если supplierData ещё пустой, а в project_specifications есть имя поставщика,
  // хук делает echo-поиск в каталоге и мы гидратируем контекст — так Step5 сможет
  // подсосать bank_accounts / p2p_cards / crypto_wallets.
  const hydratedFromEchoRef = useRef(false);
  useEffect(() => {
    if (hydratedFromEchoRef.current) return;
    if (!recommendation || supplierData) return;
    const anyRequisites = Object.values(recommendation.methods).some(m => m.available);
    if (!anyRequisites) return;

    const bank = recommendation.methods['bank-transfer'].requisites.map(r => r.data);
    const p2p = recommendation.methods['p2p'].requisites.map(r => r.data);
    const crypto = recommendation.methods['crypto'].requisites.map(r => r.data);
    const activeMethods: string[] = [];
    if (bank.length) activeMethods.push('bank_transfer');
    if (p2p.length) activeMethods.push('p2p');
    if (crypto.length) activeMethods.push('crypto');

    hydratedFromEchoRef.current = true;
    setSupplierData({
      name: recommendation.supplierName || '',
      company_name: recommendation.supplierName || '',
      payment_methods: activeMethods,
      bank_accounts: bank,
      p2p_cards: p2p,
      crypto_wallets: crypto,
      source: recommendation.primarySource === 'ocr_invoice' ? 'ocr_invoice' : 'catalog',
    });
  }, [recommendation, supplierData, setSupplierData]);

  // Также подтягиваем поставщика по supplier_id из БД, если ничего не пришло
  // через контекст (прямая навигация на Step4 без прохождения Step1/Step2).
  const supplierIdLoadRef = useRef(false);
  useEffect(() => {
    if (supplierIdLoadRef.current || supplierData || !projectId) return;
    supplierIdLoadRef.current = true;

    (async () => {
      const { data: project } = await db
        .from('projects')
        .select('supplier_id, supplier_type')
        .eq('id', projectId)
        .single();
      if (!project?.supplier_id) return;
      const { loadCatalogSupplier } = await import('@/lib/suppliers/loadCatalogSupplier');
      const catalogData = await loadCatalogSupplier(project.supplier_id);
      if (catalogData) {
        logger.info('[Step4] Загружен поставщик по supplier_id:', catalogData.name);
        setSupplierData(catalogData);
      }
    })();
  }, [projectId, supplierData, setSupplierData]);

  const enrichedPaymentMethods = useMemo(() => {
    return paymentMethods.map(method => {
      const methodRec: MethodRecommendation = recommendation?.methods[method.id] ?? {
        methodId: method.id,
        available: false,
        primarySource: null,
        bestCompleteness: null,
        requisites: [],
      };
      return {
        ...method,
        hasSupplierData: methodRec.available,
        supplierRequisitesCount: methodRec.requisites.length,
        completeness: methodRec.bestCompleteness,
        primarySource: methodRec.primarySource,
      };
    });
  }, [recommendation]);

  useEffect(() => {
    if (paymentMethod) setSelectedMethod(paymentMethod as PaymentMethodId);
    if (projectId) {
      updateStep(projectId, 4);
    }
  }, [paymentMethod, projectId, updateStep]);

  // Автовыбор только когда ровно один метод с ПОЛНЫМИ реквизитами — partial
  // не достоин автозаполнения, пусть пользователь сам убедится и дозаполнит.
  useEffect(() => {
    const fullMethods = enrichedPaymentMethods.filter(
      m => m.hasSupplierData && m.completeness === 'full'
    );
    if (fullMethods.length === 1 && !selectedMethod) {
      const singleMethod = fullMethods[0].id;
      logger.info("[Step4] Автовыбираем единственный метод с полными реквизитами:", singleMethod);
      setSelectedMethod(singleMethod);
      setPaymentMethod(singleMethod);
    }
  }, [enrichedPaymentMethods, selectedMethod, setPaymentMethod]);

  const handleSelect = (method: PaymentMethodId) => {
    if (isProcessing) return;
    setSelectedMethod(method);
    setPaymentMethod(method);
  };

  const handleNext = async () => {
    if (isProcessing || loading) {
      logger.info("[Step4] Обработка уже идет, игнорируем повторное нажатие");
      return;
    }

    logger.info("[Step4] handleNext вызван с selectedMethod:", selectedMethod);
    setIsProcessing(true);
    setErrorMsg(null);

    if (!selectedMethod) {
      toast({ title: "Выберите способ оплаты", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    const allowedMethods: PaymentMethodId[] = ["bank-transfer", "p2p", "crypto"];
    if (!allowedMethods.includes(selectedMethod)) {
      toast({ title: "Недопустимый способ оплаты", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    logger.info("[Step4] Начинаем сохранение, projectId:", projectId);
    setLoading(true);
    setPaymentMethod(selectedMethod);

    let saveResult = true;
    try {
      if (projectId) {
        saveResult = await saveSpecification({
          projectId,
          currentStep: 5,
          payment_method: selectedMethod,
          status: "filling_requisites"
        });
      }
    } catch (err) {
      logger.error("[Step4] saveSpecification ошибка:", err);
      setErrorMsg("Ошибка сохранения: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
      setIsProcessing(false);
      return;
    }

    if (!saveResult) {
      setErrorMsg(supabaseError || "Не удалось сохранить способ оплаты");
      toast({
        title: "Ошибка сохранения",
        description: supabaseError || "Не удалось сохранить способ оплаты",
        variant: "destructive"
      });
      setLoading(false);
      setIsProcessing(false);
      return;
    }

    try {
      await sendPaymentMethodToTelegram(selectedMethod, projectName);
    } catch (err) {
      logger.warn("[Step4] Ошибка отправки в Telegram (не критично):", err);
    }

    const nextStep = 5;
    setCurrentStep(nextStep);

    if (nextStep > maxStepReached) {
      setMaxStepReached(nextStep);
      if (projectId) {
        try {
          await updateStep(projectId, nextStep, nextStep);
        } catch (updateErr) {
          logger.error("[Step4] Ошибка updateStep:", updateErr);
        }
      }
    } else if (projectId) {
      try {
        await updateStep(projectId, nextStep);
      } catch (updateErr) {
        logger.error("[Step4] Ошибка updateStep (без maxStep):", updateErr);
      }
    }

    setLoading(false);
    setIsProcessing(false);
  };

  const autoSelectedMessage = useMemo(() => {
    const full = enrichedPaymentMethods.filter(m => m.hasSupplierData && m.completeness === 'full');
    return full.length === 1;
  }, [enrichedPaymentMethods]);

  return (
    <motion.div
      key="payment-method"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto mt-24"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-2">Выберите способ оплаты</h2>
        <p className="text-center text-muted-foreground text-base">
          Все методы защищены и поддерживаются нашей командой
        </p>
        {autoSelectedMessage && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
              ✅ Автоматически выбран единственный доступный способ оплаты с реквизитами поставщика
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {enrichedPaymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          const isFull = method.hasSupplierData && method.completeness === 'full';
          const isPartial = method.hasSupplierData && method.completeness === 'partial';
          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all border-2 ${
                isSelected
                  ? "border-blue-600 shadow-lg bg-blue-50 dark:bg-blue-900/10"
                  : isFull
                    ? "border-green-300 bg-green-50 dark:bg-green-900/10 hover:border-green-400"
                    : isPartial
                      ? "border-amber-300 bg-amber-50 dark:bg-amber-900/10 hover:border-amber-400"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-400"
              }`}
              onClick={() => handleSelect(method.id)}
            >
              <CardHeader className="items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  isSelected
                    ? "bg-blue-600"
                    : isFull
                      ? `bg-gradient-to-r ${method.luxuryAccent}`
                      : isPartial
                        ? "bg-amber-400"
                        : "bg-gray-200 dark:bg-gray-800"
                }`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-center text-lg">{method.title}</CardTitle>
                <CardDescription className="text-center">{method.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-2 pt-0">
                <span className="text-xs text-gray-500">💰 Комиссия: <span className="font-medium text-gray-700 dark:text-white">{method.commission}</span></span>
                <span className="text-xs text-gray-500">⚡ Время: <span className="font-medium text-gray-700 dark:text-white">{method.time}</span></span>

                {isFull ? (
                  <div className="flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium mt-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>{sourceLabel(method.primarySource)}</span>
                    {method.supplierRequisitesCount > 1 && (
                      <span className="ml-1 px-1 bg-green-200 rounded-full text-xs">
                        {method.supplierRequisitesCount}
                      </span>
                    )}
                  </div>
                ) : isPartial ? (
                  <div className="flex items-center justify-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Неполные реквизиты</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium mt-1">
                    <Plus className="w-3 h-3" />
                    <span>Ручной ввод</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex justify-between items-center gap-4">
        <Button
          variant="outline"
          className="rounded-full border border-gray-300 text-gray-600 bg-gray-100"
          onClick={() => setCurrentStep(3)}
        >
          Назад
        </Button>
        <Button
          className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
          onClick={handleNext}
          disabled={loading || isProcessing}
        >
          {loading || isProcessing ? "Сохраняем..." : <>Далее<ArrowRight className="h-5 w-5 ml-2" /></>}
        </Button>
      </div>
      {errorMsg && (
        <div className="text-red-600 font-semibold text-center mt-4">{errorMsg}</div>
      )}
    </motion.div>
  );
}
