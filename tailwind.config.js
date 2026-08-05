/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Exclude test files and node_modules for faster builds
    '!./src/**/*.test.{js,ts,jsx,tsx}',
    '!./node_modules/**/*'
  ],
  // Enable JIT mode for faster builds
  mode: 'jit',
  theme: {
    extend: {
      // Font family configuration
      fontFamily: {
        'sans': ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['Plus Jakarta Sans', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'body': ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      // Senior-friendly design tokens
      colors: {
        // Premium editorial palette (mapped to CSS variables in index.css)
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        ink: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-muted)',
        },
        brand: {
          DEFAULT: 'var(--brand-accent)',
          strong: 'var(--brand-accent-strong)',
          soft: 'var(--brand-accent-soft)',
        },
        hairline: 'var(--border-subtle)',
        // High contrast color palette with 4.5:1 minimum ratios
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1d4ed8', // Darker for better contrast - WCAG AA compliant
          600: '#1e40af',
          700: '#1e3a8a',
          800: '#1e3a8a',
          900: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Semantic colors with high contrast
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#15803d', // Darker green for better contrast
          600: '#166534',
          700: '#14532d',
          800: '#14532d',
          900: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#b45309', // Even darker amber for better contrast
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626', // Darker red for better contrast
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        // Senior-friendly neutral grays
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#737373', // Darker for better contrast with white
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#171717',
          900: '#0a0a0a',
        },
      },
      // Large, readable font sizes (minimum 18px for body)
      fontSize: {
        'xs': ['14px', { lineHeight: '1.5' }],
        'sm': ['16px', { lineHeight: '1.5' }],
        'base': ['18px', { lineHeight: '1.6' }],
        'lg': ['20px', { lineHeight: '1.6' }],
        'xl': ['22px', { lineHeight: '1.6' }],
        '2xl': ['24px', { lineHeight: '1.5' }],
        '3xl': ['28px', { lineHeight: '1.4' }],
        '4xl': ['32px', { lineHeight: '1.3' }],
        '5xl': ['36px', { lineHeight: '1.2' }],
        '6xl': ['42px', { lineHeight: '1.1' }],
        '7xl': ['48px', { lineHeight: '1.1' }],
        '8xl': ['56px', { lineHeight: '1.0' }],
        '9xl': ['64px', { lineHeight: '1.0' }],
        '10xl': ['72px', { lineHeight: '0.95' }],
        '11xl': ['80px', { lineHeight: '0.9' }],
        '12xl': ['96px', { lineHeight: '0.85' }],
        '13xl': ['112px', { lineHeight: '0.8' }],
        '14xl': ['128px', { lineHeight: '0.8' }],
      },
      // Generous spacing for senior-friendly UI
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
        '38': '9.5rem',   // 152px
        '42': '10.5rem',  // 168px
        '46': '11.5rem',  // 184px
        '50': '12.5rem',  // 200px
      },
      // Minimum touch target sizes (44px minimum)
      minHeight: {
        'touch': '44px',
        'button': '48px',
        'input': '48px',
      },
      minWidth: {
        'touch': '44px',
        'button': '120px',
      },
      // Accessibility-focused border radius
      borderRadius: {
        'senior': '12px',
        'senior-lg': '16px',
        'senior-xl': '20px',
        'card': '16px',
        'pill': '9999px',
      },
      // Enhanced shadows for better depth perception
      boxShadow: {
        'micro': 'var(--shadow-micro)',
        'senior': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.1)',
        'senior-md': '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
        'senior-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.15), 0 12px 20px -8px rgba(0, 0, 0, 0.1)',
        'senior-xl': '0 12px 32px -8px rgba(0, 0, 0, 0.18), 0 16px 24px -12px rgba(0, 0, 0, 0.12)',
      },
      // Animation durations for reduced motion support
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
        '600': '600ms',
      },
      // Focus ring styles for accessibility
      ringWidth: {
        '3': '3px',
        '4': '4px',
      },
      ringOffsetWidth: {
        '3': '3px',
        '4': '4px',
      },
      // Animations for error notifications and avatar companion
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'sway': {
          '0%': { transform: 'rotate(45deg) translateX(0px)' },
          '25%': { transform: 'rotate(45deg) translateX(-2px)' },
          '75%': { transform: 'rotate(45deg) translateX(2px)' },
          '100%': { transform: 'rotate(45deg) translateX(0px)' },
        },
        'spin-diagonal': {
          '0%': { transform: 'rotate(45deg)' },
          '100%': { transform: 'rotate(405deg)' },
        },
        'intro-spin': {
          '0%': { transform: 'rotate(45deg) scale(3)' },
          '50%': { transform: 'rotate(765deg) scale(3)' },
          '100%': { transform: 'rotate(45deg) scale(1)' },
        },
        'intro-move': {
          '0%': { transform: 'translate(-50%, -50%) rotate(45deg) scale(1)' },
          '100%': { transform: 'translate(0, 0) rotate(45deg) scale(1)' },
        },
        'avatar-breathe': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'avatar-excited': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '25%': { transform: 'scale(1.1) rotate(-2deg)' },
          '75%': { transform: 'scale(1.1) rotate(2deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        'avatar-intro': {
          '0%': { transform: 'scale(2) rotate(0deg)', opacity: '0' },
          '20%': { transform: 'scale(2) rotate(0deg)', opacity: '1' },
          '60%': { transform: 'scale(2) rotate(360deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        'avatar-slide-to-position': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(-50vw, 50vh) scale(0.6)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'spin-slow': 'spin-slow 2s linear infinite',
        'sway': 'sway 3s ease-in-out infinite',
        'spin-diagonal': 'spin-diagonal 1s linear infinite',
        'intro-spin': 'intro-spin 2s ease-out',
        'intro-move': 'intro-move 1s ease-out',
        'avatar-breathe': 'avatar-breathe 3s ease-in-out infinite',
        'avatar-excited': 'avatar-excited 0.6s ease-in-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'avatar-intro': 'avatar-intro 3s ease-in-out forwards',
        'avatar-slide-to-position': 'avatar-slide-to-position 1s ease-in-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
      },
    },
  },
  plugins: [
    // Custom plugin for senior-friendly utilities
    function ({ addUtilities, theme, addBase }) {
      // RTL base styles
      addBase({
        '[dir="rtl"]': {
          direction: 'rtl',
        },
        '[dir="ltr"]': {
          direction: 'ltr',
        },
      });

      const newUtilities = {
        // High contrast mode utilities
        '.high-contrast-text': {
          color: theme('colors.neutral.900'),
          fontWeight: '600',
        },
        '.high-contrast-bg': {
          backgroundColor: theme('colors.neutral.50'),
          border: `2px solid ${theme('colors.neutral.900')}`,
        },
        // Touch-friendly utilities
        '.touch-target': {
          minHeight: theme('minHeight.touch'),
          minWidth: theme('minWidth.touch'),
        },
        '.button-target': {
          minHeight: theme('minHeight.button'),
          minWidth: theme('minWidth.button'),
        },
        // Focus utilities for accessibility
        '.focus-senior': {
          '&:focus': {
            outline: 'none',
            ringWidth: theme('ringWidth.3'),
            ringColor: theme('colors.primary.500'),
            ringOffsetWidth: theme('ringOffsetWidth.3'),
            ringOffsetColor: theme('colors.white'),
          },
        },
        // Reduced motion utilities
        '.motion-safe': {
          '@media (prefers-reduced-motion: no-preference)': {
            // Only apply animations when motion is safe
          },
        },
        '.motion-reduce': {
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            transition: 'none',
          },
        },
        // RTL-aware utilities
        '.rtl-flip': {
          '[dir="rtl"] &': {
            transform: 'scaleX(-1)',
          },
        },
        '.rtl-rotate-180': {
          '[dir="rtl"] &': {
            transform: 'rotate(180deg)',
          },
        },
        // RTL-aware margins and padding
        '.ms-auto': {
          '[dir="ltr"] &': {
            marginLeft: 'auto',
          },
          '[dir="rtl"] &': {
            marginRight: 'auto',
          },
        },
        '.me-auto': {
          '[dir="ltr"] &': {
            marginRight: 'auto',
          },
          '[dir="rtl"] &': {
            marginLeft: 'auto',
          },
        },
        '.ps-4': {
          '[dir="ltr"] &': {
            paddingLeft: theme('spacing.4'),
          },
          '[dir="rtl"] &': {
            paddingRight: theme('spacing.4'),
          },
        },
        '.pe-4': {
          '[dir="ltr"] &': {
            paddingRight: theme('spacing.4'),
          },
          '[dir="rtl"] &': {
            paddingLeft: theme('spacing.4'),
          },
        },
        '.ps-6': {
          '[dir="ltr"] &': {
            paddingLeft: theme('spacing.6'),
          },
          '[dir="rtl"] &': {
            paddingRight: theme('spacing.6'),
          },
        },
        '.pe-6': {
          '[dir="ltr"] &': {
            paddingRight: theme('spacing.6'),
          },
          '[dir="rtl"] &': {
            paddingLeft: theme('spacing.6'),
          },
        },
        // RTL-aware text alignment
        '.text-start': {
          '[dir="ltr"] &': {
            textAlign: 'left',
          },
          '[dir="rtl"] &': {
            textAlign: 'right',
          },
        },
        '.text-end': {
          '[dir="ltr"] &': {
            textAlign: 'right',
          },
          '[dir="rtl"] &': {
            textAlign: 'left',
          },
        },
        // RTL-aware borders
        '.border-s': {
          '[dir="ltr"] &': {
            borderLeftWidth: '1px',
          },
          '[dir="rtl"] &': {
            borderRightWidth: '1px',
          },
        },
        '.border-e': {
          '[dir="ltr"] &': {
            borderRightWidth: '1px',
          },
          '[dir="rtl"] &': {
            borderLeftWidth: '1px',
          },
        },
        // RTL-aware positioning
        '.start-0': {
          '[dir="ltr"] &': {
            left: '0',
          },
          '[dir="rtl"] &': {
            right: '0',
          },
        },
        '.end-0': {
          '[dir="ltr"] &': {
            right: '0',
          },
          '[dir="rtl"] &': {
            left: '0',
          },
        },
        // RTL-aware transforms for animations
        '.rtl-translate-x-full': {
          '[dir="ltr"] &': {
            transform: 'translateX(100%)',
          },
          '[dir="rtl"] &': {
            transform: 'translateX(-100%)',
          },
        },
        '.rtl-translate-x-0': {
          transform: 'translateX(0)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
