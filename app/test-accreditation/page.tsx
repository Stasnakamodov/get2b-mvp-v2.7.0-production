"use client";

import React, { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function TestAccreditationPage() {
  const router = useRouter();

  useEffect(() => {
    createTestSupplierAndRedirect();
  }, []);

  const createTestSupplierAndRedirect = async () => {
    try {
      // Получаем пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Войдите в систему');
        router.push('/login');
        return;
      }

      console.log('👤 Пользователь:', user.id, user.email);

      // Добавляем тестового поставщика
      const supplierData = {
        user_id: user.id,
        name: 'Тест Компания',
        company_name: 'ООО Тест Компания',
        category: 'Электроника',
        country: 'Россия',
        city: 'Москва',
        description: 'Тестовый поставщик',
        contact_email: 'test@example.com',
        contact_phone: '+7 495 123 45 67',
        contact_person: 'Иван Тестов',
        is_active: true,
        source_type: 'user_added'
      };

      console.log('📦 Создаем поставщика:', supplierData);

      const { data: supplier, error } = await supabase
        .from('catalog_user_suppliers')
        .insert(supplierData)
        .select()
        .single();

      console.log('📊 Результат создания:', { supplier, error });

      if (error) {
        console.error('❌ Ошибка создания поставщика:', error);
        alert(`Ошибка создания поставщика: ${error.message}`);
        return;
      }

      if (!supplier) {
        console.error('❌ Поставщик не создался');
        alert('Поставщик не создался');
        return;
      }

      console.log('✅ Поставщик создан с ID:', supplier.id);
      
      // Небольшая задержка для синхронизации
      setTimeout(() => {
        router.push(`/dashboard/accredit-supplier/${supplier.id}`);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Критическая ошибка:', error);
      alert(`Произошла ошибка: ${error}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">🔄 Создаем тестового поставщика...</h1>
        <p>Вас перенаправят на форму аккредитации</p>
      </div>
    </div>
  );
} 