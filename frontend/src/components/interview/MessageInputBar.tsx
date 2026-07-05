import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface MessageInputBarProps {
  onSend: (text: string) => void;
  isLocked: boolean;
  onToggleTips: () => void;
  showTips: boolean;
}

export function MessageInputBar({
  onSend,
  isLocked,
  onToggleTips,
  showTips,
}: MessageInputBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLocked) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-sm border-t border-outline-variant/60 pt-md bg-surface-container-low/10 select-none">
      
      {/* Input row wrapper */}
      <form onSubmit={handleSubmit} className="relative w-full flex gap-sm items-center">
        {/* Controlled text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLocked}
          placeholder={isLocked ? 'Interviewer is speaking...' : 'Type your answer here...'}
          className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-md py-[10px] text-body-sm text-on-surface placeholder:text-outline-variant focus:border-primary focus:outline-none transition-all disabled:opacity-50"
        />
        
        <Button
          type="submit"
          variant="primary"
          icon="send"
          disabled={!value.trim() || isLocked}
          className="rounded-xl flex-shrink-0"
        >
          Send
        </Button>

        {/* Lock Overlay when Interviewer is speaking */}
        {isLocked && (
          <div className="absolute inset-0 bg-surface-container-low/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center gap-xs text-body-sm font-semibold text-primary select-none pointer-events-none">
            <span className="material-symbols-outlined text-md font-bold select-none">lock</span>
            <span>Interviewer is speaking...</span>
          </div>
        )}
      </form>

      {/* Footer bar with Tips and Equalizer */}
      <div className="flex justify-between items-center px-xs py-[4px]">
        <button
          type="button"
          onClick={onToggleTips}
          className={`flex items-center gap-[2px] text-body-xs font-bold font-label transition-colors ${
            showTips ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-md leading-none select-none">lightbulb</span>
          <span>{showTips ? 'Hide Tips' : 'Show Tips'}</span>
        </button>

        {/* Equalizer animation */}
        {!isLocked && (
          <div className="flex gap-[3px] items-end h-[14px]">
            <div className="w-[3px] h-[10px] bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-[3px] h-[14px] bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            <div className="w-[3px] h-[8px] bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-[3px] h-[12px] bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

    </div>
  );
}