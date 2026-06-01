import { describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson } from './fetch-json'

describe('fetchJson', () => {
  it('parses a successful JSON response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: '1' }]),
      })
    )

    await expect(fetchJson<[{ id: string }]>('/api/topics')).resolves.toEqual([{ id: '1' }])
  })

  it('throws ApiError for empty successful responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      })
    )

    await expect(fetchJson('/api/topics')).rejects.toMatchObject({
      message: 'Empty response from server',
      status: 200,
    })
  })

  it('throws ApiError with server error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ error: 'Unauthorized' }),
      })
    )

    await expect(fetchJson('/api/topics')).rejects.toBeInstanceOf(ApiError)
  })
})
