import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string; // Material symbol icon name
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-label font-medium rounded-xl inline-flex items-center justify-center gap-xs transition-all duration-300 active:scale-98 select-none focus:outline-none';
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-opacity-90 shadow-md hover:shadow-primary/20',
    secondary: 'bg-secondary text-on-secondary hover:bg-opacity-90',
    tertiary: 'bg-tertiary text-on-tertiary hover:bg-opacity-90 shadow-md hover:shadow-tertiary/20',
    outline: 'border border-outline text-on-surface hover:bg-surface-container-low hover:border-primary-container',
    ghost: 'text-on-surface hover:bg-surface-container hover:text-primary-fixed',
  };

  const sizes = {
    sm: 'px-sm py-[6px] text-label-sm',
    md: 'px-md py-sm text-label-md',
    lg: 'px-lg py-md text-headline-sm',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && icon && (
        <span className="material-symbols-outlined text-lg leading-none select-none font-bold">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}