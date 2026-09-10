import React from 'react';
import * as LucideIcons from 'lucide-react';
import { IconProps } from './types';

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

const iconColors = {
  primary: 'text-primary-600',
  secondary: 'text-ink-muted',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  neutral: 'text-ink-muted',
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'neutral',
  className = '',
  'aria-hidden': ariaHidden = true,
  'data-testid': testId,
}) => {
  // Get the icon component from Lucide
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide icons`);
    return null;
  }

  const baseClasses = [
    iconSizes[size],
    iconColors[color],
    'flex-shrink-0',
  ].join(' ');

  return (
    <IconComponent
      className={`${baseClasses} ${className}`}
      aria-hidden={ariaHidden}
      data-testid={testId}
    />
  );
};