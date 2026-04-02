import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db/client';
import { cleanProjectRequestId } from '@/utils/IdUtils';
import { POLLING_INTERVALS } from '@/components/project-constructor/config/PollingConstants';

interface UseProjectPollingProps {
  projectRequestId: string;
  currentStage: number;
  isRequestSent: boolean;
  sendManagerReceiptRequest: () => Promise<void>;
}

export function useProjectPolling({
  projectRequestId,
  currentStage,
  isRequestSent,
  sendManagerReceiptRequest
}: UseProjectPollingProps) {
  const [managerReceiptUrl, setManagerReceiptUrl] = useState<string | null>(null);
  const [hasManagerReceipt, setHasManagerReceipt] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Polling чека от менеджера (шаг 3)
  useEffect(() => {
    if (!projectRequestId || currentStage !== 3) return;

    // Автоматически отправляем запрос менеджеру при переходе на этап 3
    if (!isRequestSent) {
      console.log('🚀 Автоматически отправляем запрос менеджеру при переходе на этап 3');
      sendManagerReceiptRequest();
    }

    const checkManagerReceipt = async () => {
      try {
        console.log('🔍 Проверяем чек от менеджера для projectRequestId:', projectRequestId);

        const { data: project, error } = await db
          .from('projects')
          .select('status, receipts')
          .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)
          .single();

        if (error || !project) {
          console.log('📊 Проект не найден для проверки чека менеджера');
          return;
        }

        console.log('📊 Статус проекта для чека менеджера:', project.status);

        // Проверяем наличие чека от менеджера
        let receiptUrl = null;

        if (project.receipts) {
          try {
            // Пробуем парсить как JSON (новый формат)
            const receiptsData = JSON.parse(project.receipts);
            if (receiptsData.manager_receipt) {
              receiptUrl = receiptsData.manager_receipt;
            }
          } catch {
            // Если не JSON, проверяем статус (старый формат)
            if (project.status === 'in_work') {
              receiptUrl = project.receipts;
            }
          }
        }

        if (receiptUrl && !hasManagerReceipt) {
          console.log('✅ Чек от менеджера найден:', receiptUrl);
          console.log('🔄 Устанавливаем hasManagerReceipt=true');
          setManagerReceiptUrl(receiptUrl);
          setHasManagerReceipt(true);

          // Автоматически меняем статус если нужно
          if (project.status === 'waiting_manager_receipt') {
            await db
              .from('projects')
              .update({
                status: 'in_work',
                updated_at: new Date().toISOString()
              })
              .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`);
            console.log('✅ Статус изменен на in_work');
          }
        } else if (!receiptUrl && hasManagerReceipt) {
          console.log('❌ Чек от менеджера удален');
          console.log('🔄 Устанавливаем hasManagerReceipt=false');
          setManagerReceiptUrl(null);
          setHasManagerReceipt(false);
        } else {
          console.log('📊 Статус чека менеджера не изменился:', {
            hasManagerReceipt,
            managerReceiptUrl: !!receiptUrl,
            projectStatus: project.status
          });
        }

      } catch (error) {
        console.error('❌ Ошибка проверки чека от менеджера:', error);
      }
    };

    // Проверяем каждые 5 секунд
    pollingRef.current = setInterval(checkManagerReceipt, POLLING_INTERVALS.MANAGER_RECEIPT_CHECK);

    // Первая проверка сразу
    checkManagerReceipt();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [projectRequestId, currentStage, hasManagerReceipt, isRequestSent, sendManagerReceiptRequest]);

  return {
    managerReceiptUrl,
    hasManagerReceipt,
    setManagerReceiptUrl,
    setHasManagerReceipt
  };
}
