import { supabase } from "@/lib/supabaseClient";
import { ProjectStatus, isValidStatusTransition, getStepByStatus } from './types/project-status';

// Универсальная функция смены статуса проекта
export async function changeProjectStatus({
  projectId,
  newStatus,
  changedBy,
  comment,
  extraFields = {},
}: {
  projectId: string;
  newStatus: ProjectStatus;
  changedBy?: string;
  comment?: string;
  extraFields?: Record<string, any>;
}) {
  // 1. Получаем текущий статус проекта
  const { data: currentProject, error: fetchError } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch project status: ${fetchError.message}`);
  }

  const currentStatus = currentProject.status as ProjectStatus;

  // 2. Проверяем валидность перехода
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }

  // 3. Определяем новый шаг на основе статуса
  const newStep = getStepByStatus(newStatus);

  // 4. Добавляем запись в историю
  const { error: historyError } = await supabase
    .from("project_status_history")
    .insert([
      {
        project_id: projectId,
        status: newStatus,
        changed_by: changedBy || null,
        comment: comment || null,
        previous_status: currentStatus,
        step: newStep,
      },
    ]);

  if (historyError) {
    throw new Error(`Failed to add status history: ${historyError.message}`);
  }

  // 5. Обновляем статус и шаг в projects
  const { error: updateError } = await supabase
    .from("projects")
    .update({
      status: newStatus,
      current_step: newStep,
      ...extraFields,
    })
    .eq("id", projectId);

  if (updateError) {
    throw new Error(`Failed to update project status: ${updateError.message}`);
  }

  return {
    status: newStatus,
    step: newStep,
  };
}

// Получить историю статусов по проекту
export async function fetchProjectStatusHistory(projectId: string) {
  const { data, error } = await supabase
    .from("project_status_history")
    .select("status, changed_by, changed_at, comment, previous_status, step")
    .eq("project_id", projectId)
    .order("changed_at", { ascending: true });

  if (error) throw error;
  return data;
} 