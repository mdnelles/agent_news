import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

const { selectFeedsForTopic } = await import('./claude-feeds')

describe('selectFeedsForTopic', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('parses a JSON array of feed URLs from Claude response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'Here are the feeds:\n["https://feeds.example.com/rss", "https://news.example.com/feed.xml"]',
        },
      ],
    })

    const feeds = await selectFeedsForTopic('Artificial Intelligence')

    expect(feeds).toEqual([
      'https://feeds.example.com/rss',
      'https://news.example.com/feed.xml',
    ])
    expect(mockCreate).toHaveBeenCalledOnce()
  })

  it('filters out non-http entries', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '["https://valid.com/rss", "ftp://invalid.com", 42, "not-a-url"]',
        },
      ],
    })

    const feeds = await selectFeedsForTopic('Climate')

    expect(feeds).toEqual(['https://valid.com/rss'])
  })

  it('returns an empty array when no JSON array is found', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Sorry, I cannot find feeds.' }],
    })

    await expect(selectFeedsForTopic('Obscure Topic')).resolves.toEqual([])
  })

  it('returns an empty array when JSON is malformed', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[https://broken' }],
    })

    await expect(selectFeedsForTopic('Broken')).resolves.toEqual([])
  })
})
