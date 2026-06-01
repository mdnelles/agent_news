/**
 * AgentNews - RSS fetch agent
 *
 * Usage:
 *   npx tsx agent/index.ts                    # fetch all topics
 *   npx tsx agent/index.ts --topicId=<id>     # fetch a single topic
 *   npx tsx agent/index.ts --schedule         # run on cron (twice daily)
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import cron from 'node-cron'
import { selectFeedsForTopic } from './claude-feeds'
import { fetchAllFeeds } from './rss-fetcher'
import { ensureTopicSheet, syncTopicSheet } from '../lib/google-sheets'

const prisma = new PrismaClient()

const MAX_HEADLINES = 200

// Twice daily at 08:00 and 20:00 (server local time). Override with AGENT_FETCH_CRON.
const FETCH_CRON = process.env.AGENT_FETCH_CRON ?? '0 8,20 * * *'

async function processTopic(topicId: string) {
  const topic = await prisma.topic.findUnique({ where: { id: topicId } })
  if (!topic) {
    console.log(`Topic ${topicId} not found`)
    return
  }

  console.log(`\n📰 Processing: ${topic.name}`)

  // 1. Select RSS feeds if none exist
  let feeds: string[] = JSON.parse(topic.rssFeeds || '[]')
  if (feeds.length === 0) {
    console.log(`  🤖 Asking Claude to select feeds for "${topic.name}"…`)
    feeds = await selectFeedsForTopic(topic.name)
    console.log(`  ✓ Selected ${feeds.length} feeds:`, feeds)

    await prisma.topic.update({
      where: { id: topicId },
      data: { rssFeeds: JSON.stringify(feeds) },
    })
  }

  if (feeds.length === 0) {
    console.log(`  ⚠️  No feeds available, skipping`)
    return
  }

  // 2. Fetch headlines from all feeds
  console.log(`  📡 Fetching from ${feeds.length} feeds…`)
  const fetched = await fetchAllFeeds(feeds)
  console.log(`  ✓ Fetched ${fetched.length} headlines`)

  // 3. Upsert new headlines (ignore duplicates)
  let newCount = 0
  for (const h of fetched) {
    if (!h.url || !h.title) continue
    try {
      await prisma.headline.upsert({
        where: { topicId_url: { topicId, url: h.url } },
        create: {
          topicId,
          title: h.title,
          url: h.url,
          source: h.source,
          publishedAt: h.publishedAt,
        },
        update: {}, // Don't overwrite existing
      })
      newCount++
    } catch {
      // skip
    }
  }
  console.log(`  ✓ ${newCount} new headlines saved`)

  // 4. Trim to MAX_HEADLINES — delete oldest beyond limit
  const count = await prisma.headline.count({ where: { topicId } })
  if (count > MAX_HEADLINES) {
    const toDelete = await prisma.headline.findMany({
      where: { topicId },
      orderBy: { fetchedAt: 'desc' },
      skip: MAX_HEADLINES,
      select: { id: true },
    })
    await prisma.headline.deleteMany({
      where: { id: { in: toDelete.map((h) => h.id) } },
    })
    console.log(`  🗑️  Trimmed ${toDelete.length} old headlines`)
  }

  // 5. Sync to Google Sheets (if configured)
  if (process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      console.log(`  📊 Syncing to Google Sheets…`)
      const sheetId = await ensureTopicSheet(topic.name)

      await prisma.topic.update({
        where: { id: topicId },
        data: { sheetTabId: String(sheetId) },
      })

      const all = await prisma.headline.findMany({
        where: { topicId },
        orderBy: { fetchedAt: 'desc' },
        take: MAX_HEADLINES,
      })

      await syncTopicSheet(
        topic.name,
        all.map((h) => ({
          title: h.title,
          url: h.url,
          source: h.source,
          publishedAt: h.publishedAt ? h.publishedAt.toISOString().split('T')[0] : '',
          fetchedAt: h.fetchedAt.toISOString().replace('T', ' ').split('.')[0],
        }))
      )
      console.log(`  ✓ Google Sheets synced`)
    } catch (err) {
      console.warn(`  ⚠️  Sheets sync failed:`, (err as Error).message)
    }
  }
}

async function processAll() {
  console.log(`\n🚀 AgentNews fetch started at ${new Date().toISOString()}`)
  const topics = await prisma.topic.findMany()
  console.log(`Found ${topics.length} topic(s)`)

  for (const topic of topics) {
    await processTopic(topic.id)
  }

  console.log(`\n✅ Done at ${new Date().toISOString()}`)
}

async function main() {
  const args = process.argv.slice(2)
  const topicIdArg = args.find((a) => a.startsWith('--topicId='))?.split('=')[1]
  const scheduleMode = args.includes('--schedule')

  if (scheduleMode) {
    console.log(`⏰ Running in schedule mode — cron: ${FETCH_CRON}`)
    // Run immediately on start
    await (topicIdArg ? processTopic(topicIdArg) : processAll())
    cron.schedule(FETCH_CRON, () => {
      topicIdArg ? processTopic(topicIdArg) : processAll()
    })
  } else {
    await (topicIdArg ? processTopic(topicIdArg) : processAll())
    await prisma.$disconnect()
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
