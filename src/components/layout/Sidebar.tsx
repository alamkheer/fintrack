import { NavLink } from 'react-router-dom';
import { useEntry } from '../../contexts/EntryContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/wallets', label: 'Wallets', icon: '💳' },
  { path: '/budgets', label: 'Budgets', icon: '🎯' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { openEntry } = useEntry();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface-container border-r border-outline/5 h-full z-10">
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold text-brand">FinTrack</h1>
        <p className="text-sm font-medium text-on-surface-variant opacity-70">Personal Finance</p>
      </div>

      <nav className="flex-1 px-4 pt-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 pt-1 rounded-xl font-body font-medium transition-colors ${isActive
                ? 'bg-brand/10 text-brand outline-none ring-2 ring-brand ring-offset-2'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-outline/5">
        <button
          onClick={() => openEntry()}
          aria-label="Create New Transaction"
          className="flex w-full items-center gap-3 px-4 py-3 bg-brand/10 text-brand hover:bg-brand/20 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          <span className="text-xl" aria-hidden="true">➕</span>
          New Entry
        </button>
      </div>
    </aside>
  );
}
