import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FlashcardStep } from '../../types/services';
import FlashcardCard from './FlashcardCard';
import { GuideDeviceType, GUIDE_DEVICE_LABELS } from '../../utils/deviceDetection';
import { useAvatar } from '../../contexts/AvatarContext';

interface FlashcardPanelProps {
  steps: FlashcardStep[];
  isVisible: boolean;
  onClose: () => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
  deviceType?: GuideDeviceType;
  onDeviceTypeChange?: (device: GuideDeviceType) => void;
  showDevicePicker?: boolean;
}

export const FlashcardPanel: React.FC<FlashcardPanelProps> = ({
  steps,
  isVisible,
  onClose,
  onStepChange,
  className = '',
  deviceType = 'all',
  onDeviceTypeChange,
  showDevicePicker = false,
}) => {
  const { t } = useTranslation();
  const { setEmotion } = useAvatar();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const totalSteps = steps.length;

  useEffect(() => {
    if (steps.length > 0) {
      setActiveStep(0);
      setCompletedSteps(new Set());
      setDirection(0);
      onStepChange?.(1);
    }
  }, [steps, onStepChange]);

  useEffect(() => {
    onStepChange?.(activeStep + 1);
  }, [activeStep, onStepChange]);

  const goToNextStep = useCallback(() => {
    if (activeStep < totalSteps - 1) {
      setDirection(1);
      setCompletedSteps((prev) => new Set([...prev, activeStep]));
      setActiveStep((prev) => prev + 1);
    } else if (activeStep === totalSteps - 1) {
      setCompletedSteps((prev) => new Set([...prev, activeStep]));
      // Finishing the whole guide is worth celebrating, not just logging.
      setEmotion('excited');
      setTimeout(() => setEmotion('neutral'), 2600);
    }
  }, [activeStep, totalSteps, setEmotion]);

  const goToPreviousStep = useCallback(() => {
    if (activeStep > 0) {
      setDirection(-1);
      setActiveStep((prev) => prev - 1);
    }
  }, [activeStep]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < totalSteps) {
        setDirection(stepIndex > activeStep ? 1 : -1);
        setActiveStep(stepIndex);
      }
    },
    [totalSteps, activeStep]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPreviousStep();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, goToNextStep, goToPreviousStep, onClose]);

  if (!isVisible || steps.length === 0) return null;

  const currentStepData = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === totalSteps - 1;
  const progress = ((activeStep + 1) / totalSteps) * 100;
  const isAllCompleted = completedSteps.size === totalSteps;

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: prefersReducedMotion ? 0.12 : 0.4, ease: 'easeOut' }}
      className={`h-full min-h-0 flex flex-col bg-canvas ${className}`}
      role="region"
      aria-label="Flashcard Guide"
    >
      <div className="flex-shrink-0 p-3 flex items-center justify-between border-b border-hairline">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-5 h-5 text-brand flex-shrink-0" />
          <span className="font-display font-semibold text-ink truncate">
            {t('flashcards.stepByStepGuide', 'Step-by-Step Guide')}
          </span>
          {deviceType !== 'all' && !showDevicePicker && (
            <span className="text-[10px] text-ink-muted hidden sm:inline">
              · {GUIDE_DEVICE_LABELS[deviceType]}
            </span>
          )}
        </div>
        <motion.button
          onClick={onClose}
          className="flex-shrink-0 p-2 bg-surface border border-hairline rounded-full hover:bg-subtle transition-all focus-ring"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5 text-ink-muted" />
        </motion.button>
      </div>

      {showDevicePicker && onDeviceTypeChange && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-hairline overflow-x-auto">
          <div className="flex gap-1.5 w-max">
            {(['iphone', 'ipad', 'android-phone', 'android-tablet', 'windows', 'mac', 'chromebook', 'all'] as GuideDeviceType[]).map(
              (d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDeviceTypeChange(d)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${
                    deviceType === d ? 'bg-brand text-white border-brand' : 'border-hairline text-ink-muted'
                  }`}
                >
                  {GUIDE_DEVICE_LABELS[d]}
                </button>
              )
            )}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 flex justify-center gap-2 px-3 py-2">
        {steps.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToStep(index)}
            className={`relative rounded-full transition-all ${
              index === activeStep
                ? 'w-8 h-2.5 bg-brand'
                : completedSteps.has(index)
                  ? 'w-2.5 h-2.5 bg-accent-cool'
                  : 'w-2.5 h-2.5 bg-subtle hover:bg-brand-soft'
            }`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to step ${index + 1}`}
            aria-current={index === activeStep ? 'step' : undefined}
          />
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <FlashcardCard
            key={activeStep}
            step={currentStepData}
            stepNumber={activeStep + 1}
            totalSteps={totalSteps}
            direction={direction}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            isCompleted={completedSteps.has(activeStep)}
            deviceType={deviceType}
          />
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 p-3 border-t border-hairline bg-surface/80">
        <div className="h-1.5 bg-subtle rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.4, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <motion.button
            onClick={goToPreviousStep}
            disabled={isFirstStep}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] text-sm font-medium transition-all focus-ring ${
              isFirstStep
                ? 'bg-subtle text-ink-muted/40 cursor-not-allowed'
                : 'bg-surface text-ink border border-hairline hover:border-brand/40'
            }`}
            whileTap={isFirstStep ? {} : { scale: 0.98 }}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.previous', 'Previous')}
          </motion.button>

          <motion.button
            onClick={() => {
              if (isLastStep && isAllCompleted) onClose();
              else goToNextStep();
            }}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white focus-ring ${
              isLastStep && isAllCompleted ? 'bg-accent-cool' : 'bg-brand hover:bg-brand-strong'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {isLastStep
              ? isAllCompleted
                ? t('common.done', 'Done!')
                : t('common.finish', 'Finish')
              : t('common.next', 'Next')}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Step ${activeStep + 1} of ${totalSteps}: ${currentStepData?.content?.replace(/<[^>]*>/g, '')}`}
      </div>
    </motion.div>
  );
};

export default FlashcardPanel;
