// Global Error Handler with User-Friendly Messages
// Integrates error recovery, user-friendly messages, and logging

import { errorLogger } from './errorLogger';
import { errorRecovery } from './errorRecovery';
import { errorMessageTranslator, UserFriendlyError } from './errorMessages';
import { ErrorContext } from '../../types/core';

export interface ErrorHandlerOptions {
  showUserFriendlyMessage?: boolean;
  attemptRecovery?: boolean;
  logError?: boolean;
  context?: Partial<ErrorContext>;
}

export interface ErrorNotification {
  id: string;
  error: UserFriendlyError;
  timestamp: Date;
  dismissed: boolean;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorNotifications: ErrorNotification[] = [];
  private errorListeners: ((notification: ErrorNotification) => void)[] = [];

  private constructor() {
    this.setupGlobalHandlers();
  }

  public static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupGlobalHandlers(): void {
    // Enhanced global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        actions: ['global_error'],
        state: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Enhanced unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(`Unhandled promise rejection: ${event.reason}`),
        {
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          actions: ['unhandled_promise'],
          state: {
            reason: event.reason,
          },
        }
      );
    });

    // Network error handler
    window.addEventListener('offline', () => {
      this.handleError(
        new Error('Network connection lost'),
        {
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          actions: ['network_offline'],
        },
        {
          showUserFriendlyMessage: true,
          attemptRecovery: true,
          logError: true
        }
      );
    });

    // Memory pressure handler (if supported)
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        if (memInfo && memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit > 0.9) {
          this.handleError(
            new Error('High memory usage detected'),
            {
              page: window.location.pathname,
              userAgent: navigator.userAgent,
              actions: ['memory_pressure'],
              state: {
                usedMemory: memInfo.usedJSHeapSize,
                totalMemory: memInfo.jsHeapSizeLimit,
                usage: (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit * 100).toFixed(2) + '%'
              },
            },
            {
              showUserFriendlyMessage: true,
              attemptRecovery: true,
              logError: true
            }
          );
        }
      }, 30000); // Check every 30 seconds
    }
  }

  public async handleError(
    error: Error | string,
    context: ErrorContext,
    options: ErrorHandlerOptions = {}
  ): Promise<void> {
    const {
      showUserFriendlyMessage = true,
      attemptRecovery = true,
      logError = true,
      context: additionalContext = {}
    } = options;

    const fullContext = { ...context, ...additionalContext };
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Log the error
    if (logError) {
      errorLogger.logError({
        message: errorObj.message,
        stack: errorObj.stack,
        type: 'handled',
        severity: this.determineSeverity(errorObj)
      }, fullContext);
    }

    // Attempt automatic recovery
    let recoveryAttempted = false;
    if (attemptRecovery) {
      try {
        recoveryAttempted = await errorRecovery.attemptRecovery(errorObj, fullContext);
      } catch (recoveryError) {
        console.error('Recovery attempt failed:', recoveryError);
      }
    }

    // Show user-friendly message if recovery failed or wasn't attempted
    if (showUserFriendlyMessage && !recoveryAttempted) {
      this.showUserFriendlyError(errorObj, fullContext);
    }
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }
    
    if (message.includes('network') || message.includes('server') || 
        message.includes('500') || message.includes('503')) {
      return 'high';
    }
    
    if (message.includes('validation') || message.includes('format') ||
        message.includes('required')) {
      return 'low';
    }
    
    return 'medium';
  }

  private showUserFriendlyError(error: Error, context: ErrorContext): void {
    const friendlyError = errorMessageTranslator.translateError(error, context);
    
    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      error: friendlyError,
      timestamp: new Date(),
      dismissed: false
    };

    this.errorNotifications.push(notification);
    
    // Notify listeners
    this.errorListeners.forEach(listener => listener(notification));

    // Auto-dismiss low severity errors after 10 seconds
    if (friendlyError.severity === 'low') {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, 10000);
    }
  }

  public addErrorListener(listener: (notification: ErrorNotification) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  public dismissNotification(id: string): void {
    const notification = this.errorNotifications.find(n => n.id === id);
    if (notification) {
      notification.dismissed = true;
    }
    
    // Clean up old notifications
    this.errorNotifications = this.errorNotifications.filter(
      n => !n.dismissed || (Date.now() - n.timestamp.getTime()) < 300000 // Keep for 5 minutes
    );
  }

  public getActiveNotifications(): ErrorNotification[] {
    return this.errorNotifications.filter(n => !n.dismissed);
  }

  public clearAllNotifications(): void {
    this.errorNotifications.forEach(n => n.dismissed = true);
  }

  private generateNotificationId(): string {
    return `error_notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Utility methods for common error scenarios
  public handleNetworkError(error: Error, context?: Partial<ErrorContext>): void {
    this.handleError(error, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      actions: ['network_error'],
      ...context
    }, {
      showUserFriendlyMessage: true,
      attemptRecovery: true,
      logError: true
    });
  }

  public handleAuthError(error: Error, context?: Partial<ErrorContext>): void {
    this.handleError(error, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      actions: ['auth_error'],
      ...context
    }, {
      showUserFriendlyMessage: true,
      attemptRecovery: true,
      logError: true
    });
  }

  public handleFormError(error: Error, formId: string, context?: Partial<ErrorContext>): void {
    this.handleError(error, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      actions: ['form_error'],
      state: { formId },
      ...context
    }, {
      showUserFriendlyMessage: true,
      attemptRecovery: false,
      logError: true
    });
  }

  public handleAIError(error: Error, conversationId?: string, context?: Partial<ErrorContext>): void {
    this.handleError(error, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      actions: ['ai_error'],
      state: { conversationId },
      ...context
    }, {
      showUserFriendlyMessage: true,
      attemptRecovery: true,
      logError: true
    });
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Convenience function for handling errors in components
export function handleError(
  error: Error | string,
  context?: Partial<ErrorContext>,
  options?: ErrorHandlerOptions
): void {
  const fullContext: ErrorContext = {
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    actions: ['component_error'],
    ...context
  };

  globalErrorHandler.handleError(error, fullContext, options);
}

export default GlobalErrorHandler;