import React from 'react';
import {
  GUIDE_DEVICE_LABELS,
  GUIDE_DEVICE_TYPES,
  GuideDeviceType,
} from '../../utils/deviceDetection';

interface DevicePreviewPickerProps {
  value: GuideDeviceType;
  onChange: (device: GuideDeviceType) => void;
  className?: string;
}

export const DevicePreviewPicker: React.FC<DevicePreviewPickerProps> = ({
  value,
  onChange,
  className = '',
}) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted mr-1">
      Preview as
    </span>
    {GUIDE_DEVICE_TYPES.filter((d) => d !== 'all').map((device) => (
      <button
        key={device}
        type="button"
        onClick={() => onChange(device)}
        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
          value === device
            ? 'bg-brand text-white border-brand'
            : 'bg-surface text-ink-muted border-hairline hover:border-brand/40'
        }`}
      >
        {GUIDE_DEVICE_LABELS[device]}
      </button>
    ))}
    <button
      type="button"
      onClick={() => onChange('all')}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
        value === 'all'
          ? 'bg-brand text-white border-brand'
          : 'bg-surface text-ink-muted border-hairline hover:border-brand/40'
      }`}
    >
      All (fallback)
    </button>
  </div>
);
