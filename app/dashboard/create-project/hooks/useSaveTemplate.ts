import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSaveTemplate() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function saveTemplate({ name, description, data }: { name: string; description?: string; data: any }) {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    // Получаем user_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setIsSaving(false);
      return false;
    }
    const user_id = userData.user.id;
    const { error } = await supabase.from("templates").insert([
      {
        user_id,
        name,
        description: description || null,
        data,
      },
    ]);
    if (error) {
      setError(error.message);
      setIsSaving(false);
      return false;
    }
    setSuccess(true);
    setIsSaving(false);
    return true;
  }

  return { saveTemplate, isSaving, error, success };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    // Получаем user_id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setLoading(false);
      return;
    }
    const user_id = userData.user.id;
    const { data, error } = await supabase
      .from("templates")
      .select("id, name, description, data, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setTemplates(data || []);
    setLoading(false);
  }

  return { templates, loading, error, fetchTemplates };
}

// Новый хук для работы с таблицей project_templates
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        console.error('❌ [useProjectTemplates] Ошибка получения пользователя:', userError);
        setError("Не удалось получить пользователя");
        setLoading(false);
        return;
      }
      const user_id = userData.user.id;
      
      
      // Добавляем таймаут для запроса
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут запроса')), 10000); // 10 секунд
      });
      
      const fetchPromise = supabase
        .from("project_templates")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('❌ [useProjectTemplates] Ошибка запроса шаблонов:', error);
        
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
      console.error('❌ [useProjectTemplates] Неожиданная ошибка:', err);
      
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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setSaving(false);
      return false;
    }
    const user_id = userData.user.id;
    const insertObj = {
      user_id,
      name,
      description: description || null,
      company_name: companyData.name || '',
      company_legal: companyData.legalName || '',
      company_inn: companyData.inn || '',
      company_kpp: companyData.kpp || '',
      company_ogrn: companyData.ogrn || '',
      company_address: companyData.address || '',
      company_bank: companyData.bankName || '',
      company_account: companyData.bankAccount || '',
      company_corr: companyData.bankCorrAccount || '',
      company_bik: companyData.bankBik || '',
      company_email: companyData.email || '',
      company_phone: companyData.phone || '',
      company_website: companyData.website || '',
      specification: specification,
      role,
    };
    const { error } = await supabase.from("project_templates").insert([insertObj]);
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