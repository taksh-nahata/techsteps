import React from 'react';
import { CardProps } from './types';

const cardVariants = {
  default: 'bg-surface border border-hairline shadow-senior',
  elevated: 'bg-surface shadow-senior-lg',
  outlined: 'bg-surface border-2 border-hairline',
};

const cardPadding = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  interactive = false,
  onClick,
  className = '',
  children,
  'data-testid': testId,
}) => {
  const baseClasses = [
    'rounded-senior-lg',
    'transition-all duration-250',
    'motion-reduce:transition-none',
  ].join(' ');

  const interactiveClasses = interactive
    ? [
        'cursor-pointer',
        'hover:shadow-senior-xl hover:-translate-y-1',
        'focus:outline-none focus:ring-3 focus:ring-primary-500 focus:ring-offset-3',
        'active:translate-y-0 active:shadow-senior-md',
      ].join(' ')
    : '';

  const variantClasses = cardVariants[variant];
  const paddingClasses = cardPadding[padding];

  const handleClick = () => {
    if (interactive && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };

  const Component = interactive ? 'div' : 'div';

  return (
    <Component
      className={`${baseClasses} ${variantClasses} ${paddingClasses} ${interactiveClasses} ${className}`}
      onClick={handleClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      data-testid={testId}
    >
      {children}
    </Component>
  );
};