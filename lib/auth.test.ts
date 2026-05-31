// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { signToken, verifyToken } from './auth'

describe('auth', () => {
  it('signs and verifies a valid token', async () => {
    const token = await signToken({ user: 'admin' })
    const payload = await verifyToken(token)

    expect(payload).toMatchObject({ user: 'admin' })
  })

  it('returns null for an invalid token', async () => {
    expect(await verifyToken('not-a-valid-token')).toBeNull()
  })

  it('returns null for a tampered token', async () => {
    const token = await signToken({ user: 'admin' })
    const tampered = token.slice(0, -4) + 'xxxx'

    expect(await verifyToken(tampered)).toBeNull()
  })
})
