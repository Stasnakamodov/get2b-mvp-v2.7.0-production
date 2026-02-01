import { supabase } from '@/lib/supabaseClient'

/**
 * Роли пользователей в системе
 */
export type UserRole = 'admin' | 'manager' | 'user' | 'guest'

/**
 * Результат проверки роли
 */
export interface RoleCheckResult {
  success: boolean
  user: {
    id: string
    email: string
    role: UserRole
  } | null
  error?: string
}

/**
 * Проверяет, авторизован ли пользователь и имеет ли он нужную роль
 *
 * @param allowedRoles - массив разрешённых ролей
 * @returns результат проверки с данными пользователя
 *
 * @example
 * const check = await checkUserRole(['admin', 'manager'])
 * if (!check.success) {
 *   return NextResponse.json({ error: check.error }, { status: 403 })
 * }
 */
export async function checkUserRole(allowedRoles: UserRole[]): Promise<RoleCheckResult> {
  try {
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        user: null,
        error: 'Unauthorized: User not authenticated'
      }
    }

    // Получаем роль пользователя из профиля
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        user: null,
        error: 'User profile not found'
      }
    }

    const userRole = (profile.role as UserRole) || 'user'

    // Проверяем, входит ли роль пользователя в список разрешённых
    if (!allowedRoles.includes(userRole)) {
      return {
        success: false,
        user: {
          id: user.id,
          email: user.email || '',
          role: userRole
        },
        error: `Forbidden: Role '${userRole}' is not allowed. Required: ${allowedRoles.join(', ')}`
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: userRole
      }
    }
  } catch (error) {
    console.error('[checkUserRole] Error:', error)
    return {
      success: false,
      user: null,
      error: 'Internal error during role verification'
    }
  }
}

/**
 * Проверяет, является ли пользователь администратором
 */
export async function isAdmin(): Promise<boolean> {
  const result = await checkUserRole(['admin'])
  return result.success
}

/**
 * Проверяет, является ли пользователь менеджером или администратором
 */
export async function isManagerOrAdmin(): Promise<boolean> {
  const result = await checkUserRole(['admin', 'manager'])
  return result.success
}
