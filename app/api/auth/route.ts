import { NextRequest, NextResponse } from 'next/server'
import { signToken, getSession, COOKIE_NAME } from '@/lib/auth'

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    user: session.user,
    role: session.role === 'guest' ? 'guest' : 'admin',
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (body.guest === true) {
    const token = await signToken({ user: 'guest', role: 'guest' })
    const response = NextResponse.json({ ok: true, role: 'guest' })
    setSessionCookie(response, token)
    return response
  }

  const { username, password } = body

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken({ user: username, role: 'admin' })
  const response = NextResponse.json({ ok: true, role: 'admin' })
  setSessionCookie(response, token)
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}
