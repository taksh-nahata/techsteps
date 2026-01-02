import React from 'react';
import { Conversation } from '../../services/LocalStorageService';
import { useTranslation } from 'react-i18next';

interface Props {
  conversations: Conversation[];
  onLoad: (conv: Conversation) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ChatHistory: React.FC<Props> = ({ conversations, onLoad, onDelete, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{t('chat.history', 'History')}</h3>
          <button onClick={onClose} className="text-sm text-gray-600">✕</button>
        </div>

        {conversations.length === 0 ? (
          <div className="py-8 text-center text-gray-500">{t('chat.historyEmpty', 'No past conversations')}</div>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {conversations.map(conv => (
              <li key={conv.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div>
                  <div className="font-medium">{conv.title}</div>
                  <div className="text-xs text-gray-400">{new Date(conv.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoad(conv)}
                    className="text-sm px-3 py-1 bg-indigo-600 text-white rounded"
                  >
                    {t('chat.loadConversation', 'Load')}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t('chat.deleteConversation', 'Delete conversation?'))) {
                        onDelete(conv.id);
                      }
                    }}
                    className="text-sm px-3 py-1 bg-red-100 text-red-600 rounded"
                  >
                    {t('chat.deleteConversation', 'Delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
