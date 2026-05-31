import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { COOKIE_NAME } from '@/lib/auth'

const mockSignToken = vi.fn()

vi.mock('@/lib/auth', () => ({
  signToken: (...args: unknown[]) => mockSignToken(...args),
  COOKIE_NAME: 'agent-newss_session',
}))

const { POST, DELETE } = await import('./route')

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
    expect(body).toEqual({ ok: true })
    expect(mockSignToken).toHaveBeenCalledWith({ user: 'admin' })
    expect(cookie?.value).toBe('signed-token')
    expect(cookie?.httpOnly).toBe(true)
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
