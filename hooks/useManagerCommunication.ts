import { useState, useEffect, useRef } from 'react';
import { sendTelegramMessage } from '@/utils/ApiUtils';
import { supabase } from '@/lib/supabaseClient';
import { cleanProjectRequestId } from '@/utils/IdUtils';
import { POLLING_INTERVALS } from '@/components/project-constructor/config/PollingConstants';

interface UseManagerCommunicationProps {
  projectRequestId: string;
  receiptApprovalStatus: 'pending' | 'approved' | 'rejected' | 'waiting' | null;
  setReceiptApprovalStatus: React.Dispatch<React.SetStateAction<'pending' | 'approved' | 'rejected' | 'waiting' | null>>;
  setCurrentStage?: (stage: number) => void;
}

interface SendClientReceiptParams {
  documentUrl: string;
  caption: string;
  projectRequestId: string;
}

interface SendSupplierReceiptRequestParams {
  projectId: string;
  email: string;
  companyName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  requisites: string;
}

interface SendSupplierReceiptParams {
  projectRequestId: string;
  receiptUrl: string | undefined;
  fileName: string;
}

export function useManagerCommunication({
  projectRequestId,
  receiptApprovalStatus,
  setReceiptApprovalStatus,
  setCurrentStage
}: UseManagerCommunicationProps) {
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Polling для проверки статуса одобрения чека
  useEffect(() => {
    if (receiptApprovalStatus !== 'waiting' || !projectRequestId) return;

    const checkStatus = async () => {
      try {
        // Ищем проект по atomic_request_id
        const { data, error: queryError } = await supabase
          .from('projects')
          .select('status, atomic_moderation_status')
          .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
          .single();

        if (queryError) {
          console.error('❌ Ошибка проверки статуса:', queryError);
          return;
        }

        if (data) {
          // Используем обычный статус проекта для логики чеков
          if (data.status === 'receipt_approved') {
            setReceiptApprovalStatus('approved');
            if (pollingRef.current) clearInterval(pollingRef.current);

            // Переходим к следующему этапу (анимация сделки)
            if (setCurrentStage) {
              setCurrentStage(3);
            }
          }

          if (data.status === 'receipt_rejected') {
            setReceiptApprovalStatus('rejected');
            if (pollingRef.current) clearInterval(pollingRef.current);
            setError('Чек отклонён менеджером. Пожалуйста, загрузите новый чек.');
          }
        }
      } catch (err) {
        console.error('❌ Ошибка polling статуса:', err);
      }
    };

    pollingRef.current = setInterval(checkStatus, POLLING_INTERVALS.PROJECT_STATUS_CHECK);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [receiptApprovalStatus, projectRequestId, setReceiptApprovalStatus, setCurrentStage]);

  // Отправка чека клиента менеджеру
  const sendClientReceipt = async ({
    documentUrl,
    caption,
    projectRequestId
  }: SendClientReceiptParams) => {
    try {
      const telegramResult = await sendTelegramMessage({
        endpoint: 'telegram/send-client-receipt',
        payload: {
          documentUrl,
          caption,
          projectRequestId
        }
      });

      if (telegramResult.success) {
        return { success: true };
      } else {
        console.error("❌ Ошибка API при отправке чека:", telegramResult.error);
        throw new Error(telegramResult.error || 'Неизвестная ошибка API');
      }
    } catch (telegramError) {
      console.error("⚠️ Ошибка отправки в Telegram:", telegramError);
      console.error("⚠️ Детали ошибки:", {
        message: telegramError instanceof Error ? telegramError.message : 'Неизвестная ошибка',
        stack: telegramError instanceof Error ? telegramError.stack : undefined
      });
      // Продолжаем выполнение даже если Telegram недоступен
      return { success: false, error: telegramError };
    }
  };

  // Отправка запроса менеджеру на чек поставщика
  const sendSupplierReceiptRequest = async ({
    projectId,
    email,
    companyName,
    amount,
    currency,
    paymentMethod,
    requisites
  }: SendSupplierReceiptRequestParams) => {
    try {
      const response = await sendTelegramMessage({
        endpoint: 'telegram/send-supplier-receipt-request',
        payload: {
          projectId,
          email,
          companyName,
          amount,
          currency,
          paymentMethod,
          requisites
        }
      });


      // Обновляем статус проекта на waiting_manager_receipt
      await supabase
        .from('projects')
        .update({
          status: 'waiting_manager_receipt',
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      return { success: true };
    } catch (err) {
      console.error('❌ Ошибка отправки запроса менеджеру:', err);
      return { success: false, error: err };
    }
  };

  // Отправка чека поставщика менеджеру
  const sendSupplierReceipt = async ({
    projectRequestId,
    receiptUrl,
    fileName
  }: SendSupplierReceiptParams) => {
    try {
      await sendTelegramMessage({
        endpoint: 'telegram/send-receipt',
        payload: {
          projectRequestId,
          receiptUrl,
          fileName
        }
      });

      return { success: true };
    } catch (err) {
      console.warn('⚠️ Ошибка обработки чека:', err);
      return { success: false, error: err };
    }
  };

  return {
    error,
    setError,
    sendClientReceipt,
    sendSupplierReceiptRequest,
    sendSupplierReceipt
  };
}
