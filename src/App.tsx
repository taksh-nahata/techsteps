import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfService from './pages/TermsOfService';
import ContactUs from './pages/ContactUs';
import Accessibility from './pages/Accessibility';
import Community from './pages/Community';
import LearningCenterPage from './pages/LearningCenterPage';
import ChatDashboard from './pages/ChatDashboard';
import { GuideEditorPage } from './pages/GuideEditorPage';


import ProtectedRoute from './components/routing/ProtectedRoute';
import PublicRoute from './components/routing/PublicRoute';
import TileWaveLoader from './components/layout/TileWaveLoader'; // Import Loader
import { PWAProvider } from './components/pwa/PWAProvider';
// Main App component
import { CookieManager } from './utils/cookieManager';
// import { errorLogger } from './utils/errors/errorLogger';
import { performanceMonitor } from './utils/performanceMonitor';
import { useTranslationAnimation } from './contexts/TranslationAnimationContext';
import { useUser } from './contexts/UserContext';
import { useAuth } from './contexts/AuthContext';
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization';
import { ErrorRecoveryProvider, ErrorRecoveryBoundary } from './components/error-recovery';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { KeyboardNavigationManager, AccessibilityAnnouncer } from './components/accessibility';
import { GlobalSearch } from './components/common/GlobalSearch';
import i18n from './i18n';
import './styles/globals.css';

function App() {
  const { setIsTranslating } = useTranslationAnimation();
  const [showSplash, setShowSplash] = React.useState(true);

  // Get authentication and user status
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: userLoading } = useUser();

  // TileWaveLoader handles its own timing, just hide when it signals complete
  const handleSplashComplete = React.useCallback(() => {
    setShowSplash(false);
  }, []);

  // Initialize performance optimizations
  usePerformanceOptimization({
    enableImageLazyLoading: true,
    enableResourceHints: true,
    enableServiceWorker: true,
    criticalResourceTimeout: 1500
  });

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.measureLandingPageLoad();

    // Clear any console errors from development
    // Temporarily disabled to fix React hooks issue
    // errorLogger.clearConsoleErrors();

    // Apply saved preferences on app load
    const preferences = CookieManager.getPreferences();
    if (preferences) {
      CookieManager.applyPreferences(preferences);
    }

    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      // Don't wait for load event - register immediately
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Set up controller change listener
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed');
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
          console.error('Service worker registration failed:', registrationError);
        });
    }

    const handleLanguageChanged = () => {
      // Delay hiding the animation to allow it to complete its fade-out
      setTimeout(() => {
        setIsTranslating(false);
      }, 300);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [setIsTranslating]);

  return (
    <PWAProvider>
      <AccessibilityProvider>
        <ErrorRecoveryProvider
          enableNotifications={true}
          enableSessionRestore={false}
          enableNetworkMonitor={true}
          maxNotifications={3}
        >
          <ErrorRecoveryBoundary
            onError={(error, errorInfo) => console.error('React Error:', error, errorInfo)}
          >
            <KeyboardNavigationManager>
              {showSplash && <TileWaveLoader onComplete={handleSplashComplete} />}
              <Router>
                <AccessibilityAnnouncer />
                <GlobalSearch />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
                  <Routes>
                    <Route path="/" element={
                      (authLoading || userLoading) ? <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
                      </div> :
                        user && hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> :
                          user && !hasCompletedOnboarding ? <Navigate to="/onboarding" replace /> :
                            <LandingPage />
                    } />
                    <Route
                      path="/auth"
                      element={
                        <PublicRoute>
                          <AuthPage />
                        </PublicRoute>
                      }
                    />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute requiresOnboarding={false}>
                          {userLoading ? null : hasCompletedOnboarding ? <Navigate to="/dashboard" replace /> : <OnboardingPage />}
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/learning"
                      element={
                        <ProtectedRoute>
                          <LearningCenterPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chat"
                      element={
                        <ProtectedRoute>
                          <ChatDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/guide-editor"
                      element={
                        <ProtectedRoute>
                          <GuideEditorPage />
                        </ProtectedRoute>
                      }
                    />



                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/accessibility" element={<Accessibility />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </Router>
            </KeyboardNavigationManager>
          </ErrorRecoveryBoundary>
        </ErrorRecoveryProvider>
      </AccessibilityProvider>
    </PWAProvider>
  );
}

export default App;