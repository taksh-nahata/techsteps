import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SkillAssessmentResult } from '../../types/learning';

interface SkillAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: SkillAssessmentResult) => void;
}

const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const questions = [
    {
      question: "How comfortable are you with turning a computer or phone on and off?",
      options: ["Never done it", "Need help every time", "Can do it sometimes", "Very comfortable"]
    },
    {
      question: "How often do you use the internet?",
      options: ["Never", "Rarely", "Sometimes", "Daily"]
    },
    {
      question: "Have you ever sent an email?",
      options: ["Never", "With lots of help", "A few times", "Regularly"]
    }
  ];

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate skill level based on answers
      const avgScore = newAnswers.reduce((a, b) => a + b, 0) / newAnswers.length;
      const skillLevel = avgScore < 1 ? 'Beginner' : avgScore < 2 ? 'Intermediate' : 'Advanced';

      onComplete({
        skillLevel: skillLevel as 'Beginner' | 'Intermediate' | 'Advanced',
        recommendedStartingPathId: skillLevel === 'Beginner' ? 'fundamentals' :
          skillLevel === 'Intermediate' ? 'onlineWorld' : 'digitalLife',
        completedAt: new Date()
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card rounded-card max-w-2xl w-full p-6 sm:p-8 relative border border-hairline shadow-senior-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-muted hover:text-ink focus-ring rounded-full p-1"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-display text-2xl font-bold text-ink mb-2">Quick Skill Check</h2>
        <p className="text-ink-muted mb-6">Let's find the best place for you to start!</p>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-ink-muted mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
          </div>
          <div className="w-full bg-subtle rounded-full h-2">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-2">
          <h3 className="font-display text-xl font-bold text-ink mb-4">
            {questions[currentQuestion].question}
          </h3>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full text-left p-4 border-2 border-hairline rounded-xl hover:border-brand/50 hover:bg-brand-soft transition-all focus-ring"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillAssessmentModal;
