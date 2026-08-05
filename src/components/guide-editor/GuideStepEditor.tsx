import React from 'react';
import { ChevronDown, ChevronUp, Palette, Trash2, Upload } from 'lucide-react';
import { GuideStep } from '../../types/guides';
import { ImageAnnotator } from '../admin/ImageAnnotator';
import { DeviceDirectionEditor } from './DeviceDirectionEditor';
import { GuideDeviceType } from '../../utils/deviceDetection';

interface GuideStepEditorProps {
  step: GuideStep;
  index: number;
  total: number;
  onChange: (step: GuideStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenImageEditor: () => void;
}

export const GuideStepEditor: React.FC<GuideStepEditorProps> = ({
  step,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onOpenImageEditor,
}) => {
  const directionsByDevice =
    (step.directionsByDevice as Partial<Record<GuideDeviceType, string[]>>) ?? { all: [''] };

  const handleImageUpload = (file: File) => {
    onChange({ ...step, image: URL.createObjectURL(file) });
  };

  return (
    <article className="rounded-[16px] border border-hairline bg-surface p-5 shadow-micro space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white font-bold text-sm">
          {index + 1}
        </span>
        <input
          value={step.title}
          onChange={(e) => onChange({ ...step, title: e.target.value })}
          className="flex-1 font-display font-bold text-lg text-ink bg-transparent border-b border-transparent focus:border-brand outline-none"
          placeholder="Step title"
        />
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={onMoveUp} disabled={index === 0} className="p-2 rounded-lg hover:bg-subtle disabled:opacity-30" aria-label="Move up">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="p-2 rounded-lg hover:bg-subtle disabled:opacity-30" aria-label="Move down">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button type="button" onClick={onRemove} className="p-2 rounded-lg hover:bg-red-50 text-ink-muted hover:text-red-600" aria-label="Remove step">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <DeviceDirectionEditor
          directionsByDevice={directionsByDevice}
          onChange={(next) => onChange({ ...step, directionsByDevice: next })}
        />

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Screenshot (optional)</label>
          <div className="rounded-[12px] border border-hairline bg-canvas min-h-[200px] flex flex-col items-center justify-center p-4 relative">
            {step.image ? (
              <>
                <img src={step.image} alt="" className="max-h-40 object-contain rounded-lg" />
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={onOpenImageEditor} className="btn-pill btn-pill-primary text-xs px-3 py-1.5 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5" /> Annotate
                  </button>
                  <button type="button" onClick={() => onChange({ ...step, image: undefined, annotations: [] })} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <label className="cursor-pointer text-center">
                <Upload className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                <span className="text-sm text-ink-muted">Upload image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              </label>
            )}
          </div>
          {step.image && (
            <input
              value={step.imageCaption || ''}
              onChange={(e) => onChange({ ...step, imageCaption: e.target.value })}
              placeholder="Image caption (helps match images later)"
              className="w-full rounded-[12px] border border-hairline bg-surface px-3 py-2 text-sm focus:border-brand outline-none"
            />
          )}
        </div>
      </div>
    </article>
  );
};

interface GuideImageEditorModalProps {
  step: GuideStep;
  stepIndex: number;
  onClose: () => void;
  onChange: (step: GuideStep) => void;
}

export const GuideImageEditorModal: React.FC<GuideImageEditorModalProps> = ({
  step,
  stepIndex,
  onClose,
  onChange,
}) => (
  <div className="fixed inset-0 z-[70] bg-ink/80 backdrop-blur-sm flex flex-col">
    <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-hairline">
      <div>
        <h3 className="font-display font-bold text-ink">Annotate image</h3>
        <p className="text-sm text-ink-muted">Step {stepIndex + 1}: {step.title}</p>
      </div>
      <button type="button" onClick={onClose} className="btn-pill btn-pill-primary text-sm px-4 py-2">
        Done
      </button>
    </div>
    <div className="flex-1 p-6 overflow-hidden">
      <div className="h-full max-w-5xl mx-auto bg-surface rounded-card border border-hairline p-4">
        <ImageAnnotator
          imageUrl={step.image || ''}
          annotations={step.annotations}
          onChange={(annotations) => onChange({ ...step, annotations })}
          onImageUrlChange={(url) => onChange({ ...step, image: url })}
        />
      </div>
    </div>
  </div>
);
