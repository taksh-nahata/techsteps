import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, Square, Loader2, Settings, LogOut } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/layout/Logo';
import { useUserDevice } from '../hooks/useUserDevice';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ttsService } from '../services/TextToSpeechService';
import { getAIService } from '../services/ai';
import { ConversationContext } from '../types/services';
import { MemoryService } from '../services/MemoryService';
import { persistGeneratedGuide } from '../services/guideUtils';
import { sanitizeFlashcardSteps } from '../services/FlashcardImageService';
import { FlashcardStep } from '../types/services';
import { MarkdownRenderer } from '../components/ai/MarkdownRenderer';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Strips markdown and list-marker syntax before handing text to TTS. Guide
 * answers in particular are numbered lists ("1. Click X\n2. Click Y") that,
 * read verbatim, come out as a run-on "one click x two click y" with no
 * pacing -- this is a defense-in-depth cleanup for any text reaching speech,
 * on top of never speaking a full guide's list at all (see the flashcards
 * branch below).
 */
function stripForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VoiceHomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userData } = useUser();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userDevice = useUserDevice();

  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [caption, setCaption] = useState(
    t('voiceHome.greeting', "Tap the button and ask me anything — I'm listening.")
  );
  const [errorText, setErrorText] = useState<string | null>(null);
  const [guideOffer, setGuideOffer] = useState<{ guideId: string; stepCount: number } | null>(null);

  // Governs whether finishing speaking automatically starts listening again —
  // a ref (not just state) because the TTS promise's `finally` reads it after
  // an async gap, where a stale closure over state could re-enable a loop the
  // user just stopped.
  const autoContinueRef = useRef(false);

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      const trimmed = transcript.trim();
      if (!trimmed) {
        if (autoContinueRef.current) startListening();
        return;
      }

      setErrorText(null);
      setGuideOffer(null);
      setCaption(trimmed);
      setIsThinking(true);

      const userId = user?.uid || 'guest';
      try {
        const knownFacts = await MemoryService.getFacts(userId);
        const context: ConversationContext = {
          currentPage: 'voice',
          userSkillLevel: userData?.skillLevel || 'beginner',
          failureCount: 0,
          knownFacts,
          guideDeviceType: userDevice,
        };
        const response = await getAIService().sendMessage(trimmed, context);
        setIsThinking(false);
        setCaption(response.content);

        if (response.flashcards && response.flashcards.length > 0) {
          const rawSteps = response.flashcards as FlashcardStep[];
          let sanitized = rawSteps;
          try {
            sanitized = await sanitizeFlashcardSteps(rawSteps);
          } catch (imgErr) {
            console.warn('Flashcard sanitize failed, using text-only steps:', imgErr);
          }
          const { guideId } = await persistGeneratedGuide(
            userId,
            trimmed,
            `voice-${Date.now()}`,
            response,
            sanitized
          );
          setGuideOffer({ guideId, stepCount: sanitized.length });
        }

        // A guide's spoken_text often isn't populated distinctly from its
        // numbered-list content -- reading that list aloud verbatim sounds
        // terrible (no pacing, digits read as "one point"), so speak a short
        // fixed summary instead and let the linked page carry the real steps.
        const spokenText =
          response.flashcards && response.flashcards.length > 0
            ? t('voiceHome.guideSpokenSummary', "I've put together {{count}} steps for you. Tap below to see them.", {
                count: response.flashcards.length,
              })
            : stripForSpeech(response.spokenText || response.content);
        try {
          setIsSpeaking(true);
          await ttsService.speak(spokenText, { lang: i18n.language });
        } catch (speakErr) {
          // Speaking failed (e.g. TTS network error) — the caption text above
          // already has the answer, so this is a degraded experience, not a
          // dead end.
          console.warn('TTS speak failed:', speakErr);
        } finally {
          setIsSpeaking(false);
          if (autoContinueRef.current) startListening();
        }
      } catch (e: any) {
        console.error('Voice assist error:', e);
        setIsThinking(false);
        setCaption(
          e?.message?.includes('429')
            ? t('chat.answerFailedBusy', "I'm a bit overwhelmed right now! Please try again in a few seconds.")
            : t('chat.answerFailed', "I couldn't get an answer that time — the connection dropped. Please try asking again.")
        );
        setErrorText('error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, userData, userDevice, i18n.language, t]
  );

  const { isListening, interimTranscript, startListening, stopListening } = useSpeechRecognition({
    language: i18n.language,
    recordingLabel: t('chat.speechRecording', 'Recording...'),
    onFinalTranscript: handleFinalTranscript,
  });

  const phase: Phase = isListening ? 'listening' : isThinking ? 'thinking' : isSpeaking ? 'speaking' : 'idle';
  const isActive = phase !== 'idle';

  const handleMicButtonClick = () => {
    if (isActive) {
      autoContinueRef.current = false;
      stopListening();
      ttsService.stop();
      setIsSpeaking(false);
      setIsThinking(false);
      return;
    }
    autoContinueRef.current = true;
    setErrorText(null);
    startListening();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  // Live caption while listening; the AI's own answer text otherwise.
  const displayCaption =
    phase === 'listening'
      ? interimTranscript || t('voiceHome.listening', 'Listening…')
      : phase === 'thinking'
        ? t('voiceHome.thinking', 'Thinking…')
        : caption;

  const micLabel =
    phase === 'idle'
      ? t('voiceHome.talkToMe', 'Talk to me')
      : t('voiceHome.stop', 'Stop');

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-canvas text-ink">
      <header className="shrink-0 w-full z-20 px-4 md:px-8 h-14 flex justify-between items-center border-b border-hairline bg-surface/90 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 focus-ring rounded-pill min-w-0" aria-label="TechSteps home">
          <Logo size="md" showText responsiveText />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-ink hover:bg-subtle transition-colors focus-ring">
            <Settings className="w-5 h-5" />
          </Link>
          <button onClick={handleLogout} aria-label="Log out" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-ink hover:bg-subtle transition-colors focus-ring">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full flex flex-col items-center justify-center gap-8 px-6 py-8 text-center">
        <button
          onClick={handleMicButtonClick}
          aria-label={micLabel}
          className={`relative flex items-center justify-center rounded-full transition-all duration-250 shadow-senior-lg touch-target
            w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48
            ${isActive ? 'bg-error-500 hover:bg-error-600' : 'bg-brand hover:bg-brand-strong'}
          `}
        >
          {phase === 'thinking' ? (
            <Loader2 className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white animate-spin" />
          ) : isActive ? (
            <Square className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" fill="currentColor" />
          ) : (
            <Mic className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white" />
          )}
          {phase === 'listening' && (
            <span className="absolute inset-0 rounded-full border-4 border-brand animate-pulse-slow" />
          )}
        </button>

        <div
          className="text-lg sm:text-xl md:text-2xl font-medium max-w-xl leading-relaxed"
          role="status"
          aria-live="polite"
        >
          {phase === 'listening' || phase === 'thinking' ? (
            displayCaption
          ) : (
            <MarkdownRenderer content={displayCaption} />
          )}
        </div>

        {guideOffer && (
          <Link
            to={`/chat?openGuide=${guideOffer.guideId}`}
            className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3"
          >
            {t('voiceHome.seeFullSteps', 'See the full {{count}} steps', { count: guideOffer.stepCount })}
          </Link>
        )}

        <Link
          to="/chat"
          className="text-base md:text-lg text-ink-muted hover:text-brand underline underline-offset-4 transition-colors focus-ring"
        >
          {t('voiceHome.typeInstead', 'Type instead')}
        </Link>

        {errorText && (
          <button
            onClick={handleMicButtonClick}
            className="btn-secondary px-5 py-2 text-base"
          >
            {t('voiceHome.tryAgain', 'Try again')}
          </button>
        )}
      </main>
    </div>
  );
};

export default VoiceHomePage;
