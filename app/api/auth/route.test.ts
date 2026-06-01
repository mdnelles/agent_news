import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COOKIE_NAME } from '@/lib/auth'

const mockSignToken = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...actual,
    signToken: (...args: unknown[]) => mockSignToken(...args),
    getSession: () => mockGetSession(),
  }
})

const { GET, POST, DELETE } = await import('./route')

describe('GET /api/auth', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
  })

  it('returns session info for authenticated users', async () => {
    mockGetSession.mockResolvedValue({ user: 'guest', role: 'guest' })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ user: 'guest', role: 'guest' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET()
    expect(response.status).toBe(401)
  })
})

describe('POST /api/auth', () => {
  beforeEach(() => {
    mockSignToken.mockReset()
    mockSignToken.mockResolvedValue('signed-token')
  })

  it('returns 401 for invalid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'wrong', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Invalid credentials' })
  })

  it('sets a session cookie for valid credentials', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'secret' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()
    const cookie = response.cookies.get(COOKIE_NAME)

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true, role: 'admin' })
    expect(mockSignToken).toHaveBeenCalledWith({ user: 'admin', role: 'admin' })
    expect(cookie?.value).toBe('signed-token')
    expect(cookie?.httpOnly).toBe(true)
  })

  it('sets a guest session cookie', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth', {
      method: 'POST',
      body: JSON.stringify({ guest: true }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true, role: 'guest' })
    expect(mockSignToken).toHaveBeenCalledWith({ user: 'guest', role: 'guest' })
  })
})

describe('DELETE /api/auth', () => {
  it('clears the session cookie', async () => {
    const response = await DELETE()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(response.cookies.get(COOKIE_NAME)?.value).toBe('')
  })
})
