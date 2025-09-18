import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useProjectSpecification(projectId: string | null, role: 'client' | 'supplier') {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузить все позиции спецификации по проекту и роли
  const fetchSpecification = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('project_specifications')
      .select('*')
      .eq('project_id', projectId)
      .eq('role', role)
      .order('created_at', { ascending: true });
    setLoading(false);
    if (error) setError(error.message);
    else setItems(data || []);
  }, [projectId, role]);

  // Добавить позицию
  const addItem = async (item: any) => {
    if (!projectId) {
      console.error('[addItem] Нет projectId!');
      return;
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;
    if (!user_id) {
      setError("Ошибка авторизации: попробуйте войти заново");
      console.error('[addItem] Нет user_id! userData:', userData, 'error:', userError);
      return;
    }
    console.log('[addItem] Вставка позиции', { projectId, user_id, item });
    setLoading(true);
    const { error, data } = await supabase
      .from('project_specifications')
      .insert([{ ...item, project_id: projectId, role, user_id }]);
    setLoading(false);
    if (error) {
      setError(error.message);
      console.error('[addItem] Ошибка Supabase:', error, { projectId, user_id, item, role });
    } else {
      console.log('[addItem] Успешно добавлено:', data);
    }
  };

  // Bulk insert позиций
  const addItems = async (itemsToAdd: any[]) => {
    if (!projectId) {
      console.error('[addItems] Нет projectId!');
      return null;
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;
    if (!user_id) {
      setError("Ошибка авторизации: попробуйте войти заново");
      console.error('[addItems] Нет user_id! userData:', userData, 'error:', userError);
      return null;
    }
    
    console.log('[addItems] Входные данные:', { projectId, user_id, role, itemsToAdd });
    const bulk = itemsToAdd.map(item => ({ ...item, project_id: projectId, role, user_id }));
    console.log('[addItems] Подготовленные данные для вставки:', bulk);
    console.log('[addItems] Первый элемент детально:', JSON.stringify(bulk[0], null, 2));
    
    setLoading(true);
    const { error, data } = await supabase
      .from('project_specifications')
      .insert(bulk)
      .select(); // Получаем id созданных строк
    setLoading(false);
    
    if (error) {
      setError(error.message);
      console.error('[addItems] Ошибка Supabase (полный объект):', error);
      console.error('[addItems] Ошибка как строка:', JSON.stringify(error));
      console.error('[addItems] Тип ошибки:', typeof error);
      console.error('[addItems] Ключи объекта ошибки:', Object.keys(error));
      console.error('[addItems] message:', error?.message);
      console.error('[addItems] code:', error?.code);  
      console.error('[addItems] details:', error?.details);
      console.error('[addItems] hint:', error?.hint);
      console.error('[addItems] Данные которые пытались вставить:', JSON.stringify(bulk, null, 2));
      return null;
    } else {
      console.log('[addItems] Успешно добавлено:', data);
      // НЕ обновляем локальное состояние здесь, так как вызовем fetchSpecification после
      // Это предотвратит дублирование при последующем вызове fetchSpecification
      // Возвращаем id первой созданной спецификации (или массив id, если нужно)
      return data && data.length > 0 ? data[0].id : null;
    }
  };

  // Обновить позицию
  const updateItem = async (id: string, item: any) => {
    setLoading(true);
    const { error } = await supabase
      .from('project_specifications')
      .update(item)
      .eq('id', id);
    setLoading(false);
    if (error) setError(error.message);
  };

  // Удалить позицию
  const deleteItem = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('project_specifications')
      .delete()
      .eq('id', id);
    setLoading(false);
    if (error) setError(error.message);
  };

  return { items, loading, error, fetchSpecification, addItem, addItems, updateItem, deleteItem };
} 
