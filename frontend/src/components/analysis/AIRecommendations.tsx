import { GlassCard } from '../ui/GlassCard';
import type { Recommendation } from '../../types';

interface AIRecommendationsProps {
  recommendations: Recommendation[];
}

export function AIRecommendations({ recommendations }: AIRecommendationsProps) {
  const borderColors: { [key: string]: string } = {
    primary: 'border-l-primary shadow-primary/5 hover:shadow-primary/10',
    tertiary: 'border-l-tertiary shadow-tertiary/5 hover:shadow-tertiary/10',
    secondary: 'border-l-secondary shadow-secondary/5 hover:shadow-secondary/10',
    error: 'border-l-error shadow-error/5 hover:shadow-error/10',
  };

  const iconColors: { [key: string]: string } = {
    primary: 'text-primary bg-primary/10',
    tertiary: 'text-tertiary bg-tertiary/10',
    secondary: 'text-secondary-fixed-dim bg-secondary-container/30',
    error: 'text-error bg-error/10',
  };

  const iconNames: { [key: string]: string } = {
    primary: 'rocket_launch',
    tertiary: 'menu_book',
    secondary: 'psychology',
    error: 'campaign',
  };

  return (
    <GlassCard className="relative overflow-hidden flex flex-col gap-md border-outline-variant/60 bg-surface-container/30 hover:border-outline/40 transition-all font-body text-left h-full p-lg">
      {/* Subtle background shimmer texture overlay */}
      <div className="shimmer absolute inset-0 opacity-[0.06] pointer-events-none" />

      <h3 className="font-headline font-bold text-headline-sm text-on-surface z-10 select-none">
        Coaching Recommendations
      </h3>

      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar z-10">
        {recommendations.map((item, index) => {
          const borderStyle = borderColors[item.accentColor] || 'border-l-primary';
          const iconStyle = iconColors[item.accentColor] || 'text-primary bg-primary/10';
          const iconName = iconNames[item.accentColor] || 'menu_book';

          return (
            <div
              key={index}
              className={`flex gap-md p-md rounded-xl border-l-4 bg-surface-container-low/40 shadow hover:bg-surface-container-high/40 transition-colors ${borderStyle}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 select-none ${iconStyle}`}>
                <span className="material-symbols-outlined text-lg font-bold">
                  {iconName}
                </span>
              </div>
              <div className="flex flex-col gap-xs text-left">
                <h4 className="text-label-md font-bold text-on-surface select-none">
                  {item.title}
                </h4>
                <p className="text-body-sm text-on-surface-variant leading-relaxed select-text">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}