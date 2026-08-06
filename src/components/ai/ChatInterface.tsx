import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, Volume2, Paperclip, X, File as FileIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarkdownRenderer from './MarkdownRenderer';
import TechyMark from '../layout/TechyMark';
import EnhancedAvatarCompanion from './EnhancedAvatarCompanion';
import FollowUpQuestions from './FollowUpQuestions';
import GuidePromptCard from './GuidePromptCard';
import type { Message } from '../../services/MemoryService';
import { useAvatar } from '../../contexts/AvatarContext';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, attachments?: File[]) => void;
  isLoading?: boolean;
  isListening?: boolean;
  currentTranscript?: string;
  className?: string;
  autoTTSEnabled?: boolean;
  onSpeakMessage?: (message: string) => void;
  onNewChat?: () => void;
  onOpenHistory?: () => void;
  translationMap?: Record<string, string>;
  isTranslating?: boolean;
  showOriginal?: boolean;
  onToggleOriginal?: () => void;
  onAvatarClick?: () => void;
  lastUserMessage?: string;
  onFollowUpClick?: (question: string) => void;
  showFollowUps?: boolean;
  guideStep?: { current: number; total: number };
  onOpenGuide?: (guideId: string) => void;
  activeGuideId?: string | null;
  generatingGuideMessageId?: string | null;
  showFlashcardPanel?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isListening = false,
  currentTranscript = '',
  className = '',
  autoTTSEnabled = false,
  onSpeakMessage,
  onNewChat,
  onOpenHistory,
  translationMap = {},
  isTranslating = false,
  showOriginal = false,
  onToggleOriginal,
  onAvatarClick,
  lastUserMessage = '',
  onFollowUpClick,
  showFollowUps = false,
  guideStep,
  onOpenGuide,
  activeGuideId = null,
  generatingGuideMessageId = null,
  showFlashcardPanel = false,
}) => {
  const { t } = useTranslation();
  const { state: avatarState } = useAvatar();
  const prefersReducedMotion = useReducedMotion();
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Handle transcript input
  useEffect(() => {
    if (currentTranscript && isListening) {
      setInputValue(currentTranscript);
    }
  }, [currentTranscript, isListening]);

  const handleSend = () => {
    if ((!inputValue.trim() && selectedFiles.length === 0) || isLoading) return;

    onSendMessage(inputValue.trim(), selectedFiles);
    setInputValue('');
    setSelectedFiles([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with New Chat and History */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 md:px-5 py-3 border-b border-hairline">
        <div className="font-display font-bold tracking-[-0.01em] text-ink text-lg">{t('chat.title', 'Chat')}</div>
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <button
            onClick={() => onNewChat && onNewChat()}
            className="pill-tab focus-ring"
          >
            {t('chat.newChat', 'New Chat')}
          </button>
          <button
            onClick={() => onOpenHistory && onOpenHistory()}
            className="pill-tab focus-ring"
          >
            {t('chat.history', 'History')}
          </button>
          <button
            onClick={() => onToggleOriginal && onToggleOriginal()}
            className="pill-tab focus-ring"
          >
            {showOriginal ? t('chat.showOriginal', 'Original') : t('chat.showTranslated', 'Translated')}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 md:px-5 md:py-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="mx-auto w-full max-w-3xl space-y-3 md:space-y-4">
        {isTranslating && (
          <div className="px-4 py-2 text-sm text-gray-600 italic">{t('chat.translatingChat', 'Translating chat...')}</div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[50vh]">
            <motion.div
              className="text-center px-6 py-10 max-w-lg mx-auto"
              variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }}
              initial={prefersReducedMotion ? false : 'hidden'}
              animate="visible"
            >
              <motion.div
                variants={{ hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 18 } } }}
                className="flex justify-center mb-8 overflow-visible"
              >
                <motion.div
                  animate={prefersReducedMotion ? {} : { y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <TechyMark size={56} />
                </motion.div>
              </motion.div>
              <motion.h3
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                className="font-display text-2xl md:text-3xl font-bold tracking-[-0.02em] text-ink mb-3"
              >
                {t('chat.welcome.title', 'How can I help you today?')}
              </motion.h3>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                className="text-ink-muted text-base md:text-lg max-w-sm mx-auto leading-relaxed mb-8"
              >
                {t('chat.welcome.subtitle', 'Click the avatar to speak or type your question below')}
              </motion.p>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
                className="flex flex-wrap justify-center gap-2"
              >
                {[
                  t('questions.connectWifi', 'How do I connect to Wi-Fi?'),
                  t('questions.takeScreenshot', 'How do I take a screenshot?'),
                  t('questions.makeVideoCall', 'How do I make a video call?'),
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onSendMessage(q)}
                    className="rounded-full border border-hairline bg-surface px-4 py-2 text-sm font-medium text-ink shadow-micro transition-colors hover:border-brand/40 hover:bg-brand-soft focus-ring"
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="mb-1 hidden shrink-0 sm:block">
                    <TechyMark size={26} />
                  </div>
                )}
                <div
                  className={`
                    max-w-[90%] md:max-w-[82%] rounded-[20px] px-4 py-3 md:px-6 md:py-4 text-base md:text-lg leading-relaxed relative group transition-colors duration-200
                    ${message.sender === 'user'
                      ? 'bg-brand text-white rounded-br-md shadow-senior'
                      : 'bg-surface text-ink rounded-bl-md border border-hairline shadow-micro'
                    }
                  `}
                >
                  <MarkdownRenderer content={showOriginal ? message.content : (translationMap[message.id] ?? message.content)} />

                  {message.sender === 'ai' && generatingGuideMessageId === message.id && (
                    <div className="mt-4 rounded-[16px] border border-hairline bg-subtle/60 p-4 text-sm text-ink-muted animate-pulse">
                      {t('flashcards.buildingGuide', 'Building your step-by-step guide…')}
                    </div>
                  )}

                  {message.sender === 'ai' && message.guideId && onOpenGuide && (message.guideStepCount ?? 0) > 0 && (
                    <GuidePromptCard
                      title={message.guideTitle || t('flashcards.stepByStepGuide', 'Step-by-Step Guide')}
                      stepCount={message.guideStepCount ?? 0}
                      isOpen={showFlashcardPanel && activeGuideId === message.guideId}
                      onOpen={() => onOpenGuide(message.guideId!)}
                    />
                  )}

                  {/* Attachments Display */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {message.attachments.map((att, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/20">
                          {att.type === 'image' ? (
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-full h-32 object-cover"
                              onClick={() => window.open(att.url, '_blank')}
                            />
                          ) : (
                            <div className="p-3 bg-white/20 flex items-center space-x-2 h-full">
                              <FileIcon className="w-5 h-5 text-white" />
                              <span className="text-sm truncate">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Speaker button for AI messages when auto TTS is disabled */}
                  {message.sender === 'ai' && !autoTTSEnabled && onSpeakMessage && (
                    <button
                      onClick={() => onSpeakMessage(message.content)}
                      className="absolute -right-14 top-1/2 -translate-y-1/2 p-3 bg-surface rounded-full text-ink-muted hover:text-brand hover:bg-subtle transition-colors duration-200 border border-hairline focus-ring"
                      aria-label="Read message aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}

                  <div className={`
                    text-xs mt-2 font-medium
                    ${message.sender === 'user' ? 'text-white/70' : 'text-ink-muted'}
                  `}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Listening indicator — animated waveform, not generic bouncing dots */}
            {isListening && (
              <div className="flex justify-end animate-fade-in">
                <div className="bg-brand text-white rounded-[20px] rounded-br-md px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-[3px] h-4">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.span
                          key={i}
                          className="w-[3px] rounded-full bg-white"
                          animate={prefersReducedMotion ? { height: 8 } : { height: [6, 16, 6] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{t('chat.input.listeningShort', 'Listening...')}</span>
                  </div>
                  {currentTranscript && (
                    <div className="mt-2 text-sm text-white/80 border-t border-white/25 pt-2 italic">
                      "{currentTranscript}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading indicator — the brand mark breathing, not generic bouncing dots */}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start animate-fade-in">
                <div className="mb-1 hidden shrink-0 sm:block">
                  <TechyMark size={26} />
                </div>
                <div className="bg-surface rounded-[20px] rounded-bl-md px-5 py-4 border border-hairline shadow-micro">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={prefersReducedMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <TechyMark size={18} />
                    </motion.div>
                    <span className="text-ink-muted font-medium">{t('chat.thinking', 'Thinking...')}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {showFollowUps && lastUserMessage && onFollowUpClick && !isLoading && messages.length > 0 && (
        <FollowUpQuestions
          lastUserMessage={lastUserMessage}
          onQuestionClick={onFollowUpClick}
          isLoading={isLoading}
        />
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-2 md:p-3 bg-transparent">
        {/* File Preview Area */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto p-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative bg-surface p-2 rounded-lg border border-hairline shadow-micro flex-shrink-0 w-24 h-24 flex items-center justify-center group">
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-3 h-3" />
                </button>
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center text-xs text-gray-500 overflow-hidden">
                    <FileIcon className="w-6 h-6 mb-1" />
                    <span className="truncate w-full text-center">{file.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="w-full bg-surface rounded-[26px] px-1.5 py-1 border border-hairline shadow-micro relative transition-colors duration-200 focus-within:border-brand">
          <div className="relative flex items-center gap-1">
            {onAvatarClick && (
              <div className="flex-shrink-0 pl-2 ml-1">
                <EnhancedAvatarCompanion
                  size="sm"
                  embedded
                  onAvatarClick={onAvatarClick}
                  guideStep={guideStep}
                  hint={
                    isListening
                      ? 'Listening…'
                      : isLoading
                        ? 'Thinking…'
                        : guideStep
                          ? `Step ${guideStep.current} of ${guideStep.total}`
                          : avatarState.message || undefined
                  }
                />
              </div>
            )}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx" // Add more types if needed
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="ml-1 md:ml-2 p-2 md:p-3 text-ink-muted hover:text-brand hover:bg-subtle rounded-full transition-colors focus-ring"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('chat.input.placeholder', 'Ask anything here...')}
                className="
                  w-full px-4 md:px-6 py-3 md:py-4 pr-12 md:pr-16 text-base md:text-lg bg-transparent border-none
                  resize-none min-h-[56px] md:min-h-[60px] max-h-40
                  focus:outline-none focus:ring-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                  placeholder:text-ink-muted text-ink font-medium
                  items-center flex
                "
                disabled={isLoading || isListening}
                rows={1}
                style={{ paddingTop: '1rem' }}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading || isListening}
                className={`
                  absolute right-1 md:right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                  transition-all duration-200 focus-ring
                  ${(inputValue.trim() || selectedFiles.length > 0) && !isLoading && !isListening
                    ? 'bg-brand text-white hover:bg-brand-strong active:scale-95'
                    : 'bg-subtle text-ink-muted/50 cursor-not-allowed'
                  }
                `}
              >
                <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-3 text-center">
          <span className={`
            inline-flex items-center space-x-2 text-xs font-medium px-3 py-1 rounded-full
            ${isListening
              ? 'bg-brand-soft text-brand animate-pulse'
              : 'text-ink-muted'
            }
          `}>
            {isListening ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span>{t('chat.input.listening', 'Listening... Click avatar again to stop')}</span>
              </>
            ) : (
              <span>{t('chat.input.helper', 'Press Enter to send • Click avatar to speak')}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;