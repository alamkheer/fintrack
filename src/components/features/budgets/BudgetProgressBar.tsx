import { formatCurrency } from '../../../utils/currency';

interface BudgetProgressBarProps {
  spentCents: number;
  limitCents: number;
  currency: string;
  alertThreshold?: number; // 0.0 to 1.0
}

export function BudgetProgressBar({ 
  spentCents, 
  limitCents, 
  currency, 
  alertThreshold = 0.8 
}: BudgetProgressBarProps) {
  const percentage = Math.min((spentCents / limitCents) * 100, 100);
  const remainingCents = Math.max(limitCents - spentCents, 0);
  const isOverAlert = (spentCents / limitCents) >= alertThreshold;
  const isOverLimit = spentCents >= limitCents;

  let progressColor = 'bg-brand';
  if (isOverLimit) progressColor = 'bg-error';
  else if (isOverAlert) progressColor = 'bg-warning';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-2xl font-bold font-mono text-on-surface">
            {formatCurrency(spentCents, currency)}
          </span>
          <span className="text-on-surface-variant font-medium text-sm ml-2">
            of {formatCurrency(limitCents, currency)}
          </span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${isOverLimit ? 'text-error' : 'text-on-surface'}`}>
            {isOverLimit ? 'Over Budget' : `${formatCurrency(remainingCents, currency)} Left`}
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
          style={{ width: `${percentage}%` }}
        />
        {/* Alert Threshold Marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-surface-bright/50 z-10"
          style={{ left: `${alertThreshold * 100}%` }}
        />
      </div>
      
      {/* Alert Warning Text */}
      {(isOverAlert && !isOverLimit) && (
        <p className="text-xs text-warning font-medium mt-1">
          You are approaching your budget limit.
        </p>
      )}
    </div>
  );
}
