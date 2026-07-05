import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { useJobCoach } from '../../context/JobCoachContext';

export function JobDescriptionPanel() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { jdText, setJdText, isAnalyzing, runIntakeAnalysis, resumeName } = useJobCoach();
  const [shouldShake, setShouldShake] = useState(false);

  const wordCount = jdText.trim() ? jdText.trim().split(/\s+/).length : 0;
  const isWordCountHigh = wordCount >= 100;

  const handleAnalyze = async () => {
    if (!resumeName) {
      showToast('Please upload a resume first before running analysis.');
      return;
    }

    if (!jdText.trim()) {
      setShouldShake(true);
      showToast('Please paste a job description first.');
      setTimeout(() => setShouldShake(false), 500); // match animation duration
      return;
    }

    if (jdText.trim().length < 50) {
      setShouldShake(true);
      showToast('Job description must be at least 50 characters.');
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    try {
      await runIntakeAnalysis();
      navigate('/analysis');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <GlassCard
      className={`flex flex-col h-full justify-between gap-md border-outline-variant/60 bg-surface-container/30 hover:border-outline/40 transition-all font-body text-left p-lg ${
        shouldShake ? 'animate-pulse border-error' : ''
      }`}
    >
      <div className="flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-headline-sm text-on-surface">
            2. Target Job Description
          </h3>
          {/* Word count badge */}
          <div
            className={`px-sm py-[2px] rounded-full border transition-all duration-300 text-[10px] font-label font-semibold ${
              isWordCountHigh
                ? 'bg-primary-container/20 border-primary text-primary font-bold shadow shadow-primary/10'
                : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
            }`}
          >
            {wordCount} words
          </div>
        </div>
        <p className="text-body-sm text-on-surface-variant leading-relaxed select-text">
          Paste the official job description or role requirements below to run compatibility matching.
        </p>

        {/* Text Area */}
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste requirements details here..."
          className="w-full h-48 px-md py-sm rounded-xl border border-outline bg-surface-container-low focus:border-primary focus:outline-none text-body-sm transition-colors text-on-surface resize-none placeholder:text-on-surface-variant/40"
        />
      </div>

      {/* Footer / CTA Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm border-t border-outline-variant/30 pt-md">
        <span className="text-[11px] text-on-surface-variant leading-tight max-w-xs select-none">
          Paste at least 100 words for the most precise contextual mapping.
        </span>
        <Button variant="primary" icon="analytics" isLoading={isAnalyzing} onClick={handleAnalyze} className="sm:w-auto">
          Analyze Career Alignment
        </Button>
      </div>
    </GlassCard>
  );
}