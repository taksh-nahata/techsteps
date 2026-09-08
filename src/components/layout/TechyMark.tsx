import React from 'react';

interface TechyMarkProps {
  size?: number;
  className?: string;
}

/** TechSteps mark — a connected ascending staircase, teal to indigo. */
const TechyMark: React.FC<TechyMarkProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <rect x="3" y="22" width="26" height="7" rx="2" fill="#429ea6" />
      <rect x="9.5" y="15" width="19.5" height="14" rx="2" fill="#429ea6" />
      <rect x="16" y="8" width="13" height="21" rx="2" fill="#2f2963" />
      <rect x="22.5" y="3" width="6.5" height="26" rx="2" fill="#2f2963" />
    </svg>
  );
};

export default TechyMark;
