import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useCreateProjectFromConstructor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Создать проект из данных конструктора
  const createProject = async (data: {
    draft_id?: string;
    project_name?: string;
    step_data: Record<string, any>;
    step_configs: Record<string, string>;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/constructor/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка создания проекта');
      }

      // Переходим к классическому 7-шаговому процессу
      if (result.project?.id) {
        router.push(`/dashboard/create-project?projectId=${result.project.id}&step=3`);
      }

      return result.project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Ошибка создания проекта:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Создать проект напрямую из данных (без черновика)
  const createProjectFromData = async (stepData: Record<string, any>, projectName?: string) => {
    return createProject({
      project_name: projectName,
      step_data: stepData,
      step_configs: {}
    });
  };

  // Создать проект из черновика
  const createProjectFromDraft = async (draftId: string, projectName?: string) => {
    return createProject({
      draft_id: draftId,
      project_name: projectName,
      step_data: {},
      step_configs: {}
    });
  };

  return {
    loading,
    error,
    createProject,
    createProjectFromData,
    createProjectFromDraft
  };
} 