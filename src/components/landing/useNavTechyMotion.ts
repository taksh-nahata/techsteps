import { useEffect, useRef } from 'react';
import {
  useAnimation,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';

const MILESTONES = ['hero', 'how', 'value', 'features', 'cta'] as const;

export function useNavTechyMotion(reduced: boolean) {
  const { scrollY } = useScroll();
  const bounce = useAnimation();
  const prevMilestone = useRef<string | null>(null);

  const driftY: MotionValue<number> = useSpring(
    useTransform(scrollY, [0, 1000], [0, 6]),
    { stiffness: 80, damping: 28 }
  );

  useEffect(() => {
    if (reduced) return;

    const nodes = document.querySelectorAll<HTMLElement>('[data-scroll-milestone]');
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.4)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!hit) return;

        const id = hit.target.getAttribute('data-scroll-milestone');
        if (!id || !MILESTONES.includes(id as (typeof MILESTONES)[number])) return;
        if (id === prevMilestone.current) return;

        prevMilestone.current = id;
        void bounce.start({
          scale: [1, 1.07, 1],
          transition: { duration: 0.38, ease: [0.34, 1.3, 0.64, 1] },
        });
      },
      { threshold: [0.4, 0.6], rootMargin: '-35% 0px -45% 0px' }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [reduced, bounce]);

  return { driftY, bounce };
}
