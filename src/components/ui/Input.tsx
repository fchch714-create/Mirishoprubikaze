'use client';

import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  successMessage?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      successMessage,
      helperText,
      disabled,
      id,
      leftIcon,
      rightIcon,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const successId = `${inputId}-success`;

    // Amass active descriptive IDs for ARIA compatibility
    const describedByList: string[] = [];
    if (error) describedByList.push(errorId);
    if (successMessage) describedByList.push(successId);
    if (helperText) describedByList.push(helperId);
    if (ariaDescribedBy) describedByList.push(ariaDescribedBy);
    const describedBy = describedByList.length > 0 ? describedByList.join(' ') : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground select-none flex items-center justify-between"
          >
            <span>{label}</span>
            {props.required && (
              <span className="text-rubik-brand text-xs font-semibold" aria-hidden="true">
                * Mütləq
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center rounded-lg shadow-soft-sm">
          {leftIcon && (
            <div className="absolute left-3.5 text-muted-foreground pointer-events-none select-none flex items-center justify-center shrink-0">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={twMerge(
              clsx(
                // Base structure
                'w-full px-4 py-2.5 bg-background border rounded-lg text-sm md:text-base text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1',
                // Adjust padding if icons are present
                leftIcon && 'pl-11',
                rightIcon && 'pr-11',
                (error || successMessage) && !rightIcon && 'pr-11',
                // Normal State
                !error && !successMessage && 'border-border focus:ring-rubik-brand focus:border-rubik-brand',
                // Error State
                error && 'border-error/80 focus:ring-error focus:border-error bg-red-50/50 dark:bg-red-950/10 text-error',
                // Success State
                successMessage && 'border-success/80 focus:ring-success focus:border-success bg-emerald-50/50 dark:bg-emerald-950/10 text-success',
                // Disabled State
                disabled && 'opacity-60 bg-muted cursor-not-allowed select-none'
              ),
              className
            )}
            {...props}
          />

          {/* Right Icon/Status Indicator Overlay */}
          <div className="absolute right-3.5 flex items-center justify-center shrink-0 select-none pointer-events-none">
            {error && !rightIcon && (
              <AlertCircle className="h-5 w-5 text-error animate-pulse" aria-hidden="true" />
            )}
            {successMessage && !rightIcon && (
              <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
            )}
            {rightIcon && !error && !successMessage && (
              <span className="text-muted-foreground">{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Messaging (Errors, Successes, Helper Text) */}
        {error && (
          <p id={errorId} className="text-xs md:text-sm text-error flex items-center gap-1.5 mt-0.5" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {successMessage && !error && (
          <p id={successId} className="text-xs md:text-sm text-success flex items-center gap-1.5 mt-0.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </p>
        )}

        {helperText && !error && !successMessage && (
          <p id={helperId} className="text-xs text-muted-foreground leading-relaxed">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
