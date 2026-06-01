import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Nav } from './nav'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/browse',
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/lib/use-session', () => ({
  useSession: () => ({
    session: { user: 'admin', role: 'admin' },
    loading: false,
    isAdmin: true,
    isGuest: false,
  }),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe('Nav', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    mockPush.mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true })
    )
  })

  it('renders navigation links', () => {
    render(<Nav />)

    expect(screen.getByText('AgentNews')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Topics' })).toHaveAttribute('href', '/topics')
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
  })

  it('signs out and redirects to login', async () => {
    const user = userEvent.setup()
    render(<Nav />)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(fetch).toHaveBeenCalledWith('/api/auth', { method: 'DELETE' })
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
