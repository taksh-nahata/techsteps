/** Device types for per-device flashcard directions */

export const GUIDE_DEVICE_TYPES = [
  'all',
  'iphone',
  'ipad',
  'android-phone',
  'android-tablet',
  'windows',
  'mac',
  'chromebook',
] as const;

export type GuideDeviceType = (typeof GUIDE_DEVICE_TYPES)[number];

export const GUIDE_DEVICE_LABELS: Record<GuideDeviceType, string> = {
  all: 'All devices',
  iphone: 'iPhone',
  ipad: 'iPad',
  'android-phone': 'Android phone',
  'android-tablet': 'Android tablet',
  windows: 'Windows',
  mac: 'Mac',
  chromebook: 'Chromebook',
};

/** Settings page `primaryDevices` keys */
export const SETTINGS_DEVICE_KEYS = [
  'windowsComputer',
  'macComputer',
  'iphone',
  'ipad',
  'androidPhone',
  'androidTablet',
  'chromebook',
] as const;

export type SettingsDeviceKey = (typeof SETTINGS_DEVICE_KEYS)[number];

const GUIDE_TO_SETTINGS: Record<GuideDeviceType, SettingsDeviceKey | null> = {
  all: null,
  iphone: 'iphone',
  ipad: 'ipad',
  'android-phone': 'androidPhone',
  'android-tablet': 'androidTablet',
  windows: 'windowsComputer',
  mac: 'macComputer',
  chromebook: 'chromebook',
};

const SETTINGS_TO_GUIDE: Partial<Record<SettingsDeviceKey, GuideDeviceType>> = {
  iphone: 'iphone',
  ipad: 'ipad',
  androidPhone: 'android-phone',
  androidTablet: 'android-tablet',
  windowsComputer: 'windows',
  macComputer: 'mac',
  chromebook: 'chromebook',
};

/** Onboarding step device ids */
export type OnboardingDeviceId =
  | 'windowscomputer'
  | 'macapplecomputer'
  | 'iphone'
  | 'ipad'
  | 'androidphoneortablet'
  | 'multipledevices';

const GUIDE_TO_ONBOARDING: Partial<Record<GuideDeviceType, OnboardingDeviceId>> = {
  iphone: 'iphone',
  ipad: 'ipad',
  'android-phone': 'androidphoneortablet',
  'android-tablet': 'androidphoneortablet',
  windows: 'windowscomputer',
  mac: 'macapplecomputer',
  chromebook: 'windowscomputer',
};

const DETECTED_DEVICE_KEY = 'techsteps_detected_device';

/** Detect device from browser UA — no user input required */
export function detectGuideDevice(): GuideDeviceType {
  if (typeof navigator === 'undefined') return 'all';

  const ua = navigator.userAgent;
  const platform = navigator.platform || '';

  if (/iPad/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ipad';
  }
  if (/iPhone/.test(ua)) return 'iphone';
  if (/Android/.test(ua)) {
    return /Mobile/.test(ua) ? 'android-phone' : 'android-tablet';
  }
  if (/CrOS/.test(ua)) return 'chromebook';
  if (/Mac/.test(platform)) return 'mac';
  if (/Win/.test(platform)) return 'windows';
  if (/Linux/.test(platform)) return 'android-tablet';

  return 'all';
}

export function detectOnboardingDeviceId(): OnboardingDeviceId {
  const guide = detectGuideDevice();
  return GUIDE_TO_ONBOARDING[guide] ?? 'multipledevices';
}

export function onboardingDeviceToSettingsKeys(
  osId: OnboardingDeviceId | string
): SettingsDeviceKey[] {
  switch (osId) {
    case 'windowscomputer':
      return ['windowsComputer'];
    case 'macapplecomputer':
      return ['macComputer'];
    case 'iphone':
      return ['iphone'];
    case 'ipad':
      return ['ipad'];
    case 'androidphoneortablet':
      return ['androidPhone', 'androidTablet'];
    case 'multipledevices':
      return detectSettingsDeviceKeys();
    default:
      return detectSettingsDeviceKeys();
  }
}

export function guideDeviceFromSettingsKey(key: string): GuideDeviceType | null {
  return SETTINGS_TO_GUIDE[key as SettingsDeviceKey] ?? null;
}

export function resolveUserGuideDevice(
  primaryDevices?: string[] | null,
  fallback?: GuideDeviceType
): GuideDeviceType {
  if (primaryDevices?.length) {
    for (const key of primaryDevices) {
      const mapped = guideDeviceFromSettingsKey(key);
      if (mapped && mapped !== 'all') return mapped;
    }
  }

  try {
    const stored = localStorage.getItem(DETECTED_DEVICE_KEY) as GuideDeviceType | null;
    if (stored && GUIDE_DEVICE_TYPES.includes(stored)) return stored;
  } catch {
    /* ignore */
  }

  return fallback ?? detectGuideDevice();
}

export function persistDetectedDevice(device: GuideDeviceType) {
  try {
    localStorage.setItem(DETECTED_DEVICE_KEY, device);
  } catch {
    /* ignore */
  }
}

/** Pick directions for one device; falls back without mixing other devices' steps */
export function getDirectionsForDevice(
  directionsByDevice: Partial<Record<GuideDeviceType, string[]>> | undefined,
  device: GuideDeviceType,
  legacyInstructions?: string[],
  legacyContent?: string
): string[] {
  const clean = (list?: string[]) => (list ?? []).map((s) => s.trim()).filter(Boolean);

  if (directionsByDevice && Object.keys(directionsByDevice).length > 0) {
    const direct = clean(directionsByDevice[device]);
    if (direct.length) return direct;

    // Sensible fallbacks within same ecosystem
    if (device === 'ipad' && clean(directionsByDevice.iphone).length) {
      return clean(directionsByDevice.iphone);
    }
    if (device === 'android-tablet' && clean(directionsByDevice['android-phone']).length) {
      return clean(directionsByDevice['android-phone']);
    }
    if (device === 'android-phone' && clean(directionsByDevice['android-tablet']).length) {
      return clean(directionsByDevice['android-tablet']);
    }

    const universal = clean(directionsByDevice.all);
    if (universal.length) return universal;
  }

  const legacy = clean(legacyInstructions);
  if (legacy.length) return legacy;

  if (legacyContent) {
    const lines = legacyContent
      .split(/\n+/)
      .map((l) => l.replace(/^[\d•\-*.]+\s*/, '').trim())
      .filter((l) => l.length > 8);
    if (lines.length) return lines;
  }

  return [];
}
