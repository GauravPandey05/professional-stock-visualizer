import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  size = 'md',
  disabled = false,
  onClick,
  ...props 
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-red-500 text-white dark:bg-red-600',
    outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm', 
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all duration-200',
        variants[variant],
        sizes[size],
        onClick && !disabled && 'cursor-pointer hover:opacity-80',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={disabled ? undefined : onClick}
      {...props}
    />
  );
};

export default Badge;