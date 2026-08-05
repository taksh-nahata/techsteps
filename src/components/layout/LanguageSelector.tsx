import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslationAnimation } from '../../contexts/TranslationAnimationContext'; // Import the hook

import { SUPPORTED_LANGUAGES } from '../../i18n';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true // Keeping it for backward compatibility but it might be ignored for now
}) => {
  const { i18n, t } = useTranslation();
  const { triggerTranslationAnimation } = useTranslationAnimation();
  const [isOpen, setIsOpen] = useState(false);

  // Convert SUPPORTED_LANGUAGES object to array
  const supportedLanguages = Object.entries(SUPPORTED_LANGUAGES).map(([code, config]) => ({
    code,
    ...config
  }));

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = supportedLanguages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language);

  // Map flags
  const languageFlags: Record<string, string> = {
    en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹', ru: '🇷🇺', zh: '🇨🇳',
    ja: '🇯🇵', ko: '🇰🇷', ar: '🇸🇦', he: '🇮🇱', hi: '🇮🇳', th: '🇹🇭', vi: '🇻🇳', tr: '🇹🇷',
    pl: '🇵🇱', nl: '🇳🇱', sv: '🇸🇪', no: '🇳🇴', da: '🇩🇰', fi: '🇫🇮', hu: '🇭🇺', cs: '🇨🇿',
    sk: '🇸🇰', sl: '🇸🇮', hr: '🇭🇷', bg: '🇧🇬', ro: '🇷🇴', et: '🇪🇪', lv: '🇱🇻', lt: '🇱🇹',
    uk: '🇺🇦', el: '🇬🇷', id: '🇮🇩', ms: '🇲🇾', sr: '🇷🇸'
  };

  const handleLanguageChange = async (newLanguage: string) => {
    const selectedLang = supportedLanguages.find(l => l.code === newLanguage);

    // Don't allow RTL languages to be selected
    // if (selectedLang?.rtl) {
    //   return;
    // }

    await triggerTranslationAnimation(async () => {
      await i18n.changeLanguage(newLanguage);
    });
    setIsOpen(false);

    // Announce language change for screen readers
    // This should ideally happen AFTER the language has actually changed and content is updated.
    // The i18next 'languageChanged' event listener in App.tsx is a better place for global announcements,
    // or this announcement needs to be delayed until after the change is fully processed.
    // For now, keeping it here, but it might announce in the old language.
    const announcement = `Language changed to ${selectedLang?.name}`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.className = 'sr-only';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    setTimeout(() => document.body.removeChild(ariaLive), 1000);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-selector')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative language-selector ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-hairline rounded-xl hover:border-brand/40 transition-all duration-200 focus-ring"
        aria-label={t('language.select')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <div className="flex items-center space-x-3">
          <span className="text-xl" role="img" aria-label="flag">
            {languageFlags[i18n.language] || '🌐'}
          </span>
          <span className="font-medium text-ink">
            {currentLanguage?.nativeName || 'English'}
            <span className="text-ink-muted text-sm ml-2 font-normal">({currentLanguage?.code.toUpperCase()})</span>
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-ink-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            className="absolute top-full left-0 mt-2 w-80 bg-surface rounded-xl shadow-micro border border-hairline z-50 max-h-96 overflow-hidden"
            role="listbox"
            aria-label={t('language.select')}
          >
            <div className="p-4 border-b border-hairline bg-canvas flex flex-col gap-3 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  {t('language.select')}
                </h3>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('language.searchPlaceholder', 'Search language...')}
                  className="w-full pl-9 pr-4 py-2 glass-input rounded-lg text-sm focus-ring"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase();
                    const filtered = supportedLanguages.filter(l =>
                      l.name.toLowerCase().includes(val) ||
                      l.nativeName.toLowerCase().includes(val) ||
                      l.code.toLowerCase().includes(val)
                    );
                    // Store filtered state (simplest way is strictly local var if we rely on re-render, but here I'll need a state)
                    setSearchQuery(val);
                  }}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>
            </div>

            <div className="py-2 max-h-80 overflow-y-auto">
              {filteredLanguages.length > 0 ? filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between group focus-ring 
                    ${i18n.language === lang.code ? 'bg-brand-soft text-brand border-r-4 border-brand' : 'text-ink hover:bg-subtle'}
                  `}
                  role="option"
                  aria-selected={i18n.language === lang.code}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl" role="img" aria-label="flag">
                      {languageFlags[lang.code] || '🌐'}
                    </span>
                    <div>
                      <div className={`font-medium ${i18n.language === lang.code ? 'text-brand-strong' : 'text-ink'}`}>
                        {lang.nativeName}
                      </div>
                      <div className={`text-xs ${i18n.language === lang.code ? 'text-brand' : 'text-ink-muted'}`}>
                        {lang.name} • {lang.code.toUpperCase()}
                        {lang.rtl && <span className="ml-2 px-1.5 py-0.5 bg-subtle text-ink-muted rounded text-[10px] font-medium border border-hairline">RTL</span>}
                      </div>
                    </div>
                  </div>
                  {i18n.language === lang.code && (
                    <Check className="w-5 h-5 text-brand flex-shrink-0" />
                  )}
                </button>
              )) : (
                <div className="py-8 text-center text-ink-muted text-sm">
                  <p>No languages found</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-hairline bg-canvas">
              <p className="text-xs text-ink-muted text-center">
                {t('languageSelector.moreComingSoon')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;