import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FlashcardStep } from '../../types/services';
import FlashcardCard from './FlashcardCard';

interface FlashcardPanelProps {
  steps: FlashcardStep[];
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const FlashcardPanel: React.FC<FlashcardPanelProps> = ({
  steps,
  isVisible,
  onClose,
  className = ''
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [direction, setDirection] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const totalSteps = steps.length;

  // Reset when new steps arrive
  useEffect(() => {
    if (steps.length > 0) {
      setActiveStep(0);
      setCompletedSteps(new Set());
      setDirection(0);
    }
  }, [steps]);

  // Keyboard navigation
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
  }, [isVisible, activeStep, totalSteps, onClose]);

  if (!isVisible || steps.length === 0) return null;

  // Navigation handlers
  const goToNextStep = useCallback(() => {
    if (activeStep < totalSteps - 1) {
      setDirection(1);
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      setActiveStep(prev => prev + 1);
    } else if (activeStep === totalSteps - 1) {
      // Mark final step as completed
      setCompletedSteps(prev => new Set([...prev, activeStep]));
    }
  }, [activeStep, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    if (activeStep > 0) {
      setDirection(-1);
      setActiveStep(prev => prev - 1);
    }
  }, [activeStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setDirection(stepIndex > activeStep ? 1 : -1);
      setActiveStep(stepIndex);
    }
  }, [totalSteps, activeStep]);

  // Text-to-speech
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking]);

  const currentStepData = steps[activeStep];
  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === totalSteps - 1;
  const progress = ((activeStep + 1) / totalSteps) * 100;
  const isAllCompleted = completedSteps.size === totalSteps;

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: prefersReducedMotion ? 0.15 : 0.5, ease: "easeOut" }}
      className={`h-full flex flex-col relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(249,250,251,0.95) 0%, rgba(243,244,246,0.95) 100%)',
        backdropFilter: 'blur(20px)',
      }}
      role="region"
      aria-label="Flashcard Guide"
    >
      {/* Decorative Background Elements */}
      {!prefersReducedMotion && (
        <>
          <motion.div
            className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-indigo-200/30 blur-3xl pointer-events-none"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-10%] left-[-10%] w-48 h-48 rounded-full bg-purple-200/30 blur-3xl pointer-events-none"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-gray-700">
            {t('flashcards.stepByStepGuide', 'Step-by-Step Guide')}
          </span>
        </div>

        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5 text-gray-600" />
        </motion.button>
      </div>

      {/* Progress Dots */}
      <div className="relative z-10 flex justify-center gap-2 px-4 py-2">
        {steps.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToStep(index)}
            className={`relative rounded-full transition-all ${index === activeStep
                ? 'w-8 h-3 bg-gradient-to-r from-indigo-500 to-purple-500'
                : completedSteps.has(index)
                  ? 'w-3 h-3 bg-green-400'
                  : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
              }`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to step ${index + 1}`}
            aria-current={index === activeStep ? 'step' : undefined}
          >
            {completedSteps.has(index) && index !== activeStep && (
              <motion.span
                className="absolute inset-0 flex items-center justify-center text-white text-xs"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ✓
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Card Container */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <FlashcardCard
            key={activeStep}
            step={currentStepData}
            stepNumber={activeStep + 1}
            totalSteps={totalSteps}
            direction={direction}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            isCompleted={completedSteps.has(activeStep)}
            onSpeak={speakText}
            isSpeaking={isSpeaking}
          />
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="relative z-10 p-4">
        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <motion.button
            onClick={goToPreviousStep}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all ${isFirstStep
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 shadow-lg hover:shadow-xl border border-gray-200 hover:border-gray-300'
              }`}
            whileHover={isFirstStep ? {} : { x: -3 }}
            whileTap={isFirstStep ? {} : { scale: 0.98 }}
          >
            <ChevronLeft className="w-5 h-5" />
            {t('common.previous', 'Previous')}
          </motion.button>

          <motion.button
            onClick={() => {
              if (isLastStep && isAllCompleted) {
                onClose();
              } else {
                goToNextStep();
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white shadow-lg hover:shadow-xl transition-all"
            style={{
              background: isLastStep && isAllCompleted
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            }}
            whileHover={{ x: 3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLastStep
              ? (isAllCompleted ? t('common.done', 'Done!') : t('common.finish', 'Finish'))
              : t('common.next', 'Next')
            }
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
            {isLastStep && isAllCompleted && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                🎉
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Step ${activeStep + 1} of ${totalSteps}: ${currentStepData?.content?.replace(/<[^>]*>/g, '')}`}
      </div>
    </motion.div>
  );
};

export default FlashcardPanel;