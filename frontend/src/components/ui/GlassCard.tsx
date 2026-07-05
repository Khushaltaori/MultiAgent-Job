import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className = '', ...props }: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-xl p-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
