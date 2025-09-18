import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useRealtimeProjectData(projectId: string | null) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    // Первичная загрузка
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        setProject(data || null);
        setLoading(false);
      });

    // Подписка на realtime
    const channel = supabase
      .channel('project_data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        (payload) => {
          if (payload.new) setProject(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return { project, loading };
} 