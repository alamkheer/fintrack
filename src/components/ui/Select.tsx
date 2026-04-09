import { type SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, fullWidth = true, id, children, ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    
    // Tonal background without hard outline
    const baseSelectStyles = 'appearance-none bg-surface-container-high text-on-surface rounded-xl px-4 py-3 font-body text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:bg-surface-container-highest cursor-pointer';
    const errorStyles = error ? 'ring-2 ring-error/50 bg-error/5' : '';
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={`space-y-1.5 ${widthClass}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`${baseSelectStyles} ${errorStyles} pr-10 ${widthClass} ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-sm font-medium text-error mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
