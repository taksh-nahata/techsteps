// User-Friendly Error Messages for Senior Learning Platform
// Converts technical errors into plain language with clear action steps

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface UserFriendlyError {
  title: string;
  message: string;
  severity: ErrorSeverity;
  actions: ErrorAction[];
  icon: string;
  supportContact?: boolean;
  technicalDetails?: string;
}

export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
  icon?: string;
}

export interface ErrorPattern {
  pattern: RegExp | string;
  severity: ErrorSeverity;
  title: string;
  message: string;
  actions: string[];
  icon: string;
  supportContact?: boolean;
}

class ErrorMessageTranslator {
  private static instance: ErrorMessageTranslator;
  private errorPatterns: ErrorPattern[] = [];

  private constructor() {
    this.registerDefaultPatterns();
  }

  public static getInstance(): ErrorMessageTranslator {
    if (!ErrorMessageTranslator.instance) {
      ErrorMessageTranslator.instance = new ErrorMessageTranslator();
    }
    return ErrorMessageTranslator.instance;
  }

  private registerDefaultPatterns(): void {
    // Network and connectivity errors
    this.registerPattern({
      pattern: /network|fetch|connection|timeout|offline/i,
      severity: 'medium',
      title: 'Connection Problem',
      message: 'We\'re having trouble connecting to the internet. This might be because your Wi-Fi is down or the connection is slow.',
      actions: ['check_connection', 'try_again', 'contact_support'],
      icon: 'WifiOff'
    });

    // Authentication errors
    this.registerPattern({
      pattern: /401|unauthorized|auth.*failed|auth.*error|authentication required|session expired|please sign in|login required/i,
      severity: 'medium',
      title: 'Sign-In Required',
      message: 'You need to sign in again to continue. This happens for security reasons after some time.',
      actions: ['sign_in', 'contact_support'],
      icon: 'Lock'
    });

    // Permission errors
    this.registerPattern({
      pattern: /403|forbidden|permission|access denied/i,
      severity: 'medium',
      title: 'Access Not Allowed',
      message: 'You don\'t have permission to access this feature. This might be a temporary issue.',
      actions: ['go_back', 'contact_support'],
      icon: 'Shield'
    });

    // Server errors
    this.registerPattern({
      pattern: /500|502|503|504|server|internal/i,
      severity: 'high',
      title: 'Service Temporarily Down',
      message: 'Our service is having a temporary problem. This is not your fault - we\'re working to fix it.',
      actions: ['wait_and_retry', 'contact_support'],
      icon: 'Server',
      supportContact: true
    });

    // Not found errors
    this.registerPattern({
      pattern: /404|not found|missing/i,
      severity: 'medium',
      title: 'Page Not Found',
      message: 'The page you\'re looking for doesn\'t exist or has been moved. Let\'s get you back on track.',
      actions: ['go_home', 'go_back', 'contact_support'],
      icon: 'Search'
    });

    // Memory/performance errors
    this.registerPattern({
      pattern: /memory|heap|performance|slow|lag/i,
      severity: 'medium',
      title: 'Running Slowly',
      message: 'The app is running slowly, possibly because your device is low on memory. Let\'s try to speed things up.',
      actions: ['refresh_page', 'close_tabs', 'restart_browser'],
      icon: 'Zap'
    });

    // Form validation errors
    this.registerPattern({
      pattern: /validation|invalid|required|format/i,
      severity: 'low',
      title: 'Information Needed',
      message: 'Some information is missing or needs to be corrected. Please check the highlighted fields.',
      actions: ['check_form', 'try_again'],
      icon: 'AlertCircle'
    });

    // File upload errors
    this.registerPattern({
      pattern: /upload|file|size|format|type/i,
      severity: 'medium',
      title: 'File Problem',
      message: 'There\'s an issue with the file you\'re trying to upload. It might be too large or in the wrong format.',
      actions: ['check_file', 'try_different_file', 'contact_support'],
      icon: 'Upload'
    });

    // AI/Chat errors
    this.registerPattern({
      pattern: /ai|chat|assistant|conversation/i,
      severity: 'medium',
      title: 'Assistant Unavailable',
      message: 'Our AI assistant is having trouble right now. You can still use the rest of the platform normally.',
      actions: ['try_again_later', 'contact_human_support', 'continue_without_ai'],
      icon: 'MessageCircle',
      supportContact: true
    });

    // Browser compatibility errors
    this.registerPattern({
      pattern: /browser|compatibility|unsupported|outdated/i,
      severity: 'high',
      title: 'Browser Issue',
      message: 'Your web browser might be outdated or incompatible. This can cause problems with the platform.',
      actions: ['update_browser', 'try_different_browser', 'contact_support'],
      icon: 'Globe'
    });

    // JavaScript errors
    this.registerPattern({
      pattern: /javascript|script|syntax|reference/i,
      severity: 'high',
      title: 'Technical Problem',
      message: 'Something went wrong with the website\'s code. This is not your fault - it\'s a technical issue on our end.',
      actions: ['refresh_page', 'try_again_later', 'contact_support'],
      icon: 'Code',
      supportContact: true
    });

    // Generic fallback
    this.registerPattern({
      pattern: /.*/,
      severity: 'medium',
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected problem. Don\'t worry - your information is safe and we\'re here to help.',
      actions: ['try_again', 'refresh_page', 'contact_support'],
      icon: 'AlertTriangle',
      supportContact: true
    });
  }

  public registerPattern(pattern: ErrorPattern): void {
    this.errorPatterns.push(pattern);
  }

  public translateError(error: Error | string, context?: any): UserFriendlyError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    // Find matching pattern
    const matchedPattern = this.errorPatterns.find(pattern => {
      if (typeof pattern.pattern === 'string') {
        return errorMessage.toLowerCase().includes(pattern.pattern.toLowerCase());
      }
      return pattern.pattern.test(errorMessage);
    });

    if (!matchedPattern) {
      // Fallback to generic error
      return this.createGenericError(errorMessage, errorStack);
    }

    return {
      title: matchedPattern.title,
      message: matchedPattern.message,
      severity: matchedPattern.severity,
      actions: this.createActions(matchedPattern.actions, context),
      icon: matchedPattern.icon,
      supportContact: matchedPattern.supportContact,
      technicalDetails: process.env.NODE_ENV === 'development' ?
        `${errorMessage}\n${errorStack || ''}` : undefined
    };
  }

  private createActions(actionTypes: string[], _context?: any): ErrorAction[] {
    const actionMap: Record<string, ErrorAction> = {
      try_again: {
        label: 'Try Again',
        action: () => window.location.reload(),
        primary: true,
        icon: 'RefreshCw'
      },
      refresh_page: {
        label: 'Refresh Page',
        action: () => window.location.reload(),
        primary: true,
        icon: 'RefreshCw'
      },
      go_back: {
        label: 'Go Back',
        action: () => window.history.back(),
        icon: 'ArrowLeft'
      },
      go_home: {
        label: 'Go to Home',
        action: () => { window.location.href = '/'; },
        icon: 'Home'
      },
      sign_in: {
        label: 'Sign In',
        action: () => { window.location.href = '/auth'; },
        primary: true,
        icon: 'LogIn'
      },
      check_connection: {
        label: 'Check Internet Connection',
        action: async () => {
          // Open network settings help
          if (navigator.onLine) {
            alert('Your internet connection appears to be working. Try refreshing the page.');
          } else {
            alert('Please check your Wi-Fi or internet connection and try again.');
          }
        },
        icon: 'Wifi'
      },
      check_form: {
        label: 'Check Form',
        action: () => {
          // Scroll to first error field
          const errorField = document.querySelector('[aria-invalid="true"]') as HTMLElement;
          if (errorField) {
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorField.focus();
          }
        },
        primary: true,
        icon: 'Edit'
      },
      check_file: {
        label: 'Check File',
        action: () => {
          alert('Please make sure your file is smaller than 10MB and in a supported format (JPG, PNG, PDF).');
        },
        icon: 'File'
      },
      try_different_file: {
        label: 'Try Different File',
        action: () => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) {
            fileInput.value = '';
            fileInput.click();
          }
        },
        icon: 'Upload'
      },
      wait_and_retry: {
        label: 'Wait and Try Again',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          window.location.reload();
        },
        primary: true,
        icon: 'Clock'
      },
      try_again_later: {
        label: 'Try Again Later',
        action: () => {
          alert('Please try again in a few minutes. We\'re working to fix this issue.');
        },
        icon: 'Clock'
      },
      close_tabs: {
        label: 'Close Other Tabs',
        action: () => {
          alert('Try closing other browser tabs to free up memory, then refresh this page.');
        },
        icon: 'X'
      },
      restart_browser: {
        label: 'Restart Browser',
        action: () => {
          alert('Try closing your browser completely and opening it again.');
        },
        icon: 'RotateCcw'
      },
      update_browser: {
        label: 'Update Browser',
        action: () => {
          const userAgent = navigator.userAgent;
          let updateUrl = 'https://browsehappy.com/';

          if (userAgent.includes('Chrome')) {
            updateUrl = 'chrome://settings/help';
          } else if (userAgent.includes('Firefox')) {
            updateUrl = 'https://support.mozilla.org/en-US/kb/update-firefox-latest-release';
          } else if (userAgent.includes('Safari')) {
            updateUrl = 'https://support.apple.com/en-us/HT204416';
          }

          window.open(updateUrl, '_blank');
        },
        icon: 'Download'
      },
      try_different_browser: {
        label: 'Try Different Browser',
        action: () => {
          alert('Try using a different web browser like Chrome, Firefox, or Safari.');
        },
        icon: 'Globe'
      },
      contact_support: {
        label: 'Get Help',
        action: () => this.openSupportContact(),
        icon: 'HelpCircle'
      },
      contact_human_support: {
        label: 'Talk to a Person',
        action: () => this.openSupportContact(true),
        primary: true,
        icon: 'MessageSquare'
      },
      continue_without_ai: {
        label: 'Continue Without Assistant',
        action: () => {
          // Hide AI chat interface
          const aiChat = document.querySelector('[data-ai-chat]') as HTMLElement;
          if (aiChat) {
            aiChat.style.display = 'none';
          }
        },
        icon: 'ArrowRight'
      }
    };

    return actionTypes.map(type => actionMap[type]).filter(Boolean);
  }

  private createGenericError(message: string, stack?: string): UserFriendlyError {
    return {
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected problem. Don\'t worry - your information is safe and we\'re here to help.',
      severity: 'medium',
      actions: [
        {
          label: 'Try Again',
          action: () => window.location.reload(),
          primary: true,
          icon: 'RefreshCw'
        },
        {
          label: 'Get Help',
          action: () => this.openSupportContact(),
          icon: 'HelpCircle'
        }
      ],
      icon: 'AlertTriangle',
      supportContact: true,
      technicalDetails: process.env.NODE_ENV === 'development' ?
        `${message}\n${stack || ''}` : undefined
    };
  }

  private openSupportContact(urgent: boolean = false): void {
    // This would integrate with your support system
    // For now, we'll show a simple contact method
    const supportMessage = urgent ?
      'For immediate help, please call our support line at 1-800-HELP-NOW or email urgent@support.com' :
      'For help, please email support@platform.com or use the help button in the bottom right corner.';

    alert(supportMessage);

    // In a real implementation, this might:
    // - Open a chat widget
    // - Show a contact form
    // - Redirect to a support page
    // - Trigger a callback request
  }

  // Method to get severity color for UI components
  public getSeverityColor(severity: ErrorSeverity): string {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  // Method to get severity icon color
  public getSeverityIconColor(severity: ErrorSeverity): 'primary' | 'warning' | 'error' {
    switch (severity) {
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
  }
}

// Export singleton instance
export const errorMessageTranslator = ErrorMessageTranslator.getInstance();
export default ErrorMessageTranslator;