'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/lib/use-session'

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { session, isAdmin, isGuest } = useSession()

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  const links = [
    ...(isAdmin ? [{ href: '/topics', label: 'Topics' }] : []),
    { href: '/browse', label: 'Browse' },
    { href: '/about', label: 'About' },
  ]

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-white text-lg tracking-tight">AgentNews</span>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isGuest && (
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
              Guest
            </span>
          )}
          {session && isAdmin && (
            <span className="text-xs text-gray-500 hidden sm:inline">{session.user}</span>
          )}
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
