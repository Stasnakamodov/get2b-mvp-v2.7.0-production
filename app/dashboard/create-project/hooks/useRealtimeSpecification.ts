import { useEffect, useState } from "react";
import { db } from "@/lib/db/client";

const POLL_INTERVAL = 5000;

export function useRealtimeSpecification(projectId: string | null, role: 'client' | 'supplier') {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;

    async function fetchItems() {
      const { data } = await db
        .from('project_specifications')
        .select('*')
        .eq('project_id', projectId!)
        .eq('role', role)
        .order('created_at', { ascending: true });
      if (isMounted) {
        setItems(data || []);
        setLoading(false);
      }
    }

    setLoading(true);
    fetchItems();

    const interval = setInterval(fetchItems, POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [projectId, role]);

  return { items, loading };
}
