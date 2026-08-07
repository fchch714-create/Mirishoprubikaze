'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading;

    // Standard Tailwind pairings for rich Azerbaijan-focused visual design
    const baseStyles = 'inline-flex items-center justify-center font-sans font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rubik-brand/50 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] transition-all duration-200';

    const variants = {
      primary: 'bg-rubik-brand text-white hover:bg-rubik-brand-dark shadow-soft-sm focus:ring-rubik-brand',
      secondary: 'bg-rubik-charcoal text-white hover:bg-rubik-charcoal-light shadow-soft-sm focus:ring-rubik-charcoal',
      accent: 'bg-rubik-yellow text-rubik-charcoal hover:bg-rubik-yellow-dark shadow-soft-sm focus:ring-rubik-yellow',
      outline: 'border-2 border-border bg-transparent text-foreground hover:bg-muted focus:ring-border',
      ghost: 'bg-transparent text-foreground hover:bg-muted focus:ring-transparent',
      danger: 'bg-error text-white hover:bg-red-600 shadow-soft-sm focus:ring-error',
      success: 'bg-success text-white hover:bg-emerald-600 shadow-soft-sm focus:ring-success',
    };

    const sizes = {
      xs: 'px-2.5 py-1 text-xs',
      sm: 'px-3.5 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm md:text-base',
      lg: 'px-6 py-3 text-base md:text-lg',
      xl: 'px-8 py-4 text-lg md:text-xl',
      icon: 'h-10 w-10 p-2',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isButtonDisabled}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        aria-busy={isLoading}
        aria-live="polite"
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2 inline-flex items-center shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && (
          <span className="ml-2 inline-flex items-center shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
