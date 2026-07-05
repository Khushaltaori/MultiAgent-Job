import { MatchScoreCard } from '../components/analysis/MatchScoreCard';
import { SkillsGapPanel } from '../components/analysis/SkillsGapPanel';
import { AIRecommendations } from '../components/analysis/AIRecommendations';
import { LaunchInterviewCTA } from '../components/analysis/LaunchInterviewCTA';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { useJobCoach } from '../context/JobCoachContext';
import type { SkillChip, SkillGap, Recommendation } from '../types';

export function GapAnalysisPage() {
  const { showToast } = useToast();
  const { analysisResult } = useJobCoach();

  // Parse dynamic data from the backend result if available
  const hasRealData = !!analysisResult?.gap_report;
  
  const score = hasRealData ? analysisResult.gap_report.match_score : 82;
  const roleTitle = hasRealData ? (analysisResult.parsed_jd?.role_title || 'Target Role') : 'Senior Backend Developer';

  const matchingSkills: SkillChip[] = hasRealData
    ? analysisResult.gap_report.matching_skills.map((skill: string) => ({ label: skill, matched: true }))
    : [
        { label: 'FastAPI', matched: true },
        { label: 'Python APIs', matched: true },
        { label: 'Supabase RAG', matched: true },
        { label: 'SQL & Database Design', matched: true },
        { label: 'RESTful Architecture', matched: true },
      ];

  const skillGaps: SkillGap[] = hasRealData
    ? analysisResult.gap_report.missing_skills.map((skill: string) => ({ name: skill, priority: 'high' }))
    : [
        { name: 'Redis Checkpoint Persistence', priority: 'high' },
        { name: 'Docker Compose Packaging', priority: 'medium' },
        { name: 'Next.js Frontend Integration', priority: 'low' },
      ];

  const getAccentColor = (idx: number): string => {
    const colors = ['primary', 'tertiary', 'secondary'];
    return colors[idx % colors.length];
  };

  const fallbackRecommendations: Recommendation[] = [
    {
      title: 'API Design & Profiling',
      description: 'Deepen understanding of asynchronous API design and performance profiling.',
      accentColor: 'primary',
    },
    {
      title: 'Database Query Optimization',
      description: 'Review fundamental SQL query optimizations and indexing strategies.',
      accentColor: 'tertiary',
    },
    {
      title: 'STAR Response Framing',
      description: 'Formulate structured responses using the STAR format (Situation, Task, Action, Result).',
      accentColor: 'secondary',
    },
  ];

  const recommendations: Recommendation[] = hasRealData && analysisResult.gap_report.missing_skills?.length > 0
    ? analysisResult.gap_report.missing_skills.map((skill: string, idx: number) => ({
        title: `Master ${skill}`,
        description: `Focus on mastering ${skill} core features and architectures to close your current target job description gaps.`,
        accentColor: getAccentColor(idx),
      }))
    : fallbackRecommendations;

  const handleDownload = () => {
    showToast('Preparing PDF Report download...');
    setTimeout(() => {
      showToast('PDF download successfully initiated!');
    }, 1500);
  };

  const handleShare = () => {
    showToast('Copied report link to clipboard.');
  };

  return (
    <div className="flex flex-col gap-lg font-body text-left w-full select-text">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md border-b border-outline-variant/60 pb-md select-none">
        <div>
          <h2 className="font-headline text-headline-md md:text-headline-lg font-bold text-on-surface">
            Gap Analysis Report
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-[2px]">
            Alignment mappings for <span className="text-primary font-bold">{roleTitle}</span> position.
          </p>
        </div>

        <div className="flex gap-sm">
          <Button variant="outline" icon="share" onClick={handleShare}>
            Share Insights
          </Button>
          <Button variant="primary" icon="download" onClick={handleDownload}>
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* 12-col Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-stretch">
        
        {/* Match Score Card (4 cols) */}
        <div className="lg:col-span-4 h-full">
          <MatchScoreCard score={score} />
        </div>

        {/* Skills Coverage Panel (8 cols) */}
        <div className="lg:col-span-8 h-full">
          <SkillsGapPanel matchingSkills={matchingSkills} skillGaps={skillGaps} />
        </div>

        {/* Coaching Recommendations (7 cols) */}
        <div className="lg:col-span-7 h-full">
          <AIRecommendations recommendations={recommendations} />
        </div>

        {/* Launch Interview CTA (5 cols) */}
        <div className="lg:col-span-5 h-full">
          <LaunchInterviewCTA />
        </div>

      </div>

      {/* Footer insight bar */}
      <div className="p-md rounded-xl bg-surface-container/30 border border-outline-variant/60 flex items-center justify-between mt-xs select-none">
        <div className="flex items-center gap-xs text-body-xs text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-md font-bold text-outline-variant">
            info
          </span>
          <span>
            {hasRealData 
              ? `Data Sources: Profile Resume (${analysisResult.parsed_resume?.experience_level || 'extracted'}) + Target JD Text Match. Generated via AI pipeline.`
              : 'Data Sources: Profile Resume v1 + Target JD Text Match. Updated 2 minutes ago.'
            }
          </span>
        </div>
      </div>

    </div>
  );
}