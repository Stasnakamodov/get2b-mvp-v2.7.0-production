import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Создаем тестовый профиль клиента
    const testProfile = {
      user_id: user.id,
      name: 'ООО Тестовая Компания',
      legal_name: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ ТЕСТОВАЯ КОМПАНИЯ',
      inn: '1234567890',
      kpp: '123456789',
      ogrn: '1234567890123',
      legal_address: 'г. Москва, ул. Тестовая, д. 1, оф. 100',
      bank_name: 'Сбербанк России',
      bank_account: '40702810123456789012',
      corr_account: '30101810400000000225',
      bik: '044525225',
      email: 'test@company.ru',
      phone: '+7 (495) 123-45-67',
      website: 'https://test-company.ru',
      is_default: true
    }

    const { data, error } = await supabase
      .from('client_profiles')
      .insert([testProfile])
      .select()

    if (error) {
      console.error('Ошибка создания профиля:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Тестовый профиль клиента создан:', data[0])
    return NextResponse.json({ 
      success: true, 
      profile: data[0],
      message: 'Тестовый профиль клиента успешно создан'
    })

  } catch (error) {
    console.error('Ошибка:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    }, { status: 500 })
  }
} 