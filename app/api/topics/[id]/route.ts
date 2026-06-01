import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  await prisma.topic.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json()

  const topic = await prisma.topic.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.rssFeeds && { rssFeeds: JSON.stringify(body.rssFeeds) }),
      ...(body.sheetTabId !== undefined && { sheetTabId: String(body.sheetTabId) }),
    },
  })
  return NextResponse.json(topic)
}
