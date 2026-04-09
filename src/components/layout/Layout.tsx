import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export function Layout({ children }: { children: ReactNode }) {
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-[--color-background] overflow-hidden w-full max-w-full">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-20 md:pb-0 relative">
        <div className="flex-1 w-full max-w-5xl mx-auto md:p-6 p-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
