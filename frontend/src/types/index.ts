export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface SkillChip {
  label: string;
  matched: boolean;
}

export interface SkillGap {
  name: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  title: string;
  description: string;
  accentColor: string; // Tailwind class, e.g., 'primary', 'tertiary', 'secondary', etc.
}

export interface NextStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface StarSection {
  letter: 'S' | 'T' | 'A' | 'R';
  title: string;
  subtitle: string;
  score: number;
  analysis: string;
  tip?: string;
  isCritical?: boolean;
}

export interface SessionHistoryRow {
  id: string;
  date: string;
  role: string;
  icon: string; // Material symbol icon name
  duration: string;
  score: number;
  matchLevel: string; // e.g., 'Strong Match', 'Potential Match', etc.
}

export interface NavItem {
  label: string;
  icon: string;
  path: string;
  active?: boolean;
}
