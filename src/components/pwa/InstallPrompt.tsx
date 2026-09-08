import { Download, X } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { useTranslation } from '../../hooks/useTranslation';

interface InstallPromptProps {
  onDismiss: () => void;
}

export function InstallPrompt({ onDismiss }: InstallPromptProps) {
  const { installApp, isInstallable } = usePWA();
  const { t } = useTranslation();

  if (!isInstallable) return null;

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      onDismiss();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm surface-card rounded-card shadow-senior-lg border border-hairline p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-brand-soft rounded-xl flex items-center justify-center">
          <Download className="w-5 h-5 text-brand" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-ink mb-1">
            {t('pwa.install.title', 'Install TechStep')}
          </h3>
          <p className="text-sm text-ink-muted mb-3">
            {t('pwa.install.description', 'Get quick access to your learning progress and use TechStep offline.')}
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="btn-primary flex-1 text-sm py-2 min-h-0"
            >
              {t('pwa.install.button', 'Install App')}
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2 text-ink-muted hover:text-ink transition-colors focus-ring rounded-lg"
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