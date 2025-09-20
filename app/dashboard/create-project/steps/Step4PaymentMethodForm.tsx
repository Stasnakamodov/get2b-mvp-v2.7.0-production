import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Landmark, CreditCard, Wallet, CheckCircle, Plus } from "lucide-react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { useToast } from "@/components/ui/use-toast";
import { useProjectSupabase } from "../hooks/useProjectSupabase";
import { sendPaymentMethodToTelegram } from "../utils/telegram";
import { supabase } from "@/lib/supabaseClient";
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

  // 🎯 СИСТЕМА ЭХО РЕКОМЕНДАЦИЙ - загружаем данные поставщика по supplier_name из спецификаций
  useEffect(() => {
    // Пропускаем если нет проекта или уже есть обработанные эхо данные
    if (!projectId || supplierData?.echo_source === 'processed') {
      console.log("[Step4] ⏭️ Пропускаем загрузку эхо данных:", { 
        projectId: !!projectId, 
        echoProcessed: supplierData?.echo_source === 'processed'
      });
      return;
    }

    async function loadEchoSupplierData() {
      console.log("[Step4] 🔍 Загружаем эхо данные поставщиков для автозаполнения...");
      
      try {
        // 1. Получаем всех уникальных поставщиков из спецификаций проекта
        const { data: specifications, error: specsError } = await supabase
          .from("project_specifications")
          .select("supplier_name")
          .eq("project_id", projectId)
          .not("supplier_name", "is", null)
          .not("supplier_name", "eq", "");
        
        if (specsError) {
          console.error("[Step4] Ошибка получения спецификаций:", specsError);
          return;
        }

        if (!specifications || specifications.length === 0) {
          console.log("[Step4] Нет поставщиков в спецификациях");
          return;
        }

        const suppliers = [...new Set(specifications.map(s => s.supplier_name))];
        console.log("[Step4] Найдены поставщики:", suppliers);

        // 2. Для каждого поставщика ищем завершенные проекты с реквизитами И дополняем из каталога
        for (const supplierName of suppliers) {
          console.log(`[Step4] 🔍 Поиск эхо данных для поставщика: "${supplierName}"`);
          
          // Находим проекты с этим поставщиком где есть payment_method (завершенные проекты)
          const { data: echoProjects, error: echoError } = await supabase
            .from("project_specifications")
            .select(`
              project_id,
              projects!inner(payment_method, user_id)
            `)
            .ilike("supplier_name", `%${supplierName}%`)
            .not("projects.payment_method", "is", null);
          
          if (echoError) {
            console.error(`[Step4] Ошибка поиска эхо проектов для ${supplierName}:`, echoError);
            continue;
          }

          // Ищем поставщика в каталоге независимо от эхо проектов
          console.log(`[Step4] 🔍 Поиск реального поставщика ${supplierName} в каталоге...`);
          const { data: catalogSupplier, error: catalogError } = await supabase
            .from('catalog_verified_suppliers')
            .select('id, name, company_name, payment_methods, bank_accounts, crypto_wallets, p2p_cards')
            .ilike('name', `%${supplierName}%`)
            .single();
          
          if (catalogError) {
            console.log(`[Step4] Поставщик не найден в каталоге:`, catalogError.message);
          }

          // Если нет ни эхо проектов, ни каталога - пропускаем
          if ((!echoProjects || echoProjects.length === 0) && !catalogSupplier) {
            console.log(`[Step4] Нет данных для поставщика ${supplierName} (ни эхо проектов, ни каталога)`);
            continue;
          }

          console.log(`[Step4] ✅ Найдены данные для ${supplierName}:`, { 
            echoProjects: echoProjects?.length || 0, 
            catalogFound: !!catalogSupplier 
          });
          
          // 3. Создаем улучшенные данные поставщика: существующие + эхо + каталог
          const echoPaymentMethods = echoProjects ? [...new Set(echoProjects.map((p: any) => p.projects?.payment_method).filter(Boolean))] : [];
          
          // Объединяем существующие данные с новыми из каталога
          const enhancedSupplierData = {
            // Берем существующие данные как основу
            ...(supplierData || {}),
            // Обновляем основную информацию
            name: supplierData?.name || supplierName,
            company_name: supplierData?.company_name || catalogSupplier?.company_name || supplierName,
            
            // Объединяем методы оплаты: существующие + эхо + каталог
            payment_methods: [
              ...(supplierData?.payment_methods || []),
              ...echoPaymentMethods,
              ...(catalogSupplier?.payment_methods || [])
            ].filter((method, index, arr) => arr.indexOf(method) === index), // убираем дубликаты
            
            // Дополняем реквизиты из каталога если их нет
            bank_accounts: supplierData?.bank_accounts || catalogSupplier?.bank_accounts || [],
            crypto_wallets: supplierData?.crypto_wallets || catalogSupplier?.crypto_wallets || [],
            p2p_cards: supplierData?.p2p_cards || catalogSupplier?.p2p_cards || [],
            
            // Метаданные
            echo_source: 'processed', // помечаем что обработано
            echo_projects_count: echoProjects?.length || 0,
            catalog_found: !!catalogSupplier,
            enhanced: true // помечаем как улучшенные данные
          };

          console.log(`[Step4] 🎯 Создаем улучшенные данные для ${supplierName}:`, enhancedSupplierData);
          setSupplierData(enhancedSupplierData);
          
          // Берем данные первого найденного поставщика для автозаполнения
          break;
        }
      } catch (error) {
        console.error("[Step4] Ошибка загрузки эхо данных:", error);
      }
    }

    loadEchoSupplierData();
  }, [projectId, supplierData, setSupplierData]);

  // 🎯 Определяем, для каких методов есть реквизиты поставщика
  const methodsWithSupplierData = useMemo(() => {
    console.log("[Step4] Данные поставщика:", supplierData);
    console.log("[Step4] Методы оплаты поставщика:", supplierData?.payment_methods);
    
    if (!supplierData?.payment_methods || !Array.isArray(supplierData.payment_methods)) {
      console.log("[Step4] Нет данных о методах оплаты поставщика");
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
      
    console.log("[Step4] Маппинг методов БД -> UI:", supplierData.payment_methods, "->", uiMethods);
    
    return uiMethods;
  }, [supplierData]);

  // 🎯 Добавляем информацию о наличии реквизитов к каждому методу
  const enrichedPaymentMethods = useMemo(() => {
    return paymentMethods.map(method => {
      const hasSupplierData = methodsWithSupplierData.includes(method.id);
      const supplierRequisitesCount = getSupplierRequisitesCount(method.id);
      console.log(`[Step4] ${method.id}: hasSupplierData=${hasSupplierData}, supplierRequisitesCount=${supplierRequisitesCount}`);
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
        console.log(`[Step4] bank-transfer реквизиты:`, count, supplierData.bank_accounts);
        return count;
      case 'p2p':
        count = (Array.isArray(supplierData.p2p_cards) ? supplierData.p2p_cards.length : 0);
        console.log(`[Step4] p2p реквизиты:`, count, supplierData.p2p_cards);
        return count;
      case 'crypto':
        count = (Array.isArray(supplierData.crypto_wallets) ? supplierData.crypto_wallets.length : 0);
        console.log(`[Step4] crypto реквизиты:`, count, supplierData.crypto_wallets, `(null: ${supplierData.crypto_wallets === null})`);
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
      console.log("[Step4] Автовыбираем единственный метод с реквизитами поставщика:", singleMethod);
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
      console.log("[Step4] Обработка уже идет, игнорируем повторное нажатие");
      return;
    }
    
    console.log("[Step4] handleNext вызван с selectedMethod:", selectedMethod);
    setIsProcessing(true);
    setErrorMsg(null);
    
    if (!selectedMethod) {
      console.log("[Step4] Способ оплаты не выбран");
      toast({ title: "Выберите способ оплаты", variant: "destructive" });
      setIsProcessing(false);
      return;
    }
    
    const allowedMethods = ["bank-transfer", "p2p", "crypto"];
    if (!allowedMethods.includes(selectedMethod)) {
      console.log("[Step4] Недопустимый способ оплаты:", selectedMethod);
      toast({ title: "Недопустимый способ оплаты", variant: "destructive" });
      setIsProcessing(false);
      return;
    }
    
    console.log("[Step4] Начинаем сохранение, projectId:", projectId);
    setLoading(true);
    setPaymentMethod(selectedMethod);
    
    let saveResult = true;
    try {
      if (projectId) {
        console.log("[Step4] Вызываем saveSpecification...");
        saveResult = await saveSpecification({ 
          projectId, 
          currentStep: 5, 
          payment_method: selectedMethod, 
          status: "filling_requisites" 
        });
        console.log("[Step4] saveSpecification результат:", saveResult);
      } else {
        console.warn("[Step4] projectId отсутствует!");
      }
    } catch (err) {
      console.error("[Step4] saveSpecification ошибка:", err);
      setErrorMsg("Ошибка сохранения: " + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
      setIsProcessing(false);
      return;
    }
    
    if (!saveResult) {
      console.error("[Step4] saveSpecification вернул false, supabaseError:", supabaseError);
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
      console.log("[Step4] Отправляем в Telegram...");
      await sendPaymentMethodToTelegram(selectedMethod, projectName);
      console.log("[Step4] Отправка в Telegram успешна");
    } catch (err) {
      console.warn("[Step4] Ошибка отправки в Telegram (не критично):", err);
      // Не блокируем переход из-за ошибки Telegram
    }
    
    // Переход на следующий шаг
    const nextStep = 5;
    console.log("[Step4] Переходим на шаг:", nextStep);
    console.log("[Step4] Текущий maxStepReached:", maxStepReached);
    
    setCurrentStep(nextStep);
    
    if (nextStep > maxStepReached) {
      console.log("[Step4] Обновляем maxStepReached до:", nextStep);
      setMaxStepReached(nextStep);
      if (projectId) {
        try {
          await updateStep(projectId, nextStep, nextStep);
          console.log("[Step4] updateStep успешно выполнен");
        } catch (updateErr) {
          console.error("[Step4] Ошибка updateStep:", updateErr);
        }
      }
    } else if (projectId) {
      try {
        await updateStep(projectId, nextStep);
        console.log("[Step4] updateStep (без maxStep) успешно выполнен");
      } catch (updateErr) {
        console.error("[Step4] Ошибка updateStep (без maxStep):", updateErr);
      }
    }
    
    setLoading(false);
    setIsProcessing(false);
    console.log("[Step4] handleNext завершен успешно");
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