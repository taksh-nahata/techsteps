// Fallback UI States for Critical Failure Modes
// Provides graceful degradation and emergency support for senior users

import React, { useState, useEffect } from 'react';
import { Typography } from '../design-system/Typography';
import { Card } from '../design-system/Card';
import { Button } from '../design-system/Button';
import { Icon } from '../design-system/Icon';
import { useTranslation } from 'react-i18next';
import { useErrorRecovery } from '../../hooks/useErrorRecovery';

// Offline Mode Fallback
export const OfflineFallback: React.FC<{
  children?: React.ReactNode;
  showCachedContent?: boolean;
}> = ({ children, showCachedContent = true }) => {
  const { t } = useTranslation();
  const { isOffline, queuedActionCount } = useErrorRecovery();
  const [cachedContent, setCachedContent] = useState<any>(null);

  useEffect(() => {
    if (showCachedContent) {
      // Load cached content from localStorage
      try {
        const cached = localStorage.getItem('cached-content');
        if (cached) {
          setCachedContent(JSON.parse(cached));
        }
      } catch (error) {
        console.warn('Failed to load cached content:', error);
      }
    }
  }, [showCachedContent]);

  if (!isOffline) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card variant="elevated" padding="lg" className="text-center mb-6">
          <Icon name="WifiOff" size="xl" color="warning" className="mx-auto mb-4" />
          
          <Typography variant="h2" className="mb-4">
            {t('offline.title', 'You\'re Currently Offline')}
          </Typography>
          
          <Typography variant="body" className="text-neutral-600 mb-6">
            {t('offline.message', 
              'Don\'t worry - you can still view some content and your work will be saved. Everything will sync when you\'re back online.'
            )}
          </Typography>

          {queuedActionCount > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Icon name="Upload" size="sm" color="primary" />
                <Typography variant="body" className="font-medium">
                  {t('offline.queued_actions', '{{count}} action waiting to sync', { 
                    count: queuedActionCount 
                  })}
                </Typography>
              </div>
              <Typography variant="body-sm" className="text-neutral-600">
                {t('offline.sync_message', 'These will be processed automatically when you reconnect.')}
              </Typography>
            </div>
          )}

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              <Icon name="RefreshCw" size="sm" className="mr-2" />
              {t('offline.try_reconnect', 'Try to Reconnect')}
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = '/'}
              className="w-full sm:w-auto"
            >
              <Icon name="Home" size="sm" className="mr-2" />
              {t('offline.go_home', 'Go to Home Page')}
            </Button>
          </div>
        </Card>

        {/* Cached Content Display */}
        {showCachedContent && cachedContent && (
          <Card variant="outlined" padding="lg">
            <div className="flex items-center space-x-2 mb-4">
              <Icon name="Archive" size="sm" color="primary" />
              <Typography variant="h4">
                {t('offline.cached_content', 'Previously Viewed Content')}
              </Typography>
            </div>
            
            <Typography variant="body-sm" className="text-neutral-600 mb-4">
              {t('offline.cached_note', 'This content was saved from your last visit.')}
            </Typography>
            
            <div className="prose max-w-none">
              {cachedContent}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// Animation Failure Fallback
export const AnimationFallback: React.FC<{
  children: React.ReactNode;
  fallbackContent?: React.ReactNode;
  staticImage?: string;
}> = ({ children, fallbackContent, staticImage }) => {
  const [animationFailed, setAnimationFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Monitor for animation errors
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('animation') || event.message.includes('lottie')) {
        setAnimationFailed(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (reducedMotion || animationFailed) {
    return (
      <div className="animation-fallback">
        {staticImage && (
          <img 
            src={staticImage} 
            alt="Static illustration" 
            className="w-full h-auto max-w-md mx-auto"
          />
        )}
        {fallbackContent}
      </div>
    );
  }

  return <>{children}</>;
};

// AI Assistant Failure Fallback
export const AIFallback: React.FC<{
  onContactHuman: () => void;
  onContinueWithoutAI: () => void;
  error?: Error;
}> = ({ onContactHuman, onContinueWithoutAI }) => {
  const { t } = useTranslation();

  return (
    <Card variant="outlined" padding="lg" className="border-l-4 border-l-warning-500 bg-warning-50">
      <div className="flex items-start space-x-4">
        <Icon name="MessageCircle" size="lg" color="warning" className="shrink-0 mt-1" />
        
        <div className="flex-1">
          <Typography variant="h4" className="mb-2">
            {t('ai.fallback.title', 'AI Assistant Temporarily Unavailable')}
          </Typography>
          
          <Typography variant="body" className="text-neutral-700 mb-4">
            {t('ai.fallback.message', 
              'Our AI assistant is having trouble right now, but don\'t worry - you can still get help and use the platform normally.'
            )}
          </Typography>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onContactHuman}
              className="w-full sm:w-auto"
            >
              <Icon name="MessageSquare" size="sm" className="mr-2" />
              {t('ai.fallback.contact_human', 'Talk to a Real Person')}
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={onContinueWithoutAI}
              className="w-full sm:w-auto"
            >
              <Icon name="ArrowRight" size="sm" className="mr-2" />
              {t('ai.fallback.continue', 'Continue Without Assistant')}
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-warning-200">
            <Typography variant="body-sm" className="text-neutral-600">
              <Icon name="Info" size="sm" className="inline mr-1" />
              {t('ai.fallback.tip', 
                'You can still access all tutorials, settings, and help resources while we fix this issue.'
              )}
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Critical System Failure Fallback
export const CriticalFailureFallback: React.FC<{
  error: Error;
  onEmergencySupport: () => void;
  onSafeMode: () => void;
}> = ({ onEmergencySupport, onSafeMode }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="max-w-md text-center border-l-4 border-l-red-500">
        <Icon name="AlertTriangle" size="xl" color="error" className="mx-auto mb-4" />
        
        <Typography variant="h2" className="mb-4 text-red-800">
          {t('critical.title', 'System Problem')}
        </Typography>
        
        <Typography variant="body" className="text-red-700 mb-6">
          {t('critical.message', 
            'We\'re experiencing a serious technical problem. This is not your fault. Your information is safe, and we\'re here to help.'
          )}
        </Typography>

        <div className="space-y-4 mb-6">
          <Button
            variant="primary"
            size="lg"
            onClick={onEmergencySupport}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Icon name="Phone" size="sm" className="mr-2" />
            {t('critical.emergency_support', 'Get Immediate Help')}
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={onSafeMode}
            className="w-full"
          >
            <Icon name="Shield" size="sm" className="mr-2" />
            {t('critical.safe_mode', 'Try Safe Mode')}
          </Button>
        </div>

        <div className="bg-white bg-opacity-50 rounded-lg p-4">
          <Typography variant="body-sm" className="text-red-700">
            <Icon name="Clock" size="sm" className="inline mr-1" />
            {t('critical.support_hours', 
              'Emergency support is available 24/7 at 1-800-HELP-NOW'
            )}
          </Typography>
        </div>
      </Card>
    </div>
  );
};

// Emergency Support Access Component
export const EmergencySupport: React.FC<{
  reason?: string;
  onClose?: () => void;
}> = ({ reason, onClose }) => {
  const { t } = useTranslation();

  const handleEmergencyContact = (method: 'phone' | 'email' | 'chat') => {
    switch (method) {
      case 'phone':
        window.location.href = 'tel:1-800-HELP-NOW';
        break;
      case 'email':
        window.location.href = 'mailto:emergency@support.com?subject=Emergency Support Needed';
        break;
      case 'chat':
        // Open emergency chat widget
        console.log('Opening emergency chat...');
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card variant="elevated" padding="lg" className="max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size="md" color="error" />
            <Typography variant="h3">
              {t('emergency.title', 'Emergency Support')}
            </Typography>
          </div>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Icon name="X" size="sm" />
            </Button>
          )}
        </div>

        {reason && (
          <div className="bg-red-50 rounded-lg p-3 mb-4">
            <Typography variant="body-sm" className="text-red-700">
              <strong>{t('emergency.reason', 'Issue:')} </strong>
              {reason}
            </Typography>
          </div>
        )}

        <Typography variant="body" className="mb-6">
          {t('emergency.message', 
            'We understand this can be frustrating. Choose how you\'d like to get immediate help:'
          )}
        </Typography>

        <div className="space-y-3 mb-6">
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleEmergencyContact('phone')}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Icon name="Phone" size="sm" className="mr-2" />
            {t('emergency.call', 'Call Now: 1-800-HELP-NOW')}
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleEmergencyContact('chat')}
            className="w-full"
          >
            <Icon name="MessageSquare" size="sm" className="mr-2" />
            {t('emergency.chat', 'Start Emergency Chat')}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleEmergencyContact('email')}
            className="w-full"
          >
            <Icon name="Mail" size="sm" className="mr-2" />
            {t('emergency.email', 'Send Emergency Email')}
          </Button>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <Typography variant="body-sm" className="text-blue-700">
            <Icon name="Info" size="sm" className="inline mr-1" />
            {t('emergency.availability', 
              'Emergency support is available 24/7. Average response time is under 2 minutes.'
            )}
          </Typography>
        </div>
      </Card>
    </div>
  );
};

// Safe Mode Interface
export const SafeMode: React.FC<{
  onExitSafeMode: () => void;
  children: React.ReactNode;
}> = ({ onExitSafeMode, children }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Safe Mode Banner */}
      <div className="bg-yellow-100 border-b-2 border-yellow-300 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="Shield" size="md" color="warning" />
            <div>
              <Typography variant="body" className="font-semibold text-yellow-800">
                {t('safe_mode.title', 'Safe Mode Active')}
              </Typography>
              <Typography variant="body-sm" className="text-yellow-700">
                {t('safe_mode.description', 'Advanced features disabled for stability')}
              </Typography>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="md"
            onClick={onExitSafeMode}
            className="border-yellow-400 text-yellow-800 hover:bg-yellow-200"
          >
            {t('safe_mode.exit', 'Exit Safe Mode')}
          </Button>
        </div>
      </div>

      {/* Safe Mode Content */}
      <div className="safe-mode-content">
        {children}
      </div>
    </div>
  );
};

// Generic Fallback Wrapper
export const FallbackWrapper: React.FC<{
  children: React.ReactNode;
  fallbackType: 'offline' | 'animation' | 'ai' | 'critical';
  fallbackProps?: any;
}> = ({ children, fallbackType, fallbackProps = {} }) => {
  const [shouldShowFallback, setShouldShowFallback] = useState(false);

  useEffect(() => {
    const checkConditions = () => {
      switch (fallbackType) {
        case 'offline':
          setShouldShowFallback(!navigator.onLine);
          break;
        case 'animation':
          setShouldShowFallback(
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
          );
          break;
        case 'ai':
          // This would check AI service status
          setShouldShowFallback(false);
          break;
        case 'critical':
          // This would check for critical system errors
          setShouldShowFallback(false);
          break;
      }
    };

    checkConditions();

    // Set up listeners for dynamic conditions
    if (fallbackType === 'offline') {
      window.addEventListener('online', checkConditions);
      window.addEventListener('offline', checkConditions);
      return () => {
        window.removeEventListener('online', checkConditions);
        window.removeEventListener('offline', checkConditions);
      };
    }
  }, [fallbackType]);

  if (shouldShowFallback) {
    switch (fallbackType) {
      case 'offline':
        return <OfflineFallback {...fallbackProps}>{children}</OfflineFallback>;
      case 'animation':
        return <AnimationFallback {...fallbackProps}>{children}</AnimationFallback>;
      case 'ai':
        return <AIFallback {...fallbackProps} />;
      case 'critical':
        return <CriticalFailureFallback {...fallbackProps} />;
    }
  }

  return <>{children}</>;
};

export default {
  OfflineFallback,
  AnimationFallback,
  AIFallback,
  CriticalFailureFallback,
  EmergencySupport,
  SafeMode,
  FallbackWrapper
};