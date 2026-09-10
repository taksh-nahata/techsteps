import { useCallback, useEffect, useRef, useState } from 'react';
import { GuideAnnotation } from '../types/guides';
import { askAboutFrame, ScreenAssistResponse } from '../services/ai/ScreenAssistVisionService';

const DEBOUNCE_MS = 3000;
const CAPTURE_TARGET_WIDTH = 1280;
const CAPTURE_JPEG_QUALITY = 0.6;

interface UseScreenShareAssistResult {
  isSupported: boolean;
  isSharing: boolean;
  isThinking: boolean;
  lastFrameUrl: string | null;
  lastAnnotation: GuideAnnotation | null;
  /** Non-null only in browsers that support documentPictureInPicture (real
   *  usage confirmed this matters: without it, the marker only ever shows on
   *  the TechSteps tab, invisible the moment the senior switches to the
   *  actual app to click, which is exactly the scenario this whole feature
   *  exists for). Render the overlay into this window via a portal when set. */
  pipWindow: Window | null;
  startSharing: () => Promise<void>;
  stopSharing: () => void;
  /** Returns null if not sharing, or if debounced -- callers should treat
   *  null as "nothing to say this turn", not an error. */
  askQuestion: (question: string) => Promise<ScreenAssistResponse | null>;
}

// Not yet in TypeScript's DOM lib types.
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
      window: Window | null;
    };
  }
}

/** Copies same-origin stylesheet rules (e.g. Tailwind's compiled CSS) into
 *  the PiP window's own document, and re-links cross-origin ones (e.g.
 *  Google Fonts) since reading their cssRules throws. Without this the PiP
 *  window renders completely unstyled -- it's a separate document, not an
 *  iframe, so nothing carries over automatically. */
function copyStylesInto(pipWindow: Window) {
  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      const cssRules = Array.from(styleSheet.cssRules)
        .map((rule) => rule.cssText)
        .join('');
      const style = document.createElement('style');
      style.textContent = cssRules;
      pipWindow.document.head.appendChild(style);
    } catch {
      if (styleSheet.href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
      }
    }
  }
}

/**
 * Owns the getDisplayMedia session and the capture-on-ask loop. Frames are
 * captured only when askQuestion() is called (never polled) and only the
 * single most recent frame is ever held -- nothing is uploaded to Firebase
 * Storage/Firestore, matching the plan's privacy requirement.
 */
export function useScreenShareAssist(): UseScreenShareAssistResult {
  const [isSharing, setIsSharing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null);
  const [lastAnnotation, setLastAnnotation] = useState<GuideAnnotation | null>(null);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

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
    setPipWindow((current) => {
      current?.close();
      return null;
    });
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

    // Best-effort: Chrome/Edge only, and can fail if the transient user
    // activation from the original click didn't survive the async gap while
    // the native getDisplayMedia picker was open. Not fatal either way --
    // the overlay still renders inline on the TechSteps tab as a fallback.
    if (window.documentPictureInPicture) {
      try {
        const pip = await window.documentPictureInPicture.requestWindow({ width: 360, height: 320 });
        copyStylesInto(pip);
        pip.addEventListener('pagehide', () => setPipWindow(null), { once: true });
        setPipWindow(pip);
      } catch (e) {
        console.warn('Could not open a floating picture-in-picture window; falling back to the in-tab overlay.', e);
      }
    }
  }, [stopSharing]);

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
      return response;
    } finally {
      setIsThinking(false);
    }
  }, []);

  // Stop the real hardware capture if the component unmounts mid-share.
  useEffect(() => () => stopSharing(), [stopSharing]);

  return { isSupported, isSharing, isThinking, lastFrameUrl, lastAnnotation, pipWindow, startSharing, stopSharing, askQuestion };
}
