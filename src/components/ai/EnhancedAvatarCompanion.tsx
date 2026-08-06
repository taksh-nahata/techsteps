import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  const [justClicked, setJustClicked] = useState(false);
  const [idlePerk, setIdlePerk] = useState(0);
  const reduced = !!useReducedMotion();
  const burstKeyRef = useRef(0);

  const px = SIZE_PX[size];
  const markSize = embedded ? 34 : px;
  const outer = embedded ? techyCircleSize(markSize) : techyOuterBox(px);
  const colors = techyColorForState(emotion, isListening, isSpeaking, isThinking);

  const celebrating = emotion === 'happy' || emotion === 'excited';

  // Fire a little confetti-style burst whenever we enter a celebratory emotion.
  useEffect(() => {
    if (celebrating && !reduced) burstKeyRef.current += 1;
  }, [celebrating, reduced]);

  // Idle personality: an occasional "perk up" so the mark feels alive even
  // when nothing is happening, instead of sitting there doing almost nothing.
  useEffect(() => {
    if (reduced || isListening || isThinking || isSpeaking || celebrating) return;
    const id = setInterval(() => setIdlePerk((n) => n + 1), 6500);
    return () => clearInterval(id);
  }, [reduced, isListening, isThinking, isSpeaking, celebrating]);

  const wobble = useMemo(() => {
    if (isThinking) return [0, -3, 2, -2, 0];
    if (isSpeaking) return [0, -1.5, 1.5, -1, 0];
    if (isListening) return [0, -2, 2, -1, 0];
    if (emotion === 'excited') return [0, -8, 6, -6, 4, 0];
    if (emotion === 'happy') return [0, -4, 2, 0];
    if (emotion === 'concerned') return [0, -1, 1, 0];
    return [0, -1, 1, 0];
  }, [isThinking, isSpeaking, isListening, emotion]);

  const wobbleDuration = isThinking
    ? 1.2
    : isSpeaking
      ? 0.65
      : emotion === 'excited'
        ? 0.8
        : emotion === 'happy'
          ? 1.4
          : 5;

  const scaleAnim = useMemo(() => {
    if (emotion === 'excited') return [1, 1.15, 0.96, 1.08, 1];
    if (emotion === 'happy') return [1, 1.08, 1];
    if (idlePerk > 0 && !isListening && !isThinking && !isSpeaking) return [1, 1.06, 1];
    return 1;
  }, [emotion, idlePerk, isListening, isThinking, isSpeaking]);

  const defaultHint = isListening
    ? 'Listening…'
    : isThinking
      ? 'Thinking…'
      : isSpeaking
        ? 'Speaking…'
        : emotion === 'excited'
          ? 'Nailed it!'
          : emotion === 'happy'
            ? 'Glad that helped!'
            : emotion === 'concerned'
              ? "Let's try that again"
              : guideStep
                ? `Guide: step ${guideStep.current}/${guideStep.total}`
                : 'Tap to speak';

  const showHint = hint || isHovered || isListening || isThinking || isSpeaking || celebrating || guideStep;

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

      {isThinking && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 pointer-events-none"
          style={{ borderColor: colors[0] }}
          animate={{ scale: [1, 1.28, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <AnimatePresence>
        {celebrating && !reduced && (
          <div key={burstKeyRef.current} className="absolute inset-0 pointer-events-none" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
                  style={{ background: colors[i % 2 === 0 ? 0 : 1] }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * outer * 0.9,
                    y: Math.sin(angle) * outer * 0.9,
                    opacity: 0,
                    scale: 0.4,
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className={`relative cursor-pointer focus-ring flex items-center justify-center ${
          embedded ? 'rounded-full overflow-hidden bg-subtle/50 border border-hairline' : ''
        }`}
        style={{ width: outer, height: outer }}
        onClick={() => {
          if (!reduced) {
            setJustClicked(true);
            setTimeout(() => setJustClicked(false), 500);
          }
          onAvatarClick?.();
        }}
        whileTap={{ scale: 0.92 }}
        animate={{
          y: embedded && !isListening && !isThinking ? [0, -2, 0] : 0,
          scale: justClicked ? [1, 1.18, 1] : scaleAnim,
          rotate: justClicked && !reduced ? [0, -8, 8, 0] : 0,
        }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: justClicked ? 0.4 : 1.6, repeat: justClicked ? 0 : Infinity, ease: 'easeInOut' },
          rotate: { duration: 0.4, ease: 'easeInOut' },
        }}
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
                  emotion={emotion}
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
  emotion,
}: {
  index: number;
  visible: boolean;
  colors: [string, string];
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isHovered: boolean;
  emotion: string;
}) {
  if (!visible) return <div />;

  const isAnchor = index === 6;
  const visIdx = TECHY_VISIBLE.findIndex((v) => v === index);
  const delay = (visIdx >= 0 ? visIdx : 0) * 0.1;

  let scale: number | number[] = 1;
  let duration = 3.5;
  if (isListening) scale = isAnchor ? [1, 1.04, 1] : [1, 1.08, 1];
  else if (isSpeaking) { scale = isAnchor ? 1 : [0.9, 1.06, 0.9]; duration = 0.35; }
  else if (isThinking) { scale = [1, 0.94, 1.05, 1]; duration = 0.8; }
  else if (emotion === 'excited') { scale = isAnchor ? [1, 1.1, 1] : [0.85, 1.25, 0.85]; duration = 0.5; }
  else if (emotion === 'happy') { scale = [1, 1.12, 1]; duration = 1.1; }
  else if (emotion === 'concerned') { scale = [1, 0.96, 1]; duration = 2.4; }
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
        duration,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

export default EnhancedAvatarCompanion;
