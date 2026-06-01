// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { signToken, verifyToken, getRole, isAdmin } from './auth'

describe('auth', () => {
  it('signs and verifies a valid token', async () => {
    const token = await signToken({ user: 'admin', role: 'admin' })
    const payload = await verifyToken(token)

    expect(payload).toMatchObject({ user: 'admin', role: 'admin' })
  })

  it('returns null for an invalid token', async () => {
    expect(await verifyToken('not-a-valid-token')).toBeNull()
  })

  it('returns null for a tampered token', async () => {
    const token = await signToken({ user: 'admin', role: 'admin' })
    const tampered = token.slice(0, -4) + 'xxxx'

    expect(await verifyToken(tampered)).toBeNull()
  })
})

describe('getRole', () => {
  it('returns guest when role is guest', () => {
    expect(getRole({ user: 'guest', role: 'guest' })).toBe('guest')
    expect(isAdmin({ user: 'guest', role: 'guest' })).toBe(false)
  })

  it('returns admin for admin role or legacy sessions', () => {
    expect(getRole({ user: 'admin', role: 'admin' })).toBe('admin')
    expect(getRole({ user: 'admin' })).toBe('admin')
    expect(isAdmin({ user: 'admin', role: 'admin' })).toBe(true)
  })
})
