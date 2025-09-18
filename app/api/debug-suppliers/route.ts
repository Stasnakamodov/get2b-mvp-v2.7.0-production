import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Проверяем поставщиков в базе данных");

    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Проверяем токен через Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Недействительный токен авторизации");
        return NextResponse.json({ 
          error: "Unauthorized - недействительный токен" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через токен, user_id:", userId);
    } else {
      // Fallback: пытаемся получить пользователя из сессии
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Пользователь не авторизован");
        return NextResponse.json({ 
          error: "Unauthorized - требуется авторизация" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через сессию, user_id:", userId);
    }

    // Проверяем всех поставщиков в базе
    const { data: allSuppliers, error: allError } = await supabase
      .from("catalog_user_suppliers")
      .select("*");

    console.log("🔍 [DEBUG] Все поставщики в базе:", allSuppliers?.length);
    console.log("🔍 [DEBUG] Ошибка при получении всех поставщиков:", allError);

    // Проверяем поставщиков конкретного пользователя
    const { data: userSuppliers, error: userError } = await supabase
      .from("catalog_user_suppliers")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    console.log("🔍 [DEBUG] Поставщики пользователя:", userSuppliers?.length);
    console.log("🔍 [DEBUG] Ошибка при получении поставщиков пользователя:", userError);

    // Проверяем аккредитованных поставщиков
    const { data: verifiedSuppliers, error: verifiedError } = await supabase
      .from("catalog_verified_suppliers")
      .select("*")
      .eq("is_active", true);

    console.log("🔍 [DEBUG] Аккредитованные поставщики:", verifiedSuppliers?.length);
    console.log("🔍 [DEBUG] Ошибка при получении аккредитованных поставщиков:", verifiedError);

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        allSuppliersCount: allSuppliers?.length || 0,
        userSuppliersCount: userSuppliers?.length || 0,
        verifiedSuppliersCount: verifiedSuppliers?.length || 0,
        allSuppliers: allSuppliers?.slice(0, 5), // Первые 5 для примера
        userSuppliers: userSuppliers?.slice(0, 5), // Первые 5 для примера
        verifiedSuppliers: verifiedSuppliers?.slice(0, 5), // Первые 5 для примера
        errors: {
          allError: allError?.message,
          userError: userError?.message,
          verifiedError: verifiedError?.message
        }
      }
    });

  } catch (error) {
    console.error("❌ [DEBUG] Ошибка проверки поставщиков:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : "Неизвестная ошибка"
    }, { status: 500 });
  }
} 