import React, { useState, useRef, useEffect } from "react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useProjectSupabase } from "../hooks/useProjectSupabase";
import { useToast } from "@/components/ui/use-toast";
import { sendTelegramProjectApprovalRequestClient } from '@/lib/telegram-client';
import { useRealtimeSpecification } from "../hooks/useRealtimeSpecification";
import { useProjectSpecification } from '../hooks/useProjectSpecification';
import { changeProjectStatus } from "@/lib/supabaseProjectStatus";

interface Receipt {
  url: string;
  uploadedAt: string;
}

export default function Step3PaymentForm() {
  const { projectId, setCurrentStep, projectName, maxStepReached, setMaxStepReached } = useCreateProjectContext();
  const [companyData, setCompanyData] = useState<any>(null);
  const role: 'client' | 'supplier' = 'client';
  const { items: specificationItems, loading: specLoading } = useRealtimeSpecification(projectId, role);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const [projectStatus, setProjectStatus] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { saveSpecification, loadSpecification, updateStep } = useProjectSupabase();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items: specItems, addItems } = useProjectSpecification(projectId, role);
  const [error, setError] = useState<string | null>(null);

  // Загрузка receipt при монтировании
  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      const data = await loadSpecification(projectId);
      if (data && data.status === 'waiting_approval') {
        setCurrentStep(2); // Возврат на шаг 2, если ещё не одобрено менеджером
        return;
      }
      if (data && data.receipts) {
        setReceiptUrl(data.receipts);
        if (data.status === 'waiting_receipt' || data.status === 'receipt_approved' || data.status === 'receipt_rejected') setIsWaitingApproval(true);
      } else {
        setReceiptUrl(null);
        setIsWaitingApproval(false);
      }
      // Если статус уже receipt_approved — сразу переводим на 4 шаг
      if (data && data.status === 'receipt_approved') {
        setCurrentStep(4);
        if (4 > maxStepReached) setMaxStepReached(4);
      }
    }
    fetchData();
  }, [projectId, setCurrentStep, loadSpecification]);

  // Polling статуса после загрузки чека
  useEffect(() => {
    if (!isWaitingApproval || !projectId) return;
    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();
      if (!error && data && data.status) {
        setProjectStatus(data.status);
        if (data.status === 'receipt_approved') {
          setIsWaitingApproval(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (specificationItems && specificationItems.length > 0) {
            await addItems(specificationItems);
          }
          const nextStep = 4;
          setCurrentStep(nextStep);
          if (nextStep > maxStepReached) {
            setMaxStepReached(nextStep);
          }
        }
        if (data.status === 'receipt_rejected') {
          setIsWaitingApproval(false);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({ title: 'Чек отклонён менеджером', description: 'Пожалуйста, загрузите новый чек или обратитесь в поддержку.', variant: 'destructive' });
        }
      }
    };
    pollingRef.current = setInterval(checkStatus, 4000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isWaitingApproval, projectId, setCurrentStep, toast, maxStepReached, addItems]);

  // Загружаем companyData из projects
  useEffect(() => {
    async function fetchCompanyData() {
      if (!projectId) return;
      const { data, error } = await supabase
        .from('projects')
        .select('company_data')
        .eq('id', projectId)
        .single();
      if (!error && data && data.company_data) {
        setCompanyData(data.company_data);
      }
    }
    fetchCompanyData();
  }, [projectId]);

  // Гарантируем загрузку спецификации при монтировании/смене projectId
  useEffect(() => {
    if (!projectId) return;
  }, [projectId]);

  // Диагностика: логируем спецификацию на 3 шаге
  useEffect(() => {
  }, [projectId, role, specificationItems]);

  // Загрузка чека
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setIsUploading(true);
    setError(null);
    setReceiptFile(file);
    const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `step3-supplier-receipts/${projectId}/${date}_${cleanName}`;
    const { data, error } = await supabase.storage.from("step3-supplier-receipts").upload(filePath, file);
    if (error) {
      toast({ title: "Ошибка загрузки чека", description: error.message, variant: "destructive" });
      setError("Ошибка загрузки чека: " + error.message);
      setIsUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("step3-supplier-receipts").getPublicUrl(filePath);
    setReceiptUrl(urlData?.publicUrl || "");
    setIsUploading(false);
    // Получаем текущий статус проекта
    let currentStatus = null;
    try {
      const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", projectId)
        .single();
      if (fetchError) throw new Error(fetchError.message);
      currentStatus = project.status;
    } catch (e: any) {
      setError('Ошибка получения статуса: ' + (e.message || e.toString()));
      return;
    }
    try {
      // Сохраняем ссылку на чек (без смены статуса)
      await saveSpecification({ projectId, currentStep: 3, receipts: urlData?.publicUrl || "" });
      // Смена статуса только если это разрешённый переход
      if (currentStatus === "receipt_approved") {
        setError("Чек уже одобрен менеджером. Загрузка нового чека невозможна. Если требуется заменить чек — обратитесь к менеджеру.");
        return;
      }
      if (currentStatus !== "waiting_receipt") {
        await changeProjectStatus({
          projectId,
          newStatus: "waiting_receipt",
          changedBy: "client",
          comment: "Чек загружен клиентом"
        });
      }
    } catch (e: any) {
      setError('Ошибка смены статуса: ' + (e.message || e.toString()));
      return;
    }
    // Отправка чека в Telegram
    const text = `Проект: ${projectName || companyData?.name || ''}\nЗагружен чек об оплате`;
    try {
      await sendTelegramProjectApprovalRequestClient(text + `\nЧек: ${urlData?.publicUrl || ""}`, projectId, "receipt");
    } catch (err) {
      toast({ title: "Ошибка отправки чека в Telegram", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
      setError("Ошибка отправки чека в Telegram: " + (err instanceof Error ? err.message : String(err)));
    }
    setIsWaitingApproval(true);
  };

  const handleRemoveReceiptFile = async () => {
    setReceiptFile(null);
    setReceiptUrl(null);
    if (projectId) {
      // Подгружаем актуальную спецификацию из Supabase перед сохранением
      await saveSpecification({ projectId, currentStep: 3, receipts: null });
    }
  };

  // Отображение спецификации как есть, без группировки
  const mappedSpecificationItems = React.useMemo(() => {
    if (!specificationItems || specificationItems.length === 0) return [];

    return specificationItems.map(item => ({
      name: item.item_name || item.name || 'Товар',
      code: item.item_code || '',
      quantity: item.quantity || 0,
      unit: item.unit || 'шт',
      price: item.price || 0,
      total: item.total || 0
    }));
  }, [specificationItems]);

  // Генерация красивой платёжки с разделением на отправителя и получателя
  const renderPaymentDetails = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 shadow-md">
      <h3 className="text-xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Платёжные реквизиты</h3>
      <div className="flex flex-col md:flex-row gap-8 mb-6">
        {/* Плательщик */}
        <div className="flex-1 min-w-[220px]">
          <div className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Плательщик</div>
          <div className="grid grid-cols-1 gap-y-1 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Компания:</span> <span className="font-medium text-gray-900 dark:text-gray-100">{companyData?.name}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">ИНН:</span> <span className="text-gray-900 dark:text-gray-100">{companyData?.inn}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Банк:</span> <span className="text-gray-900 dark:text-gray-100">{companyData?.bankName}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Счёт:</span> <span className="text-gray-900 dark:text-gray-100">{companyData?.bankAccount}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">БИК:</span> <span className="text-gray-900 dark:text-gray-100">{companyData?.bankBik}</span></div>
          </div>
        </div>
        {/* Получатель */}
        <div className="flex-1 min-w-[220px]">
          <div className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Получатель</div>
          <div className="grid grid-cols-1 gap-y-1 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Компания:</span> <span className="font-medium text-gray-900 dark:text-gray-100">ООО "СтройМаркет-Москва"</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Банк:</span> <span className="text-gray-900 dark:text-gray-100">АО "Альфа-Банк"</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Счёт:</span> <span className="text-gray-900 dark:text-gray-100">40702810400000012345</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">БИК:</span> <span className="text-gray-900 dark:text-gray-100">044525593</span></div>
          </div>
        </div>
      </div>
      {/* Информация о платеже */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
        <div className="flex flex-col md:flex-row md:items-center md:gap-8 mb-2">
          <div className="flex-1">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Назначение платежа</div>
            <div className="font-semibold text-blue-700 dark:text-blue-400">Оплата по проекту "{projectName}"</div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">Пример: Оплата по договору №12345 от 01.01.2024</div>
          </div>
          <div className="flex-1 flex md:justify-end mt-4 md:mt-0">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Сумма к оплате</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{specificationItems && specificationItems.length > 0 ? `${specificationItems.reduce((sum, item) => sum + (item.total || 0), 0)} USD` : '—'}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Спецификация */}
      <h4 className="font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200">Спецификация</h4>
      <table className="min-w-full text-sm border border-gray-200 dark:border-gray-600 rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <th className="px-3 py-2 text-left font-medium">Наименование</th>
            <th className="px-3 py-2 text-left font-medium">Код</th>
            <th className="px-3 py-2 text-left font-medium">Кол-во</th>
            <th className="px-3 py-2 text-left font-medium">Ед. изм.</th>
            <th className="px-3 py-2 text-left font-medium">Цена</th>
            <th className="px-3 py-2 text-left font-medium">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {mappedSpecificationItems.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.code}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.quantity}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.unit}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.price}</td>
              <td className="px-3 py-2 font-semibold text-gray-900 dark:text-gray-100">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Скачать счёт как HTML
  const handleDownloadPayment = () => {
    const html = document.getElementById('payment-details-html')?.outerHTML;
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-details-${projectId || ''}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 text-gray-900">
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <span className="text-blue-800">
            {isWaitingApproval
              ? "Чек загружен, ожидаем подтверждения менеджера"
              : "Ожидаем загрузки чека об оплате"}
          </span>
        </div>
        {/* Счёт */}
        <div id="payment-details-html">{renderPaymentDetails()}</div>
        <Button className="mb-6 bg-blue-100 text-blue-800 border border-blue-300" onClick={handleDownloadPayment}>
          Скачать счёт
        </Button>
        {/* Форма загрузки чека или лоудер */}
        {!isWaitingApproval ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 flex flex-col items-center border border-gray-200 dark:border-gray-700">
            <Label className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Загрузите чек</Label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" ref={fileInputRef} onChange={handleReceiptFileChange}/>
            {!receiptUrl ? (
              <Button onClick={()=>fileInputRef.current?.click()} disabled={isUploading} className="mb-2 bg-blue-500 hover:bg-blue-600 text-white">
                <UploadCloud className="w-5 h-5 mr-2"/> Загрузить чек
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Посмотреть чек</a>
                <Button variant="destructive" onClick={handleRemoveReceiptFile}>Удалить чек</Button>
              </div>
            )}
            {isUploading && <div className="text-blue-500 dark:text-blue-400 mt-2">Загрузка...</div>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <div className="text-blue-600 font-semibold">Ожидание подтверждения оплаты менеджером...</div>
            {projectStatus === 'receipt_approved' && (
              <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                const nextStep = 4;
                setCurrentStep(nextStep);
                if (nextStep > maxStepReached) {
                  setMaxStepReached(nextStep);
                }
              }}>
                Перейти к следующему шагу
              </Button>
            )}
            {projectStatus === 'receipt_rejected' && (
              <div className="flex flex-col items-center gap-2">
                <div className="text-red-600 font-semibold">Чек отклонён менеджером</div>
                <div className="text-gray-700 text-sm mb-2">Пожалуйста, загрузите новый чек или обратитесь в поддержку.</div>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleRemoveReceiptFile}>Загрузить новый чек</Button>
              </div>
            )}
          </div>
        )}
        {/* Дебаг-поле для вывода ошибок и логов */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm whitespace-pre-wrap">
            <b>DEBUG:</b> {error}
          </div>
        )}
      </div>
    </div>
  );
} 