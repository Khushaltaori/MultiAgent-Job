import { useEffect, useState } from 'react';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

interface CircularGaugeProps {
  value: number;
  size?: number; // width and height in pixels, default 120
  strokeWidth?: number; // default 8
  strokeColor?: string; // default 'stroke-primary'
  label?: string; // e.g. 'Match'
  sublabel?: string; // e.g. 'Proficiency'
}

export function CircularGauge({
  value,
  size = 120,
  strokeWidth = 8,
  strokeColor = 'stroke-primary',
  label,
  sublabel,
}: CircularGaugeProps) {
  const animatedValue = useAnimatedCounter(value, 1500);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    // Animate the dashoffset
    const progressOffset = circumference - (value / 100) * circumference;
    const timer = setTimeout(() => {
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [value, circumference]);

  return (
    <div className="flex flex-col items-center justify-center font-label" style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            className="stroke-surface-container-highest"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx="50"
            cy="50"
          />
          {/* Foreground circle with progress */}
          <circle
            className={`transition-all duration-1000 ease-out ${strokeColor}`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx="50"
            cy="50"
          />
        </svg>
        {/* Animated label in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-headline-md font-bold text-on-surface">
            {animatedValue}%
          </span>
          {label && (
            <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <span className="text-body-xs text-on-surface-variant mt-xs">
          {sublabel}
        </span>
      )}
    </div>
  );
}