import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Volume2, Palette, Globe, Save, Check } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';

import LanguageSelector from '../components/layout/LanguageSelector';

const SettingsPage: React.FC = () => {
  const { userData, updateUserData } = useUser();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    age: userData?.age || 65,
    primaryDevices: userData?.primaryDevices || [],
    techExperience: userData?.techExperience || 'beginner' as 'beginner' | 'some' | 'comfortable',
    preferences: {
      autoTextToSpeech: userData?.preferences?.autoTextToSpeech ?? false,
      textSize: userData?.preferences?.textSize || 'normal' as 'normal' | 'large' | 'extra-large',
      theme: userData?.preferences?.theme || 'light' as 'light' | 'dark' | 'high-contrast',
      language: userData?.preferences?.language || i18n.language,
      seniorMode: userData?.preferences?.seniorMode ?? false
    }
  });

  const devices = [
    { key: 'windowsComputer', label: t('settings.devices.windowsComputer', 'Windows Computer') },
    { key: 'macComputer', label: t('settings.devices.macComputer', 'Mac Computer') },
    { key: 'iphone', label: t('settings.devices.iphone', 'iPhone') },
    { key: 'ipad', label: t('settings.devices.ipad', 'iPad') },
    { key: 'androidPhone', label: t('settings.devices.androidPhone', 'Android Phone') },
    { key: 'androidTablet', label: t('settings.devices.androidTablet', 'Android Tablet') },
    { key: 'chromebook', label: t('settings.devices.chromebook', 'Chromebook') }
  ];

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!userData) return;
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      age: userData.age || 65,
      primaryDevices: userData.primaryDevices || [],
      techExperience: userData.techExperience || 'beginner',
      preferences: {
        autoTextToSpeech: userData.preferences?.autoTextToSpeech ?? false,
        textSize: userData.preferences?.textSize || 'normal',
        theme: userData.preferences?.theme || 'light',
        language: userData.preferences?.language || i18n.language,
        seniorMode: userData.preferences?.seniorMode ?? false
      }
    });
  }, [userData, i18n.language]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = formData.preferences.theme;
    const seniorMode = formData.preferences.seniorMode;

    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(theme);

    if (seniorMode) {
      root.classList.add('senior-mode');
    } else {
      root.classList.remove('senior-mode');
    }

    const textSize = formData.preferences.textSize;

    if (seniorMode) {
      root.style.fontSize = textSize === 'extra-large' ? '22px' : '20px';
    } else {
      root.style.fontSize = textSize === 'large' ? '18px' : textSize === 'extra-large' ? '20px' : '16px';
    }
  }, [formData.preferences.theme, formData.preferences.textSize, formData.preferences.seniorMode]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, language: i18n.language }
    }));
  }, [i18n.language]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    setSaveError('');

    try {
      await updateUserData(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(t('settings.saveError', 'Error saving settings. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = (deviceKey: string) => {
    setFormData(prev => ({
      ...prev,
      primaryDevices: (prev.primaryDevices || []).includes(deviceKey)
        ? (prev.primaryDevices || []).filter(d => d !== deviceKey)
        : [...(prev.primaryDevices || []), deviceKey]
    }));
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-ink">
      <header className="sticky top-0 z-50 px-4 py-4 border-b border-hairline bg-surface/85 backdrop-blur-md">
        <div className="max-w-4xl mx-auto surface-card rounded-2xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 text-ink-muted hover:text-ink hover:bg-subtle rounded-lg transition-colors focus-ring"
                title={t('common.back', 'Back')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-ink">{t('settings.title', 'Settings')}</h1>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className={`
                flex items-center px-4 md:px-6 py-2 rounded-pill font-bold transition-all duration-200 shadow-micro focus-ring
                ${saved
                  ? 'bg-brand-soft text-brand border border-brand/30'
                  : 'bg-brand text-white hover:bg-brand-strong'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="text-sm md:text-base">{t('settings.saved', 'Saved')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="text-sm md:text-base">{loading ? t('settings.saving', 'Saving...') : t('settings.saveChanges', 'Save')}</span>
                </>
              )}
            </button>
          </div>

          {saveError && (
            <p className="mt-3 text-sm text-red-600 font-medium" role="alert">
              {saveError}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-12 pt-6">
        <div className="space-y-8">

          <div className="surface-card p-4 md:p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-brand-soft rounded-xl mr-4">
                <User className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">{t('settings.personalInfo.title', 'Personal Information')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-ink-muted mb-2 ml-1">
                  {t('settings.personalInfo.firstName', 'First Name')}
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
                  placeholder={t('settings.personalInfo.firstNamePlaceholder', 'Enter your first name')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-muted mb-2 ml-1">
                  {t('settings.personalInfo.lastName', 'Last Name')}
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
                  placeholder={t('settings.personalInfo.lastNamePlaceholder', 'Enter your last name')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-muted mb-2 ml-1">
                  {t('settings.personalInfo.age', 'Age')}
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-muted mb-2 ml-1">
                  {t('settings.personalInfo.techExperience', 'Tech Experience Level')}
                </label>
                <select
                  value={formData.techExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, techExperience: e.target.value as 'beginner' | 'some' | 'comfortable' }))}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
                >
                  <option value="beginner">{t('settings.personalInfo.techExperienceBeginner', "Beginner - I'm new to technology")}</option>
                  <option value="some">{t('settings.personalInfo.techExperienceSome', 'Some Experience - I know the basics')}</option>
                  <option value="comfortable">{t('settings.personalInfo.techExperienceComfortable', "Comfortable - I'm pretty good with tech")}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="surface-card p-4 md:p-8 rounded-3xl">
            <h2 className="text-xl font-bold text-ink mb-2">{t('settings.devices.title', 'Primary Device(s)')}</h2>
            <p className="text-ink-muted mb-6">{t('settings.devices.description', 'Select all devices you use regularly')}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {devices.map((device) => (
                <button
                  key={device.key}
                  type="button"
                  onClick={() => toggleDevice(device.key)}
                  className={`
                    p-4 text-left border rounded-2xl transition-all duration-200 focus-ring
                    ${(formData.primaryDevices || []).includes(device.key)
                      ? 'border-brand bg-brand-soft text-ink shadow-micro'
                      : 'border-hairline bg-surface hover:bg-subtle text-ink-muted hover:border-brand/40'
                    }
                  `}
                >
                  <div className="font-medium">{device.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card p-4 md:p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-brand-soft rounded-xl mr-4">
                <Volume2 className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">{t('settings.audio.title', 'Audio & Speech')}</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-subtle rounded-2xl border border-hairline">
                <div>
                  <h3 className="font-bold text-ink">{t('settings.audio.autoTTS', 'Auto Text-to-Speech')}</h3>
                  <p className="text-sm text-ink-muted mt-1">{t('settings.audio.autoTTSDesc', 'Automatically read AI messages aloud')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.preferences.autoTextToSpeech}
                  aria-label={t('settings.audio.autoTTS', 'Auto Text-to-Speech')}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, autoTextToSpeech: !prev.preferences.autoTextToSpeech }
                  }))}
                  className={`
                    relative inline-flex h-7 w-12 border-2 border-transparent rounded-full cursor-pointer
                    transition-colors ease-in-out duration-200 focus-ring
                    ${formData.preferences.autoTextToSpeech ? 'bg-brand' : 'bg-subtle'}
                  `}
                >
                  <span className={`
                    inline-block w-6 h-6 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                    ${formData.preferences.autoTextToSpeech ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </button>
              </div>
            </div>
          </div>

          <div className="surface-card p-4 md:p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-brand-soft rounded-xl mr-4">
                <Palette className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">{t('settings.display.title', 'Display Settings')}</h2>
            </div>

            <div className="space-y-8">

              <div className="flex items-center justify-between p-6 bg-subtle border border-hairline rounded-2xl">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-bold text-ink text-lg">{t('settings.display.seniorMode', 'Senior Friendly Mode')}</h3>
                    <span className="ml-3 px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-wide rounded-full">Recommended</span>
                  </div>
                  <p className="text-ink-muted mt-2 max-w-md">
                    {t('settings.display.seniorModeDesc', 'Larger text, simpler buttons, and higher contrast for easier use.')}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.preferences.seniorMode}
                  aria-label={t('settings.display.seniorMode', 'Senior Friendly Mode')}
                  onClick={() => {
                    const newValue = !formData.preferences.seniorMode;
                    setFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        seniorMode: newValue,
                        textSize: newValue ? 'large' : prev.preferences.textSize,
                        theme: newValue ? 'light' : prev.preferences.theme
                      }
                    }));
                  }}
                  className={`
                    relative inline-flex h-9 w-16 border-2 border-transparent rounded-full cursor-pointer
                    transition-colors ease-in-out duration-200 focus-ring
                    ${formData.preferences.seniorMode ? 'bg-brand' : 'bg-subtle'}
                  `}
                >
                  <span className={`
                    inline-block w-8 h-8 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200
                    ${formData.preferences.seniorMode ? 'translate-x-7' : 'translate-x-0'}
                  `} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-muted mb-3 ml-1">
                  {t('settings.display.textSize', 'Text Size')}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'normal', label: t('settings.display.textSizeNormal', 'Normal'), preview: 'Aa' },
                    { value: 'large', label: t('settings.display.textSizeLarge', 'Large'), preview: 'Aa' },
                    { value: 'extra-large', label: t('settings.display.textSizeExtraLarge', 'Extra Large'), preview: 'Aa' }
                  ].map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, textSize: size.value as 'normal' | 'large' | 'extra-large' }
                      }))}
                      className={`
                        p-4 border rounded-2xl transition-all duration-200 text-center focus-ring
                        ${formData.preferences.textSize === size.value
                          ? 'border-brand bg-brand-soft text-ink shadow-micro'
                          : 'border-hairline bg-surface hover:bg-subtle text-ink-muted'
                        }
                      `}
                    >
                      <div className={`font-bold mb-2 ${size.value === 'normal' ? 'text-lg' :
                        size.value === 'large' ? 'text-xl' : 'text-2xl'
                        }`}>
                        {size.preview}
                      </div>
                      <div className="text-sm font-medium">{size.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-muted mb-3 ml-1">
                  {t('settings.display.theme', 'Color Theme')}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: t('settings.display.themeLight', 'Light'), bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200' },
                    { value: 'dark', label: t('settings.display.themeDark', 'Dark'), bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-700' },
                    { value: 'high-contrast', label: t('settings.display.themeHighContrast', 'High Contrast'), bg: 'bg-black', text: 'text-yellow-400', border: 'border-yellow-400' }
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: theme.value as 'light' | 'dark' | 'high-contrast' }
                      }))}
                      className={`
                        p-4 border rounded-2xl transition-all duration-200 focus-ring
                        ${formData.preferences.theme === theme.value
                          ? 'border-brand ring-2 ring-brand/20 shadow-micro'
                          : 'border-hairline hover:border-brand/40'
                        }
                      `}
                    >
                      <div className={`w-full h-14 rounded-lg ${theme.bg} ${theme.border} border mb-3 flex items-center justify-center shadow-inner`}>
                        <span className={`text-lg font-bold ${theme.text}`}>Aa</span>
                      </div>
                      <div className="text-sm font-medium text-ink-muted">{theme.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-4 md:p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-brand-soft rounded-xl mr-4">
                <Globe className="w-6 h-6 text-brand" />
              </div>
              <h2 className="text-xl font-bold text-ink">{t('settings.language.title', 'Language Preference')}</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-muted mb-2 ml-1">
                {t('settings.language.interfaceLanguage', 'Interface Language')}
              </label>
              <div className="relative z-20">
                <LanguageSelector
                  className="w-full"
                  showLabel={true}
                />
              </div>
              <p className="text-sm text-ink-muted mt-2 ml-1">
                {t('settings.language.description', 'This affects the interface language and voice for text-to-speech')}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
