import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatar } from '../../contexts/AvatarContext';
import TechyMark from '../layout/TechyMark';
import {
  TECHY_PIVOT,
  TECHY_ROTATE_DEG,
  TECHY_TILE_RADIUS,
  TECHY_VISIBLE,
  techyCircleSize,
  techyColorForState,
  techyOuterBox,
} from '../layout/techyShared';

interface EnhancedAvatarCompanionProps {
  onAvatarClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  embedded?: boolean;
  guideStep?: { current: number; total: number };
  hint?: string | null;
}

const SIZE_PX = { sm: 44, md: 72, lg: 96 };

const EnhancedAvatarCompanion: React.FC<EnhancedAvatarCompanionProps> = ({
  onAvatarClick,
  size = 'md',
  className = '',
  embedded = false,
  guideStep,
  hint,
}) => {
  const { state } = useAvatar();
  const { isListening, isSpeaking, isThinking, emotion } = state;
  const [isHovered, setIsHovered] = useState(false);

  const px = SIZE_PX[size];
  const markSize = embedded ? 34 : px;
  const outer = embedded ? techyCircleSize(markSize) : techyOuterBox(px);
  const colors = techyColorForState(emotion, isListening, isSpeaking, isThinking);

  const wobble = useMemo(() => {
    if (isThinking) return [0, -3, 2, 0];
    if (isSpeaking) return [0, -1.5, 1.5, 0];
    if (isListening) return [0, -2, 2, -1, 0];
    return [0, -1, 1, 0];
  }, [isThinking, isSpeaking, isListening]);

  const wobbleDuration = isThinking ? 1.2 : isSpeaking ? 0.65 : 5;

  const defaultHint = isListening
    ? 'Listening…'
    : isThinking
      ? 'Thinking…'
      : isSpeaking
        ? 'Speaking…'
        : guideStep
          ? `Guide: step ${guideStep.current}/${guideStep.total}`
          : 'Tap to speak';

  const showHint = hint || isHovered || isListening || isThinking || isSpeaking || guideStep;

  return (
    <div
      className={`relative flex flex-col items-center ${className}`}
      style={{ width: outer, height: embedded ? outer : outer + 8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {embedded && showHint && (
          <motion.span
            key={hint || defaultHint}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 text-[10px] font-semibold text-brand px-2 py-0.5 rounded-full bg-surface border border-brand/30 shadow-micro pointer-events-none"
          >
            {hint || defaultHint}
          </motion.span>
        )}
      </AnimatePresence>

      {isListening && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-brand/50 pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <motion.button
        type="button"
        className={`relative cursor-pointer focus-ring flex items-center justify-center ${
          embedded ? 'rounded-full overflow-hidden bg-subtle/50 border border-hairline' : ''
        }`}
        style={{ width: outer, height: outer }}
        onClick={onAvatarClick}
        whileTap={{ scale: 0.92 }}
        animate={{ y: embedded && !isListening && !isThinking ? [0, -2, 0] : 0 }}
        transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
        aria-label="Talk to Techy — tap to speak"
      >
        {embedded ? (
          <motion.div
            animate={{ rotate: wobble }}
            transition={{ duration: wobbleDuration, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: TECHY_PIVOT }}
          >
            <TechyMark size={markSize} />
          </motion.div>
        ) : (
          <motion.div
            className="relative flex items-center justify-center"
            style={{ width: outer, height: outer, transformOrigin: TECHY_PIVOT }}
            animate={{ rotate: wobble }}
            transition={{ duration: wobbleDuration, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div
              className="grid grid-cols-3"
              style={{
                width: px,
                height: px,
                gap: px * 0.07,
                transform: `rotate(${TECHY_ROTATE_DEG}deg)`,
                transformOrigin: TECHY_PIVOT,
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <TechyTile
                  key={i}
                  index={i}
                  visible={TECHY_VISIBLE.includes(i as (typeof TECHY_VISIBLE)[number])}
                  colors={colors}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isThinking={isThinking}
                  isHovered={isHovered}
                />
              ))}
            </div>
            <div
              className="absolute rounded-full bg-brand-strong pointer-events-none"
              style={{
                width: Math.max(3, px * 0.07),
                height: Math.max(3, px * 0.07),
                left: outer * 0.2,
                bottom: outer * 0.18,
              }}
            />
          </motion.div>
        )}

        {guideStep && (
          <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(194,80,46,0.15)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#c2502e"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(guideStep.current / guideStep.total) * 289} 289`}
              transform="rotate(-90 50 50)"
            />
          </svg>
        )}
      </motion.button>

      {!embedded && showHint && (
        <motion.span
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {hint || defaultHint}
        </motion.span>
      )}
    </div>
  );
};

function TechyTile({
  index,
  visible,
  colors,
  isListening,
  isSpeaking,
  isThinking,
  isHovered,
}: {
  index: number;
  visible: boolean;
  colors: [string, string];
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isHovered: boolean;
}) {
  if (!visible) return <div />;

  const isAnchor = index === 6;
  const visIdx = TECHY_VISIBLE.findIndex((v) => v === index);
  const delay = (visIdx >= 0 ? visIdx : 0) * 0.1;

  let scale: number | number[] = 1;
  if (isListening) scale = isAnchor ? [1, 1.04, 1] : [1, 1.08, 1];
  else if (isSpeaking) scale = isAnchor ? 1 : [0.92, 1, 0.92];
  else if (isThinking) scale = [1, 0.95, 1.03, 1];
  else if (isHovered) scale = [1, 1.05, 1];

  return (
    <motion.div
      style={{
        borderRadius: TECHY_TILE_RADIUS[index],
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
        boxShadow: isThinking ? `0 0 10px ${colors[0]}55` : `0 2px 6px ${colors[0]}30`,
      }}
      animate={{ scale }}
      transition={{
        duration: isSpeaking ? 0.35 : isThinking ? 0.8 : 3.5,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

export default EnhancedAvatarCompanion;
