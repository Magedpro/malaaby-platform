'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

interface FloatingSubscriptionProps {
  position?: 'bottom-right' | 'bottom-left';
}

export const FloatingSubscription: React.FC<FloatingSubscriptionProps> = ({
  position = 'bottom-left', // Opposite of WhatsApp which is bottom-right by default
}) => {
  const router = useRouter();
  const { user, stadium } = useSession();
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const subStatus = (stadium as any)?.subscriptionStatus;

  // Only show the floating subscription button if they are in trial mode or if they are not logged in / visitors
  // Or if their subscription is expired/suspended. If active, we can still show it or hide it.
  // The user requested: "اريد اثناء التجربة وجود ايقونة الاشتراك في اي وقت" -> So during trial ("trial" mode).
  const isTrial = !user || subStatus === 'trial';

  useEffect(() => {
    if (isTrial) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isTrial, subStatus]);

  if (!visible) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (user) {
      // If logged in, go directly to the subscription dashboard page
      router.push('/dashboard/subscription');
    } else {
      // If public visitor, scroll to pricing section or go to register
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) {
        pricingEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/register');
      }
    }
  };

  const posStyle: React.CSSProperties =
    position === 'bottom-right'
      ? { bottom: '1.5rem', right: '1.5rem' }
      : { bottom: '1.5rem', left: '1.5rem' };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9998, // Just below WhatsApp button
        ...posStyle,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '110%',
            left: position === 'bottom-left' ? 0 : 'auto',
            right: position === 'bottom-right' ? 0 : 'auto',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: 'white',
            padding: '0.625rem 1rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(245,158,11,0.3)',
            animation: 'fadeInUp 0.2s ease-out forwards',
            direction: 'rtl',
          }}
        >
          💳 اشترك الآن وفعّل حسابك فوراً!
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none',
          color: 'white',
          fontSize: '1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(245,158,11,0.4)',
          position: 'relative',
          transition: 'all 0.3s ease',
          outline: 'none',
        }}
        className="floating-sub-btn"
      >
        <span style={{ transform: 'translateY(-1px)' }}>💳</span>
        
        {/* Glow / Pulse ring */}
        <span className="pulse-ring" />
      </button>

      <style jsx global>{`
        .floating-sub-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 12px 35px rgba(245,158,11,0.5);
          background: linear-gradient(135deg, #fbbf24, #d97706);
        }
        .floating-sub-btn:active {
          transform: translateY(1px) scale(0.95);
        }
        
        .pulse-ring {
          position: absolute;
          inset: -4px;
          border: 4px solid #f59e0b;
          border-radius: 50%;
          opacity: 0;
          animation: sub-pulse 2s infinite;
          pointer-events: none;
        }

        @keyframes sub-pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingSubscription;
