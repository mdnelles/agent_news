import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSession = vi.fn()
const mockFindMany = vi.fn()
const mockCreate = vi.fn()

vi.mock('@/lib/auth', () => ({
  getSession: () => mockGetSession(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    topic: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))

const { GET, POST } = await import('./route')

describe('GET /api/topics', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockFindMany.mockReset()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('returns topics for authenticated users', async () => {
    mockGetSession.mockResolvedValue({ user: 'admin' })
    mockFindMany.mockResolvedValue([
      { id: '1', name: 'AI', slug: 'ai', sheetTabId: '123', _count: { headlines: 3 } },
    ])

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].sheetUrl).toBeNull()
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { headlines: true } } },
    })
  })
})

describe('POST /api/topics', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockCreate.mockReset()
    mockGetSession.mockResolvedValue({ user: 'admin' })
  })

  it('returns 400 when name is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/topics', {
      method: 'POST',
      body: JSON.stringify({ name: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Name is required' })
  })

  it('creates a topic with a slugified name', async () => {
    mockCreate.mockResolvedValue({
      id: 'topic-1',
      name: 'Artificial Intelligence',
      slug: 'artificial-intelligence',
      rssFeeds: '[]',
    })

    const request = new NextRequest('http://localhost:3000/api/topics', {
      method: 'POST',
      body: JSON.stringify({ name: '  Artificial Intelligence  ' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.slug).toBe('artificial-intelligence')
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        name: 'Artificial Intelligence',
        slug: 'artificial-intelligence',
        rssFeeds: '[]',
      },
    })
  })

  it('returns 409 when the topic already exists', async () => {
    mockCreate.mockRejectedValue(new Error('Unique constraint'))

    const request = new NextRequest('http://localhost:3000/api/topics', {
      method: 'POST',
      body: JSON.stringify({ name: 'AI' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({ error: 'Topic already exists' })
  })
})
