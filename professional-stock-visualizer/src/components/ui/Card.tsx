import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'elevated' | 'institutional';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-card text-card-foreground border border-border shadow-sm',
      gradient: 'card-gradient',
      elevated: 'card-elevated', 
      institutional: 'card-institutional',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg p-6 transition-all duration-200',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
export default Card;