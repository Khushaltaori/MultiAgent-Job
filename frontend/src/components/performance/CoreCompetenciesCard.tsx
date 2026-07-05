import { GlassCard } from '../ui/GlassCard';
import { CircularGauge } from '../ui/CircularGauge';
import { ProgressBar } from '../ui/ProgressBar';

interface CoreCompetenciesCardProps {
  overallScore: number;
}

const getGradeLabel = (score: number): string => {
  if (score === 0) return "Needs Practice";
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Strong Profile";
  if (score >= 50) return "Developing";
  return "Needs Improvement";
};

export function CoreCompetenciesCard({ overallScore }: CoreCompetenciesCardProps) {
  // Bind horizontal progress bars dynamically based on overallScore
  // If overallScore is 0, force all values to 0% to match candidate deflection
  const competencies = [
    { 
      label: 'Clarity & Structure', 
      value: overallScore === 0 ? 0 : Math.min(100, Math.round(overallScore * 1.05)), 
      color: 'bg-primary' 
    },
    { 
      label: 'Impact Metrics', 
      value: overallScore === 0 ? 0 : Math.min(100, Math.round(overallScore * 0.89)), 
      color: 'bg-tertiary' 
    },
    { 
      label: 'Tone & Confidence', 
      value: overallScore === 0 ? 0 : Math.min(100, Math.round(overallScore * 1.08)), 
      color: 'bg-primary-container' 
    },
    { 
      label: 'Empathy & Leadership', 
      value: overallScore === 0 ? 0 : Math.min(100, Math.round(overallScore * 0.98)), 
      color: 'bg-secondary-fixed-dim' 
    },
  ];

  return (
    <GlassCard className="grid grid-cols-1 lg:grid-cols-12 gap-lg border-outline-variant/60 bg-surface-container/30 hover:border-outline/40 transition-all font-body text-left h-full p-lg">
      
      {/* Overall Score Circle (4 cols) */}
      <div className="lg:col-span-4 flex flex-col items-center justify-center text-center gap-md border-b lg:border-b-0 lg:border-r border-outline-variant/60 pb-md lg:pb-0 lg:pr-lg select-none">
        <div className="flex flex-col items-center gap-xs">
          <span className="font-label text-label-sm font-bold text-outline tracking-wider uppercase">
            Overall Rating
          </span>
          {/* Badge (Dynamic Grade Label based on score) */}
          <div className="bg-primary/20 text-primary border border-primary/20 px-md py-[4px] rounded-full font-label text-[11px] font-bold">
            Grade: {getGradeLabel(overallScore)}
          </div>
        </div>

        <CircularGauge
          value={overallScore}
          size={140}
          strokeWidth={8}
          strokeColor="stroke-primary"
          label="Score"
          sublabel="Coaching Grade"
        />
      </div>

      {/* Sub-Metrics list (8 cols) */}
      <div className="lg:col-span-8 flex flex-col justify-center gap-md">
        <h3 className="font-headline font-bold text-body-lg text-on-surface select-none mb-xs">
          Core Coaching Competencies
        </h3>
        <div className="flex flex-col gap-sm">
          {competencies.map((c, idx) => (
            <ProgressBar
              key={idx}
              label={c.label}
              value={c.value}
              sublabel={`${c.value}%`}
              color={c.color}
            />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}