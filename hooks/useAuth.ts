'use client'

import { useState, useEffect, useCallback } from 'react'

interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
}

const TOKEN_KEY = 'auth-token'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()

      if (res.ok && json.data?.user) {
        setUser(json.data.user)
      } else {
        setUser(null)
        localStorage.removeItem(TOKEN_KEY)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.event === 'SIGNED_IN' && detail?.session?.user) {
        setUser(detail.session.user)
      } else if (detail?.event === 'SIGNED_OUT') {
        setUser(null)
      } else {
        fetchUser()
      }
    }

    window.addEventListener('auth-state-changed', handler)
    return () => window.removeEventListener('auth-state-changed', handler)
  }, [fetchUser])

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()

    if (!res.ok || json.error) {
      throw new Error(json.error || 'Login failed')
    }

    const token = json.data.session.access_token
    localStorage.setItem(TOKEN_KEY, token)
    setUser(json.data.user)
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { event: 'SIGNED_IN', session: { access_token: token, user: json.data.user } },
    }))

    return json.data.user
  }, [])

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const json = await res.json()

    if (!res.ok || json.error) {
      throw new Error(json.error || 'Registration failed')
    }

    const token = json.data.session.access_token
    localStorage.setItem(TOKEN_KEY, token)
    setUser(json.data.user)
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { event: 'SIGNED_IN', session: { access_token: token, user: json.data.user } },
    }))

    return json.data.user
  }, [])

  const signOut = useCallback(async () => {
    localStorage.removeItem(TOKEN_KEY)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { event: 'SIGNED_OUT', session: null },
    }))
  }, [])

  const isAdmin = user?.role === 'admin'

  return { user, loading, signIn, signUp, signOut, isAdmin }
}
