import { logger } from "@/src/shared/lib/logger"
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Landmark, CreditCard, Wallet, CheckCircle, Plus } from "lucide-react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { useToast } from "@/hooks/use-toast";
import { useProjectSupabase } from "../hooks/useProjectSupabase";
import { sendPaymentMethodToTelegram } from "../utils/telegram";
import { db } from "@/lib/db/client";
import { hasSupplierRecommendations } from "@/lib/suppliers/loadCatalogSupplier";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
const paymentMethods = [
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

export default function Step4PaymentMethodForm() {
  const { setCurrentStep, maxStepReached, setMaxStepReached, projectName, paymentMethod, setPaymentMethod, projectId, supplierData, setSupplierData } = useCreateProjectContext();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(paymentMethod);
  const { toast } = useToast();
  const { saveSpecification, updateStep, error: supabaseError } = useProjectSupabase();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Экранирование спецсимволов ilike (%, _) в строке поиска
  function escapeIlike(str: string): string {
    return str.replace(/%/g, '\\%').replace(/_/g, '\\_');
  }

  // Ref для отслеживания обработки эхо данных — не вызывает перерендер
  const echoProcessedRef = useRef(false);

  // 🎯 СИСТЕМА ЭХО РЕКОМЕНДАЦИЙ - загружаем данные поставщика по supplier_name из спецификаций
  // ВАЖНО: это fallback-механизм для старых проектов. Если supplierData уже заполнен
  // (пришёл из каталога через CartLoader/Step2 или восстановлен из БД) — НЕ запускаем echo,
  // иначе поиск по имени может перетереть валидные данные.
  useEffect(() => {
    if (hasSupplierRecommendations(supplierData)) {
      logger.info("[Step4] ⏭️ supplierData уже содержит рекомендации — echo не нужен");
      echoProcessedRef.current = true;
      return;
    }

    // Пропускаем если нет проекта или уже обработано (через ref, а не через supplierData)
    if (!projectId || echoProcessedRef.current) {
      logger.info("[Step4] ⏭️ Пропускаем загрузку эхо данных:", {
        projectId: !!projectId,
        echoProcessed: echoProcessedRef.current
      });
      return;
    }

    // 🎯 Сначала пробуем загрузить по supplier_id из БД (надёжный путь)
    async function loadSupplierById() {
      const { data: project } = await db
        .from('projects')
        .select('supplier_id, supplier_type')
        .eq('id', projectId)
        .single();

      if (!project?.supplier_id) return false;

      logger.info("[Step4] 🔍 Загружаем поставщика по supplier_id из БД:", project.supplier_id);
      const { loadCatalogSupplier } = await import('@/lib/suppliers/loadCatalogSupplier');
      const catalogData = await loadCatalogSupplier(project.supplier_id);

      if (catalogData && hasSupplierRecommendations(catalogData)) {
        logger.info("[Step4] ✅ Загружены рекомендации по supplier_id:", catalogData.name);
        echoProcessedRef.current = true;
        setSupplierData(catalogData);
        return true;
      }
      return false;
    }

    async function loadEchoSupplierData() {
      logger.info("[Step4] 🔍 Загружаем эхо данные поставщиков для автозаполнения...");

      try {
        // 1. Получаем всех уникальных поставщиков из спецификаций проекта
        const { data: specifications, error: specsError } = await db
          .from("project_specifications")
          .select("supplier_name")
          .eq("project_id", projectId)
          .not("supplier_name", "is", null)
          .not("supplier_name", "eq", "");

        if (specsError) {
          logger.error("[Step4] Ошибка получения спецификаций:", specsError);
          return;
        }

        if (!specifications || specifications.length === 0) {
          logger.info("[Step4] Нет поставщиков в спецификациях");
          return;
        }

        const suppliers = [...new Set(specifications.map(s => s.supplier_name))] as string[];
        logger.info("[Step4] Найдены поставщики:", suppliers);

        // 2. Для каждого поставщика ищем завершенные проекты с реквизитами И дополняем из каталога
        for (const supplierName of suppliers) {
          logger.info(`[Step4] 🔍 Поиск эхо данных для поставщика: "${supplierName}"`);
          const safeName = escapeIlike(supplierName);

          // Находим проекты с этим поставщиком, потом фильтруем те, где есть payment_method
          const { data: specRows, error: specError } = await db
            .from("project_specifications")
            .select("project_id")
            .ilike("supplier_name", `%${safeName}%`);

          if (specError) {
            logger.error(`[Step4] Ошибка поиска спецификаций для ${supplierName}:`, specError);
            continue;
          }

          let echoProjects: any[] = [];
          if (specRows && specRows.length > 0) {
            const projectIds = [...new Set(specRows.map((r: any) => r.project_id))];
            const { data: projects, error: projError } = await db
              .from("projects")
              .select("id, payment_method, user_id")
              .in("id", projectIds)
              .not("payment_method", "is", null);

            if (!projError && projects) {
              echoProjects = projects.map((p: any) => ({
                project_id: p.id,
                projects: { payment_method: p.payment_method, user_id: p.user_id }
              }));
            }
          }

          // Ищем поставщика в каталоге — .limit(1) вместо .single() чтобы не падать при 0 или 2+ результатах
          logger.info(`[Step4] 🔍 Поиск реального поставщика ${supplierName} в каталоге...`);
          const { data: catalogRows, error: catalogError } = await db
            .from('catalog_verified_suppliers')
            .select('id, name, company_name, payment_methods, bank_accounts, crypto_wallets, p2p_cards')
            .ilike('name', `%${safeName}%`)
            .limit(1);

          const catalogSupplier = catalogRows?.[0] || null;

          if (catalogError) {
            logger.info(`[Step4] Поставщик не найден в каталоге:`, catalogError.message);
          }

          // Если нет ни эхо проектов, ни каталога - пропускаем
          if ((!echoProjects || echoProjects.length === 0) && !catalogSupplier) {
            logger.info(`[Step4] Нет данных для поставщика ${supplierName} (ни эхо проектов, ни каталога)`);
            continue;
          }

          logger.info(`[Step4] ✅ Найдены данные для ${supplierName}:`, {
            echoProjects: echoProjects?.length || 0,
            catalogFound: !!catalogSupplier
          });

          // 3. Создаем улучшенные данные поставщика: эхо + каталог
          const echoPaymentMethods = echoProjects ? [...new Set(echoProjects.map((p: any) => p.projects?.payment_method).filter(Boolean))] : [];

          const enhancedSupplierData = {
            name: supplierName,
            company_name: catalogSupplier?.company_name || supplierName,

            // Объединяем методы оплаты: эхо + каталог (дедупликация)
            payment_methods: [
              ...echoPaymentMethods,
              ...(catalogSupplier?.payment_methods || [])
            ].filter((method, index, arr) => arr.indexOf(method) === index),

            bank_accounts: catalogSupplier?.bank_accounts || [],
            crypto_wallets: catalogSupplier?.crypto_wallets || [],
            p2p_cards: catalogSupplier?.p2p_cards || [],

            // Метаданные
            echo_source: 'processed',
            echo_projects_count: echoProjects?.length || 0,
            catalog_found: !!catalogSupplier,
            enhanced: true
          };

          logger.info(`[Step4] 🎯 Создаем улучшенные данные для ${supplierName}:`, enhancedSupplierData);

          // Помечаем как обработано ДО setSupplierData, чтобы повторный вызов не сработал
          echoProcessedRef.current = true;
          setSupplierData(enhancedSupplierData);

          // Берем данные первого найденного поставщика для автозаполнения
          break;
        }
      } catch (error) {
        logger.error("[Step4] Ошибка загрузки эхо данных:", error);
      }
    }

    // Сначала пробуем по ID, если не нашли — fallback на echo
    loadSupplierById().then(found => {
      if (!found) {
        loadEchoSupplierData();
      }
    });
  }, [projectId, setSupplierData, supplierData]);

  // 🎯 Определяем, для каких методов есть реквизиты поставщика
  const methodsWithSupplierData = useMemo(() => {
    logger.info("[Step4] Данные поставщика:", supplierData);
    logger.info("[Step4] Методы оплаты поставщика:", supplierData?.payment_methods);
    
    if (!supplierData?.payment_methods || !Array.isArray(supplierData.payment_methods)) {
      logger.info("[Step4] Нет данных о методах оплаты поставщика");
      return [];
    }
    
    // Маппинг между форматами БД и UI
    const dbToUiMapping: Record<string, string> = {
      'bank_transfer': 'bank-transfer', // БД использует подчеркивание, UI - дефис
      'p2p': 'p2p', // одинаково
      'crypto': 'crypto', // одинаково
      'card': 'p2p', // карточные переводы = P2P в UI
      // 'cash': убран - наличные не поддерживаются на сайте
    };

    // Преобразуем форматы БД в форматы UI, исключая cash (наличные)
    const uiMethods = supplierData.payment_methods
      .filter((dbMethod: string) => dbMethod !== 'cash') // Исключаем наличные
      .map((dbMethod: string) => dbToUiMapping[dbMethod] || dbMethod)
      .filter(Boolean)
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Убираем дубликаты
      
    logger.info("[Step4] Маппинг методов БД -> UI:", supplierData.payment_methods, "->", uiMethods);
    
    return uiMethods;
  }, [supplierData]);

  // 🎯 Добавляем информацию о наличии реквизитов к каждому методу
  const enrichedPaymentMethods = useMemo(() => {
    return paymentMethods.map(method => {
      const hasSupplierData = methodsWithSupplierData.includes(method.id);
      const supplierRequisitesCount = getSupplierRequisitesCount(method.id);
      logger.info(`[Step4] ${method.id}: hasSupplierData=${hasSupplierData}, supplierRequisitesCount=${supplierRequisitesCount}`);
      return {
        ...method,
        hasSupplierData,
        supplierRequisitesCount
      };
    });
  }, [methodsWithSupplierData, supplierData]);

  // Функция для подсчета реквизитов поставщика для конкретного метода
  function getSupplierRequisitesCount(methodId: string): number {
    if (!supplierData) return 0;
    
    let count = 0;
    switch (methodId) {
      case 'bank-transfer':
        count = (Array.isArray(supplierData.bank_accounts) ? supplierData.bank_accounts.length : 0);
        logger.info(`[Step4] bank-transfer реквизиты:`, count, supplierData.bank_accounts);
        return count;
      case 'p2p':
        count = (Array.isArray(supplierData.p2p_cards) ? supplierData.p2p_cards.length : 0);
        logger.info(`[Step4] p2p реквизиты:`, count, supplierData.p2p_cards);
        return count;
      case 'crypto':
        count = (Array.isArray(supplierData.crypto_wallets) ? supplierData.crypto_wallets.length : 0);
        logger.info(`[Step4] crypto реквизиты:`, count, supplierData.crypto_wallets, `(null: ${supplierData.crypto_wallets === null})`);
        return count;
      default:
        return 0;
    }
  }

  useEffect(() => {
    if (paymentMethod) setSelectedMethod(paymentMethod);
    if (projectId) {
      updateStep(projectId, 4);
    }
  }, [paymentMethod, projectId, updateStep]);

  // 🎯 Умное автозаполнение при одном методе с реквизитами поставщика
  useEffect(() => {
    const methodsWithData = enrichedPaymentMethods.filter(method => method.hasSupplierData);
    if (methodsWithData.length === 1 && !selectedMethod) {
      const singleMethod = methodsWithData[0].id;
      logger.info("[Step4] Автовыбираем единственный метод с реквизитами поставщика:", singleMethod);
      setSelectedMethod(singleMethod);
      setPaymentMethod(singleMethod);
    }
  }, [enrichedPaymentMethods, selectedMethod, setPaymentMethod]);

  const handleSelect = (method: string) => {
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
      logger.info("[Step4] Способ оплаты не выбран");
      toast({ title: "Выберите способ оплаты", variant: "destructive" });
      setIsProcessing(false);
      return;
    }
    
    const allowedMethods = ["bank-transfer", "p2p", "crypto"];
    if (!allowedMethods.includes(selectedMethod)) {
      logger.info("[Step4] Недопустимый способ оплаты:", selectedMethod);
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
        logger.info("[Step4] Вызываем saveSpecification...");
        saveResult = await saveSpecification({ 
          projectId, 
          currentStep: 5, 
          payment_method: selectedMethod, 
          status: "filling_requisites" 
        });
        logger.info("[Step4] saveSpecification результат:", saveResult);
      } else {
        logger.warn("[Step4] projectId отсутствует!");
      }
    } catch (err) {
      logger.error("[Step4] saveSpecification ошибка:", err);
      setErrorMsg("Ошибка сохранения: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
      setIsProcessing(false);
      return;
    }
    
    if (!saveResult) {
      logger.error("[Step4] saveSpecification вернул false, supabaseError:", supabaseError);
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
    
    // Отправка в Telegram (не критично для перехода)
    try {
      logger.info("[Step4] Отправляем в Telegram...");
      await sendPaymentMethodToTelegram(selectedMethod, projectName);
      logger.info("[Step4] Отправка в Telegram успешна");
    } catch (err) {
      logger.warn("[Step4] Ошибка отправки в Telegram (не критично):", err);
      // Не блокируем переход из-за ошибки Telegram
    }
    
    // Переход на следующий шаг
    const nextStep = 5;
    logger.info("[Step4] Переходим на шаг:", nextStep);
    logger.info("[Step4] Текущий maxStepReached:", maxStepReached);
    
    setCurrentStep(nextStep);
    
    if (nextStep > maxStepReached) {
      logger.info("[Step4] Обновляем maxStepReached до:", nextStep);
      setMaxStepReached(nextStep);
      if (projectId) {
        try {
          await updateStep(projectId, nextStep, nextStep);
          logger.info("[Step4] updateStep успешно выполнен");
        } catch (updateErr) {
          logger.error("[Step4] Ошибка updateStep:", updateErr);
        }
      }
    } else if (projectId) {
      try {
        await updateStep(projectId, nextStep);
        logger.info("[Step4] updateStep (без maxStep) успешно выполнен");
      } catch (updateErr) {
        logger.error("[Step4] Ошибка updateStep (без maxStep):", updateErr);
      }
    }
    
    setLoading(false);
    setIsProcessing(false);
    logger.info("[Step4] handleNext завершен успешно");
  };

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
        {enrichedPaymentMethods.filter(m => m.hasSupplierData).length === 1 && (
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
          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all border-2 ${
                isSelected
                  ? "border-blue-600 shadow-lg bg-blue-50 dark:bg-blue-900/10"
                  : method.hasSupplierData
                    ? "border-green-300 bg-green-50 dark:bg-green-900/10 hover:border-green-400"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400"
              }`}
              onClick={() => handleSelect(method.id)}
            >
              <CardHeader className="items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  isSelected
                    ? "bg-blue-600"
                    : method.hasSupplierData
                      ? `bg-gradient-to-r ${method.luxuryAccent}`
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
                
                {/* Индикатор наличия реквизитов поставщика */}
                {method.hasSupplierData ? (
                  <div className="flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium mt-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Реквизиты поставщика</span>
                    {method.supplierRequisitesCount > 1 && (
                      <span className="ml-1 px-1 bg-green-200 rounded-full text-xs">
                        {method.supplierRequisitesCount}
                      </span>
                    )}
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