import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    console.log('🔄 Создаем тестовый проект с поставщиком...');

    // Создаем новый проект с поставщиком
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
        name: 'Тестовый проект с поставщиком',
        status: 'in_work',
        supplier_id: '53b75c1a-873f-4527-ba2d-08a45215bf05',
        supplier_type: 'catalog',
        supplier_data: {
          id: '53b75c1a-873f-4527-ba2d-08a45215bf05',
          name: 'Название поставщика',
          company_name: 'Название компании',
          category: 'Электроника',
          country: 'Китай',
          city: 'Шэньчжэнь',
          contact_email: 'supplier@example.com',
          contact_phone: '+86 123 456 7890',
          website: 'https://supplier.example.com',
          contact_person: 'Менеджер',
          min_order: '1000 USD',
          response_time: '24 часа',
          employees: '100-500',
          established: '2010',
          payment_type: 'bank-transfer',
          payment_methods: {
            bank: {
              bank_name: 'Industrial and Commercial Bank of China',
              account_number: '1234567890123456',
              swift_code: 'ICBKCNBJ',
              bank_address: 'Beijing, China'
            }
          }
        },
        payment_method: 'bank-transfer',
        company_data: {
          name: 'Тестовая компания',
          email: 'test@example.com',
          phone: '+7 999 123 4567'
        },
        amount: 15000,
        currency: 'USD'
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Ошибка создания проекта:', projectError);
      return NextResponse.json({ error: 'Ошибка создания проекта' }, { status: 500 });
    }

    console.log('✅ Проект создан:', project.id);

    // Добавляем спецификацию
    const { error: specsError } = await supabase
      .from('project_specifications')
      .insert({
        project_id: project.id,
        user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
        item_name: 'Смартфон iPhone 15',
        item_code: 'IPH15-128',
        quantity: 10,
        unit: 'шт',
        price: 800,
        total: 8000,
        supplier_name: 'Название поставщика'
      });

    if (specsError) {
      console.error('❌ Ошибка добавления спецификации:', specsError);
      return NextResponse.json({ error: 'Ошибка добавления спецификации' }, { status: 500 });
    }

    // Добавляем реквизиты
    const { error: reqError } = await supabase
      .from('project_requisites')
      .insert({
        project_id: project.id,
        user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
        type: 'bank',
        data: {
          bankName: 'Industrial and Commercial Bank of China',
          accountNumber: '1234567890123456',
          swift: 'ICBKCNBJ',
          recipientName: 'Supplier Company',
          bankAddress: 'Beijing, China'
        }
      });

    if (reqError) {
      console.error('❌ Ошибка добавления реквизитов:', reqError);
      return NextResponse.json({ error: 'Ошибка добавления реквизитов' }, { status: 500 });
    }

    console.log('✅ Тестовый проект с поставщиком создан успешно!');

    return NextResponse.json({
      success: true,
      message: 'Тестовый проект с поставщиком создан',
      project_id: project.id
    });

  } catch (error) {
    console.error('❌ Ошибка создания тестового проекта:', error);
    return NextResponse.json(
      { error: 'Ошибка создания тестового проекта' },
      { status: 500 }
    );
  }
} 