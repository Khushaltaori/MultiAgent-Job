import { useState, useEffect } from 'react';
import { CoreCompetenciesCard } from '../components/performance/CoreCompetenciesCard';
import { NextStepsChecklist } from '../components/performance/NextStepsChecklist';
import { StarAccordion } from '../components/performance/StarAccordion';
import { SessionHistoryTable } from '../components/performance/SessionHistoryTable';
import { useToast } from '../hooks/useToast';
import type { NextStep, StarSection, SessionHistoryRow } from '../types';

export function PerformanceAnalyticsPage() {
  const { showToast } = useToast();

  // 1. Load feedback report from localStorage if it exists
  const [report, setReport] = useState<any | null>(null);

  useEffect(() => {
    const cachedReport = localStorage.getItem('latest_feedback_report');
    if (cachedReport) {
      try {
        setReport(JSON.parse(cachedReport));
      } catch (err) {
        console.error('Failed to parse cached feedback report:', err);
      }
    }
  }, []);

  // 2. Checklist State (dynamically mapped from report.action_items, report.areas_for_improvement, or defaults)
  const [steps, setSteps] = useState<NextStep[]>([]);

  useEffect(() => {
    // Check both action_items and areas_for_improvement
    const items = report?.action_items || report?.areas_for_improvement;

    if (items && Array.isArray(items) && items.length > 0) {
      const dynamicSteps = items.map((item: string, idx: number) => ({
        id: String(idx + 1),
        title: item || 'Review technical topic',
        description: 'Focus on this dynamic follow-up goal to close gaps.',
        completed: false,
      }));
      setSteps(dynamicSteps);
    } else {
      // Fallback default checklist of relevant foundational recovery items
      setSteps([
        {
          id: '1',
          title: 'Deepen understanding of asynchronous API design and performance profiling.',
          description: 'Study async/await mechanisms, task queue management, and latency metrics.',
          completed: false,
        },
        {
          id: '2',
          title: 'Review fundamental SQL query optimizations and indexing strategies.',
          description: 'Focus on query execution plans, indexes, joins, and database structure.',
          completed: false,
        },
        {
          id: '3',
          title: 'Formulate structured responses using the STAR format (Situation, Task, Action, Result).',
          description: 'Practice articulating past engineering projects quantitatively.',
          completed: false,
        },
      ]);
    }
  }, [report]);

  const handleToggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, completed: !step.completed } : step))
    );
    showToast('Checklist updated');
  };

  const handleScheduleFollowup = () => {
    showToast('Opening scheduling calendar widget...');
  };

  // 3. STAR Accordion Open Section State (First S open by default)
  const [openSectionId, setOpenSectionId] = useState<string | null>('S');

  // 4. Safely read overall score with fallback to 0 if undefined
  const overallScore = report?.overall_score ?? 0;

  // 5. Map report per_question_feedback dynamically to S, T, A, R sections with safety fallbacks
  const starSections: StarSection[] = report ? [
    {
      letter: 'S',
      title: 'Question 1: Ingestion & Parsing',
      subtitle: 'First Probe Analysis',
      score: Math.min(100, Math.max(0, (report.overall_score ?? 0) + 5)),
      analysis: report.per_question_feedback?.[0] || 'Provide candidate profile context clearly to show system design depth.',
      tip: 'Remember to explain the situation quantitatively: e.g. "reduced system latency by 20%".',
    },
    {
      letter: 'T',
      title: 'Question 2: Architectural Gaps',
      subtitle: 'Second Probe Analysis',
      score: Math.min(100, Math.max(0, (report.overall_score ?? 0) - 8)),
      analysis: report.per_question_feedback?.[1] || 'Address missing skillset gaps directly and describe theoretical alternatives.',
      tip: 'Do not stay silent when missing knowledge; describe a pivot approach immediately.',
    },
    {
      letter: 'A',
      title: 'Question 3: Live Engineering Scenario',
      subtitle: 'Third Probe Analysis',
      score: Math.min(100, Math.max(0, (report.overall_score ?? 0) + 2)),
      analysis: report.per_question_feedback?.[2] || 'Elaborate on specific action points using frameworks, packages, and custom protocols.',
      tip: 'Name-drop exact tools, classes (e.g. AsyncRedisSaver, tenacity) to verify depth.',
    },
    {
      letter: 'R',
      title: 'Final Summary: Recommendation',
      subtitle: 'Evaluation Matrix',
      score: report.overall_score ?? 0,
      analysis: report.final_recommendation || 'Practice technical design depth under time pressure.',
      tip: 'Compare your outcome and trade-offs. Explaining the cost vs benefit is a lead-level skill.',
      isCritical: true,
    },
  ] : [
    // Default fallback STAR items when no mock session report has run yet
    {
      letter: 'S',
      title: 'Situation: API Scaling Bottleneck',
      subtitle: 'Context Definition',
      score: 0,
      analysis: `Please start and complete a mock session to inspect real-time Situation scoring metrics.`,
      tip: 'Specify the exact transaction volume (e.g. 50 requests/sec) to make the scope feel highly concrete.',
    },
    {
      letter: 'T',
      title: 'Task: High-Concurrency Resilience',
      subtitle: 'Objective Mapping',
      score: 0,
      analysis: 'The target mock objectives will be parsed to evaluate how you map engineering priorities.',
      tip: "Explicitly demarcate your role vs the team's contribution. Focus on what YOU were responsible for executing.",
    },
    {
      letter: 'A',
      title: 'Action: AsyncRedisSaver & Retries',
      subtitle: 'Execution Detail',
      score: 0,
      analysis: 'Your specific framework actions and code answers will populate the execution analysis detail.',
      tip: 'Highlight the specific library packages (e.g., langgraph-checkpoint-redis) and configuration parameters you selected.',
    },
    {
      letter: 'R',
      title: 'Result: Zero Request Dropping',
      subtitle: 'Impact Evaluation',
      score: 0,
      analysis: 'AI will compare the outcomes, trade-offs, and scaling bottlenecks in your final response.',
      tip: 'Express the latency increase in milliseconds. Providing exact trade-offs makes your answer highly credible.',
      isCritical: true,
    },
  ];

  const mockHistory: SessionHistoryRow[] = [
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

  const handleRehydrate = (id: string) => {
    // collapse all sections except first (S)
    setOpenSectionId('S');
    const selected = mockHistory.find((h) => h.id === id);
    showToast(selected ? `Session Rehydrated: ${selected.role}` : 'Session Rehydrated');
  };

  return (
    <div className="flex flex-col gap-lg font-body text-left w-full select-text">
      
      {/* Header Row */}
      <div className="border-b border-outline-variant/60 pb-md select-none">
        <h2 className="font-headline text-headline-md md:text-headline-lg font-bold text-on-surface">
          Performance Analytics
        </h2>
        <p className="text-body-sm text-on-surface-variant mt-[2px]">
          Granular feedback reviews and score histories generated by Gemini Coaching.
        </p>
      </div>

      {/* Grid: Core Competencies (8 cols) + Next Steps (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-stretch">
        <div className="lg:col-span-8 h-full">
          <CoreCompetenciesCard overallScore={overallScore} />
        </div>
        <div className="lg:col-span-4 h-full">
          <NextStepsChecklist
            steps={steps}
            onToggleStep={handleToggleStep}
            onSchedule={handleScheduleFollowup}
          />
        </div>
      </div>

      {/* STAR Accordion (12 cols) */}
      <div className="w-full mt-xs">
        <StarAccordion
          sections={starSections}
          openSectionId={openSectionId}
          setOpenSectionId={setOpenSectionId}
        />
      </div>

      {/* Session History Table (12 cols) */}
      <div className="w-full mt-xs">
        <SessionHistoryTable
          history={mockHistory}
          onRehydrate={handleRehydrate}
        />
      </div>

    </div>
  );
}