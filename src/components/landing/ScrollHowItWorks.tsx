import React, { useRef, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from 'framer-motion';
import TechyMark from '../layout/TechyMark';

const STEPS = [
  { id: 'ask', label: 'Ask', user: 'How do I connect to Wi-Fi on my iPad?' },
  {
    id: 'think',
    label: 'Think',
    user: 'How do I connect to Wi-Fi on my iPad?',
    ai: 'Let me walk you through it, one step at a time.',
  },
  {
    id: 'guide',
    label: 'Guide',
    user: 'How do I connect to Wi-Fi on my iPad?',
    ai: 'Here are clear steps with pictures.',
    cards: ['Open Settings', 'Tap Wi-Fi', 'Choose your network'],
  },
  {
    id: 'done',
    label: 'Done',
    user: 'How do I connect to Wi-Fi on my iPad?',
    ai: "You're connected! Need anything else?",
    cards: ['Open Settings', 'Tap Wi-Fi', 'Choose your network'],
    done: true,
  },
] as const;

type Step = (typeof STEPS)[number];
const STEP_COUNT = STEPS.length;

const ScrollHowItWorks: React.FC = () => {
  const reduced = !!useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduced) return;
    const idx = Math.min(STEP_COUNT - 1, Math.floor(v * STEP_COUNT));
    setActive(idx);
  });

  if (reduced) {
    return (
      <section id="how-it-works" data-scroll-milestone="how" className="scroll-mt-24 border-t border-hairline bg-canvas py-16 px-5 sm:px-8">
        <h2 className="font-display text-3xl font-extrabold text-ink mb-8">How it works</h2>
        <div className="grid gap-6">
          {STEPS.map((step, i) => (
            <DemoCard key={step.id} step={step} stepIndex={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative bg-canvas border-t border-hairline"
      style={{ height: `${STEP_COUNT * 100}vh` }}
      aria-label="How TechSteps works"
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col justify-center px-5 sm:px-8 py-8 min-h-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted mb-2">
            How it works
          </p>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-ink mb-4 max-w-xl">
            Scroll to watch a real question become step-by-step help
          </h2>

          {/* Progress — one segment per step; holds you through each */}
          <div className="flex gap-2 mb-6 max-w-md" aria-hidden>
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex-1 h-1 rounded-full bg-subtle overflow-hidden">
                <motion.div
                  className="h-full bg-brand rounded-full"
                  animate={{ width: i < active ? '100%' : i === active ? '100%' : '0%' }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {STEPS.map((step, i) => (
              <span
                key={step.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  active === i ? 'bg-brand text-white' : 'bg-subtle text-ink-muted'
                }`}
              >
                {i + 1}. {step.label}
              </span>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-8 lg:items-stretch min-h-0 flex-1 max-h-[min(58vh,520px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={STEPS[active].id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                className="min-h-0 h-full"
              >
                <DemoCard step={STEPS[active]} stepIndex={active} />
              </motion.div>
            </AnimatePresence>

            <div className="hidden lg:flex flex-col justify-center rounded-[20px] border border-hairline bg-surface p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`side-${active}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <TechyMark size={80} />
                  <p className="text-ink-muted text-sm max-w-xs leading-relaxed">
                    {active === 0 && 'Ask anything — type or tap Techy to speak.'}
                    {active === 1 && 'Techy understands your device and breaks the task down.'}
                    {active === 2 && 'Visual flashcards show exactly what to tap and where.'}
                    {active === 3 && 'Finish at your pace — no rush, no jargon.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-ink-muted lg:hidden">
            Keep scrolling — step {active + 1} of {STEP_COUNT}
          </p>
        </div>
      </div>
    </section>
  );
};

function DemoCard({ step, stepIndex }: { step: Step; stepIndex: number }) {
  return (
    <div className="h-full rounded-[20px] border border-hairline bg-surface shadow-micro overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-hairline bg-canvas/50 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-brand">
          {stepIndex + 1}. {step.label}
        </span>
        <span className="text-[10px] text-ink-muted">Live demo</span>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
        <div className="flex justify-end">
          <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-brand text-white px-3 py-2.5 text-sm leading-snug">
            {step.user}
          </div>
        </div>

        {'ai' in step && step.ai && (
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-subtle text-ink px-3 py-2.5 text-sm border border-hairline leading-snug">
              {step.ai}
            </div>
          </div>
        )}

        {'cards' in step && step.cards && (
          <div className="mt-1 grid gap-2">
            {step.cards.map((title, i) => (
              <div
                key={title}
                className="flex items-center gap-2.5 rounded-xl border border-hairline bg-canvas px-3 py-2"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-ink truncate">{title}</span>
              </div>
            ))}
          </div>
        )}

        {'done' in step && step.done && (
          <p className="mt-auto text-center text-sm font-semibold text-accent-cool pt-2">
            ✓ Connected successfully
          </p>
        )}
      </div>
    </div>
  );
}

export default ScrollHowItWorks;
