import React, { useState, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Volume2, VolumeX, Check, ArrowUp, ThumbsUp, ThumbsDown } from 'lucide-react';
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
            className="absolute inset-0 flex items-center justify-center p-4"
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
            {/* 3D Flip Container */}
            <motion.div
                className="relative w-full max-w-2xl cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                animate={isFlipped ? 'back' : 'front'}
                variants={flipVariants}
                onClick={hasInstructions ? handleFlip : undefined}
                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
            >
                {/* Front Face */}
                <motion.div
                    className="relative rounded-3xl overflow-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5) inset',
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

                    {/* Card Content */}
                    <div className="p-8 min-h-[300px] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            {/* Step Badge */}
                            <motion.div
                                className="px-4 py-2 rounded-full text-sm font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    color: 'white',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
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
                                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
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
                                className={`p-3 rounded-full transition-all ${isSpeaking
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



                        {/* Main Content */}
                        {/* Main Content - Split Layout */}
                        <div className="flex-1 w-full flex flex-col md:flex-row gap-6 items-center justify-center p-2">
                            {/* Visual Side */}
                            {step.image ? (
                                <div className="w-full md:w-1/2 h-48 md:h-full max-h-[300px] relative flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100/50 p-2">
                                    <img
                                        src={step.image}
                                        alt="Step visual"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                    {step.annotations?.map((anno, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                            style={{ left: `${anno.x}%`, top: `${anno.y}%` }}
                                        >
                                            {anno.label ? (
                                                <div className="px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-md shadow-lg border border-transparent"
                                                    style={{
                                                        backgroundColor: anno.color || '#ef4444',
                                                        color: 'white',
                                                        transform: `scale(${anno.size || 1})`
                                                    }}
                                                >
                                                    {anno.label}
                                                </div>
                                            ) : anno.type === 'circle' ? (
                                                <div className="relative">
                                                    <div
                                                        className="rounded-full border-4 shadow-[0_0_15px_rgba(0,0,0,0.3)] animate-pulse"
                                                        style={{
                                                            width: `${3 * (anno.size || 1)}rem`,
                                                            height: `${3 * (anno.size || 1)}rem`,
                                                            borderColor: anno.color || '#ef4444'
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <ArrowUp
                                                    className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] stroke-[3] animate-bounce"
                                                    style={{
                                                        color: anno.color || '#ef4444',
                                                        width: `${3 * (anno.size || 1)}rem`,
                                                        height: `${3 * (anno.size || 1)}rem`
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {/* Text Side */}
                            <div className={`${step.image ? 'w-full md:w-1/2 text-left' : 'w-full text-center'} flex flex-col justify-center`}>
                                <div className={`font-medium leading-relaxed text-gray-800 ${step.image ? 'text-lg' : 'text-2xl md:text-3xl'}`}>
                                    <MarkdownRenderer
                                        content={step.content.replace(/<[^>]*>/g, '')}
                                        className="prose prose-indigo max-w-none break-words"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-medium">Was this helpful?</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => alert("Thanks for the feedback! (Simulated Save)")}
                                    className="p-2 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                                    title="Yes, this helped"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => alert("We'll work on improving this guide. (Simulated Save)")}
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                    title="No, didn't work"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
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
                            boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.3)',
                        }}
                    >
                        <div className="p-8 h-full flex flex-col text-white">
                            {/* Back Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Instructions</h3>
                                <span className="text-white/60 text-sm">Tap to flip back</span>
                            </div>

                            {/* Instructions List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <ol className="space-y-4">
                                    {step.instructions?.map((instruction, index) => (
                                        <motion.li
                                            key={index}
                                            className="flex items-start gap-3"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="text-lg leading-relaxed">{instruction}</span>
                                        </motion.li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Swipe Hint Overlay */}
            {!prefersReducedMotion && (
                <motion.div
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-gray-400 text-sm pointer-events-none"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.6, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <motion.span
                        animate={{ x: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        ←
                    </motion.span>
                    <span>Swipe to navigate</span>
                    <motion.span
                        animate={{ x: [5, -5, 5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        →
                    </motion.span>
                </motion.div>
            )}
        </motion.div>
    );
};

export default FlashcardCard;
