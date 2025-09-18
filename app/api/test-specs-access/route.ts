import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  try {
    const { projectId, testData } = await request.json();
    
    console.log('[TEST SPECS] Входные данные:', { projectId, testData });
    
    // Получаем user_id из cookies (серверная авторизация)
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: userData, error: userError } = await supabaseServer.auth.getUser();
    const user_id = userData?.user?.id;
    
    console.log('[TEST SPECS] User data:', { user_id, userError });
    
    if (!user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Нет авторизации',
        user_id: null 
      });
    }
    
    // Тестируем с обычным клиентом
    const testItem = {
      ...testData,
      project_id: projectId,
      role: 'client',
      user_id: user_id
    };
    
    console.log('[TEST SPECS] Тестовый элемент:', testItem);
    
    // Используем сервер клиент для обычного теста
    const { data: clientResult, error: clientError } = await supabaseServer
      .from('project_specifications')
      .insert([testItem])
      .select();
    
    // Используем админ клиент для админ теста
    const { data: adminResult, error: adminError } = await supabaseAdmin
      .from('project_specifications')
      .insert([testItem])
      .select();
    
    return NextResponse.json({
      success: true,
      user_id,
      test_data: testItem,
      client_result: clientResult,
      client_error: clientError,
      admin_result: adminResult,
      admin_error: adminError
    });
    
  } catch (error) {
    console.error('[TEST SPECS] Ошибка:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
}
 