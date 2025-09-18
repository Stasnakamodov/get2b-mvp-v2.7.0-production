import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface ProjectInvoice {
  id: string;
  project_id: string;
  role: string;
  file_url: string;
  uploaded_at: string;
}

export function useProjectInvoices(projectId: string, role?: string) {
  const [invoices, setInvoices] = useState<ProjectInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получить все инвойсы по проекту (и роли)
  const fetchInvoices = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    let query = supabase.from("project_invoices").select("*").eq("project_id", projectId);
    if (role) query = query.eq("role", role);
    const { data, error } = await query.order("uploaded_at", { ascending: false });
    if (error) setError(error.message);
    else setInvoices(data || []);
    setLoading(false);
  }, [projectId, role]);

  // Добавить инвойс
  const addInvoice = useCallback(async (fileUrl: string, roleValue?: string) => {
    if (!projectId) return;
    setLoading(true);
    const { error } = await supabase.from("project_invoices").insert([
      { project_id: projectId, role: roleValue || role, file_url: fileUrl }
    ]);
    if (error) setError(error.message);
    await fetchInvoices();
    setLoading(false);
  }, [projectId, role, fetchInvoices]);

  // Удалить инвойс
  const deleteInvoice = useCallback(async (invoiceId: string) => {
    setLoading(true);
    const { error } = await supabase.from("project_invoices").delete().eq("id", invoiceId);
    if (error) setError(error.message);
    await fetchInvoices();
    setLoading(false);
  }, [fetchInvoices]);

  return { invoices, loading, error, fetchInvoices, addInvoice, deleteInvoice };
} 