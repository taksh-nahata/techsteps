import React from 'react';
import { InputProps } from './types';
import { FocusRing } from './FocusRing';

const inputVariants = {
  default: 'border-hairline focus:border-primary-500 focus:ring-primary-500',
  error: 'border-error-500 focus:border-error-500 focus:ring-error-500 bg-error-50',
  success: 'border-success-500 focus:border-success-500 focus:ring-success-500 bg-success-50',
};

const inputSizes = {
  md: 'px-4 py-3 text-base min-h-input',
  lg: 'px-5 py-4 text-lg min-h-input',
  xl: 'px-6 py-5 text-xl min-h-input',
};

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'md',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  required = false,
  type = 'text',
  id,
  name,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
}) => {
  const baseClasses = [
    'w-full rounded-senior border-2',
    'bg-surface text-ink',
    'placeholder-ink-muted',
    'transition-all duration-250',
    'focus:outline-none focus:ring-3 focus:ring-offset-3',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-subtle',
    'motion-reduce:transition-none',
    // Ensure minimum touch target size
    'touch-target',
  ].join(' ');

  const variantClasses = inputVariants[variant];
  const sizeClasses = inputSizes[size];

  return (
    <FocusRing>
      <input
        type={type}
        id={id}
        name={name}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        data-testid={testId}
      />
    </FocusRing>
  );
};