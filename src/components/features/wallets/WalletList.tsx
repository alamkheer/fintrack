import { useState } from 'react';
import { useWallets } from '../../../contexts/WalletContext';
import { WalletCard } from './WalletCard';
import { WalletForm } from './WalletForm';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { EmptyState } from '../../ui/EmptyState';
import type { Wallet } from '../../../types/schema';

export function WalletList() {
  const { wallets, isLoading } = useWallets();
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <div className="text-center p-8 text-on-surface-variant">Loading wallets...</div>;
  }



  const handleEdit = (w: Wallet) => {
    setSelectedWallet(w);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedWallet(null);
    setIsModalOpen(true);
  };

  // Divide active and archived
  const active = wallets.filter(w => !w.isArchived);
  const archived = wallets.filter(w => w.isArchived);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-on-surface">Wallets</h1>
          <p className="mt-2 text-on-surface-variant">Manage your accounts and balances</p>
        </div>
        <Button onClick={handleCreate} className="hidden sm:flex">
          ➕ New Wallet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <EmptyState
          title="No Wallets Found"
          description="Create your first wallet (like Cash or a Bank Account) to start tracking."
          action={
            <Button onClick={handleCreate}>
              Add Wallet
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map(wallet => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                onEdit={() => handleEdit(wallet)}
              />
            ))}
          </div>

          {archived.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold font-display text-on-surface mb-6 opacity-70">Archived Wallets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archived.map(wallet => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    onEdit={() => handleEdit(wallet)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedWallet ? "Edit Wallet" : "New Wallet"}
      >
        <WalletForm initialData={selectedWallet} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {/* Mobile FAB override */}
      <Button
        onClick={handleCreate}
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-xl z-50 text-2xl p-0!"
      >
        ➕
      </Button>
    </div>
  );
}
