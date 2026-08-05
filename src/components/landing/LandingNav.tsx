import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import TechyMark from '../layout/TechyMark';
import { useNavTechyMotion } from './useNavTechyMotion';

interface LandingNavProps {
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  t: (key: string, fallback?: string) => string;
}

/** Nav that switches to light text when overlapping dark page sections. */
const LandingNav: React.FC<LandingNavProps> = ({ menuOpen, onMenuToggle, onMenuClose, t }) => {
  const reduced = !!useReducedMotion();
  const { driftY, bounce } = useNavTechyMotion(reduced);
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    const darkSections = Array.from(document.querySelectorAll('[data-nav-theme="dark"]'));
    if (!darkSections.length) return;

    const navHeight = 64;

    const update = () => {
      const probeY = navHeight + 4;
      const overDark = darkSections.some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= probeY && rect.bottom >= probeY;
      });
      setOnDark(overDark);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const navLink = onDark
    ? 'text-[#cfc8ba] hover:text-[#f6f2ea]'
    : 'text-ink-muted hover:text-ink';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${
        onDark ? 'border-white/10 bg-ink/75' : 'border-hairline bg-surface/90'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          className={`focus-ring rounded-lg flex items-center gap-2.5 min-w-0 ${
            onDark ? 'text-[#f6f2ea]' : 'text-ink'
          }`}
        >
          <motion.div
            className="shrink-0"
            style={{ y: reduced ? 0 : driftY }}
            animate={bounce}
          >
            <TechyMark size={32} />
          </motion.div>
          <span className="font-display font-extrabold text-xl tracking-[-0.02em] truncate">
            TECHSTEPS
          </span>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          <a href="#features" className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${navLink}`}>
            {t('nav.features', 'Features')}
          </a>
          <a href="#how-it-works" className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${navLink}`}>
            How it works
          </a>
          <Link
            to="/auth"
            className={`btn-pill text-sm px-5 py-2 ${
              onDark ? 'bg-white/10 text-[#f6f2ea] border border-white/20 hover:bg-white/20' : 'btn-pill-ghost'
            }`}
          >
            {t('nav.signIn', 'Sign In')}
          </Link>
          <Link to="/auth" className="btn-pill btn-pill-primary text-sm px-5 py-2">
            {t('nav.getStarted', 'Get Started')}
          </Link>
        </nav>

        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${
            onDark ? 'border-white/20 text-[#f6f2ea]' : 'border-hairline text-ink'
          }`}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
            <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className={`border-t px-5 py-4 md:hidden ${onDark ? 'border-white/10 bg-ink' : 'border-hairline bg-surface'}`}>
          <div className="flex flex-col gap-3">
            <a href="#features" className={`text-sm font-medium ${navLink}`} onClick={onMenuClose}>
              {t('nav.features', 'Features')}
            </a>
            <a href="#how-it-works" className={`text-sm font-medium ${navLink}`} onClick={onMenuClose}>
              How it works
            </a>
            <Link to="/auth" className="btn-pill btn-pill-ghost text-sm justify-center" onClick={onMenuClose}>
              {t('nav.signIn', 'Sign In')}
            </Link>
            <Link to="/auth" className="btn-pill btn-pill-primary text-sm justify-center" onClick={onMenuClose}>
              {t('nav.getStarted', 'Get Started')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
