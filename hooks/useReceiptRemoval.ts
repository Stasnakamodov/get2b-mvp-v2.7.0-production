import { supabase } from '@/lib/supabaseClient';
import { cleanProjectRequestId } from '@/utils/IdUtils';

interface UseReceiptRemovalProps {
  projectRequestId: string;
  clientReceiptUrl: string | null;
  setClientReceiptFile: (file: File | null) => void;
  setClientReceiptUrl: (url: string | null) => void;
  toast: (options: {
    title: string;
    description: string;
    variant: 'default' | 'destructive';
  }) => void;
}

export function useReceiptRemoval({
  projectRequestId,
  clientReceiptUrl,
  setClientReceiptFile,
  setClientReceiptUrl,
  toast
}: UseReceiptRemovalProps) {

  const handleRemoveClientReceipt = async () => {
    if (!projectRequestId || !clientReceiptUrl) return

    try {
      // Удаляем URL из базы данных
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          client_confirmation_url: null,
          updated_at: new Date().toISOString()
        })
        .ilike('atomic_request_id', `%${cleanProjectRequestId(projectRequestId)}%`)

      if (updateError) {
        console.error("❌ Ошибка обновления проекта:", updateError)
        throw new Error("Не удалось удалить ссылку на файл")
      }

      setClientReceiptFile(null)
      setClientReceiptUrl(null)

      toast({
        title: "Чек удален",
        description: "Вы можете загрузить новый чек.",
        variant: "default"
      })

    } catch (error) {
      console.error("❌ Ошибка удаления чека:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить чек.",
        variant: "destructive"
      })
    }
  }

  return {
    handleRemoveClientReceipt
  };
}
