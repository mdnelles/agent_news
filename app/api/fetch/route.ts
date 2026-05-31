import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { exec } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topicId } = await request.json().catch(() => ({}))

  const agentPath = path.join(process.cwd(), 'agent', 'index.ts')
  const args = topicId ? `--topicId=${topicId}` : ''
  const command = `npx tsx ${agentPath} ${args}`

  exec(command, { env: process.env }, (error, stdout, stderr) => {
    if (error) console.error('Agent error:', stderr)
    else console.log('Agent output:', stdout)
  })

  return NextResponse.json({ ok: true, message: 'Fetch started in background' })
}
