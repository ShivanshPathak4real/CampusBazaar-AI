import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/listings', label: 'Listings' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Admin</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
        <nav className="scroll-strip flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => `shrink-0 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-white'}`}
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
