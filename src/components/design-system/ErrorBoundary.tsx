import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundaryProps } from './types';
import { Button } from './Button';
import { Typography } from './Typography';
import { Card } from './Card';
import { Icon } from './Icon';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Default fallback component for senior-friendly error display
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => (
  <Card variant="outlined" padding="lg" className="max-w-md mx-auto mt-8">
    <div className="text-center">
      <Icon 
        name="AlertTriangle" 
        size="xl" 
        color="warning"
        className="mx-auto mb-4"
        aria-hidden={false}
      />
      
      <Typography variant="h3" className="mb-4">
        Something went wrong
      </Typography>
      
      <Typography variant="body" className="mb-6 text-neutral-600">
        We're sorry, but something unexpected happened. Don't worry - your information is safe.
      </Typography>
      
      <div className="space-y-4">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={resetError}
          className="w-full"
        >
          Try Again
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={() => window.location.reload()}
          className="w-full"
        >
          Refresh Page
        </Button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700">
            Technical Details (for developers)
          </summary>
          <pre className="mt-2 text-xs text-neutral-600 bg-neutral-50 p-3 rounded overflow-auto">
            {error.message}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  </Card>
);

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}