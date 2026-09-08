import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Wifi, Check } from 'lucide-react';

const STEPS = [
  { title: 'Open Settings', done: true },
  { title: 'Tap Wi-Fi', done: true },
  { title: 'Choose your network', done: false },
];

const PhoneShowcase: React.FC = () => {
  const reduced = !!useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-surface px-5 py-28 sm:px-8 sm:py-36">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Built for your pocket
          </p>
          <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl md:text-5xl">
            Real steps. Real screens. No guessing.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
            Every guide breaks down into cards you can hold in one hand — one
            action per card, checked off as you go, so you always know
            exactly where you are.
          </p>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-[300px]"
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute -inset-8 -z-10 rounded-[48px] bg-brand-soft blur-3xl opacity-70" />

          <motion.div
            className="rounded-[40px] border-[6px] border-ink bg-ink p-2 shadow-senior-xl"
            animate={reduced ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="overflow-hidden rounded-[28px] bg-canvas">
              <div className="flex items-center justify-between px-5 pb-2 pt-3 text-[10px] font-semibold text-ink-muted">
                <span>9:41</span>
                <span className="h-2.5 w-12 rounded-full bg-ink/15" />
              </div>

              <div className="flex items-center justify-between border-y border-hairline bg-surface px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
                  Step 2 of 3
                </span>
                <Wifi className="h-4 w-4 text-ink-muted" />
              </div>

              <div className="flex flex-col items-center gap-3 px-6 py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand font-display text-2xl font-extrabold text-white">
                  2
                </div>
                <p className="text-center font-display text-base font-bold text-ink">
                  Tap Wi-Fi
                </p>
                <p className="text-center text-xs leading-relaxed text-ink-muted">
                  It's near the top of the Settings menu, with a small signal icon next to it.
                </p>
              </div>

              <div className="flex flex-col gap-2 px-4 pb-6">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${
                      step.done ? 'border-hairline bg-subtle' : 'border-brand/40 bg-brand-soft'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        step.done ? 'bg-accent-cool text-white' : 'bg-brand text-white'
                      }`}
                    >
                      {step.done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="text-xs font-medium text-ink">{step.title}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default PhoneShowcase;
