import React from "react";
import { ProjectStatus, STATUS_LABELS } from "@/lib/types/project-status";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
  showIcon?: boolean;
}

const STATUS_STYLES: Record<ProjectStatus, { color: string; Icon: React.ComponentType<any> }> = {
  "draft": { color: "bg-gray-100 text-gray-700", Icon: Clock },
  "in_progress": { color: "bg-blue-100 text-blue-700", Icon: Clock },
  "waiting_approval": { color: "bg-yellow-100 text-yellow-700", Icon: Clock },
  "waiting_receipt": { color: "bg-yellow-100 text-yellow-700", Icon: Clock },
  "receipt_approved": { color: "bg-green-100 text-green-700", Icon: CheckCircle },
  "receipt_rejected": { color: "bg-red-100 text-red-700", Icon: XCircle },
  "filling_requisites": { color: "bg-blue-100 text-blue-700", Icon: Clock },
  "waiting_manager_receipt": { color: "bg-yellow-100 text-yellow-700", Icon: Clock },
  "in_work": { color: "bg-purple-100 text-purple-700", Icon: Clock },
  "waiting_client_confirmation": { color: "bg-orange-100 text-orange-700", Icon: Clock },
  "completed": { color: "bg-green-100 text-green-700", Icon: CheckCircle },
};

export const ProjectStatusBadge: React.FC<ProjectStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const style = STATUS_STYLES[status] || { color: "bg-gray-100 text-gray-700", Icon: AlertCircle };
  const Icon = style.Icon;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        style.color,
        className
      )}
    >
      {showIcon && React.createElement(Icon, { className: "w-3.5 h-3.5 mr-1" })}
      {STATUS_LABELS[status]}
    </span>
  );
};

export default ProjectStatusBadge; 