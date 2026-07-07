import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatTranscript } from '../components/interview/ChatTranscript';
import { MessageInputBar } from '../components/interview/MessageInputBar';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { useJobCoach } from '../context/JobCoachContext';
import { tokenStore } from '../utils/tokenStore';
import type { ChatMessage } from '../types';

export function InterviewRoomPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { resumeText, jdText, loadingLatest } = useJobCoach();
  const hasTriggeredStart = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5); // default to 5, updated dynamically via SSE
  const [isLocked, setIsLocked] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  // Real-time token streaming state
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // SSE Stream parser and reader
  const handleStream = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream reader available.');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentAiMessageText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Save the last line if it's incomplete
        buffer = lines.pop() || '';

        let currentEvent = '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace('event:', '').trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            try {
              const data = JSON.parse(dataStr);
              
              if (currentEvent === 'session') {
                if (data.thread_id) {
                  setThreadId(data.thread_id);
                  localStorage.setItem('active_interview_thread_id', data.thread_id);
                }
              } else if (currentEvent === 'token') {
                setIsThinking(false);
                setIsStreaming(true);
                currentAiMessageText += data;
                setStreamingText(currentAiMessageText);
              } else if (currentEvent === 'interrupt') {
                // Finalize the streaming message into the transcript list
                if (currentAiMessageText) {
                  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const finalizedMsg: ChatMessage = {
                    id: `ai_${Date.now()}`,
                    sender: 'ai',
                    text: currentAiMessageText,
                    timestamp: timeStr,
                  };
                  setMessages((prev) => [...prev, finalizedMsg]);
                }
                
                // Reset stream state
                currentAiMessageText = '';
                setStreamingText('');
                setIsStreaming(false);

                if (data.questions_asked) {
                  setCurrentQuestion(data.questions_asked);
                }
                if (data.max_questions) {
                  setTotalQuestions(data.max_questions);
                }
                
                setIsLocked(false);
                setIsThinking(false);
              } else if (currentEvent === 'done') {
                // Finalize final streaming feedback message if any
                if (currentAiMessageText) {
                  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const finalizedMsg: ChatMessage = {
                    id: `ai_${Date.now()}`,
                    sender: 'ai',
                    text: currentAiMessageText,
                    timestamp: timeStr,
                  };
                  setMessages((prev) => [...prev, finalizedMsg]);
                }
                
                // Reset stream state
                currentAiMessageText = '';
                setStreamingText('');
                setIsStreaming(false);

                if (data.feedback_report) {
                  localStorage.setItem('latest_feedback_report', JSON.stringify(data.feedback_report));
                }
                
                setIsComplete(true);
                setIsThinking(false);
                setIsLocked(true);
              } else if (currentEvent === 'error') {
                showToast(data.error || 'AI pipeline error occurred.');
                setIsThinking(false);
                setIsLocked(false);
                setIsStreaming(false);
              }
            } catch (err) {
              console.error('Failed to parse SSE data:', dataStr, err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Stream read error:', err);
      showToast('Error reading AI stream.');
      setIsThinking(false);
      setIsLocked(false);
      setIsStreaming(false);
    }
  };

  // Launch interview endpoint on mount once profile data is ready
  useEffect(() => {
    if (loadingLatest) return;
    if (!resumeText || !jdText) return;
    if (hasTriggeredStart.current) return;
    hasTriggeredStart.current = true;

    setHasStarted(true);
    setIsThinking(true);

    const startInterviewSession = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/interview/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenStore.getToken()}`,
          },
          body: JSON.stringify({
            resume_text: resumeText,
            jd_text: jdText,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start mock interview session.');
        }

        await handleStream(response);
      } catch (err: any) {
        showToast(err.message || 'Error starting session.');
        setIsThinking(false);
      }
    };

    startInterviewSession();
  }, [loadingLatest, resumeText, jdText]);

  const handleSend = async (text: string) => {
    if (isLocked || !threadId) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLocked(true);
    setIsThinking(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/interview/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStore.getToken()}`,
        },
        body: JSON.stringify({
          thread_id: threadId,
          answer: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer.');
      }

      await handleStream(response);
    } catch (err: any) {
      showToast(err.message || 'Error submitting response.');
      setIsThinking(false);
      setIsLocked(false);
    }
  };

  const handleEndSession = () => {
    showToast('Mock session finalized!');
    navigate('/performance');
  };

  const typewriterMessage: ChatMessage | null = isStreaming
    ? {
        id: 'streaming',
        sender: 'ai',
        text: streamingText,
        timestamp: 'Just now',
      }
    : null;

  if (loadingLatest) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-on-surface-variant font-body select-none">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary">
          progress_activity
        </span>
        <p className="mt-md text-body-sm font-medium">Loading profile context...</p>
      </div>
    );
  }

  if (!resumeText || !jdText) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-on-surface-variant font-body p-lg max-w-md mx-auto text-center border border-outline-variant/60 rounded-xl bg-surface-container/20">
        <span className="material-symbols-outlined text-4xl text-rose-400">
          warning
        </span>
        <h3 className="mt-md font-headline font-bold text-headline-sm text-on-surface">
          Missing Target Profile
        </h3>
        <p className="mt-sm text-body-sm leading-relaxed text-on-surface-variant">
          Please upload your resume and submit a target job description on the dashboard before launching the interview room.
        </p>
        <Button variant="primary" className="mt-lg" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md font-body text-left w-full h-[82vh] max-h-[82vh]">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm border-b border-outline-variant/60 pb-sm select-none">
        <div className="flex items-center gap-md">
          <h2 className="font-headline text-headline-sm font-bold text-on-surface">
            Mock Interview Room
          </h2>
          <div className="flex items-center gap-xs px-sm py-[2px] bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[9px] font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>Live Session</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-md w-full sm:w-64">
          <span className="text-[10px] font-label font-bold text-on-surface-variant/80 uppercase">
            Progress {Math.min(currentQuestion, totalQuestions)}/{totalQuestions}
          </span>
          <div className="flex-1 h-[6px] bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(Math.min(currentQuestion, totalQuestions) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {showWarning && !isComplete && (
        <div className="p-sm bg-surface-container-high border border-outline-variant rounded-xl flex items-center justify-between text-body-xs text-on-surface-variant select-none">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-md font-bold select-none">
              info
            </span>
            <span>Reminder: Focus on STAR format answers (Situation, Task, Action, Result) for the highest grade.</span>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-on-surface-variant hover:text-on-surface flex items-center"
            aria-label="Dismiss banner"
          >
            <span className="material-symbols-outlined text-sm font-bold select-none">close</span>
          </button>
        </div>
      )}

      {/* Chat Transcript Area */}
      <div className="flex-1 min-h-0 bg-surface-container/20 border border-outline-variant/60 rounded-xl flex flex-col overflow-hidden">
        <ChatTranscript
          messages={messages}
          isThinking={isThinking}
          typewriterMessage={typewriterMessage}
          isTypewriterActive={isStreaming}
        />
      </div>

      {/* Bottom Message Input bar */}
      {!isComplete ? (
        <MessageInputBar
          onSend={handleSend}
          isLocked={isLocked || isStreaming}
          onToggleTips={() => setShowWarning(!showWarning)}
          showTips={showWarning}
        />
      ) : (
        <div className="p-md bg-surface-container-high/40 border border-outline-variant rounded-xl flex items-center justify-between gap-md select-none mt-sm animate-fade-in">
          <div className="text-left">
            <h4 className="text-label-md font-bold text-emerald-400">Interview Session Completed</h4>
            <p className="text-body-xs text-on-surface-variant mt-[2px]">
              AI completed evaluating your structural competence. Click below to view performance scores.
            </p>
          </div>
          <Button variant="primary" icon="analytics" onClick={handleEndSession}>
            View Performance Analytics
          </Button>
        </div>
      )}

    </div>
  );
}