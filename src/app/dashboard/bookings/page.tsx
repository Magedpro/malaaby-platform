'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '@/lib/utils';
import { BOOKING_STATUSES, REJECTION_REASONS } from '@/lib/constants';

interface Booking {
  id: string;
  fieldId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  paymentScreenshot?: string;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface Field { id: string; name: string; }

export default function BookingsManagement() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterDate) params.set('date', filterDate);
      if (filterQuery) params.set('query', filterQuery);
      const res = await fetch(`/api/v1/bookings?${params}`);
      const json = await res.json();
      if (json.success) setBookings(json.data);
    } catch { showToast('خطأ في تحميل الحجوزات', 'error'); }
    finally { setLoading(false); }
  }, [filterStatus, filterDate, filterQuery]);

  useEffect(() => {
    fetch('/api/v1/fields').then(r => r.json()).then(j => { if (j.success) setFields(j.data); });
    loadBookings();
  }, [loadBookings]);

  const getFieldName = (id: string) => fields.find(f => f.id === id)?.name || 'الملعب';

  const openDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/bookings/${id}/approve`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('تم تأكيد الحجز بنجاح ✅', 'success');
        setDetailOpen(false);
        loadBookings();
      } else { showToast(json.error || 'فشل التأكيد', 'error'); }
    } catch { showToast('حدث خطأ في الاتصال', 'error'); }
    finally { setActionLoading(false); }
  };

  const openRejectModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { showToast('يرجى إدخال سبب الرفض', 'error'); return; }
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/bookings/${selectedBooking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم رفض الحجز', 'warning');
        setRejectOpen(false);
        setDetailOpen(false);
        loadBookings();
      } else { showToast(json.error || 'فشل الرفض', 'error'); }
    } catch { showToast('حدث خطأ في الاتصال', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/bookings/${selectedBooking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() || 'تم الإلغاء من قِبل صاحب الملعب' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم إلغاء الحجز', 'warning');
        setCancelOpen(false);
        setDetailOpen(false);
        loadBookings();
      } else { showToast(json.error || 'فشل الإلغاء', 'error'); }
    } catch { showToast('حدث خطأ في الاتصال', 'error'); }
    finally { setActionLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إدارة الحجوزات</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>مراجعة وتأكيد ورفض جميع طلبات الحجز الواردة</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 ابحث باسم اللاعب أو هاتفه..."
          value={filterQuery}
          onChange={e => setFilterQuery(e.target.value)}
          style={{ minWidth: '220px', maxWidth: '300px' }}
        />
        <select className="form-input form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: '180px' }}>
          <option value="">كل الحالات</option>
          <option value="pending">معلق</option>
          <option value="confirmed">مؤكد</option>
          <option value="rejected">مرفوض</option>
          <option value="cancelled">ملغي</option>
        </select>
        <input
          type="date"
          className="form-input"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ maxWidth: '180px', direction: 'ltr' }}
        />
        <Button variant="secondary" size="sm" onClick={() => { setFilterStatus(''); setFilterDate(''); setFilterQuery(''); }}>
          مسح الفلاتر
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🧾</span>
          <div className="empty-title">لا توجد حجوزات مطابقة</div>
          <div className="empty-desc">جرب تغيير معايير البحث أو انتظر وصول طلبات جديدة من اللاعبين.</div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>اللاعب</th>
                <th>الملعب</th>
                <th>التاريخ</th>
                <th>التوقيت</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const statusInfo = BOOKING_STATUSES[b.status];
                return (
                  <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(b)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', direction: 'ltr' }}>{b.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{getFieldName(b.fieldId)}</td>
                    <td style={{ fontSize: '0.875rem' }}>{formatDate(b.date)}</td>
                    <td style={{ fontSize: '0.875rem', direction: 'ltr', textAlign: 'right' }}>
                      {formatTime(b.startTime)} - {formatTime(b.endTime)}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{formatCurrency(b.amount)}</td>
                    <td><Badge variant={statusInfo?.color || 'primary'}>{statusInfo?.label || b.status}</Badge></td>
                    <td onClick={e => e.stopPropagation()}>
                      {b.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button variant="primary" size="sm" onClick={() => handleApprove(b.id)} isLoading={actionLoading}>✅</Button>
                          <Button variant="danger" size="sm" onClick={() => openRejectModal(b)}>❌</Button>
                        </div>
                      )}
                      {b.status === 'confirmed' && (
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedBooking(b); setCancelReason(''); setCancelOpen(true); }}>🚫 إلغاء</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="تفاصيل طلب الحجز"
        footer={
          selectedBooking?.status === 'pending' ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="danger" onClick={() => { setDetailOpen(false); openRejectModal(selectedBooking); }}>رفض الحجز</Button>
              <Button variant="primary" onClick={() => handleApprove(selectedBooking.id)} isLoading={actionLoading}>تأكيد الحجز</Button>
            </div>
          ) : selectedBooking?.status === 'confirmed' ? (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => { setDetailOpen(false); setCancelReason(''); setCancelOpen(true); }}>🚫 إلغاء الحجز</Button>
            </div>
          ) : undefined
        }
      >
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
              <div><strong>اسم اللاعب:</strong><br />{selectedBooking.customerName}</div>
              <div><strong>رقم الهاتف:</strong><br /><span dir="ltr">{selectedBooking.customerPhone}</span></div>
              <div><strong>التاريخ:</strong><br />{formatDate(selectedBooking.date)}</div>
              <div><strong>التوقيت:</strong><br />{formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}</div>
              <div><strong>الملعب:</strong><br />{getFieldName(selectedBooking.fieldId)}</div>
              <div><strong>المبلغ المطلوب:</strong><br /><span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{formatCurrency(selectedBooking.amount)}</span></div>
              <div><strong>وقت الطلب:</strong><br />{formatDateTime(selectedBooking.createdAt)}</div>
              <div><strong>الحالة الحالية:</strong><br /><Badge variant={BOOKING_STATUSES[selectedBooking.status]?.color || 'primary'}>{BOOKING_STATUSES[selectedBooking.status]?.label}</Badge></div>
            </div>
            {selectedBooking.notes && (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.875rem' }}>
                <strong>ملاحظات اللاعب:</strong> {selectedBooking.notes}
              </div>
            )}
            {selectedBooking.paymentScreenshot && (
              <div>
                <strong style={{ fontSize: '0.875rem' }}>صورة إيصال الدفع:</strong>
                <img src={selectedBooking.paymentScreenshot} alt="إيصال الدفع" style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: 'var(--radius-md)', marginTop: '0.5rem', background: 'var(--bg-elevated)' }} />
              </div>
            )}
            {selectedBooking.rejectionReason && (
              <div style={{ background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.875rem', color: 'var(--danger)' }}>
                <strong>سبب الرفض:</strong> {selectedBooking.rejectionReason}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="تحديد سبب رفض الحجز"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>إلغاء</Button>
            <Button variant="danger" onClick={handleReject} isLoading={actionLoading}>تأكيد الرفض</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            سيتم إشعار اللاعب بسبب رفض حجزه. اختر سبباً من القائمة أو اكتب سبباً مخصصاً.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {REJECTION_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setRejectReason(r)}
                style={{
                  padding: '0.75rem 1rem',
                  background: rejectReason === r ? 'var(--danger-bg)' : 'var(--bg-elevated)',
                  border: `1px solid ${rejectReason === r ? 'var(--danger)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: rejectReason === r ? 'var(--danger)' : 'var(--text-secondary)',
                  textAlign: 'right',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-arabic)',
                  fontSize: '0.875rem',
                }}
              >{r}</button>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">أو اكتب سبباً مخصصاً</label>
            <textarea
              className="form-input form-textarea"
              placeholder="مثال: المبلغ المحول أقل من قيمة الحجز..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>
      </Modal>
      {/* Cancel Modal */}
      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="إلغاء الحجز"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>تراجع</Button>
            <Button variant="danger" onClick={handleCancel} isLoading={actionLoading}>تأكيد الإلغاء</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            سيتم إلغاء حجز <strong style={{ color: 'var(--text-primary)' }}>{selectedBooking?.customerName}</strong> بتاريخ <strong style={{ color: 'var(--text-primary)' }}>{selectedBooking && formatDate(selectedBooking.date)}</strong>.
          </p>
          <div className="form-group">
            <label className="form-label">سبب الإلغاء (اختياري)</label>
            <textarea
              className="form-input form-textarea"
              placeholder="مثال: تعارض في المواعيد، صيانة طارئة..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
export const dynamic = 'force-dynamic';
