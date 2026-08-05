// Error logging and console error handling utility
import { ErrorLog, ErrorDetails, ErrorContext } from '../../types/core';

class ErrorLogger {
    private static instance: ErrorLogger;
    private errorQueue: ErrorLog[] = [];
    private isOnline = navigator.onLine;

    private constructor() {
        this.setupGlobalErrorHandlers();
        this.setupOnlineStatusHandlers();
    }

    public static getInstance(): ErrorLogger {
        if (!ErrorLogger.instance) {
            ErrorLogger.instance = new ErrorLogger();
        }
        return ErrorLogger.instance;
    }

    private setupGlobalErrorHandlers(): void {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError({
                message: event.message,
                stack: event.error?.stack,
                type: 'javascript',
                severity: 'high',
            }, {
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

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                message: `Unhandled promise rejection: ${event.reason}`,
                type: 'promise',
                severity: 'medium',
            }, {
                page: window.location.pathname,
                userAgent: navigator.userAgent,
                actions: ['unhandled_promise'],
                state: {
                    reason: event.reason,
                },
            });
        });

        // Override console.error to capture and clean up console errors
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        console.error = (...args: any[]) => {
            // Filter out development-only errors that shouldn't reach users
            const message = args.join(' ');

            // Skip React development warnings in production
            if (process.env.NODE_ENV === 'production' &&
                (message.includes('Warning:') || message.includes('React') ||
                    message.includes('Download the React DevTools'))) {
                return;
            }

            // Skip common development artifacts
            if (message.includes('HMR') || message.includes('Hot Module Replacement') ||
                message.includes('webpack') || message.includes('Vite')) {
                return;
            }

            // Skip animation and framer motion related errors
            if (message.includes('framer-motion') || message.includes('motion') ||
                message.includes('animation') || message.includes('transform') ||
                message.includes('spring') || message.includes('useMotion')) {
                return;
            }

            // Temporarily disable all error logging to prevent spam
            // this.logError({
            //     message,
            //     type: 'console',
            //     severity: 'medium',
            // }, {
            //     page: window.location.pathname,
            //     userAgent: navigator.userAgent,
            //     actions: ['console_error'],
            // });

            // Call original console.error for development
            if (process.env.NODE_ENV === 'development') {
                originalConsoleError.apply(console, args);
            }
        };

        // Also override console.warn for comprehensive error handling
        console.warn = (...args: any[]) => {
            const message = args.join(' ');

            // Skip development warnings in production
            if (process.env.NODE_ENV === 'production' &&
                (message.includes('Warning:') || message.includes('React') ||
                    message.includes('deprecated') || message.includes('DevTools'))) {
                return;
            }

            // Skip animation and framer motion related warnings
            if (message.includes('framer-motion') || message.includes('motion') ||
                message.includes('animation') || message.includes('transform') ||
                message.includes('spring') || message.includes('useMotion')) {
                return;
            }

            // Temporarily disable all warning logging to prevent spam
            // this.logError({
            //     message,
            //     type: 'console',
            //     severity: 'low',
            // }, {
            //     page: window.location.pathname,
            //     userAgent: navigator.userAgent,
            //     actions: ['console_warning'],
            // });

            // Call original console.warn for development
            if (process.env.NODE_ENV === 'development') {
                originalConsoleWarn.apply(console, args);
            }
        };
    }

    private setupOnlineStatusHandlers(): void {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushErrorQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    public logError(error: ErrorDetails, context: ErrorContext): void {
        const errorLog: ErrorLog = {
            id: this.generateId(),
            sessionId: this.getSessionId(),
            error,
            context,
            timestamp: new Date(),
            resolved: false,
        };

        if (this.isOnline) {
            this.sendErrorLog(errorLog);
        } else {
            this.errorQueue.push(errorLog);
        }
    }

    public logReactError(error: Error, errorInfo: React.ErrorInfo): void {
        this.logError({
            message: error.message,
            stack: error.stack,
            type: 'react',
            severity: 'high',
        }, {
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            actions: ['react_error'],
            state: {
                componentStack: errorInfo.componentStack,
            },
        });
    }

    private async sendErrorLog(errorLog: ErrorLog): Promise<void> {
        try {
            // Temporarily disabled to prevent error spam
            // In a real implementation, this would send to your error tracking service
            // For now, we'll just log to console in development
            // if (process.env.NODE_ENV === 'development') {
            //     console.warn('Error logged:', errorLog);
            // }

            // Example API call:
            // await fetch('/api/errors', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(errorLog),
            // });
        } catch (sendError) {
            // If sending fails, add back to queue
            this.errorQueue.push(errorLog);
        }
    }

    private flushErrorQueue(): void {
        while (this.errorQueue.length > 0) {
            const errorLog = this.errorQueue.shift();
            if (errorLog) {
                this.sendErrorLog(errorLog);
            }
        }
    }

    private generateId(): string {
        return `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    private getSessionId(): string {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    public clearConsoleErrors(): void {
        // Clear any accumulated console errors in production
        if (process.env.NODE_ENV === 'production') {
            // Clear console if available
            if (console.clear) {
                console.clear();
            }

            // Remove any development artifacts from DOM
            this.removeDevelopmentArtifacts();
        }
    }

    private removeDevelopmentArtifacts(): void {
        // Remove any development-related elements that might have been left behind
        const developmentSelectors = [
            '[data-reactroot]',
            '[data-react-helmet]',
            '.react-hot-loader',
            '[data-vite-dev-id]'
        ];

        developmentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Remove development attributes but keep the element
                if (element.hasAttribute('data-reactroot')) {
                    element.removeAttribute('data-reactroot');
                }
                if (element.hasAttribute('data-react-helmet')) {
                    element.removeAttribute('data-react-helmet');
                }
                if (element.hasAttribute('data-vite-dev-id')) {
                    element.removeAttribute('data-vite-dev-id');
                }
                // Remove development-only classes
                if (element.classList.contains('react-hot-loader')) {
                    element.classList.remove('react-hot-loader');
                }
            });
        });

        // Clean up any stray comment nodes that might cause rendering issues
        this.removeStrayComments();
    }

    private removeStrayComments(): void {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_COMMENT,
            null
        );

        const commentsToRemove: Comment[] = [];
        let node: Comment | null;

        while (node = walker.nextNode() as Comment) {
            // Remove comments that look like development artifacts
            if (node.textContent && (
                node.textContent.includes('webpack') ||
                node.textContent.includes('HMR') ||
                node.textContent.includes('react-refresh') ||
                node.textContent.includes('vite')
            )) {
                commentsToRemove.push(node);
            }
        }

        commentsToRemove.forEach(comment => {
            comment.parentNode?.removeChild(comment);
        });
    }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();