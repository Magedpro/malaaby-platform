'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';

interface BookingInfo {
  customerName: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: string;
}

function formatTimeDisplay(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'م' : 'ص';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function PaymentSuccessPage() {
  const { tenant } = useParams() as { tenant: string };
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    // Poll for booking confirmation (webhook may take a moment)
    let attempts = 0;
    const maxAttempts = 8;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/bookings/${bookingId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setBooking(json.data);
          if (json.data.status === 'confirmed' || ++attempts >= maxAttempts) {
            clearInterval(interval);
            setLoading(false);
          }
        } else {
          if (++attempts >= maxAttempts) { clearInterval(interval); setLoading(false); }
        }
      } catch {
        if (++attempts >= maxAttempts) { clearInterval(interval); setLoading(false); }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [bookingId]);

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
        {/* Success Icon */}
        <div style={{
          width: '100px', height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3.5rem',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 40px rgba(34, 197, 94, 0.35)',
          animation: 'float 3s ease-in-out infinite',
        }}>
          ✅
        </div>

        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 900,
          marginBottom: '0.75rem',
          color: 'var(--text-primary)',
        }}>
          تم الدفع بنجاح! 🎉
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          lineHeight: 1.8,
          marginBottom: '1.75rem',
        }}>
          تم استلام دفعتك وتأكيد حجزك تلقائياً. أراك في الملعب! ⚽
        </p>

        {/* Booking Summary */}
        {booking && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))',
            border: '1.5px solid rgba(34,197,94,0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'right',
          }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-light)', marginBottom: '1rem' }}>
              📋 تفاصيل الحجز
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.9rem' }}>
              {[
                { label: 'الاسم', value: booking.customerName, icon: '👤' },
                { label: 'التاريخ', value: booking.date, icon: '📅' },
                { label: 'الوقت', value: `${formatTimeDisplay(booking.startTime)} — ${formatTimeDisplay(booking.endTime)}`, icon: '🕐' },
                { label: 'المبلغ المدفوع', value: `${booking.amount} ج.م.`, icon: '💰' },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(34,197,94,0.15)',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{icon} {label}</span>
                  <span style={{ fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(34,197,94,0.15)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#16a34a',
              fontWeight: 700,
            }}>
              ✅ الحالة: مؤكد
            </div>
          </div>
        )}

        {loading && !booking && (
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
            جاري تأكيد حجزك... لحظة من فضلك
          </div>
        )}

        {/* Booking ID */}
        {bookingId && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            رقم الحجز: <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{bookingId}</code>
          </p>
        )}

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a
            href={`/${tenant}/my-bookings`}
            style={{
              display: 'block',
              background: 'var(--primary)',
              color: 'white',
              padding: '0.875rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              fontSize: '1rem',
              boxShadow: 'var(--shadow-primary)',
              transition: 'opacity 0.2s',
            }}
          >
            📋 تتبع حجوزاتي
          </a>
          <a
            href={`/${tenant}`}
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
              transition: 'all 0.2s',
            }}
          >
            🔙 العودة للملعب
          </a>
        </div>
      </div>
    </div>
  );
}
