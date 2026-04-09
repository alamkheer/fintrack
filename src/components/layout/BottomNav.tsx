import { NavLink } from 'react-router-dom';
import { useEntry } from '../../contexts/EntryContext';

const navItems = [
  { path: '/', label: 'Home', icon: '📊' },
  { path: '/wallets', label: 'Wallets', icon: '💳' },
  { path: '/budgets', label: 'Budgets', icon: '🎯' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
];

export function BottomNav() {
  const { openEntry } = useEntry();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-t border-outline/5 pb-safe z-40">
      <div className="flex items-center justify-around px-2 min-h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-colors ${
                isActive 
                  ? 'text-brand' 
                  : 'text-on-surface-variant'
              }`
            }
          >
            <span className="text-xl mb-0.5" aria-hidden="true">{item.icon}</span>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
      {/* Floating Action Button (FAB) replacement */}
      <div className="absolute left-1/2 -top-6 -translate-x-1/2 flex">
        <button 
          onClick={() => openEntry()} 
          aria-label="New Transaction"
          className="w-14 h-14 rounded-full bg-brand text-surface-bright shadow-lg shadow-brand/20 flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition-transform"
        >
          <span aria-hidden="true">➕</span>
        </button>
      </div>
    </nav>
  );
}
