import React, { useCallback, useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Check, MousePointerClick, ChevronRight } from 'lucide-react';
import { FlashcardStep } from '../../types/services';
import MarkdownRenderer from './MarkdownRenderer';
import { getDirectionsForDevice, GuideDeviceType, GUIDE_DEVICE_LABELS } from '../../utils/deviceDetection';

interface FlashcardCardProps {
  step: FlashcardStep;
  stepNumber: number;
  totalSteps: number;
  direction: number;
  onNext: () => void;
  onPrevious: () => void;
  isCompleted?: boolean;
  deviceType?: GuideDeviceType;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({
  step,
  stepNumber,
  totalSteps,
  direction,
  onNext,
  onPrevious,
  isCompleted = false,
  deviceType = 'all',
}) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const plainContent = step.content.replace(/<[^>]*>/g, '').trim();
  const hasImage = Boolean(step.image);

  const directions = useMemo(() => {
    const resolved = getDirectionsForDevice(
      step.directionsByDevice as Partial<Record<GuideDeviceType, string[]>>,
      deviceType,
      step.instructions,
      plainContent
    );
    if (resolved.length) return resolved.slice(0, 8);
    if (step.instructions?.length) return step.instructions.slice(0, 5);
    const lines = plainContent
      .split(/\n+/)
      .map((l) => l.replace(/^[\d•\-*.]+\s*/, '').trim())
      .filter((l) => l.length > 8);
    return lines.length > 1 ? lines : [];
  }, [step.directionsByDevice, step.instructions, plainContent, deviceType]);

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 70;
      if (info.offset.x > threshold || info.velocity.x > 0.4) onPrevious();
      else if (info.offset.x < -threshold || info.velocity.x < -0.4) onNext();
    },
    [onNext, onPrevious]
  );

  return (
    <motion.div
      className="h-full w-full min-h-0 flex flex-col px-1 pb-1"
      initial={{ opacity: 0, x: direction > 0 ? 60 : direction < 0 ? -60 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.28 }}
      drag={prefersReducedMotion ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
    >
      <article className="flex flex-col flex-1 min-h-0 rounded-[16px] border border-hairline bg-surface shadow-micro overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-hairline">
          <span className="text-[11px] font-bold uppercase tracking-widest text-brand">
            Step {stepNumber} of {totalSteps}
          </span>
          {deviceType !== 'all' && (
            <span className="text-[10px] font-medium text-ink-muted bg-subtle px-2 py-0.5 rounded-full">
              {GUIDE_DEVICE_LABELS[deviceType]}
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-cool">
              <Check className="w-3 h-3" /> Done
            </span>
          )}
        </header>

        {hasImage ? (
          <div className="flex-1 min-h-0 grid md:grid-cols-2 overflow-hidden">
            <figure className="bg-subtle/40 border-b md:border-b-0 md:border-r border-hairline flex items-center justify-center p-3 min-h-[140px]">
              <img
                src={step.image}
                alt={step.title || `Step ${stepNumber}`}
                className="max-h-full max-w-full object-contain rounded-lg"
                loading="lazy"
              />
            </figure>
            <StepBody
              title={step.title}
              directions={directions}
              plainContent={plainContent}
              stepNumber={stepNumber}
              compact
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid md:grid-cols-[minmax(0,42%)_1fr] overflow-hidden">
            <div className="relative flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-hairline bg-gradient-to-br from-brand-soft/70 via-canvas to-subtle/30 p-6 min-h-[140px] md:min-h-0">
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(-45deg, #c2502e 0, #c2502e 1px, transparent 0, transparent 50%)',
                  backgroundSize: '12px 12px',
                }}
              />
              <motion.div
                className="relative flex h-[88px] w-[88px] md:h-[104px] md:w-[104px] items-center justify-center rounded-[24px] bg-brand text-white font-display text-5xl md:text-6xl font-extrabold shadow-micro"
                animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {stepNumber}
              </motion.div>
              {step.title && (
                <p className="relative mt-5 text-center font-display font-bold text-ink text-lg md:text-xl leading-snug max-w-[220px]">
                  {step.title}
                </p>
              )}
              <p className="relative mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
                Do each step below, then tap Next
              </p>
            </div>
            <StepBody
              directions={directions}
              plainContent={plainContent}
              stepNumber={stepNumber}
              fillHeight
            />
          </div>
        )}
      </article>
    </motion.div>
  );
};

function StepBody({
  title,
  directions,
  plainContent,
  stepNumber,
  compact = false,
  fillHeight = false,
}: {
  title?: string;
  directions: string[];
  plainContent: string;
  stepNumber: number;
  compact?: boolean;
  fillHeight?: boolean;
}) {
  return (
    <div
      className={`flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar ${
        fillHeight ? 'p-5 md:p-6' : 'p-4 md:p-5'
      }`}
    >
      {title && compact && (
        <h3 className="font-display font-bold text-lg text-ink mb-3">{title}</h3>
      )}

      {directions.length > 0 ? (
        <ol
          className={`flex-1 ${fillHeight ? 'flex flex-col justify-center gap-5 md:gap-6' : compact ? 'space-y-3' : 'space-y-4'}`}
        >
          {directions.map((instruction, index) => (
            <li key={index} className="flex gap-4 items-start">
              <span
                className={`flex-shrink-0 flex items-center justify-center rounded-full bg-brand text-white font-bold ${
                  fillHeight ? 'h-10 w-10 text-base' : 'h-8 w-8 text-sm'
                }`}
              >
                {index + 1}
              </span>
              <p
                className={`leading-relaxed text-ink ${
                  fillHeight ? 'text-base md:text-lg pt-1.5' : compact ? 'text-sm pt-1' : 'text-base pt-0.5'
                }`}
              >
                {instruction}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <div
          className={`flex-1 flex flex-col justify-center ${fillHeight ? 'text-base md:text-lg' : compact ? 'text-sm' : 'text-base'}`}
        >
          <MarkdownRenderer
            content={plainContent}
            className="prose prose-sm md:prose-base max-w-none prose-p:my-2 text-ink"
          />
        </div>
      )}

      {!fillHeight && (
        <p className="flex-shrink-0 mt-4 pt-3 border-t border-hairline text-xs text-ink-muted flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          Swipe or use Next when you&apos;ve done step {stepNumber}
        </p>
      )}
    </div>
  );
}

export default FlashcardCard;
