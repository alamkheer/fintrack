import { type ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-body font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Digital Parchment: No borders, use tonal shifts and subtle shadows.
    const variants = {
      primary: 'bg-brand text-surface-bright hover:shadow-lg hover:shadow-brand/20 active:scale-[0.98]',
      secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-[0.98]',
      ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-low active:scale-[0.98]',
      danger: 'bg-error/10 text-error hover:bg-error/20 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-base rounded-xl',
      lg: 'px-6 py-3 text-lg rounded-2xl',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
