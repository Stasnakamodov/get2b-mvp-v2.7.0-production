"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugSuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliersData();
  }, []);

  const fetchSuppliersData = async () => {
    try {
      // Получаем пользователя
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log("Пользователь не авторизован");
        return;
      }
      
      setUser(user);
      console.log("Текущий пользователь:", user.id, user.email);

      // Получаем всех поставщиков пользователя
      const { data: suppliersData, error } = await supabase
        .from("catalog_user_suppliers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ошибка загрузки поставщиков:", error);
        return;
      }

      console.log("Найдено поставщиков:", suppliersData?.length || 0);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error("Ошибка:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAccreditForm = (supplierId: string) => {
    window.open(`/dashboard/accredit-supplier/${supplierId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">🔍 Загрузка поставщиков...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔍 Отладка поставщиков</h1>
      
      {user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>👤 Текущий пользователь</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📋 Поставщики в синей комнате ({suppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <p className="text-gray-500">У вас нет поставщиков в профиле</p>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>ID:</strong> <code className="bg-gray-100 p-1 rounded">{supplier.id}</code></p>
                      <p><strong>Название:</strong> {supplier.name || 'Не указано'}</p>
                      <p><strong>Компания:</strong> {supplier.company_name || 'Не указано'}</p>
                      <p><strong>Категория:</strong> {supplier.category || 'Не указано'}</p>
                      <p><strong>Страна:</strong> {supplier.country || 'Не указано'}</p>
                    </div>
                    <div>
                      <p><strong>Статус:</strong> {supplier.is_active ? '✅ Активен' : '❌ Неактивен'}</p>
                      <p><strong>Создан:</strong> {new Date(supplier.created_at).toLocaleString('ru-RU')}</p>
                      <Button 
                        onClick={() => openAccreditForm(supplier.id)}
                        className="mt-2"
                        disabled={!supplier.is_active}
                      >
                        🚀 Открыть форму аккредитации
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 