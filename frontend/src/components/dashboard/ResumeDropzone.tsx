import React, { useState, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { useJobCoach } from '../../context/JobCoachContext';

export function ResumeDropzone() {
  const { resumeName, uploadResume, resetResume } = useJobCoach();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = isUploading ? 'processing' : (resumeName ? 'completed' : 'idle');
  const fileName = resumeName || '';

  const handleFileAction = () => {
    if (status === 'idle') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadResume(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // clear input
      }
    }
  };

  const handleReplaceFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetResume();
  };

  return (
    <GlassCard className="flex flex-col h-full justify-between gap-md border-outline-variant/60 bg-surface-container/30 hover:border-outline/40 transition-all font-body text-left p-lg">
      <div className="flex flex-col gap-sm">
        <h3 className="font-headline font-bold text-headline-sm text-on-surface">
          1. Upload Resume
        </h3>
        <p className="text-body-sm text-on-surface-variant leading-relaxed select-text">
          Provide your current resume (PDF or DOCX) to map your skills and experience levels.
        </p>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx"
          className="hidden"
        />

        {/* Action Container */}
        <div
          onClick={handleFileAction}
          className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-md text-center select-none transition-all duration-300 ${
            status === 'idle'
              ? 'border-outline-variant hover:border-primary/60 hover:bg-surface-container-low/40 cursor-pointer'
              : 'border-outline-variant bg-surface-container-lowest/30'
          }`}
        >
          {status === 'idle' && (
            <div className="flex flex-col items-center gap-xs">
              <span className="material-symbols-outlined text-4xl text-outline-variant select-none">
                cloud_upload
              </span>
              <h4 className="text-label-md font-bold text-on-surface">Drag & drop resume here</h4>
              <span className="text-body-xs text-on-surface-variant mb-xs">PDF or DOCX up to 5MB</span>
              <Button size="sm" variant="outline" className="pointer-events-none">
                Browse Files
              </Button>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center gap-sm">
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h4 className="text-label-md font-bold text-on-surface">Extracting Insights...</h4>
              <span className="text-body-xs text-on-surface-variant">AI parser is reading file details</span>
            </div>
          )}

          {status === 'completed' && (
            <div className="flex flex-col items-center gap-xs">
              <span className="material-symbols-outlined text-4xl text-emerald-500 select-none">
                check_circle
              </span>
              <h4 className="text-label-md font-bold text-on-surface truncate max-w-[200px]">{fileName}</h4>
              <span className="text-body-xs text-emerald-400 font-medium">Successfully Analyzed</span>
              <Button size="sm" variant="ghost" className="mt-xs text-rose-400 hover:text-rose-350" onClick={handleReplaceFile}>
                Replace File
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pro Tip info card */}
      <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant flex gap-sm items-start select-none">
        <span className="material-symbols-outlined text-primary text-xl leading-none">
          lightbulb
        </span>
        <div className="text-left">
          <h4 className="text-label-sm font-bold text-on-surface">Pro Tip</h4>
          <p className="text-body-xs text-on-surface-variant leading-relaxed mt-[2px]">
            Make sure your resume lists technical projects and metrics. AI evaluates your structural coding depth.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}