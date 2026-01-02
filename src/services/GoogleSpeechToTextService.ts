export const GoogleSpeechToTextService = {
  // Transcribe a Blob audio (recorded via MediaRecorder) using Google Speech-to-Text REST API.
  // Returns transcription string or empty string on failure.
  transcribeAudio: async (blob: Blob, languageCode = 'en-US'): Promise<string> => {
    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY;
      if (!apiKey) {
        console.warn('Google API key not set (VITE_GOOGLE_API_KEY). Cannot transcribe.');
        return '';
      }

      // Read blob as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string | ArrayBuffer | null;
          if (!result) return resolve('');
          if (typeof result === 'string' && result.indexOf('base64,') >= 0) {
            resolve(result.split('base64,')[1]);
          } else if (typeof result === 'string') {
            resolve(btoa(result));
          } else {
            reject(new Error('Unsupported audio read result'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (!base64) return '';

      // Guess encoding
      let encoding = 'WEBM_OPUS';
      const type = (blob.type || '').toLowerCase();
      if (type.includes('wav') || type.includes('pcm')) encoding = 'LINEAR16';
      if (type.includes('ogg')) encoding = 'OGG_OPUS';

      const url = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

      const body = {
        config: {
          encoding,
          languageCode,
          enableAutomaticPunctuation: true,
          audioChannelCount: 1
        },
        audio: {
          content: base64
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.warn('Google STT failed:', res.status, txt);
        return '';
      }

      const json = await res.json();
      const results = json?.results || [];
      const transcripts = results.map((r: any) => r.alternatives?.[0]?.transcript).filter(Boolean);
      return transcripts.join(' ').trim();
    } catch (e) {
      console.error('GoogleSpeechToTextService error:', e);
      return '';
    }
  }
};
