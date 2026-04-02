import { useEffect, useState } from "react";
import { db } from "@/lib/db/client";

const POLL_INTERVAL = 5000;

export function useRealtimeProjectData(projectId: string | null) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;

    async function fetchProject() {
      const { data } = await db
        .from('projects')
        .select('*')
        .eq('id', projectId!)
        .single();
      if (isMounted) {
        setProject(data || null);
        setLoading(false);
      }
    }

    setLoading(true);
    fetchProject();

    const interval = setInterval(fetchProject, POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [projectId]);

  return { project, loading };
}
