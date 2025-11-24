import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useRealtimeSpecification(projectId: string | null, role: 'client' | 'supplier') {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;
    setLoading(true);
    // Первичная загрузка
    (async () => {
      const { data } = await supabase
        .from('project_specifications')
        .select('*')
        .eq('project_id', projectId)
        .eq('role', role)
        .order('created_at', { ascending: true });
      if (isMounted) {
        setItems(data || []);
        setLoading(false);
      }
    })();

    // Подписка на realtime (фильтрация по project_id и role)
    const channel = supabase
      .channel('specifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_specifications', filter: `project_id=eq.${projectId},role=eq.${role}` },
        (payload) => {
          // Только если событие по нужной роли
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          if ((newRow && newRow.role === role) || (oldRow && oldRow.role === role)) {
            supabase
              .from('project_specifications')
              .select('*')
              .eq('project_id', projectId)
              .eq('role', role)
              .order('created_at', { ascending: true })
              .then(({ data }) => setItems(data || []));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [projectId, role]);

  return { items, loading };
} 