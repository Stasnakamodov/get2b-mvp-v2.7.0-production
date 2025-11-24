import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Создание функций умного каталога
export async function POST() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      status: "creating functions",
      functions_created: [],
      errors: []
    };

    // Функция 1: update_supplier_usage_patterns
    const updatePatternsSQL = `
      CREATE OR REPLACE FUNCTION update_supplier_usage_patterns(target_user_id uuid)
      RETURNS text AS $$
      DECLARE
        patterns_count integer := 0;
      BEGIN
        DELETE FROM supplier_usage_patterns WHERE user_id = target_user_id;
        
        UPDATE catalog_user_suppliers 
        SET 
          total_projects = 0,
          successful_projects = 0,
          cancelled_projects = 0,
          total_spent = 0,
          last_project_date = null,
          updated_at = now()
        WHERE user_id = target_user_id;
        
        GET DIAGNOSTICS patterns_count = ROW_COUNT;
        
        RETURN format('Обновлено %s записей поставщиков для пользователя %s', patterns_count, target_user_id);
        
      EXCEPTION
        WHEN OTHERS THEN
          RETURN format('Ошибка: %s', SQLERRM);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    try {
      const { error: error1 } = await supabase.rpc('sql', { query: updatePatternsSQL });
      if (error1) {
        results.errors.push(`update_supplier_usage_patterns: ${error1.message}`);
      } else {
        results.functions_created.push('update_supplier_usage_patterns');
      }
    } catch (e) {
      results.errors.push(`update_supplier_usage_patterns: ${e}`);
    }

    // Функция 2: get_user_supplier_stats  
    const getStatsSQL = `
      CREATE OR REPLACE FUNCTION get_user_supplier_stats(target_user_id uuid)
      RETURNS TABLE (
        supplier_id uuid,
        supplier_name text,
        supplier_type text,
        category text,
        total_projects integer,
        success_rate decimal,
        total_spent decimal,
        last_project_date timestamptz
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          us.id as supplier_id,
          us.name as supplier_name,
          'user'::text as supplier_type,
          us.category,
          us.total_projects,
          CASE 
            WHEN us.total_projects > 0 THEN (us.successful_projects::decimal / us.total_projects * 100)
            ELSE 0
          END as success_rate,
          us.total_spent,
          us.last_project_date
        FROM catalog_user_suppliers us
        WHERE us.user_id = target_user_id
          AND us.is_active = true
        ORDER BY us.total_projects DESC, us.last_project_date DESC;
        
      EXCEPTION
        WHEN OTHERS THEN
          RETURN;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    try {
      const { error: error2 } = await supabase.rpc('sql', { query: getStatsSQL });
      if (error2) {
        results.errors.push(`get_user_supplier_stats: ${error2.message}`);
      } else {
        results.functions_created.push('get_user_supplier_stats');
      }
    } catch (e) {
      results.errors.push(`get_user_supplier_stats: ${e}`);
    }

    // Функция 3: test_smart_catalog_data
    const testDataSQL = `
      CREATE OR REPLACE FUNCTION test_smart_catalog_data()
      RETURNS text AS $$
      DECLARE
        test_project_id uuid := gen_random_uuid();
        result_text text := '';
      BEGIN
        INSERT INTO project_product_history (
          project_id, user_id, supplier_id, supplier_type,
          product_name, product_category, quantity, unit_price, total_price, currency,
          project_status, was_successful
        ) VALUES 
          (test_project_id, '86cc190d-0c80-463b-b0df-39a25b22365f', '977c2bee-750e-467f-a790-1fd5c3ec1e47', 'user', 'Тестовый товар 1', 'Электроника', 10, 100.00, 1000.00, 'USD', 'completed', true),
          (test_project_id, '86cc190d-0c80-463b-b0df-39a25b22365f', '977c2bee-750e-467f-a790-1fd5c3ec1e47', 'user', 'Тестовый товар 2', 'Электроника', 5, 200.00, 1000.00, 'USD', 'completed', true);
        
        result_text := result_text || 'Добавлена тестовая история товаров. ';
        
        PERFORM update_supplier_usage_patterns('86cc190d-0c80-463b-b0df-39a25b22365f');
        result_text := result_text || 'Обновлены паттерны использования. ';
        
        RETURN result_text || 'Тестовые данные успешно созданы!';
        
      EXCEPTION
        WHEN OTHERS THEN
          RETURN format('Ошибка создания тестовых данных: %s', SQLERRM);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    try {
      const { error: error3 } = await supabase.rpc('sql', { query: testDataSQL });
      if (error3) {
        results.errors.push(`test_smart_catalog_data: ${error3.message}`);
      } else {
        results.functions_created.push('test_smart_catalog_data');
      }
    } catch (e) {
      results.errors.push(`test_smart_catalog_data: ${e}`);
    }

    // Итоговый статус
    if (results.functions_created.length > 0 && results.errors.length === 0) {
      results.status = "✅ Все функции созданы успешно";
    } else if (results.functions_created.length > 0) {
      results.status = "⚠️ Некоторые функции созданы, есть ошибки";
    } else {
      results.status = "❌ Функции не созданы";
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CREATE FUNCTIONS] Критическая ошибка:', error);
    return NextResponse.json({ 
      status: "❌ Критическая ошибка",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 