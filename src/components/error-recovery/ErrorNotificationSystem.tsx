// Error Notification System Component
// Displays error notifications in a senior-friendly way

import React, { useEffect, useState } from 'react';
import { globalErrorHandler, ErrorNotification } from '../../utils/errors/globalErrorHandler';
// import { UserFriendlyErrorDisplay } from './UserFriendlyError';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Icon } from '../design-system/Icon';
import { Typography } from '../design-system/Typography';
import { useTranslation } from 'react-i18next';

interface ErrorNotificationSystemProps {
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  className?: string;
}

export const ErrorNotificationSystem: React.FC<ErrorNotificationSystemProps> = ({
  maxNotifications = 3,
  position = 'top-right',
  className = ''
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  useEffect(() => {
    // Subscribe to error notifications
    const unsubscribe = globalErrorHandler.addErrorListener((notification) => {
      setNotifications(prev => {
        const updated = [notification, ...prev];
        // Limit number of notifications
        return updated.slice(0, maxNotifications);
      });
    });

    // Load existing notifications
    setNotifications(globalErrorHandler.getActiveNotifications().slice(0, maxNotifications));

    return unsubscribe;
  }, [maxNotifications]);

  const handleDismiss = (id: string) => {
    globalErrorHandler.dismissNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleDismissAll = () => {
    globalErrorHandler.clearAllNotifications();
    setNotifications([]);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 ${getPositionClasses()} max-w-xs w-full space-y-2 ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Dismiss All Button (if multiple notifications) */}
      {notifications.length > 1 && (
        <Card variant="outlined" padding="sm" className="bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <Typography variant="body-sm" className="text-neutral-600 text-xs">
              {notifications.length} errors
            </Typography>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissAll}
              className="text-neutral-500 hover:text-neutral-700 p-1"
            >
              <Icon name="X" size="sm" />
            </Button>
          </div>
        </Card>
      )}

      {/* Individual Notifications */}
      {notifications.map((notification) => (
        <ErrorNotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismiss(notification.id)}
        />
      ))}
    </div>
  );
};

interface ErrorNotificationCardProps {
  notification: ErrorNotification;
  onDismiss: () => void;
}

const ErrorNotificationCard: React.FC<ErrorNotificationCardProps> = ({
  notification,
  onDismiss
}) => {
  const { t } = useTranslation();
  const { error } = notification;

  const getSeverityColor = () => {
    switch (error.severity) {
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'critical':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityIconColor = () => {
    switch (error.severity) {
      case 'low':
        return 'primary';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Card
      variant="outlined"
      padding="sm"
      className={`${getSeverityColor()} border-l-2 shadow-sm`}
    >
      <div className="flex items-start space-x-2">
        <Icon
          name={error.icon as any}
          size="sm"
          color={getSeverityIconColor() as any}
          className="shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <Typography variant="body-sm" className="font-medium pr-2 text-xs">
              {error.title}
            </Typography>

            <div className="flex items-center space-x-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="p-0.5"
                aria-label={t('error.notifications.dismiss', 'Dismiss')}
              >
                <Icon name="X" size="sm" />
              </Button>
            </div>
          </div>

          <Typography variant="body-sm" className="text-neutral-600 mb-1 text-xs">
            {error.message.length > 50 ? `${error.message.substring(0, 50)}...` : error.message}
          </Typography>

          {/* Quick Action (only show primary action) */}
          {error.actions.length > 0 && (
            <div className="mt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await error.actions[0].action();
                  onDismiss();
                }}
                className="text-xs px-2 py-1 h-5"
              >
                {error.actions[0].label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Hook for using the error notification system
export function useErrorNotifications() {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  useEffect(() => {
    const unsubscribe = globalErrorHandler.addErrorListener((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    setNotifications(globalErrorHandler.getActiveNotifications());

    return unsubscribe;
  }, []);

  const dismissNotification = (id: string) => {
    globalErrorHandler.dismissNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    globalErrorHandler.clearAllNotifications();
    setNotifications([]);
  };

  return {
    notifications,
    dismissNotification,
    clearAll,
    hasNotifications: notifications.length > 0
  };
}

export default ErrorNotificationSystem;