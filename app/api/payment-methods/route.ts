import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Получение методов оплаты
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplier_id = searchParams.get("supplier_id");
    
    // Получаем уникальные методы оплаты от аккредитованных поставщиков
    const { data, error } = await supabase
      .from("catalog_verified_suppliers")
      .select("payment_methods, crypto_wallets, bank_accounts, p2p_cards")
      .not("payment_methods", "is", null);
    
    if (error) {
      console.error('❌ [API] Ошибка загрузки методов оплаты:', error);
      return NextResponse.json(
        { error: 'Ошибка загрузки методов оплаты' },
        { status: 500 }
      );
    }
    
    // Собираем все уникальные методы оплаты
    const paymentMethods = new Set<string>();
    
    data.forEach(supplier => {
      if (supplier.payment_methods) {
        supplier.payment_methods.forEach((method: string) => {
          paymentMethods.add(method);
        });
      }
    });
    
    // Формируем ответ в формате массива объектов
    const methods = Array.from(paymentMethods).map((method, index) => ({
      id: `payment_${index + 1}`,
      name: method,
      type: method.toLowerCase().includes('crypto') ? 'crypto' : 
            method.toLowerCase().includes('card') ? 'card' : 'bank'
    }));
    
    console.log('✅ [API] Методы оплаты загружены:', methods.length);
    return NextResponse.json(methods);
    
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки методов оплаты:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки методов оплаты' },
      { status: 500 }
    );
  }
}