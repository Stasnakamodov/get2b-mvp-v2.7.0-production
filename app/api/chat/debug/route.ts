import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// УЛЬТРА-ПРОСТАЯ ДИАГНОСТИКА ДЛЯ ПОИСКА ОШИБКИ 500
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    console.log('🔬 DIAGNOSTIC: Starting chat system diagnostics...');

    // ТЕСТ 1: Проверка подключения к Supabase
    try {
      console.log('🔬 TEST 1: Checking Supabase connection...');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      diagnostics.tests.push({
        name: 'Supabase Connection',
        status: error ? 'FAILED' : 'PASSED',
        details: error ? error.message : 'Connection OK',
        data: data
      });
    } catch (err: any) {
      diagnostics.tests.push({
        name: 'Supabase Connection',
        status: 'FAILED',
        details: err.message
      });
    }

    // ТЕСТ 2: Проверка таблицы chat_rooms
    try {
      console.log('🔬 TEST 2: Checking chat_rooms table...');
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('id, name')
        .limit(5);
      
      diagnostics.tests.push({
        name: 'chat_rooms table',
        status: error ? 'FAILED' : 'PASSED',
        details: error ? error.message : `Found ${data?.length || 0} rooms`,
        data: data
      });
    } catch (err: any) {
      diagnostics.tests.push({
        name: 'chat_rooms table',
        status: 'FAILED',
        details: err.message
      });
    }

    // ТЕСТ 3: Проверка таблицы chat_messages
    try {
      console.log('🔬 TEST 3: Checking chat_messages table...');
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content')
        .limit(5);
      
      diagnostics.tests.push({
        name: 'chat_messages table',
        status: error ? 'FAILED' : 'PASSED',
        details: error ? error.message : `Found ${data?.length || 0} messages`,
        data: data
      });
    } catch (err: any) {
      diagnostics.tests.push({
        name: 'chat_messages table',
        status: 'FAILED',
        details: err.message
      });
    }

    // ТЕСТ 4: Проверка RLS статуса
    try {
      console.log('🔬 TEST 4: Checking RLS status...');
      const { data, error } = await supabase
        .rpc('check_rls_status', {});
      
      diagnostics.tests.push({
        name: 'RLS Status Check',
        status: error ? 'FAILED' : 'INFO',
        details: error ? error.message : 'RLS check completed',
        data: data
      });
    } catch (err: any) {
      diagnostics.tests.push({
        name: 'RLS Status Check',
        status: 'SKIPPED',
        details: 'Function not available: ' + err.message
      });
    }

    // ТЕСТ 5: Простое создание тестовой записи с ПРАВИЛЬНЫМ UUID
    try {
      console.log('🔬 TEST 5: Testing simple insert with valid UUID...');
      
      // Получаем существующий user_id или создаем валидный UUID
      let testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Фиксированный валидный UUID для теста
      
      // Проверяем есть ли пользователи в базе
      const { data: usersData } = await supabase.from('users').select('id').limit(1);
      if (usersData && usersData.length > 0) {
        testUserId = usersData[0].id;
      }

      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: 'DIAGNOSTIC_TEST_' + Date.now(),
          room_type: 'ai',
          user_id: testUserId, // Используем валидный UUID
          is_active: true
        })
        .select()
        .single();
      
      if (data) {
        // Удаляем тестовую запись
        await supabase
          .from('chat_rooms')
          .delete()
          .eq('id', data.id);
      }
      
      diagnostics.tests.push({
        name: 'Insert/Delete Test',
        status: error ? 'FAILED' : 'PASSED',
        details: error ? error.message : 'Can create and delete records with valid UUID',
        data: data?.id || null
      });
    } catch (err: any) {
      diagnostics.tests.push({
        name: 'Insert/Delete Test',
        status: 'FAILED',
        details: err.message
      });
    }

    // ТЕСТ 6: Проверка на реальную ошибку 500 с неправильным UUID
    try {
      console.log('🔬 TEST 6: Testing API endpoints with invalid UUID...');
      
      // Тестируем что происходит с неправильным UUID
      const response = await fetch('http://localhost:3000/api/chat/rooms?user_id=invalid-uuid-test', {
        method: 'GET'
      });
      const data = await response.json();
      
      diagnostics.tests.push({
        name: 'Invalid UUID Handling',
        status: response.status === 400 ? 'PASSED' : 'FAILED',
        details: response.status === 400 ? 'Correctly rejects invalid UUIDs' : `Unexpected status: ${response.status}`,
        data: { status: response.status, error: data.error }
      });
    } catch (err: any) {
      diagnostics.tests.push({
        name: 'Invalid UUID Handling',
        status: 'FAILED',
        details: err.message
      });
    }

    // РЕЗУЛЬТАТ
    const failedTests = diagnostics.tests.filter((t: any) => t.status === 'FAILED');
    const overallStatus = failedTests.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND';

    console.log('🔬 DIAGNOSTIC COMPLETE:', overallStatus);
    console.log('🔬 Failed tests:', failedTests.length);

    return NextResponse.json({
      success: true,
      overall_status: overallStatus,
      failed_tests: failedTests.length,
      diagnostics
    });

  } catch (error: any) {
    console.error('💥 DIAGNOSTIC ERROR:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Diagnostic failed',
      details: error.message,
      diagnostics
    }, { status: 500 });
  }
} 