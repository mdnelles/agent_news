import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const topicId = searchParams.get('topicId')
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 50

  if (!topicId) {
    return NextResponse.json({ error: 'topicId required' }, { status: 400 })
  }

  const where = {
    topicId,
    ...(search && {
      title: { contains: search },
    }),
  }

  const [headlines, total] = await Promise.all([
    prisma.headline.findMany({
      where,
      orderBy: { fetchedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.headline.count({ where }),
  ])

  return NextResponse.json({ headlines, total, page, limit })
}
