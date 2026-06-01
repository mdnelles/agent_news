'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { SheetLink } from '@/components/sheet-link'
import { ApiError, fetchJson } from '@/lib/fetch-json'

interface Topic {
  id: string
  name: string
  sheetUrl: string | null
  _count: { headlines: number }
}

interface Headline {
  id: string
  title: string
  url: string
  source: string
  publishedAt: string | null
  fetchedAt: string
}

function BrowseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [headlines, setHeadlines] = useState<Headline[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTopicId, setActiveTopicId] = useState<string>('')

  useEffect(() => {
    setTopicsLoading(true)
    setLoadError('')
    fetchJson<Topic[]>('/api/topics')
      .then((data) => {
        setTopics(data)
        const fromUrl = searchParams.get('topic')
        const initial = fromUrl || data[0]?.id || ''
        setActiveTopicId(initial)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login')
          return
        }
        setLoadError(err instanceof Error ? err.message : 'Failed to load topics')
        setTopics([])
      })
      .finally(() => setTopicsLoading(false))
  }, [searchParams, router])

  const loadHeadlines = useCallback(async () => {
    if (!activeTopicId) return
    setLoading(true)
    setLoadError('')
    const params = new URLSearchParams({
      topicId: activeTopicId,
      page: String(page),
      ...(search && { search }),
    })
    try {
      const data = await fetchJson<{
        headlines: Headline[]
        total: number
      }>(`/api/headlines?${params}`)
      setHeadlines(data.headlines || [])
      setTotal(data.total || 0)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
        return
      }
      setLoadError(err instanceof Error ? err.message : 'Failed to load headlines')
      setHeadlines([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [activeTopicId, page, search, router])

  useEffect(() => { loadHeadlines() }, [loadHeadlines])

  function switchTopic(id: string) {
    setActiveTopicId(id)
    setPage(1)
    setSearch('')
    router.push(`/browse?topic=${id}`, { scroll: false })
  }

  const totalPages = Math.ceil(total / 50)

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function timeAgo(dateStr: string) {
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diff = Math.floor((now - then) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Sidebar - Topics */}
        <aside className="w-56 shrink-0 border-r border-gray-800 py-4 px-3 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Topics</p>
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => switchTopic(topic.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                activeTopicId === topic.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="font-medium truncate">{topic.name}</div>
              <div className={`text-xs mt-0.5 ${activeTopicId === topic.id ? 'text-blue-200' : 'text-gray-600'}`}>
                {topic._count.headlines} headlines
              </div>
              {topic.sheetUrl && (
                <span className="mt-1 block" onClick={(e) => e.stopPropagation()}>
                  <SheetLink
                    url={topic.sheetUrl}
                    className={activeTopicId === topic.id ? 'text-green-300 hover:text-green-200' : ''}
                    showLabel
                  />
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {loadError && (
            <div className="mx-6 mt-4 bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-3">
              {loadError}
            </div>
          )}
          {/* Search bar */}
          <div className="border-b border-gray-800 px-6 py-3">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search headlines…"
              className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            {total > 0 && (
              <span className="ml-3 text-xs text-gray-500">
                {total} headline{total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Headlines */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {topicsLoading || loading ? (
              <div className="text-gray-500 text-center py-16">Loading…</div>
            ) : headlines.length === 0 ? (
              <div className="text-gray-500 text-center py-16">
                {search ? 'No headlines match your search.' : 'No headlines yet for this topic. Try fetching.'}
              </div>
            ) : (
              <div className="space-y-px">
                {headlines.map((h) => (
                  <a
                    key={h.id}
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 py-3 px-3 -mx-3 rounded-lg hover:bg-gray-900 group transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 group-hover:text-white leading-snug">
                        {h.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-blue-400 font-medium">{h.source}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500">{formatDate(h.publishedAt)}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-600">fetched {timeAgo(h.fetchedAt)}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-800 px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading…</div>}>
      <BrowseContent />
    </Suspense>
  )
}
