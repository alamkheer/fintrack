import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-outline/20 bg-surface-container-low/50 ${className}`}>
      {icon && <div className="text-4xl mb-4 text-on-surface-variant opacity-80">{icon}</div>}
      <h3 className="text-xl font-display font-bold text-on-surface mb-2">{title}</h3>
      <p className="text-on-surface-variant max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
