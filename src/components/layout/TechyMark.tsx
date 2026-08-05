import React from 'react';
import { TECHY_PIVOT, TECHY_ROTATE_DEG, TECHY_TILE_RADIUS, TECHY_VISIBLE, techyOuterBox } from './techyShared';

interface TechyMarkProps {
  size?: number;
  className?: string;
}

/** Exact Techy silhouette — rotated staircase on bottom-left pivot. */
const TechyMark: React.FC<TechyMarkProps> = ({ size = 40, className = '' }) => {
  const box = techyOuterBox(size);

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-visible shrink-0 ${className}`}
      style={{ width: box, height: box }}
      aria-hidden
    >
      <div
        className="grid grid-cols-3"
        style={{
          width: size,
          height: size,
          gap: size * 0.07,
          transform: `rotate(${TECHY_ROTATE_DEG}deg)`,
          transformOrigin: TECHY_PIVOT,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const visible = TECHY_VISIBLE.includes(i as (typeof TECHY_VISIBLE)[number]);
          if (!visible) return <div key={i} />;
          const [c1, c2] = ['#c2502e', '#d98a2b'];
          return (
            <div
              key={i}
              style={{
                borderRadius: TECHY_TILE_RADIUS[i],
                background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                boxShadow: `0 2px 8px ${c1}33`,
              }}
            />
          );
        })}
      </div>
      <div
        className="absolute rounded-full bg-brand-strong pointer-events-none"
        style={{
          width: Math.max(3, size * 0.07),
          height: Math.max(3, size * 0.07),
          left: box * 0.2,
          bottom: box * 0.18,
        }}
      />
    </div>
  );
};

export default TechyMark;
