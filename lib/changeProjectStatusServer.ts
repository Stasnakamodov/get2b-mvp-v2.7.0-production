/**
 * Server-side version of changeProjectStatus.
 * Uses direct pg.Pool via @/lib/db (NOT the client-side HTTP proxy).
 * Must only be used in API routes / server-side code.
 */
import { db } from "@/lib/db";
import { ProjectStatus, isValidStatusTransition, getStepByStatus } from './types/project-status';

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function changeProjectStatusServer({
  projectId,
  newStatus,
  changedBy,
  comment,
  extraFields = {},
}: {
  projectId: string;
  newStatus: ProjectStatus;
  changedBy?: string | null;
  comment?: string;
  extraFields?: Record<string, any>;
}) {
  // 1. Получаем текущий статус проекта
  const { data: currentProject, error: fetchError } = await db
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
  const { error: historyError } = await db
    .from("project_status_history")
    .insert([
      {
        project_id: projectId,
        status: newStatus,
        changed_by: (changedBy && isValidUUID(changedBy)) ? changedBy : null,
        comment: comment || null,
        previous_status: currentStatus,
        step: newStep,
      },
    ]);

  if (historyError) {
    throw new Error(`Failed to add status history: ${historyError.message}`);
  }

  // 5. Обновляем статус и шаг в projects
  const { error: updateError } = await db
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
