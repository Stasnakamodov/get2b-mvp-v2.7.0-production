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
  accreditation_status?: string;
  products_count?: number;
  min_order_quantity?: number;
  min_order_amount?: number;
  total_count?: number;
  [key: string]: any; // Для дополнительных полей из БД
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
  total_count?: number;
  [key: string]: any; // Для дополнительных полей из БД
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

function buildWhereClause(params: Record<string, any>): string {
  const conditions: string[] = [];
  
  if (params.category) {
    conditions.push(`category = '${params.category}'`);
  }
  
  if (params.country) {
    conditions.push(`country = '${params.country}'`);
  }
  
  if (params.search) {
    conditions.push(`(
      company_name ILIKE '%${params.search}%' OR 
      description ILIKE '%${params.search}%'
    )`);
  }
  
  if (params.featured !== undefined) {
    conditions.push(`is_featured = ${params.featured}`);
  }
  
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function buildOrderClause(sort?: string, order?: string): string {
  const validSorts = ['name', 'rating', 'date'];
  const validOrders = ['asc', 'desc'];
  
  if (!sort || !validSorts.includes(sort)) {
    return 'ORDER BY created_at DESC';
  }
  
  const orderDirection = validOrders.includes(order || 'desc') ? order : 'desc';
  
  switch (sort) {
    case 'name':
      return `ORDER BY company_name ${orderDirection}`;
    case 'rating':
      return `ORDER BY rating ${orderDirection} NULLS LAST`;
    case 'date':
      return `ORDER BY created_at ${orderDirection}`;
    default:
      return 'ORDER BY created_at DESC';
  }
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
    // Валидация параметров
    if (!userId) {
      throw ApiError.badRequest('userId обязателен');
    }

    if (page < 1 || limit < 1 || limit > 100) {
      throw ApiError.badRequest('Неверные параметры пагинации');
    }

    const offset = (page - 1) * limit;
    const whereClause = buildWhereClause({ category, country, search });
    const orderClause = buildOrderClause(sort, order);

    // Оптимизированный запрос с подсчетом
    const query = `
      SELECT 
        us.*,
        COUNT(*) OVER() as total_count
      FROM user_suppliers us
      ${whereClause}
      AND us.user_id = $1
      AND us.is_active = true
      ${orderClause}
      LIMIT $2 OFFSET $3
    `;

    const { data, error } = await supabase
      .rpc('execute_sql', {
        query,
        params: [userId, limit, offset]
      });

    if (error) {
      throw ApiError.database('Ошибка получения поставщиков', {
        code: error.message,
        userId
      });
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        pagination: calculatePagination(0, page, limit)
      };
    }

    const total = data[0]?.total_count || 0;
    const items = data.map((item: UserSupplier) => ({
      id: item.id,
      company_name: item.company_name,
      description: item.description,
      country: item.country,
      category: item.category,
      rating: item.rating,
      projects_count: item.projects_count || 0,
      is_verified: item.is_verified || false,
      verification_date: item.verification_date,
      accreditation_status: item.accreditation_status,
      products_count: item.products_count || 0,
      min_order_quantity: item.min_order_quantity,
      min_order_amount: item.min_order_amount
    }));

    return {
      data: items,
      pagination: calculatePagination(total, page, limit)
    };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.database('Неизвестная ошибка получения поставщиков', { 
      userId
    });
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
    const whereClause = buildWhereClause({ category, country, search, featured });
    const orderClause = buildOrderClause(sort, order);

    const query = `
      SELECT 
        vs.*,
        COUNT(*) OVER() as total_count
      FROM verified_suppliers vs
      ${whereClause}
      AND vs.is_active = true
      AND vs.verification_status = 'approved'
      ${orderClause}
      LIMIT $1 OFFSET $2
    `;

    const { data, error } = await supabase
      .rpc('execute_sql', {
        query,
        params: [limit, offset]
      });

    if (error) {
      throw ApiError.database('Ошибка получения верифицированных поставщиков', {
        code: error.message
      });
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        pagination: calculatePagination(0, page, limit)
      };
    }

    const total = data[0]?.total_count || 0;
    const items = data.map((item: VerifiedSupplier) => ({
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

    return {
      data: items,
      pagination: calculatePagination(total, page, limit)
    };

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

    const searchQuery = `
      SELECT DISTINCT
        id,
        company_name as name,
        category
      FROM (
        SELECT id, company_name, category
        FROM user_suppliers 
        WHERE company_name ILIKE $1 
          AND is_active = true
        UNION ALL
        SELECT id, company_name, category
        FROM verified_suppliers 
        WHERE company_name ILIKE $1 
          AND is_active = true
          AND verification_status = 'approved'
      ) combined
      ORDER BY name
      LIMIT $2
    `;

    const { data, error } = await supabase
      .rpc('execute_sql', {
        query: searchQuery,
        params: [`%${query}%`, limit]
      });

    if (error) {
      throw ApiError.database('Ошибка поиска поставщиков', {
        code: error.message
      });
    }

    return data?.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category
    })) || [];

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
    const userFilter = userId ? `AND user_id = '${userId}'` : '';
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_verified = true) as verified,
        array_agg(DISTINCT category) FILTER (WHERE category IS NOT NULL) as categories,
        array_agg(DISTINCT country) FILTER (WHERE country IS NOT NULL) as countries
      FROM user_suppliers 
      WHERE is_active = true ${userFilter}
    `;

    const { data, error } = await supabase
      .rpc('execute_sql', {
        query: statsQuery,
        params: []
      });

    if (error) {
      throw ApiError.database('Ошибка получения статистики', {
        code: error.message,
        userId
      });
    }

    const stats = data?.[0] || {};
    
    return {
      total: parseInt(stats.total) || 0,
      verified: parseInt(stats.verified) || 0,
      categories: (stats.categories || []).map((cat: string) => ({
        category: cat,
        count: 0 // Можно добавить подсчет отдельным запросом
      })),
      countries: (stats.countries || []).map((country: string) => ({
        country: country,
        count: 0 // Можно добавить подсчет отдельным запросом
      }))
    };

  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.database('Неизвестная ошибка получения статистики', {
      userId
    });
  }
} 