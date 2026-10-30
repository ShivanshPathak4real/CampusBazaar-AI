import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Heart, MessageCircle, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/browse', label: 'Browse' },
  { to: '/browse?listingType=rent', label: 'Rent' },
  { to: '/browse?listingType=exchange', label: 'Exchange' },
  { to: '/sell', label: 'Sell' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  function onSearch(e) {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q)}`);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-bazaar-500 text-paper">CB</span>
          <span className="hidden sm:inline">CampusBazaar</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                `focus-ring rounded transition-colors hover:text-ink ${isActive ? 'text-ink' : ''}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden max-w-sm flex-1 items-center md:flex">
          <div className="flex w-full items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5">
            <Search size={16} className="text-ink-soft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for textbooks, cycles, calculators..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/70"
            />
          </div>
        </form>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <Link to="/dashboard/saved" className="focus-ring rounded text-ink-soft hover:text-ink" aria-label="Saved items">
                <Heart size={20} />
              </Link>
              <Link to="/dashboard/messages" className="focus-ring rounded text-ink-soft hover:text-ink" aria-label="Messages">
                <MessageCircle size={20} />
              </Link>
              <Link to="/dashboard/notifications" className="focus-ring rounded text-ink-soft hover:text-ink" aria-label="Notifications">
                <Bell size={20} />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="focus-ring flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1 pr-2 text-sm font-medium"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mustard-400 text-xs text-ink">
                    {user.name.charAt(0)}
                  </span>
                  {user.name.split(' ')[0]}
                  <ChevronDown size={14} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-line bg-white py-1 shadow-sm">
                    <Link onClick={() => setMenuOpen(false)} to="/dashboard" className="block px-4 py-2 text-sm hover:bg-paper">Dashboard</Link>
                    <Link onClick={() => setMenuOpen(false)} to="/dashboard/listings" className="block px-4 py-2 text-sm hover:bg-paper">My listings</Link>
                    <Link onClick={() => setMenuOpen(false)} to="/profile" className="block px-4 py-2 text-sm hover:bg-paper">Profile</Link>
                    {user.role === 'admin' && (
                      <Link onClick={() => setMenuOpen(false)} to="/admin" className="block px-4 py-2 text-sm hover:bg-paper">Admin</Link>
                    )}
                    <button
                      onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                      className="block w-full px-4 py-2 text-left text-sm text-clay-500 hover:bg-paper"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="focus-ring rounded text-sm font-medium text-ink-soft hover:text-ink">Log in</Link>
              <Link to="/register" className="focus-ring rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button className="ml-auto md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line px-4 pb-4 md:hidden">
          <form onSubmit={onSearch} className="mt-3 flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2">
            <Search size={16} className="text-ink-soft" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search listings..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </form>
          <nav className="mt-3 flex flex-col gap-1 text-sm font-medium">
            {navLinks.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="rounded px-2 py-2 hover:bg-white">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded px-2 py-2 hover:bg-white">Dashboard</Link>
                <Link to="/dashboard/messages" onClick={() => setOpen(false)} className="rounded px-2 py-2 hover:bg-white">Messages</Link>
                <Link to="/dashboard/saved" onClick={() => setOpen(false)} className="rounded px-2 py-2 hover:bg-white">Saved</Link>
                <button onClick={() => { logout(); setOpen(false); navigate('/'); }} className="rounded px-2 py-2 text-left text-clay-500 hover:bg-white">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded px-2 py-2 hover:bg-white">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="rounded px-2 py-2 hover:bg-white">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
