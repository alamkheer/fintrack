import { type HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 'low' | 'high';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', elevation = 'low', children, ...props }, ref) => {
    // Elevating surfaces without lines
    const elevations = {
      low: 'bg-surface-container-low shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_4px_-1px_rgba(0,0,0,0.02)]',
      high: 'bg-surface-container shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.04)]',
    };

    return (
      <div
        ref={ref}
        className={`rounded-2xl ${elevations[elevation]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
