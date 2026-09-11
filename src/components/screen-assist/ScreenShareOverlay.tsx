import React from 'react';
import { useTranslation } from 'react-i18next';
import { GuideAnnotation } from '../../types/guides';
import AnnotationMarker from '../shared/AnnotationMarker';

interface ScreenShareOverlayProps {
  frameUrl: string | null;
  annotation: GuideAnnotation | null;
  isThinking: boolean;
  onStop: () => void;
  /** null = still checking; true/false = a real pinged result. Only shown
   *  once known, and only as an fyi -- the frame/marker below always work
   *  regardless, this just says whether a marker will ALSO appear on the
   *  real page being shared. */
  extensionConnected: boolean | null;
}

const ScreenShareOverlay: React.FC<ScreenShareOverlayProps> = ({
  frameUrl,
  annotation,
  isThinking,
  onStop,
  extensionConnected,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface shadow-senior-lg overflow-hidden text-left">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-hairline">
        <span className="text-sm font-semibold text-ink" role="status" aria-live="polite">
          {isThinking
            ? t('screenAssist.looking', 'Looking at your screen…')
            : t('screenAssist.sharing', 'Sharing your screen')}
        </span>
        <button onClick={onStop} className="btn-secondary shrink-0 px-3 py-1.5 text-sm">
          {t('screenAssist.stopSharing', 'Stop Sharing')}
        </button>
      </div>
      {extensionConnected === false && (
        <div className="px-4 py-2 text-xs text-ink-muted bg-subtle border-b border-hairline">
          {t(
            'screenAssist.extensionNotConnected',
            "Pointer extension not detected — you'll see the marker here, but not on the page you're sharing."
          )}
        </div>
      )}
      <div className="relative bg-subtle aspect-video">
        {frameUrl ? (
          <>
            <img src={frameUrl} alt={t('screenAssist.frameAlt', 'Last captured frame from your screen')} className="w-full h-full object-contain" />
            {annotation && <AnnotationMarker annotation={annotation} />}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm px-6 text-center">
            {t('screenAssist.emptyState', "Ask what to click and I'll show you here.")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareOverlay;
