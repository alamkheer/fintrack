import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { dbService, syncChannel } from '../services/db';
import type { Wallet } from '../types/schema';

interface WalletContextType {
  wallets: Wallet[];
  activeWallets: Wallet[];
  isLoading: boolean;
  addWallet: (data: Omit<Wallet, 'id' | 'syncMeta' | 'currentBalance'>) => Promise<Wallet>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<Wallet>;
  archiveWallet: (id: string, isArchived?: boolean) => Promise<void>;
  refreshWallets: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshWallets = useCallback(async () => {
    const loaded = await dbService.getAll<Wallet>('wallets');
    loaded.sort((a, b) => a.displayOrder - b.displayOrder);
    setWallets(loaded);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshWallets();

    const handleMessage = (event: MessageEvent) => {
      // Refreshing wallets on expense change because balances might have updated
      if (
        event.data.type === 'DATA_CHANGED' && 
        (event.data.store === 'wallets' || event.data.store === 'expenses')
      ) {
        refreshWallets();
      }
    };

    syncChannel.addEventListener('message', handleMessage);
    return () => syncChannel.removeEventListener('message', handleMessage);
  }, [refreshWallets]);

  const addWallet = async (data: Omit<Wallet, 'id' | 'syncMeta' | 'currentBalance'>) => {
    const newWallet = await dbService.addWallet(data);
    await refreshWallets();
    return newWallet;
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    const updated = await dbService.updateWallet(id, updates);
    await refreshWallets();
    return updated;
  };

  const archiveWallet = async (id: string, isArchived: boolean = true) => {
    await dbService.archiveWallet(id, isArchived);
    await refreshWallets();
  };

  const activeWallets = wallets.filter(w => !w.isArchived);

  return (
    <WalletContext.Provider value={{ 
      wallets, 
      activeWallets, 
      isLoading, 
      addWallet, 
      updateWallet, 
      archiveWallet, 
      refreshWallets 
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallets() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallets must be used within a WalletProvider');
  }
  return context;
}
