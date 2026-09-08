import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mic, Camera, ListChecks } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Logo from '../components/layout/Logo';
import TechyMark from '../components/layout/TechyMark';

const REASSURANCES = [
  { icon: ListChecks, text: 'Step-by-step guides, written in plain language' },
  { icon: Mic, text: 'Ask by voice or by typing — whatever feels easier' },
  { icon: Camera, text: 'Snap a photo of any device and get help instantly' },
];

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-[1fr_1.1fr]">
      {/* ── Brand panel — hidden on mobile, sets the mood before the form ── */}
      <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between px-12 py-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 15% 15%, rgba(47,41,99,0.35) 0%, transparent 65%)',
          }}
        />
        <TechyMark
          size={340}
          className="pointer-events-none absolute -bottom-16 -right-16 opacity-[0.07]"
        />

        <Link to="/" className="relative w-fit">
          <Logo size="md" variant="light" />
        </Link>

        <div className="relative max-w-sm">
          <h2 className="font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.03em] text-[#f6f2ea] xl:text-4xl">
            Technology made simple & clear
          </h2>
          <ul className="mt-10 space-y-6">
            {REASSURANCES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3a352c] bg-[#211d17]">
                  <Icon className="h-4.5 w-4.5 text-brand" strokeWidth={1.5} />
                </span>
                <span className="pt-2 text-[15px] leading-snug text-[#cfc8ba]">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-[#8a8275]">
          {t('landing.hero.noCreditCard', 'No credit card required')} ·{' '}
          {t('landing.hero.freeForever', 'Free forever')}
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-flex items-center rounded-lg p-2 -ml-2 text-ink-muted transition-colors hover:bg-subtle hover:text-ink focus-ring lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 mr-3" />
            <span className="text-base font-medium">{t('auth.backToHome')}</span>
          </Link>

          <div className="mb-6 sm:mb-8 lg:hidden">
            <Logo size="lg" showText={false} />
          </div>

          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-ink mb-1 sm:mb-2">
              {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </h1>
            <p className="text-sm sm:text-base text-ink-muted">
              {isSignUp
                ? t('auth.joinFamily')
                : t('auth.welcomeBackDesc')
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={t('auth.emailPlaceholder')}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder={t('auth.passwordPlaceholder')}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-muted hover:text-brand focus-ring rounded-full"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="text-[#b23a1c] text-sm text-center p-3 bg-[#f9ebe6] border border-[#e8c4b8] rounded-[12px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isSignUp ? t('auth.creatingAccount') : t('auth.signingIn')}
                </div>
              ) : (
                isSignUp ? t('auth.createAccount') : t('nav.signIn')
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-brand hover:text-brand-strong font-semibold focus-ring rounded-pill px-2 py-1"
              >
                {isSignUp
                  ? t('auth.alreadyHaveAccount')
                  : t('auth.dontHaveAccount')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;