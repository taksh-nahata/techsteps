import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MistralService } from '../../services/ai';

interface FollowUpQuestionsProps {
  lastUserMessage: string;
  onQuestionClick: (question: string) => void;
  isLoading?: boolean;
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  lastUserMessage,
  onQuestionClick,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastUserMessage || isLoading) return;

    const generateFollowUpQuestions = async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const mistralService = new MistralService();
        
        // Call Mistral with a specialized prompt for generating follow-up questions
        const response = await mistralService.sendRawMessage(
          lastUserMessage,
          `You are a helpful assistant generating follow-up questions. Based on the user's question about technology, generate exactly 3-5 related follow-up questions they might want to ask. 

The questions should:
- Be specific and actionable
- Build on their previous question
- Help them learn more about the topic
- Be clear and friendly

Return ONLY a JSON object with this format (no markdown, no code blocks):
{
  "questions": ["Question 1?", "Question 2?", "Question 3?"]
}`,
          { maxTokens: 500 }
        );

        // Parse the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            setQuestions(parsed.questions.slice(0, 5)); // Limit to 5 questions
          }
        }
      } catch (err) {
        console.error('Error generating follow-up questions:', err);
        setError('Could not generate suggestions');
      } finally {
        setIsGenerating(false);
      }
    };

    generateFollowUpQuestions();
  }, [lastUserMessage, isLoading]);

  if (!questions.length && !isGenerating) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-200/50"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {t('chat.followUpSuggestions', 'You might also want to ask')}
        </span>
      </div>

      {/* Questions List */}
      {isGenerating ? (
        <div className="flex items-center gap-2 py-3 text-gray-500">
          <Loader className="w-4 h-4 animate-spin text-indigo-500" />
          <span className="text-sm">{t('chat.generatingSuggestions', 'Generating suggestions...')}</span>
        </div>
      ) : error ? (
        <p className="text-sm text-gray-500">{error}</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {questions.map((question, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onQuestionClick(question)}
                className="w-full text-left p-3 rounded-lg bg-white hover:bg-indigo-50/50 border border-indigo-100/50 hover:border-indigo-300/50 transition-all group cursor-pointer"
              >
                <p className="text-sm text-gray-700 group-hover:text-indigo-700 transition-colors font-medium">
                  {question}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default FollowUpQuestions;
