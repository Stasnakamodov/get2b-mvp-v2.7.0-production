import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Создать проект из данных конструктора
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      draft_id, 
      project_name,
      step_data,
      step_configs 
    } = body;

    // 1. Получаем данные черновика
    let draftData = null;
    if (draft_id) {
      const { data: draft, error: draftError } = await supabase
        .from('constructor_drafts')
        .select('*')
        .eq('id', draft_id)
        .eq('user_id', user.id)
        .single();

      if (draftError) {
        console.error('Ошибка получения черновика:', draftError);
        return NextResponse.json({ error: "Черновик не найден" }, { status: 404 });
      }
      draftData = draft;
    }

    // 2. Извлекаем данные из шагов
    const stepData = draftData?.step_data || step_data || {};
    const stepConfigs = draftData?.step_configs || step_configs || {};

    // Данные компании (Step1)
    const companyData = stepData[1] || {};
    
    // Данные спецификации (Step2)
    const specificationData = stepData[2] || {};
    
    // Данные оплаты (Step4)
    const paymentData = stepData[4] || {};
    
    // Данные реквизитов (Step5)
    const requisitesData = stepData[5] || {};

    // 3. Создаем проект
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        name: project_name?.trim() || `Проект ${new Date().toLocaleDateString()}`,
        status: 'draft',
        current_step: 1,
        max_step_reached: 1,
        company_data: companyData,
        payment_method: paymentData.defaultMethod || 'bank-transfer',
        amount: calculateTotal(specificationData.items || []),
        currency: specificationData.currency || 'USD',
        supplier_data: {
          name: specificationData.supplier,
          items: specificationData.items || []
        }
      }])
      .select()
      .single();

    if (projectError) {
      console.error('Ошибка создания проекта:', projectError);
      return NextResponse.json({ error: "Ошибка создания проекта" }, { status: 500 });
    }

    // 4. Создаем спецификацию товаров
    if (specificationData.items && specificationData.items.length > 0) {
      const specificationItems = specificationData.items.map((item: any) => ({
        project_id: project.id,
        user_id: user.id,
        role: 'client',
        item_name: item.name,
        item_code: item.code || item.sku || '',
        quantity: item.quantity || 1,
        unit: item.unit || 'шт',
        price: item.price || 0,
        total: (item.price || 0) * (item.quantity || 1),
        image_url: item.image_url || '',
        currency: item.currency || specificationData.currency || 'USD',
        supplier_name: item.supplier_name || specificationData.supplier || ''
      }));

      const { error: specError } = await supabase
        .from('project_specifications')
        .insert(specificationItems);

      if (specError) {
        console.error('Ошибка создания спецификации:', specError);
        // Не прерываем процесс, спецификация не критична
      }
    }

    // 5. Создаем реквизиты (если есть)
    if (requisitesData && Object.keys(requisitesData).length > 0) {
      const { error: reqError } = await supabase
        .from('project_requisites')
        .insert([{
          user_id: user.id,
          project_id: project.id,
          type: requisitesData.type || 'bank',
          data: requisitesData
        }]);

      if (reqError) {
        console.error('Ошибка создания реквизитов:', reqError);
        // Не прерываем процесс, реквизиты не критичны
      }
    }

    // 6. Помечаем черновик как завершенный (если был)
    if (draft_id) {
      await supabase
        .from('constructor_drafts')
        .update({ is_complete: true })
        .eq('id', draft_id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ 
      project,
      message: "Проект успешно создан из конструктора"
    });

  } catch (error) {
    console.error('Ошибка API создания проекта:', error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// Вспомогательная функция для расчета общей суммы
function calculateTotal(items: any[]): number {
  return items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return total + (price * quantity);
  }, 0);
} 