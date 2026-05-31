import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Use Claude to select the best RSS feeds for a given topic.
 * Returns an array of RSS feed URLs.
 */
export async function selectFeedsForTopic(topicName: string): Promise<string[]> {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a news aggregation expert. For the topic "${topicName}", provide the 5 best publicly available RSS feed URLs that would give high-quality, frequently updated news coverage.

Rules:
- Only return working, publicly accessible RSS feeds (no paywalls, no auth required)
- Prefer established news sources with high signal-to-noise ratio
- Return ONLY a JSON array of URL strings, nothing else

Example output format:
["https://feeds.example.com/rss", "https://another.com/feed.xml"]

Topic: ${topicName}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'

  try {
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    const feeds = JSON.parse(match[0]) as string[]
    return feeds.filter((f) => typeof f === 'string' && f.startsWith('http'))
  } catch {
    console.error('Failed to parse Claude feed response:', text)
    return []
  }
}
