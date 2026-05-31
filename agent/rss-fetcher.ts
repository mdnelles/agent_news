import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AgentNews/1.0 RSS Reader',
  },
})

export interface FetchedHeadline {
  title: string
  url: string
  source: string
  publishedAt: Date | null
}

export async function fetchFeed(feedUrl: string): Promise<FetchedHeadline[]> {
  try {
    const feed = await parser.parseURL(feedUrl)
    const source = feed.title || new URL(feedUrl).hostname

    return (feed.items || [])
      .filter((item) => item.title && (item.link || item.guid))
      .map((item) => ({
        title: (item.title || '').trim(),
        url: item.link || item.guid || '',
        source,
        publishedAt: item.pubDate ? new Date(item.pubDate) : item.isoDate ? new Date(item.isoDate) : null,
      }))
  } catch (err) {
    console.warn(`Failed to fetch feed ${feedUrl}:`, (err as Error).message)
    return []
  }
}

export async function fetchAllFeeds(feedUrls: string[]): Promise<FetchedHeadline[]> {
  const results = await Promise.allSettled(feedUrls.map(fetchFeed))
  return results
    .filter((r): r is PromiseFulfilledResult<FetchedHeadline[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
}
