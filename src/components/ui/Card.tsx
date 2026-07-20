import React from 'react';
import { classNames } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  glass = false,
  hoverable = true,
  children,
  ...props
}) => {
  return (
    <div
      className={classNames(
        'card',
        glass && 'card-glass',
        hoverable && 'card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
