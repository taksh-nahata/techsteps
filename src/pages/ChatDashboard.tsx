import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { FlashcardStep, ConversationContext } from '../types/services';
import { Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import EnhancedAvatarCompanion from '../components/ai/EnhancedAvatarCompanion';
import ChatInterface from '../components/ai/ChatInterface';
import FlashcardPanel from '../components/ai/FlashcardPanel';
import FlashcardLoader from '../components/ai/FlashcardLoader';
import FollowUpQuestions from '../components/ai/FollowUpQuestions';
import { ttsService } from '../services/TextToSpeechService';
import { AvatarProvider, useAvatar } from '../contexts/AvatarContext';
import { parseCommand } from '../utils/CommandParser';
import { MemoryService, Message } from '../services/MemoryService';
import { LocalStorageService, Conversation } from '../services/LocalStorageService';
import { StorageService } from '../services/StorageService';
import { MistralService } from '../services/ai';
import { GoogleSpeechToTextService } from '../services/GoogleSpeechToTextService';
import ChatHistorySidebar from '../components/ai/ChatHistorySidebar';

declare global {
  interface Window {
    $crisp: any;
  }
}

const ChatDashboardContent: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userData } = useUser();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state: avatarState, setEmotion, setListening, setSpeaking, setThinking } = useAvatar();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flashcardSteps, setFlashcardSteps] = useState<FlashcardStep[]>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);

  // Sync TTS events with Avatar Context
  useEffect(() => {
    ttsService.setCallbacks({
      onSpeakStart: () => setSpeaking(true),
      onSpeakEnd: () => setSpeaking(false),
      onAudioLevel: (_level) => { /* Optional: visualization logic */ }
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

  // Save messages to local storage
  useEffect(() => {
    if (user?.uid) {
      LocalStorageService.saveChatHistory(user.uid, messages);
    }
  }, [messages, user?.uid]);

  // Translate entire conversation when language changes
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setTranslationMap({});
      return;
    }

    const doTranslate = async () => {
      setIsTranslating(true);
      try {
        const mistralService = new MistralService();
        const texts = messages.map(m => m.content);
        const translated = await mistralService.translateTexts(texts, i18n.language);
        const map: Record<string, string> = {};
        for (let i = 0; i < messages.length; i++) {
          map[messages[i].id] = translated[i] || messages[i].content;
        }
        setTranslationMap(map);
      } catch (e) {
        console.warn('Conversation translation failed:', e);
        setTranslationMap({});
      } finally {
        setIsTranslating(false);
      }
    };

    // Debounce small delays to avoid spam calls
    const timer = setTimeout(() => {
      doTranslate();
    }, 300);
    return () => clearTimeout(timer);
  }, [i18n.language, messages]);

  const handleNewChat = async () => {
    const userId = user?.uid || 'guest';
    try {
      if (messages && messages.length > 0) {
        const first = messages.find(m => m.sender === 'user') || messages[0];
        const title = first ? (first.content.slice(0, 80) || new Date().toLocaleString()) : new Date().toLocaleString();
        const conv: Conversation = {
          id: `conv-${Date.now()}`,
          title,
          messages,
          createdAt: new Date().toISOString()
        };
        LocalStorageService.saveConversation(userId, conv);
        setConversations(prev => [conv, ...prev]);
      }
      setMessages([]);
    } catch (e) {
      console.error('handleNewChat error:', e);
    }
  };

  const openHistory = () => setShowHistory(true);
  const closeHistory = () => setShowHistory(false);

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    setShowHistory(false);
  };

  const deleteConversation = (id: string) => {
    const userId = user?.uid || 'guest';
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    LocalStorageService.saveConversations(userId, filtered);
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
      // Topic detection: ask Mistral whether this is a new topic
      try {
        const mistralService = new MistralService();
        const prevContents = messages.map(m => m.content);
        const topicChanged = await mistralService.detectTopicChange(prevContents, messageContent);
        if (topicChanged) {
          const proceed = window.confirm(t('chat.moveTopicPrompt', 'This looks like a new topic. Start a new chat?'));
          if (proceed) {
            await handleNewChat();
          }
        }
      } catch (e) {
        console.warn('Topic detection failed, continuing:', e);
      }

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

      // Fetch known facts and user data for memory focus
      const knownFacts = await MemoryService.getFacts(userId);
      const customUserData = await MemoryService.getUserData(userId);

      const context: ConversationContext = {
        userId,
        currentPage: 'chat',
        userSkillLevel: userData?.skillLevel || 'beginner',
        failureCount: 0,
        knownFacts: knownFacts,
        userData: customUserData || {}
      };

      // Primary content generation
      const mistralResponse = await mistralService.sendMessage(messageContent, context);

      const aiMessage: Message = {
        id: 'ai-' + Date.now(),
        content: mistralResponse.content,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
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

      // 5. Handle Flashcards
      if (mistralResponse.flashcards && mistralResponse.flashcards.length > 0) {
        console.log('Displaying generated flashcards:', mistralResponse.flashcards);
        setFlashcardSteps(mistralResponse.flashcards as FlashcardStep[]);
        setShowFlashcards(true);
      } else {
        setShowFlashcards(false);
      }

      // 6. Speak (use optimized spokenText if available)
      const textToSpeak = mistralResponse.spokenText || mistralResponse.content;
      if (textToSpeak) {
        ttsService.speak(textToSpeak, { lang: i18n.language });
      }

    } catch (e: any) {
      console.error('Chat Error:', e);
      setEmotion('concerned');
      const encouragement = t('encouragement', { returnObjects: true }) as string[];
      const randomEncouragement = encouragement[Math.floor(Math.random() * encouragement.length)];
      const errorMsg = e.message?.includes('429')
        ? "I'm a bit overwhelmed right now! Please try again in a few seconds."
        : randomEncouragement;

      // Send error to Crisp
      if (window.$crisp) {
        const lastMessages = messages.slice(-3).map(m => `${m.sender}: ${m.content}`).join('\\n');
        window.$crisp.push([
          "do",
          "message:send",
          [
            "text",
            `User ${user?.uid} encountered an error: ${e.message}.\\n\\nRecent messages:\\n${lastMessages}`
          ]
        ]);
      }

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
    <div className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-50">
      <ChatHistorySidebar
        conversations={conversations}
        isOpen={showHistory}
        onLoad={loadConversation}
        onDelete={deleteConversation}
        onToggle={() => setShowHistory(!showHistory)}
      />
      <div className="absolute top-0 w-full z-20 p-4 flex justify-between items-center">
        <div className="glass-panel px-4 py-2 rounded-xl font-bold text-indigo-900">TechSteps AI</div>
        <div className="flex items-center gap-2">
          <Link to="/settings" className="p-2 bg-white/50 rounded-full">
            <Settings className="w-6 h-6 text-gray-700" />
          </Link>
          <button onClick={handleLogout} className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors">
            <LogOut className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-10 transform md:scale-100 scale-75 origin-bottom-left" title="Click me to use speech-to-text">
        <EnhancedAvatarCompanion onAvatarClick={handleAvatarClick} />
      </div>

      <div className="h-full pt-18 pb-5 px-4 md:px-6 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
        <div className={`flex-1 ml-40 glass-panel rounded-3xl overflow-hidden transition-all duration-500 ease-in-out ${showFlashcards ? 'md:flex-1' : 'w-full'}`}>
          <div className="flex flex-col h-full">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isListening={avatarState.isListening}
              currentTranscript={currentTranscript}
              onNewChat={handleNewChat}
              onOpenHistory={() => setShowHistory(!showHistory)}
              translationMap={translationMap}
              isTranslating={isTranslating}
              showOriginal={showOriginal}
              onToggleOriginal={() => setShowOriginal(!showOriginal)}
            />
            {!isLoading && messages.length > 0 && (
              <div className="px-4 pb-4">
                <FollowUpQuestions
                  lastUserMessage={lastUserMessage}
                  onQuestionClick={(question) => handleSendMessage(question)}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>

        {isGeneratingFlashcards && (
          <div className="w-full md:flex-1 glass-panel rounded-3xl flex items-center justify-center min-h-[300px]">
            <FlashcardLoader isVisible={true} message="Generating your guide..." />
          </div>
        )}

        {showFlashcards && !isGeneratingFlashcards && (
          <div className="w-full md:flex-1 glass-panel rounded-3xl p-4 animate-in slide-in-from-right duration-500 min-h-[300px]">
            <FlashcardPanel steps={flashcardSteps} isVisible={true} onClose={() => setShowFlashcards(false)} />
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