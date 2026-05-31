import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockVerifyToken = vi.fn()

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...actual,
    verifyToken: (...args: Parameters<typeof actual.verifyToken>) =>
      mockVerifyToken(...args),
  }
})

const { middleware } = await import('./middleware')

function makeRequest(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie: `agent-newss_session=${cookie}` } : {},
  })
}

describe('middleware', () => {
  beforeEach(() => {
    mockVerifyToken.mockReset()
  })

  it('allows public paths without a session', async () => {
    const loginResponse = await middleware(makeRequest('/login'))
    const authResponse = await middleware(makeRequest('/api/auth'))

    expect(loginResponse.status).toBe(200)
    expect(authResponse.status).toBe(200)
  })

  it('redirects to login when no session cookie is present', async () => {
    const response = await middleware(makeRequest('/topics'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('redirects to login when the token is invalid', async () => {
    mockVerifyToken.mockResolvedValue(null)

    const response = await middleware(makeRequest('/browse', 'bad-token'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
    expect(mockVerifyToken).toHaveBeenCalledWith('bad-token')
  })

  it('allows authenticated requests with a valid token', async () => {
    mockVerifyToken.mockResolvedValue({ user: 'admin' })

    const response = await middleware(makeRequest('/topics', 'valid-token'))

    expect(response.status).toBe(200)
    expect(mockVerifyToken).toHaveBeenCalledWith('valid-token')
  })
})
