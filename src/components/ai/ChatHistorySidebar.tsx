import React, { useMemo } from 'react';
import { Conversation } from '../../services/LocalStorageService';
import { useTranslation } from 'react-i18next';
import { X, ChevronRight } from 'lucide-react';

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
        className={`fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-40 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">{t('chat.history', 'Chat History')}</h2>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {recentConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center">
                <p className="text-gray-500 text-sm">{t('chat.historyEmpty', 'No past conversations')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="p-3 rounded-lg hover:bg-indigo-50 transition-colors group border border-gray-100 hover:border-indigo-200"
                >
                  <button
                    onClick={() => onLoad(conv)}
                    className="w-full text-left mb-2"
                  >
                    <div className="font-medium text-gray-800 text-sm truncate hover:text-indigo-600 transition-colors">
                      {conv.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
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
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500 text-center">
            {t('chat.last14Days', 'Showing last 14 days')}
          </p>
        </div>
      </div>

      {/* Toggle button (visible when sidebar is closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-24 z-30 p-2 bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 transition-all"
          aria-label="Open chat history"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}

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
