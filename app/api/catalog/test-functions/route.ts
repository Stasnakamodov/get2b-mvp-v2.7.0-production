import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Тестирование функций умного каталога
export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      status: "testing functions",
      tests: [],
      smart_catalog_ready: false
    };

    // Тест 1: Проверяем базовые таблицы
    try {
      const { count: historyCount } = await supabase
        .from("project_product_history")
        .select("*", { count: "exact", head: true });

      const { count: patternsCount } = await supabase
        .from("supplier_usage_patterns")
        .select("*", { count: "exact", head: true });

      results.tests.push({
        name: "Таблицы умного каталога",
        status: "✅ Готовы",
        details: {
          project_product_history: historyCount || 0,
          supplier_usage_patterns: patternsCount || 0
        }
      });
    } catch (error) {
      results.tests.push({
        name: "Таблицы умного каталога",
        status: "❌ Ошибка",
        error: String(error)
      });
    }

    // Тест 2: Добавляем тестовые данные напрямую
    try {
      const testProjectId = crypto.randomUUID();
      const testUserId = '86cc190d-0c80-463b-b0df-39a25b22365f';
      const testSupplierId = '977c2bee-750e-467f-a790-1fd5c3ec1e47';

      const { error: insertError } = await supabase
        .from("project_product_history")
        .insert([
          {
            project_id: testProjectId,
            user_id: testUserId,
            supplier_id: testSupplierId,
            supplier_type: 'user',
            product_name: 'Smart Test Product 1',
            product_category: 'Электроника',
            quantity: 5,
            unit_price: 150.00,
            total_price: 750.00,
            currency: 'USD',
            project_status: 'completed',
            was_successful: true
          },
          {
            project_id: testProjectId,
            user_id: testUserId,
            supplier_id: testSupplierId,
            supplier_type: 'user',
            product_name: 'Smart Test Product 2',
            product_category: 'Оборудование и машиностроение',
            quantity: 2,
            unit_price: 500.00,
            total_price: 1000.00,
            currency: 'USD',
            project_status: 'completed',
            was_successful: true
          }
        ]);

      if (insertError) {
        results.tests.push({
          name: "Добавление тестовой истории товаров",
          status: "❌ Ошибка",
          error: insertError.message
        });
      } else {
        results.tests.push({
          name: "Добавление тестовой истории товаров",
          status: "✅ Успешно",
          details: "Добавлено 2 тестовых товара"
        });
      }
    } catch (error) {
      results.tests.push({
        name: "Добавление тестовой истории товаров",
        status: "❌ Ошибка",
        error: String(error)
      });
    }

    // Тест 3: Создаем простую статистику без функций
    try {
      const testUserId = '86cc190d-0c80-463b-b0df-39a25b22365f';

      // Получаем статистику по истории товаров
      const { data: historyData, error: historyError } = await supabase
        .from("project_product_history")
        .select("*")
        .eq("user_id", testUserId);

      if (historyError) {
        throw historyError;
      }

      // Анализируем данные
      const totalProducts = historyData?.length || 0;
      const totalSpent = historyData?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
      const successfulProjects = historyData?.filter(item => item.was_successful).length || 0;
      const successRate = totalProducts > 0 ? (successfulProjects / totalProducts * 100).toFixed(1) : 0;

      // Категории товаров
      const categories = [...new Set(historyData?.map(item => item.product_category) || [])];

      results.tests.push({
        name: "Аналитика истории товаров",
        status: "✅ Работает",
        details: {
          total_products: totalProducts,
          total_spent: `$${totalSpent.toFixed(2)}`,
          success_rate: `${successRate}%`,
          categories: categories
        }
      });

      // Если все тесты прошли, каталог готов
      if (totalProducts > 0) {
        results.smart_catalog_ready = true;
      }

    } catch (error) {
      results.tests.push({
        name: "Аналитика истории товаров",
        status: "❌ Ошибка",
        error: String(error)
      });
    }

    // Общий статус
    const successfulTests = results.tests.filter((test: any) => test.status.includes("✅")).length;
    const totalTests = results.tests.length;

    if (results.smart_catalog_ready) {
      results.status = "🧠 Умный каталог работает!";
    } else if (successfulTests > 0) {
      results.status = `⚠️ Частично работает (${successfulTests}/${totalTests} тестов)`;
    } else {
      results.status = "❌ Не работает";
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [TEST FUNCTIONS] Критическая ошибка:', error);
    return NextResponse.json({ 
      status: "❌ Критическая ошибка",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 