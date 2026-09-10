import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardStep, ConversationContext } from '../types/services';
import { Settings, BookOpen } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Logo from '../components/layout/Logo';
import ChatInterface from '../components/ai/ChatInterface';
import FlashcardPanel from '../components/ai/FlashcardPanel';
import FlashcardLoader from '../components/ai/FlashcardLoader';
import { ttsService } from '../services/TextToSpeechService';
import { AvatarProvider, useAvatar } from '../contexts/AvatarContext';
import { parseCommand } from '../utils/CommandParser';
import { MemoryService, Message } from '../services/MemoryService';
import { LocalStorageService, Conversation } from '../services/LocalStorageService';
import { StorageService } from '../services/StorageService';
import { MistralService } from '../services/ai';
import { resolveFlashcardStepsForDevice, hasDeviceVariants, persistGeneratedGuide } from '../services/guideUtils';
import { GuideDeviceType } from '../utils/deviceDetection';
import { useUserDevice } from '../hooks/useUserDevice';
import { GuideStorageService } from '../services/GuideStorageService';
import { sanitizeFlashcardSteps } from '../services/FlashcardImageService';
import { GoogleSpeechToTextService } from '../services/GoogleSpeechToTextService';
import ChatHistorySidebar from '../components/ai/ChatHistorySidebar';

const ChatDashboardContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userData } = useUser();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state: avatarState, setEmotion, setListening, setSpeaking, setThinking, setMessage } = useAvatar();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userDevice = useUserDevice();
  const [rawFlashcardSteps, setRawFlashcardSteps] = useState<FlashcardStep[]>([]);
  const [viewDevice, setViewDevice] = useState<GuideDeviceType>(userDevice);
  const [showFlashcards, setShowFlashcards] = useState(false);
  // True only when a guide was opened via the voice screen's "See the full
  // steps" hand-off (?openGuide=) rather than by tapping a card in this
  // page's own chat thread — shows the guide full-width with chat hidden
  // entirely, instead of split next to whatever unrelated past conversation
  // happens to be loaded, since the voice screen never had a chat thread to
  // begin with.
  const [guideOnlyMode, setGuideOnlyMode] = useState(false);
  useEffect(() => {
    setViewDevice(userDevice);
  }, [userDevice]);

  // Gentle idle nudge: if there's an active conversation and nothing's
  // happening for a while, let the companion check in instead of just
  // sitting there. Clears itself as soon as the user does anything.
  useEffect(() => {
    if (messages.length === 0 || isLoading || avatarState.isListening) return;
    const idleTimer = setTimeout(() => {
      setMessage('Still here if you need me!');
    }, 50000);
    return () => clearTimeout(idleTimer);
  }, [messages, isLoading, avatarState.isListening, setMessage]);

  const flashcardSteps = useMemo(
    () => resolveFlashcardStepsForDevice(rawFlashcardSteps, viewDevice),
    [rawFlashcardSteps, viewDevice]
  );
  // AI chat guides are tailored once to the asker's own device — they never
  // carry real per-device variants, so the picker would just be a switch
  // that does nothing. Only show it when there's something to actually switch.
  const canPickDevice = useMemo(() => hasDeviceVariants(rawFlashcardSteps), [rawFlashcardSteps]);

  const [flashcardActiveStep, setFlashcardActiveStep] = useState(1);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [generatingGuideMessageId, setGeneratingGuideMessageId] = useState<string | null>(null);
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Sync TTS events with Avatar Context
  useEffect(() => {
    ttsService.setCallbacks({
      onSpeakStart: () => setSpeaking(true),
      onSpeakEnd: () => setSpeaking(false),
      onAudioLevel: () => { /* Reserved for future audio visualization */ }
    });
  }, [setSpeaking]);

  // Load History
  useEffect(() => {
    if (!user) return; // Guard against null user during logout

    const loadData = async () => {
      try {
        const userId = user.uid;
        const localHistory = LocalStorageService.getChatHistory(userId);
        if (localHistory) {
          setMessages(localHistory);
        } else {
          const history = await MemoryService.getHistory(userId);
          if (history.length > 0) {
            setMessages(history);
          } else {
            const welcomeText = t('chat.welcomeMessage', 'Hello {{name}}! I\'m here to help.', { name: userData?.firstName || 'friend' });
            const welcomeMessage: Message = { id: 'welcome', content: welcomeText, sender: 'ai', timestamp: new Date() };
            setMessages([welcomeMessage]);
            await MemoryService.saveMessage(userId, welcomeMessage);
          }
        }
        // load saved conversations
        const convs = LocalStorageService.getConversations(userId);
        setConversations(convs || []);
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Don't throw error, just continue with empty state
      }
    };
    loadData();
  }, [user, userData, t]);

  // Save messages to local storage + keep conversation history in sync
  useEffect(() => {
    const userId = user?.uid;
    if (!userId) return;

    LocalStorageService.saveChatHistory(userId, messages);

    const firstUser = messages.find((m) => m.sender === 'user');
    if (!firstUser || messages.length < 2) return;

    const timer = setTimeout(() => {
      const convId = activeConversationId || `conv-${firstUser.id}`;
      if (!activeConversationId) setActiveConversationId(convId);

      const title = firstUser.content.slice(0, 80) || 'Chat';

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === convId);
        const conv: Conversation = {
          id: convId,
          title,
          messages,
          createdAt: existing?.createdAt || new Date().toISOString(),
        };
        const updated = [conv, ...prev.filter((c) => c.id !== convId)];
        LocalStorageService.saveConversations(userId, updated);
        return updated;
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [messages, user?.uid, activeConversationId]);

  // Translate only when user explicitly views translated mode (not on every message)
  useEffect(() => {
    if (showOriginal || i18n.language === 'en' || messages.length === 0) {
      setTranslationMap({});
      return;
    }

    let cancelled = false;
    const doTranslate = async () => {
      setIsTranslating(true);
      try {
        const mistralService = new MistralService();
        const texts = messages.map((m) => m.content);
        const translated = await mistralService.translateTexts(texts, i18n.language);
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (let i = 0; i < messages.length; i++) {
          map[messages[i].id] = translated[i] || messages[i].content;
        }
        setTranslationMap(map);
      } catch {
        if (!cancelled) setTranslationMap({});
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };

    const timer = setTimeout(doTranslate, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [i18n.language, showOriginal]);

  const handleNewChat = async () => {
    try {
      setMessages([]);
      setActiveConversationId(null);
      setShowFlashcards(false);
      setRawFlashcardSteps([]);
      setActiveGuideId(null);
      setLastUserMessage('');
    } catch (e) {
      console.error('handleNewChat error:', e);
    }
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
    setActiveConversationId(conv.id);
    setShowHistory(false);
    setShowFlashcards(false);
    setActiveGuideId(null);
    setRawFlashcardSteps([]);
  };

  const handleOpenGuide = (guideId: string) => {
    const userId = user?.uid;
    if (!userId) return;
    const guide = GuideStorageService.get(userId, guideId);
    if (!guide) return;
    setActiveGuideId(guideId);
    setRawFlashcardSteps(guide.steps);
    setViewDevice(userDevice);
    setFlashcardActiveStep(1);
    setShowFlashcards(true);
  };

  // Hand-off from the voice-first home screen ("See the full steps" link):
  // it persists a guide via the same persistGeneratedGuide() helper this page
  // uses, then links here with ?openGuide=<id> so the existing guide-open path
  // just picks it up — no separate flashcard-rendering code needed there.
  useEffect(() => {
    const guideId = searchParams.get('openGuide');
    if (!guideId || !user) return;
    handleOpenGuide(guideId);
    setGuideOnlyMode(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('openGuide');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user]);

  const deleteConversation = (id: string) => {
    const userId = user?.uid || 'guest';
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    LocalStorageService.saveConversations(userId, filtered);
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async (messageContent: string, attachments: File[] = []) => {
    const userId = user?.uid || 'guest';
    setIsLoading(true);
    setThinking(true);
    setMessage(null); // clear any idle nudge — the user's back
    setLastUserMessage(messageContent); // Track the user's message for follow-up suggestions

    // 1. Check for system commands
    const command = parseCommand(messageContent);
    if (command) {
      if (command.action === 'navigate' && command.target) {
        const userMsg: Message = { id: 'cmd-' + Date.now(), content: messageContent, sender: 'user', timestamp: new Date() };
        const aiMsg: Message = { id: 'sys-' + Date.now(), content: t('chat.navigating', 'Navigating to {{target}}...', { target: command.target }), sender: 'ai', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg, aiMsg]);
        await MemoryService.saveMessage(userId, userMsg);
        await MemoryService.saveMessage(userId, aiMsg);
        setTimeout(() => navigate(command.target!), 1000);
        setIsLoading(false);
        setThinking(false);
        return;
      }
    }

    try {
      // 2. Add user message
      const userMessage: Message = {
        id: 'user-' + Date.now(),
        content: messageContent,
        sender: 'user',
        timestamp: new Date(),
        attachments: [],
      };

      if (attachments.length > 0) {
        const uploadPromises = attachments.map(file => StorageService.uploadFile(file, `users/${userId}/uploads`));
        const fileUrls = await Promise.all(uploadPromises);
        userMessage.attachments = fileUrls.map((url, index) => ({
          type: attachments[index].type.startsWith('image/') ? 'image' : 'file',
          url,
          name: attachments[index].name,
        }));
      }

      setMessages(prev => [...prev, userMessage]);
      await MemoryService.saveMessage(userId, userMessage);

      // 3. Call Mistral for all AI tasks (primary response, flashcards, summaries, and facts)
      const mistralService = new MistralService();

      // Fetch known facts for memory focus
      const knownFacts = await MemoryService.getFacts(userId);
      // const customUserData = await MemoryService.getUserData(userId); // kept for future use

      const context: ConversationContext = {
        currentPage: 'chat',
        userSkillLevel: userData?.skillLevel || 'beginner',
        failureCount: 0,
        knownFacts: knownFacts,
        guideDeviceType: userDevice,
      };

      // Primary content generation
      const mistralResponse = await mistralService.sendMessage(messageContent, context);

      const aiMessageId = 'ai-' + Date.now();
      const aiMessage: Message = {
        id: aiMessageId,
        content: mistralResponse.content,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await MemoryService.saveMessage(userId, aiMessage);

      // Brief happy flash on every successful reply — the companion should
      // visibly react to a good outcome, not just sit in one idle pose.
      setEmotion('happy');
      setTimeout(() => setEmotion('neutral'), 2200);

      // 4. Save any extracted facts and user data to the database
      if (mistralResponse.extractedFacts && mistralResponse.extractedFacts.length > 0) {
        console.log('Saving learned facts:', mistralResponse.extractedFacts);
        for (const fact of mistralResponse.extractedFacts) {
          await MemoryService.saveFact(userId, fact);
        }
      }
      if ((mistralResponse as any).userData) {
        console.log('Saving user data:', (mistralResponse as any).userData);
        await MemoryService.saveUserData(userId, (mistralResponse as any).userData);
      }

      // 5. Handle Flashcards — persist guide + show card in chat (user opens panel on click)
      if (mistralResponse.flashcards && mistralResponse.flashcards.length > 0) {
        setIsGeneratingFlashcards(true);
        setGeneratingGuideMessageId(aiMessageId);
        let guideId: string, guideTitle: string, cleaned: FlashcardStep[];
        try {
          const rawSteps = mistralResponse.flashcards as FlashcardStep[];
          let sanitized = rawSteps;
          try {
            sanitized = await sanitizeFlashcardSteps(rawSteps);
          } catch (imgErr) {
            console.warn('Flashcard sanitize failed, using text-only steps:', imgErr);
          }
          ({ guideId, guideTitle, steps: cleaned } = await persistGeneratedGuide(
            userId,
            messageContent,
            aiMessageId,
            mistralResponse,
            sanitized
          ));
        } finally {
          setIsGeneratingFlashcards(false);
          setGeneratingGuideMessageId(null);
        }

        const withGuide: Message = {
          ...aiMessage,
          guideId,
          guideTitle,
          guideStepCount: cleaned.length,
        };
        setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? withGuide : m)));
        await MemoryService.saveMessage(userId, withGuide);
      }

      // Auto TTS disabled for now — voice will be reworked separately

    } catch (e: any) {
      console.error('Chat Error:', e);
      setEmotion('concerned');
      setTimeout(() => setEmotion('neutral'), 2500);
      // Never disguise a failed answer as a real one — a cheerful non-sequitur
      // ("You're doing great!") in place of an actual answer reads as a genuine
      // response to someone who doesn't know the AI failed, which is worse than
      // no answer at all. Always say plainly that this attempt didn't work.
      const errorMsg = e.message?.includes('429')
        ? t('chat.answerFailedBusy', "I'm a bit overwhelmed right now! Please try again in a few seconds.")
        : t('chat.answerFailed', "I couldn't get an answer that time — the connection dropped. Please try asking again.");

      setMessages(prev => [...prev, { id: 'err-' + Date.now(), content: errorMsg, sender: 'ai', timestamp: new Date(), isError: true }]);
    } finally {
      setIsLoading(false);
      setThinking(false);
    }
  };

  const handleAvatarClick = () => {
    if (avatarState.isListening) setListening(false);
    else startListening();
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation happens automatically via ProtectedRoute when user becomes null
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to home
      window.location.href = '/';
    }
  };

  const startListening = async () => {
    // Prefer browser SpeechRecognition when available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      // Map i18n language to recognition.lang (simple mapping, extend as needed)
      const langMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        pt: 'pt-PT'
      };
      recognition.lang = langMap[i18n.language] || `${i18n.language}-US`;
      recognition.onstart = () => {
        setListening(true);
        setCurrentTranscript('');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentTranscript(transcript);
        if (event.results[0].isFinal) {
          handleSendMessage(transcript);
        }
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        setListening(false);
      };
      recognition.start();
      return;
    }

    // Fallback: record 4 seconds and send to Google STT
    try {
      setCurrentTranscript(t('chat.speechRecording', 'Recording...'));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.start();

      setListening(true);
      await new Promise(resolve => setTimeout(resolve, 4000));
      mediaRecorder.stop();

      const stopped = new Promise<void>(resolve => {
        mediaRecorder.onstop = () => resolve();
      });
      await stopped;

      const blob = new Blob(chunks, { type: chunks[0] ? (chunks[0] as Blob).type : 'audio/webm' });
      stream.getTracks().forEach(t => t.stop());
      setCurrentTranscript('');
      setListening(false);

      const langMap: Record<string, string> = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        pt: 'pt-PT'
      };
      const languageCode = langMap[i18n.language] || `${i18n.language}-US`;
      const transcript = await GoogleSpeechToTextService.transcribeAudio(blob, languageCode);
      if (transcript) {
        handleSendMessage(transcript);
      }
    } catch (e) {
      console.warn('Fallback STT failed:', e);
      setListening(false);
      setCurrentTranscript('');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-canvas text-ink">
      <ChatHistorySidebar
        conversations={conversations}
        isOpen={showHistory}
        onLoad={loadConversation}
        onDelete={deleteConversation}
        onToggle={() => setShowHistory(!showHistory)}
      />
      <header className="shrink-0 w-full z-20 px-4 md:px-8 h-14 flex justify-between items-center border-b border-hairline bg-surface/90 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 focus-ring rounded-pill min-w-0" aria-label="TechSteps home">
          <Logo size="md" showText responsiveText />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/guide-editor" aria-label="Guide library" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-ink hover:bg-subtle transition-colors focus-ring" title="Guide library">
            <BookOpen className="w-5 h-5" />
          </Link>
          <Link to="/settings" aria-label="Settings" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-ink hover:bg-subtle transition-colors focus-ring">
            <Settings className="w-5 h-5" />
          </Link>
          <button onClick={handleLogout} aria-label="Log out" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-ink hover:bg-subtle transition-colors focus-ring">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 w-full flex flex-col lg:flex-row gap-3 md:gap-4 px-3 md:px-8 pb-3 md:pb-4">
        {/* Below the lg breakpoint, chat and the guide panel used to split height
            50/50 regardless of content, which crammed the guide's device tabs,
            progress dots, card, and nav into a box barely taller than its own
            content. Below lg, showing the guide now fully replaces chat instead
            of squeezing beside it; closing the guide brings chat back. */}
        <div className={`flex-1 min-h-0 min-w-0 surface-card rounded-card overflow-hidden flex flex-col ${guideOnlyMode ? 'hidden' : showFlashcards ? 'hidden lg:flex lg:w-1/2' : 'w-full'}`}>
          <ChatInterface
            className="flex-1 min-h-0"
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isListening={avatarState.isListening}
            currentTranscript={currentTranscript}
            onNewChat={handleNewChat}
            onOpenHistory={() => setShowHistory(!showHistory)}
            onAvatarClick={handleAvatarClick}
            translationMap={translationMap}
            isTranslating={isTranslating}
            showOriginal={showOriginal}
            onToggleOriginal={() => setShowOriginal(!showOriginal)}
            lastUserMessage={lastUserMessage}
            onFollowUpClick={(q) => handleSendMessage(q)}
            showFollowUps={!showFlashcards}
            guideStep={
              showFlashcards && flashcardSteps.length > 0
                ? { current: flashcardActiveStep, total: flashcardSteps.length }
                : undefined
            }
            onOpenGuide={handleOpenGuide}
            activeGuideId={activeGuideId}
            generatingGuideMessageId={generatingGuideMessageId}
            showFlashcardPanel={showFlashcards}
          />
        </div>

        {showFlashcards && (
          <div className={`flex-1 min-h-0 min-w-0 surface-card rounded-card overflow-hidden ${guideOnlyMode ? 'w-full' : 'lg:w-1/2'}`}>
            {isGeneratingFlashcards || flashcardSteps.length === 0 ? (
              <div className="h-full min-h-[280px] flex items-center justify-center">
                <FlashcardLoader isVisible message="Preparing your visual guide…" />
              </div>
            ) : (
              <FlashcardPanel
                steps={flashcardSteps}
                isVisible
                deviceType={viewDevice}
                onDeviceTypeChange={setViewDevice}
                showDevicePicker={canPickDevice}
                onClose={() => {
                  setShowFlashcards(false);
                  setActiveGuideId(null);
                  // Came in from the voice screen with no chat thread behind
                  // it — closing should send them back there, not reveal
                  // whatever unrelated conversation happened to be loaded.
                  if (guideOnlyMode) {
                    setGuideOnlyMode(false);
                    navigate('/talk');
                  }
                }}
                onStepChange={setFlashcardActiveStep}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatDashboard: React.FC = () => (
  <AvatarProvider>
    <ChatDashboardContent />
  </AvatarProvider>
);

export default ChatDashboard;