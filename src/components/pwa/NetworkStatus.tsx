import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { useTranslation } from '../../hooks/useTranslation';

export function NetworkStatus() {
  const { isOnline, isSyncing } = usePWA();
  const { t } = useTranslation();

  if (isOnline && !isSyncing) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 text-sm font-medium ${
      isOnline 
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }`}>
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('pwa.status.syncing', 'Syncing...')}
        </>
      ) : isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          {t('pwa.status.online', 'Online')}
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          {t('pwa.status.offline', 'Offline - Changes will sync when connected')}
        </>
      )}
    </div>
  );
}