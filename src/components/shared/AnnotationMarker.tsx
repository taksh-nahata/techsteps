import React from 'react';
import { ArrowUp } from 'lucide-react';
import { GuideAnnotation } from '../../types/guides';

interface AnnotationMarkerProps {
  annotation: GuideAnnotation;
}

/**
 * Non-interactive rendering half of ImageAnnotator.tsx's renderAnnotation --
 * extracted so it can be used at runtime (the original lives inside an
 * edit-time canvas with drag/resize/selection logic that a live overlay has
 * no use for). Keep the two in sync by eye if the visual language changes.
 */
export const AnnotationMarker: React.FC<AnnotationMarkerProps> = ({ annotation }) => {
  const size = annotation.size || 1;
  const baseSizeRem = 3 * size;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
    >
      {annotation.label ? (
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] bg-slate-900/80 border border-white/10 whitespace-nowrap select-none"
          style={{ transform: `scale(${size})`, color: 'white' }}
        >
          {annotation.label}
        </div>
      ) : annotation.type === 'blur' ? (
        <div
          className="absolute border border-indigo-500/30 shadow-sm backdrop-blur-[8px] rounded-md"
          style={{
            width: `${annotation.width || 15}%`,
            height: `${annotation.height || 10}%`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />
      ) : (
        <div className="relative">
          {annotation.type === 'circle' ? (
            <div
              className="rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] animate-pulse-slow"
              style={{
                width: `${baseSizeRem}rem`,
                height: `${baseSizeRem}rem`,
                border: `4px solid ${annotation.color || '#ef4444'}`,
                boxShadow: `0 0 20px ${annotation.color || '#ef4444'}66`,
              }}
            />
          ) : (
            <ArrowUp
              className="drop-shadow-lg"
              style={{
                width: `${baseSizeRem}rem`,
                height: `${baseSizeRem}rem`,
                color: annotation.color || '#ef4444',
                strokeWidth: 3,
                transform: `rotate(${
                  annotation.direction === 'down'
                    ? 180
                    : annotation.direction === 'left'
                      ? -90
                      : annotation.direction === 'right'
                        ? 90
                        : 0
                }deg)`,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AnnotationMarker;
