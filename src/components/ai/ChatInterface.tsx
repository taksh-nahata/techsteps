import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, MessageSquare, Volume2, Paperclip, X, File as FileIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name: string;
  }[];
}

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
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isListening = false,
  currentTranscript = '',
  className = '',
  autoTTSEnabled = true,
  onSpeakMessage,
  onNewChat,
  onOpenHistory,
  translationMap = {},
  isTranslating = false,
  showOriginal = false,
  onToggleOriginal
}) => {
  const { t } = useTranslation();
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
      {/* Small header with New Chat and History */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="font-semibold text-gray-700">Chat</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNewChat && onNewChat()}
            className="px-3 py-1 bg-white border rounded text-sm shadow-sm"
          >
            {t('chat.newChat', 'New Chat')}
          </button>
          <button
            onClick={() => onOpenHistory && onOpenHistory()}
            className="px-3 py-1 bg-white border rounded text-sm shadow-sm"
          >
            {t('chat.history', 'History')}
          </button>
          <button
            onClick={() => onToggleOriginal && onToggleOriginal()}
            className="px-3 py-1 bg-white border rounded text-sm shadow-sm"
          >
            {showOriginal ? t('chat.showOriginal', 'Original') : t('chat.showTranslated', 'Translated')}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {isTranslating && (
          <div className="px-4 py-2 text-sm text-gray-600 italic">{t('chat.translatingChat', 'Translating chat...')}</div>
        )}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 shadow-sm animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20 transform -rotate-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
                {t('chat.welcome.title', 'How can I help you today?')}
              </h3>
              <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
                {t('chat.welcome.subtitle', 'Click the avatar to speak or type your question below')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div
                  className={`
                    max-w-[90%] md:max-w-[85%] rounded-[1.5rem] md:rounded-[2rem] px-4 py-3 md:px-8 md:py-5 text-base md:text-lg leading-relaxed relative group shadow-sm transition-transform duration-300 hover:scale-[1.01]
                    ${message.sender === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-sm ml-8 md:ml-12 shadow-indigo-500/20'
                      : 'bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-sm mr-8 md:mr-12 border border-white/60 shadow-gray-200/50'
                    }
                  `}
                >
                  <MarkdownRenderer content={showOriginal ? message.content : (translationMap[message.id] ?? message.content)} />

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
                      className="absolute -right-14 top-1/2 -translate-y-1/2 p-3 bg-white/80 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-white transition-all duration-300 shadow-sm border border-white/50"
                      aria-label="Read message aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}

                  <div className={`
                    text-xs mt-2 opacity-60 font-medium
                    ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'}
                  `}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Listening indicator */}
            {isListening && (
              <div className="flex justify-end animate-fade-in">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-[2rem] rounded-br-none px-6 py-4 ml-12 shadow-lg shadow-emerald-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '1s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.4s' }} />
                    </div>
                    <span className="font-medium">Listening...</span>
                  </div>
                  {currentTranscript && (
                    <div className="mt-2 text-sm text-emerald-100 border-t border-emerald-400/30 pt-2 italic">
                      "{currentTranscript}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white rounded-[2rem] rounded-bl-none px-6 py-4 mr-12 border border-white/60 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span className="text-gray-500 font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-6 bg-transparent">
        {/* File Preview Area */}
        {selectedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto p-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative bg-white/80 p-2 rounded-lg border border-indigo-100 shadow-sm flex-shrink-0 w-24 h-24 flex items-center justify-center group">
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

        <div className="max-w-4xl mx-auto backdrop-blur-2xl bg-white/80 rounded-[2rem] px-2 py-2 shadow-2xl shadow-indigo-100/60 border border-white/80 relative transition-shadow duration-300 hover:shadow-indigo-200/60">
          <div className="relative flex items-center">
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
              className="ml-1 md:ml-2 p-2 md:p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
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
                  w-full px-4 md:px-8 py-3 md:py-4 pr-12 md:pr-16 text-base md:text-lg bg-transparent border-none
                  resize-none min-h-[56px] md:min-h-[64px] max-h-40
                  focus:outline-none focus:ring-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                  placeholder-gray-400 text-gray-800 font-medium
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
                  transition-all duration-300 transform
                  ${(inputValue.trim() || selectedFiles.length > 0) && !isLoading && !isListening
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 hover:rotate-12 active:scale-95'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
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
              ? 'bg-emerald-100 text-emerald-700 animate-pulse'
              : 'bg-white/40 text-gray-500'
            }
          `}>
            {isListening ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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