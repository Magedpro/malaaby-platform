'use client';

import React from 'react';
import { useSession } from '@/hooks/useSession';
import { Button } from '../ui/Button';

interface TopbarProps {
  onToggleSidebar: () => void;
  unreadNotifications: number;
}

export const DashboardTopbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  unreadNotifications,
}) => {
  const { user, stadium } = useSession();

  return (
    <header className="dashboard-topbar">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSidebar}
        className="navbar-mobile-toggle"
        style={{ display: 'none', padding: '0.25rem 0.5rem', fontSize: '1.25rem' }}
      >
        ☰
      </Button>

      {/* Stadium Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {stadium?.logo && (
          <img
            src={stadium.logo}
            alt="Logo"
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
          />
        )}
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
          {stadium?.name || 'ملاعب الكابتن'}
        </h2>
      </div>

      {/* User Status / Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Notification indicator */}
        <div style={{ position: 'relative' }}>
          <span style={{ fontSize: '1.35rem', cursor: 'pointer' }} aria-label="الإشعارات">🔔</span>
          {unreadNotifications > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                fontSize: '0.625rem',
                fontWeight: 700,
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadNotifications}
            </span>
          )}
        </div>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="avatar-fallback" style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}>
            {user?.name ? user.name[0] : 'أ'}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }} className="desktop-only">
            {user?.name || 'المالك'}
          </span>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .navbar-mobile-toggle {
            display: flex !important;
          }
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
export default DashboardTopbar;
