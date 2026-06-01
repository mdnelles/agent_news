import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, requireAdmin } from '@/lib/auth'
import { getSheetTabUrl } from '@/lib/sheet-url'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const topics = await prisma.topic.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { headlines: true } } },
    })

    return NextResponse.json(
      topics.map((topic) => ({
        ...topic,
        sheetUrl: getSheetTabUrl(topic.sheetTabId),
      }))
    )
  } catch (err) {
    console.error('GET /api/topics failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { name } = await request.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')

  try {
    const topic = await prisma.topic.create({
      data: {
        name: name.trim(),
        slug,
        rssFeeds: '[]', // Agent will populate on first run
      },
    })
    return NextResponse.json(topic, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Topic already exists' }, { status: 409 })
  }
}
