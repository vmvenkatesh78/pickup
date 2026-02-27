// Layout — wraps every page with a sticky header + footer.
// The header has the logo, browse link, and a "Create Game" CTA.
// On mobile we tighten spacing and shorten labels to fit 375px.

import { Link, Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 no-underline shrink-0">
            <span className="text-xl">🏐</span>
            <span className="font-display font-bold text-lg text-surface-900 tracking-tight">
              pickup
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/browse"
              className="text-xs sm:text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors no-underline"
            >
              Browse
            </Link>
            <Link
              to="/my-games"
              className="text-xs sm:text-sm font-medium text-surface-500 hover:text-surface-900 transition-colors no-underline whitespace-nowrap"
            >
              My Games
            </Link>
            <Link
              to="/create"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-primary-500 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg hover:bg-primary-600 transition-colors no-underline whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Create Game</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-surface-200 py-6">
        <div className="max-w-2xl mx-auto px-4 text-center text-sm text-surface-400">
          Built for the pickup sports community ·{' '}
          <a
            href="https://github.com/vmvenkatesh78"
            target="_blank"
            rel="noopener noreferrer"
            className="text-surface-500 hover:text-primary-500 transition-colors"
          >
            @vmvenkatesh78
          </a>
        </div>
      </footer>
    </div>
  );
}