import { logger } from "@/src/shared/lib/logger"
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { db } from "@/lib/db/client";
import { Download, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { sendSupplierReceiptRequestToManagerClient } from "@/lib/telegram-client";
export default function Step6ReceiptForClient() {
  const { projectId, projectName, setCurrentStep, specificationItems, paymentMethod, companyData, currentStep } = useCreateProjectContext();
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Стабильное состояние для начальной загрузки
  const [requisite, setRequisite] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [hasManagerReceipt, setHasManagerReceipt] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [showLoader, setShowLoader] = useState(true); // Стабильное состояние для отображения лоадера
  const sentRequest = useRef(false);
  const isProcessing = useRef(false); // Дополнительная защита от повторных вызовов
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Получаем реквизит из project_requisites
  useEffect(() => {
    async function fetchRequisite() {
      if (!projectId) return;
      
      logger.info("🔍 [STEP6] Загружаем реквизиты для проекта:", projectId);
      
      // Берём последний реквизит для этого проекта
      const { data, error } = await db
        .from("project_requisites")
        .select("data")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      logger.info("🔍 [STEP6] Результат запроса реквизитов:", { data, error });
      
      if (data) {
        logger.info("✅ [STEP6] Реквизиты найдены:", data.data);
        setRequisite(data.data); // data — это jsonb с реквизитами
      } else {
        logger.info("❌ [STEP6] Реквизиты НЕ найдены, причина:", error || "data отсутствует");
        setRequisite(null);
      }
    }
    fetchRequisite();
  }, [projectId]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    
    async function fetchReceipt() {
      if (!projectId) return;
      
      // Устанавливаем загрузку только при первом вызове
      if (isInitialLoading) {
        setIsLoading(true);
      }
      
      const { data, error } = await db
        .from("projects")
        .select("email, company_data, payment_method, amount, currency, status, receipts, updated_at")
        .eq("id", projectId)
        .single();
        
      // Используем дебаунсинг для предотвращения мерцания
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(async () => {
        if (!error && data) {
          // Проверяем наличие загруженного чека от менеджера
          let managerReceiptUrl = null;
          
          if (data.receipts) {
            try {
              // Пробуем парсить как JSON (новый формат)
              const receiptsData = JSON.parse(data.receipts);
              if (receiptsData.manager_receipt) {
                managerReceiptUrl = receiptsData.manager_receipt;
              }
            } catch {
              // Если не JSON, проверяем статус (старый формат)
              if (data.status === "in_work") {
                managerReceiptUrl = data.receipts;
              }
            }
          }
          
          logger.info("🔍 [STEP6] Проверка чека менеджера:", {
            managerReceiptUrl: !!managerReceiptUrl,
            status: data.status,
            hasReceipts: !!data.receipts
          });
          
          if (managerReceiptUrl) {
            setReceiptUrl(managerReceiptUrl);
            setHasManagerReceipt(true);
            setShowLoader(false); // Убираем лоадер при наличии чека
            
            // АВТОМАТИЧЕСКОЕ ИЗМЕНЕНИЕ СТАТУСА: если есть чек, но статус еще waiting_manager_receipt
            if (data.status === "waiting_manager_receipt") {
              logger.info("🔄 [STEP6] Обнаружен чек от менеджера, меняем статус на in_work");
              await db
                .from("projects")
                .update({ 
                  status: "in_work",
                  updated_at: new Date().toISOString()
                })
                .eq("id", projectId);
              logger.info("✅ [STEP6] Статус изменен на in_work");
            }
          } else {
            setReceiptUrl(null);
            // Проверяем наличие manager_receipt в JSON для установки hasManagerReceipt
            if (data.receipts && data.status === "in_work") {
              try {
                const receiptsData = JSON.parse(data.receipts);
                setHasManagerReceipt(!!receiptsData.manager_receipt);
              } catch {
                setHasManagerReceipt(false);
              }
            } else {
              setHasManagerReceipt(false);
            }
          }
        } else {
          setReceiptUrl(null);
        }
        
        // Убираем загрузку только после первой проверки
        if (isInitialLoading) {
          setIsLoading(false);
          setIsInitialLoading(false);
        }
      }, 800); // Уменьшили время для более быстрого отклика
    }
    
    fetchReceipt();
    
    // Интервал только если нет чека и это не первая загрузка
    if (!receiptUrl && !isInitialLoading) {
      interval = setInterval(fetchReceipt, 5000); // Увеличили интервал для уменьшения нагрузки
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (interval) clearInterval(interval);
    };
  }, [projectId, receiptUrl, isInitialLoading]);

  // Отправляем запрос менеджеру при первом заходе на 6 шаг
  useEffect(() => {
    async function sendReceiptRequest() {
      // Множественные проверки защиты от дублирования
      const sentKey = `supplier_receipt_sent_${projectId}`;
      const sessionKey = `session_receipt_sent_${projectId}`;
      const timestamp = Date.now();
      
      // Проверяем localStorage и sessionStorage
      const alreadySentLocal = localStorage.getItem(sentKey);
      const alreadySentSession = sessionStorage.getItem(sessionKey);
      
      // Строгая проверка: если уже отправили или нет проекта - выходим
      if (!projectId || 
          sentRequest.current || 
          isProcessing.current ||
          isRequestSent || 
          alreadySentLocal || 
          alreadySentSession) {
        logger.info("🔄 [STEP6] Запрос на загрузку чека уже отправлен или заблокирован, пропускаем", {
          projectId: !!projectId,
          sentRequestRef: sentRequest.current,
          isProcessing: isProcessing.current,
          isRequestSent,
          alreadySentLocal: !!alreadySentLocal,
          alreadySentSession: !!alreadySentSession,
          timestamp
        });
        return;
      }
      
      // КРИТИЧЕСКИ ВАЖНО: устанавливаем все флаги СРАЗУ в начале функции
      sentRequest.current = true;
      isProcessing.current = true;
      setIsRequestSent(true);
      localStorage.setItem(sentKey, JSON.stringify({ timestamp, sent: true }));
      sessionStorage.setItem(sessionKey, JSON.stringify({ timestamp, sent: true }));
      
      try {
        const { data: fetchedProjectData, error } = await db
          .from("projects")
          .select("email, company_data, amount, currency, payment_method, receipts, status, specification_id")
          .eq("id", projectId)
          .single();
          
        if (error || !fetchedProjectData) {
          logger.info("🔄 [STEP6] Ошибка загрузки данных проекта или данные отсутствуют");
          return;
        }
        
        // Проверяем статус проекта - отправляем только если waiting_manager_receipt
        if (fetchedProjectData.status !== "waiting_manager_receipt") {
          logger.info("🔄 [STEP6] Статус проекта не требует отправки запроса:", fetchedProjectData.status);
          return;
        }
        
        // Сохраняем данные проекта в состояние
        setProjectData(fetchedProjectData);
        
        // Проверяем, есть ли уже чек от менеджера
        let hasManagerReceiptLocal = false;
        if (fetchedProjectData.receipts) {
          try {
            const receiptsData = JSON.parse(fetchedProjectData.receipts);
            hasManagerReceiptLocal = !!receiptsData.manager_receipt;
          } catch {
            // Старый формат - проверяем по статусу
            hasManagerReceiptLocal = fetchedProjectData.status === "in_work";
          }
        }
        
        // Устанавливаем состояние
        setHasManagerReceipt(hasManagerReceiptLocal);
        
        // Если чек уже загружен, не отправляем запрос
        if (hasManagerReceiptLocal) {
          logger.info("🔄 [STEP6] Чек от менеджера уже загружен, запрос не отправляем");
          localStorage.setItem(sentKey, JSON.stringify({ timestamp, completed: true }));
          sessionStorage.setItem(sessionKey, JSON.stringify({ timestamp, completed: true }));
          return;
        }
        
        logger.info("🔄 [STEP6] Отправляем запрос менеджеру на загрузку чека");
        
        // Получаем актуальную спецификацию из базы данных
        let totalAmount = 0;
        if (fetchedProjectData.specification_id) {
          const { data: specData } = await db
            .from('project_specifications')
            .select('*')
            .eq('id', fetchedProjectData.specification_id)
            .single();
          
          if (specData) {
            totalAmount = specData.total || specData.totalPrice || 0;
          }
        }
        
        // Fallback: если нет specification_id, используем текущие specificationItems
        if (totalAmount === 0 && specificationItems && specificationItems.length > 0) {
          totalAmount = specificationItems.reduce((sum, item) => sum + (item.total || item.totalPrice || 0), 0);
        }
        
        // Если все еще 0, используем amount из проекта
        if (totalAmount === 0) {
          totalAmount = fetchedProjectData.amount || 0;
        }
        
        // Получаем реквизиты для включения в сообщение
        let requisiteText = '';
        try {
          logger.info("🔍 [TELEGRAM] Получаем реквизиты для проекта:", projectId);
          
          const { data: requisiteData } = await db
            .from("project_requisites")
            .select("data")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          logger.info("🔍 [TELEGRAM] Результат запроса реквизитов:", { 
            hasData: !!requisiteData, 
            data: requisiteData,
            paymentMethod: fetchedProjectData.payment_method 
          });
          
          if (requisiteData?.data) {
            const req = requisiteData.data;
            const details = req.details || req;
            
            logger.info("🔍 [TELEGRAM] Обрабатываем реквизиты:", { req, details, paymentMethod: fetchedProjectData.payment_method });
            
            if (fetchedProjectData.payment_method === 'bank-transfer') {
              requisiteText = `\n\n📋 Реквизиты для оплаты:\n• Получатель: ${details.recipientName || '-'}\n• Банк: ${details.bankName || '-'}\n• Счет: ${details.accountNumber || '-'}\n• SWIFT/BIC: ${details.swift || details.cnapsCode || details.iban || '-'}\n• Валюта: ${details.transferCurrency || 'USD'}`;
            } else if (fetchedProjectData.payment_method === 'p2p') {
              requisiteText = `\n\n💳 Карта для P2P:\n• Банк: ${req.bank || '-'}\n• Номер карты: ${req.card_number || '-'}\n• Держатель: ${req.holder_name || '-'}`;
            } else if (fetchedProjectData.payment_method === 'crypto') {
              requisiteText = `\n\n🪙 Криптокошелек:\n• Адрес: ${req.address || '-'}\n• Сеть: ${req.network || '-'}`;
            }
            
            logger.info("✅ [TELEGRAM] Сформированный текст реквизитов:", requisiteText);
          } else {
            logger.info("❌ [TELEGRAM] Данные реквизитов отсутствуют");
          }
        } catch (error) {
          logger.info("⚠️ [TELEGRAM] Не удалось получить реквизиты для сообщения:", error);
        }
        
        // Обновляем сумму в базе данных, если она отличается
        if (totalAmount !== fetchedProjectData.amount && totalAmount > 0) {
          logger.info(`💰 Обновляем сумму в БД: ${fetchedProjectData.amount} → ${totalAmount}`);
          await db
            .from("projects")
            .update({ amount: totalAmount })
            .eq("id", projectId);
        }
        
        // Отправляем запрос менеджеру с правильной суммой и реквизитами
        await sendSupplierReceiptRequestToManagerClient({
          projectId,
          email: fetchedProjectData.email || "email@example.com",
          companyName: projectName || "Проект",
          amount: totalAmount,
          currency: fetchedProjectData.currency || "USD",
          paymentMethod: fetchedProjectData.payment_method || "bank-transfer",
          requisites: requisiteText
        });
        
        logger.info("✅ [STEP6] Запрос менеджеру отправлен успешно");
        
        // Обновляем флаги после успешной отправки
        localStorage.setItem(sentKey, JSON.stringify({ timestamp, completed: true }));
        sessionStorage.setItem(sessionKey, JSON.stringify({ timestamp, completed: true }));
        
      } catch (error) {
        logger.error("❌ [STEP6] Ошибка отправки запроса менеджеру:", error);
        // При ошибке сбрасываем флаги, чтобы можно было повторить попытку
        sentRequest.current = false;
        isProcessing.current = false;
        setIsRequestSent(false);
        localStorage.removeItem(sentKey);
        sessionStorage.removeItem(sessionKey);
      } finally {
        // Сбрасываем флаг обработки в любом случае
        isProcessing.current = false;
      }
    }
    
    // Небольшая задержка перед вызовом для стабилизации
    const timeoutId = setTimeout(sendReceiptRequest, 500);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [projectId]); // Убираем specificationItems из зависимостей

  // --- Сводка спецификации, способа оплаты и реквизита ---
  const renderRequisiteTable = (requisite: any): React.ReactNode => {
    if (!requisite || typeof requisite !== 'object') return <span>—</span>;
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
    const details: Record<string, any> = requisite.details || requisite;
    const rows = Object.entries(details).filter(([_, value]) => value).map(([key, value]) => (
      <tr key={key}>
        <td className="px-2 py-1 font-medium text-gray-700">{keyLabels[key] || key}</td>
        <td className="px-2 py-1">{value}</td>
      </tr>
    ));
    if (rows.length === 0) return <span>—</span>;
    return (
      <table className="min-w-full text-sm">
        <tbody>{rows}</tbody>
      </table>
    );
  };

  return (
    <div className="max-w-2xl mx-auto mt-24 text-gray-900">
      <div className="mb-8 flex flex-col items-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-center">Получение средств</h2>
        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle>Ваша спецификация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm mb-2">
                <thead>
                  <tr className="text-gray-500">
                    <th className="px-2 py-1 text-left">Наименование</th>
                    <th className="px-2 py-1 text-left">Кол-во</th>
                    <th className="px-2 py-1 text-left">Цена</th>
                    <th className="px-2 py-1 text-left">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {specificationItems.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-2 py-1">{item.item_name || item.name}</td>
                      <td className="px-2 py-1">{item.quantity}</td>
                      <td className="px-2 py-1">{item.price || item.pricePerUnit}</td>
                      <td className="px-2 py-1">{item.total || item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right font-semibold">Итого: {specificationItems.reduce((sum, item) => sum + (item.total || item.totalPrice || 0), 0)}</div>
            </div>
            <div className="mt-4">
              <div><b>Способ оплаты:</b> {paymentMethod === 'bank-transfer' ? 'Банковский перевод' : paymentMethod === 'p2p' ? 'P2P перевод' : paymentMethod === 'crypto' ? 'Криптовалюта' : '-'}</div>
              <div className="mt-2"><b>Реквизиты для оплаты:</b>
                {requisite ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 mt-1 text-xs text-gray-900 dark:text-gray-100 overflow-x-auto">
                    {renderRequisiteTable(requisite)}
                  </div>
                ) : '—'}
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-muted-foreground text-base mb-4">
          {receiptUrl
            ? "✅ Выплата успешно отправлена. Вы можете скачать чек о переводе."
            : projectData?.status === "in_work" 
              ? hasManagerReceipt
                ? "✅ Чек от менеджера готов к просмотру!"
                : "⏳ Ожидаем загрузки чека от менеджера. Мы уведомим вас, когда чек будет готов."
              : "Ожидайте, менеджер загрузит чек о переводе средств."}
        </p>
        {/* Единый стабильный лоадер */}
        {!receiptUrl && showLoader ? (
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-gray-600 text-sm">
              {isLoading && isInitialLoading ? "Проверяем наличие чека..." : "Ожидаем чек от менеджера..."}
            </span>
          </div>
        ) : receiptUrl ? (
          <>
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 mt-4">
                <Download className="h-5 w-5" /> Скачать чек
              </Button>
            </a>
            <Button
              className="mt-4 bg-green-600 hover:bg-green-700 text-white"
              onClick={async () => {
                logger.info("🔄 [STEP6] Переходим на Step7, обновляем статус на waiting_client_confirmation");
                setCurrentStep(7);
                if (projectId) {
                  await db
                    .from("projects")
                    .update({ 
                      current_step: 7,
                      max_step_reached: 7,
                      status: "waiting_client_confirmation"
                    })
                    .eq("id", projectId);
                  logger.info("✅ [STEP6] Статус проекта обновлен на waiting_client_confirmation");
                }
              }}
            >
              Перейти к следующему шагу
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
} 