import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useProjectSupabase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  // Создать новый проект
  async function createProject({ name, companyData, user_id, initiator_role, start_method }: {
    name: string;
    companyData: any;
    user_id: string;
    initiator_role: 'client' | 'supplier';
    start_method: 'manual' | 'template' | 'profile' | 'upload';
  }) {
    setIsLoading(true);
    setError(null);
    
    // Создаем проект
    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: name?.trim() || `Проект ${new Date().toLocaleDateString()}`,
          company_data: companyData,
          current_step: 1,
          user_id,
          status: "draft",
          initiator_role,
          start_method,
          email: companyData?.email || null,
          amount: 0,
          currency: "USD",
        },
      ])
      .select("id")
      .single();
      
    if (error) {
      setIsLoading(false);
      setError(error.message);
      return null;
    }
    
    const projectId = data?.id;
    if (!projectId) {
      setIsLoading(false);
      setError("Не удалось получить ID проекта");
      return null;
    }
    
    // Добавляем запись в историю статусов для создания проекта
    const { error: historyError } = await supabase
      .from("project_status_history")
      .insert([
        {
          project_id: projectId,
          status: "draft",
          previous_status: null,
          step: 1,
          changed_by: user_id,
          comment: "Проект создан",
        },
      ]);
      
    if (historyError) {
      console.error("Ошибка добавления записи в историю:", historyError);
      // Не прерываем создание проекта, если история не добавилась
    }
    
    setIsLoading(false);
    return projectId;
  }

  // Сохранить спецификацию, файл инвойса и текущий шаг
  async function saveSpecification({ projectId, currentStep, receipts, paymentMethod, payment_method, status, maxStepReached }: {
    projectId: string;
    currentStep: number;
    receipts?: string | null;
    paymentMethod?: string | null;
    payment_method?: string | null;
    status?: string;
    maxStepReached?: number;
  }) {
    console.log("[useProjectSupabase] saveSpecification вызван с параметрами:", {
      projectId,
      currentStep,
      receipts,
      paymentMethod,
      payment_method,
      status,
      maxStepReached
    });
    
    setIsLoading(true);
    setError(null);
    const updateObj: any = {
      current_step: currentStep,
    };
    if (typeof receipts !== 'undefined') {
      updateObj.receipts = receipts;
    }
    if (typeof status !== 'undefined') {
      updateObj.status = status;
    }
    if (typeof payment_method !== 'undefined') {
      updateObj.payment_method = payment_method;
    } else if (typeof paymentMethod !== 'undefined') {
      updateObj.payment_method = paymentMethod;
    }
    if (typeof maxStepReached !== 'undefined') {
      updateObj.max_step_reached = maxStepReached;
    }
    
    console.log("[useProjectSupabase] Обновляем проект с объектом:", updateObj);
    
    const { error } = await supabase
      .from("projects")
      .update(updateObj)
      .eq("id", projectId);
      
    setIsLoading(false);
    if (error) {
      console.error("[useProjectSupabase] Ошибка обновления:", error);
      setError(error.message);
      return false;
    }
    
    console.log("[useProjectSupabase] Проект успешно обновлен");
    return true;
  }

  // Загрузить только существующие поля по projectId
  async function loadSpecification(projectId: string) {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("projects")
      .select("current_step, max_step_reached, receipts, payment_method, name, company_data, status, amount, currency, email, supplier_data, supplier_id, supplier_type")
      .eq("id", projectId)
      .single();
    setIsLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    if (data) {
      if (data.company_data) setCompanyData(data.company_data);
      return {
        ...data,
        paymentMethod: data.payment_method || null,
        maxStepReached: data.max_step_reached || data.current_step || 1,
      };
    }
    return data;
  }

  // Сохранить данные поставщика
  async function saveSupplierData(projectId: string, supplierData: any, supplierId?: string, supplierType?: string) {
    console.log("[useProjectSupabase] saveSupplierData вызван:", { projectId, supplierData, supplierId, supplierType });
    
    setIsLoading(true);
    setError(null);
    
    const updateObj: any = {
      supplier_data: supplierData
    };
    
    if (supplierId) {
      updateObj.supplier_id = supplierId;
    }
    
    if (supplierType) {
      updateObj.supplier_type = supplierType;
    }
    
    const { error } = await supabase
      .from("projects")
      .update(updateObj)
      .eq("id", projectId);
      
    setIsLoading(false);
    if (error) {
      console.error("[useProjectSupabase] saveSupplierData ошибка:", error);
      setError(error.message);
      return false;
    }
    
    console.log("[useProjectSupabase] Данные поставщика успешно сохранены");
    return true;
  }

  // Обновить шаг
  async function updateStep(projectId: string, currentStep: number, maxStepReached?: number) {
    console.log("[useProjectSupabase] updateStep вызван:", { projectId, currentStep, maxStepReached });
    
    setIsLoading(true);
    setError(null);
    // Обновляем только нужные поля!
    const updateObj: any = {
      current_step: currentStep,
    };
    if (typeof maxStepReached !== 'undefined') {
      updateObj.max_step_reached = maxStepReached;
    }
    
    console.log("[useProjectSupabase] updateStep обновляет объект:", updateObj);
    
    const { error } = await supabase
      .from("projects")
      .update(updateObj)
      .eq("id", projectId);
      
    setIsLoading(false);
    if (error) {
      console.error("[useProjectSupabase] updateStep ошибка:", error);
      setError(error.message);
    } else {
      console.log("[useProjectSupabase] updateStep успешно выполнен");
    }
    return !error;
  }

  return { createProject, saveSpecification, loadSpecification, saveSupplierData, updateStep, isLoading, error, companyData };
}

// --- Экспорт для unit-тестов ---
export async function createProjectWithSupabase(supabase: any, { name, companyData, user_id, initiator_role, start_method }: {
  name: string;
  companyData: any;
  user_id: string;
  initiator_role: 'client' | 'supplier';
  start_method: 'manual' | 'template' | 'profile' | 'upload';
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        name: name?.trim() || `Проект ${new Date().toLocaleDateString()}`,
        company_data: companyData,
        current_step: 1,
        user_id,
        status: "draft",
        initiator_role,
        start_method,
      },
    ])
    .select("id")
    .single();
    
  if (error) {
    return null;
  }
  
  const projectId = data?.id;
  if (!projectId) {
    return null;
  }
  
  // Добавляем запись в историю статусов для создания проекта
  await supabase
    .from("project_status_history")
    .insert([
      {
        project_id: projectId,
        status: "draft",
        previous_status: null,
        step: 1,
        changed_by: user_id,
        comment: "Проект создан",
      },
    ]);
    
  return projectId;
}

// --- Экспорт для unit-тестов ---
export async function createProject(params: {
  name: string;
  companyData: any;
  user_id: string;
  initiator_role: 'client' | 'supplier';
  start_method: 'manual' | 'template' | 'profile' | 'upload';
}) {
  return createProjectWithSupabase(supabase, params);
} 