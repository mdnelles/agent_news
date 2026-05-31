import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSession = vi.fn()
const mockFindMany = vi.fn()
const mockCount = vi.fn()

vi.mock('@/lib/auth', () => ({
  getSession: () => mockGetSession(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    headline: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}))

const { GET } = await import('./route')

describe('GET /api/headlines', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockFindMany.mockReset()
    mockCount.mockReset()
    mockGetSession.mockResolvedValue({ user: 'admin' })
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/headlines?topicId=abc')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('returns 400 when topicId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/headlines')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'topicId required' })
  })

  it('returns paginated headlines for a topic', async () => {
    mockFindMany.mockResolvedValue([{ id: 'h1', title: 'Story' }])
    mockCount.mockResolvedValue(1)

    const request = new NextRequest(
      'http://localhost:3000/api/headlines?topicId=topic-1&search=Story&page=2'
    )
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      headlines: [{ id: 'h1', title: 'Story' }],
      total: 1,
      page: 2,
      limit: 50,
    })
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { topicId: 'topic-1', title: { contains: 'Story' } },
      orderBy: { fetchedAt: 'desc' },
      skip: 50,
      take: 50,
    })
  })
})
