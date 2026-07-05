import { createContext, useContext } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: ToastMessage | null;
  showToast: (message: string, duration?: number) => void;
  hideToast: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
