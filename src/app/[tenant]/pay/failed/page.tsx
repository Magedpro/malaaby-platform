'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function PaymentFailedPage() {
  const { tenant } = useParams() as { tenant: string };
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    // Redirect back to the tenant page to start over
    window.location.href = `/${tenant}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        animation: 'fadeInUp 0.5s ease',
      }}>
        {/* Failed Icon */}
        <div style={{
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3.5rem',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.25)',
        }}>
          ❌
        </div>

        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 900,
          marginBottom: '0.75rem',
          color: 'var(--text-primary)',
        }}>
          لم يكتمل الدفع
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          lineHeight: 1.8,
          marginBottom: '1.75rem',
        }}>
          تعذّر إتمام عملية الدفع. يمكنك المحاولة مجدداً في أي وقت.
        </p>

        {/* Reasons Card */}
        <div style={{
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          textAlign: 'right',
        }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#dc2626', marginBottom: '0.875rem' }}>
            🤔 أسباب شائعة لفشل الدفع:
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'رصيد البطاقة غير كافٍ',
              'بيانات البطاقة غير صحيحة',
              'انتهت صلاحية جلسة الدفع',
              'مشكلة مؤقتة في الشبكة',
            ].map(reason => (
              <li key={reason} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#dc2626', flexShrink: 0 }}>•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Booking ID */}
        {bookingId && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            رقم الحجز: <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{bookingId}</code>
          </p>
        )}

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              display: 'block',
              width: '100%',
              background: 'var(--primary)',
              color: 'white',
              padding: '0.875rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '1rem',
              border: 'none',
              cursor: retrying ? 'not-allowed' : 'pointer',
              opacity: retrying ? 0.7 : 1,
              boxShadow: 'var(--shadow-primary)',
              transition: 'opacity 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {retrying ? '⏳ جاري التحويل...' : '🔄 حاول مجدداً'}
          </button>
          <a
            href={`/${tenant}/my-bookings`}
            style={{
              display: 'block',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9375rem',
              border: '1px solid var(--border-default)',
            }}
          >
            📋 تتبع حجوزاتي
          </a>
        </div>
      </div>
    </div>
  );
}
