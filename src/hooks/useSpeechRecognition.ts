import { useCallback, useRef, useState } from 'react';
import { GoogleSpeechToTextService } from '../services/GoogleSpeechToTextService';

// Simple i18n-language -> BCP-47 recognition/STT locale mapping, extend as needed.
const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
};

interface UseSpeechRecognitionOptions {
  /** i18n language code (e.g. 'en'), mapped to a BCP-47 locale internally. */
  language?: string;
  /** Shown as the interim transcript while the MediaRecorder fallback is recording. */
  recordingLabel?: string;
  onFinalTranscript: (transcript: string) => void;
}

interface UseSpeechRecognitionResult {
  isListening: boolean;
  interimTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

/**
 * Extracted from ChatDashboard's original startListening(): prefers the browser's
 * native SpeechRecognition, falls back to a 4s MediaRecorder clip sent to
 * GoogleSpeechToTextService when unavailable. Unlike the original, stopListening()
 * here actually stops the underlying recognition/recorder (the original only
 * toggled a UI flag) since a real "mute/stop" control needs it to work.
 */
export function useSpeechRecognition({
  language = 'en',
  recordingLabel = 'Recording...',
  onFinalTranscript,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    const langCode = LANG_MAP[language] || `${language}-US`;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionCtor = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.lang = langCode;
      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInterimTranscript(transcript);
        if (event.results[0].isFinal) onFinalTranscript(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        setIsListening(false);
      };
      recognition.start();
      return;
    }

    // Fallback: record a short clip and send to Google STT
    try {
      setInterimTranscript(recordingLabel);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.start();
      setIsListening(true);

      await new Promise((resolve) => setTimeout(resolve, 4000));
      if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();

      const stopped = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
      });
      await stopped;

      const blob = new Blob(chunks, { type: chunks[0] ? (chunks[0] as Blob).type : 'audio/webm' });
      stream.getTracks().forEach((track) => track.stop());
      setInterimTranscript('');
      setIsListening(false);

      const transcript = await GoogleSpeechToTextService.transcribeAudio(blob, langCode);
      if (transcript) onFinalTranscript(transcript);
    } catch (e) {
      console.warn('Fallback STT failed:', e);
      setIsListening(false);
      setInterimTranscript('');
    }
  }, [language, recordingLabel, onFinalTranscript]);

  return { isListening, interimTranscript, startListening, stopListening };
}
