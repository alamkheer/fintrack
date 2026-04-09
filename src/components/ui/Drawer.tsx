import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: 'right' | 'left' | 'bottom';
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, title, side = 'right', children }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    onClose();
  };

  const sideClasses = {
    right: 'inset-y-0 right-0 w-full sm:w-[400px]',
    left: 'inset-y-0 left-0 w-full sm:w-[400px]',
    bottom: 'bottom-0 inset-x-0 w-full h-[80vh] rounded-t-[32px]',
  };

  const roundedClasses = {
    right: 'rounded-l-[32px]',
    left: 'rounded-r-[32px]',
    bottom: 'rounded-t-[32px]',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
      <div 
        className="fixed inset-0 bg-surface-dark/40 backdrop-blur-sm transition-opacity" 
        onClick={handleBackdropClick}
      />
      <div 
        className={`fixed bg-surface-container shadow-2xl flex flex-col ${sideClasses[side]} ${roundedClasses[side]} animate-in slide-in-from-${side === 'bottom' ? 'bottom' : (side === 'right' ? 'right' : 'left')} duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]`}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-outline/5 shrink-0">
          <h2 className="text-2xl font-display font-bold text-on-surface">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
