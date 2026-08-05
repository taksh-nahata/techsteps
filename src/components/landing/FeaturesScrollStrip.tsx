import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ListChecks, Mic, Camera, Heart, MessageSquare, Users } from 'lucide-react';

const STRIP_ITEMS = [
  {
    icon: ListChecks,
    title: 'Step-by-step guides',
    description: 'Turn any question into clear, numbered steps you can follow at your own pace.',
    color: '#c2502e',
  },
  {
    icon: Mic,
    title: 'Voice questions',
    description: 'Ask out loud and hear answers read back — great when your hands are full.',
    color: '#2e6a63',
  },
  {
    icon: Camera,
    title: 'Photo explainers',
    description: 'Snap a cable, button, or screen and get a plain-language breakdown of what you see.',
    color: '#c2502e',
  },
  {
    icon: MessageSquare,
    title: 'Patient AI chat',
    description: 'No jargon, no rush — just thoughtful answers until things actually make sense.',
    color: '#2e6a63',
  },
  {
    icon: Heart,
    title: 'Comfortable design',
    description: 'Large type, calm layout, and generous spacing so nothing feels cramped or confusing.',
    color: '#c2502e',
  },
  {
    icon: Users,
    title: 'Community forum',
    description: 'Swap tips, ask questions, and learn from people figuring out the same things.',
    color: '#2e6a63',
  },
];

const FeaturesScrollStrip: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['6%', '-38%']);

  return (
    <section
      ref={ref}
      className="overflow-hidden bg-canvas py-16 sm:py-20 border-y border-hairline"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted mb-8 px-5">
        Everything in one place
      </p>
      <motion.div style={{ x }} className="flex gap-4 px-5 w-max">
        {[...STRIP_ITEMS, ...STRIP_ITEMS].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.title}-${i}`}
              className="flex w-72 flex-shrink-0 flex-col gap-3 rounded-[20px] border border-hairline bg-surface p-6 shadow-micro"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline"
                style={{ color: item.color }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="font-display font-bold text-lg text-ink">{item.title}</p>
              <p className="text-sm text-ink-muted leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
};

export default FeaturesScrollStrip;
