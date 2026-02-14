import { useState, useEffect } from 'react';

// Типы данных
export interface VerifiedSupplier {
  id: string;
  name: string;
  company_name: string;
  category: string;
  country: string;
  city?: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  contact_person?: string;
  min_order?: string;
  response_time?: string;
  rating: number;
  reviews_count: number;
  projects_count: number;
  is_featured: boolean;
  is_active: boolean;
  catalog_verified_products?: VerifiedProduct[];
}

export interface UserSupplier {
  id: string;
  user_id: string;
  name: string;
  company_name: string;
  category: string;
  country: string;
  city?: string;
  description?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  contact_person?: string;
  min_order?: string;
  response_time?: string;
  source_type: 'user_added' | 'imported_from_catalog' | 'extracted_from_7steps';
  source_supplier_id?: string;
  import_date?: string;
  total_projects: number;
  successful_projects: number;
  cancelled_projects: number;
  total_spent: number;
  last_project_date?: string;
  user_notes?: string;
  user_rating?: number;
  is_favorite: boolean;
  is_active: boolean;
  catalog_user_products?: UserProduct[];
}

export interface VerifiedProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  in_stock: boolean;
  min_order?: string;
}

export interface UserProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  in_stock: boolean;
  min_order?: string;
}

export interface CatalogFilters {
  category?: string;
  country?: string;
  featured?: boolean;
  search?: string;
}

export interface UserCatalogFilters {
  category?: string;
  source_type?: string;
  search?: string;
  sort_by?: 'total_projects' | 'last_project_date' | 'created_at' | 'name';
}

// Хук для работы с аккредитованными поставщиками (оранжевая комната)
export function useVerifiedSuppliers(filters: CatalogFilters = {}) {
  const [suppliers, setSuppliers] = useState<VerifiedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.country && filters.country !== 'all') params.append('country', filters.country);
      if (filters.featured) params.append('featured', 'true');
      if (filters.search) params.append('search', filters.search);

      params.append('verified', 'true');
      const response = await fetch(`/api/catalog/suppliers?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки аккредитованных поставщиков');
      }

      setSuppliers(data.suppliers || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [filters.category, filters.country, filters.featured, filters.search]);

  return {
    suppliers,
    loading,
    error,
    total,
    refetch: fetchSuppliers
  };
}

// Хук для работы с личными поставщиками (синяя комната)
export function useUserSuppliers(filters: UserCatalogFilters = {}) {
  const [suppliers, setSuppliers] = useState<UserSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.source_type && filters.source_type !== 'all') params.append('source_type', filters.source_type);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);

      const response = await fetch(`/api/catalog/user-suppliers?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки личных поставщиков');
      }

      setSuppliers(data.suppliers || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [filters.category, filters.source_type, filters.search, filters.sort_by]);

  return {
    suppliers,
    loading,
    error,
    total,
    refetch: fetchSuppliers
  };
}

// Хук для импорта поставщика
export function useImportSupplier() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importSupplier = async (verifiedSupplierId: string): Promise<UserSupplier | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/catalog/import-supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified_supplier_id: verifiedSupplierId,
          import_products: false
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка импорта поставщика');
      }

      return data.supplier;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkCanImport = async (verifiedSupplierId: string) => {
    try {
      const response = await fetch(`/api/catalog/import-supplier?verified_supplier_id=${verifiedSupplierId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка проверки импорта');
      }

      return data;
    } catch (err) {
      return { can_import: false, reason: 'Ошибка проверки' };
    }
  };

  return {
    importSupplier,
    checkCanImport,
    loading,
    error
  };
}

// Хук для синхронизации каталога
export function useCatalogSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const syncCatalog = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/catalog/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка синхронизации каталога');
      }

      setLastSync(data.timestamp);
      return data.result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    try {
      const response = await fetch('/api/catalog/sync');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка получения статистики');
      }

      return data;
    } catch (err) {
      return null;
    }
  };

  return {
    syncCatalog,
    getStats,
    loading,
    error,
    lastSync
  };
} 