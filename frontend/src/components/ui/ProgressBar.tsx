import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number;
  label?: string;
  sublabel?: string;
  color?: string; // bg-color utility class
}

export function ProgressBar({
  value,
  label,
  sublabel,
  color = 'bg-primary',
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Animate the bar width on mount
    const timer = setTimeout(() => {
      setWidth(value);
    }, 150);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="w-full flex flex-col gap-[6px] font-body">
      {(label || sublabel) && (
        <div className="flex justify-between items-center text-body-sm">
          {label && (
            <span className="font-semibold text-on-surface">
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-on-surface-variant font-label text-label-sm">
              {sublabel}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
