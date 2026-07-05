import { GlassCard } from '../ui/GlassCard';
import { CircularGauge } from '../ui/CircularGauge';

interface MatchScoreCardProps {
  score: number;
}

export function MatchScoreCard({ score }: MatchScoreCardProps) {
  return (
    <GlassCard className="flex flex-col items-center justify-center gap-md text-center bg-surface-container/30 border-outline-variant/60 hover:border-outline/40 transition-all min-h-[300px] h-full font-body">
      <h3 className="font-headline font-bold text-body-md text-on-surface uppercase tracking-wider text-outline select-none">
        Proficiency Match
      </h3>
      
      {/* Reusable animated CircularGauge */}
      <CircularGauge
        value={score}
        size={140}
        strokeWidth={7}
        strokeColor="stroke-primary"
        label="Match"
        sublabel="Proficiency"
      />

      <div className="flex flex-col gap-xs max-w-[85%] select-none">
        <h4 className="text-body-sm font-bold text-on-surface">Strong Job Alignment</h4>
        <p className="text-[12px] text-on-surface-variant leading-relaxed">
          Your profile matches {score}% of the target requirements. Bridge the remaining gaps to become a strong candidate.
        </p>
      </div>
    </GlassCard>
  );
}
