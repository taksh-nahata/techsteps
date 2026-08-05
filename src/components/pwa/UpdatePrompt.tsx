import { RefreshCw, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { useTranslation } from '../../hooks/useTranslation';

interface UpdatePromptProps {
  onDismiss: () => void;
}

export function UpdatePrompt({ onDismiss }: UpdatePromptProps) {
  const { updateApp, hasUpdate } = usePWA();
  const { t } = useTranslation();

  if (!hasUpdate) return null;

  const handleUpdate = () => {
    updateApp();
  };

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-green-50 dark:bg-green-900 rounded-lg shadow-lg border border-green-200 dark:border-green-700 p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
            {t('pwa.update.title', 'Update Available')}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-200 mb-3">
            {t('pwa.update.description', 'A new version of TechStep is available with improvements and bug fixes.')}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {t('pwa.update.button', 'Update Now')}
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg"
              aria-label={t('common.dismiss', 'Dismiss')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}