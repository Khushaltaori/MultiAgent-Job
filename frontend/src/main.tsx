import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './context/AuthContext';
import { JobCoachProvider } from './context/JobCoachContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <JobCoachProvider>
          <App />
        </JobCoachProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);


