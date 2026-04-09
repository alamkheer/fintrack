import { type HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'error';
  // Allow passing custom hex color instead of a predefined variant
  customColor?: string;
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'neutral', customColor, size = 'sm', children, style, ...props }, ref) => {
    // We use a bit of opacity for a "pastel void" or tonal feel
    const baseStyles = 'inline-flex items-center justify-center font-body font-medium rounded-full';
    
    const variants = {
      brand: 'bg-brand/10 text-brand',
      accent: 'bg-brand-tertiary/10 text-brand-tertiary',
      neutral: 'bg-surface-container-high text-on-surface-variant',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      error: 'bg-error/10 text-error',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    const combinedStyle = customColor ? {
      backgroundColor: `${customColor}20`, // roughly 12% opacity
      color: customColor,
      ...style,
    } : style;

    const variantClass = customColor ? '' : variants[variant];

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variantClass} ${sizes[size]} ${className}`}
        style={combinedStyle}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
