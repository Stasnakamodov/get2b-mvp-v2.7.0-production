import React from "react";
import { ProjectStatus, STATUS_LABELS } from "@/lib/types/project-status";

interface StatusHistoryItem {
  status: ProjectStatus;
  previous_status: ProjectStatus;
  step: number;
  changed_by?: string | null;
  changed_at: string;
  comment?: string | null;
}

interface StatusHistoryTimelineProps {
  history: StatusHistoryItem[];
}

export const StatusHistoryTimeline: React.FC<StatusHistoryTimelineProps> = ({ history }) => {
  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">История статусов</h3>
      <ol className="relative border-l border-gray-300 dark:border-gray-700">
        {history.map((item, idx) => (
          <li key={idx} className="mb-6 ml-4">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full mt-1.5 -left-1.5 border border-white dark:border-gray-900" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {STATUS_LABELS[item.status]}
                </span>
                {item.previous_status && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    (с {STATUS_LABELS[item.previous_status]})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Шаг {item.step}</span>
                <span>•</span>
                <span>{new Date(item.changed_at).toLocaleString("ru-RU")}</span>
                {item.changed_by && (
                  <>
                    <span>•</span>
                    <span>{item.changed_by}</span>
                  </>
                )}
              </div>
              {item.comment && (
                <span className="text-xs text-gray-600 dark:text-gray-300 italic">{item.comment}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default StatusHistoryTimeline; 