'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectDetails: any;
}

export default function ProjectDetailsDialog({
  isOpen,
  onClose,
  projectDetails,
}: ProjectDetailsDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Детали проекта</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {projectDetails && (
          <div className="space-y-6">
            {/* Основная информация */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Основная информация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID проекта</p>
                  <p className="font-medium">{projectDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Статус</p>
                  <p className="font-medium">{projectDetails.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Текущий этап</p>
                  <p className="font-medium">{projectDetails.currentStage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Создан</p>
                  <p className="font-medium">
                    {new Date(projectDetails.created_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Обновлен</p>
                  <p className="font-medium">
                    {new Date(projectDetails.updated_at).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>

            {/* Данные шагов */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Данные шагов</h3>
              <div className="space-y-4">
                {Object.entries(projectDetails.manualData || {}).map(([stepId, data]: [string, any]) => (
                  <div key={stepId} className="border border-gray-200 rounded p-3">
                    <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                    <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Конфигурации шагов */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Конфигурации шагов</h3>
              <div className="space-y-4">
                {Object.entries(projectDetails.stepConfigs || {}).map(([stepId, config]: [string, any]) => (
                  <div key={stepId} className="border border-gray-200 rounded p-3">
                    <h4 className="font-medium mb-2">Шаг {stepId}</h4>
                    <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Дополнительные данные проекта */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Дополнительные данные</h3>
              <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                {JSON.stringify(projectDetails, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
