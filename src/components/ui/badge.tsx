import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'border-transparent bg-primary-600 text-white': variant === 'default',
          'border-transparent bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200': variant === 'secondary',
          'border-secondary-300 text-secondary-700 dark:border-secondary-600 dark:text-secondary-300': variant === 'outline',
          'border-transparent bg-red-600 text-white': variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
