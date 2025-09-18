import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useDeleteTemplate() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function deleteTemplate(id: string) {
    setIsDeleting(true);
    setError(null);
    setSuccess(false);
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setIsDeleting(false);
      return false;
    }
    setSuccess(true);
    setIsDeleting(false);
    return true;
  }

  return { deleteTemplate, isDeleting, error, success };
} 