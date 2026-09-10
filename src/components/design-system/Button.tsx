import React from 'react';
import { ButtonProps } from './types';
import { LoadingSpinner } from './LoadingSpinner';
import { FocusRing } from './FocusRing';

const buttonVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-senior hover:shadow-senior-md',
  secondary: 'bg-subtle hover:bg-hairline text-ink border border-hairline hover:border-ink-muted',
  outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 hover:border-primary-600',
  ghost: 'text-primary-500 hover:bg-primary-50 hover:text-primary-600',
  danger: 'bg-error-500 hover:bg-error-600 text-white shadow-senior hover:shadow-senior-md',
};

const buttonSizes = {
  sm: 'px-4 py-2 text-sm min-h-touch',
  md: 'px-6 py-3 text-base min-h-button',
  lg: 'px-8 py-4 text-lg min-h-button',
  xl: 'px-10 py-5 text-xl min-h-button',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  children,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': testId,
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-semibold rounded-senior',
    'transition-all duration-250',
    'focus-senior',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'motion-reduce:transition-none',
    // Ensure minimum touch target size
    'touch-target button-target',
  ].join(' ');

  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      data-testid={testId}
    >
      <FocusRing>
        {loading && (
          <LoadingSpinner 
            size="sm" 
            color={variant === 'primary' || variant === 'danger' ? 'neutral' : 'primary'} 
            className="mr-2" 
          />
        )}
        {children}
      </FocusRing>
    </button>
  );
};