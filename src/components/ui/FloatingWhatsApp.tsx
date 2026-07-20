'use client';

import React, { useState, useEffect } from 'react';

interface FloatingWhatsAppProps {
  phone: string;           // بدون + مثال: 201126947405
  message?: string;
  tooltip?: string;
  position?: 'bottom-right' | 'bottom-left';
  pulseColor?: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({
  phone,
  message = '',
  tooltip = 'تواصل معنا على واتساب',
  position = 'bottom-right',
  pulseColor = '#25D366',
}) => {
  const [visible, setVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const encodedMsg = encodeURIComponent(message);
  const href = `https://wa.me/${phone}${message ? `?text=${encodedMsg}` : ''}`;

  const posStyle: React.CSSProperties =
    position === 'bottom-right'
      ? { bottom: '1.5rem', right: '1.5rem' }
      : { bottom: '1.5rem', left: '1.5rem' };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
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
            right: position === 'bottom-right' ? 0 : 'auto',
            left: position === 'bottom-left' ? 0 : 'auto',
            background: '#1a1a2e',
            color: 'white',
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            border: '1px solid rgba(37,211,102,0.3)',
            direction: 'rtl',
            fontFamily: 'var(--font-arabic, Cairo, sans-serif)',
            marginBottom: '0.5rem',
          }}
        >
          💬 {tooltip}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              right: position === 'bottom-right' ? '1rem' : 'auto',
              left: position === 'bottom-left' ? '1rem' : 'auto',
              width: '12px',
              height: '6px',
              background: '#1a1a2e',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />
        </div>
      )}

      {/* Pulse ring */}
      <div
        style={{
          position: 'absolute',
          inset: '-4px',
          borderRadius: '50%',
          background: pulseColor,
          opacity: 0.25,
          animation: 'wa-pulse 2s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-8px',
          borderRadius: '50%',
          background: pulseColor,
          opacity: 0.12,
          animation: 'wa-pulse 2s ease-in-out infinite 0.5s',
        }}
      />

      {/* Button */}
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={tooltip}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: pulseColor,
          boxShadow: `0 4px 20px rgba(37,211,102,0.5)`,
          textDecoration: 'none',
          transition: 'transform 0.2s, box-shadow 0.2s',
          position: 'relative',
          zIndex: 1,
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.12)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 28px rgba(37,211,102,0.65)';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(37,211,102,0.5)';
        }}
      >
        {/* WhatsApp SVG Icon */}
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>

      <style>{`
        @keyframes wa-pulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FloatingWhatsApp;
