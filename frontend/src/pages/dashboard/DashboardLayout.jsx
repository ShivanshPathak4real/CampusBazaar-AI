import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/listings', label: 'My listings' },
  { to: '/dashboard/saved', label: 'Saved items' },
  { to: '/dashboard/transactions', label: 'Purchases & sales' },
  { to: '/dashboard/rentals', label: 'Rentals' },
  { to: '/dashboard/exchanges', label: 'Exchanges' },
  { to: '/dashboard/messages', label: 'Messages' },
  { to: '/dashboard/notifications', label: 'Notifications' },
];

export default function DashboardLayout() {
  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[200px_1fr]">
        <nav className="scroll-strip flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `shrink-0 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-white'}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
