import { useCallback, useEffect, useRef, useState } from 'react';
import { GuideAnnotation } from '../types/guides';
import { askAboutFrame, ScreenAssistResponse } from '../services/ai/ScreenAssistVisionService';

const DEBOUNCE_MS = 3000;
const CAPTURE_TARGET_WIDTH = 1280;
const CAPTURE_JPEG_QUALITY = 0.6;

// Optional: if the TechSteps Screen Assist browser extension is installed
// (see extension/), forward the annotation so it can draw the marker
// directly on the real page being shared -- additive to, never a
// replacement for, the in-page overlay below, since most users won't have
// it installed. Silently no-ops if the extension isn't there, the id isn't
// configured, or sendMessage isn't available (non-Chrome browsers, etc.) --
// this integration must never be able to break the core flow.
const EXTENSION_ID = import.meta.env.VITE_TECHSTEPS_EXTENSION_ID as string | undefined;

function notifyExtension(annotation: GuideAnnotation | null): void {
  if (!annotation || !EXTENSION_ID) return;
  const runtime = (window as any).chrome?.runtime;
  if (!runtime?.sendMessage) return;
  try {
    runtime.sendMessage(EXTENSION_ID, { type: 'HIGHLIGHT', annotation }, () => {
      // Reading lastError (rather than ignoring it) prevents Chrome logging
      // an "Unchecked runtime.lastError" console warning -- expected and
      // harmless when the extension just isn't installed.
      void runtime.lastError;
    });
  } catch {
    // sendMessage can throw synchronously for a malformed extension id --
    // never let this optional integration break screen-share assist itself.
  }
}

// Whether the extension is actually reachable right now -- previously this
// was silent (notifyExtension() just no-ops on any failure), so a missing
// VITE_TECHSTEPS_EXTENSION_ID, an uninstalled extension, or a non-Chrome
// browser all looked identical to "it's working." Ping it for real so the UI
// can say so instead of just drawing the in-page overlay and hoping.
function pingExtension(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!EXTENSION_ID) return resolve(false);
    const runtime = (window as any).chrome?.runtime;
    if (!runtime?.sendMessage) return resolve(false);
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    try {
      runtime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response: any) => {
        void runtime.lastError;
        finish(!!response?.ok);
      });
      setTimeout(() => finish(false), 1000);
    } catch {
      finish(false);
    }
  });
}

interface UseScreenShareAssistResult {
  isSupported: boolean;
  isSharing: boolean;
  isThinking: boolean;
  lastFrameUrl: string | null;
  lastAnnotation: GuideAnnotation | null;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
  /** Returns null if not sharing, or if debounced -- callers should treat
   *  null as "nothing to say this turn", not an error. */
  askQuestion: (question: string) => Promise<ScreenAssistResponse | null>;
  /** null = not checked yet (or the extension isn't configured for this
   *  build at all); true/false = a real, just-pinged answer. */
  extensionConnected: boolean | null;
}

/**
 * Owns the getDisplayMedia session and the capture-on-ask loop. Frames are
 * captured only when askQuestion() is called (never polled) and only the
 * single most recent frame is ever held -- nothing is uploaded to Firebase
 * Storage/Firestore, matching the plan's privacy requirement.
 *
 * A documentPictureInPicture floating-window version of this was tried and
 * pulled back out after real testing: even sized up and with styling fixed,
 * it read as a disconnected "random popup" rather than a helper actually
 * pointing at the shared app. See VoiceHomePage.tsx / the plan notes for
 * where this is headed next (something closer to how Claude for Chrome
 * shows its action indicators, which needs real page DOM access a plain
 * web tab doesn't have -- likely a browser-extension companion, not a
 * bigger/prettier version of this popup).
 */
export function useScreenShareAssist(): UseScreenShareAssistResult {
  const [isSharing, setIsSharing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null);
  const [lastAnnotation, setLastAnnotation] = useState<GuideAnnotation | null>(null);
  const [extensionConnected, setExtensionConnected] = useState<boolean | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastAskAtRef = useRef(0);

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

  const stopSharing = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    videoRef.current = null;
    setIsSharing(false);
    setLastFrameUrl(null);
    setLastAnnotation(null);
  }, []);

  const startSharing = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    streamRef.current = stream;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    videoRef.current = video;

    // Covers the case most likely to be missed: the senior stops sharing via
    // the browser's own native "Stop sharing" bar instead of our button.
    stream.getVideoTracks()[0]?.addEventListener('ended', stopSharing);

    setIsSharing(true);
    pingExtension().then(setExtensionConnected);
  }, [stopSharing]);

  // Also check once up front, so a "pointer extension not detected" hint can
  // show before the senior even starts sharing, not just after.
  useEffect(() => {
    let cancelled = false;
    pingExtension().then((ok) => {
      if (!cancelled) setExtensionConnected(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const askQuestion = useCallback(async (question: string): Promise<ScreenAssistResponse | null> => {
    const video = videoRef.current;
    if (!video) return null;

    const now = Date.now();
    if (now - lastAskAtRef.current < DEBOUNCE_MS) return null;
    lastAskAtRef.current = now;

    const scale = Math.min(1, CAPTURE_TARGET_WIDTH / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', CAPTURE_JPEG_QUALITY);
    const base64 = dataUrl.split(',')[1] || '';

    setLastFrameUrl(dataUrl);
    setLastAnnotation(null);
    setIsThinking(true);
    try {
      const response = await askAboutFrame({ imageBase64: base64, question });
      setLastAnnotation(response.annotation);
      notifyExtension(response.annotation);
      return response;
    } finally {
      setIsThinking(false);
    }
  }, []);

  // Stop the real hardware capture if the component unmounts mid-share.
  useEffect(() => () => stopSharing(), [stopSharing]);

  return {
    isSupported,
    isSharing,
    isThinking,
    lastFrameUrl,
    lastAnnotation,
    startSharing,
    stopSharing,
    askQuestion,
    extensionConnected,
  };
}
