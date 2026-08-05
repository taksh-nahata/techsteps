import React, { useMemo } from 'react';
import { Conversation } from '../../services/LocalStorageService';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface Props {
  conversations: Conversation[];
  isOpen: boolean;
  onLoad: (conv: Conversation) => void;
  onDelete: (id: string) => void;
  onToggle: () => void;
}

const ChatHistorySidebar: React.FC<Props> = ({ conversations, isOpen, onLoad, onDelete, onToggle }) => {
  const { t } = useTranslation();

  // Filter conversations from the past 14 days
  const recentConversations = useMemo(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    return conversations
      .filter(conv => new Date(conv.createdAt) >= twoWeeksAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [conversations]);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-72 bg-surface border-r border-hairline shadow-micro transition-transform duration-300 ease-out z-40 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-hairline">
          <h2 className="font-display font-bold tracking-[-0.01em] text-ink text-lg">{t('chat.history', 'Chat History')}</h2>
          <button
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center hover:bg-subtle rounded-full transition-colors focus-ring"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {recentConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <p className="text-ink-muted text-sm">{t('chat.historyEmpty', 'No past conversations yet')}</p>
                <p className="text-ink-muted text-xs mt-2">Chats save automatically on this device after you send a message.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="p-3 rounded-card hover:bg-subtle transition-colors group border border-hairline hover:border-brand/40"
                >
                  <button
                    onClick={() => onLoad(conv)}
                    className="w-full text-left mb-2"
                  >
                    <div className="font-semibold text-ink text-sm truncate group-hover:text-brand transition-colors">
                      {conv.title}
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      {new Date(conv.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t('chat.deleteConversation', 'Delete this conversation?'))) {
                        onDelete(conv.id);
                      }
                    }}
                    className="w-full text-left text-xs px-2 py-1 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {t('chat.delete', 'Delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="border-t border-hairline p-4">
          <p className="text-xs text-ink-muted text-center">
            {t('chat.last14Days', 'Showing last 14 days')}
          </p>
        </div>
      </div>


      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default ChatHistorySidebar;
