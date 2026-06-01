'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        setError('Invalid username or password')
      } else {
        router.push('/topics')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    setError('')
    setGuestLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest: true }),
      })
      if (!res.ok) {
        setError('Could not start guest session')
      } else {
        router.push('/browse')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">AgentNews</h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to continue</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-xl p-8 border border-gray-800 space-y-4"
        >
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || guestLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-900 px-2 text-gray-500">or</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading || guestLoading}
            className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 font-medium rounded-lg py-2 transition-colors border border-gray-700"
          >
            {guestLoading ? 'Continuing…' : 'Continue as guest'}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Guests can browse headlines but cannot add or manage topics.
          </p>
        </form>
      </div>
    </div>
  )
}
