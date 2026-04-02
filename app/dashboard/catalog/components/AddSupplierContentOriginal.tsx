import { db } from "@/lib/db/client"
import { logger } from "@/src/shared/lib/logger"
import React, { useEffect, useState } from "react";
import { useAddSupplierContext } from "../context/AddSupplierContext";
import { Package, Plus, X, ImageIcon, Upload, Building2, Smartphone, Bitcoin, FileText } from 'lucide-react';
import { CATEGORY_CERTIFICATIONS } from '@/src/shared/config';
interface AddSupplierContentOriginalProps {
  onClose: () => void;
  onSuccess?: (supplier: any) => void;
  editingSupplier?: any;
  targetTable: 'supplier_profiles' | 'catalog_user_suppliers';
}

export function AddSupplierContentOriginal({ 
  onClose,
  onSuccess,
  editingSupplier,
  targetTable
}: AddSupplierContentOriginalProps) {
  const {
    currentStep,
    setCurrentStep,
    supplierData,
    setSupplierData,
    isLoading,
    setIsLoading,
    validateStep,
    canProceedToStep,
    maxStepReached,
    setMaxStepReached
  } = useAddSupplierContext();

  // Состояние для загрузки логотипа
  const [uploadingLogo, setUploadingLogo] = useState(false);

    // Инициализация данных при редактировании
  useEffect(() => {
    if (editingSupplier) {
      setSupplierData({
        ...supplierData,
        ...editingSupplier,
        // Маппинг полей БД → Форма
        min_order_currency: editingSupplier.min_order || "",
        delivery_time: editingSupplier.response_time || "",
        // Обеспечиваем, что все необходимые поля есть
        products: Array.isArray(editingSupplier.products) ? editingSupplier.products : [],
        certifications: (() => {
          // Парсим certifications, если это JSON строка
          if (typeof editingSupplier.certifications === 'string') {
            try {
              return JSON.parse(editingSupplier.certifications);
            } catch {
              return [];
            }
          }
          return Array.isArray(editingSupplier.certifications) ? editingSupplier.certifications : [];
        })(),
        banking_requisites: editingSupplier.banking_requisites || {},
        p2p_transfers: Array.isArray(editingSupplier.p2p_transfers) ? editingSupplier.p2p_transfers : [],
        crypto_wallets: Array.isArray(editingSupplier.crypto_wallets) ? editingSupplier.crypto_wallets : []
      });
      // При редактировании разрешаем доступ ко всем шагам
      setMaxStepReached(7);
    }
  }, [editingSupplier]);

  // Функция конвертации файла в Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Функция загрузки логотипа
  const handleLogoUpload = async (file: File) => {
    if (!file) return

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      alert('Поддерживаются только изображения: JPEG, PNG, WebP, SVG')
      return
    }

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    setUploadingLogo(true)

    try {
      // Создаем уникальное имя файла
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      // Попытка загрузки в Supabase Storage
      const { data, error } = await db.storage
        .from('supplier-logos')
        .upload(fileName, file)

      if (error) {
        logger.warn('⚠️ Ошибка загрузки в Supabase Storage:', error.message)
        // Fallback на Base64
        const base64 = await convertToBase64(file)
        setSupplierData(prev => ({ ...prev, logo_url: base64 }))
      } else {
        // Получаем публичный URL
        const { data: urlData } = db.storage
          .from('supplier-logos')
          .getPublicUrl(fileName)
        
        setSupplierData(prev => ({ ...prev, logo_url: urlData.publicUrl }))
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки логотипа:', error)
      // Fallback на Base64
      try {
        const base64 = await convertToBase64(file)
        setSupplierData(prev => ({ ...prev, logo_url: base64 }))
      } catch (base64Error) {
        logger.error('❌ Ошибка конвертации в Base64:', base64Error)
        alert('Ошибка загрузки логотипа')
      }
    } finally {
      setUploadingLogo(false)
    }
  }

  // 🎯 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Учитывает targetTable для выбора API endpoint
  const handleSaveSupplier = async () => {
    if (!validateStep(1)) {
      alert("Заполните все обязательные поля");
      return;
    }

    setIsLoading(true);

    try {
      // Подготавливаем базовые данные
      const baseData = {
          name: supplierData.name,
          company_name: supplierData.company_name,
          category: supplierData.category,
          country: supplierData.country,
        city: supplierData.city || '',
        description: supplierData.description || '',
        logo_url: supplierData.logo_url || '',
        contact_email: supplierData.contact_email || '',
        contact_phone: supplierData.contact_phone || '',
        website: supplierData.website || '',
        contact_person: supplierData.contact_person || '',
      };

      let dataToSave: any;
      let apiEndpoint: string;

      // 🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ: Выбираем endpoint в зависимости от targetTable
      if (targetTable === 'supplier_profiles') {
        // Для профилей поставщиков - полная структура для /api/profile/supplier-profiles
        dataToSave = {
          ...baseData,
          // Дополнительные поля для профилей
          min_order: supplierData.min_order_currency || '',
          response_time: supplierData.delivery_time || '',
          employees: supplierData.employees || '',
          established: supplierData.established || '',
        certifications: JSON.stringify(supplierData.certifications || []),
          specialties: JSON.stringify([]),
          payment_methods: JSON.stringify({}),
        
        // Банковские реквизиты
        recipient_name: supplierData.recipient_name || '',
        bank_name: supplierData.bank_name || '',
        account_number: supplierData.account_number || '',
        swift: supplierData.swift || '',
          bank_address: supplierData.bank_address || '',
          recipient_address: supplierData.recipient_address || '',
        
        // P2P реквизиты
        p2p_bank: supplierData.p2p_bank || '',
        p2p_card_number: supplierData.p2p_card_number || '',
        p2p_holder_name: supplierData.p2p_holder_name || '',
        p2p_expiry_date: supplierData.p2p_expiry_date || '',
        
        // Криптореквизиты
        crypto_name: supplierData.crypto_name || '',
        crypto_address: supplierData.crypto_address || '',
        crypto_network: supplierData.crypto_network || '',
        
          // Дополнительные поля
          transfer_currency: supplierData.transfer_currency || 'USD',
          payment_purpose: supplierData.payment_purpose || '',
          other_details: supplierData.other_details || '',
        
        // Профильные поля
        is_default: false,
        user_notes: '',
        is_active: true
      };
        apiEndpoint = '/api/profile/supplier-profiles';

      } else {
        // Для каталога пользователей - упрощенная структура для /api/catalog/user-suppliers
        dataToSave = {
          ...baseData,
          min_order: supplierData.min_order_currency || '',
          response_time: supplierData.delivery_time || '',
          source_type: 'user_added',
          is_active: true
        };
        apiEndpoint = '/api/catalog/user-suppliers';
      }

      // Отправляем запрос на правильный endpoint
      const method = editingSupplier ? 'PATCH' : 'POST';
      const finalApiEndpoint = apiEndpoint; // PATCH использует тот же endpoint
      
      // Для PATCH запроса добавляем ID в тело запроса
      const requestBody = editingSupplier 
        ? { id: editingSupplier.id, ...dataToSave }
        : dataToSave;
      
      // Получаем токен авторизации для запроса
      const { data: { session } } = await db.auth.getSession();
      if (!session) {
        logger.error('❌ [DEBUG] Нет активной сессии');
        throw new Error('Нет активной сессии для сохранения поставщика');
      }
      

      const response = await fetch(finalApiEndpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
        });
        

        if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сохранения: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      // Добавление товаров поставщика (только для каталога)
      if (targetTable === 'catalog_user_suppliers' && supplierData.products && supplierData.products.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        
        for (const product of supplierData.products) {
          const productPayload = {
            supplier_id: result.supplier?.id || result.id,
            supplier_type: 'user', // Указываем что это товар пользовательского поставщика
            name: product.name,
            description: product.description,
            category: product.category || supplierData.category,
            price: product.price ? parseFloat(product.price) : null,
            currency: 'USD',
            min_order: product.minOrder,
            images: product.images,
            specifications: product.specifications || {},
            in_stock: product.inStock,
            sku: (product as any).sku || null
          }


          const productResponse = await fetch('/api/catalog/products', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productPayload),
          })

          if (!productResponse.ok) {
            const errorData = await productResponse.json();
            logger.error(`❌ Ошибка при добавлении товара "${product.name}":`, errorData);
            errorCount++;
          } else {
            const productResult = await productResponse.json();
            successCount++;
          }
        }
        
      }

      // Показываем разные сообщения в зависимости от targetTable
      const successMessage = targetTable === 'supplier_profiles' 
        ? '✅ Поставщик успешно сохранен в профиль!' 
        : '✅ Поставщик успешно добавлен в каталог!';
      alert(successMessage);
      
      if (onSuccess) {
        onSuccess(result);
      }

      onClose();
    } catch (error) {
      logger.error('❌ Ошибка сохранения поставщика:', error);
      alert(`❌ Ошибка сохранения поставщика: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const themeColor = targetTable === 'supplier_profiles' ? 'green' : 'orange';
    
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Основная информация</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Название поставщика
                </label>
                <input
                  type="text"
                  value={supplierData.name}
                  onChange={(e) => setSupplierData({...supplierData, name: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="Например: TechFlow Innovations"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Название компании
                </label>
                <input
                  type="text"
                  value={supplierData.company_name}
                  onChange={(e) => setSupplierData({...supplierData, company_name: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="Официальное название"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Категория
                </label>
                <select
                  value={supplierData.category}
                  onChange={(e) => setSupplierData({
                    ...supplierData, 
                    category: e.target.value,
                    certifications: [] // Сбрасываем сертификаты при смене категории
                  })}
                  className={`w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
                >
                  {CATEGORY_CERTIFICATIONS.map(cat => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Страна
                </label>
                <select
                  value={supplierData.country}
                  onChange={(e) => setSupplierData({...supplierData, country: e.target.value})}
                  className={`w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-${themeColor}-500`}
                >
                  <option value="Китай">🇨🇳 Китай</option>
                  <option value="Турция">🇹🇷 Турция</option>
                  <option value="Индия">🇮🇳 Индия</option>
                  <option value="Южная Корея">🇰🇷 Южная Корея</option>
                  <option value="Другая">🌍 Другая</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Город
                </label>
                <input
                  type="text"
                  value={supplierData.city}
                  onChange={(e) => setSupplierData({...supplierData, city: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="Например: Shenzhen"
                />
            </div>
            
              <div className="col-span-2">
              <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Описание
              </label>
              <textarea
                value={supplierData.description}
                onChange={(e) => setSupplierData({...supplierData, description: e.target.value})}
                className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  rows={3}
                  placeholder="Краткое описание деятельности поставщика"
              />
            </div>

            {/* Блок загрузки логотипа */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                Логотип компании
              </label>
              <div className="flex items-start gap-4">
                {/* Превью логотипа */}
                <div className="w-32 h-32 border-2 border-black flex items-center justify-center bg-gray-50 relative">
                  {supplierData.logo_url ? (
                    <img 
                      src={supplierData.logo_url} 
                      alt="Логотип компании" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm text-center font-medium">
                      LOGO
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">Загрузка...</div>
                    </div>
                  )}
                </div>
                
                {/* Кнопки управления */}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleLogoUpload(file)
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <div className="space-y-2">
                    <label
                      htmlFor="logo-upload"
                      className="block w-full px-4 py-2 border-2 border-black bg-white hover:bg-gray-50 text-center cursor-pointer transition-colors"
                    >
                      {supplierData.logo_url ? 'Изменить логотип' : 'Загрузить логотип'}
                    </label>
                    {supplierData.logo_url && (
                      <button
                        type="button"
                        onClick={() => setSupplierData({...supplierData, logo_url: ''})}
                        className="block w-full px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-50 text-center transition-colors"
                      >
                        Удалить логотип
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Поддерживаются: JPEG, PNG, WebP, SVG<br/>
                    Максимальный размер: 5MB
                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Контактная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={supplierData.contact_email || ''}
                  onChange={(e) => setSupplierData({...supplierData, contact_email: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="contact@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={supplierData.contact_phone || ''}
                  onChange={(e) => setSupplierData({...supplierData, contact_phone: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="+86 139 0013 8000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Контактное лицо
                </label>
                <input
                  type="text"
                  value={supplierData.contact_person || ''}
                  onChange={(e) => setSupplierData({...supplierData, contact_person: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="Mr. Wang"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Веб-сайт
                </label>
                <input
                  type="url"
                  value={supplierData.website || ''}
                  onChange={(e) => setSupplierData({...supplierData, website: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="https://company.com"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Бизнес профиль</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Минимальный заказ
                </label>
                <input
                  type="text"
                  value={supplierData.min_order_currency || ''}
                  onChange={(e) => setSupplierData({...supplierData, min_order_currency: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="1000 USD"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Время отклика
                </label>
                <input
                  type="text"
                  value={supplierData.delivery_time || ''}
                  onChange={(e) => setSupplierData({...supplierData, delivery_time: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="24 часа"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Количество сотрудников
                </label>
                <input
                  type="text"
                  value={supplierData.employees || ''}
                  onChange={(e) => setSupplierData({...supplierData, employees: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="50-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                  Год основания
                </label>
                <input
                  type="text"
                  value={supplierData.established || ''}
                  onChange={(e) => setSupplierData({...supplierData, established: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                  placeholder="2010"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        const categoryCerts = CATEGORY_CERTIFICATIONS.find(cat => cat.category === supplierData.category)?.certifications || [];
        
  return (
    <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Сертификации</h3>
            
            {/* Отладочная информация */}
            <div className="bg-gray-100 p-4 border-2 border-gray-300 text-sm">
              <p><strong>Выбранная категория:</strong> {supplierData.category}</p>
              <p><strong>Доступные сертификаты:</strong> {categoryCerts.join(', ') || 'Нет сертификатов для этой категории'}</p>
            </div>
            
            {categoryCerts.length > 0 ? (
            <div>
                <label className="block text-sm font-medium text-black mb-4 uppercase tracking-wider">
                  Выберите релевантные сертификации для категории "{supplierData.category}"
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryCerts.map(cert => (
                    <label key={cert} className="flex items-center gap-2 text-black border-2 border-gray-300 p-3 hover:border-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supplierData.certifications.includes(cert)}
                        onChange={e => {
                        if (e.target.checked) {
                            setSupplierData({
                              ...supplierData,
                              certifications: [...supplierData.certifications, cert]
                            });
                        } else {
                            setSupplierData({
                              ...supplierData,
                              certifications: supplierData.certifications.filter(c => c !== cert)
                            });
                        }
                      }}
                        className={`h-4 w-4 text-${themeColor}-600 focus:ring-${themeColor}-500 border-gray-300 rounded`}
                    />
                      <span className="text-sm">{cert}</span>
                  </label>
                ))}
              </div>
                
                {/* Показываем выбранные сертификаты */}
                {supplierData.certifications.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-300">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-green-800">Выбранные сертификаты:</p>
                      <button
                        type="button"
                        onClick={() => setSupplierData({...supplierData, certifications: []})}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Очистить все
                      </button>
            </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(supplierData.certifications) && supplierData.certifications.map((cert, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 text-sm border border-green-200 rounded flex items-center gap-2">
                          {cert}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-red-600" 
                            onClick={() => setSupplierData({
                              ...supplierData,
                              certifications: supplierData.certifications.filter(c => c !== cert)
                            })}
                          />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-6 border-2 border-yellow-300">
                <p className="text-yellow-800">
                  Для категории "{supplierData.category}" пока нет предустановленных сертификаций. 
                  Вы можете добавить их вручную позже или изменить категорию на шаге 1.
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">Товары и каталог</h3>
            
            {/* Кнопка добавления товара */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-gray-600 text-sm">Добавьте товары, которые вы производите или поставляете</p>
              </div>
              <button
                onClick={() => {
                  const newProduct = {
                    id: Date.now().toString(),
                    name: '',
                    price: '',
                    description: '',
                    images: [],
                    specifications: {},
                    category: supplierData.category,
                    inStock: true,
                    minOrder: ''
                  }
                  setSupplierData({
                    ...supplierData,
                    products: [...(supplierData.products || []), newProduct]
                  })
                }}
                className="bg-orange-500 text-white px-4 py-2 hover:bg-orange-600 transition-all text-sm font-medium uppercase tracking-wider flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить товар
              </button>
            </div>

            {/* Список товаров */}
            <div className="space-y-6">
              {(!supplierData.products || supplierData.products.length === 0) ? (
                <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium uppercase tracking-wider">Товары не добавлены</p>
                  <p className="text-gray-400 text-sm mt-2">Нажмите кнопку "Добавить товар" для начала</p>
                </div>
              ) : (
                (supplierData.products || []).map((product: any, index: number) => (
                  <div key={product.id} className="border-2 border-black p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                        Товар #{index + 1}
                      </h4>
              <button
                        onClick={() => {
                          setSupplierData({
                            ...supplierData,
                            products: (supplierData.products || []).filter((p: any) => p.id !== product.id)
                          })
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 transition-all"
                      >
                        <X className="w-4 h-4" />
              </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                          Название товара
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => {
                            const updatedProducts = (supplierData.products || []).map((p: any) => 
                              p.id === product.id ? { ...p, name: e.target.value } : p
                            )
                            setSupplierData({ ...supplierData, products: updatedProducts })
                          }}
                          className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Например: Беспроводные наушники"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                          Цена
                        </label>
                        <input
                          type="text"
                          value={product.price}
                          onChange={(e) => {
                            const updatedProducts = (supplierData.products || []).map((p: any) => 
                              p.id === product.id ? { ...p, price: e.target.value } : p
                            )
                            setSupplierData({ ...supplierData, products: updatedProducts })
                          }}
                          className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="$25.99"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                          Минимальный заказ
                        </label>
                        <input
                          type="text"
                          value={product.minOrder}
                          onChange={(e) => {
                            const updatedProducts = (supplierData.products || []).map((p: any) => 
                              p.id === product.id ? { ...p, minOrder: e.target.value } : p
                            )
                            setSupplierData({ ...supplierData, products: updatedProducts })
                          }}
                          className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="100 шт"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                          Наличие
                        </label>
                        <select
                          value={product.inStock ? 'true' : 'false'}
                          onChange={(e) => {
                            const updatedProducts = (supplierData.products || []).map((p: any) => 
                              p.id === product.id ? { ...p, inStock: e.target.value === 'true' } : p
                            )
                            setSupplierData({ ...supplierData, products: updatedProducts })
                          }}
                          className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="true">В наличии</option>
                          <option value="false">Под заказ</option>
                        </select>
          </div>
        </div>

                    {/* Описание товара */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Описание товара
                      </label>
                      <textarea
                        value={product.description}
                        onChange={(e) => {
                          const updatedProducts = (supplierData.products || []).map((p: any) => 
                            p.id === product.id ? { ...p, description: e.target.value } : p
                          )
                          setSupplierData({ ...supplierData, products: updatedProducts })
                        }}
                        className="w-full px-3 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={3}
                        placeholder="Подробное описание товара, его характеристики и преимущества..."
                      />
                    </div>

                    {/* Изображения товара */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Изображения товара
                      </label>
                      
                      {/* Существующие изображения */}
                          {product.images && product.images.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-4">
                              {product.images.map((image: string, imgIndex: number) => (
                            <div key={imgIndex} className="relative">
                                  <img
                                    src={image}
                                alt={`Товар ${index + 1} - Изображение ${imgIndex + 1}`}
                                className="w-20 h-20 object-cover border-2 border-gray-300"
                                  />
                                  <button
                                    onClick={() => {
                                      const updatedProducts = (supplierData.products || []).map((p: any) => 
                                        p.id === product.id 
                                          ? { ...p, images: p.images.filter((_: any, i: number) => i !== imgIndex) }
                                          : p
                                      )
                                      setSupplierData({ ...supplierData, products: updatedProducts })
                                    }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
      </div>
                              ))}
    </div>
                          )}

                      {/* Загрузка новых изображений */}
                            <input
                              type="file"
                              multiple
                        accept="image/*"
                              onChange={async (e) => {
                          const files = e.target.files
                          if (!files || files.length === 0) return
                                
                                  const validUrls: string[] = []
                                  
                          try {
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i]
                              if (!file.type.startsWith('image/')) continue

                              try {
                                // Пробуем Base64 как fallback
                                      const base64 = await convertToBase64(file)
                                      validUrls.push(base64)
                                    } catch (error) {
                                logger.error(`❌ Ошибка конвертации изображения ${i + 1}:`, error)
                                    }
                                  }
                                  
                                  if (validUrls.length > 0) {
                                    const updatedProducts = (supplierData.products || []).map((p: any) => 
                                      p.id === product.id 
                                        ? { ...p, images: [...(p.images || []), ...validUrls] }
                                        : p
                                    )
                                    setSupplierData({ ...supplierData, products: updatedProducts })
                              
                                  }
                                } catch (error) {
                            logger.error('❌ Критическая ошибка при загрузке изображений:', error)
                            alert('Произошла ошибка при загрузке изображений. Пожалуйста, попробуйте позже.')
                                }
                              }}
                        className="w-full px-3 py-2 border-2 border-dashed border-gray-400 hover:border-orange-500 transition-colors file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      <p className="text-gray-500 text-xs mt-2">Выберите несколько изображений (JPG, PNG, WebP)</p>
                          </div>
                                </div>
                ))
                          )}
                        </div>
                      </div>
        );

      case 6:
        return (
            <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">
              {targetTable === 'supplier_profiles' ? 'Банковские реквизиты' : 'Дополнительная информация'}
            </h3>
                
            {targetTable === 'supplier_profiles' ? (
                <div className="space-y-6">
                {/* 🏦 БАНКОВСКИЕ РЕКВИЗИТЫ */}
                <div className="border-2 border-black p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                      Банковские реквизиты
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Получатель платежа
                      </label>
                        <input
                          type="text"
                        value={supplierData.recipient_name || ''}
                        onChange={(e) => setSupplierData({...supplierData, recipient_name: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="Company Name Ltd"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Название банка
                      </label>
                        <input
                          type="text"
                        value={supplierData.bank_name || ''}
                        onChange={(e) => setSupplierData({...supplierData, bank_name: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="Bank of China"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Номер счета
                      </label>
                        <input
                          type="text"
                        value={supplierData.account_number || ''}
                        onChange={(e) => setSupplierData({...supplierData, account_number: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="1234567890123456"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        SWIFT код
                      </label>
                        <input
                          type="text"
                        value={supplierData.swift || ''}
                        onChange={(e) => setSupplierData({...supplierData, swift: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="BKCHCNBJ"
                        />
                      </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Адрес банка
                      </label>
                      <input
                        type="text"
                        value={supplierData.bank_address || ''}
                        onChange={(e) => setSupplierData({...supplierData, bank_address: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="No.1 Fuxingmen Nei Dajie, Beijing 100818, China"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Адрес получателя
                      </label>
                      <input
                        type="text"
                        value={supplierData.recipient_address || ''}
                        onChange={(e) => setSupplierData({...supplierData, recipient_address: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="Юридический адрес получателя"
                      />
                    </div>
                    </div>
                  </div>
                  
                {/* 📱 P2P ПЕРЕВОДЫ */}
                <div className="border-2 border-black p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="h-5 w-5 text-green-500" />
                    <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                      P2P Переводы (карта поставщика)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Банк карты
                      </label>
                      <input
                        type="text"
                        value={supplierData.p2p_bank || ''}
                        onChange={(e) => setSupplierData({...supplierData, p2p_bank: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="Сбербанк"
                      />
                    </div>
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Номер карты
                      </label>
                        <input
                          type="text"
                        value={supplierData.p2p_card_number || ''}
                        onChange={(e) => setSupplierData({...supplierData, p2p_card_number: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Держатель карты
                      </label>
                        <input
                          type="text"
                        value={supplierData.p2p_holder_name || ''}
                        onChange={(e) => setSupplierData({...supplierData, p2p_holder_name: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="IVAN PETROV"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Срок действия
                      </label>
                        <input
                          type="text"
                        value={supplierData.p2p_expiry_date || ''}
                        onChange={(e) => setSupplierData({...supplierData, p2p_expiry_date: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="12/25"
                        />
                      </div>
                    </div>
                  </div>
                  
                {/* 🪙 КРИПТОВАЛЮТА */}
                <div className="border-2 border-black p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bitcoin className="h-5 w-5 text-orange-500" />
                    <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                      Криптовалютные кошельки
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Название криптовалюты
                      </label>
                        <input
                          type="text"
                        value={supplierData.crypto_name || ''}
                        onChange={(e) => setSupplierData({...supplierData, crypto_name: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="USDT"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Сеть
                      </label>
                        <input
                          type="text"
                        value={supplierData.crypto_network || ''}
                        onChange={(e) => setSupplierData({...supplierData, crypto_network: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="TRC20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Адрес кошелька
                      </label>
                      <input
                        type="text"
                        value={supplierData.crypto_address || ''}
                        onChange={(e) => setSupplierData({...supplierData, crypto_address: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="TQrZ4seWE6jsqRYpVMiG6TZ4fjH9hDCeRx"
                        />
                    </div>
                  </div>
                      </div>
                      
                {/* 📄 ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ */}
                <div className="border-2 border-black p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                      Дополнительная информация
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Валюта переводов
                      </label>
                      <select
                        value={supplierData.transfer_currency || 'USD'}
                        onChange={(e) => setSupplierData({...supplierData, transfer_currency: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                      >
                        <option value="USD">USD - Доллар США</option>
                        <option value="EUR">EUR - Евро</option>
                        <option value="CNY">CNY - Китайский юань</option>
                        <option value="RUB">RUB - Российский рубль</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Назначение платежа
                      </label>
                        <input
                          type="text"
                        value={supplierData.payment_purpose || ''}
                        onChange={(e) => setSupplierData({...supplierData, payment_purpose: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black`}
                        placeholder="Оплата за товары по договору"
                        />
                      </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wider">
                        Дополнительные детали
                      </label>
                      <textarea
                        value={supplierData.other_details || ''}
                        onChange={(e) => setSupplierData({...supplierData, other_details: e.target.value})}
                        className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-black resize-none`}
                        rows={3}
                        placeholder="Любая дополнительная информация о платежах и реквизитах..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 border-2 border-gray-300">
                <p className="text-gray-600 mb-4">Дополнительные заметки о поставщике:</p>
                <textarea
                  value={supplierData.description || ''}
                  onChange={(e) => setSupplierData({...supplierData, description: e.target.value})}
                  className={`w-full px-3 py-2 border-2 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500 border-gray-300`}
                  placeholder="Личные заметки..."
                  rows={4}
                />
            </div>
          )}
          </div>
        );
          
      case 7:
        return (
            <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">
              Финальная проверка
            </h3>
            <p className="text-gray-600 mb-6">
              Проверьте все данные поставщика перед сохранением. Вы можете вернуться к любому шагу для внесения изменений.
            </p>

            {/* ШАГ 1: ОСНОВНАЯ ИНФОРМАЦИЯ */}
            <div className="border-2 border-black p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                    </div>
                  <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                    Основная информация
                  </h4>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium uppercase tracking-wider"
                >
                  Редактировать
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Название:</span> {supplierData.name || '-'}</div>
                <div><span className="font-medium">Компания:</span> {supplierData.company_name || '-'}</div>
                <div><span className="font-medium">Категория:</span> {supplierData.category || '-'}</div>
                <div><span className="font-medium">Страна:</span> {supplierData.country || '-'}</div>
                <div><span className="font-medium">Город:</span> {supplierData.city || '-'}</div>
                <div><span className="font-medium">Контактное лицо:</span> {supplierData.contact_person || '-'}</div>
              </div>
              {supplierData.description && (
                <div className="mt-4">
                  <div className="font-medium text-sm mb-1">Описание:</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {supplierData.description}
                  </div>
                </div>
              )}
                  </div>
                  
            {/* ШАГ 2: КОНТАКТНАЯ ИНФОРМАЦИЯ */}
            <div className="border-2 border-black p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                    Контактная информация
                  </h4>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium uppercase tracking-wider"
                >
                  Редактировать
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Email:</span> {supplierData.contact_email || '-'}</div>
                <div><span className="font-medium">Телефон:</span> {supplierData.contact_phone || '-'}</div>
                <div><span className="font-medium">Веб-сайт:</span> {supplierData.website || '-'}</div>
                <div><span className="font-medium">Юридический адрес:</span> {supplierData.legal_address || '-'}</div>
                <div><span className="font-medium">Фактический адрес:</span> {supplierData.actual_address || '-'}</div>
                    </div>
                  </div>
                  
            {/* ШАГ 3: БИЗНЕС-ПРОФИЛЬ */}
            <div className="border-2 border-black p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                    Бизнес-профиль
                  </h4>
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium uppercase tracking-wider"
                >
                  Редактировать
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Мин. заказ:</span> {supplierData.min_order_currency || '-'}</div>
                <div><span className="font-medium">Время доставки:</span> {supplierData.delivery_time || '-'}</div>
                <div><span className="font-medium">Сотрудников:</span> {supplierData.employees || '-'}</div>
                <div><span className="font-medium">Год основания:</span> {supplierData.established || '-'}</div>
                    </div>
                  </div>
                  
            {/* ШАГ 4: СЕРТИФИКАЦИИ */}
            <div className="border-2 border-black p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                    </div>
                  <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                    Сертификации
                  </h4>
                </div>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium uppercase tracking-wider"
                >
                  Редактировать
                </button>
              </div>
              <div className="text-sm">
                {supplierData.certifications && supplierData.certifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {supplierData.certifications.map((cert, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Сертификации не добавлены</span>
                )}
              </div>
            </div>

            {/* ШАГ 5: ТОВАРЫ (только для каталога) */}
            {targetTable === 'catalog_user_suppliers' && (
              <div className="border-2 border-black p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                    <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                      Товары и каталог
                    </h4>
                  </div>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium uppercase tracking-wider"
                  >
                    Редактировать
                  </button>
                </div>
                <div className="text-sm">
                  {supplierData.products && supplierData.products.length > 0 ? (
                    <div className="space-y-3">
                      <div className="font-medium">
                        Добавлено товаров: {Array.isArray(supplierData.products) ? supplierData.products.length : 0}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.isArray(supplierData.products) && supplierData.products.slice(0, 6).map((product: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded border">
                            <div className="font-medium text-sm">{product.name || `Товар ${index + 1}`}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {product.price && `${product.price}`}
                              {product.inStock ? ' • В наличии' : ' • Под заказ'}
                            </div>
                            {product.images && product.images.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                📷 {product.images.length} изображения
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {supplierData.products.length > 6 && (
                        <div className="text-xs text-gray-500">
                          ... и ещё {supplierData.products.length - 6} товаров
                    </div>
                  )}
                </div>
                  ) : (
                    <span className="text-gray-500">Товары не добавлены</span>
                  )}
              </div>
            </div>
          )}

            {/* ШАГ 6: БАНКОВСКИЕ РЕКВИЗИТЫ (только для профилей) */}
            {targetTable === 'supplier_profiles' && (
              <div className="border-2 border-black p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      6
        </div>
                    <h4 className="text-lg font-medium text-black uppercase tracking-wider">
                      Банковские реквизиты
                    </h4>
                  </div>
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium uppercase tracking-wider"
                  >
                    Редактировать
                  </button>
                </div>
                <div className="space-y-4 text-sm">
                  {/* Банковские реквизиты */}
                  {(supplierData.bank_name || supplierData.account_number) && (
                    <div>
                      <div className="font-medium mb-2 flex items-center gap-2">
                        🏦 Банковские реквизиты
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {supplierData.recipient_name && <div><span className="text-gray-600">Получатель:</span> {supplierData.recipient_name}</div>}
                        {supplierData.bank_name && <div><span className="text-gray-600">Банк:</span> {supplierData.bank_name}</div>}
                        {supplierData.account_number && <div><span className="text-gray-600">Счет:</span> {supplierData.account_number}</div>}
                        {supplierData.swift && <div><span className="text-gray-600">SWIFT:</span> {supplierData.swift}</div>}
                      </div>
                    </div>
                  )}

                  {/* P2P реквизиты */}
                  {(supplierData.p2p_bank || supplierData.p2p_card_number) && (
                    <div>
                      <div className="font-medium mb-2 flex items-center gap-2">
                        📱 P2P переводы
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {supplierData.p2p_bank && <div><span className="text-gray-600">Банк карты:</span> {supplierData.p2p_bank}</div>}
                        {supplierData.p2p_card_number && <div><span className="text-gray-600">Номер карты:</span> {supplierData.p2p_card_number}</div>}
                        {supplierData.p2p_holder_name && <div><span className="text-gray-600">Держатель:</span> {supplierData.p2p_holder_name}</div>}
                      </div>
                    </div>
                  )}

                  {/* Криптореквизиты */}
                  {(supplierData.crypto_name || supplierData.crypto_address) && (
                    <div>
                      <div className="font-medium mb-2 flex items-center gap-2">
                        🪙 Криптовалюта
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {supplierData.crypto_name && <div><span className="text-gray-600">Валюта:</span> {supplierData.crypto_name}</div>}
                        {supplierData.crypto_network && <div><span className="text-gray-600">Сеть:</span> {supplierData.crypto_network}</div>}
                        {supplierData.crypto_address && (
                          <div className="md:col-span-2">
                            <span className="text-gray-600">Адрес:</span> 
                            <span className="font-mono text-xs break-all"> {supplierData.crypto_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!supplierData.bank_name && !supplierData.account_number && !supplierData.p2p_bank && !supplierData.crypto_name && (
                    <span className="text-gray-500">Банковские реквизиты не добавлены</span>
                  )}
                </div>
              </div>
            )}

            {/* ИТОГОВАЯ ИНФОРМАЦИЯ */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 p-6 rounded">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h4 className="text-lg font-bold text-green-800">
                    Готово к сохранению
                  </h4>
                  <p className="text-sm text-green-600">
                    {targetTable === 'supplier_profiles' 
                      ? 'Поставщик будет сохранен в ваш профиль с банковскими реквизитами'
                      : 'Поставщик будет добавлен в каталог с товарами'
                    }
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded border border-green-200">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Тип сохранения:</span>
                    <span className="font-medium">
                      {targetTable === 'supplier_profiles' ? '👤 Профиль пользователя' : '📦 Каталог товаров'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Заполненных шагов:</span>
                    <span className="font-medium">
                      {targetTable === 'supplier_profiles' ? '6 из 6' : '5 из 5'}
                    </span>
                  </div>
                  {targetTable === 'catalog_user_suppliers' && supplierData.products && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Товаров добавлено:</span>
                      <span className="font-medium">{supplierData.products.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-medium text-black mb-4 uppercase tracking-wider">
              Шаг {currentStep}
            </h3>
            <p>Содержимое шага {currentStep} будет добавлено позже.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {renderCurrentStep()}
      </div>
      
      <div className="border-t-2 border-black p-6">
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
              currentStep === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Назад
          </button>
          
          <div className="flex space-x-2">
            {currentStep < 7 && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className={`px-4 py-2 text-white rounded-md text-sm font-medium ${
                  targetTable === 'supplier_profiles' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Далее
              </button>
            )}
            
            {currentStep === 7 && (
              <button
                onClick={handleSaveSupplier}
                disabled={isLoading}
                className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:bg-gray-400 ${
                  targetTable === 'supplier_profiles' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isLoading ? 'Сохранение...' : 'Сохранить поставщика'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}