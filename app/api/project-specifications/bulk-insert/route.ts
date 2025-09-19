import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { projectId, items, role } = await request.json();

    console.log('[bulk-insert] Получен запрос:', { projectId, itemsCount: items?.length, role });

    if (!projectId) {
      return NextResponse.json({ error: 'projectId обязателен' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items должен быть непустым массивом' }, { status: 400 });
    }

    // Получаем токен авторизации из заголовка
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Отсутствует токен авторизации' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Убираем "Bearer "

    // Получаем пользователя через токен
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[bulk-insert] Ошибка авторизации:', userError);
      return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 401 });
    }
    
    // Подготавливаем данные для вставки
    const itemsToInsert = items.map((item: any) => ({
      project_id: projectId,
      role: role || 'client',
      user_id: user.id,
      item_name: item.name || item.product_name || '',
      item_code: item.code || item.sku || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'шт',
      price: item.pricePerUnit || item.price || 0,
      total: item.totalPrice || item.total_price || item.total || 0,
      image_url: item.image_url || '',
      supplier_name: item.supplier_name || '',
      currency: item.currency || 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('[bulk-insert] Подготовленные данные:', itemsToInsert);
    
    // Вставляем данные в базу
    const { data, error } = await supabase
      .from('project_specifications')
      .insert(itemsToInsert)
      .select();
    
    if (error) {
      console.error('[bulk-insert] Ошибка Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('[bulk-insert] Успешно добавлено:', data);
    
    return NextResponse.json({ 
      success: true, 
      insertedCount: data?.length || 0,
      data: data 
    });
    
  } catch (error) {
    console.error('[bulk-insert] Ошибка:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 