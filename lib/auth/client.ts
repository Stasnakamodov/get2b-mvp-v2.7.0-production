'use client'

/**
 * Client-side auth module.
 * Replaces db.auth.signInWithPassword, signUp, getUser, getSession, signOut.
 */

interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthSession {
  access_token: string
  user: AuthUser
}

const TOKEN_KEY = 'auth-token'

// ── Token storage ────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

function clearStoredToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// ── Auth methods (Supabase-compatible shape) ─────────────────────

export const authClient = {
  async signInWithPassword(params: { email: string; password: string }) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        return {
          data: { user: null, session: null },
          error: { message: json.error || 'Login failed' },
        }
      }

      const token = json.data.session.access_token
      setStoredToken(token)

      const session = { access_token: token, user: json.data.user }

      // Notify listeners about sign in
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { event: 'SIGNED_IN', session }
        }))
      }

      return {
        data: {
          user: json.data.user,
          session: { access_token: token },
        },
        error: null,
      }
    } catch (e: any) {
      return {
        data: { user: null, session: null },
        error: { message: e.message },
      }
    }
  },

  async signUp(params: {
    email: string
    password: string
    options?: { data?: { name?: string } }
  }) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          name: params.options?.data?.name,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        return {
          data: { user: null, session: null },
          error: { message: json.error || 'Registration failed' },
        }
      }

      const token = json.data.session.access_token
      setStoredToken(token)

      const session = { access_token: token, user: json.data.user }

      // Notify listeners about sign up
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { event: 'SIGNED_IN', session }
        }))
      }

      return {
        data: {
          user: json.data.user,
          session: { access_token: token },
        },
        error: null,
      }
    } catch (e: any) {
      return {
        data: { user: null, session: null },
        error: { message: e.message },
      }
    }
  },

  async getUser(token?: string) {
    const t = token || getStoredToken()
    if (!t) {
      return {
        data: { user: null },
        error: { message: 'Not authenticated' },
      }
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        return {
          data: { user: null },
          error: json.error || { message: 'Not authenticated' },
        }
      }

      return { data: { user: json.data.user }, error: null }
    } catch (e: any) {
      return {
        data: { user: null },
        error: { message: e.message },
      }
    }
  },

  async getSession() {
    const token = getStoredToken()
    if (!token) {
      return { data: { session: null }, error: null }
    }

    const { data, error } = await this.getUser(token)
    if (error || !data.user) {
      return { data: { session: null }, error }
    }

    return {
      data: {
        session: {
          access_token: token,
          user: data.user,
        },
      },
      error: null,
    }
  },

  async signOut() {
    clearStoredToken()
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})

    // Notify listeners about sign out
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { event: 'SIGNED_OUT', session: null }
      }))
    }

    return { error: null }
  },

  /**
   * Returns the stored token for use in Authorization headers.
   */
  getToken(): string | null {
    return getStoredToken()
  },

  /**
   * Listen for auth state changes (sign in, sign out).
   * Uses CustomEvent dispatched by signInWithPassword, signUp, and signOut.
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (typeof window === 'undefined') {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }
    }

    const handler = (e: Event) => {
      const { event, session } = (e as CustomEvent).detail
      callback(event, session)
    }
    window.addEventListener('auth-state-changed', handler)

    return {
      data: {
        subscription: {
          unsubscribe: () => window.removeEventListener('auth-state-changed', handler),
        },
      },
    }
  },
}
