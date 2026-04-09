import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntry } from '../contexts/EntryContext';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { openEntry, closeEntry, openHelp, closeHelp } = useEntry();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        target.tagName === 'SELECT'
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Global Shortcuts (Shift + Key)
      if (e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'd': navigate('/'); break;
          case 'a': navigate('/analytics'); break;
          case 'w': navigate('/wallets'); break;
          case 'b': navigate('/budgets'); break;
          case 's': navigate('/settings'); break;
          case 'e': openEntry(); break;
          case 'c': navigate('/categories'); break;
        }
      }

      // Single Key Shortcuts
      switch (e.key) {
        case 'Escape': 
          closeEntry(); 
          closeHelp();
          break;
        case '?':
        case '/':
          if (e.shiftKey || e.key === '?') {
            e.preventDefault();
            openHelp();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, openEntry, closeEntry, openHelp, closeHelp]);
}
