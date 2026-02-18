import { supabase } from '@/lib/supabaseClient';
import { ApiError } from '@/lib/errors/ApiError';

// Типы данных
interface UserSupplier {
  id: string;
  company_name: string;
  description?: string;
  country?: string;
  category?: string;
  rating?: number;
  projects_count?: number;
  is_verified?: boolean;
  verification_date?: string;
  products_count?: number;
  min_order_quantity?: number;
  min_order_amount?: number;
}

interface VerifiedSupplier {
  id: string;
  company_name: string;
  description?: string;
  country?: string;
  category?: string;
  public_rating?: number;
  projects_count?: number;
  verification_date?: string;
  products_count?: number;
  min_order_quantity?: number;
  min_order_amount?: number;
}

interface UserSuppliersParams {
  userId: string;
  category?: string;
  country?: string;
  search?: string;
  sort?: 'name' | 'rating' | 'date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface VerifiedSuppliersParams {
  category?: string;
  country?: string;
  featured?: boolean;
  search?: string;
  sort?: 'name' | 'rating' | 'date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Вспомогательные функции
function calculatePagination(total: number, page: number, limit: number) {
  const pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
}

function getSortColumn(sort?: string): string {
  switch (sort) {
    case 'name': return 'company_name';
    case 'rating': return 'rating';
    case 'date': return 'created_at';
    default: return 'created_at';
  }
}

function sanitizeSearch(search: string): string {
  return search.replace(/[%_\\'"();]/g, ' ').trim().slice(0, 100);
}

// Получение поставщиков пользователя с оптимизацией
export async function getUserSuppliersOptimized(
  params: UserSuppliersParams
): Promise<PaginatedResponse<UserSupplier>> {
  const {
    userId,
    category,
    country,
    search,
    sort = 'date',
    order = 'desc',
    page = 1,
    limit = 20
  } = params;

  try {
    if (!userId) {
      throw ApiError.badRequest('userId обязателен');
    }

    if (page < 1 || limit < 1 || limit > 100) {
      throw ApiError.badRequest('Неверные параметры пагинации');
    }

    const offset = (page - 1) * limit;
    const ascending = order === 'asc';
    const sortColumn = getSortColumn(sort);

    // Count query
    let countQuery = supabase
      .from('user_suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (category) countQuery = countQuery.eq('category', category);
    if (country) countQuery = countQuery.eq('country', country);
    if (search) {
      const sanitized = sanitizeSearch(search);
      if (sanitized) {
        countQuery = countQuery.or(`company_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      throw ApiError.database('Ошибка подсчёта поставщиков', { code: countError.message, userId });
    }

    const total = count || 0;
    if (total === 0) {
      return { data: [], pagination: calculatePagination(0, page, limit) };
    }

    // Data query
    let dataQuery = supabase
      .from('user_suppliers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order(sortColumn, { ascending })
      .range(offset, offset + limit - 1);

    if (category) dataQuery = dataQuery.eq('category', category);
    if (country) dataQuery = dataQuery.eq('country', country);
    if (search) {
      const sanitized = sanitizeSearch(search);
      if (sanitized) {
        dataQuery = dataQuery.or(`company_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { data, error } = await dataQuery;
    if (error) {
      throw ApiError.database('Ошибка получения поставщиков', { code: error.message, userId });
    }

    const items: UserSupplier[] = (data || []).map((item) => ({
      id: item.id,
      company_name: item.company_name,
      description: item.description,
      country: item.country,
      category: item.category,
      rating: item.rating,
      projects_count: item.projects_count || 0,
      is_verified: item.is_verified || false,
      verification_date: item.verification_date,
      products_count: item.products_count || 0,
      min_order_quantity: item.min_order_quantity,
      min_order_amount: item.min_order_amount
    }));

    return { data: items, pagination: calculatePagination(total, page, limit) };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.database('Неизвестная ошибка получения поставщиков', { userId });
  }
}

// Получение аккредитованных поставщиков с оптимизацией
export async function getVerifiedSuppliersOptimized(
  params: VerifiedSuppliersParams
): Promise<PaginatedResponse<VerifiedSupplier>> {
  const {
    category,
    country,
    featured,
    search,
    sort = 'rating',
    order = 'desc',
    page = 1,
    limit = 20
  } = params;

  try {
    if (page < 1 || limit < 1 || limit > 100) {
      throw ApiError.badRequest('Неверные параметры пагинации');
    }

    const offset = (page - 1) * limit;
    const ascending = order === 'asc';
    const sortColumn = sort === 'rating' ? 'public_rating' : getSortColumn(sort);

    // Count query
    let countQuery = supabase
      .from('catalog_verified_suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (category) countQuery = countQuery.eq('category', category);
    if (country) countQuery = countQuery.eq('country', country);
    if (featured !== undefined) countQuery = countQuery.eq('is_featured', featured);
    if (search) {
      const sanitized = sanitizeSearch(search);
      if (sanitized) {
        countQuery = countQuery.or(`company_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      throw ApiError.database('Ошибка подсчёта верифицированных поставщиков', { code: countError.message });
    }

    const total = count || 0;
    if (total === 0) {
      return { data: [], pagination: calculatePagination(0, page, limit) };
    }

    // Data query
    let dataQuery = supabase
      .from('catalog_verified_suppliers')
      .select('*')
      .eq('is_active', true)
      .order(sortColumn, { ascending })
      .range(offset, offset + limit - 1);

    if (category) dataQuery = dataQuery.eq('category', category);
    if (country) dataQuery = dataQuery.eq('country', country);
    if (featured !== undefined) dataQuery = dataQuery.eq('is_featured', featured);
    if (search) {
      const sanitized = sanitizeSearch(search);
      if (sanitized) {
        dataQuery = dataQuery.or(`company_name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    const { data, error } = await dataQuery;
    if (error) {
      throw ApiError.database('Ошибка получения верифицированных поставщиков', { code: error.message });
    }

    const items: VerifiedSupplier[] = (data || []).map((item) => ({
      id: item.id,
      company_name: item.company_name,
      description: item.description,
      country: item.country,
      category: item.category,
      public_rating: item.public_rating,
      projects_count: item.projects_count || 0,
      verification_date: item.verification_date,
      products_count: item.products_count || 0,
      min_order_quantity: item.min_order_quantity,
      min_order_amount: item.min_order_amount
    }));

    return { data: items, pagination: calculatePagination(total, page, limit) };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.database('Неизвестная ошибка получения верифицированных поставщиков');
  }
}

// Поиск поставщиков с автозаполнением
export async function searchSuppliersAutocomplete(
  query: string,
  limit: number = 10
): Promise<Array<{id: string, name: string, category?: string}>> {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    if (limit < 1 || limit > 50) {
      limit = 10;
    }

    const sanitized = sanitizeSearch(query);
    if (!sanitized) return [];

    const searchPattern = `%${sanitized}%`;

    // Query both tables via Supabase Query Builder
    const [userResult, verifiedResult] = await Promise.all([
      supabase
        .from('user_suppliers')
        .select('id, company_name, category')
        .ilike('company_name', searchPattern)
        .eq('is_active', true)
        .limit(limit),
      supabase
        .from('catalog_verified_suppliers')
        .select('id, company_name, category')
        .ilike('company_name', searchPattern)
        .eq('is_active', true)
        .limit(limit)
    ]);

    const combined = [
      ...(userResult.data || []),
      ...(verifiedResult.data || [])
    ];

    // Deduplicate by company_name and limit
    const seen = new Set<string>();
    const results: Array<{id: string, name: string, category?: string}> = [];

    for (const item of combined) {
      const key = item.company_name?.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        results.push({
          id: item.id,
          name: item.company_name,
          category: item.category
        });
      }
      if (results.length >= limit) break;
    }

    return results;

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.database('Неизвестная ошибка поиска');
  }
}

// Получение статистики поставщиков
export async function getSuppliersStats(userId?: string): Promise<{
  total: number;
  verified: number;
  categories: Array<{category: string, count: number}>;
  countries: Array<{country: string, count: number}>;
}> {
  try {
    let query = supabase
      .from('user_suppliers')
      .select('category, country, is_verified', { count: 'exact' })
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, count, error } = await query;

    if (error) {
      throw ApiError.database('Ошибка получения статистики', {
        code: error.message,
        userId
      });
    }

    const items = data || [];
    const total = count || 0;
    const verified = items.filter(i => i.is_verified).length;

    // Aggregate categories
    const catMap = new Map<string, number>();
    for (const item of items) {
      if (item.category) {
        catMap.set(item.category, (catMap.get(item.category) || 0) + 1);
      }
    }

    // Aggregate countries
    const countryMap = new Map<string, number>();
    for (const item of items) {
      if (item.country) {
        countryMap.set(item.country, (countryMap.get(item.country) || 0) + 1);
      }
    }

    return {
      total,
      verified,
      categories: Array.from(catMap, ([category, cnt]) => ({ category, count: cnt })),
      countries: Array.from(countryMap, ([country, cnt]) => ({ country, count: cnt }))
    };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.database('Неизвестная ошибка получения статистики', { userId });
  }
}
