import React, { useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Volume2, VolumeX, Check } from 'lucide-react';
import { FlashcardStep } from '../../types/services';
import MarkdownRenderer from './MarkdownRenderer';

interface FlashcardCardProps {
    step: FlashcardStep;
    stepNumber: number;
    totalSteps: number;
    direction: number; // -1 for left, 1 for right, 0 for initial
    onNext: () => void;
    onPrevious: () => void;
    isCompleted?: boolean;
    onSpeak?: (text: string) => void;
    isSpeaking?: boolean;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({
    step,
    stepNumber,
    totalSteps,
    direction,
    onNext,
    onPrevious,
    isCompleted = false,
    onSpeak,
    isSpeaking = false,
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Check for reduced motion
    const prefersReducedMotion = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Handle swipe gestures
    const handleDragEnd = useCallback((
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        setIsDragging(false);
        const threshold = 100;
        const velocity = 0.5;

        if (info.offset.x > threshold || info.velocity.x > velocity) {
            onPrevious();
        } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
            onNext();
        }
    }, [onNext, onPrevious]);

    const handleFlip = useCallback(() => {
        if (!isDragging) {
            setIsFlipped(prev => !prev);
        }
    }, [isDragging]);

    const handleSpeak = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const text = step.content.replace(/<[^>]*>/g, '');
        onSpeak?.(text);
    }, [step.content, onSpeak]);

    // Card animation variants
    const cardVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.8,
            rotateY: dir > 0 ? 15 : -15,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0,
            transition: {
                duration: prefersReducedMotion ? 0.15 : 0.5,
                ease: "easeOut" as const,
            },
        },
        exit: (dir: number) => ({
            x: dir < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.8,
            rotateY: dir < 0 ? 15 : -15,
            transition: {
                duration: prefersReducedMotion ? 0.15 : 0.4,
            },
        }),
    };

    // 3D flip variants
    const flipVariants = {
        front: {
            rotateY: 0,
            transition: { duration: prefersReducedMotion ? 0.1 : 0.6, ease: "easeOut" as const },
        },
        back: {
            rotateY: 180,
            transition: { duration: prefersReducedMotion ? 0.1 : 0.6, ease: "easeOut" as const },
        },
    };

    const hasInstructions = step.instructions && step.instructions.length > 0;

    return (
        <motion.div
            className="h-full w-full flex items-center justify-center p-4"
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag={prefersReducedMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{ perspective: 1000 }}
        >
            {/* 3D Flip Container - Fixed Aspect Ratio */}
            <motion.div
                className="relative cursor-pointer w-full max-w-2xl"
                style={{ 
                    transformStyle: 'preserve-3d',
                    aspectRatio: '4 / 3'
                }}
                animate={isFlipped ? 'back' : 'front'}
                variants={flipVariants}
                onClick={hasInstructions ? handleFlip : undefined}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            >
                {/* Front Face */}
                <motion.div
                    className="absolute inset-0 rounded-3xl overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255,255,255,0.8)',
                        border: '1px solid rgba(255,255,255,0.5)',
                    }}
                >
                    {/* Gradient Border Effect */}
                    <div
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)',
                            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            maskComposite: 'xor',
                            WebkitMaskComposite: 'xor',
                            padding: '2px',
                        }}
                    />

                    {/* Card Content - Fills Container */}
                    <div className="h-full w-full flex flex-col p-8 gap-4">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
                            {/* Step Badge */}
                            <motion.div
                                className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                                    fontSize: '0.9em'
                                }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                            >
                                Step {stepNumber} of {totalSteps}
                            </motion.div>

                            {/* Completed Badge */}
                            {isCompleted && (
                                <motion.div
                                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium"
                                    style={{ fontSize: '0.85em' }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring' }}
                                >
                                    <Check className="w-4 h-4" />
                                    Done
                                </motion.div>
                            )}

                            {/* Audio Button */}
                            <motion.button
                                onClick={handleSpeak}
                                className={`p-2 rounded-full transition-all flex-shrink-0 ${isSpeaking
                                        ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
                            >
                                {isSpeaking ? (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                    >
                                        <VolumeX className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    <Volume2 className="w-5 h-5" />
                                )}
                            </motion.button>
                        </div>

                        {/* Main Content - Flexible Height */}
                        <div className="flex-1 flex items-center justify-center min-h-0">
                            <div className="text-2xl font-medium leading-snug text-gray-800 text-center overflow-y-auto">
                                <MarkdownRenderer
                                    content={step.content.replace(/<[^>]*>/g, '')}
                                    className="prose prose-sm md:prose-base prose-indigo max-w-none"
                                />
                            </div>
                        </div>

                        {/* Flip Hint */}
                        {hasInstructions && (
                            <motion.p
                                className="text-center text-gray-400 text-sm flex-shrink-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Tap card to see detailed instructions
                            </motion.p>
                        )}
                    </div>
                </motion.div>

                {/* Back Face (Instructions) */}
                {hasInstructions && (
                    <motion.div
                        className="absolute inset-0 rounded-3xl overflow-hidden"
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.95) 0%, rgba(139,92,246,0.95) 100%)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.3), inset 0 0 0 1px rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                        }}
                    >
                        <div className="h-full w-full flex flex-col text-white p-8 gap-4">
                            {/* Back Header */}
                            <div className="flex items-center justify-between flex-shrink-0">
                                <h3 className="text-xl font-bold">Instructions</h3>
                                <span className="text-white/60 text-xs">Tap to flip back</span>
                            </div>

                            {/* Instructions List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                                <ol className="space-y-3">
                                    {step.instructions?.map((instruction, index) => (
                                        <motion.li
                                            key={index}
                                            className="flex items-start gap-3"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="text-lg leading-snug pt-0.5">{instruction}</span>
                                        </motion.li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default FlashcardCard;
