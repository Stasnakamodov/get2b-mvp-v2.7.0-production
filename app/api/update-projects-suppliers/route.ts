import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    console.log('🔄 Обновляем проекты с данными о поставщиках...');

    // 1. Обновляем проект "in_progress" с поставщиком
    const { error: error1 } = await supabase
      .from('projects')
      .update({
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
        updated_at: new Date().toISOString()
      })
      .eq('id', 'b10a2033-7f41-4892-9ff3-2f859ca05cc5');

    if (error1) {
      console.error('❌ Ошибка обновления проекта 1:', error1);
      return NextResponse.json({ error: 'Ошибка обновления проекта 1' }, { status: 500 });
    }

    // 2. Обновляем проект "draft" с поставщиком
    const { error: error2 } = await supabase
      .from('projects')
      .update({
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
          payment_type: 'p2p',
          payment_methods: {
            p2p: {
              bank: 'Alipay Bank',
              card_number: '1234567890123456',
              holder_name: 'Supplier Company'
            }
          }
        },
        payment_method: 'p2p',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'ff3303ce-454f-4b5e-a6de-e4044e6c05b2');

    if (error2) {
      console.error('❌ Ошибка обновления проекта 2:', error2);
      return NextResponse.json({ error: 'Ошибка обновления проекта 2' }, { status: 500 });
    }

    // 3. Обновляем проект "waiting_approval" с поставщиком
    const { error: error3 } = await supabase
      .from('projects')
      .update({
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
          payment_type: 'crypto',
          payment_methods: {
            crypto: {
              network: 'BTC',
              address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
            }
          }
        },
        payment_method: 'crypto',
        updated_at: new Date().toISOString()
      })
      .eq('id', '7ace8371-9b82-4500-958a-6aff3ef720ec');

    if (error3) {
      console.error('❌ Ошибка обновления проекта 3:', error3);
      return NextResponse.json({ error: 'Ошибка обновления проекта 3' }, { status: 500 });
    }

    // 4. Добавляем спецификации товаров для проектов
    const { error: specsError } = await supabase
      .from('project_specifications')
      .insert([
        // Спецификации для проекта 1 (bank-transfer)
        {
          project_id: 'b10a2033-7f41-4892-9ff3-2f859ca05cc5',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          item_name: 'Смартфон iPhone 15',
          item_code: 'IPH15-128',
          quantity: 10,
          unit: 'шт',
          price: 800,
          total: 8000,
          supplier_name: 'Название поставщика'
        },
        {
          project_id: 'b10a2033-7f41-4892-9ff3-2f859ca05cc5',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          item_name: 'Ноутбук MacBook Pro',
          item_code: 'MBP-14',
          quantity: 5,
          unit: 'шт',
          price: 1500,
          total: 7500,
          supplier_name: 'Название поставщика'
        },
        // Спецификации для проекта 2 (p2p)
        {
          project_id: 'ff3303ce-454f-4b5e-a6de-e4044e6c05b2',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          item_name: 'Планшет iPad Pro',
          item_code: 'IPAD-12',
          quantity: 8,
          unit: 'шт',
          price: 900,
          total: 7200,
          supplier_name: 'Название поставщика'
        },
        {
          project_id: 'ff3303ce-454f-4b5e-a6de-e4044e6c05b2',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          item_name: 'Умные часы Apple Watch',
          item_code: 'AW-9',
          quantity: 15,
          unit: 'шт',
          price: 400,
          total: 6000,
          supplier_name: 'Название поставщика'
        },
        // Спецификации для проекта 3 (crypto)
        {
          project_id: '7ace8371-9b82-4500-958a-6aff3ef720ec',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          item_name: 'Наушники AirPods Pro',
          item_code: 'APP-2',
          quantity: 20,
          unit: 'шт',
          price: 250,
          total: 5000,
          supplier_name: 'Название поставщика'
        },
        {
          project_id: '7ace8371-9b82-4500-958a-6aff3ef720ec',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          item_name: 'Камера iPhone 15 Pro',
          item_code: 'IPH15P-256',
          quantity: 12,
          unit: 'шт',
          price: 1200,
          total: 14400,
          supplier_name: 'Название поставщика'
        }
      ]);

    if (specsError) {
      console.error('❌ Ошибка добавления спецификаций:', specsError);
      return NextResponse.json({ error: 'Ошибка добавления спецификаций' }, { status: 500 });
    }

    // 5. Добавляем реквизиты поставщиков для проектов
    const { error: reqError } = await supabase
      .from('project_requisites')
      .insert([
        // Реквизиты для проекта 1 (bank-transfer)
        {
          project_id: 'b10a2033-7f41-4892-9ff3-2f859ca05cc5',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          type: 'bank',
          data: {
            bankName: 'Industrial and Commercial Bank of China',
            accountNumber: '1234567890123456',
            swift: 'ICBKCNBJ',
            recipientName: 'Supplier Company',
            bankAddress: 'Beijing, China'
          }
        },
        // Реквизиты для проекта 2 (p2p)
        {
          project_id: 'ff3303ce-454f-4b5e-a6de-e4044e6c05b2',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          type: 'p2p',
          data: {
            card_bank: 'Alipay Bank',
            card_number: '1234567890123456',
            card_holder: 'Supplier Company'
          }
        },
        // Реквизиты для проекта 3 (crypto)
        {
          project_id: '7ace8371-9b82-4500-958a-6aff3ef720ec',
          user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
          type: 'crypto',
          data: {
            crypto_network: 'BTC',
            crypto_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
          }
        }
      ]);

    if (reqError) {
      console.error('❌ Ошибка добавления реквизитов:', reqError);
      return NextResponse.json({ error: 'Ошибка добавления реквизитов' }, { status: 500 });
    }

    console.log('✅ Проекты успешно обновлены с данными о поставщиках!');

    return NextResponse.json({
      success: true,
      message: 'Проекты обновлены с данными о поставщиках',
      updated_projects: 3,
      added_specifications: 6,
      added_requisites: 3
    });

  } catch (error) {
    console.error('❌ Ошибка обновления проектов:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления проектов' },
      { status: 500 }
    );
  }
} 