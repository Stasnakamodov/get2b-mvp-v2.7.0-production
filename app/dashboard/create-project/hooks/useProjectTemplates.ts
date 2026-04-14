import { db } from "@/lib/db/client"
import { logger } from "@/src/shared/lib/logger"
import { buildTemplateRow } from "@/lib/templates/projectTemplateMapper"
import React, { useState, useEffect } from "react";

export function useProjectTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: userError } = await db.auth.getUser();
      if (userError || !userData?.user?.id) {
        logger.error('❌ [useProjectTemplates] Ошибка получения пользователя:', userError);
        setError("Не удалось получить пользователя");
        setLoading(false);
        return;
      }
      const user_id = userData.user.id;


      // Добавляем таймаут для запроса
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут запроса')), 10000); // 10 секунд
      });

      const fetchPromise = db
        .from("project_templates")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        logger.error('❌ [useProjectTemplates] Ошибка запроса шаблонов:', error);

        // Обработка специфических ошибок
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          setError('Ошибка сети. Проверьте подключение к интернету.');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setError('Таблица project_templates не существует. Обратитесь к администратору.');
        } else {
          setError(error.message);
        }

        setLoading(false);
        return;
      }

      setTemplates(data || []);
      setLoading(false);
    } catch (err: any) {
      logger.error('❌ [useProjectTemplates] Неожиданная ошибка:', err);

      // Обработка сетевых ошибок
      if (err.message.includes('Failed to fetch') || err.message.includes('network')) {
        setError('Ошибка сети. Проверьте подключение к интернету.');
      } else if (err.message.includes('Таймаут')) {
        setError('Превышено время ожидания. Попробуйте позже.');
      } else {
        setError('Неожиданная ошибка при загрузке шаблонов');
      }

      setLoading(false);
    }
  }, [])

  // Сохранить шаблон компании (шаг 1А)
  async function saveProjectTemplate({
    name,
    description,
    companyData,
    specification = [],
    role = 'client',
  }: {
    name: string;
    description?: string;
    companyData: any;
    specification?: any[];
    role?: 'client' | 'supplier';
  }) {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { data: userData, error: userError } = await db.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setSaving(false);
      return false;
    }
    const user_id = userData.user.id;
    const row = buildTemplateRow({
      user_id,
      name,
      description,
      role,
      companyData,
      specification,
    });
    const { error } = await db.from("project_templates").insert([row]);
    if (error) {
      setError(error.message);
      setSaving(false);
      return false;
    }
    setSuccess(true);
    setSaving(false);
    fetchTemplates(); // обновить список
    return true;
  }

  useEffect(() => { fetchTemplates(); }, []);

  return { templates, loading, error, fetchTemplates, saveProjectTemplate, saving, success };
}
