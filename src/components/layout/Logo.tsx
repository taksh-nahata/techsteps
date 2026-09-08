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

  const mark =
    variant === 'light' ? (
      // The real logo file has a solid canvas-colored background baked in,
      // so it can't sit transparently on a dark panel -- fall back to the
      // vector mark here, which is transparent and matches the same design.
      <TechyMark size={markSizes[size]} />
    ) : (
      <img
        src="/logo-mark.png"
        alt=""
        width={markSizes[size]}
        height={markSizes[size]}
        className="shrink-0 rounded-[22%]"
      />
    );

  return (
    <div className="flex items-center gap-2 min-w-0">
      {mark}
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
