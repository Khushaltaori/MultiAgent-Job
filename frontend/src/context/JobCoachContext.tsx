import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';

interface JobCoachContextType {
  resumeName: string | null;
  resumeText: string | null;
  resumeCharCount: number | null;
  jdText: string;
  jdCharCount: number | null;
  isAnalyzing: boolean;
  analysisResult: any | null;
  loadingLatest: boolean;
  setJdText: (text: string) => void;
  uploadResume: (file: File) => Promise<void>;
  submitJd: (text: string) => Promise<void>;
  runIntakeAnalysis: () => Promise<void>;
  resetResume: () => void;
}

const JobCoachContext = createContext<JobCoachContextType | undefined>(undefined);

export function JobCoachProvider({ children }: { children: React.ReactNode }) {
  const { user, apiCall } = useAuth();
  const { showToast } = useToast();

  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeCharCount, setResumeCharCount] = useState<number | null>(null);
  const [jdText, setJdText] = useState<string>('');
  const [jdCharCount, setJdCharCount] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loadingLatest, setLoadingLatest] = useState(false);

  // Fetch user's latest resume and JD when user changes
  useEffect(() => {
    if (!user) {
      setResumeName(null);
      setResumeText(null);
      setResumeCharCount(null);
      setJdText('');
      setJdCharCount(null);
      setAnalysisResult(null);
      return;
    }

    const fetchLatestData = async () => {
      setLoadingLatest(true);
      try {
        // Fetch latest resume
        const resumeRes = await apiCall('/api/resume/latest');
        if (resumeRes.ok) {
          const resumeData = await resumeRes.json();
          setResumeName(resumeData.filename);
          setResumeText(resumeData.resume_text);
          setResumeCharCount(resumeData.char_count);
        }

        // Fetch latest JD
        const jdRes = await apiCall('/api/jd/latest');
        if (jdRes.ok) {
          const jdData = await jdRes.json();
          setJdText(jdData.jd_text);
          setJdCharCount(jdData.char_count);
        }
      } catch (err) {
        console.error('Failed to load latest user data:', err);
      } finally {
        setLoadingLatest(false);
      }
    };

    fetchLatestData();
  }, [user]);

  const uploadResume = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiCall('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload resume.');
      }

      const data = await response.json();
      setResumeName(data.filename);
      setResumeText(data.resume_text);
      setResumeCharCount(data.char_count);
      showToast('Resume uploaded and parsed successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload resume.');
      throw err;
    }
  };

  const submitJd = async (text: string) => {
    try {
      const response = await apiCall('/api/jd/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit Job Description.');
      }

      const data = await response.json();
      setJdText(data.jd_text);
      setJdCharCount(data.char_count);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit Job Description.');
      throw err;
    }
  };

  const runIntakeAnalysis = async () => {
    if (!resumeText) {
      showToast('Please upload a resume first.');
      return;
    }
    if (!jdText) {
      showToast('Please submit a job description first.');
      return;
    }

    setIsAnalyzing(true);
    showToast('AI Gap Analysis in progress...');

    try {
      // First submit JD to save it
      await submitJd(jdText);

      // Call the run intake graph endpoint
      const response = await apiCall('/api/analysis/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jdText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'AI pipeline matching failed.');
      }

      const data = await response.json();
      setAnalysisResult(data);
      showToast('Career alignment analysis completed!');
    } catch (err: any) {
      showToast(err.message || 'Analysis failed.');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetResume = () => {
    setResumeName(null);
    setResumeText(null);
    setResumeCharCount(null);
  };

  return (
    <JobCoachContext.Provider
      value={{
        resumeName,
        resumeText,
        resumeCharCount,
        jdText,
        jdCharCount,
        isAnalyzing,
        analysisResult,
        loadingLatest,
        setJdText,
        uploadResume,
        submitJd,
        runIntakeAnalysis,
        resetResume,
      }}
    >
      {children}
    </JobCoachContext.Provider>
  );
}

export function useJobCoach() {
  const context = useContext(JobCoachContext);
  if (context === undefined) {
    throw new Error('useJobCoach must be used within a JobCoachProvider');
  }
  return context;
}
