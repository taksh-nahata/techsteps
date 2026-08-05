import React from 'react';
import TechyMark from './TechyMark';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  responsiveText?: boolean;
  /** Use on dark backgrounds (footer, ink sections) */
  variant?: 'default' | 'light';
}

const markSizes = { sm: 28, md: 36, lg: 44 };
const textSizeClasses = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  responsiveText = false,
  variant = 'default',
}) => {
  const textClass =
    variant === 'light'
      ? 'text-[#f6f2ea]'
      : 'text-ink';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <TechyMark size={markSizes[size]} />
      {showText && (
        <span
          className={`font-display font-extrabold tracking-[-0.02em] truncate ${textSizeClasses[size]} ${textClass} ${
            responsiveText ? 'hidden sm:inline' : ''
          }`}
        >
          TECHSTEPS
        </span>
      )}
    </div>
  );
};

export default Logo;
