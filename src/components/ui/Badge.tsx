import React from 'react';
import { classNames } from '@/lib/utils';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'primary';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className }) => {
  return (
    <span className={classNames('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  );
};
