import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { NavItem } from '../../types';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';

interface SideNavBarProps {
  activePath: string;
}

export function SideNavBar({ activePath }: SideNavBarProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Gap Analysis', icon: 'analytics', path: '/analysis' },
    { label: 'Interview Room', icon: 'forum', path: '/interview' },
    { label: 'Performance', icon: 'monitoring', path: '/performance' },
  ];

  const handleLogout = async (e: MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-low border-r border-outline-variant flex flex-col justify-between hidden md:flex font-body z-30">
      {/* Navigation List */}
      <div className="p-md flex flex-col gap-sm">
        {/* Pro Coach branding block */}
        <div className="px-sm py-xs bg-surface-container rounded-xl border border-outline-variant flex items-center gap-sm">
          <div className="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-lg leading-none select-none font-bold">
              stars
            </span>
          </div>
          <div className="text-left">
            <h4 className="text-label-md font-bold text-on-surface">Pro Coach Mode</h4>
            <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest font-semibold">
              Premium Enabled
            </span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-xs text-left">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-md px-md py-sm rounded-xl text-body-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg leading-none select-none">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout Actions */}
      <div className="p-md border-t border-outline-variant flex flex-col gap-md">
        <Button
          variant="primary"
          icon="calendar_month"
          size="sm"
          onClick={() => showToast('Opening scheduling calendar widget...')}
          className="w-full justify-center"
        >
          Schedule Session
        </Button>

        <a
          href="#"
          onClick={handleLogout}
          className="flex items-center justify-center gap-xs text-label-sm font-semibold text-on-surface-variant hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-md select-none">
            logout
          </span>
          Log Out
        </a>
      </div>
    </aside>
  );
}