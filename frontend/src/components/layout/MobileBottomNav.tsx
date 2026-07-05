import { Link } from 'react-router-dom';
import type { NavItem } from '../../types';

interface MobileBottomNavProps {
  activePath: string;
}

export function MobileBottomNav({ activePath }: MobileBottomNavProps) {
  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Analysis', icon: 'analytics', path: '/analysis' },
    { label: 'Interview', icon: 'forum', path: '/interview' },
    { label: 'Analytics', icon: 'monitoring', path: '/performance' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-container-high border-t border-outline-variant flex justify-around items-center md:hidden z-40 font-body px-xs select-none">
      {navItems.map((item) => {
        const isActive = activePath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-20 h-full transition-colors duration-300 relative ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            {/* Active Indicator Bar */}
            {isActive && (
              <span className="absolute top-0 left-1/4 right-1/4 h-[3px] bg-primary rounded-b-full shadow shadow-primary" />
            )}
            <span
              className="material-symbols-outlined text-xl select-none mb-[2px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[10px] tracking-tight font-medium font-label">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
