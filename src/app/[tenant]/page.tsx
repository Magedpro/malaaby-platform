'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

interface Field {
  id: string; name: string; description: string;
  pricePerHour: number; bookingDuration: number;
  coverImage?: string; openingTime: string; closingTime: string; status: string;
}
interface Stadium {
  name: string; description: string; phone: string; whatsapp: string;
  city: string; address: string; logo?: string; coverImage?: string;
  vodafoneCash: string; instaPay: string; paymentInstructions: string;
}
interface TimeSlot {
  startTime: string; endTime: string;
  status: 'available' | 'pending' | 'booked' | 'closed';
  amount?: number;
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DAYS_AR_FULL = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
// Calendar week starts on Saturday (index 6) → Sunday(0)..Friday(5)..Saturday(6)
// We display: السبت الأحد الاثنين الثلاثاء الأربعاء الخميس الجمعة
const CAL_DAYS_ORDER = [6, 0, 1, 2, 3, 4, 5]; // Saturday first
const DAYS_HEADER = ['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];

export default function PublicBookingPage() {
  const { tenant } = useParams() as { tenant: string };
  const { showToast } = useToast();

  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Booking flow state
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Customer form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Calendar state
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // Load stadium data
  useEffect(() => {
    fetch(`/api/v1/stadiums/${tenant}`)
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data) {
          setStadium(j.data.stadium);
          setFields(j.data.fields);
          if (j.data.fields.length > 0) setSelectedField(j.data.fields[0]);
        } else { setNotFound(true); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false));
  }, [tenant]);

  const loadSlots = useCallback(async () => {
    if (!selectedField || !selectedDate) { setSlots([]); return; }
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/v1/slots?fieldId=${selectedField.id}&date=${selectedDate}`);
      const json = await res.json();
      if (json.success) setSlots(json.data);
      else setSlots([]);
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  }, [selectedField, selectedDate]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت', 'error'); return; }
    setPaymentFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPaymentPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitBooking = async () => {
    if (!customerName.trim()) { showToast('الاسم مطلوب', 'error'); return; }
    if (!customerPhone.trim() || !/^01[0-2,5]\d{8}$/.test(customerPhone.replace(/\s/g, ''))) {
      showToast('يرجى إدخال رقم الهاتف الصحيح الذي قمت بالتحويل منه (01xxxxxxxxx)', 'error'); return;
    }
    if (!paymentFile) {
      showToast('يرجى رفع صورة إيصال التحويل لتتمكن من تقديم طلب الحجز 📸', 'error'); return;
    }
    if (!selectedSlot || !selectedField || !selectedDate) { showToast('يرجى اختيار موعد أولاً', 'error'); return; }
    setSubmitting(true);
    try {
      let paymentScreenshot = '';
      const fd = new FormData();
      fd.append('file', paymentFile);
      const upRes = await fetch('/api/v1/upload', { method: 'POST', body: fd });
      const upJson = await upRes.json();
      if (upJson.success) {
        paymentScreenshot = upJson.url;
      } else {
        showToast('فشل رفع صورة إيصال التحويل، يرجى المحاولة مجدداً', 'error');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: selectedField.id,
          stadiumSlug: tenant,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          notes: notes.trim(),
          paymentScreenshot,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBookingSuccess(true);
        setBookingOpen(false);
        showToast('تم إرسال طلب حجزك بنجاح! ⚽', 'success');
        setCustomerName(''); setCustomerPhone(''); setNotes('');
        setPaymentFile(null); setPaymentPreview('');
        loadSlots();
      } else {
        showToast(json.error || 'فشل إرسال طلب الحجز', 'error');
      }
    } catch { showToast('خطأ في الاتصال بالخادم', 'error'); }
    finally { setSubmitting(false); }
  };

  // Calendar — week starts Saturday
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  // firstDay.getDay(): 0=Sun,1=Mon,...,6=Sat  → we need offset in our Saturday-first grid
  const firstDayOfWeek = firstDay.getDay(); // 0-6
  // position in Saturday-first grid: Sat=0,Sun=1,Mon=2,...,Fri=6
  const satFirstPos = (firstDayOfWeek + 1) % 7;
  const calCells: (number | null)[] = [];
  for (let i = 0; i < satFirstPos; i++) calCells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) calCells.push(d);

  const dateStr = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDayName = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    return DAYS_AR_FULL[d.getDay()];
  };

  const availableCount = slots.filter(s => s.status === 'available').length;

  // --- Not found / loading ---
  if (pageLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 2s ease-in-out infinite' }}>⚽</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>جاري تحميل صفحة الملعب...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="empty-state">
        <span className="empty-icon">🏟️</span>
        <div className="empty-title">الملعب غير موجود</div>
        <div className="empty-desc">الرابط الذي وصلت إليه غير صحيح أو تم إيقاف الملعب مؤقتاً.</div>
        <Button variant="primary" onClick={() => window.location.href = '/'} style={{ marginTop: '1rem' }}>العودة للرئيسية</Button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ═══ HERO BANNER ═══ */}
      <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
        <img
          src={stadium?.coverImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1400&h=400&fit=crop'}
          alt={stadium?.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(8,14,20,0.35) 0%, rgba(8,14,20,0.92) 100%)' }} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0, left: 0,
          padding: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1.25rem'
        }}>
          {stadium?.logo && (
            <img src={stadium.logo} alt="Logo" style={{
              width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover',
              border: '3px solid var(--primary)', flexShrink: 0, boxShadow: '0 0 20px rgba(34,197,94,0.3)'
            }} />
          )}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, marginBottom: '0.375rem', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {stadium?.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📍 {stadium?.city}{stadium?.address ? ` — ${stadium.address}` : ''}
            </p>
          </div>
          {/* Quick contact badge */}
          {stadium?.phone && (
            <a href={`tel:${stadium.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2rem',
              padding: '0.5rem 1.125rem', color: 'white', fontSize: '0.875rem',
              fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}>
              📞 {stadium.phone}
            </a>
          )}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div className="booking-layout">

          {/* ════ LEFT COLUMN ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

            {/* ── Step 1: Field Picker ── */}
            <div className="booking-card">
              <div className="booking-card-header">
                <span className="step-badge">١</span>
                <h2>اختر الملعب</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {fields.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedField(f); setSelectedSlot(null); setSlots([]); }}
                    className={`field-card ${selectedField?.id === f.id ? 'field-card-active' : ''}`}
                  >
                    {f.coverImage && (
                      <img src={f.coverImage} alt={f.name} style={{
                        width: '64px', height: '64px', borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover', flexShrink: 0
                      }} />
                    )}
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{f.name}</div>
                      {f.description && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>{f.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span className="field-badge field-badge-price">💰 {formatCurrency(f.pricePerHour)}/ساعة</span>
                        <span className="field-badge field-badge-time">⏱ {f.bookingDuration} دقيقة</span>
                        <span className="field-badge field-badge-hours">🕐 {f.openingTime} – {f.closingTime}</span>
                      </div>
                    </div>
                    {selectedField?.id === f.id && (
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem', fontWeight: 700, flexShrink: 0
                      }}>✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Step 2: Calendar ── */}
            <div className="booking-card">
              <div className="booking-card-header">
                <span className="step-badge">٢</span>
                <h2>اختر التاريخ</h2>
              </div>

              {/* Month navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <button
                  className="cal-nav-btn"
                  onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                >◀</button>
                <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>
                  {MONTHS_AR[calMonth]} {calYear}
                </span>
                <button
                  className="cal-nav-btn"
                  onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                >▶</button>
              </div>

              {/* Day headers — full Arabic names */}
              <div className="cal-headers">
                {DAYS_HEADER.map(d => (
                  <div key={d} className="cal-header-cell">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="calendar-grid">
                {calCells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const ds = dateStr(day);
                  const isPast = ds < today;
                  const isToday = ds === today;
                  const isSelected = ds === selectedDate;
                  const dayName = getDayName(day);
                  return (
                    <button
                      key={i}
                      disabled={isPast}
                      title={dayName}
                      className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
                      onClick={() => { if (!isPast) { setSelectedDate(ds); setSelectedSlot(null); } }}
                    >
                      <span className="cal-day-num">{day}</span>
                      {isToday && <span className="cal-day-label">اليوم</span>}
                    </button>
                  );
                })}
              </div>

              {/* Selected date display */}
              {selectedDate && (
                <div style={{
                  marginTop: '1rem', padding: '0.75rem 1rem',
                  background: 'var(--primary-subtle)', border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)', fontSize: '0.9375rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600
                }}>
                  📅 <span>{getDayName(parseInt(selectedDate.split('-')[2]))} {formatDate(selectedDate)}</span>
                  {!slotsLoading && <span style={{ marginRight: 'auto', color: 'var(--primary-light)', fontSize: '0.8125rem' }}>
                    {availableCount} موعد متاح
                  </span>}
                </div>
              )}
            </div>

            {/* ── Step 3: Time Slots ── */}
            {selectedDate && (
              <div className="booking-card">
                <div className="booking-card-header">
                  <span className="step-badge">٣</span>
                  <h2>اختر الموعد</h2>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  {[
                    { color: 'var(--success)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: 'متاح' },
                    { color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: 'معلق' },
                    { color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: 'محجوز' },
                  ].map(l => (
                    <div key={l.text} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.border}` }} />
                      <span style={{ color: l.color, fontWeight: 600 }}>{l.text}</span>
                    </div>
                  ))}
                </div>

                {slotsLoading ? (
                  <div className="slots-grid">
                    {[...Array(12)].map((_, i) => <Skeleton key={i} height={80} />)}
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😔</div>
                    <p>لا توجد مواعيد متاحة لهذا اليوم</p>
                  </div>
                ) : (
                  <div className="slots-grid">
                    {slots.map((slot, i) => (
                      <button
                        key={i}
                        disabled={slot.status !== 'available'}
                        onClick={() => { setSelectedSlot(slot); setBookingOpen(true); }}
                        className={`slot-btn slot-${slot.status} ${selectedSlot?.startTime === slot.startTime ? 'slot-selected' : ''}`}
                      >
                        <div style={{ fontWeight: 800, fontSize: '1.0625rem' }}>{formatTime(slot.startTime)}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>↓ {formatTime(slot.endTime)}</div>
                        {slot.amount && slot.status === 'available' && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '2px', color: 'var(--success)' }}>
                            {formatCurrency(slot.amount)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ════ RIGHT SIDEBAR ════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Booking Summary (when slot selected) */}
            {selectedSlot && selectedField && selectedDate && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                animation: 'fadeInUp 0.3s ease',
              }}>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary-light)' }}>
                  ✅ ملخص الحجز
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                  {[
                    { label: 'الملعب', value: selectedField.name, icon: '🏟️' },
                    { label: 'اليوم', value: `${getDayName(parseInt(selectedDate.split('-')[2]))} ${formatDate(selectedDate)}`, icon: '📅' },
                    { label: 'من', value: formatTime(selectedSlot.startTime), icon: '🕐' },
                    { label: 'إلى', value: formatTime(selectedSlot.endTime), icon: '🕑' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{icon} {label}</span>
                      <span style={{ fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem' }}>
                    <span style={{ fontWeight: 700 }}>💰 الإجمالي</span>
                    <span style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--primary-light)' }}>
                      {formatCurrency(selectedSlot.amount || 0)}
                    </span>
                  </div>
                </div>
                <Button variant="primary" fullWidth style={{ marginTop: '1.25rem' }} onClick={() => setBookingOpen(true)}>
                  تأكيد الحجز →
                </Button>
              </div>
            )}

            {/* Payment Methods */}
            {(stadium?.vodafoneCash || stadium?.instaPay) && (
              <div className="booking-card">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>💳 طرق الدفع</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {stadium.vodafoneCash && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      background: 'var(--bg-elevated)', padding: '0.875rem',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)'
                    }}>
                      <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>📱</div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>فودافون كاش</div>
                        <div style={{ fontWeight: 800, fontSize: '1.0625rem', direction: 'ltr', textAlign: 'right' }}>{stadium.vodafoneCash}</div>
                      </div>
                    </div>
                  )}
                  {stadium.instaPay && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.875rem',
                      background: 'var(--bg-elevated)', padding: '0.875rem',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)'
                    }}>
                      <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>💳</div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>إنستا باي</div>
                        <div style={{ fontWeight: 800, fontSize: '1.0625rem', direction: 'ltr', textAlign: 'right' }}>{stadium.instaPay}</div>
                      </div>
                    </div>
                  )}
                  {stadium.paymentInstructions && (
                    <p style={{
                      fontSize: '0.8125rem', color: 'var(--text-secondary)',
                      marginTop: '0.5rem', lineHeight: 1.75,
                      borderTop: '1px solid var(--border-subtle)', paddingTop: '0.875rem'
                    }}>
                      ℹ️ {stadium.paymentInstructions}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* How to book steps */}
            <div style={{
              background: 'var(--primary-subtle)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', padding: '1.5rem'
            }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem', color: 'var(--primary-light)' }}>
                🚀 خطوات الحجز
              </h3>
              {[
                { n: '١', text: 'اختر الملعب المناسب' },
                { n: '٢', text: 'اختر التاريخ من التقويم' },
                { n: '٣', text: 'انقر على الموعد المتاح' },
                { n: '٤', text: 'أدخل بياناتك وارفع إيصال الدفع' },
                { n: '٥', text: 'تابع حالة حجزك من صفحة "تتبع حجوزاتي"' },
              ].map(({ n, text }) => (
                <div key={n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: 700, flexShrink: 0
                  }}>{n}</div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, paddingTop: '0.125rem' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            {(stadium?.phone || stadium?.whatsapp) && (
              <div className="booking-card">
                <h3 style={{ fontWeight: 700, marginBottom: '0.875rem', fontSize: '1rem' }}>📞 التواصل</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {stadium.phone && (
                    <a href={`tel:${stadium.phone}`} style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'center',
                      padding: '0.75rem', background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem',
                    }}>
                      📞 <span>{stadium.phone}</span>
                    </a>
                  )}
                  {stadium.whatsapp && (
                    <a href={`https://wa.me/${stadium.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{
                      display: 'flex', gap: '0.75rem', alignItems: 'center',
                      padding: '0.75rem', background: 'rgba(34,197,94,0.08)',
                      borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.25)',
                      color: 'var(--success)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem',
                    }}>
                      💬 <span>واتساب مباشر</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Track My Bookings CTA */}
            <a
              href={`/${tenant}/my-bookings`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                border: '1.5px solid rgba(34,197,94,0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.125rem 1.25rem',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.08))';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(34,197,94,0.55)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))';
                (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(34,197,94,0.3)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', flexShrink: 0,
              }}>📋</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9375rem', marginBottom: '0.125rem' }}>
                  تتبع حجوزاتي
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  اعرف حالة حجزك بكل سهولة
                </div>
              </div>
              <div style={{ marginRight: 'auto', color: 'var(--primary-light)', fontSize: '1.125rem' }}>←</div>
            </a>

          </div>
        </div>
      </div>

      {/* ═══ BOOKING MODAL ═══ */}
      <Modal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        title="إتمام طلب الحجز"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setBookingOpen(false)}>إلغاء</Button>
            <Button variant="primary" onClick={handleSubmitBooking} isLoading={submitting}>إرسال طلب الحجز</Button>
          </div>
        }
      >
        {selectedSlot && selectedField && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Booking summary in modal */}
            <div style={{
              background: 'var(--primary-subtle)', border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)', padding: '1.125rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', fontSize: '0.875rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>الملعب:</span> <strong>{selectedField.name}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>التاريخ:</span> <strong>{formatDate(selectedDate)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>من:</span> <strong>{formatTime(selectedSlot.startTime)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>إلى:</span> <strong>{formatTime(selectedSlot.endTime)}</strong></div>
                <div style={{ gridColumn: '1/-1', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>إجمالي المبلغ</span>
                  <span style={{ color: 'var(--primary-light)', fontSize: '1.25rem', fontWeight: 900 }}>
                    {formatCurrency(selectedSlot.amount || 0)}
                  </span>
                </div>
              </div>
            </div>

            <Input label="الاسم بالكامل *" placeholder="أدخل اسمك الثلاثي" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
            <div className="form-group">
              <Input 
                label="رقم الهاتف المحوَّل منه (رقم المحفظة) *" 
                placeholder="أدخل الرقم المكون من 11 رقماً والذي قمت بالتحويل منه" 
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value)} 
                required 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                💡 هام: يرجى كتابة الرقم الذي تم إرسال فودافون كاش أو التحويل البنكي منه لسرعة مطابقة الدفع وتأكيد الحجز.
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">ملاحظات إضافية (اختياري)</label>
              <textarea className="form-input form-textarea" placeholder="أي ملاحظات للمسؤول..." value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: '70px' }} />
            </div>

            {/* Payment upload */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>📸 صورة إيصال الدفع والتحويل *</label>
              <div
                className={`upload-zone ${paymentPreview ? 'dragover' : ''}`}
                onClick={() => document.getElementById('payment-upload')?.click()}
                style={{ border: '2px dashed var(--primary-light)' }}
              >
                {paymentPreview ? (
                  <img src={paymentPreview} alt="إيصال الدفع" className="upload-preview" />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📤</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>انقر هنا لرفع لقطة شاشة إيصال التحويل (إجباري)</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>JPG, PNG, WEBP — حتى 10MB</p>
                  </div>
                )}
              </div>
              <input id="payment-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ SUCCESS ═══ */}
      {bookingSuccess && (
        <div className="modal-overlay" onClick={() => setBookingSuccess(false)}>
          <div className="modal-panel animate-scaleIn" style={{ maxWidth: '460px', textAlign: 'center', padding: '3rem 2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.625rem', fontWeight: 900, marginBottom: '0.75rem' }}>تم إرسال طلب حجزك!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.8 }}>
              سيتم مراجعة طلبك والتحقق من إيصال الدفع خلال وقت قصير.
            </p>
            {/* Track booking CTA */}
            <div style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
            }}>
              💡 يمكنك متابعة حالة حجزك في أي وقت عبر صفحة التتبع
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={`/${tenant}/my-bookings`}
                style={{
                  display: 'block',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '0.8rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 800,
                  textDecoration: 'none',
                  fontSize: '1rem',
                  transition: 'opacity 0.2s',
                }}
              >
                📋 تتبع حجوزاتي
              </a>
              <Button variant="secondary" fullWidth onClick={() => setBookingSuccess(false)}>عد للصفحة</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FLOATING WHATSAPP ═══ */}
      {stadium?.whatsapp && (
        <FloatingWhatsApp
          phone={stadium.whatsapp.replace(/\D/g, '')}
          message={`مرحباً من موقع ${stadium.name}! أحتاج للمساعدة في الحجز ⚽`}
          tooltip={`تواصل مع ${stadium.name}`}
          position="bottom-right"
        />
      )}

      <style jsx global>{`
        .booking-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.75rem;
          align-items: start;
        }
        .booking-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
        }
        .booking-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .booking-card-header h2 {
          font-weight: 700;
          font-size: 1.0625rem;
        }
        .step-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 900;
          flex-shrink: 0;
        }
        .field-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-elevated);
          border: 1.5px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-arabic);
          width: 100%;
        }
        .field-card:hover {
          border-color: var(--primary);
          background: var(--primary-subtle);
          transform: translateY(-1px);
        }
        .field-card-active {
          border-color: var(--primary) !important;
          background: var(--primary-subtle) !important;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
        }
        .field-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .field-badge-price { background: rgba(34,197,94,0.1); color: var(--success); border: 1px solid rgba(34,197,94,0.2); }
        .field-badge-time  { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .field-badge-hours { background: var(--bg-base); color: var(--text-muted); border: 1px solid var(--border-subtle); }
        /* Calendar nav button */
        .cal-nav-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 0.375rem 0.75rem;
          cursor: pointer;
          color: var(--text-primary);
          font-family: var(--font-arabic);
          font-size: 0.875rem;
          transition: all var(--transition-fast);
        }
        .cal-nav-btn:hover { background: var(--primary-subtle); border-color: var(--primary); }
        /* Day headers */
        .cal-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
          margin-bottom: 6px;
        }
        .cal-header-cell {
          text-align: center;
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-muted);
          padding: 0.375rem 0.125rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Calendar day cells — override to add sub-label */
        .calendar-day {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          min-height: 52px;
        }
        .cal-day-num { font-weight: 700; font-size: 0.9375rem; }
        .cal-day-label { font-size: 0.5625rem; opacity: 0.85; font-weight: 600; color: var(--primary-light); }
        /* Slots grid */
        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 0.625rem;
        }
        @media (max-width: 820px) {
          .booking-layout {
            grid-template-columns: 1fr !important;
          }
          .cal-header-cell {
            font-size: 0.5625rem;
          }
        }
      `}</style>
    </div>
  );
}
