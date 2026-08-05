import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Globe,
  Check,
  User,
  Smartphone,
  Monitor,
  Type,
  ShieldCheck,
  Heart,
  Sparkles,
  Volume2,
  Mic,
  MonitorCheck
} from 'lucide-react';
import Logo from '../components/layout/Logo';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  detectGuideDevice,
  detectOnboardingDeviceId,
  GUIDE_DEVICE_LABELS,
  onboardingDeviceToSettingsKeys,
} from '../utils/deviceDetection';
import Cookies from 'js-cookie';

const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [languageSearch, setLanguageSearch] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const { t, i18n } = useTranslation();
  const { userData, updateUserData } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(() => ({
    firstName: '',
    age: 65,
    os: detectOnboardingDeviceId(),
    techExperience: 'beginner' as const,
    primaryConcerns: [] as string[],
    selectedLanguages: [i18n.language] as string[],
    preferences: {
      textToSpeech: true,
      voiceInput: false,
      theme: 'light' as const,
      fontSize: 'normal' as const,
      highContrast: false,
      allowPersonalization: true
    }
  }));

  const detectedDeviceLabel = useMemo(() => {
    const detected = detectGuideDevice();
    return GUIDE_DEVICE_LABELS[detected];
  }, []);

  // Redirect if already completed
  useEffect(() => {
    if (userData?.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [userData, navigate]);

  const allLanguages = useMemo(() => [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
  ], []);

  const filteredLanguages = allLanguages.filter(lang =>
    lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const finalData = {
        ...userData,
        profile: {
          ...userData?.profile,
          firstName: formData.firstName,
          age: formData.age,
        },
        preferences: {
          ...userData?.preferences,
          language: formData.selectedLanguages[0] || 'en',
          theme: formData.preferences.highContrast ? 'high-contrast' : 'light',
          autoTextToSpeech: formData.preferences.textToSpeech,
          textSize: formData.preferences.fontSize as any,
          voiceInput: formData.preferences.voiceInput,
        },
        onboardingCompleted: true,
        techExperience: formData.techExperience,
        primaryDevice: formData.os,
        primaryDevices: onboardingDeviceToSettingsKeys(formData.os),
        primaryConcerns: formData.primaryConcerns,
      };

      await updateUserData(finalData);
      Cookies.set('onboarding_done', 'true', { expires: 365 });
      navigate('/dashboard');
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.firstName.trim().length >= 2;
    if (currentStep === 1) return formData.selectedLanguages.length > 0;
    return true;
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step0"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <label className="text-sm font-semibold text-ink-muted ml-1 mb-2 block uppercase tracking-wider">
                  {t('onboarding.step1.firstName')}
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand group-focus-within:text-brand transition-colors" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                    placeholder={t('onboarding.step1.firstNamePlaceholder')}
                    className="w-full bg-white/50 backdrop-blur-sm border-2 border-hairline rounded-2xl py-4 pl-12 pr-4 text-xl focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-semibold text-ink-muted ml-1 mb-2 block uppercase tracking-wider">
                  {t('onboarding.step1.age')}
                </label>
                <div className="flex items-center space-x-6">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={formData.age}
                    onChange={e => setFormData(f => ({ ...f, age: parseInt(e.target.value) }))}
                    className="flex-1 accent-[#c2502e] h-2 bg-brand-soft rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-3xl font-bold text-brand tabular-nums w-12">{formData.age}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <div className="relative group mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                placeholder={t('onboarding.step2.searchLanguages')}
                value={languageSearch}
                onChange={e => setLanguageSearch(e.target.value)}
                className="w-full bg-white/50 border-2 border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-brand transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    const selected = formData.selectedLanguages.includes(lang.code)
                      ? formData.selectedLanguages.filter(c => c !== lang.code)
                      : [...formData.selectedLanguages, lang.code];
                    if (selected.length === 0) return; // Must have one
                    setFormData(f => ({ ...f, selectedLanguages: selected }));
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${formData.selectedLanguages.includes(lang.code)
                    ? 'border-brand bg-brand-soft text-brand-strong'
                    : 'border-white bg-white/40 hover:border-brand/30'
                    }`}
                >
                  <div className="text-left">
                    <div className="font-bold">{lang.nativeName}</div>
                    <div className="text-xs opacity-60">{lang.name}</div>
                  </div>
                  {formData.selectedLanguages.includes(lang.code) && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="space-y-3">
              <label className="text-sm font-semibold text-ink-muted uppercase tracking-wider ml-1">
                {t('onboarding.step3.experienceLevel')}
              </label>
              <div className="grid gap-3">
                {[
                  { id: 'beginner', title: t('onboarding.step3.beginner'), desc: t('onboarding.step3.beginnerDesc'), icon: Heart },
                  { id: 'some', title: t('onboarding.step3.some'), desc: t('onboarding.step3.someDesc'), icon: Sparkles },
                  { id: 'comfortable', title: t('onboarding.step3.comfortable'), desc: t('onboarding.step3.comfortableDesc'), icon: MonitorCheck },
                ].map(level => (
                  <button
                    key={level.id}
                    onClick={() => setFormData(f => ({ ...f, techExperience: level.id as any }))}
                    className={`flex items-start space-x-4 p-4 rounded-3xl border-2 transition-all text-left ${formData.techExperience === level.id
                      ? 'border-brand bg-brand-soft ring-4 ring-brand/10'
                      : 'border-white bg-white/40 hover:border-brand/30'
                      }`}
                  >
                    <div className={`p-3 rounded-2xl ${formData.techExperience === level.id ? 'bg-brand-soft0 text-white' : 'bg-brand-soft text-brand'}`}>
                      <level.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">{level.title}</div>
                      <div className="text-sm text-ink-muted leading-relaxed">{level.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-ink-muted uppercase tracking-wider ml-1">
                {t('onboarding.step3.devices.title')}
              </label>
              <p className="text-sm text-ink-muted ml-1">
                We detected you&apos;re on <strong>{detectedDeviceLabel}</strong> — confirm below or pick a different device.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'windowscomputer', label: t('onboarding.step3.devices.windowscomputer'), icon: Monitor },
                  { id: 'macapplecomputer', label: t('onboarding.step3.devices.macapplecomputer'), icon: Monitor },
                  { id: 'iphone', label: t('onboarding.step3.devices.iphone'), icon: Smartphone },
                  { id: 'ipad', label: t('onboarding.step3.devices.ipad'), icon: Smartphone },
                  { id: 'androidphoneortablet', label: t('onboarding.step3.devices.androidphoneortablet'), icon: Smartphone },
                  { id: 'multipledevices', label: t('onboarding.step3.devices.multipledevices'), icon: Globe },
                ].map(dev => (
                  <button
                    key={dev.id}
                    onClick={() => setFormData(f => ({ ...f, os: dev.id }))}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-full border-2 transition-all font-medium ${formData.os === dev.id
                      ? 'border-brand bg-brand text-white shadow-lg shadow-micro'
                      : 'border-white bg-white/50 text-ink hover:border-brand/30'
                      }`}
                  >
                    <dev.icon className="w-4 h-4" />
                    <span>{dev.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-8"
          >
            <div className="flex items-center justify-between p-6 bg-white/40 border border-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-5">
                <div className="p-3 bg-brand-soft rounded-2xl text-brand">
                  <Volume2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="font-bold text-xl">{t('onboarding.step4.textToSpeech')}</div>
                  <div className="text-sm text-ink-muted">Listen to AI explainers</div>
                </div>
              </div>
              <button
                onClick={() => setFormData(f => ({ ...f, preferences: { ...f.preferences, textToSpeech: !f.preferences.textToSpeech } }))}
                className={`w-16 h-8 rounded-full transition-all relative ${formData.preferences.textToSpeech ? 'bg-brand' : 'bg-subtle'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.preferences.textToSpeech ? 'right-1' : 'left-1 shadow-sm'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-6 bg-white/40 border border-white rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-5">
                <div className="p-3 bg-brand-soft rounded-2xl text-brand">
                  <Mic className="w-8 h-8" />
                </div>
                <div>
                  <div className="font-bold text-xl">{t('onboarding.step4.voiceInput')}</div>
                  <div className="text-sm text-ink-muted">Ask questions with your voice</div>
                </div>
              </div>
              <button
                onClick={() => setFormData(f => ({ ...f, preferences: { ...f.preferences, voiceInput: !f.preferences.voiceInput } }))}
                className={`w-16 h-8 rounded-full transition-all relative ${formData.preferences.voiceInput ? 'bg-brand' : 'bg-subtle'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.preferences.voiceInput ? 'right-1' : 'left-1 shadow-sm'}`} />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-3 text-sm font-semibold text-ink-muted uppercase tracking-widest ml-2">
                <Type className="w-4 h-4" />
                <span>{t('onboarding.step4.textSize')}</span>
              </div>
              <div className="flex bg-white/50 p-2 rounded-2xl border border-white gap-1">
                {[
                  { id: 'normal', label: t('onboarding.step4.textSizeNormal') },
                  { id: 'large', label: t('onboarding.step4.textSizeLarge') },
                  { id: 'extra-large', label: t('onboarding.step4.textSizeExtraLarge') },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFormData(f => ({ ...f, preferences: { ...f.preferences, fontSize: opt.id as any } }))}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.preferences.fontSize === opt.id
                      ? 'bg-brand text-white shadow-lg'
                      : 'text-ink-muted hover:bg-white'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="space-y-3">
              <label className="text-sm font-semibold text-ink-muted uppercase tracking-wider ml-1">
                {t('onboarding.step5.subtitle')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'onlineSafety', 'passwordManagement', 'videoCalling',
                  'onlineBanking', 'emailMessaging', 'wifiInternet', 'deviceSettings'
                ].map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      const concerns = formData.primaryConcerns.includes(key)
                        ? formData.primaryConcerns.filter(c => c !== key)
                        : [...formData.primaryConcerns, key];
                      setFormData(f => ({ ...f, primaryConcerns: concerns }));
                    }}
                    className={`px-5 py-3 rounded-[1.5rem] border-2 transition-all font-semibold ${formData.primaryConcerns.includes(key)
                      ? 'border-brand bg-brand text-white shadow-lg'
                      : 'border-white bg-white/50 text-ink hover:border-brand/30'
                      }`}
                  >
                    {t(`onboarding.step5.concerns.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-hairline">
              <div className="flex items-start justify-between p-6 bg-brand/5 border border-hairline rounded-[2.5rem]">
                <div className="flex-1 pr-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-[#2e6a63]" />
                    <h3 className="font-bold text-lg text-ink">{t('onboarding.step5.privacy.title')}</h3>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {t('onboarding.step5.privacy.description')}
                  </p>
                  <p className="text-xs text-brand font-medium mt-3 italic">
                    {t('onboarding.step5.privacy.note')}
                  </p>
                </div>
                <button
                  onClick={() => setFormData(f => ({ ...f, preferences: { ...f.preferences, allowPersonalization: !f.preferences.allowPersonalization } }))}
                  className={`w-16 h-8 rounded-full transition-all relative mt-1 ${formData.preferences.allowPersonalization ? 'bg-brand' : 'bg-subtle'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.preferences.allowPersonalization ? 'right-1' : 'left-1 shadow-sm'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 bg-canvas">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-brand-soft rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full blur-[120px]"
          style={{ background: 'rgba(46, 106, 99, 0.15)' }}
        />
      </div>

      <div className="w-full max-w-2xl relative">
        {/* Header Section */}
        <div className="text-center mb-8 relative z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center justify-center p-4 bg-surface backdrop-blur-xl rounded-[2rem] border border-hairline shadow-micro mb-8"
          >
            <Logo size="lg" showText />
          </motion.div>

          <motion.div
            key={`title-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl sm:text-5xl font-black text-ink tracking-tight">
              {t(`onboarding.step${currentStep + 1}.title`)}
            </h1>
            <p className="text-lg text-ink-muted font-medium">
              {t(`onboarding.step${currentStep + 1}.subtitle`)}
            </p>
          </motion.div>
        </div>

        {/* Card Section */}
        <div className="relative">
          {/* Decorative glass elements */}
          <div className="absolute -inset-4 bg-white/20 backdrop-blur-3xl rounded-[3rem] -z-10 border border-white/50" />

          <div className="bg-surface backdrop-blur-2xl border border-hairline rounded-card shadow-micro p-8 sm:p-12 relative overflow-hidden min-h-[480px] flex flex-col justify-between">
            {/* Progress dots */}
            <div className="flex justify-center space-x-3 mb-10">
              {[0, 1, 2, 3, 4].map(idx => (
                <div
                  key={idx}
                  className={`h-2 transition-all duration-500 rounded-full ${idx === currentStep ? 'w-10 bg-brand shadow-lg shadow-micro' :
                    idx < currentStep ? 'w-2 bg-[#2e6a63]' : 'w-2 bg-subtle'
                    }`}
                />
              ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-4 mt-12 pt-8 border-t border-hairline">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center justify-center p-4 rounded-3xl bg-subtle text-ink-muted hover:bg-brand-soft transition-all active:scale-95 disabled:opacity-50 focus-ring"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed() || loading || isAnimating}
                className={`flex-1 flex items-center justify-center py-5 rounded-[2rem] text-xl font-bold transition-all active:scale-[0.98] focus-ring ${!canProceed()
                  ? 'bg-subtle text-ink-muted cursor-not-allowed'
                  : 'bg-brand text-white shadow-micro hover:bg-brand-strong hover:-translate-y-0.5'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('onboarding.settingUp')}</span>
                  </div>
                ) : (
                  <>
                    <span className="mr-2">
                      {currentStep === 4 ? t('onboarding.completeSetup') : t('onboarding.next')}
                    </span>
                    {currentStep < 4 && <ChevronRight className="w-6 h-6" />}
                    {currentStep === 4 && <Check className="w-6 h-6" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-center mt-12 text-sm font-medium text-ink-muted"
        >
          Need help? Just wave at the companion in the corner!
        </motion.p>
      </div>
    </div>
  );
};

export default OnboardingPage;