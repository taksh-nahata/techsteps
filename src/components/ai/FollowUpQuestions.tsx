import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FollowUpQuestionsProps {
  lastUserMessage: string;
  onQuestionClick: (question: string) => void;
  isLoading?: boolean;
}

function buildStaticFollowUps(message: string): string[] {
  if (!message.trim()) return [];
  return [
    `Can you break that into steps?`,
    `Is there an easier way?`,
    `Can you show me with a picture?`,
  ];
}

/** Compact horizontal chips — sits above input without shrinking the chat. */
const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  lastUserMessage,
  onQuestionClick,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const questions = useMemo(
    () => (isLoading ? [] : buildStaticFollowUps(lastUserMessage)),
    [lastUserMessage, isLoading]
  );

  if (!questions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 border-t border-hairline/60 bg-canvas/80 px-2 py-1.5"
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <Lightbulb className="w-3.5 h-3.5 text-brand flex-shrink-0" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted flex-shrink-0 hidden sm:inline">
          {t('chat.followUpSuggestions', 'Try asking')}
        </span>
        {questions.map((question, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onQuestionClick(question)}
            className="flex-shrink-0 whitespace-nowrap rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-ink hover:bg-brand-soft hover:border-brand/40 transition-colors focus-ring"
          >
            {question}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default FollowUpQuestions;
