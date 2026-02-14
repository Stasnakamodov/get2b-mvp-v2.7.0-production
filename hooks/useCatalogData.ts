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

  const getUserTemplates = (): TemplateData[] => {
    if (!templates || templates.length === 0) {
      return [];
    }

    return templates.map(template => ({
      id: template.id,
      name: template.name || 'Без названия',
      description: template.description || 'Шаблон проекта',
      availableSteps: [1, 2],
      lastUsed: template.updated_at ? new Date(template.updated_at).toLocaleDateString('ru-RU') : 'Недавно'
    }));
  };

  const getSupplierDataFromCatalog = async (supplierId: string): Promise<SupplierData | null> => {
    try {
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

      if (error || !supplier) {
        return null;
      }

      return {
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
    } catch {
      return null;
    }
  };

  const getSupplierProducts = async (supplierId: string): Promise<ProductForSpec[]> => {
    try {
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

      if (error || !products || products.length === 0) {
        return [];
      }

      return products.map(product => ({
        item_name: product.name,
        quantity: 1,
        price: Number(product.price || 0),
        unit: 'шт',
        total: Number(product.price || 0),
        supplier_id: supplierId,
        supplier_name: '',
        notes: product.description || '',
        sku: product.sku,
        category: product.category,
        currency: product.currency || 'USD',
        min_order: product.min_order,
        specifications: product.specifications
      }));
    } catch {
      return [];
    }
  };

  const getProfileData = async (stepId: number): Promise<any | null> => {
    if (stepId === 1) {
      if (clientProfilesLoading) return null;
      if (!clientProfiles || clientProfiles.length === 0) return null;

      if (clientProfiles.length > 1 && !selectedProfileId) {
        openModal('profileSelector');
        return null;
      }

      let targetProfile;
      if (selectedProfileId) {
        targetProfile = clientProfiles.find(p => p.id === selectedProfileId);
      } else {
        targetProfile = clientProfiles.find(p => p.is_default) || clientProfiles[0];
      }

      if (!targetProfile) return null;

      return {
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
    }

    if ([2, 4, 5].includes(stepId)) {
      if (supplierProfilesLoading) return null;
      if (!supplierProfiles || supplierProfiles.length === 0) return null;

      if (supplierProfiles.length > 1 && !selectedSupplierProfileId) {
        setShowSupplierProfileSelector(true);
        return null;
      }

      let targetProfile;
      if (selectedSupplierProfileId) {
        targetProfile = supplierProfiles.find(p => p.id === selectedSupplierProfileId);
      } else {
        targetProfile = supplierProfiles.find(p => p.is_default) || supplierProfiles[0];
      }

      if (!targetProfile) return null;

      if (stepId === 2) {
        return {
          supplier: targetProfile.name,
          currency: targetProfile.transfer_currency || 'USD'
        };
      } else if (stepId === 4) {
        return {
          method: targetProfile.payment_methods || 'bank-transfer'
        };
      } else if (stepId === 5) {
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

    return null;
  };

  return {
    getUserTemplates,
    getSupplierDataFromCatalog,
    getSupplierProducts,
    getProfileData
  };
}
