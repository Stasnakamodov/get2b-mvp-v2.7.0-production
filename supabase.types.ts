export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // ========================================
      // ПРОФИЛИ КЛИЕНТОВ
      // ========================================
      client_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          legal_name: string | null
          inn: string | null
          kpp: string | null
          ogrn: string | null
          legal_address: string | null
          bank_name: string | null
          bank_account: string | null
          corr_account: string | null
          bik: string | null
          email: string | null
          phone: string | null
          website: string | null
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          legal_name?: string | null
          inn?: string | null
          kpp?: string | null
          ogrn?: string | null
          legal_address?: string | null
          bank_name?: string | null
          bank_account?: string | null
          corr_account?: string | null
          bik?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          legal_name?: string | null
          inn?: string | null
          kpp?: string | null
          ogrn?: string | null
          legal_address?: string | null
          bank_name?: string | null
          bank_account?: string | null
          corr_account?: string | null
          bik?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      
      // ========================================
      // ПРОФИЛИ ПОСТАВЩИКОВ
      // ========================================
      supplier_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          company_name: string
          category: string
          country: string
          city: string | null
          description: string | null
          logo_url: string | null
          contact_email: string | null
          contact_phone: string | null
          website: string | null
          contact_person: string | null
          min_order: string | null
          response_time: string | null
          employees: string | null
          established: string | null
          certifications: Json | null
          specialties: Json | null
          payment_methods: Json | null
          recipient_name: string | null
          recipient_address: string | null
          bank_name: string | null
          bank_address: string | null
          account_number: string | null
          swift: string | null
          iban: string | null
          cnaps_code: string | null
          transfer_currency: string
          payment_purpose: string | null
          other_details: string | null
          p2p_bank: string | null
          p2p_card_number: string | null
          p2p_holder_name: string | null
          p2p_expiry_date: string | null
          crypto_name: string | null
          crypto_address: string | null
          crypto_network: string | null
          inn: string | null
          kpp: string | null
          ogrn: string | null
          legal_address: string | null
          actual_address: string | null
          is_default: boolean
          user_notes: string | null
          user_rating: number | null
          is_favorite: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          company_name: string
          category: string
          country: string
          city?: string | null
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          contact_person?: string | null
          min_order?: string | null
          response_time?: string | null
          employees?: string | null
          established?: string | null
          certifications?: Json | null
          specialties?: Json | null
          payment_methods?: Json | null
          recipient_name?: string | null
          recipient_address?: string | null
          bank_name?: string | null
          bank_address?: string | null
          account_number?: string | null
          swift?: string | null
          iban?: string | null
          cnaps_code?: string | null
          transfer_currency?: string
          payment_purpose?: string | null
          other_details?: string | null
          p2p_bank?: string | null
          p2p_card_number?: string | null
          p2p_holder_name?: string | null
          p2p_expiry_date?: string | null
          crypto_name?: string | null
          crypto_address?: string | null
          crypto_network?: string | null
          inn?: string | null
          kpp?: string | null
          ogrn?: string | null
          legal_address?: string | null
          actual_address?: string | null
          is_default?: boolean
          user_notes?: string | null
          user_rating?: number | null
          is_favorite?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          company_name?: string
          category?: string
          country?: string
          city?: string | null
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          contact_person?: string | null
          min_order?: string | null
          response_time?: string | null
          employees?: string | null
          established?: string | null
          certifications?: Json | null
          specialties?: Json | null
          payment_methods?: Json | null
          recipient_name?: string | null
          recipient_address?: string | null
          bank_name?: string | null
          bank_address?: string | null
          account_number?: string | null
          swift?: string | null
          iban?: string | null
          cnaps_code?: string | null
          transfer_currency?: string
          payment_purpose?: string | null
          other_details?: string | null
          p2p_bank?: string | null
          p2p_card_number?: string | null
          p2p_holder_name?: string | null
          p2p_expiry_date?: string | null
          crypto_name?: string | null
          crypto_address?: string | null
          crypto_network?: string | null
          inn?: string | null
          kpp?: string | null
          ogrn?: string | null
          legal_address?: string | null
          actual_address?: string | null
          is_default?: boolean
          user_notes?: string | null
          user_rating?: number | null
          is_favorite?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // ========================================
      // КАТАЛОГ ПОСТАВЩИКОВ ПОЛЬЗОВАТЕЛЕЙ
      // ========================================
      catalog_user_suppliers: {
        Row: {
          id: string
          user_id: string
          name: string
          company_name: string
          category: string
          country: string
          city: string | null
          description: string | null
          logo_url: string | null
          contact_email: string | null
          contact_phone: string | null
          website: string | null
          contact_person: string | null
          min_order: string | null
          response_time: string | null
          employees: string | null
          established: string | null
          certifications: Json | null
          specialties: Json | null
          payment_methods: Json | null
          source_type: string
          source_supplier_id: string | null
          import_date: string | null
          total_projects: number
          successful_projects: number
          cancelled_projects: number
          last_project_date: string | null
          total_spent: number
          user_notes: string | null
          user_rating: number | null
          is_favorite: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          company_name: string
          category: string
          country: string
          city?: string | null
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          contact_person?: string | null
          min_order?: string | null
          response_time?: string | null
          employees?: string | null
          established?: string | null
          certifications?: Json | null
          specialties?: Json | null
          payment_methods?: Json | null
          source_type?: string
          source_supplier_id?: string | null
          import_date?: string | null
          total_projects?: number
          successful_projects?: number
          cancelled_projects?: number
          last_project_date?: string | null
          total_spent?: number
          user_notes?: string | null
          user_rating?: number | null
          is_favorite?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          company_name?: string
          category?: string
          country?: string
          city?: string | null
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          contact_person?: string | null
          min_order?: string | null
          response_time?: string | null
          employees?: string | null
          established?: string | null
          certifications?: Json | null
          specialties?: Json | null
          payment_methods?: Json | null
          source_type?: string
          source_supplier_id?: string | null
          import_date?: string | null
          total_projects?: number
          successful_projects?: number
          cancelled_projects?: number
          last_project_date?: string | null
          total_spent?: number
          user_notes?: string | null
          user_rating?: number | null
          is_favorite?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_user_suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }

      // ========================================
      // ПРОЕКТЫ
      // ========================================
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string
          current_step: number
          max_step_reached: number
          company_data: Json | null
          amount: number | null
          currency: string | null
          payment_method: string | null
          specification_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          status?: string
          current_step?: number
          max_step_reached?: number
          company_data?: Json | null
          amount?: number | null
          currency?: string | null
          payment_method?: string | null
          specification_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          status?: string
          current_step?: number
          max_step_reached?: number
          company_data?: Json | null
          amount?: number | null
          currency?: string | null
          payment_method?: string | null
          specification_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ========================================
// ДОПОЛНИТЕЛЬНЫЕ ТИПЫ ДЛЯ УДОБСТВА
// ========================================

export type ClientProfile = Database['public']['Tables']['client_profiles']['Row']
export type ClientProfileInsert = Database['public']['Tables']['client_profiles']['Insert']
export type ClientProfileUpdate = Database['public']['Tables']['client_profiles']['Update']

export type SupplierProfile = Database['public']['Tables']['supplier_profiles']['Row']
export type SupplierProfileInsert = Database['public']['Tables']['supplier_profiles']['Insert']
export type SupplierProfileUpdate = Database['public']['Tables']['supplier_profiles']['Update']

export type CatalogUserSupplier = Database['public']['Tables']['catalog_user_suppliers']['Row']
export type CatalogUserSupplierInsert = Database['public']['Tables']['catalog_user_suppliers']['Insert']
export type CatalogUserSupplierUpdate = Database['public']['Tables']['catalog_user_suppliers']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

// ========================================
// ТИПЫ ДЛЯ ФОРМ
// ========================================

export interface SupplierFormData {
  // Основная информация
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description: string
  
  // Контакты
  contact_email: string
  contact_phone: string
  website: string
  contact_person: string
  
  // Банковские реквизиты
  recipient_name: string
  bank_name: string
  account_number: string
  swift: string
  iban: string
  transfer_currency: string
  payment_purpose: string
  
  // P2P реквизиты
  p2p_bank: string
  p2p_card_number: string
  p2p_holder_name: string
  
  // Криптовалюта
  crypto_name: string
  crypto_address: string
  crypto_network: string
}

export interface ClientFormData {
  // Основная информация
  name: string
  legal_name: string
  
  // Российские реквизиты
  inn: string
  kpp: string
  ogrn: string
  legal_address: string
  
  // Банковские реквизиты
  bank_name: string
  bank_account: string
  corr_account: string
  bik: string
  
  // Контакты
  email: string
  phone: string
  website: string
}

// ========================================
// КОНСТАНТЫ
// ========================================

export const SUPPLIER_CATEGORIES = [
  'Электроника',
  'Текстиль и одежда', 
  'Красота и здоровье',
  'Автотовары',
  'Спорт и отдых'
] as const

export const COUNTRIES = [
  'Китай',
  'Турция',
  'Индия',
  'Южная Корея',
  'Малайзия',
  'Таиланд',
  'Вьетнам',
  'Другая'
] as const

export const CURRENCIES = [
  'USD',
  'EUR',
  'CNY',
  'RUB'
] as const

export type SupplierCategory = typeof SUPPLIER_CATEGORIES[number]
export type Country = typeof COUNTRIES[number]
export type Currency = typeof CURRENCIES[number]
