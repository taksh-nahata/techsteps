// Error Recovery Components Index
// Centralized exports for all error recovery functionality

// Core error recovery utilities
export { errorRecovery } from '../../utils/errors/errorRecovery';
export { errorMessageTranslator } from '../../utils/errors/errorMessages';
export { globalErrorHandler, handleError } from '../../utils/errors/globalErrorHandler';

// React hooks
export { useErrorRecovery } from '../../hooks/useErrorRecovery';
export { useErrorNotifications } from './ErrorNotificationSystem';

// Context and providers
export {
  ErrorRecoveryProvider,
  useErrorRecoveryContext,
  withErrorRecovery,
  ErrorRecoveryBoundary
} from '../../contexts/ErrorRecoveryContext';

// UI Components
export { ErrorNotificationSystem } from './ErrorNotificationSystem';
export { NetworkStatusMonitor } from './NetworkStatusMonitor';

// Fallback components
export {
  OfflineFallback,
  AnimationFallback,
  AIFallback,
  CriticalFailureFallback,
  EmergencySupport,
  SafeMode,
  FallbackWrapper
} from './FallbackStates';

// Types
export type {
  RetryConfig,
  SessionData,
  QueuedAction,
  RecoveryStrategy
} from '../../utils/errors/errorRecovery';

export type {
  ErrorSeverity,
  UserFriendlyError,
  ErrorAction,
  ErrorPattern
} from '../../utils/errors/errorMessages';

export type {
  ErrorHandlerOptions,
  ErrorNotification
} from '../../utils/errors/globalErrorHandler';