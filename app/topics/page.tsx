'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { SheetLink } from '@/components/sheet-link'
import { ApiError, fetchJson } from '@/lib/fetch-json'

interface Topic {
  id: string
  name: string
  slug: string
  rssFeeds: string
  sheetTabId: string | null
  sheetUrl: string | null
  createdAt: string
  _count: { headlines: number }
}

export default function TopicsPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTopicName, setNewTopicName] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [fetching, setFetching] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadTopics = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchJson<Topic[]>('/api/topics')
      setTopics(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load topics')
      setTopics([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadTopics() }, [loadTopics])

  async function addTopic(e: React.FormEvent) {
    e.preventDefault()
    if (!newTopicName.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTopicName.trim() }),
    })
    if (res.ok) {
      setNewTopicName('')
      await loadTopics()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to add topic')
    }
    setAdding(false)
  }

  async function deleteTopic(id: string) {
    if (!confirm('Delete this topic and all its headlines?')) return
    await fetch(`/api/topics/${id}`, { method: 'DELETE' })
    await loadTopics()
  }

  async function fetchTopic(id: string) {
    setFetching(id)
    await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: id }),
    })
    setTimeout(() => {
      setFetching(null)
      loadTopics()
    }, 3000)
  }

  async function fetchAll() {
    setFetching('all')
    await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setTimeout(() => {
      setFetching(null)
      loadTopics()
    }, 5000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Topics</h1>
          <button
            onClick={fetchAll}
            disabled={fetching !== null}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {fetching === 'all' ? 'Fetching…' : 'Fetch All Now'}
          </button>
        </div>

        {/* Add topic */}
        <form onSubmit={addTopic} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="e.g. Tech News, Crypto, War in the Gulf"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={adding || !newTopicName.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {adding ? 'Adding…' : 'Add Topic'}
          </button>
        </form>

        {error && (
          <div className="mb-4 bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-500 text-center py-16">Loading…</div>
        ) : topics.length === 0 ? (
          <div className="text-gray-500 text-center py-16">
            No topics yet. Add your first topic above.
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => {
              const feeds = JSON.parse(topic.rssFeeds || '[]') as string[]
              return (
                <div
                  key={topic.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-semibold truncate">{topic.name}</h2>
                        <div className="flex flex-col items-start shrink-0">
                          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                            {topic._count.headlines} headlines
                          </span>
                          {topic.sheetUrl && (
                            <SheetLink url={topic.sheetUrl} className="mt-1 px-0.5" showLabel />
                          )}
                        </div>
                      </div>
                      {feeds.length > 0 ? (
                        <p className="text-xs text-gray-500 truncate">
                          {feeds.length} RSS feed{feeds.length !== 1 ? 's' : ''}: {feeds[0]}{feeds.length > 1 ? ` +${feeds.length - 1} more` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-600">
                          No feeds yet — will be auto-selected on first fetch
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => fetchTopic(topic.id)}
                        disabled={fetching !== null}
                        className="text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {fetching === topic.id ? 'Fetching…' : 'Fetch'}
                      </button>
                      <a
                        href={`/browse?topic=${topic.id}`}
                        className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Browse
                      </a>
                      <button
                        onClick={() => deleteTopic(topic.id)}
                        className="text-sm bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
