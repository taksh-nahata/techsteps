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
  startSharing: () => Promise<void>;
  stopSharing: () => void;
  /** Returns null if not sharing, or if debounced -- callers should treat
   *  null as "nothing to say this turn", not an error. */
  askQuestion: (question: string) => Promise<ScreenAssistResponse | null>;
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

  return { isSupported, isSharing, isThinking, lastFrameUrl, lastAnnotation, startSharing, stopSharing, askQuestion };
}
