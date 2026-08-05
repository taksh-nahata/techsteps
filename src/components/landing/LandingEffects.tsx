import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Subtle cursor accent + floating shapes — landing only, respects reduced motion. */
const LandingEffects: React.FC = () => {
  const reduced = !!useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const onLeave = () => setVisible(false);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-[5] rounded-full mix-blend-multiply"
        style={{
          width: 120,
          height: 120,
          left: pos.x - 60,
          top: pos.y - 60,
          background: 'radial-gradient(circle, rgba(194,80,46,0.14) 0%, transparent 70%)',
        }}
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.6 }}
        transition={{ type: 'spring', stiffness: 150, damping: 22, mass: 0.4 }}
      />

      {/* Diagonal drift — top right */}
      <motion.div
        className="pointer-events-none fixed top-[18%] right-[8%] z-0 h-24 w-24 rounded-full bg-brand-soft/60 blur-2xl"
        animate={{ x: [0, 28, -12, 0], y: [0, -18, 22, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Circular orbit — left */}
      <motion.div
        className="pointer-events-none fixed bottom-[30%] left-[6%] z-0 h-16 w-16 rounded-[30%] bg-accent-cool/10 blur-xl"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 40px' }}
      />
      <motion.div
        className="pointer-events-none fixed top-[42%] left-[12%] z-0 h-3 w-3 rounded-full bg-brand/30"
        animate={{ x: [0, 40, 0, -30, 0], y: [0, -30, 50, 20, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
};

export default LandingEffects;
