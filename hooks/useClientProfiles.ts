import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Отдельная функция для создания профиля клиента
export async function createClientProfile(supabase: any, userId: string, profile: any) {
  if (!userId) return { ok: false, error: 'Нет userId' };
  const { error } = await supabase
    .from('client_profiles')
    .insert([{ ...profile, user_id: userId }]);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export function useClientProfiles(userId: string | null) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получить все профили клиента
  const fetchProfiles = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    setLoading(false);
    if (error) setError(error.message);
    else setProfiles(data || []);
  };

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line
  }, [userId]);

  // Добавить профиль
  const addProfile = async (profile: any) => {
    if (!userId) return false;
    setLoading(true);
    const { error } = await supabase
      .from('client_profiles')
      .insert([{ ...profile, user_id: userId }]);
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    await fetchProfiles();
    return true;
  };

  // Редактировать профиль
  const updateProfile = async (id: string, profile: any) => {
    setLoading(true);
    const { error } = await supabase
      .from('client_profiles')
      .update(profile)
      .eq('id', id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    await fetchProfiles();
    return true;
  };

  // Удалить профиль
  const deleteProfile = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    await fetchProfiles();
    return true;
  };

  // Сделать профиль по умолчанию
  const setDefaultProfile = async (id: string) => {
    if (!userId) return false;
    setLoading(true);
    // Сначала сбросить все is_default
    await supabase
      .from('client_profiles')
      .update({ is_default: false })
      .eq('user_id', userId);
    // Затем установить выбранный
    const { error } = await supabase
      .from('client_profiles')
      .update({ is_default: true })
      .eq('id', id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    await fetchProfiles();
    return true;
  };

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    addProfile,
    updateProfile,
    deleteProfile,
    setDefaultProfile,
  };
} 