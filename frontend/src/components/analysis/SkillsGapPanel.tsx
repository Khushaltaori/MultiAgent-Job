import { GlassCard } from '../ui/GlassCard';
import type { SkillChip, SkillGap } from '../../types';

interface SkillsGapPanelProps {
  matchingSkills: SkillChip[];
  skillGaps: SkillGap[];
}

export function SkillsGapPanel({ matchingSkills, skillGaps }: SkillsGapPanelProps) {
  const priorityColors = {
    high: 'bg-error/10 text-error border-error/20',
    medium: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    low: 'bg-secondary-container/20 text-on-secondary-container border-outline/20',
  };

  return (
    <GlassCard className="flex flex-col gap-md border-outline-variant/60 bg-surface-container/30 hover:border-outline/40 transition-all font-body text-left h-full p-lg">
      <h3 className="font-headline font-bold text-headline-sm text-on-surface select-none">
        Skills Coverage
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-xs">
        
        {/* Left Col - Matching Skills */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs text-on-surface-variant font-label text-label-sm font-bold tracking-wider uppercase border-b border-outline-variant pb-xs select-none">
            <span className="material-symbols-outlined text-emerald-400 text-md select-none font-bold">
              check_circle
            </span>
            <span>Matched Competencies ({matchingSkills.length})</span>
          </div>

          <div className="flex flex-wrap gap-xs py-xs select-none">
            {matchingSkills.map((skill, index) => (
              <div
                key={index}
                className="px-sm py-[6px] bg-primary/10 text-primary border border-primary/20 rounded-xl font-label text-label-sm font-semibold hover:scale-105 transition-transform duration-300"
              >
                {skill.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right Col - Skill Gaps */}
        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-xs text-on-surface-variant font-label text-label-sm font-bold tracking-wider uppercase border-b border-outline-variant pb-xs select-none">
            <span className="material-symbols-outlined text-tertiary text-md select-none font-bold">
              warning
            </span>
            <span>Identified Gaps ({skillGaps.length})</span>
          </div>

          <div className="flex flex-col gap-xs py-xs">
            {skillGaps.map((gap, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-sm rounded-xl bg-surface-container-low border border-outline-variant/40 hover:bg-surface-container-high/40 transition-colors"
              >
                <span className="text-body-sm font-medium text-on-surface select-text">
                  {gap.name}
                </span>
                <span className={`px-2 py-[2px] rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                  priorityColors[gap.priority] || priorityColors.low
                }`}>
                  {gap.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </GlassCard>
  );
}