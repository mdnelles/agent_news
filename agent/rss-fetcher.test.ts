import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockParseURL = vi.fn()

vi.mock('rss-parser', () => ({
  default: vi.fn().mockImplementation(() => ({
    parseURL: mockParseURL,
  })),
}))

const { fetchFeed, fetchAllFeeds } = await import('./rss-fetcher')

describe('fetchFeed', () => {
  beforeEach(() => {
    mockParseURL.mockReset()
  })

  it('maps RSS items into headlines', async () => {
    mockParseURL.mockResolvedValue({
      title: 'Tech News',
      items: [
        {
          title: '  First Story  ',
          link: 'https://example.com/1',
          pubDate: 'Mon, 01 Jan 2024 12:00:00 GMT',
        },
        {
          title: 'Second Story',
          guid: 'https://example.com/2',
          isoDate: '2024-01-02T08:00:00.000Z',
        },
      ],
    })

    const headlines = await fetchFeed('https://feeds.example.com/rss')

    expect(headlines).toEqual([
      {
        title: 'First Story',
        url: 'https://example.com/1',
        source: 'Tech News',
        publishedAt: new Date('Mon, 01 Jan 2024 12:00:00 GMT'),
      },
      {
        title: 'Second Story',
        url: 'https://example.com/2',
        source: 'Tech News',
        publishedAt: new Date('2024-01-02T08:00:00.000Z'),
      },
    ])
  })

  it('filters out items missing title or url', async () => {
    mockParseURL.mockResolvedValue({
      title: 'Example Feed',
      items: [
        { title: 'Has Link', link: 'https://example.com/ok' },
        { title: 'No URL' },
        { link: 'https://example.com/no-title' },
      ],
    })

    const headlines = await fetchFeed('https://feeds.example.com/rss')

    expect(headlines).toHaveLength(1)
    expect(headlines[0].title).toBe('Has Link')
  })

  it('returns an empty array when the feed fetch fails', async () => {
    mockParseURL.mockRejectedValue(new Error('Network error'))

    await expect(fetchFeed('https://feeds.example.com/bad')).resolves.toEqual([])
  })
})

describe('fetchAllFeeds', () => {
  beforeEach(() => {
    mockParseURL.mockReset()
  })

  it('aggregates headlines from multiple feeds', async () => {
    mockParseURL
      .mockResolvedValueOnce({
        title: 'Feed A',
        items: [{ title: 'A1', link: 'https://a.com/1' }],
      })
      .mockResolvedValueOnce({
        title: 'Feed B',
        items: [{ title: 'B1', link: 'https://b.com/1' }],
      })

    const headlines = await fetchAllFeeds([
      'https://feeds.a.com/rss',
      'https://feeds.b.com/rss',
    ])

    expect(headlines).toHaveLength(2)
    expect(headlines.map((h) => h.title)).toEqual(['A1', 'B1'])
  })

  it('continues when one feed fails', async () => {
    mockParseURL
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({
        title: 'Feed B',
        items: [{ title: 'B1', link: 'https://b.com/1' }],
      })

    const headlines = await fetchAllFeeds([
      'https://feeds.a.com/rss',
      'https://feeds.b.com/rss',
    ])

    expect(headlines).toHaveLength(1)
    expect(headlines[0].title).toBe('B1')
  })
})
