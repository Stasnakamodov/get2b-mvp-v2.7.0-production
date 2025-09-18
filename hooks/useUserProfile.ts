import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface UserProfile {
  id: string
  user_id: string
  profile_type: 'client' | 'supplier'
  profile_id: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

interface ClientProfile {
  id: string
  user_id: string
  name: string
  legal_name: string
  inn: string
  kpp: string
  ogrn: string
  legal_address: string
  email: string
  phone: string
  website?: string
  // Банковские реквизиты
  bank_name?: string
  bank_account?: string
  corr_account?: string
  bik?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

interface SupplierProfile {
  id: string
  user_id: string
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description?: string
  contact_email: string
  contact_phone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useUserProfile() {
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null)
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Проверяем, есть ли у пользователя профили
  const hasProfile = userProfiles.length > 0
  const hasClientProfile = userProfiles.some(p => p.profile_type === 'client')
  const hasSupplierProfile = userProfiles.some(p => p.profile_type === 'supplier')

  // Загружаем профили пользователя
  const loadUserProfiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Загружаем записи user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)

      if (profilesError) throw profilesError

      setUserProfiles(profiles || [])

      // Загружаем детали профилей
      if (profiles && profiles.length > 0) {
        const clientProfileData = profiles.find(p => p.profile_type === 'client')
        const supplierProfileData = profiles.find(p => p.profile_type === 'supplier')

        if (clientProfileData) {
          const { data: clientData, error: clientError } = await supabase
            .from('client_profiles')
            .select('*')
            .eq('id', clientProfileData.profile_id)
            .single()

          if (clientError) throw clientError
          setClientProfile(clientData)
        }

        if (supplierProfileData) {
          const { data: supplierData, error: supplierError } = await supabase
            .from('supplier_profiles')
            .select('*')
            .eq('id', supplierProfileData.profile_id)
            .single()

          if (supplierError) throw supplierError
          setSupplierProfile(supplierData)
        }
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading user profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  // Создаем профиль клиента
  const createClientProfile = async (profileData: {
    name: string
    company_name: string
    inn: string
    kpp: string
    ogrn: string
    address: string
    email: string
    phone: string
    description?: string
    bank_name: string
    bank_account: string
    bank_corr_account: string
    bank_bik: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Пользователь не найден')

      // Создаем профиль клиента
      const { data: clientData, error: clientError } = await supabase
        .from('client_profiles')
        .insert([{
          user_id: user.id,
          name: profileData.name,
          legal_name: profileData.company_name,
          inn: profileData.inn,
          kpp: profileData.kpp,
          ogrn: profileData.ogrn,
          legal_address: profileData.address,
          email: profileData.email,
          phone: profileData.phone,
          bank_name: profileData.bank_name,
          bank_account: profileData.bank_account,
          corr_account: profileData.bank_corr_account,
          bik: profileData.bank_bik,
          is_default: true
        }])
        .select()
        .single()

      if (clientError) throw clientError

      // Создаем запись в user_profiles
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: user.id,
          profile_type: 'client',
          profile_id: clientData.id,
          is_primary: true
        }])

      if (userProfileError) throw userProfileError

      // Обновляем состояние
      setClientProfile(clientData)
      await loadUserProfiles()

      return clientData
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Создаем профиль поставщика
  const createSupplierProfile = async (profileData: Omit<SupplierProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Пользователь не найден')

      // Создаем профиль поставщика
      const { data: supplierData, error: supplierError } = await supabase
        .from('supplier_profiles')
        .insert([{
          ...profileData,
          user_id: user.id,
          is_active: true
        }])
        .select()
        .single()

      if (supplierError) throw supplierError

      // Создаем запись в user_profiles
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: user.id,
          profile_type: 'supplier',
          profile_id: supplierData.id,
          is_primary: true
        }])

      if (userProfileError) throw userProfileError

      // Обновляем состояние
      setSupplierProfile(supplierData)
      await loadUserProfiles()

      return supplierData
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Загружаем профили при монтировании
  useEffect(() => {
    loadUserProfiles()
  }, [])

  return {
    userProfiles,
    clientProfile,
    supplierProfile,
    loading,
    error,
    hasProfile,
    hasClientProfile,
    hasSupplierProfile,
    loadUserProfiles,
    createClientProfile,
    createSupplierProfile
  }
} 