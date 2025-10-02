import { supabase } from '@/lib/supabaseClient';

interface SupplierData {
  id: string;
  name: string;
  company_name: string;
  category: string;
  contact_email: string;
  contact_phone: string;
  payment_methods: string[];
  bank_accounts: any[];
  p2p_cards: any[];
  crypto_wallets: any[];
}

interface ProductForSpec {
  item_name: string;
  quantity: number;
  price: number;
  unit: string;
  total: number;
  supplier_id: string;
  supplier_name: string;
  notes: string;
  sku?: string;
  category?: string;
  currency: string;
  min_order?: number;
  specifications?: any;
}

interface TemplateData {
  id: string;
  name: string;
  description: string;
  availableSteps: number[];
  lastUsed: string;
}

interface UseCatalogDataProps {
  templates: any[] | null;
  templatesLoading: boolean;
  templatesError: any;
  clientProfiles: any[] | null;
  clientProfilesLoading: boolean;
  supplierProfiles: any[] | null;
  supplierProfilesLoading: boolean;
  selectedProfileId: string | null;
  selectedSupplierProfileId: string | null;
  openModal: (modalName: string) => void;
  setShowSupplierProfileSelector: (show: boolean) => void;
}

export function useCatalogData({
  templates,
  templatesLoading,
  templatesError,
  clientProfiles,
  clientProfilesLoading,
  supplierProfiles,
  supplierProfilesLoading,
  selectedProfileId,
  selectedSupplierProfileId,
  openModal,
  setShowSupplierProfileSelector
}: UseCatalogDataProps) {

  // Получение списка шаблонов пользователя
  const getUserTemplates = (): TemplateData[] => {
    console.log('📋 [getUserTemplates] Проверяем шаблоны:', {
      templates: templates,
      loading: templatesLoading,
      error: templatesError,
      length: templates?.length || 0
    });

    if (!templates || templates.length === 0) {
      console.log('📋 [getUserTemplates] Шаблоны пусты');
      return [];
    }

    const mappedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name || 'Без названия',
      description: template.description || 'Шаблон проекта',
      availableSteps: [1, 2], // По умолчанию шаблоны содержат шаги 1 и 2
      lastUsed: template.updated_at ? new Date(template.updated_at).toLocaleDateString('ru-RU') : 'Недавно'
    }));

    console.log('📋 [getUserTemplates] Преобразованные шаблоны:', mappedTemplates);
    return mappedTemplates;
  };

  // Получение данных поставщика из каталога
  const getSupplierDataFromCatalog = async (supplierId: string): Promise<SupplierData | null> => {
    try {
      console.log('🔍 Запрос данных поставщика:', supplierId);

      const { data: supplier, error } = await supabase
        .from('catalog_verified_suppliers')
        .select(`
          id,
          name,
          company_name,
          category,
          contact_email,
          contact_phone,
          payment_methods,
          bank_accounts,
          p2p_cards,
          crypto_wallets
        `)
        .eq('id', supplierId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Ошибка получения данных поставщика:', error);
        return null;
      }

      if (!supplier) {
        console.warn('⚠️ Поставщик не найден:', supplierId);
        return null;
      }

      console.log('✅ Данные поставщика получены:', supplier.name);

      // Преобразуем данные в нужный формат
      const supplierData: SupplierData = {
        id: supplier.id,
        name: supplier.name,
        company_name: supplier.company_name,
        category: supplier.category,
        contact_email: supplier.contact_email,
        contact_phone: supplier.contact_phone,
        payment_methods: supplier.payment_methods || [],
        bank_accounts: supplier.bank_accounts || [],
        p2p_cards: supplier.p2p_cards || [],
        crypto_wallets: supplier.crypto_wallets || []
      };

      return supplierData;

    } catch (error) {
      console.error('💥 Критическая ошибка запроса поставщика:', error);
      return null;
    }
  };

  // Получение товаров поставщика из каталога
  const getSupplierProducts = async (supplierId: string): Promise<ProductForSpec[]> => {
    try {
      console.log('🔍 Запрос товаров поставщика:', supplierId);

      const { data: products, error } = await supabase
        .from('catalog_verified_products')
        .select(`
          id,
          name,
          description,
          price,
          currency,
          category,
          sku,
          min_order,
          specifications
        `)
        .eq('supplier_id', supplierId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Ошибка получения товаров поставщика:', error);
        return [];
      }

      if (!products || products.length === 0) {
        console.warn('⚠️ Товары поставщика не найдены:', supplierId);
        return [];
      }

      console.log(`✅ Получено ${products.length} товаров поставщика`);

      // Преобразуем данные в формат для спецификации
      const productsForSpec: ProductForSpec[] = products.map(product => ({
        item_name: product.name,
        quantity: 1, // Количество по умолчанию
        price: Number(product.price || 0),
        unit: 'шт', // Единица по умолчанию
        total: Number(product.price || 0),
        supplier_id: supplierId,
        supplier_name: '', // Будет заполнено из данных поставщика
        notes: product.description || '',
        sku: product.sku,
        category: product.category,
        currency: product.currency || 'USD',
        min_order: product.min_order,
        specifications: product.specifications
      }));

      return productsForSpec;

    } catch (error) {
      console.error('💥 Критическая ошибка запроса товаров:', error);
      return [];
    }
  };

  // Получение данных профиля для конкретного шага
  const getProfileData = async (stepId: number): Promise<any | null> => {
    console.log('🔍 Получаем данные профиля для шага:', stepId);

    if (stepId === 1) {
      // Для шага 1 (данные компании) используем профиль клиента
      if (clientProfilesLoading) {
        console.log('⏳ Профили клиентов загружаются...');
        return null;
      }

      if (!clientProfiles || clientProfiles.length === 0) {
        console.log('❌ Нет профилей клиентов');
        return null;
      }

      // Если несколько профилей и не выбран конкретный - показываем выбор
      if (clientProfiles.length > 1 && !selectedProfileId) {
        console.log('🔍 Несколько профилей - показываем выбор');
        openModal('profileSelector');
        return null;
      }

      // Определяем какой профиль использовать
      let targetProfile;
      if (selectedProfileId) {
        targetProfile = clientProfiles.find(p => p.id === selectedProfileId);
      } else {
        targetProfile = clientProfiles.find(p => p.is_default) || clientProfiles[0];
      }

      if (!targetProfile) {
        console.log('❌ Не найден профиль клиента');
        return null;
      }

      console.log('✅ Найден профиль клиента:', targetProfile.company_name || targetProfile.name);
      console.log('🏦 Банковские данные профиля:', {
        bank_name: targetProfile.bank_name,
        bank_account: targetProfile.bank_account,
        corr_account: targetProfile.corr_account || targetProfile.bank_corr_account,
        bik: targetProfile.bik || targetProfile.bank_bik
      });

      // ИСПРАВЛЕНО: Используем company_name в первую очередь, затем fallback на name
      const result = {
        name: targetProfile.company_name || targetProfile.name || '',
        legal_name: targetProfile.legal_name || '',
        inn: targetProfile.inn || '',
        kpp: targetProfile.kpp || '',
        ogrn: targetProfile.ogrn || '',
        legal_address: targetProfile.legal_address || targetProfile.address || '',
        bank_name: targetProfile.bank_name || '',
        bank_account: targetProfile.bank_account || '',
        corr_account: targetProfile.corr_account || targetProfile.bank_corr_account || '',
        bik: targetProfile.bik || targetProfile.bank_bik || '',
        email: targetProfile.email || '',
        phone: targetProfile.phone || '',
        website: targetProfile.website || ''
      };

      console.log('🎯 Возвращаемые данные getProfileData (ИСПРАВЛЕНО):', result);
      return result;
    }

    // Для шагов 2, 4, 5 используем профили поставщиков
    if ([2, 4, 5].includes(stepId)) {
      if (supplierProfilesLoading) {
        console.log('⏳ Профили поставщиков загружаются...');
        return null;
      }

      if (!supplierProfiles || supplierProfiles.length === 0) {
        console.log('❌ Нет профилей поставщиков');
        return null;
      }

      // Если несколько профилей и не выбран конкретный - показываем выбор
      if (supplierProfiles.length > 1 && !selectedSupplierProfileId) {
        console.log('🔍 Несколько профилей поставщиков - показываем выбор');
        setShowSupplierProfileSelector(true);
        return null;
      }

      // Определяем какой профиль использовать
      let targetProfile;
      if (selectedSupplierProfileId) {
        targetProfile = supplierProfiles.find(p => p.id === selectedSupplierProfileId);
      } else {
        targetProfile = supplierProfiles.find(p => p.is_default) || supplierProfiles[0];
      }

      if (!targetProfile) {
        console.log('❌ Не найден профиль поставщика');
        return null;
      }

      console.log('✅ Найден профиль поставщика:', targetProfile.name);

      // Возвращаем данные в зависимости от шага
      if (stepId === 2) {
        // Шаг 2: Название поставщика и валюта
        return {
          supplier: targetProfile.name,
          currency: targetProfile.transfer_currency || 'USD'
        };
      } else if (stepId === 4) {
        // Шаг 4: Методы оплаты
        return {
          method: targetProfile.payment_methods || 'bank-transfer'
        };
      } else if (stepId === 5) {
        // Шаг 5: Банковские реквизиты
        return {
          bankName: targetProfile.bank_name || '',
          accountNumber: targetProfile.account_number || '',
          swift: targetProfile.swift || '',
          iban: targetProfile.iban || '',
          recipientName: targetProfile.recipient_name || '',
          transferCurrency: targetProfile.transfer_currency || 'USD',
          paymentPurpose: targetProfile.payment_purpose || ''
        };
      }
    }

    // Для остальных шагов пока возвращаем null
    console.log('⚠️ Данные профиля для шага', stepId, 'пока не реализованы');
    return null;
  };

  return {
    getUserTemplates,
    getSupplierDataFromCatalog,
    getSupplierProducts,
    getProfileData
  };
}
