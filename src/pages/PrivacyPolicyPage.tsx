import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Cookie, Eye, Lock, Users, FileText, Heart } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const currentDate = new Date().toLocaleDateString();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-hairline sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to="/"
                className="p-2 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors focus-ring"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Logo size="sm" />
              <h2 className="text-lg sm:text-xl font-display font-bold text-ink">{t('privacyPolicy.headerTitle')}</h2>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <div className="surface-card rounded-card border border-hairline p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-brand" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-ink mb-1 sm:mb-2">{t('privacyPolicy.pageTitle')}</h1>
            <p className="text-sm sm:text-base text-ink-muted">{t('privacyPolicy.lastUpdated', { date: currentDate })}</p>
          </div>

          <div className="prose prose-sm sm:prose-base max-w-none">
            <div className="bg-brand-soft border border-brand/20 rounded-xl p-6 mb-8">
              <h2 className="font-display text-xl font-bold text-brand-strong mb-3 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                {t('privacyPolicy.ourPromise.title')}
              </h2>
              <p className="text-ink-muted leading-relaxed">
                {t('privacyPolicy.ourPromise.text')}
              </p>
            </div>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4 flex items-center">
                <Cookie className="w-6 h-6 mr-3 text-brand" />
                {t('privacyPolicy.cookies.title')}
              </h2>
              <div className="bg-brand-soft border border-brand/20 rounded-xl p-6 mb-4">
                <h3 className="font-semibold text-brand-strong mb-2">{t('privacyPolicy.cookies.whatAreCookiesTitle')}</h3>
                <p className="text-ink-muted mb-4">
                  {t('privacyPolicy.cookies.whatAreCookiesText')}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-ink mb-3">{t('privacyPolicy.cookies.weUseCookiesForTitle')}</h3>
              <ul className="space-y-3 mb-6">
                {(t('privacyPolicy.cookies.uses', { returnObjects: true }) as string[]).map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-brand rounded-full mt-2.5 flex-shrink-0"></div>
                    <div className="text-ink-muted" dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>

              <div className="rounded-xl p-6" style={{ background: '#f9ebe6', border: '1px solid #e8c4b8' }}>
                <h3 className="font-semibold mb-2" style={{ color: '#b23a1c' }}>{t('privacyPolicy.cookies.whatWeDontDoTitle')}</h3>
                <ul className="space-y-2" style={{ color: '#9a4128' }}>
                  {(t('privacyPolicy.cookies.donts', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index}>✕ {item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-3 text-brand" />
                {t('privacyPolicy.informationCollected.title')}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-subtle rounded-xl p-6">
                  <h3 className="font-semibold text-ink mb-3">{t('privacyPolicy.informationCollected.youGiveUsTitle')}</h3>
                  <ul className="space-y-2 text-ink-muted">
                    {(t('privacyPolicy.informationCollected.youGiveUsList', { returnObjects: true }) as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-subtle rounded-xl p-6">
                  <h3 className="font-semibold text-ink mb-3">{t('privacyPolicy.informationCollected.weCollectTitle')}</h3>
                  <ul className="space-y-2 text-ink-muted">
                    {(t('privacyPolicy.informationCollected.weCollectList', { returnObjects: true }) as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-3 text-brand" />
                {t('privacyPolicy.howWeProtect.title')}
              </h2>

              <div className="rounded-xl p-6" style={{ background: '#eef6f0', border: '1px solid #bfe0c6' }}>
                <ul className="space-y-3" style={{ color: '#2f7a3d' }}>
                  {(t('privacyPolicy.howWeProtect.protections', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#2f7a3d' }}></div>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3" style={{ color: 'var(--accent-cool)' }} />
                {t('privacyPolicy.sharingInformation.title')}
              </h2>

              <div className="rounded-xl p-6" style={{ background: 'var(--accent-cool-soft)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--accent-cool)' }}>{t('privacyPolicy.sharingInformation.neverSell')}</h3>
                <p className="text-ink-muted mb-4">
                  {t('privacyPolicy.sharingInformation.onlyShareInSituations')}
                </p>
                <ul className="space-y-2 text-ink-muted">
                  {(t('privacyPolicy.sharingInformation.sharingSituations', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
                  ))}
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-brand" />
                {t('privacyPolicy.yourRights.title')}
              </h2>

              <div className="space-y-4">
                <div className="bg-brand-soft border border-brand/20 rounded-xl p-4">
                  <h3 className="font-semibold text-brand-strong mb-2">{t('privacyPolicy.yourRights.youCanAlwaysTitle')}</h3>
                  <ul className="space-y-1 text-ink-muted">
                    {(t('privacyPolicy.yourRights.rightsList', { returnObjects: true }) as string[]).map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl p-4" style={{ background: '#fdf6e8', border: '1px solid #f0dfa8' }}>
                  <h3 className="font-semibold mb-2" style={{ color: '#8a6316' }}>{t('privacyPolicy.yourRights.noteDeletingCookiesTitle')}</h3>
                  <p style={{ color: '#8a6316' }}>
                    {t('privacyPolicy.yourRights.noteDeletingCookiesText')}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('privacyPolicy.thirdPartyServices.title')}</h2>

              <div className="bg-subtle rounded-xl p-6">
                <p className="text-ink-muted mb-4">
                  {t('privacyPolicy.thirdPartyServices.weUseTrustedServices')}
                </p>
                <ul className="space-y-2 text-ink-muted">
                  {(t('privacyPolicy.thirdPartyServices.servicesList', { returnObjects: true }) as string[]).map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
                  ))}
                </ul>
                <p className="text-ink-muted/70 text-sm mt-4">
                  {t('privacyPolicy.thirdPartyServices.servicesOwnPolicies')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('privacyPolicy.changesToPolicy.title')}</h2>

              <div className="bg-brand-soft border border-brand/20 rounded-xl p-6">
                <p className="text-ink-muted">
                  {t('privacyPolicy.changesToPolicy.text')}
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-2xl font-bold text-ink mb-4">{t('privacyPolicy.contactUs.title')}</h2>

              <div className="rounded-xl p-6" style={{ background: '#eef6f0', border: '1px solid #bfe0c6' }}>
                <p className="mb-4" style={{ color: '#2f7a3d' }}>
                  {t('privacyPolicy.contactUs.questions')}
                </p>
                <div className="space-y-2" style={{ color: '#2f7a3d' }}>
                  <p><strong>{t('privacyPolicy.contactUs.email').split(': ')[0]}:</strong> {t('privacyPolicy.contactUs.email').split(': ')[1]}</p>
                  <p><strong>{t('privacyPolicy.contactUs.phone').split(': ')[0]}:</strong> {t('privacyPolicy.contactUs.phone').split(': ')[1]}</p>
                  <p><strong>{t('privacyPolicy.contactUs.mailLine1').split(': ')[0]}:</strong> {t('privacyPolicy.contactUs.mailLine1').split(': ')[1]}<br />
                    {t('privacyPolicy.contactUs.mailLine2')}<br />
                    {t('privacyPolicy.contactUs.mailLine3')}</p>
                </div>
              </div>
            </section>

            <div className="text-center pt-8 border-t border-hairline">
              <p className="text-ink-muted mb-4">
                {t('privacyPolicy.footer.thankYou')}
              </p>
              <Link to="/" className="btn-primary">
                {t('privacyPolicy.footer.backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
