'use client'

import { useEffect, useState } from 'react'

export interface ClientSession {
  user: string
  role: 'admin' | 'guest'
}

export function useSession() {
  const [session, setSession] = useState<ClientSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSession(data))
      .finally(() => setLoading(false))
  }, [])

  return {
    session,
    loading,
    isAdmin: session?.role === 'admin',
    isGuest: session?.role === 'guest',
  }
}
