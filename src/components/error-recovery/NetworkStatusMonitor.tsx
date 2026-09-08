// Network Status Monitor Component
// Displays network status and queued actions for senior users

import React from 'react';
import { useErrorRecovery } from '../../hooks/useErrorRecovery';
import { Typography } from '../design-system/Typography';
import { Card } from '../design-system/Card';
import { Icon } from '../design-system/Icon';
import { Button } from '../design-system/Button';
import { useTranslation } from 'react-i18next';

interface NetworkStatusMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export const NetworkStatusMonitor: React.FC<NetworkStatusMonitorProps> = ({
  className = '',
  showDetails = false
}) => {
  const { t } = useTranslation();
  const { isOffline, queuedActionCount, isRecovering } = useErrorRecovery();

  // Don't show anything if online and no queued actions
  if (!isOffline && queuedActionCount === 0 && !isRecovering) {
    return null;
  }

  const getStatusMessage = () => {
    if (isRecovering) {
      return t('network.recovering', 'Reconnecting...');
    }
    if (isOffline) {
      return t('network.offline', 'You are currently offline');
    }
    if (queuedActionCount > 0) {
      return t('network.syncing', 'Syncing your changes...');
    }
    return '';
  };

  const getStatusIcon = () => {
    if (isRecovering) {
      return 'RefreshCw';
    }
    if (isOffline) {
      return 'WifiOff';
    }
    if (queuedActionCount > 0) {
      return 'Upload';
    }
    return 'Wifi';
  };

  const getStatusColor = () => {
    if (isRecovering) {
      return 'warning';
    }
    if (isOffline) {
      return 'error';
    }
    return 'primary';
  };

  return (
    <Card 
      variant="outlined" 
      padding="md" 
      className={`${className} ${
        isOffline ? 'border-error-200' :
        isRecovering ? 'border-warning-200' :
        'border-primary-200'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon 
          name={getStatusIcon()} 
          size="md" 
          color={getStatusColor()}
          className={isRecovering ? 'animate-spin' : ''}
        />
        
        <div className="flex-1">
          <Typography variant="body" className="font-medium">
            {getStatusMessage()}
          </Typography>
          
          {showDetails && (
            <>
              {isOffline && (
                <Typography variant="body-sm" className="text-neutral-600 mt-1">
                  {t('network.offline_message', 
                    'Don\'t worry - your work is being saved and will sync when you\'re back online.'
                  )}
                </Typography>
              )}
              
              {queuedActionCount > 0 && (
                <Typography variant="body-sm" className="text-neutral-600 mt-1">
                  {t('network.queued_actions', 
                    '{{count}} action waiting to sync', 
                    { count: queuedActionCount }
                  )}
                </Typography>
              )}
            </>
          )}
        </div>

        {isOffline && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="shrink-0"
          >
            {t('network.retry', 'Try Again')}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default NetworkStatusMonitor;