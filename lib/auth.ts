import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)
const COOKIE_NAME = 'agent-newss_session'

export type UserRole = 'admin' | 'guest'

export interface SessionPayload {
  user: string
  role: UserRole
}

export function getRole(session: Record<string, unknown> | null): UserRole | null {
  if (!session) return null
  return session.role === 'guest' ? 'guest' : 'admin'
}

export function isAdmin(session: Record<string, unknown> | null): boolean {
  return getRole(session) === 'admin'
}

export async function signToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' as const, status: 401 as const }
  if (!isAdmin(session)) return { error: 'Forbidden' as const, status: 403 as const }
  return { session }
}

export { COOKIE_NAME }
