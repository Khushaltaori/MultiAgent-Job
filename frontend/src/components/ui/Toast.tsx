import { useState, useEffect, useCallback, useContext, type ReactNode } from 'react';
import { ToastContext, type ToastMessage } from '../../hooks/useToast';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToast({ id, message, duration });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const [visible, setVisible] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  
  const { toast, hideToast } = useContext(ToastContext) || { toast: null, hideToast: () => {} };

  useEffect(() => {
    if (toast) {
      setActiveToast(toast);
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
        const fadeTimer = setTimeout(() => {
          hideToast();
        }, 300);
        return () => clearTimeout(fadeTimer);
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [toast, hideToast]);

  if (!activeToast) return null;

  return (
    <div
      className={`fixed bottom-lg right-lg z-50 flex items-center gap-sm px-md py-sm rounded-xl border border-outline-variant bg-surface-container-highest text-on-surface shadow-2xl transition-all duration-300 transform ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-md scale-95 pointer-events-none'
      }`}
    >
      <span className="material-symbols-outlined text-primary text-lg select-none">
        info
      </span>
      <span className="text-body-sm font-medium">{activeToast.message}</span>
    </div>
  );
}