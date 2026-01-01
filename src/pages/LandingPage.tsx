import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MessageSquare,
  Star,
  CheckCircle,
  Heart
} from 'lucide-react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import Logo from '../components/layout/Logo';
import LanguageSelector from '../components/layout/LanguageSelector';
import LazySection from '../components/common/LazySection';
// Lazy load HeroAnimation for better performance
const HeroAnimation = lazy(() => import('../components/animations/HeroAnimation'));
const CursorTrail = lazy(() => import('../components/animations/CursorTrail'));

import { performanceMonitor } from '../utils/performanceMonitor';
import { useTranslation, useRTLStyles } from '../hooks/useTranslation';

// Lazy load non-critical sections
const FeatureSection = lazy(() => import('../components/sections/FeatureSection'));

// Create loading fallback component
const SectionLoadingFallback: React.FC<{ className?: string }> = ({ className = '' }) => (
  <section className={`py-16 sm:py-24 ${className}`}>
    <div className="container mx-auto px-4 sm:px-6">
      <div className="text-center mb-12 sm:mb-20">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse mb-6 max-w-md mx-auto"></div>
        <div className="h-6 bg-gray-200 rounded-lg animate-pulse max-w-2xl mx-auto"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="w-8 h-8 bg-gray-200 rounded-full mb-3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { isRTL, direction } = useRTLStyles();

  useEffect(() => {
    // Start measuring landing page performance
    performanceMonitor.measureLandingPageLoad();
  }, []);

  const popularQuestions = [
    t('questions.connectWifi'),
    t('questions.makeTextBigger'),
    t('questions.takeScreenshot'),
    t('questions.updateApps'),
    t('questions.makeVideoCall'),
    t('questions.backupPhotos'),
    t('questions.onlineBanking'),
    t('questions.joinZoom')
  ];

  const [loadedSections, setLoadedSections] = useState<number[]>([0]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="w-full sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100" dir={direction}>
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className={`flex items-center justify-between h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Logo */}
            <div className="flex items-center h-full">
              <Logo size="md" />
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center h-full">
              <button
                className="text-gray-600 hover:text-gray-800 focus:outline-none p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center"
                onClick={() => {
                  const mobileMenu = document.getElementById('mobile-menu');
                  if (mobileMenu) {
                    mobileMenu.classList.toggle('hidden');
                  }
                }}
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              </button>
            </div>

            {/* Desktop Menu */}
            <div className={`hidden lg:flex items-center h-full space-x-6 ${isRTL ? 'space-x-reverse' : ''}`}>
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors whitespace-nowrap text-sm flex items-center h-full"
              >
                {t('nav.features')}
              </a>

              <div className="flex items-center h-full">
                <LanguageSelector showLabel={false} />
              </div>

              <Link
                to="/auth"
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-md hover:bg-gray-100 whitespace-nowrap text-sm flex items-center"
              >
                {t('nav.signIn')}
              </Link>

              <Link
                to="/auth"
                className="btn-primary text-sm px-6 py-2.5 whitespace-nowrap font-medium flex items-center"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div id="mobile-menu" className="hidden lg:hidden">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col space-y-4 py-4 border-t border-gray-200">
              <a href="#features" className="text-gray-600 hover:text-gray-800 font-medium transition-colors py-2 text-sm">
                {t('nav.features')}
              </a>
              <div className="py-2">
                <LanguageSelector showLabel={true} />
              </div>
              <Link
                to="/auth"
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors py-2 text-sm"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                to="/auth"
                className="btn-primary text-sm px-4 py-3 text-center font-medium"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <LazySection
        sectionIndex={0}
        canLoad={loadedSections.includes(0)}
        onLoadComplete={() =>
          setLoadedSections((prev) =>
            prev.includes(1) ? prev : [...prev, 1]
          )
        }
      >
        <section className="container mx-auto px-4 sm:px-6 py-16 md:py-20 relative overflow-hidden" data-hero-section>
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
          </div>

          {/* Cursor Trail Effect */}
          <Suspense fallback={null}>
            <CursorTrail />
          </Suspense>

          <div className="max-w-6xl mx-auto animate-fade-in" dir={direction}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isRTL ? 'lg:grid-flow-col-dense' : ''}`}>
              {/* Text Content - Order changes based on RTL */}
              <div className={`text-center lg:text-start ${isRTL ? 'lg:col-start-2' : ''}`}>
                <h1 className="font-bold text-gray-800 mb-6 leading-tight" style={{ fontSize: 'clamp(42px, 5vw, 72px)' }}>
                  {t('landing.hero.title')}
                  <div className="block mt-4">
                    <span className="gradient-text glow-text relative inline-block">
                      {t('landing.hero.titleHighlight')}
                      <div
                        className={`absolute -bottom-2 h-2 animate-underline-expand ${isRTL ? 'right-0' : 'left-0'}`}
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, #3b82f6 30%, #8b5cf6 50%, #3b82f6 70%, transparent 100%)',
                          backgroundSize: '200% 100%'
                        }}
                      ></div>
                    </span>
                  </div>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                  {t('landing.hero.subtitle')}
                </p>

                <div className={`flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                  <div className="relative hero-outline-anim">
                    <Link
                      to="/auth"
                      className="btn-primary text-base sm:text-lg md:text-xl px-12 py-4 sm:px-16 sm:py-5 md:px-20 md:py-6 inline-flex items-center shadow-2xl hover:shadow-3xl transform hover:scale-105 w-full sm:w-auto relative z-10"
                    >
                      {t('landing.hero.startLearningButton')}
                      <ArrowRight className={`w-5 h-5 sm:w-6 sm:h-6 ${isRTL ? 'mr-3 rtl-flip' : 'ml-3'}`} />
                    </Link>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ padding: '-2px' }}>
                      <rect
                        x="1"
                        y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="12"
                        ry="12"
                        fill="none"
                        stroke="rgba(59, 130, 246, 0.6)"
                        strokeWidth="2"
                        strokeDasharray="20 200"
                        strokeDashoffset="0"
                        className="hero-outline-path"
                      />
                    </svg>
                  </div>
                </div>

                <div className={`flex flex-wrap justify-center lg:justify-start items-center text-xs sm:text-sm text-gray-500 mb-8 gap-y-2 ${isRTL ? 'space-x-reverse space-x-2 sm:space-x-4' : 'space-x-2 sm:space-x-4'}`}>
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2" />
                    <span>{t('landing.hero.freeForever')}</span>
                  </div>
                  <span className="hidden sm:inline mx-2 text-gray-300">•</span>
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2" />
                    <span>{t('landing.hero.noCreditCard')}</span>
                  </div>
                  <span className="hidden sm:inline mx-2 text-gray-300">•</span>
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2" />
                    <span>{t('landing.hero.available247')}</span>
                  </div>
                </div>
              </div>

              {/* Hero Animation - Order changes based on RTL */}
              <div className={`flex justify-center lg:justify-end ${isRTL ? 'lg:col-start-1 lg:justify-start' : ''}`}>
                <Suspense fallback={
                  <div className="w-full max-w-lg h-96 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl animate-pulse flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-200 rounded-full animate-bounce"></div>
                  </div>
                }>
                  <HeroAnimation className="w-full max-w-lg" />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </LazySection>

      {/* Features Section */}
      <LazySection
        sectionIndex={1}
        canLoad={loadedSections.includes(1)}
        onLoadComplete={() =>
          setLoadedSections((prev) =>
            prev.includes(2) ? prev : [...prev, 2]
          )
        }
        fallback={
          <section className="py-16 sm:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center mb-12 sm:mb-20">
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse mb-6 max-w-md mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded-lg animate-pulse max-w-2xl mx-auto"></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="card p-6 md:p-8">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-2xl mx-auto mb-6 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-6 max-w-xs mx-auto"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }
      >
        <Suspense fallback={null}>
          <FeatureSection />
        </Suspense>
      </LazySection>

      {/* Popular Questions */}
      <LazySection
        sectionIndex={2}
        canLoad={loadedSections.includes(2)}
        onLoadComplete={() =>
          setLoadedSections((prev) =>
            prev.includes(3) ? prev : [...prev, 3]
          )
        }
        fallback={<SectionLoadingFallback className="bg-gray-50" />}
        className="bg-gray-50"
      >
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                {t('landing.popularQuestionsSection.title')}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600">
                {t('landing.popularQuestionsSection.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {popularQuestions.map((question, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-gray-700 group-hover:text-gray-900 transition-colors">{question}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/auth"
                className="btn-primary text-base px-6 py-3 sm:text-lg sm:px-8 sm:py-4"
              >
                {t('landing.popularQuestionsSection.askYourQuestionButton')}
              </Link>
            </div>
          </div>
        </section>
      </LazySection>

      {/* CTA Section */}
      <LazySection
        sectionIndex={3}
        canLoad={loadedSections.includes(3)}
        onLoadComplete={() =>
          setLoadedSections((prev) =>
            prev.includes(4) ? prev : [...prev, 4]
          )
        }
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden"
      >
        <section className="py-16 sm:py-24">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
            <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              {t('landing.ctaSection.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t('landing.ctaSection.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                to="/auth"
                className="inline-flex items-center bg-white text-blue-600 font-bold px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-xl text-base sm:text-lg md:text-xl hover:bg-gray-100 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
              >
                {t('landing.ctaSection.getStartedButton')}
                <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 items-center justify-center sm:space-x-4 md:space-x-6 text-blue-100 text-sm sm:text-base">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{t('landing.hero.noCreditCard')}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{t('landing.hero.freeForever')}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span>{t('landing.ctaSection.setupInMinutes')}</span>
              </div>
            </div>
          </div>
        </section>
      </LazySection>

      {/* Footer */}
      <LazySection
        sectionIndex={4}
        canLoad={loadedSections.includes(4)}
        onLoadComplete={() =>
          setLoadedSections((prev) =>
            prev.includes(5) ? prev : [...prev, 5]
          )
        }
        className="bg-gray-900 text-white"
      >
        <footer className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
              <div className="col-span-1 sm:col-span-2 md:col-span-1">
                <Logo size="sm" />
                <p className="text-gray-400 mt-4 leading-relaxed text-sm">
                  {t('landing.footer.description')}
                </p>
                <div className="mt-4 text-gray-400 text-sm">
                  <p><strong>{t('landing.footer.contactEmail').split(':')[0]}:</strong></p>
                  <p>{t('landing.footer.contactEmail').split(': ')[1]}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-base">{t('landing.footer.communityTitle')}</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link to="/community" className="hover:text-white transition-colors">{t('landing.footer.supportItems.2')}</Link></li>
                  <li><Link to="/contact" className="hover:text-white transition-colors">{t('landing.footer.supportItems.3')}</Link></li>
                  <li><Link to="/auth" className="hover:text-white transition-colors">{t('landing.footer.supportItems.1')}</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-base">{t('landing.footer.legalTitle')}</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link to="/privacy-policy" className="hover:text-white transition-colors">{t('landing.footer.companyItems.1')}</Link></li>
                  <li><Link to="/terms-of-service" className="hover:text-white transition-colors">{t('landing.footer.companyItems.2')}</Link></li>
                  <li><Link to="/accessibility" className="hover:text-white transition-colors">{t('landing.footer.companyItems.3')}</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm">
                <p className="text-gray-400 mb-4 md:mb-0">{t('landing.footer.copyright')}</p>
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <span className="text-gray-400">{t('landing.footer.trustedBy')}</span>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </LazySection>
    </div>
  );
};

export default LandingPage;
