import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Logo from './Logo';

const INTRO_DURATION = 1.5;
const FADE_DURATION = 0.5;

interface AppLoaderProps {
  /** Minimal loader for Suspense — no timed intro/fade cycle */
  compact?: boolean;
  /** Keep visible until external readiness (e.g. auth resolving) */
  hold?: boolean;
  /** Called after fade-out completes */
  onComplete?: () => void;
  className?: string;
}

const AppLoader: React.FC<AppLoaderProps> = ({
  compact = false,
  hold = false,
  onComplete,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [introDone, setIntroDone] = useState(compact || !!prefersReducedMotion);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (compact || prefersReducedMotion) {
      setIntroDone(true);
      return;
    }

    const timer = setTimeout(() => setIntroDone(true), INTRO_DURATION * 1000);
    return () => clearTimeout(timer);
  }, [compact, prefersReducedMotion]);

  useEffect(() => {
    if (compact || hold || !introDone || isExiting) return;

    setIsExiting(true);
    const fadeMs = prefersReducedMotion ? 200 : FADE_DURATION * 1000;
    const timer = setTimeout(() => onComplete?.(), fadeMs);
    return () => clearTimeout(timer);
  }, [compact, hold, introDone, isExiting, onComplete, prefersReducedMotion]);

  const motionDuration = prefersReducedMotion ? 0.2 : FADE_DURATION;
  const blockCount = 4;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Loading TechSteps"
      className={`flex items-center justify-center bg-canvas ${compact ? 'min-h-[50vh] w-full' : 'fixed inset-0 z-50 min-h-screen'} ${className}`}
      initial={{ opacity: compact ? 1 : 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: motionDuration, ease: 'easeInOut' }}
    >
      <div className="flex flex-col items-center gap-8 px-6">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.01 : 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Logo size="lg" showText />
        </motion.div>

        <div className="flex flex-col items-center gap-3 w-48">
          {!prefersReducedMotion && (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: blockCount }).map((_, i) => (
                <motion.span
                  key={i}
                  className="block h-1 w-6 rounded-full"
                  initial={{ scaleX: 0.3, opacity: 0.4 }}
                  animate={{
                    scaleX: [0.3, 1, 0.3],
                    opacity: [0.4, 1, 0.4],
                    backgroundColor: [
                      'var(--brand-accent-soft)',
                      'var(--brand-accent)',
                      'var(--brand-accent-soft)',
                    ],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  style={{ transformOrigin: 'center' }}
                />
              ))}
            </div>
          )}

          <div className="relative h-px w-full overflow-hidden rounded-full bg-hairline" aria-hidden="true">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-brand"
              initial={{ width: prefersReducedMotion ? '100%' : '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: prefersReducedMotion ? 0.01 : INTRO_DURATION,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        </div>

        <span className="sr-only">Loading</span>
      </div>
    </motion.div>
  );
};

export default AppLoader;
