import React from 'react';
import { motion } from 'framer-motion';
import { ListChecks, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GuidePromptCardProps {
  title: string;
  stepCount: number;
  isOpen?: boolean;
  onOpen: () => void;
}

const GuidePromptCard: React.FC<GuidePromptCardProps> = ({
  title,
  stepCount,
  isOpen = false,
  onOpen,
}) => {
  const { t } = useTranslation();

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="mt-4 w-full text-left rounded-[16px] border border-brand/25 bg-brand-soft/40 hover:bg-brand-soft/70 transition-colors p-4 focus-ring group"
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
          <ListChecks className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand">
            {t('flashcards.stepByStepGuide', 'Step-by-Step Guide')}
          </p>
          <p className="mt-1 font-display font-bold text-ink truncate">{title}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {t('flashcards.stepCount', '{{count}} steps — tap to open', { count: stepCount })}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-brand mt-2 group-hover:translate-x-0.5 transition-transform" />
      </div>
      {isOpen && (
        <p className="mt-2 text-xs font-medium text-accent-cool">
          {t('flashcards.guideOpen', 'Guide is open on the right')}
        </p>
      )}
    </motion.button>
  );
};

export default GuidePromptCard;
