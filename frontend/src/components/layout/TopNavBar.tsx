import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface TopNavBarProps {
  variant?: 'landing' | 'app';
  onGetStarted?: () => void;
}

export function TopNavBar({ variant = 'app', onGetStarted }: TopNavBarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-surface-container-high border-b border-outline-variant flex items-center justify-between px-md md:px-lg font-body">
      {/* Logo Block */}
      <div className="flex items-center gap-xs">
        <Link to="/" className="flex items-center gap-sm group">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-on-primary text-xl select-none font-bold">
              filter_center_focus
            </span>
          </div>
          <span className="font-headline font-bold text-headline-sm tracking-tight text-on-surface">
            CareerLens <span className="text-primary">AI</span>
          </span>
        </Link>
      </div>

      {/* Navigation & Action Blocks */}
      {variant === 'landing' ? (
        <>
          {/* Landing page nav links */}
          <nav className="hidden md:flex items-center gap-lg text-body-sm font-medium text-on-surface-variant">
            <a href="#hero" className="hover:text-on-surface transition-colors">Home</a>
            <a href="#features" className="hover:text-on-surface transition-colors">Features</a>
            <a href="#benefits" className="hover:text-on-surface transition-colors">Assessment</a>
          </nav>

          <div className="flex items-center gap-md">
            {/* API connection status pill */}
            <div className="flex items-center gap-xs px-sm py-[4px] bg-surface-container rounded-full border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider">
                API Connected
              </span>
            </div>
            {user ? (
              <Button size="sm" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            ) : (
              <Button size="sm" onClick={onGetStarted}>
                Get Started
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-md select-none">
          <Button variant="outline" size="sm" icon="bolt" className="hidden sm:inline-flex text-tertiary border-tertiary/20 bg-tertiary/5 hover:bg-tertiary/10">
            Upgrade
          </Button>

          <button className="text-on-surface-variant hover:text-on-surface p-xs rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center" aria-label="Notifications">
            <span className="material-symbols-outlined text-xl leading-none">notifications</span>
          </button>

          <button className="text-on-surface-variant hover:text-on-surface p-xs rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center" aria-label="Help">
            <span className="material-symbols-outlined text-xl leading-none">help</span>
          </button>

          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
          </div>

          <button 
            className="text-on-surface-variant hover:text-rose-400 p-xs rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center" 
            aria-label="Sign Out" 
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined text-xl leading-none">logout</span>
          </button>
        </div>
      )}
    </header>
  );
}