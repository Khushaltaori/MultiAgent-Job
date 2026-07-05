import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { GapAnalysisPage } from './pages/GapAnalysisPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { PerformanceAnalyticsPage } from './pages/PerformanceAnalyticsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Authenticated Layout Wrapper */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analysis" element={<GapAnalysisPage />} />
          <Route path="/interview" element={<InterviewRoomPage />} />
          <Route path="/performance" element={<PerformanceAnalyticsPage />} />
        </Route>

        {/* Fallback to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
