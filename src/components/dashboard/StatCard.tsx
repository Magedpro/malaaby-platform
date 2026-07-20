import React from 'react';
import { classNames } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: 'green' | 'yellow' | 'red' | 'blue';
  trend?: string;
  trendType?: 'up' | 'down';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = 'green',
  trend,
  trendType = 'up',
}) => {
  return (
    <div className={classNames('stat-card', color)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div className={classNames('stat-icon', color)} style={{ fontSize: '1.5rem' }}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="stat-trend" style={{ color: trendType === 'up' ? 'var(--success)' : 'var(--danger)' }}>
          <span>{trendType === 'up' ? '▲' : '▼'}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
export default StatCard;
