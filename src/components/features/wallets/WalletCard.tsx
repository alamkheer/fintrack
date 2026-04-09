import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { formatCurrency } from '../../../utils/currency';
import type { Wallet } from '../../../types/schema';

interface WalletCardProps {
  wallet: Wallet;
  onClick?: () => void;
  onEdit?: () => void;
}

export function WalletCard({ wallet, onClick, onEdit }: WalletCardProps) {
  return (
    <Card 
      elevation="high" 
      className={`relative overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1 ${wallet.isArchived ? 'opacity-60 grayscale-30' : ''}`}
      onClick={onClick}
    >
      {/* Background color splash */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ backgroundColor: wallet.color }} 
      />
      
      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
            >
              {wallet.icon}
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface leading-tight">{wallet.name}</h3>
              <p className="text-sm font-medium text-on-surface-variant capitalize mt-0.5">
                {wallet.type}
                {wallet.cardLastFour && <span className="ml-1 tracking-widest opacity-75">•••• {wallet.cardLastFour}</span>}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {wallet.isArchived && <Badge size="sm" variant="neutral">Archived</Badge>}
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="opacity-0 group-hover:opacity-100 p-2 text-on-surface-variant hover:text-brand hover:bg-surface-container-highest rounded-full transition-all"
                aria-label="Edit Wallet"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-wider mb-1">Current Balance</p>
          <div className="font-mono text-3xl font-bold text-on-surface">
            {formatCurrency(wallet.currentBalance, wallet.currency)}
          </div>
        </div>
      </div>
    </Card>
  );
}
