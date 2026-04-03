import { type NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

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
 * Проверяет, авторизован ли пользователь и имеет ли он нужную роль.
 * Извлекает JWT из Authorization header или cookie auth-token.
 *
 * @param request - NextRequest из API route
 * @param allowedRoles - массив разрешённых ролей
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const check = await checkUserRole(request, ['admin', 'manager'])
 *   if (!check.success) {
 *     return NextResponse.json({ error: check.error }, { status: 403 })
 *   }
 * }
 */
export async function checkUserRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<RoleCheckResult> {
  try {
    // Извлекаем токен из Authorization header или cookie
    const authHeader = request.headers.get('authorization')
    let token: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = request.cookies.get('auth-token')?.value || null
    }

    if (!token) {
      return {
        success: false,
        user: null,
        error: 'Unauthorized: No token provided',
      }
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return {
        success: false,
        user: null,
        error: 'Unauthorized: Invalid token',
      }
    }

    const userRole = (payload.role as UserRole) || 'user'

    if (!allowedRoles.includes(userRole)) {
      return {
        success: false,
        user: {
          id: payload.sub as string,
          email: payload.email as string,
          role: userRole,
        },
        error: `Forbidden: Role '${userRole}' is not allowed. Required: ${allowedRoles.join(', ')}`,
      }
    }

    return {
      success: true,
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        role: userRole,
      },
    }
  } catch (error) {
    console.error('[checkUserRole] Error:', error)
    return {
      success: false,
      user: null,
      error: 'Internal error during role verification',
    }
  }
}

/**
 * Проверяет, является ли пользователь администратором
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const result = await checkUserRole(request, ['admin'])
  return result.success
}

/**
 * Проверяет, является ли пользователь менеджером или администратором
 */
export async function isManagerOrAdmin(request: NextRequest): Promise<boolean> {
  const result = await checkUserRole(request, ['admin', 'manager'])
  return result.success
}
