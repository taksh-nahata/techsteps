import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  GUIDE_DEVICE_LABELS,
  GUIDE_DEVICE_TYPES,
  GuideDeviceType,
} from '../../utils/deviceDetection';

interface DeviceDirectionEditorProps {
  directionsByDevice: Partial<Record<GuideDeviceType, string[]>>;
  onChange: (directionsByDevice: Partial<Record<GuideDeviceType, string[]>>) => void;
}

export const DeviceDirectionEditor: React.FC<DeviceDirectionEditorProps> = ({
  directionsByDevice,
  onChange,
}) => {
  const [activeDevice, setActiveDevice] = useState<GuideDeviceType>('all');

  const currentList =
    directionsByDevice[activeDevice] !== undefined
      ? [...directionsByDevice[activeDevice]!]
      : [''];

  const updateList = (list: string[]) => {
    onChange({ ...directionsByDevice, [activeDevice]: list });
  };

  const updateLine = (index: number, value: string) => {
    const next = [...currentList];
    next[index] = value;
    updateList(next);
  };

  const addLine = () => {
    updateList([...currentList, '']);
  };

  const removeLine = (index: number) => {
    const next = currentList.filter((_, i) => i !== index);
    updateList(next.length ? next : ['']);
  };

  const devicesWithContent = GUIDE_DEVICE_TYPES.filter((d) =>
    (directionsByDevice[d] ?? []).some((line) => line.trim())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
          Directions for
        </label>
        {devicesWithContent.length > 0 && (
          <span className="text-[10px] text-ink-muted">
            {devicesWithContent.length} device type{devicesWithContent.length === 1 ? '' : 's'} filled
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GUIDE_DEVICE_TYPES.map((device) => {
          const hasContent = (directionsByDevice[device] ?? []).some((l) => l.trim());
          return (
            <button
              key={device}
              type="button"
              onClick={() => setActiveDevice(device)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                activeDevice === device
                  ? 'bg-brand text-white border-brand'
                  : hasContent
                    ? 'bg-brand-soft/60 text-brand border-brand/30 hover:border-brand'
                    : 'bg-canvas text-ink-muted border-hairline hover:border-brand/30'
              }`}
            >
              {GUIDE_DEVICE_LABELS[device]}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-ink-muted">
        Users only see directions for their device — add steps for each platform that differs.
      </p>

      <div className="space-y-2 rounded-[12px] border border-hairline bg-canvas/50 p-3">
        <p className="text-xs font-semibold text-brand">
          {GUIDE_DEVICE_LABELS[activeDevice]}
        </p>
        {currentList.map((line, i) => (
          <div key={`${activeDevice}-${i}`} className="flex gap-2">
            <span className="text-xs text-ink-muted pt-3 w-5 shrink-0">{i + 1}.</span>
            <textarea
              value={line}
              onChange={(e) => updateLine(i, e.target.value)}
              rows={2}
              className="flex-1 rounded-[10px] border border-hairline bg-surface px-3 py-2 text-sm text-ink resize-none focus:border-brand outline-none"
              placeholder={`What to do on ${GUIDE_DEVICE_LABELS[activeDevice].toLowerCase()}…`}
            />
            {currentList.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="p-2 text-ink-muted hover:text-red-600 self-start shrink-0"
                aria-label="Remove direction"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="text-sm font-medium text-brand flex items-center gap-1 hover:underline pt-1"
        >
          <Plus className="w-4 h-4" /> Add direction
        </button>
      </div>
    </div>
  );
};
