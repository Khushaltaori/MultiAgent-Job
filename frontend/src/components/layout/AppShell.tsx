import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { TopNavBar } from './TopNavBar';
import { SideNavBar } from './SideNavBar';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '../../context/AuthContext';

export function AppShell() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const activePath = location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-body text-on-surface">
        <div className="flex flex-col items-center gap-md select-none">
          <svg className="animate-spin h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-label-lg font-bold">Restoring Secure Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Global Top Navbar */}
      <TopNavBar variant="app" />

      <div className="flex flex-1 pt-16">
        {/* Left sidebar nav on md+ screens */}
        <SideNavBar activePath={activePath} />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 px-margin-mobile md:px-margin-desktop py-lg pb-24 md:pb-lg overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom navbar on mobile screens */}
      <MobileBottomNav activePath={activePath} />
    </div>
  );
}
