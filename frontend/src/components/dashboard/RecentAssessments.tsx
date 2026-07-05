import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import type { SessionHistoryRow } from '../../types';

export function RecentAssessments() {
  const navigate = useNavigate();

  const mockAssessments: SessionHistoryRow[] = [
    {
      id: '1',
      date: '2026-07-02',
      role: 'Senior React Developer',
      icon: 'javascript',
      duration: '18 min',
      score: 84,
      matchLevel: 'Strong Match',
    },
    {
      id: '2',
      date: '2026-06-28',
      role: 'AI Infrastructure Engineer',
      icon: 'network_node',
      duration: '22 min',
      score: 76,
      matchLevel: 'Potential Match',
    },
    {
      id: '3',
      date: '2026-06-15',
      role: 'Full Stack Engineer',
      icon: 'database',
      duration: '15 min',
      score: 68,
      matchLevel: 'Needs Gaps Closed',
    },
  ];

  const handleReview = (_id: string) => {
    navigate('/performance');
  };

  return (
    <div className="w-full flex flex-col gap-md font-body text-left">
      <div className="flex items-center justify-between select-none">
        <h3 className="font-headline font-bold text-headline-sm text-on-surface">
          Recent Coaching Sessions
        </h3>
        <button
          onClick={() => navigate('/performance')}
          className="text-label-sm font-bold text-primary hover:underline font-label flex items-center gap-[2px]"
        >
          View All History
          <span className="material-symbols-outlined text-sm select-none">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {mockAssessments.map((item) => (
          <GlassCard
            key={item.id}
            className="p-md flex flex-col justify-between gap-md border-outline-variant/40 bg-surface-container/20 hover:border-outline-variant hover:bg-surface-container-high/40 transition-all cursor-pointer"
            onClick={() => handleReview(item.id)}
          >
            <div className="flex flex-col gap-xs text-left">
              <div className="flex justify-between items-start select-none">
                <span className="text-[10px] text-on-surface-variant font-medium">
                  {item.date}
                </span>
                <span className={`px-2 py-[2px] rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                  item.score >= 80 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : item.score >= 70
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {item.matchLevel}
                </span>
              </div>
              <h4 className="font-headline font-bold text-body-md text-on-surface line-clamp-1 select-text">
                {item.role}
              </h4>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/20 pt-sm z-10 select-none">
              <div className="flex items-center gap-xs text-on-surface-variant text-body-xs font-medium">
                <span className="material-symbols-outlined text-md font-bold text-outline-variant">
                  {item.icon}
                </span>
                <span>{item.duration}</span>
              </div>
              
              <div className="flex items-center gap-xs">
                <span className="text-body-sm font-bold text-on-surface font-mono">{item.score}%</span>
                <span className="material-symbols-outlined text-sm text-primary font-bold">
                  chevron_right
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}