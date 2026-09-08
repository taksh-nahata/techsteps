import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Ear, Hand, Brain, Heart, Settings } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Logo from '../components/layout/Logo';

const Accessibility: React.FC = () => {
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
            {t('accessibilityPage.backToHome')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-ink mb-4">{t('accessibilityPage.title')}</h1>
            <p className="text-lg sm:text-xl text-ink-muted max-w-3xl mx-auto">
              {t('accessibilityPage.subtitle')}
            </p>
          </div>

          <div className="surface-card rounded-card border border-hairline p-6 sm:p-8 space-y-10">
            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-brand" />
                {t('accessibilityPage.commitment.title')}
              </h2>
              <p className="text-ink-muted leading-relaxed">
                {t('accessibilityPage.commitment.content')}
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-6 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-brand" />
                {t('accessibilityPage.features.title')}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-6 bg-brand-soft/60 border border-brand/15">
                  <div className="flex items-center mb-3">
                    <Eye className="w-5 h-5 text-brand-strong mr-2" />
                    <h3 className="font-display font-bold text-ink">{t('accessibilityPage.features.visual.title')}</h3>
                  </div>
                  <ul className="space-y-2 text-ink-muted text-sm">
                    {(t('accessibilityPage.features.visual.items', { returnObjects: true }) as unknown as string[]).map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-6" style={{ background: 'var(--accent-cool-soft)' }}>
                  <div className="flex items-center mb-3">
                    <Ear className="w-5 h-5 mr-2" style={{ color: 'var(--accent-cool)' }} />
                    <h3 className="font-display font-bold text-ink">{t('accessibilityPage.features.audio.title')}</h3>
                  </div>
                  <ul className="space-y-2 text-ink-muted text-sm">
                    {(t('accessibilityPage.features.audio.items', { returnObjects: true }) as unknown as string[]).map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-6" style={{ background: 'var(--accent-cool-soft)' }}>
                  <div className="flex items-center mb-3">
                    <Hand className="w-5 h-5 mr-2" style={{ color: 'var(--accent-cool)' }} />
                    <h3 className="font-display font-bold text-ink">{t('accessibilityPage.features.motor.title')}</h3>
                  </div>
                  <ul className="space-y-2 text-ink-muted text-sm">
                    {(t('accessibilityPage.features.motor.items', { returnObjects: true }) as unknown as string[]).map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-6 bg-brand-soft/60 border border-brand/15">
                  <div className="flex items-center mb-3">
                    <Brain className="w-5 h-5 text-brand-strong mr-2" />
                    <h3 className="font-display font-bold text-ink">{t('accessibilityPage.features.cognitive.title')}</h3>
                  </div>
                  <ul className="space-y-2 text-ink-muted text-sm">
                    {(t('accessibilityPage.features.cognitive.items', { returnObjects: true }) as unknown as string[]).map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('accessibilityPage.standards.title')}</h2>
              <p className="text-ink-muted leading-relaxed">
                {t('accessibilityPage.standards.content')}
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('accessibilityPage.feedback.title')}</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                {t('accessibilityPage.feedback.content')}
              </p>
              <div className="bg-subtle p-4 rounded-xl">
                <p className="text-ink-muted mb-2">
                  <strong className="text-ink">{t('accessibilityPage.feedback.emailLabel')}:</strong> taksh.nahata37@gmail.com
                </p>
                <p className="text-ink-muted">
                  <strong className="text-ink">{t('accessibilityPage.feedback.subjectLabel')}:</strong> {t('accessibilityPage.feedback.subjectValue')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('accessibilityPage.assistive.title')}</h2>
              <p className="text-ink-muted leading-relaxed mb-4">
                {t('accessibilityPage.assistive.content')}
              </p>
              <ul className="grid md:grid-cols-2 gap-2 text-ink-muted">
                {(t('accessibilityPage.assistive.items', { returnObjects: true }) as unknown as string[]).map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </section>

            <section>
              <div className="bg-brand-soft border border-brand/20 rounded-xl p-6">
                <h3 className="font-display font-bold text-ink mb-2">{t('accessibilityPage.help.title')}</h3>
                <p className="text-ink-muted mb-4">
                  {t('accessibilityPage.help.content')}
                </p>
                <Link
                  to="/contact"
                  className="btn-primary inline-flex items-center w-fit"
                >
                  {t('accessibilityPage.help.contact')}
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Link>
              </div>
            </section>

            <section>
              <p className="text-sm text-ink-muted/70">
                {t('accessibilityPage.lastUpdated', { date: new Date().toLocaleDateString() })}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;
