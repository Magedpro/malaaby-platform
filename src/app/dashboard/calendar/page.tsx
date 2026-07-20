'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { DAYS_AR, DAY_KEYS } from '@/lib/constants';

interface Field { id: string; name: string; bookingDuration: number; }
interface Booking {
  id: string; fieldId: string; customerName: string;
  date: string; startTime: string; endTime: string; status: string;
  amount: number;
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export default function CalendarPage() {
  const { showToast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetch('/api/v1/fields').then(r => r.json()).then(j => {
      if (j.success && j.data.length > 0) {
        setFields(j.data);
        setSelectedField(j.data[0].id);
      }
    });
  }, []);

  const loadBookings = useCallback(async () => {
    if (!selectedField) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/bookings?fieldId=${selectedField}`);
      const json = await res.json();
      if (json.success) setBookings(json.data);
    } catch { showToast('خطأ في تحميل التقويم', 'error'); }
    finally { setLoading(false); }
  }, [selectedField]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  useEffect(() => {
    if (!selectedDate) { setDayBookings([]); return; }
    const day = bookings.filter(b => b.date === selectedDate);
    setDayBookings(day);
  }, [selectedDate, bookings]);

  // Build calendar days
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  // shift so Saturday=0 (Arab calendar)
  const shiftDow = (startDow + 1) % 7;
  const calCells: (number | null)[] = [];
  for (let i = 0; i < shiftDow; i++) calCells.push(null);
  for (let d = 1; d <= totalDays; d++) calCells.push(d);

  const dateStr = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const hasBooking = (day: number) =>
    bookings.some(b => b.date === dateStr(day) && (b.status === 'confirmed' || b.status === 'pending'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>تقويم الحجوزات التفاعلي</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>عرض وتتبع جميع مواعيد الحجوزات على تقويم شهري تفاعلي</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Calendar */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          {/* Field Selector + Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Button variant="ghost" size="sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}>◀</Button>
              <h3 style={{ fontWeight: 700, minWidth: '120px', textAlign: 'center' }}>{MONTHS_AR[calMonth]} {calYear}</h3>
              <Button variant="ghost" size="sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}>▶</Button>
            </div>
            <select className="form-input form-select" value={selectedField} onChange={e => setSelectedField(e.target.value)} style={{ maxWidth: '200px' }}>
              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {/* Day Headers */}
          <div className="calendar-grid" style={{ marginBottom: '0.5rem' }}>
            {['س','أ','إ','ث','أر','خ','ج'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.5rem 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar Cells */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {[...Array(35)].map((_, i) => <Skeleton key={i} height={44} />)}
            </div>
          ) : (
            <div className="calendar-grid">
              {calCells.map((day, i) => {
                if (!day) return <div key={i} />;
                const ds = dateStr(day);
                const isToday = ds === today;
                const isSelected = ds === selectedDate;
                const hasBk = hasBooking(day);
                return (
                  <button
                    key={i}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasBk ? 'has-bookings' : ''}`}
                    onClick={() => setSelectedDate(isSelected ? '' : ds)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />يوجد حجوزات
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-subtle)', border: '2px solid var(--primary)' }} />اليوم
            </div>
          </div>
        </div>

        {/* Day Detail Panel */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>
            {selectedDate ? `حجوزات ${selectedDate}` : 'اختر يوماً من التقويم'}
          </h3>
          {!selectedDate ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>انقر على أي يوم في التقويم لعرض حجوزاته التفصيلية</p>
          ) : dayBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
              <p style={{ fontSize: '0.875rem' }}>لا توجد حجوزات في هذا اليوم</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dayBookings.map(b => (
                <div key={b.id} style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', borderRight: `3px solid ${b.status === 'confirmed' ? 'var(--success)' : 'var(--warning)'}` }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.customerName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>{b.startTime} - {b.endTime}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 600, marginTop: '0.25rem' }}>{b.amount} ج.م</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';
