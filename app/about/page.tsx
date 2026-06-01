import { Nav } from '@/components/nav'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">About AgentNews</h1>
        <p className="text-gray-400 mb-4">
          An AI-powered news aggregator that uses autonomous agents to find, fetch, and organize
          headlines by topic.
        </p>
        <p className="mb-10">
          <span className="text-gray-500 text-sm">Running at </span>
          <a
            href="https://agent-news.mikenelles.com/t"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            agent-news.mikenelles.com
          </a>
        </p>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">1</span>
              <span>
                An <strong className="text-white">admin</strong> adds a topic (e.g. &ldquo;Tech News&rdquo;, &ldquo;Crypto&rdquo;).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">2</span>
              <span>
                A <strong className="text-white">Claude agent</strong> picks the best public RSS feeds for that topic.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">3</span>
              <span>
                A <strong className="text-white">fetch agent</strong> runs twice daily, pulls headlines, deduplicates them, and keeps the latest 200.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">4</span>
              <span>
                Headlines are stored in the dashboard and synced to <strong className="text-white">Google Sheets</strong> (one tab per topic).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">5</span>
              <span>
                You <strong className="text-white">browse and search</strong> headlines — guests can read; admins can manage topics.
              </span>
            </li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Agent architecture</h2>
          <p className="text-gray-400 text-sm mb-6">
            AgentNews uses two specialized agents that run in the background on the server.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-x-auto">
            <svg
              viewBox="0 0 720 420"
              className="w-full min-w-[320px] h-auto"
              aria-label="AgentNews agent architecture diagram"
              role="img"
            >
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6 Z" fill="#6b7280" />
                </marker>
              </defs>

              {/* Admin */}
              <rect x="280" y="16" width="160" height="44" rx="8" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="360" y="44" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="600" fontFamily="system-ui,sans-serif">Admin adds topic</text>

              {/* Claude agent */}
              <rect x="40" y="110" width="200" height="72" rx="8" fill="#1a2e1a" stroke="#22c55e" strokeWidth="1.5" />
              <text x="140" y="138" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="600" fontFamily="system-ui,sans-serif">Claude Agent</text>
              <text x="140" y="158" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui,sans-serif">Selects RSS feeds</text>
              <text x="140" y="174" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui,sans-serif">for each topic</text>

              {/* Fetch agent */}
              <rect x="480" y="110" width="200" height="72" rx="8" fill="#2e1a2e" stroke="#a855f7" strokeWidth="1.5" />
              <text x="580" y="138" textAnchor="middle" fill="#d8b4fe" fontSize="12" fontWeight="600" fontFamily="system-ui,sans-serif">Fetch Agent</text>
              <text x="580" y="158" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui,sans-serif">Runs 2× daily</text>
              <text x="580" y="174" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui,sans-serif">Parses RSS feeds</text>

              {/* RSS feeds */}
              <rect x="480" y="220" width="200" height="44" rx="8" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
              <text x="580" y="248" textAnchor="middle" fill="#d1d5db" fontSize="12" fontFamily="system-ui,sans-serif">RSS Feeds (web)</text>

              {/* Storage */}
              <rect x="40" y="300" width="160" height="44" rx="8" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
              <text x="120" y="328" textAnchor="middle" fill="#d1d5db" fontSize="12" fontFamily="system-ui,sans-serif">SQLite Database</text>

              <rect x="280" y="300" width="160" height="44" rx="8" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" />
              <text x="360" y="328" textAnchor="middle" fill="#d1d5db" fontSize="12" fontFamily="system-ui,sans-serif">Google Sheets</text>

              <rect x="520" y="300" width="160" height="44" rx="8" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="600" y="328" textAnchor="middle" fill="#fff" fontSize="12" fontFamily="system-ui,sans-serif">Dashboard / Browse</text>

              {/* Arrows */}
              <line x1="360" y1="60" x2="140" y2="108" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="360" y1="60" x2="580" y2="108" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="140" y1="182" x2="480" y2="130" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="580" y1="182" x2="580" y2="218" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="520" y1="250" x2="140" y2="298" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="580" y1="264" x2="360" y2="298" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="580" y1="264" x2="600" y2="298" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* Labels on arrows */}
              <text x="220" y="88" fill="#6b7280" fontSize="10" fontFamily="system-ui,sans-serif">new topic</text>
              <text x="470" y="88" fill="#6b7280" fontSize="10" fontFamily="system-ui,sans-serif">schedule</text>
              <text x="310" y="148" fill="#6b7280" fontSize="10" fontFamily="system-ui,sans-serif">feed URLs</text>
            </svg>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">The agents explained</h2>
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-green-400 mb-2">Claude Agent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                When a topic has no RSS feeds yet, this agent asks Claude to recommend five high-quality,
                publicly accessible news feeds. The URLs are saved so the same feeds are reused on every
                fetch — no repeated AI calls unless you add a new topic.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-purple-400 mb-2">Fetch Agent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Runs on a cron schedule (twice daily at 08:00 and 20:00 server time). It downloads every
                configured RSS feed, extracts headlines, skips duplicates, trims old entries, and syncs
                the results to Google Sheets. Admins can also trigger a manual fetch from the Topics page.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Guest vs admin</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Guest</h3>
              <ul className="text-gray-400 space-y-1.5">
                <li>✓ Browse all headlines</li>
                <li>✓ Search and filter by topic</li>
                <li>✓ Open Google Sheet links</li>
                <li>✗ Add or manage topics</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-2">Admin</h3>
              <ul className="text-gray-400 space-y-1.5">
                <li>✓ Everything guests can do</li>
                <li>✓ Add and delete topics</li>
                <li>✓ Trigger manual fetches</li>
                <li>✓ Manage the agent pipeline</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
