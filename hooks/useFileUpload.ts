import { db } from "@/lib/db/client"
import { useState } from 'react';
import { cleanProjectRequestId } from '@/utils/IdUtils';
import { generateFileDate } from '@/utils/DateUtils';
import { cleanFileName } from '@/utils/FileUtils';

interface UseFileUploadProps {
  projectRequestId: string;
  onSuccess?: (fileUrl: string) => void;
  onError?: (error: string) => void;
}

export function useFileUpload({ projectRequestId, onSuccess, onError }: UseFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Загрузка чека клиента (Шаг 7)
  const uploadClientReceipt = async (file: File) => {
    if (!file || !projectRequestId) return null;

    console.log("🚀 Начинаем загрузку чека клиента:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      projectRequestId
    });

    setIsUploading(true);
    setUploadError(null);

    try {
      // Получаем ID пользователя для организации файлов
      const { data: userData } = await db.auth.getUser();
      const userId = userData?.user?.id || 'unknown';

      // Генерируем уникальное имя файла
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `client-receipt-${cleanProjectRequestId(projectRequestId)}-${Date.now()}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      console.log("📤 Загружаем чек клиента:", {
        fileName,
        size: file.size,
        type: file.type,
        projectRequestId
      });

      // Загружаем файл в Supabase Storage
      const { data: uploadData, error: uploadError } = await db.storage
        .from("step7-client-confirmations")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error("❌ Ошибка загрузки в Storage:", uploadError);
        throw new Error("Не удалось загрузить файл: " + uploadError.message);
      }

      // Получаем публичный URL файла
      const { data: urlData } = db.storage
        .from("step7-client-confirmations")
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;
      console.log("✅ Файл загружен:", fileUrl);

      // Сохраняем URL в проект
      const { error: updateError } = await db
        .from("projects")
        .update({
          client_confirmation_url: fileUrl,
          updated_at: new Date().toISOString()
        })
        .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`);

      if (updateError) {
        console.error("❌ Ошибка обновления проекта:", updateError);
        throw new Error("Не удалось сохранить ссылку на файл");
      }

      if (onSuccess) onSuccess(fileUrl);
      return fileUrl;

    } catch (error) {
      console.error("❌ Ошибка загрузки чека клиента:", error);
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      setUploadError(errorMessage);
      if (onError) onError(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Загрузка чека поставщика (Шаг 3)
  const uploadSupplierReceipt = async (file: File) => {
    if (!file || !projectRequestId) return null;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Используем тот же bucket, что и в обычном стартапе проектов
      const date = generateFileDate();
      const cleanName = cleanFileName(file.name);
      const filePath = `step3-supplier-receipts/${projectRequestId}/${date}_${cleanName}`;

      const { data, error } = await db.storage
        .from("step3-supplier-receipts")
        .upload(filePath, file);

      if (error) {
        throw new Error(error.message);
      }

      const { data: urlData } = db.storage
        .from("step3-supplier-receipts")
        .getPublicUrl(filePath);

      const fileUrl = urlData?.publicUrl || "";

      // Обновляем статус проекта на waiting_receipt
      if (projectRequestId) {
        try {
          const { error: updateError } = await db
            .from('projects')
            .update({
              status: 'waiting_receipt',
              updated_at: new Date().toISOString()
            })
            .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`);

          if (updateError) {
            console.warn('⚠️ Не удалось обновить статус проекта:', updateError);
          }
        } catch (error) {
          console.warn('⚠️ Ошибка обработки чека:', error);
        }
      }

      if (onSuccess) onSuccess(fileUrl);
      return fileUrl;

    } catch (error: any) {
      console.error('❌ Ошибка загрузки чека поставщика:', error);
      const errorMessage = "Ошибка загрузки чека: " + error.message;
      setUploadError(errorMessage);
      if (onError) onError(errorMessage);
      throw error;
    } finally {
      console.log('🔍 Завершение загрузки, isUploading = false');
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadError,
    setUploadError,
    uploadClientReceipt,
    uploadSupplierReceipt
  };
}
