import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { SupplierData, ProductData } from "../context/AddSupplierContext";

export interface SupplierDraft {
  id: string;
  name: string;
  supplier_data: SupplierData;
  products: ProductData[];
  current_step: number;
  max_step_reached: number;
  source_type: 'manual' | 'echo_card' | 'template';
  created_at: string;
  updated_at: string;
}

export function useSupplierDraft() {
  const [drafts, setDrafts] = useState<SupplierDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Загрузить все черновики пользователя
  async function fetchDrafts() {
    setLoading(true);
    setError(null);
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setLoading(false);
      return;
    }
    
    const user_id = userData.user.id;
    
    const { data, error } = await supabase
      .from("supplier_drafts")
      .select("*")
      .eq("user_id", user_id)
      .order("updated_at", { ascending: false });
    
    setLoading(false);
    
    if (error) {
      setError(error.message);
      return;
    }
    
    setDrafts(data || []);
  }

  // Сохранить черновик поставщика
  async function saveDraft({
    name,
    supplierData,
    products,
    currentStep,
    maxStepReached,
    sourceType,
    draftId = null
  }: {
    name: string;
    supplierData: SupplierData;
    products: ProductData[];
    currentStep: number;
    maxStepReached: number;
    sourceType: 'manual' | 'echo_card' | 'template';
    draftId?: string | null;
  }) {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setSaving(false);
      return null;
    }
    
    const user_id = userData.user.id;
    
    const draftData = {
      user_id,
      name,
      supplier_data: supplierData,
      products,
      current_step: currentStep,
      max_step_reached: maxStepReached,
      source_type: sourceType,
      updated_at: new Date().toISOString()
    };

    let result;
    
    if (draftId) {
      // Обновляем существующий черновик
      const { data, error } = await supabase
        .from("supplier_drafts")
        .update(draftData)
        .eq("id", draftId)
        .eq("user_id", user_id)
        .select("id")
        .single();
      
      result = { data, error };
    } else {
      // Создаем новый черновик
      const { data, error } = await supabase
        .from("supplier_drafts")
        .insert([{
          ...draftData,
          created_at: new Date().toISOString()
        }])
        .select("id")
        .single();
      
      result = { data, error };
    }
    
    setSaving(false);
    
    if (result.error) {
      setError(result.error.message);
      return null;
    }
    
    setSuccess(true);
    await fetchDrafts(); // Обновляем список черновиков
    return result.data?.id || draftId;
  }

  // Загрузить черновик по ID
  async function loadDraft(draftId: string): Promise<SupplierDraft | null> {
    setLoading(true);
    setError(null);
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setLoading(false);
      return null;
    }
    
    const user_id = userData.user.id;
    
    const { data, error } = await supabase
      .from("supplier_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("user_id", user_id)
      .single();
    
    setLoading(false);
    
    if (error) {
      setError(error.message);
      return null;
    }
    
    return data;
  }

  // Удалить черновик
  async function deleteDraft(draftId: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setError("Не удалось получить пользователя");
      setLoading(false);
      return false;
    }
    
    const user_id = userData.user.id;
    
    const { error } = await supabase
      .from("supplier_drafts")
      .delete()
      .eq("id", draftId)
      .eq("user_id", user_id);
    
    setLoading(false);
    
    if (error) {
      setError(error.message);
      return false;
    }
    
    await fetchDrafts(); // Обновляем список черновиков
    return true;
  }

  // Автоматическая загрузка черновиков при инициализации
  useEffect(() => {
    fetchDrafts();
  }, []);

  // Очистка сообщений об успехе через 3 секунды
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return {
    drafts,
    loading,
    saving,
    error,
    success,
    fetchDrafts,
    saveDraft,
    loadDraft,
    deleteDraft,
  };
}

// Автосохранение черновика (вызывается из контекста)
export function useAutoSave() {
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const autoSave = async (saveFunction: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await saveFunction();
      setLastSaveTime(new Date());
    } catch (error) {
      console.error("Автосохранение не удалось:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    lastSaveTime,
    isSaving,
    autoSave,
  };
} 