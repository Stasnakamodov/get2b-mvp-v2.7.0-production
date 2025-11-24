import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Получение умных рекомендаций поставщиков
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!user_id) {
      return NextResponse.json({ error: 'user_id обязателен' }, { status: 400 });
    }


    // Получаем статистику поставщиков
    const { data: supplierStats, error: statsError } = await supabase
      .from('supplier_usage_patterns')
      .select('*')
      .order('success_rate', { ascending: false })
      .limit(limit);

    // Получаем популярные товары
    const { data: popularProducts, error: productsError } = await supabase
      .from('project_product_history')
      .select('product_name, supplier_name, unit_price')
      .limit(limit);

    // Получаем аккредитованных поставщиков
    const { data: verifiedSuppliers, error: verifiedError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name, company_name, rating, specialization')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(limit);

    const recommendations = {
      top_suppliers: supplierStats || [],
      trending_products: popularProducts || [],
      verified_suppliers: verifiedSuppliers || [],
      generated_at: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true,
      recommendations
    });

  } catch (error) {
    console.error('❌ [SMART RECOMMENDATIONS] Ошибка:', error);
    return NextResponse.json({ 
      error: 'Ошибка генерации рекомендаций'
    }, { status: 500 });
  }
} 