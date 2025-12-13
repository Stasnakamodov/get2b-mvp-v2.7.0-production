import { logger } from "@/src/shared/lib/logger"
import React, { useState, useEffect, useRef } from "react";
import { useCreateProjectContext } from "../context/CreateProjectContext";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, FileCheck, Banknote, ArrowLeft, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { changeProjectStatus } from "@/lib/supabaseProjectStatus";
import { sendTelegramMessageClient, sendTelegramDocumentClient } from "@/lib/telegram-client";
export default function Step7ClientConfirmationForm() {
  const { 
    projectId, 
    setCurrentStep, 
    projectName, 
    companyData,
    specificationItems,
    paymentMethod 
  } = useCreateProjectContext();
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [managerReceipt, setManagerReceipt] = useState<string | null>(null);
  const [clientReceiptFile, setClientReceiptFile] = useState<File | null>(null);
  const [clientReceiptUrl, setClientReceiptUrl] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Загрузка данных проекта при монтировании
  useEffect(() => {
    async function loadProjectData() {
      if (!projectId) return;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
        
      if (error) {
        logger.error("Ошибка загрузки проекта:", error);
        return;
      }
      
      setProjectData(data);
      
      // Проверяем есть ли чек от менеджера
      if (data.receipts) {
        try {
          const receipts = typeof data.receipts === 'string' 
            ? JSON.parse(data.receipts) 
            : data.receipts;
          
          if (receipts.manager_receipt) {
            setManagerReceipt(receipts.manager_receipt);
          }
        } catch (e) {
          logger.error("Ошибка парсинга receipts:", e);
        }
      }
      
      // Проверяем есть ли уже загруженный чек клиента
      if (data.client_confirmation_url) {
        setClientReceiptUrl(data.client_confirmation_url);
      }
      
      // Если проект уже завершен
      if (data.status === 'completed') {
        setIsCompleted(true);
      }
    }
    
    loadProjectData();
  }, [projectId]);

  // Обработка загрузки чека клиента
  const handleClientReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setIsUploadingReceipt(true);
    setUploadError(null);

    try {
      // Получаем ID пользователя для организации файлов
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || 'unknown';

      // Генерируем уникальное имя файла
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `client-receipt-${projectId}-${Date.now()}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      logger.info("📤 Загружаем чек клиента:", {
        fileName,
        size: file.size,
        type: file.type
      });

      // Загружаем файл в Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("step7-client-confirmations")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        logger.error("❌ Ошибка загрузки в Storage:", uploadError);
        throw new Error("Не удалось загрузить файл: " + uploadError.message);
      }

      // Получаем публичный URL файла
      const { data: urlData } = supabase.storage
        .from("step7-client-confirmations")
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;
      logger.info("✅ Файл загружен:", fileUrl);

      // Сохраняем URL в проект
      const { error: updateError } = await supabase
        .from("projects")
        .update({ 
          client_confirmation_url: fileUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", projectId);

      if (updateError) {
        logger.error("❌ Ошибка обновления проекта:", updateError);
        throw new Error("Не удалось сохранить ссылку на файл");
      }

      // Отправляем файл менеджеру в Telegram
      const telegramCaption = `📋 КЛИЕНТ ЗАГРУЗИЛ ЧЕК!\n\n` +
        `🆔 Проект: ${projectId}\n` +
        `📛 Название: ${projectName}\n` +
        `🏢 Компания: ${companyData?.name || 'Не указано'}\n` +
        `📧 Email: ${companyData?.email || 'Не указано'}\n` +
        `💰 Метод оплаты: ${paymentMethod || 'Не указан'}\n\n` +
        `📄 Клиент подтвердил получение средств от поставщика чеком.\n` +
        `⚠️ Проверьте документ и завершите проект если все корректно.`;

      try {
        await sendTelegramDocumentClient(fileUrl, telegramCaption);
        logger.info("✅ Чек отправлен менеджеру в Telegram");
      } catch (telegramError) {
        logger.error("⚠️ Ошибка отправки в Telegram:", telegramError);
        // Продолжаем выполнение даже если Telegram недоступен
      }

      setClientReceiptFile(file);
      setClientReceiptUrl(fileUrl);

      toast({
        title: "Чек загружен!",
        description: "Ваш чек успешно загружен и отправлен менеджеру.",
        variant: "default"
      });

    } catch (error) {
      logger.error("❌ Ошибка загрузки чека:", error);
      setUploadError(error instanceof Error ? error.message : "Неизвестная ошибка");
      
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить чек. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Удаление загруженного чека
  const handleRemoveClientReceipt = async () => {
    if (!projectId || !clientReceiptUrl) return;

    try {
      // Удаляем URL из базы данных
      const { error: updateError } = await supabase
        .from("projects")
        .update({ 
          client_confirmation_url: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", projectId);

      if (updateError) {
        logger.error("❌ Ошибка обновления проекта:", updateError);
        throw new Error("Не удалось удалить ссылку на файл");
      }

      setClientReceiptFile(null);
      setClientReceiptUrl(null);

      toast({
        title: "Чек удален",
        description: "Вы можете загрузить новый чек.",
        variant: "default"
      });

    } catch (error) {
      logger.error("❌ Ошибка удаления чека:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чек.",
        variant: "destructive"
      });
    }
  };

  // Подтверждение завершения проекта
  const handleConfirmCompletion = async () => {
    if (!projectId) return;
    
    setIsConfirming(true);
    
    try {
      // Получаем ID пользователя
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      // Меняем статус на completed
      await changeProjectStatus({
        projectId,
        newStatus: "completed",
        changedBy: userId || "client",
        comment: "Проект завершен клиентом - получение средств подтверждено"
      });
      
      // Отправляем уведомление в Telegram
      const telegramText = `✅ ПРОЕКТ ЗАВЕРШЕН!\n\n` +
        `📋 Проект: ${projectName}\n` +
        `🏢 Компания: ${companyData?.name || 'Не указано'}\n` +
        `📧 Email: ${companyData?.email || 'Не указано'}\n` +
        `💰 Метод оплаты: ${paymentMethod || 'Не указан'}\n` +
        `📦 Позиций в спецификации: ${specificationItems?.length || 0}\n` +
        `📄 Чек клиента: ${clientReceiptUrl ? 'Загружен' : 'Не загружен'}\n\n` +
        `🎉 Клиент подтвердил получение средств. Проект успешно завершен!`;
      
      await sendTelegramMessageClient(telegramText);
      
      setIsCompleted(true);
      
      toast({
        title: "Проект завершен!",
        description: "Спасибо за использование нашего сервиса. Проект успешно завершен.",
        variant: "default"
      });
      
    } catch (error) {
      logger.error("Ошибка завершения проекта:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить проект. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-6"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </motion.div>
          
          <div>
            <h2 className="text-3xl font-bold text-green-700 dark:text-green-400">Проект завершен!</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Благодарим за использование нашего сервиса
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Что происходит дальше:</h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
              <li>• Ваш проект сохранен в истории</li>
              <li>• Менеджер получил уведомление о завершении</li>
              <li>• Все документы сохранены в системе</li>
              <li>• Вы можете создать новый проект в любое время</li>
            </ul>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="default"
            >
              Вернуться в дашборд
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/create-project'}
              variant="outline"
            >
              Создать новый проект
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6"
    >
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Подтверждение завершения</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Последний шаг - подтвердите получение средств
          </p>
        </div>

        {/* Информация о проекте */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FileCheck className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            Сводка по проекту
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Проект:</span>
              <p className="text-gray-600 dark:text-gray-300">{projectName || 'Не указано'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Компания:</span>
              <p className="text-gray-600 dark:text-gray-300">{companyData?.name || 'Не указано'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Email:</span>
              <p className="text-gray-600 dark:text-gray-300">{companyData?.email || 'Не указано'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Метод оплаты:</span>
              <p className="text-gray-600 dark:text-gray-300">{paymentMethod || 'Не указан'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Позиций в спецификации:</span>
              <p className="text-gray-600 dark:text-gray-300">{specificationItems?.length || 0}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">Статус:</span>
              <p className="text-green-600 dark:text-green-400 font-medium">Готов к завершению</p>
            </div>
          </div>
        </div>

        {/* Чек от менеджера */}
        {managerReceipt && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Banknote className="h-5 w-5 text-blue-800 dark:text-blue-300" />
              Чек от менеджера
            </h3>
            <div className="flex items-center gap-4">
              <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Чек получен и готов</p>
                <a 
                  href={managerReceipt} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Просмотреть чек →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Загрузка чека клиента */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-800 dark:text-orange-300">
            <Upload className="h-5 w-5 text-orange-800 dark:text-orange-300" />
            Загрузите чек о получении средств
          </h3>
          
          {!clientReceiptUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Пожалуйста, загрузите чек или скриншот, подтверждающий что вы получили средства от поставщика. 
                Это поможет завершить проект.
              </p>
              
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleClientReceiptUpload}
                  className="hidden"
                />
                
                {uploadError && (
                  <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {uploadError}
                  </div>
                )}
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingReceipt}
                  variant="outline"
                  className="w-full border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 text-orange-800 dark:text-orange-200 bg-white dark:bg-gray-800"
                >
                  {isUploadingReceipt ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Загружаю чек...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Выбрать файл чека
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Поддерживаются: JPG, PNG, PDF (макс. 50 МБ)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-300">Чек загружен и отправлен менеджеру</p>
                  <a 
                    href={clientReceiptUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-600 dark:text-orange-400 hover:underline text-sm"
                  >
                    Просмотреть загруженный чек →
                  </a>
                </div>
                <Button
                  onClick={handleRemoveClientReceipt}
                  variant="outline"
                  size="sm"
                  className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 bg-white dark:bg-gray-800"
                >
                  <X className="h-4 w-4 mr-1" />
                  Удалить
                </Button>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ Ваш чек отправлен менеджеру. Теперь вы можете завершить проект.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Подтверждение */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-yellow-800 dark:text-yellow-300">
            ⚠️ Важно! Подтвердите получение средств
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            Нажимая кнопку "Подтвердить завершение", вы подтверждаете что:
          </p>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
            <li>Получили чек от менеджера</li>
            <li>Средства поступили на ваш счет</li>
            <li>{clientReceiptUrl ? 'Загрузили чек о получении средств' : 'Готовы завершить проект без загрузки чека'}</li>
            <li>Проект выполнен в полном объеме</li>
            <li>У вас нет претензий к исполнению</li>
          </ul>
          
          {!clientReceiptUrl && (
            <div className="mt-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600 rounded p-3">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                💡 Рекомендуем загрузить чек о получении средств для полного документооборота.
              </p>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(6)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>

          <Button
            onClick={handleConfirmCompletion}
            disabled={isConfirming}
            className="flex items-center gap-2"
          >
            {isConfirming ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Завершаю проект...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Подтвердить завершение
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 