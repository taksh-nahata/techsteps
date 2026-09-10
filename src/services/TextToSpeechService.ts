import { wouldExceedSafeLimit, recordTTSUsage } from './ttsUsageGuard';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  lang?: string;
}

export interface TTSService {
  speak(text: string, options?: TTSOptions): Promise<void>;
  stop(): void;
  getVoices(): SpeechSynthesisVoice[];
  isSupported(): boolean;
  isSpeaking(): boolean;
  setCallbacks(callbacks: {
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void;
}

class BrowserTTSService implements TTSService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onSpeakStart?: () => void;
  private onSpeakEnd?: () => void;
  private onAudioLevel?: (level: number) => void;

  constructor() {
    // Ensure voices are loaded
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
    }
  }

  setCallbacks(callbacks: {
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void {
    this.onSpeakStart = callbacks.onSpeakStart;
    this.onSpeakEnd = callbacks.onSpeakEnd;
    this.onAudioLevel = callbacks.onAudioLevel;
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Speech synthesis not supported');
    }

    // Stop any current speech
    this.stop();

    // Clean text (remove markdown, HTML, etc.)
    const cleanText = this.cleanText(text);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Set options for more natural, emotional speech
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1;
      utterance.lang = options.lang || 'en-US';

      // Set voice if specified
      if (options.voice) {
        const voices = this.getVoices();
        const selectedVoice = voices.find(v => v.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // Select a good voice for the language
        const voices = this.getVoices();
        const lang = utterance.lang;
        const langCode = lang.split('-')[0];

        const matchesLanguage = (voice: SpeechSynthesisVoice) => {
          return voice.lang.toLowerCase().startsWith(langCode.toLowerCase()) ||
            voice.lang.toLowerCase().includes(langCode.toLowerCase());
        };

        // Try to find a high-quality voice
        let preferredVoice = voices.find(v =>
          matchesLanguage(v) &&
          (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Enhanced'))
        );

        if (!preferredVoice) {
          preferredVoice = voices.find(v => matchesLanguage(v));
        }

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('Selected TTS voice:', preferredVoice.name);
        }
      }

      // Event handlers
      utterance.onstart = () => {
        this.onSpeakStart?.();
        this.simulateAudioLevels();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        this.onSpeakEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        this.onSpeakEnd?.();
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
      this.onSpeakEnd?.();
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  isSpeaking(): boolean {
    return speechSynthesis.speaking;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/_/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`.*?`/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private simulateAudioLevels(): void {
    if (!this.isSpeaking()) return;

    const interval = setInterval(() => {
      if (!this.isSpeaking()) {
        clearInterval(interval);
        return;
      }
      const level = 0.2 + Math.random() * 0.8;
      this.onAudioLevel?.(level);
    }, 100);
  }
}

// Groq TTS (Orpheus) — free tier, no billing account attached at all (unlike
// Google Cloud TTS, which needs one linked even to stay under quota), so this
// is the preferred provider whenever it can serve the request. Orpheus is
// English/Arabic-only, so anything else — and any request that fails, e.g.
// the free tier's 10 req/min or 100 req/day cap — hands off to `fallback`.
class GroqTTSService implements TTSService {
  private apiKey: string;
  private fallback: TTSService;
  private currentAudio: HTMLAudioElement | null = null;
  private onSpeakStart?: () => void;
  private onSpeakEnd?: () => void;
  private onAudioLevel?: (level: number) => void;
  private audioLevelInterval?: NodeJS.Timeout;

  constructor(apiKey: string, fallback: TTSService) {
    this.apiKey = apiKey;
    this.fallback = fallback;
  }

  setCallbacks(callbacks: {
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void {
    this.onSpeakStart = callbacks.onSpeakStart;
    this.onSpeakEnd = callbacks.onSpeakEnd;
    this.onAudioLevel = callbacks.onAudioLevel;
    this.fallback.setCallbacks(callbacks);
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    const lang = (options.lang || 'en').toLowerCase();
    if (!lang.startsWith('en')) {
      return this.fallback.speak(text, options);
    }

    const cleanText = this.cleanText(text);
    try {
      this.stop();
      const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'canopylabs/orpheus-v1-english',
          input: cleanText,
          // Measured duration for identical text across all 6 voices: Daniel
          // (3.68s) was fastest, our old default Autumn (4.72s) was near the
          // slowest — a real, measured reason "sounds slow", not a guess.
          // Note: the API's own `speed` field is accepted but silently has NO
          // effect (tested at 0.7/1.0/1.3 -- byte-identical output every
          // time), so pace is controlled below via audio.playbackRate instead.
          voice: 'daniel',
          response_format: 'wav',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq TTS error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const blob = await response.blob();
      await this.playBlob(blob, options.rate ?? 1.05);
    } catch (error) {
      console.warn('Groq TTS failed, falling back:', error);
      return this.fallback.speak(text, options);
    }
  }

  private async playBlob(blob: Blob, playbackRate = 1.05): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      this.currentAudio = audio;
      audio.playbackRate = playbackRate;
      const audioUrl = URL.createObjectURL(blob);
      audio.src = audioUrl;

      audio.onloadstart = () => {
        this.onSpeakStart?.();
        this.startAudioLevelSimulation();
      };
      audio.onended = () => {
        this.stopAudioLevelSimulation();
        this.onSpeakEnd?.();
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        this.stopAudioLevelSimulation();
        this.onSpeakEnd?.();
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        reject(new Error('Audio playback failed'));
      };
      audio.play().catch(reject);
    });
  }

  private startAudioLevelSimulation(): void {
    let time = 0;
    this.audioLevelInterval = setInterval(() => {
      if (this.currentAudio && !this.currentAudio.paused) {
        time += 0.1;
        const level = Math.max(0.1, Math.min(1.0, 0.4 + Math.sin(time * 3) * 0.2 + Math.random() * 0.4));
        this.onAudioLevel?.(level);
      }
    }, 80);
  }

  private stopAudioLevelSimulation(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = undefined;
    }
    this.onAudioLevel?.(0);
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.stopAudioLevelSimulation();
      this.onSpeakEnd?.();
    } else {
      this.fallback.stop();
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.fallback.getVoices();
  }

  isSupported(): boolean {
    return true; // always at least falls back to browser speech
  }

  isSpeaking(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : this.fallback.isSpeaking();
  }

  private cleanText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s*(.*)/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Google Cloud TTS Service using API Key (for client-side use)
class GoogleCloudTTSService implements TTSService {
  private apiKey: string;
  private currentAudio: HTMLAudioElement | null = null;
  private onSpeakStart?: () => void;
  private onSpeakEnd?: () => void;
  private onAudioLevel?: (level: number) => void;
  private audioLevelInterval?: NodeJS.Timeout;
  // Fallback used once this browser's tracked monthly usage nears the free
  // tier ceiling — see ttsUsageGuard.ts for why this is a soft cap, not a
  // real billing guarantee.
  private fallback = new BrowserTTSService();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setCallbacks(callbacks: {
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onAudioLevel?: (level: number) => void;
  }): void {
    this.onSpeakStart = callbacks.onSpeakStart;
    this.onSpeakEnd = callbacks.onSpeakEnd;
    this.onAudioLevel = callbacks.onAudioLevel;
    this.fallback.setCallbacks(callbacks);
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    const cleanText = this.cleanText(text);

    // Soft monthly cap, well under the real free-tier ceiling — see
    // ttsUsageGuard.ts. This keeps a single browser from ever approaching the
    // limit on its own; it is not a substitute for a Cloud Billing budget
    // alert, which is the only real guarantee against being charged.
    if (wouldExceedSafeLimit(cleanText.length)) {
      console.warn('Google Cloud TTS safe usage cap reached this month — using free browser speech instead.');
      return this.fallback.speak(text, options);
    }

    try {
      // Stop any current audio
      this.stop();

      // Get the best voice for the language
      const voiceConfig = this.getVoiceForLanguage(options.lang || 'en-US');

      // Prepare TTS request
      const ttsRequest = {
        input: { text: cleanText },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
          ssmlGender: voiceConfig.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: options.rate || 0.95,
          pitch: options.pitch || 0,
          volumeGainDb: 2
          // No effectsProfileId: 'headphone-class-device' applies an EQ curve
          // tuned for headphones, which sounds off on laptop/desktop speakers
          // (most likely playback device here) — the unprofiled default is
          // more neutral across whatever device is actually playing it.
        }
      };

      // Call Google TTS API with API key
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ttsRequest)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Google TTS API error response:', errorData);
        throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
      }

      // The API bills per synthesize call regardless of playback outcome, so
      // record usage now rather than after playAudio() below.
      recordTTSUsage(cleanText.length);

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error('No audio content received from Google TTS');
      }

      // Play the audio
      await this.playAudio(data.audioContent);

    } catch (error) {
      console.error('Google TTS Error:', error);
      this.onSpeakEnd?.();
      throw error;
    }
  }

  private async playAudio(audioContent: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio();
        this.currentAudio = audio;

        // Convert base64 to blob URL
        const audioBlob = new Blob([
          Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mp3' });

        const audioUrl = URL.createObjectURL(audioBlob);
        audio.src = audioUrl;

        audio.onloadstart = () => {
          this.onSpeakStart?.();
          this.startAudioLevelSimulation();
        };

        audio.onended = () => {
          this.stopAudioLevelSimulation();
          this.onSpeakEnd?.();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = () => {
          this.stopAudioLevelSimulation();
          this.onSpeakEnd?.();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(new Error('Audio playback failed'));
        };

        audio.play().catch(reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  private startAudioLevelSimulation(): void {
    let time = 0;
    this.audioLevelInterval = setInterval(() => {
      if (this.currentAudio && !this.currentAudio.paused) {
        time += 0.1;
        const baseLevel = 0.4 + Math.sin(time * 3) * 0.2;
        const variation = Math.random() * 0.4;
        const speechPattern = Math.sin(time * 8) * 0.2;
        const level = Math.max(0.1, Math.min(1.0, baseLevel + variation + speechPattern));
        this.onAudioLevel?.(level);
      }
    }, 80);
  }

  private stopAudioLevelSimulation(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = undefined;
    }
    this.onAudioLevel?.(0);
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.stopAudioLevelSimulation();
    this.onSpeakEnd?.();
  }

  getVoices(): SpeechSynthesisVoice[] {
    return [];
  }

  isSupported(): boolean {
    return !!this.apiKey;
  }

  isSpeaking(): boolean {
    return this.currentAudio ? !this.currentAudio.paused : false;
  }

  private getVoiceForLanguage(languageCode: string): { languageCode: string; name: string; gender: string } {
    // Map of language codes to best Google TTS voices (Neural2 for quality)
    const voiceMap: Record<string, { languageCode: string; name: string; gender: string }> = {
      'en-US': { languageCode: 'en-US', name: 'en-US-Neural2-D', gender: 'MALE' },
      'en-GB': { languageCode: 'en-GB', name: 'en-GB-Neural2-D', gender: 'MALE' },
      'en': { languageCode: 'en-US', name: 'en-US-Neural2-D', gender: 'MALE' },
      'es-ES': { languageCode: 'es-ES', name: 'es-ES-Neural2-B', gender: 'MALE' },
      'es-MX': { languageCode: 'es-MX', name: 'es-MX-Neural2-B', gender: 'MALE' },
      'es': { languageCode: 'es-ES', name: 'es-ES-Neural2-B', gender: 'MALE' },
      'fr-FR': { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', gender: 'MALE' },
      'fr-CA': { languageCode: 'fr-CA', name: 'fr-CA-Neural2-B', gender: 'MALE' },
      'fr': { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', gender: 'MALE' },
      'de-DE': { languageCode: 'de-DE', name: 'de-DE-Neural2-D', gender: 'MALE' },
      'de': { languageCode: 'de-DE', name: 'de-DE-Neural2-D', gender: 'MALE' },
      'it-IT': { languageCode: 'it-IT', name: 'it-IT-Neural2-C', gender: 'MALE' },
      'it': { languageCode: 'it-IT', name: 'it-IT-Neural2-C', gender: 'MALE' },
      'pt-BR': { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B', gender: 'MALE' },
      'pt-PT': { languageCode: 'pt-PT', name: 'pt-PT-Wavenet-B', gender: 'MALE' },
      'pt': { languageCode: 'pt-BR', name: 'pt-BR-Neural2-B', gender: 'MALE' },
      'ja-JP': { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C', gender: 'MALE' },
      'ja': { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C', gender: 'MALE' },
      'ko-KR': { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C', gender: 'MALE' },
      'ko': { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C', gender: 'MALE' },
      'zh-CN': { languageCode: 'zh-CN', name: 'zh-CN-Wavenet-B', gender: 'MALE' },
      'zh-TW': { languageCode: 'zh-TW', name: 'zh-TW-Wavenet-B', gender: 'MALE' },
      'zh': { languageCode: 'zh-CN', name: 'zh-CN-Wavenet-B', gender: 'MALE' },
      'hi-IN': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', gender: 'MALE' },
      'hi': { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', gender: 'MALE' },
      'ar-XA': { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-B', gender: 'MALE' },
      'ar': { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-B', gender: 'MALE' },
      'ru-RU': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-B', gender: 'MALE' },
      'ru': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-B', gender: 'MALE' },
      'nl-NL': { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-B', gender: 'MALE' },
      'nl': { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-B', gender: 'MALE' },
      'pl-PL': { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-B', gender: 'MALE' },
      'pl': { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-B', gender: 'MALE' },
      'tr-TR': { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-B', gender: 'MALE' },
      'tr': { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-B', gender: 'MALE' },
      'vi-VN': { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D', gender: 'MALE' },
      'vi': { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D', gender: 'MALE' },
      'th-TH': { languageCode: 'th-TH', name: 'th-TH-Neural2-C', gender: 'MALE' },
      'th': { languageCode: 'th-TH', name: 'th-TH-Neural2-C', gender: 'MALE' },
      'uk-UA': { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A', gender: 'FEMALE' },
      'uk': { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A', gender: 'FEMALE' },
      'he-IL': { languageCode: 'he-IL', name: 'he-IL-Wavenet-B', gender: 'MALE' },
      'he': { languageCode: 'he-IL', name: 'he-IL-Wavenet-B', gender: 'MALE' },
      'id-ID': { languageCode: 'id-ID', name: 'id-ID-Wavenet-B', gender: 'MALE' },
      'id': { languageCode: 'id-ID', name: 'id-ID-Wavenet-B', gender: 'MALE' },
    };

    // Try exact match first
    if (voiceMap[languageCode]) {
      return voiceMap[languageCode];
    }

    // Try language code without region
    const langOnly = languageCode.split('-')[0];
    if (voiceMap[langOnly]) {
      return voiceMap[langOnly];
    }

    // Fallback to English
    console.warn('Google TTS: No voice found for', languageCode, '- using English');
    return voiceMap['en-US'];
  }

  private cleanText(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s*(.*)/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Service factory. Preference order: Groq (Orpheus, English/Arabic only, free
// tier with no billing account attached at all) -> Google Cloud TTS (broader
// language coverage, but needs a billing account linked even to stay under
// quota) -> native browser speech (always free, always available).
export const createTTSService = (): TTSService => {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  const googleApiKey = import.meta.env.VITE_GOOGLE_TTS_API_KEY;

  const otherLanguageFallback: TTSService = googleApiKey
    ? new GoogleCloudTTSService(googleApiKey)
    : new BrowserTTSService();

  if (groqApiKey) {
    console.log('🎙️ Groq TTS (Orpheus): Initializing — free tier, no billing account attached');
    return new GroqTTSService(groqApiKey, otherLanguageFallback);
  }

  if (googleApiKey) {
    console.log('🎙️ Google Cloud TTS: Initializing with API key');
    return new GoogleCloudTTSService(googleApiKey);
  }

  // Fallback to browser TTS
  console.log('🎙️ Using Browser TTS (add VITE_GROQ_API_KEY or VITE_GOOGLE_TTS_API_KEY for higher quality audio)');
  return new BrowserTTSService();
};

// Default export
export const ttsService: TTSService = createTTSService();