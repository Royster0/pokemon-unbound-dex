import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 hidden flex-shrink-0 text-base font-semibold tracking-tight sm:block">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Unbound Pokedex
          </Link>
        </h2>

        <div className="order-1 flex-1 overflow-x-auto sm:order-2 sm:ml-4 sm:w-auto sm:flex-none sm:overflow-visible">
          <div className="flex min-w-max items-center gap-x-4 text-sm font-semibold">
            <Link
              to="/"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Home
            </Link>
            <Link
              to="/pokemon"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              Pokemon List
            </Link>
          </div>
        </div>

        <div className="order-2 ml-auto flex items-center gap-1.5 sm:order-3">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
