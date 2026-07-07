import { GlassCard } from '../ui/GlassCard';
import type { SessionHistoryRow } from '../../types';

interface SessionHistoryTableProps {
  history: SessionHistoryRow[];
  onRehydrate: (id: string) => void;
}

export function SessionHistoryTable({
  history,
  onRehydrate,
}: SessionHistoryTableProps) {
  return (
    <div className="w-full flex flex-col gap-md font-body text-left">
      <div className="flex flex-col gap-xs select-none">
        <h3 className="font-headline font-bold text-headline-sm text-on-surface">
          Session History Logs
        </h3>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Select any previous mock interview session and rehydrate its details in the STAR breakdown view above.
        </p>
      </div>

      <GlassCard className="p-0 border-outline-variant/60 bg-surface-container/30 overflow-hidden hover:border-outline-variant/40 transition-all select-none">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm text-on-surface">
            {/* Table Header */}
            <thead className="bg-surface-container-high/60 border-b border-outline-variant/60 font-label text-label-sm font-bold text-outline tracking-wider uppercase text-left">
              <tr>
                <th className="px-lg py-md">Date</th>
                <th className="px-lg py-md">Target Role</th>
                <th className="px-lg py-md">Duration</th>
                <th className="px-lg py-md text-center">Score</th>
                <th className="px-lg py-md">Match Level</th>
                <th className="px-lg py-md text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-outline-variant/30 font-medium">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant font-medium select-none">
                    Complete your first mock interview session to review progress!
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-container-low/30 transition-colors"
                  >
                    <td className="px-lg py-md font-mono text-body-sm text-on-surface-variant select-text">
                      {row.date}
                    </td>
                    <td className="px-lg py-md select-text">
                      <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-md font-bold text-outline-variant select-none">
                          {row.icon}
                        </span>
                        <span>{row.role}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md text-on-surface-variant select-text">
                      {row.duration}
                    </td>
                    <td className="px-lg py-md text-center font-bold font-mono text-on-surface select-text">
                      {row.score}%
                    </td>
                    <td className="px-lg py-md select-none">
                      <span className={`px-2 py-[2px] rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                        row.score >= 80 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : row.score >= 70
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {row.matchLevel}
                      </span>
                    </td>
                    <td className="px-lg py-md text-right select-none">
                      <button
                        onClick={() => onRehydrate(row.id)}
                        className="text-label-sm font-bold text-primary hover:text-opacity-80 transition-colors uppercase font-label"
                      >
                        Rehydrate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}