import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, fullWidth = true, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    
    // Using container 'high' for inputs vs 'outline'
    const baseInputStyles = 'bg-surface-container-high text-on-surface placeholder:text-on-surface-variant/50 rounded-xl px-4 py-3 font-body text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:bg-surface-container-highest';
    const errorStyles = error ? 'ring-2 ring-error/50 bg-error/5' : '';
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={`space-y-1.5 ${widthClass}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${errorStyles} ${widthClass} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-sm font-medium text-error mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
