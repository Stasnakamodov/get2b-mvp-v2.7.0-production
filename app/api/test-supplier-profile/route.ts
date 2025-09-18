import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    console.log('🏭 Создание тестового профиля поставщика...')
    
    const cookieStore = await cookies()
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Проверяем авторизацию
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      console.log('❌ Не авторизован')
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    console.log('✅ Пользователь авторизован:', user.email)

    // Создаем тестовый профиль поставщика
    const testSupplierProfile = {
      user_id: user.id,
      name: 'ООО ТестПоставщик',
      company_name: 'ООО ТестПоставщик',
      category: 'Электроника',
      country: 'Россия',
      city: 'Москва',
      description: 'Тестовый поставщик электроники',
      contact_email: 'test@supplier.ru',
      contact_phone: '+7 (495) 123-45-67',
      website: 'https://test-supplier.ru',
      contact_person: 'Иван Иванов',
      min_order: 10000,
      response_time: 24,
      employees: 50,
      established: 2020,
      certifications: ['ISO 9001', 'CE'],
      specialties: ['Электроника', 'Компьютеры'],
      payment_methods: ['bank-transfer', 'card'],
      recipient_name: 'ООО ТестПоставщик',
      bank_name: 'Сбербанк России',
      account_number: '40702810123456789012',
      swift: 'SABRRUMM',
      iban: 'RU12345678901234567890',
      transfer_currency: 'USD',
      payment_purpose: 'Оплата товаров',
      p2p_bank: 'Тинькофф',
      p2p_card_number: '1234567890123456',
      p2p_holder_name: 'IVAN IVANOV',
      crypto_name: 'Bitcoin',
      crypto_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      crypto_network: 'BTC',
      is_default: true,
      logo_url: ''
    }

    const { data: profile, error: insertError } = await supabaseServer
      .from('supplier_profiles')
      .insert(testSupplierProfile)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Ошибка создания профиля:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('✅ Тестовый профиль поставщика создан:', profile.id)
    return NextResponse.json({ 
      success: true, 
      profile: profile,
      message: 'Тестовый профиль поставщика создан успешно'
    })

  } catch (error) {
    console.error('❌ Ошибка создания тестового профиля поставщика:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }, { status: 500 })
  }
} 