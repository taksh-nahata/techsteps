import { Link } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  ListChecks,
  Mic,
  Camera,
  Heart,
} from 'lucide-react';
import React, { useState } from 'react';
import Logo from '../components/layout/Logo';
import ScrollHowItWorks from '../components/landing/ScrollHowItWorks';
import LandingEffects from '../components/landing/LandingEffects';
import LandingNav from '../components/landing/LandingNav';
import FeaturesScrollStrip from '../components/landing/FeaturesScrollStrip';
import { useTranslation, useRTLStyles } from '../hooks/useTranslation';

type FeatureItem = { title: string; description: string };

const FEATURE_ICONS = [ListChecks, Mic, Camera, Heart] as const;

const FALLBACK_FEATURES: FeatureItem[] = [
  {
    title: 'Step-by-Step Guidance',
    description:
      'Clear, easy-to-follow instructions for any tech question — explained in simple terms.',
  },
  {
    title: 'Voice Support',
    description:
      'Ask questions with your voice and hear answers read aloud. Hands-free help when you need it.',
  },
  {
    title: 'Photo Explainer',
    description:
      'Snap a photo of any cable, button, or device and get an instant, plain-language explanation.',
  },
  {
    title: 'Comfortable Design',
    description:
      'Large text, calm layout, and patient explanations — built so nothing feels rushed or cramped.',
  },
];

const QUESTION_KEYS = [
  'questions.connectWifi',
  'questions.makeTextBigger',
  'questions.takeScreenshot',
  'questions.updateApps',
  'questions.makeVideoCall',
  'questions.backupPhotos',
] as const;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0, reduced = false, drift = 0): Variants => ({
  hidden: { opacity: 0, y: reduced ? 0 : 32, x: reduced ? 0 : drift },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.7, delay, ease: EASE_OUT },
  },
});

const stagger = (reduced = false): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: reduced ? 0 : 0.12, delayChildren: 0.05 },
  },
});

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { direction } = useRTLStyles();
  const prefersReducedMotion = useReducedMotion();
  const reduced = !!prefersReducedMotion;
  const [menuOpen, setMenuOpen] = useState(false);

  const rawFeatures = t('landing.featuresSection.items', {
    returnObjects: true,
  }) as FeatureItem[] | string;
  const features: FeatureItem[] = Array.isArray(rawFeatures)
    ? rawFeatures.slice(0, 4)
    : FALLBACK_FEATURES;

  const popularQuestions = QUESTION_KEYS.map((key) =>
    t(key, key.split('.').pop() ?? key)
  );

  return (
    <div className="min-h-screen bg-canvas text-ink relative" dir={direction}>
      <LandingEffects />
      <LandingNav
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((o) => !o)}
        onMenuClose={() => setMenuOpen(false)}
        t={t}
      />
      <main>
        {/* ── Hero ── */}
        <section
          data-scroll-milestone="hero"
          className="relative flex min-h-[92vh] flex-col justify-center px-5 pb-24 pt-28 sm:px-8"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp(0, reduced)}
                className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted"
              >
                {t('landing.hero.tagline', 'Clear tech help, whenever you need it')}
              </motion.p>

              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp(0.08, reduced)}
                className="font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-ink"
                style={{ fontSize: 'clamp(44px, 7vw, 84px)' }}
              >
                {t('landing.hero.title', 'Technology made')}
                <br />
                <span className="text-brand">
                  {t('landing.hero.titleHighlight', 'simple & clear')}
                </span>
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp(0.16, reduced)}
                className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl"
                style={{ fontSize: 'clamp(18px, 2vw, 20px)' }}
              >
                {t(
                  'landing.hero.subtitle',
                  'Master technology with confidence through personalized, step-by-step guidance that feels like having a patient friend by your side.'
                )}
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp(0.24, reduced)}
                className="mt-12 flex flex-wrap items-center gap-5"
              >
                <Link
                  to="/auth"
                  className="btn-primary inline-flex items-center gap-3 px-8 py-4 text-base sm:text-lg"
                >
                  {t('landing.hero.startLearningButton', 'Start Learning Free')}
                  <ArrowRight className="h-5 w-5 rtl-flip" />
                </Link>
                <span className="text-sm text-ink-muted">
                  {t('landing.hero.noCreditCard', 'No credit card required')}
                </span>
              </motion.div>
            </div>

            {/* Live product preview — shows the actual step-by-step guide, not just a promise */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp(0.2, reduced, reduced ? 0 : 24)}
              className="relative"
              aria-hidden
            >
              <div className="absolute -inset-6 -z-10 rounded-[32px] bg-brand-soft blur-2xl opacity-60" />
              <div className="rounded-[24px] border border-hairline bg-surface shadow-senior-lg overflow-hidden">
                <div className="flex items-center justify-between border-b border-hairline bg-canvas/60 px-5 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
                    3. Guide
                  </span>
                  <span className="text-[10px] text-ink-muted">Live demo</span>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand text-white px-4 py-2.5 text-sm leading-snug">
                      How do I connect to Wi-Fi on my iPad?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-subtle text-ink px-4 py-2.5 text-sm border border-hairline leading-snug">
                      Here are clear steps with pictures.
                    </div>
                  </div>
                  <div className="mt-1 grid gap-2">
                    {['Open Settings', 'Tap Wi-Fi', 'Choose your network'].map((title, i) => (
                      <div
                        key={title}
                        className="flex items-center gap-2.5 rounded-xl border border-hairline bg-canvas px-3 py-2.5"
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-ink">{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <a
            href="#how-it-works"
            className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-ink-muted hover:text-ink transition-colors"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
              See how it works
            </span>
            <ArrowDown className="h-4 w-4" strokeWidth={1.5} />
          </a>
        </section>

        <ScrollHowItWorks />

        {/* ── Features grid ── */}
        <section id="features" data-scroll-milestone="features" className="bg-surface px-5 py-28 sm:px-8 sm:py-36">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger(reduced)}
              className="mb-16 flex flex-col gap-6 md:mb-20 md:flex-row md:items-end md:justify-between"
            >
              <div>
                <motion.p
                  variants={fadeUp(0, reduced)}
                  className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted"
                >
                  {t('landing.featuresSection.title', 'Features')}
                </motion.p>
                <motion.h2
                  variants={fadeUp(0.05, reduced)}
                  className="font-display text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl md:text-5xl"
                >
                  Technology shouldn&apos;t feel overwhelming.
                </motion.h2>
              </div>
              <motion.p
                variants={fadeUp(0.1, reduced)}
                className="max-w-sm text-base text-ink-muted"
              >
                Every question becomes clear, patient guidance — at your pace, in your words.
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 gap-px border border-hairline bg-hairline sm:grid-cols-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger(reduced)}
            >
              {features.map((feature, index) => {
                const Icon = FEATURE_ICONS[index] ?? ListChecks;
                return (
                  <motion.article
                    key={feature.title}
                    variants={fadeUp(index * 0.06, reduced, index % 2 === 0 ? -20 : 20)}
                    whileHover={reduced ? {} : { y: -4, transition: { duration: 0.25 } }}
                    className="group bg-surface p-8 sm:p-10 lg:p-12"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline">
                        <Icon
                          className="h-5 w-5"
                          style={{ color: index % 2 === 0 ? '#c2502e' : '#2e6a63' }}
                          strokeWidth={1.5}
                        />
                      </div>
                      <span className="font-display text-sm font-bold text-ink-muted/50">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-ink sm:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-ink-muted">
                      {feature.description}
                    </p>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </section>

        <FeaturesScrollStrip />

        {/* ── Popular questions ── */}
        <section className="bg-canvas px-5 py-28 sm:px-8 sm:py-36">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger(reduced)}
              className="mb-16 md:mb-20"
            >
              <motion.p
                variants={fadeUp(0, reduced)}
                className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted"
              >
                {t('landing.popularQuestionsSection.title', 'Popular Questions')}
              </motion.p>
              <motion.h2
                variants={fadeUp(0.05, reduced)}
                className="max-w-2xl font-display text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl md:text-5xl"
              >
                {t(
                  'landing.popularQuestionsSection.subtitle',
                  'Real questions people ask every day'
                )}
              </motion.h2>
            </motion.div>

            <motion.ol
              className="divide-y divide-hairline border-y border-hairline"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger(reduced)}
            >
              {popularQuestions.map((question, index) => (
                <motion.li
                  key={question}
                  variants={fadeUp(index * 0.05, reduced, index % 2 === 0 ? 16 : -16)}
                  whileHover={reduced ? {} : { x: index % 2 === 0 ? 6 : -6 }}
                >
                  <Link
                    to="/auth"
                    className="group flex items-center gap-6 py-7 transition-colors hover:bg-surface sm:gap-10 sm:py-8"
                  >
                    <span className="w-10 shrink-0 font-display text-sm font-bold text-brand sm:w-14 sm:text-base">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 font-display text-lg font-semibold tracking-[-0.02em] text-ink transition-colors group-hover:text-brand sm:text-xl md:text-2xl">
                      {question}
                    </span>
                    <ArrowRight
                      className="h-5 w-5 shrink-0 text-ink-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 rtl-flip"
                      strokeWidth={1.5}
                    />
                  </Link>
                </motion.li>
              ))}
            </motion.ol>

            <motion.div
              className="mt-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp(0, reduced)}
            >
              <Link to="/auth" className="btn-secondary inline-flex items-center gap-2">
                {t(
                  'landing.popularQuestionsSection.askYourQuestionButton',
                  'Ask Your Question Now'
                )}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── CTA band ── */}
        <section data-nav-theme="dark" data-scroll-milestone="cta" className="relative overflow-hidden bg-ink px-5 py-28 sm:px-8 sm:py-36">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(194,80,46,0.22) 0%, transparent 70%)',
            }}
          />
          <motion.div
            className="relative mx-auto max-w-3xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger(reduced)}
          >
            <motion.h2
              variants={fadeUp(0, reduced)}
              className="font-display text-3xl font-extrabold tracking-[-0.03em] text-[#f6f2ea] sm:text-4xl md:text-5xl lg:text-6xl"
            >
              {t('landing.ctaSection.title', 'Ready to Master Technology?')}
            </motion.h2>
            <motion.p
              variants={fadeUp(0.08, reduced)}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#cfc8ba] sm:text-lg"
            >
              {t(
                'landing.ctaSection.subtitle',
                "Join people who've made technology feel simple. Start getting clear, helpful answers today — completely free."
              )}
            </motion.p>
            <motion.div variants={fadeUp(0.16, reduced)} className="mt-10">
              <Link
                to="/auth"
                className="btn-primary inline-flex items-center gap-3 px-10 py-4 text-base sm:text-lg"
              >
                {t('landing.ctaSection.getStartedButton', 'Get Started Free Today')}
                <ArrowRight className="h-5 w-5 rtl-flip" />
              </Link>
            </motion.div>
            <motion.p
              variants={fadeUp(0.22, reduced)}
              className="mt-6 text-sm text-[#8a8275]"
            >
              {t('landing.hero.noCreditCard', 'No credit card required')} ·{' '}
              {t('landing.hero.freeForever', 'Free forever')} ·{' '}
              {t('landing.ctaSection.setupInMinutes', 'Setup in 2 minutes')}
            </motion.p>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer data-nav-theme="dark" className="border-t border-[#2a2620] bg-ink px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo size="sm" variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#8a8275]">
              {t(
                'landing.footer.description',
                'Making technology accessible and understandable for everyone.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-12 sm:gap-16">
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#cfc8ba]">
                {t('landing.footer.communityTitle', 'Community')}
              </h4>
              <ul className="space-y-2 text-sm text-[#8a8275]">
                <li>
                  <Link to="/auth" className="transition-colors hover:text-[#f6f2ea]">
                    {t('landing.footer.supportItems.0', 'Help Center')}
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="transition-colors hover:text-[#f6f2ea]">
                    {t('landing.footer.supportItems.2', 'Community')}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="transition-colors hover:text-[#f6f2ea]">
                    {t('landing.footer.supportItems.3', 'Contact Us')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#cfc8ba]">
                {t('landing.footer.legalTitle', 'Legal & Support')}
              </h4>
              <ul className="space-y-2 text-sm text-[#8a8275]">
                <li>
                  <Link to="/privacy-policy" className="transition-colors hover:text-[#f6f2ea]">
                    {t('landing.footer.companyItems.1', 'Privacy Policy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-service" className="transition-colors hover:text-[#f6f2ea]">
                    {t('landing.footer.companyItems.2', 'Terms of Service')}
                  </Link>
                </li>
                <li>
                  <Link to="/accessibility" className="transition-colors hover:text-[#f6f2ea]">
                    {t('landing.footer.companyItems.3', 'Accessibility')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-[#2a2620] pt-8">
          <p className="text-sm text-[#6e6657]">
            {t('landing.footer.copyright', '© 2025 TechSteps. Made with care for learners everywhere.')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
