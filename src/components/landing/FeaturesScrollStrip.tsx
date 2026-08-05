import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from '../../hooks/useTranslation';

type Testimonial = { name: string; age: number; location: string; content: string; avatar: string };

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { name: 'Margaret K.', age: 72, location: 'Austin, TX', content: 'Finally, someone who explains technology in a way I can understand! The step-by-step instructions helped me set up my new phone perfectly.', avatar: 'M' },
  { name: 'Robert H.', age: 68, location: 'Seattle, WA', content: "The voice feature is amazing! I can just ask my questions out loud and get clear answers, like having a patient expert on call.", avatar: 'R' },
  { name: 'Dorothy S.', age: 75, location: 'Miami, FL', content: 'I love the photo feature! I took a picture of a confusing cable and instantly knew what it was for.', avatar: 'D' },
  { name: 'Frank M.', age: 70, location: 'Denver, CO', content: 'I was so frustrated with my smart TV until I found this helper. Now I can stream shows and video chat with my grandkids!', avatar: 'F' },
];

const FeaturesScrollStrip: React.FC = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['6%', '-38%']);

  const rawTestimonials = t('landing.testimonialsSection.testimonialContent', {
    returnObjects: true,
  }) as Testimonial[] | string;
  const testimonials = Array.isArray(rawTestimonials) ? rawTestimonials : FALLBACK_TESTIMONIALS;

  return (
    <section
      ref={ref}
      className="overflow-hidden bg-canvas py-16 sm:py-20 border-y border-hairline"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted mb-2 px-5">
        {t('landing.testimonialsSection.title', 'What Our Community Says')}
      </p>
      <p className="text-center text-sm text-ink-muted mb-8 px-5">
        {t('landing.testimonialsSection.subtitle', "Join thousands of people who've made tech feel simpler")}
      </p>
      <motion.div style={{ x }} className="flex gap-4 px-5 w-max">
        {[...testimonials, ...testimonials].map((person, i) => (
          <figure
            key={`${person.name}-${i}`}
            className="flex w-80 flex-shrink-0 flex-col gap-4 rounded-[20px] border border-hairline bg-surface p-6 shadow-micro"
          >
            <blockquote className="text-sm text-ink leading-relaxed line-clamp-4">
              &ldquo;{person.content}&rdquo;
            </blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-2 border-t border-hairline">
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
                style={{ backgroundColor: i % 2 === 0 ? '#c2502e' : '#2e6a63' }}
              >
                {person.avatar}
              </span>
              <span className="text-xs text-ink-muted">
                <span className="font-semibold text-ink">{person.name}</span>, {person.age} · {person.location}
              </span>
            </figcaption>
          </figure>
        ))}
      </motion.div>
    </section>
  );
};

export default FeaturesScrollStrip;
