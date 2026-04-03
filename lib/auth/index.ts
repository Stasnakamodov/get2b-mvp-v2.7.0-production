/**
 * Custom auth module replacing Supabase Auth.
 *
 * - signUp / signIn: create user, return JWT
 * - verifyToken: validate JWT, return payload
 * - getUser: extract user from request headers
 * - hashPassword / comparePassword: bcrypt wrappers
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool'

// ── Config ───────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const key = process.env.JWT_SECRET
  if (!key && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Application cannot start securely.')
  }
  return new TextEncoder().encode(key || 'dev-secret-change-me')
}
const JWT_ISSUER = 'get2b'
const JWT_EXPIRY = '7d'
const BCRYPT_ROUNDS = 10

// ── Types ────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name?: string
  role?: string
}

export interface TokenPayload extends JWTPayload {
  sub: string
  email: string
  name?: string
  role?: string
}

// ── JWT ──────────────────────────────────────────────────────────

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role || 'user',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setSubject(user.id)
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: JWT_ISSUER,
    })
    return payload as TokenPayload
  } catch {
    return null
  }
}

// ── Password ─────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ── Sign Up ──────────────────────────────────────────────────────

export async function signUp(params: {
  email: string
  password: string
  name?: string
}): Promise<{ user: AuthUser | null; token: string | null; error: string | null }> {
  const { email, password, name } = params

  try {
    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    if (existing.rows.length > 0) {
      return { user: null, token: null, error: 'User already exists' }
    }

    const passwordHash = await hashPassword(password)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING id, email, name, role`,
      [email.toLowerCase(), passwordHash, name || null]
    )

    const user: AuthUser = result.rows[0]
    const token = await signToken(user)

    return { user, token, error: null }
  } catch (e: any) {
    return { user: null, token: null, error: e.message }
  }
}

// ── Sign In ──────────────────────────────────────────────────────

export async function signIn(params: {
  email: string
  password: string
}): Promise<{ user: AuthUser | null; token: string | null; error: string | null }> {
  const { email, password } = params

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return { user: null, token: null, error: 'Invalid email or password' }
    }

    const row = result.rows[0]
    const valid = await comparePassword(password, row.password_hash)
    if (!valid) {
      return { user: null, token: null, error: 'Invalid email or password' }
    }

    const user: AuthUser = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    }
    const token = await signToken(user)

    return { user, token, error: null }
  } catch (e: any) {
    return { user: null, token: null, error: e.message }
  }
}

// ── Get User from Request ────────────────────────────────────────

export async function getUserFromRequest(
  request: Request
): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)
  if (!payload) return null

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  }
}
