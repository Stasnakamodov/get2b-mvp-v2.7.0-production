import { NextRequest, NextResponse } from "next/server";

// POST: Тестовый endpoint для диагностики формы аккредитации
export async function POST(request: NextRequest) {
  try {
    console.log("🧪 [TEST-FORM] Тест формы аккредитации");
    
    // Проверяем Content-Type
    const contentType = request.headers.get('content-type') || '';
    console.log("📋 [TEST-FORM] Content-Type:", contentType);
    
    let data: any = {};
    
    if (contentType.includes('multipart/form-data')) {
      // FormData
      const formData = await request.formData();
      console.log("📁 [TEST-FORM] Получен FormData");
      
      // Логируем все поля
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`📄 [TEST-FORM] ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`📝 [TEST-FORM] ${key}: ${value}`);
        }
      }
      
      // Парсим JSON поля
      const supplier_id = formData.get('supplier_id');
      const supplier_type = formData.get('supplier_type');
      const products = formData.get('products');
      const legal_confirmation = formData.get('legal_confirmation');
      
      data = {
        supplier_id,
        supplier_type,
        products: products ? JSON.parse(products as string) : [],
        legal_confirmation: legal_confirmation ? JSON.parse(legal_confirmation as string) : {}
      };
    } else {
      // JSON
      data = await request.json();
      console.log("📄 [TEST-FORM] Получен JSON:", data);
    }
    
    return NextResponse.json({
      success: true,
      message: "Форма получена успешно",
      data: {
        supplier_id: data.supplier_id,
        supplier_type: data.supplier_type,
        products_count: data.products?.length || 0,
        has_legal_confirmation: !!data.legal_confirmation
      }
    });
    
  } catch (error) {
    console.error("❌ [TEST-FORM] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 