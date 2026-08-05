import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardStep, ConversationContext } from '../types/services';
import { TroubleshootingGuide } from '../types/guides';
import { Settings, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
import { guideToFlashcardSteps, resolveFlashcardStepsForDevice } from '../services/guideUtils';
import { GuideDeviceType } from '../utils/deviceDetection';
import { useUserDevice } from '../hooks/useUserDevice';
import { sanitizeFlashcardSteps } from '../services/FlashcardImageService';
import { GuideStorageService } from '../services/GuideStorageService';
import { GoogleSpeechToTextService } from '../services/GoogleSpeechToTextService';
import ChatHistorySidebar from '../components/ai/ChatHistorySidebar';

const ChatDashboardContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userData } = useUser();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state: avatarState, setEmotion, setListening, setSpeaking, setThinking } = useAvatar();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userDevice = useUserDevice();
  const [rawFlashcardSteps, setRawFlashcardSteps] = useState<FlashcardStep[]>([]);
  const [viewDevice, setViewDevice] = useState<GuideDeviceType>(userDevice);
  const [showFlashcards, setShowFlashcards] = useState(false);
  useEffect(() => {
    setViewDevice(userDevice);
  }, [userDevice]);

  const flashcardSteps = useMemo(
    () => resolveFlashcardStepsForDevice(rawFlashcardSteps, viewDevice),
    [rawFlashcardSteps, viewDevice]
  );

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

  // Historical methods (kept for reference or future use)
  const _openHistory = () => setShowHistory(true);
  const _closeHistory = () => setShowHistory(false);

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
        const rawSteps = mistralResponse.flashcards as FlashcardStep[];
        let cleaned = rawSteps;
        try {
          cleaned = await sanitizeFlashcardSteps(rawSteps);
        } catch (imgErr) {
          console.warn('Flashcard sanitize failed, using text-only steps:', imgErr);
        } finally {
          setIsGeneratingFlashcards(false);
          setGeneratingGuideMessageId(null);
        }

        const guideId = `guide-${Date.now()}`;
        const guideTitle =
          messageContent.slice(0, 60) + (messageContent.length > 60 ? '…' : '') || 'Step-by-step guide';

        GuideStorageService.save(userId, {
          id: guideId,
          messageId: aiMessageId,
          title: guideTitle,
          steps: cleaned,
          createdAt: new Date().toISOString(),
        });

        const withGuide: Message = {
          ...aiMessage,
          guideId,
          guideTitle,
          guideStepCount: cleaned.length,
        };
        setMessages((prev) => prev.map((m) => (m.id === aiMessageId ? withGuide : m)));
        await MemoryService.saveMessage(userId, withGuide);

        // ========== NEW: Save to Pending Review Workflow ==========
        // Only save if it's a fresh generation (not from cache)
        if (mistralResponse.metadata?.model !== 'cached-guide') {
          console.log('🤖 New AI generation detected. Saving to pending review...');
          const newGuide: TroubleshootingGuide = {
            id: `ai-${Date.now()}`,
            title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
            problemDescription: mistralResponse.content.slice(0, 200) + (mistralResponse.content.length > 200 ? '...' : ''),
            keywords: messageContent.toLowerCase().split(/\W+/).filter(w => w.length > 3),
            category: 'ai-chat',
            steps: mistralResponse.flashcards.map((f: any) => {
              const step: Record<string, unknown> = {
                id: f.id || `step-${Date.now()}`,
                title: f.title || '',
                content: f.content || '',
              };
              if (f.image) step.image = f.image;
              if (f.imageCaption) step.imageCaption = f.imageCaption;
              if (f.annotations?.length) step.annotations = f.annotations;
              return step;
            }),
            meta: {
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              source: 'ai-chat',
              originalQuery: messageContent,
              confidenceScore: mistralResponse.confidence || 0.8,
              difficulty: 'Medium'
            }
          };
          await MemoryService.savePendingGuide(newGuide);
        }
      }

      // Auto TTS disabled for now — voice will be reworked separately

    } catch (e: any) {
      console.error('Chat Error:', e);
      setEmotion('concerned');
      const encouragement = t('encouragement', { returnObjects: true }) as string[];
      const randomEncouragement = encouragement[Math.floor(Math.random() * encouragement.length)];
      const errorMsg = e.message?.includes('429')
        ? "I'm a bit overwhelmed right now! Please try again in a few seconds."
        : randomEncouragement;

      setMessages(prev => [...prev, { id: 'err-' + Date.now(), content: errorMsg, sender: 'ai', timestamp: new Date() }]);
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
        <div className={`flex-1 min-h-0 min-w-0 surface-card rounded-card overflow-hidden flex flex-col ${showFlashcards ? 'lg:w-1/2' : 'w-full'}`}>
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
          <div className="flex-1 min-h-0 min-w-0 lg:w-1/2 surface-card rounded-card overflow-hidden">
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
                showDevicePicker
                onClose={() => {
                  setShowFlashcards(false);
                  setActiveGuideId(null);
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