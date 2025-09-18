// Определение всех возможных статусов проекта
export type ProjectStatus =
  | "draft"               // Черновик, проект не отправлен
  | "in_progress"         // В процессе заполнения
  | "waiting_approval"    // Ожидание одобрения менеджером
  | "waiting_receipt"     // Ожидание загрузки чека клиентом
  | "receipt_approved"    // Чек клиента одобрен менеджером
  | "receipt_rejected"    // Чек клиента отклонён
  | "filling_requisites"  // Заполнение реквизитов
  | "waiting_manager_receipt" // Ожидание чека от менеджера
  | "in_work"            // В работе (чек от менеджера загружен)
  | "waiting_client_confirmation" // Ожидание подтверждения от клиента
  | "completed";         // Проект завершён

// Маппинг статусов на шаги проекта
export const PROJECT_STEPS: Record<number, ProjectStatus[]> = {
  1: ["draft"],                    // Карточка компании
  2: ["in_progress", "waiting_approval", "receipt_rejected"],  // Загрузка чека клиентом
  3: ["waiting_receipt", "receipt_approved"],  // Ожидание одобрения чека
  4: [],                           // Выбор способа оплаты (без привязки к статусу)
  5: [],                           // Заполнение реквизитов (без привязки к статусу)  
  6: ["waiting_manager_receipt", "in_work"],  // Ожидание и получение чека от менеджера
  7: ["waiting_client_confirmation", "completed"],  // Подтверждение клиента и завершение
};

// Определение допустимых переходов между статусами
export const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  "draft": ["in_progress"],
  "in_progress": ["waiting_approval", "receipt_rejected"],
  "waiting_approval": ["waiting_receipt", "receipt_rejected"],
  "waiting_receipt": ["receipt_approved", "receipt_rejected"],
  "receipt_approved": ["filling_requisites"],
  "receipt_rejected": ["in_progress"],
  "filling_requisites": ["waiting_manager_receipt"],
  "waiting_manager_receipt": ["in_work"],
  "in_work": ["waiting_client_confirmation"],
  "waiting_client_confirmation": ["completed"],
  "completed": [],
};

// Функция проверки валидности перехода статуса
export function isValidStatusTransition(
  currentStatus: ProjectStatus,
  newStatus: ProjectStatus
): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

// Получение номера шага по статусу
export function getStepByStatus(status: ProjectStatus): number {
  for (const [step, statuses] of Object.entries(PROJECT_STEPS)) {
    if ((statuses as ProjectStatus[]).includes(status)) {
      return parseInt(step);
    }
  }
  return 1; // Возвращаем 1 как дефолтный шаг
}

// Человекочитаемые названия статусов
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  "draft": "Черновик",
  "in_progress": "В процессе",
  "waiting_approval": "Ожидание одобрения",
  "waiting_receipt": "Ожидание чека",
  "receipt_approved": "Чек одобрен",
  "receipt_rejected": "Чек отклонён",
  "filling_requisites": "Заполнение реквизитов",
  "waiting_manager_receipt": "Ожидание чека от менеджера",
  "in_work": "В работе",
  "waiting_client_confirmation": "Ожидание подтверждения клиента",
  "completed": "Завершён"
}; 