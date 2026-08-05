// Error Recovery Framework for Senior Learning Platform
// Implements retry mechanisms, session restoration, progress preservation, and offline action queueing

import { ErrorContext } from '../../types/core';
import { errorLogger } from './errorLogger';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface SessionData {
  userId?: string;
  currentPage: string;
  formData: Record<string, any>;
  scrollPosition: number;
  timestamp: number;
  tutorialProgress?: {
    tutorialId: string;
    sectionId: string;
    completedSections: string[];
  };
  conversationContext?: {
    messages: any[];
    context: any;
  };
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface RecoveryStrategy {
  name: string;
  condition: (error: Error) => boolean;
  handler: (error: Error, context: ErrorContext) => Promise<boolean>;
  priority: number;
}

class ErrorRecoveryFramework {
  private static instance: ErrorRecoveryFramework;
  private actionQueue: QueuedAction[] = [];
  private sessionData: SessionData | null = null;
  private recoveryStrategies: RecoveryStrategy[] = [];
  private isOnline = navigator.onLine;
  private sessionKey = 'senior-platform-session';
  private queueKey = 'senior-platform-action-queue';

  private constructor() {
    this.setupEventListeners();
    this.loadSessionData();
    this.loadActionQueue();
    this.registerDefaultStrategies();
  }

  public static getInstance(): ErrorRecoveryFramework {
    if (!ErrorRecoveryFramework.instance) {
      ErrorRecoveryFramework.instance = new ErrorRecoveryFramework();
    }
    return ErrorRecoveryFramework.instance;
  }

  private setupEventListeners(): void {
    // Online/offline status monitoring
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processActionQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Session data preservation
    window.addEventListener('beforeunload', () => {
      this.saveSessionData();
    });

    // Periodic session saving
    setInterval(() => {
      this.saveSessionData();
    }, 30000); // Save every 30 seconds

    // Page visibility change handling
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveSessionData();
      }
    });
  }

  private registerDefaultStrategies(): void {
    // Network error recovery
    this.registerRecoveryStrategy({
      name: 'network-retry',
      condition: (error) => 
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('timeout'),
      handler: async () => {
        console.log('Attempting network error recovery...');
        // Wait for network to come back online
        if (!this.isOnline) {
          return new Promise((resolve) => {
            const checkOnline = () => {
              if (navigator.onLine) {
                window.removeEventListener('online', checkOnline);
                resolve(true);
              }
            };
            window.addEventListener('online', checkOnline);
          });
        }
        return true;
      },
      priority: 1
    });

    // Authentication error recovery
    this.registerRecoveryStrategy({
      name: 'auth-refresh',
      condition: (error) => 
        error.message.includes('401') || 
        error.message.includes('unauthorized') ||
        error.message.includes('token'),
      handler: async () => {
        console.log('Attempting authentication recovery...');
        try {
          // Attempt to refresh authentication token
          const refreshResult = await this.refreshAuthToken();
          return refreshResult;
        } catch {
          // If refresh fails, redirect to login
          window.location.href = '/auth';
          return false;
        }
      },
      priority: 2
    });

    // Memory/performance error recovery
    this.registerRecoveryStrategy({
      name: 'memory-cleanup',
      condition: (error) => 
        error.message.includes('memory') || 
        error.message.includes('heap') ||
        error.message.includes('performance'),
      handler: async () => {
        console.log('Attempting memory cleanup recovery...');
        // Clear caches and perform garbage collection
        this.performMemoryCleanup();
        return true;
      },
      priority: 3
    });
  }

  // Retry mechanism with exponential backoff
  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const defaultConfig: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryCondition: () => true
    };

    const finalConfig = { ...defaultConfig, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry this error
        if (!finalConfig.retryCondition!(lastError)) {
          throw lastError;
        }

        // Don't delay on the last attempt
        if (attempt === finalConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelay
        );

        console.log(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms`);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  // Session restoration functionality
  public saveSessionData(): void {
    try {
      const currentSessionData: SessionData = {
        currentPage: window.location.pathname,
        formData: this.collectFormData(),
        scrollPosition: window.scrollY,
        timestamp: Date.now(),
        tutorialProgress: this.getCurrentTutorialProgress(),
        conversationContext: this.getCurrentConversationContext()
      };

      this.sessionData = currentSessionData;
      localStorage.setItem(this.sessionKey, JSON.stringify(currentSessionData));
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }

  public loadSessionData(): SessionData | null {
    try {
      const saved = localStorage.getItem(this.sessionKey);
      if (saved) {
        this.sessionData = JSON.parse(saved);
        return this.sessionData;
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
    return null;
  }

  public async restoreSession(): Promise<boolean> {
    if (!this.sessionData) {
      return false;
    }

    try {
      // Check if session is recent (within 1 hour)
      const sessionAge = Date.now() - this.sessionData.timestamp;
      if (sessionAge > 3600000) { // 1 hour
        this.clearSessionData();
        return false;
      }

      // Restore form data
      this.restoreFormData(this.sessionData.formData);

      // Restore scroll position
      window.scrollTo(0, this.sessionData.scrollPosition);

      // Restore tutorial progress if applicable
      if (this.sessionData.tutorialProgress) {
        await this.restoreTutorialProgress(this.sessionData.tutorialProgress);
      }

      // Restore conversation context if applicable
      if (this.sessionData.conversationContext) {
        await this.restoreConversationContext(this.sessionData.conversationContext);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return false;
    }
  }

  // Offline action queueing
  public queueAction(type: string, payload: any, maxRetries: number = 3): void {
    const action: QueuedAction = {
      id: this.generateActionId(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    this.actionQueue.push(action);
    this.saveActionQueue();

    // If online, try to process immediately
    if (this.isOnline) {
      this.processActionQueue();
    }
  }

  public async processActionQueue(): Promise<void> {
    if (!this.isOnline || this.actionQueue.length === 0) {
      return;
    }

    const actionsToProcess = [...this.actionQueue];
    this.actionQueue = [];

    for (const action of actionsToProcess) {
      try {
        await this.executeQueuedAction(action);
      } catch (error) {
        console.error(`Failed to execute queued action ${action.id}:`, error);
        
        // Retry if under limit
        if (action.retryCount < action.maxRetries) {
          action.retryCount++;
          this.actionQueue.push(action);
        } else {
          console.warn(`Action ${action.id} exceeded max retries and will be discarded`);
        }
      }
    }

    this.saveActionQueue();
  }

  // Recovery strategy registration and execution
  public registerRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  public async attemptRecovery(error: Error, context: ErrorContext): Promise<boolean> {
    // Log the recovery attempt
    errorLogger.logError({
      message: `Attempting error recovery: ${error.message}`,
      type: 'recovery',
      severity: 'medium'
    }, {
      ...context,
      actions: [...context.actions, 'recovery_attempt']
    });

    for (const strategy of this.recoveryStrategies) {
      if (strategy.condition(error)) {
        try {
          console.log(`Attempting recovery with strategy: ${strategy.name}`);
          const success = await strategy.handler(error, context);
          if (success) {
            console.log(`Recovery successful with strategy: ${strategy.name}`);
            
            // Log successful recovery
            errorLogger.logError({
              message: `Recovery successful with strategy: ${strategy.name}`,
              type: 'recovery',
              severity: 'low'
            }, {
              ...context,
              actions: [...context.actions, 'recovery_success']
            });
            
            return true;
          }
        } catch (recoveryError) {
          console.error(`Recovery strategy ${strategy.name} failed:`, recoveryError);
          
          // Log recovery failure
          errorLogger.logError({
            message: `Recovery strategy ${strategy.name} failed: ${recoveryError}`,
            type: 'recovery',
            severity: 'high'
          }, {
            ...context,
            actions: [...context.actions, 'recovery_failure']
          });
        }
      }
    }
    
    // Log overall recovery failure
    errorLogger.logError({
      message: `All recovery strategies failed for: ${error.message}`,
      type: 'recovery',
      severity: 'high'
    }, {
      ...context,
      actions: [...context.actions, 'recovery_failed']
    });
    
    return false;
  }

  // Progress preservation
  public preserveProgress(key: string, data: any): void {
    try {
      const progressKey = `progress_${key}`;
      localStorage.setItem(progressKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn(`Failed to preserve progress for ${key}:`, error);
    }
  }

  public restoreProgress(key: string): any | null {
    try {
      const progressKey = `progress_${key}`;
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        
        // Check if progress is recent (within 24 hours)
        const age = Date.now() - timestamp;
        if (age < 86400000) { // 24 hours
          return data;
        } else {
          localStorage.removeItem(progressKey);
        }
      }
    } catch (error) {
      console.warn(`Failed to restore progress for ${key}:`, error);
    }
    return null;
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private collectFormData(): Record<string, any> {
    const formData: Record<string, any> = {};
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form, index) => {
      const formElements = form.querySelectorAll('input, textarea, select');
      const formKey = form.id || `form_${index}`;
      formData[formKey] = {};
      
      formElements.forEach((element) => {
        const input = element as HTMLInputElement;
        if (input.name && input.value) {
          formData[formKey][input.name] = input.value;
        }
      });
    });
    
    return formData;
  }

  private restoreFormData(formData: Record<string, any>): void {
    Object.entries(formData).forEach(([formKey, fields]) => {
      const form = document.getElementById(formKey) || 
                   document.querySelectorAll('form')[parseInt(formKey.split('_')[1]) || 0];
      
      if (form) {
        Object.entries(fields as Record<string, any>).forEach(([fieldName, value]) => {
          const field = form.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
          if (field && typeof value === 'string') {
            field.value = value;
          }
        });
      }
    });
  }

  private getCurrentTutorialProgress(): any {
    // This would integrate with your tutorial system
    // For now, return null as placeholder
    return null;
  }

  private getCurrentConversationContext(): any {
    // This would integrate with your AI conversation system
    // For now, return null as placeholder
    return null;
  }

  private async restoreTutorialProgress(progress: any): Promise<void> {
    // Implementation would depend on your tutorial system
    console.log('Restoring tutorial progress:', progress);
  }

  private async restoreConversationContext(context: any): Promise<void> {
    // Implementation would depend on your AI conversation system
    console.log('Restoring conversation context:', context);
  }

  private async executeQueuedAction(action: QueuedAction): Promise<void> {
    // This would route to appropriate action handlers
    console.log(`Executing queued action: ${action.type}`, action.payload);
    
    // Example action handlers
    switch (action.type) {
      case 'save_progress':
        await this.handleSaveProgress(action.payload);
        break;
      case 'submit_feedback':
        await this.handleSubmitFeedback(action.payload);
        break;
      case 'ai_message':
        await this.handleAIMessage(action.payload);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async handleSaveProgress(payload: any): Promise<void> {
    // Implement progress saving logic
    console.log('Saving progress:', payload);
  }

  private async handleSubmitFeedback(payload: any): Promise<void> {
    // Implement feedback submission logic
    console.log('Submitting feedback:', payload);
  }

  private async handleAIMessage(payload: any): Promise<void> {
    // Implement AI message handling logic
    console.log('Processing AI message:', payload);
  }

  private async refreshAuthToken(): Promise<boolean> {
    // Implement token refresh logic
    // This would integrate with your authentication system
    console.log('Refreshing authentication token...');
    return true;
  }

  private performMemoryCleanup(): void {
    // Clear various caches and perform cleanup
    try {
      // Clear image caches
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);
        }
      });

      // Clear old session storage items
      const now = Date.now();
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('temp_')) {
          try {
            const item = JSON.parse(sessionStorage.getItem(key) || '{}');
            if (item.timestamp && (now - item.timestamp) > 3600000) { // 1 hour
              sessionStorage.removeItem(key);
            }
          } catch {
            sessionStorage.removeItem(key);
          }
        }
      }

      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
    } catch (error) {
      console.warn('Memory cleanup failed:', error);
    }
  }

  private saveActionQueue(): void {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(this.actionQueue));
    } catch (error) {
      console.warn('Failed to save action queue:', error);
    }
  }

  private loadActionQueue(): void {
    try {
      const saved = localStorage.getItem(this.queueKey);
      if (saved) {
        this.actionQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load action queue:', error);
      this.actionQueue = [];
    }
  }

  public clearSessionData(): void {
    this.sessionData = null;
    localStorage.removeItem(this.sessionKey);
  }

  public clearActionQueue(): void {
    this.actionQueue = [];
    localStorage.removeItem(this.queueKey);
  }

  // Public API methods
  public getQueuedActionCount(): number {
    return this.actionQueue.length;
  }

  public isOffline(): boolean {
    return !this.isOnline;
  }

  public hasSessionData(): boolean {
    return this.sessionData !== null;
  }
}

// Export singleton instance
export const errorRecovery = ErrorRecoveryFramework.getInstance();
export default ErrorRecoveryFramework;