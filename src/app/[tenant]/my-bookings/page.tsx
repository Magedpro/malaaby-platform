'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface BookingRecord {
  id: string;
  fieldName: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  createdAt: string;
  paymentScreenshot?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'قيد المراجعة',
    icon: '⏳',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    desc: 'طلبك وصل وسيتم مراجعته من قِبل صاحب الملعب قريباً.',
  },
  confirmed: {
    label: 'مؤكد ✅',
    icon: '🎉',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.3)',
    desc: 'تم تأكيد حجزك! استمتع بوقتك في الملعب.',
  },
  rejected: {
    label: 'مرفوض',
    icon: '❌',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    desc: 'تم رفض طلب الحجز.',
  },
  cancelled: {
    label: 'ملغي',
    icon: '🚫',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    border: 'rgba(107,114,128,0.3)',
    desc: 'تم إلغاء هذا الحجز.',
  },
};

export default function MyBookingsPage() {
  const { tenant } = useParams() as { tenant: string };

  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const clean = phone.replace(/\s/g, '');
    if (!/^01[0-2,5]\d{8}$/.test(clean)) {
      setError('رقم الهاتف غير صحيح. يجب أن يكون رقماً مصرياً مثل 01012345678');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch(`/api/v1/bookings/track?phone=${clean}&stadiumSlug=${tenant}`);
      const json = await res.json();
      if (json.success) {
        setBookings(json.data);
        setSearched(true);
      } else {
        setError(json.error || 'حدث خطأ أثناء البحث');
      }
    } catch {
      setError('تعذر الاتصال بالخادم، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', direction: 'rtl' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(8,14,20,0.0) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '3rem 1.25rem 2.5rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🏟️</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, marginBottom: '0.5rem' }}>
          تتبع حجوزاتك
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '420px', margin: '0 auto' }}>
          أدخل رقم هاتفك لعرض جميع حجوزاتك ومتابعة حالتها
        </p>
      </div>

      {/* ═══ SEARCH BOX ═══ */}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}>
          <label style={{
            display: 'block',
            fontWeight: 700,
            marginBottom: '0.625rem',
            fontSize: '0.9375rem',
          }}>
            📱 رقم الهاتف
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="tel"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                background: 'var(--bg-elevated)',
                border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                color: 'var(--text-primary)',
                fontSize: '1.0625rem',
                fontFamily: 'var(--font-arabic)',
                direction: 'ltr',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-default)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !phone.trim()}
              style={{
                background: loading || !phone.trim() ? 'var(--bg-elevated)' : 'var(--primary)',
                color: loading || !phone.trim() ? 'var(--text-muted)' : 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1.5rem',
                fontWeight: 800,
                fontSize: '0.9375rem',
                cursor: loading || !phone.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-arabic)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  جاري البحث...
                </>
              ) : '🔍 بحث'}
            </button>
          </div>

          {error && (
            <p style={{
              color: 'var(--danger)',
              fontSize: '0.875rem',
              marginTop: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}>
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* ═══ RESULTS ═══ */}
        {searched && (
          <div style={{ marginTop: '2rem' }}>

            {bookings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🤷</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>لا توجد حجوزات</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  لم نجد أي حجوزات مرتبطة بالرقم <strong style={{ color: 'var(--text-primary)', direction: 'ltr', display: 'inline-block' }}>{phone}</strong>
                </p>
                <a
                  href={`/${tenant}`}
                  style={{
                    display: 'inline-block',
                    marginTop: '1.25rem',
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '0.625rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                  }}
                >
                  احجز الآن ⚽
                </a>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}>
                  {[
                    { label: 'إجمالي الحجوزات', value: bookings.length, color: 'var(--text-primary)', icon: '📋' },
                    { label: 'مؤكدة', value: confirmedCount, color: '#22c55e', icon: '✅' },
                    { label: 'قيد المراجعة', value: pendingCount, color: '#f59e0b', icon: '⏳' },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{icon}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{value}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Bookings list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bookings.map((booking) => {
                    const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                    const isPast = booking.date < new Date().toISOString().split('T')[0];
                    return (
                      <div
                        key={booking.id}
                        style={{
                          background: 'var(--bg-card)',
                          border: `1px solid ${cfg.border}`,
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: isPast && booking.status !== 'confirmed' ? 0.7 : 1,
                        }}
                      >
                        {/* Colored left bar */}
                        <div style={{
                          position: 'absolute',
                          right: 0, top: 0, bottom: 0,
                          width: '4px',
                          background: cfg.color,
                          borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
                        }} />

                        {/* Status badge */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '1rem',
                          paddingRight: '0.5rem',
                        }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>
                              {booking.fieldName}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              #{booking.id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: '999px',
                            padding: '0.3rem 0.875rem',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            color: cfg.color,
                            whiteSpace: 'nowrap',
                          }}>
                            <span>{cfg.icon}</span>
                            {cfg.label}
                          </div>
                        </div>

                        {/* Details grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          paddingRight: '0.5rem',
                        }}>
                          {[
                            { icon: '📅', label: 'التاريخ', value: formatDate(booking.date) },
                            { icon: '🕐', label: 'الوقت', value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}` },
                            { icon: '💰', label: 'المبلغ', value: formatCurrency(booking.amount) },
                            { icon: '📆', label: 'تاريخ الطلب', value: formatDate(booking.createdAt.split('T')[0]) },
                          ].map(({ icon, label, value }) => (
                            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{icon} {label}</span>
                              <span style={{ fontWeight: 700 }}>{value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Status description */}
                        <div style={{
                          marginTop: '1rem',
                          paddingRight: '0.5rem',
                          paddingTop: '0.875rem',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: '0.8125rem',
                          color: cfg.color,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.375rem',
                          lineHeight: 1.6,
                        }}>
                          <span style={{ flexShrink: 0 }}>{cfg.icon}</span>
                          <span>
                            {cfg.desc}
                            {booking.status === 'rejected' && booking.rejectionReason && (
                              <> <strong>السبب: {booking.rejectionReason}</strong></>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Back button */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <a
                    href={`/${tenant}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      padding: '0.625rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--primary)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--primary-light)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-default)';
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
                    }}
                  >
                    ⚽ احجز موعداً جديداً
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
