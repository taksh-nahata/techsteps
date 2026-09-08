import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-hairline bg-surface/90 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-ink-muted hover:text-ink transition-colors focus-ring rounded-lg p-1 -ml-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('terms.backToHome')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-ink mb-8">{t('terms.title')}</h1>

          <div className="surface-card rounded-card border border-hairline p-6 sm:p-8 space-y-8">
            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('terms.sections.acceptance.title')}</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                {t('terms.sections.acceptance.content')}
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('terms.sections.license.title')}</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                {t('terms.sections.license.content')}
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('terms.sections.conduct.title')}</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                {t('terms.sections.conduct.content')}
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('terms.sections.liability.title')}</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                {t('terms.sections.liability.content')}
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('terms.sections.contact.title')}</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                {t('terms.sections.contact.content')}
              </p>
              <div className="bg-subtle p-4 rounded-xl">
                <p className="text-ink-muted">
                  <strong className="text-ink">Email:</strong> taksh.nahata37@gmail.com
                </p>
              </div>
            </section>

            <section>
              <p className="text-sm text-ink-muted/70">
                {t('terms.lastUpdated', { date: new Date().toLocaleDateString() })}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;