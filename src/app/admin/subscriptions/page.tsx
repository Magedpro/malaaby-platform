'use client';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

const PLAN_NAMES: Record<string, string> = {
  'plan-basic': '🥉 البرونزية (500 ج.م.)',
  'plan-pro': '🥈 الفضية (1000 ج.م.)',
  'plan-premium': '🥇 الذهبية (5000 ج.م.)',
};

export default function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Subscription update form state
  const [newStatus, setNewStatus] = useState('active');
  const [newPlanId, setNewPlanId] = useState('plan-basic');
  const [expiryDays, setExpiryDays] = useState('30');

  const loadOwners = () => {
    setLoading(true);
    fetch('/api/v1/admin/owners').then(r => r.json()).then(j => {
      if (j.success) setOwners(j.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadOwners(); }, []);

  const statusColor = (s: string) =>
    ({ active: 'success', trial: 'info', expired: 'danger', suspended: 'warning' }[s] || 'primary') as any;
  const statusLabel = (s: string) =>
    ({ active: 'نشط', trial: 'تجريبي', expired: 'منتهي', suspended: 'موقوف' }[s] || s);

  // Filtered: pending requests first, then all
  const pendingOwners = owners.filter(o => o.pendingSubscription);
  const filtered = filter === 'pending'
    ? pendingOwners
    : filter === 'all' ? owners : owners.filter(o => o.subscriptionStatus === filter);

  const openReview = (owner: any) => {
    setSelected(owner);
    setNewStatus('active');
    setNewPlanId(owner.pendingSubscription?.planId || owner.subscriptionPlanId || 'plan-basic');
    setExpiryDays('30');
    setReviewOpen(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    const expiryDate = new Date(Date.now() + Number(expiryDays) * 86400000).toISOString();
    try {
      const res = await fetch(`/api/v1/admin/owners/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_subscription',
          subscriptionStatus: newStatus,
          subscriptionPlanId: newPlanId,
          subscriptionExpiry: expiryDate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم تفعيل الاشتراك بنجاح ✅', 'success');
        setReviewOpen(false);
        loadOwners();
      } else {
        showToast(json.error || 'فشل تفعيل الاشتراك', 'error');
      }
    } catch { showToast('حدث خطأ في الاتصال', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/owners/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_subscription' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم رفض الطلب وإلغاؤه', 'success');
        setReviewOpen(false);
        loadOwners();
      } else {
        showToast(json.error || 'فشل رفض الطلب', 'error');
      }
    } catch { showToast('حدث خطأ في الاتصال', 'error'); }
    finally { setActionLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💳 إدارة الاشتراكات</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          مراجعة طلبات الاشتراك والدفع وتفعيل أو رفض الاشتراكات
        </p>
      </div>

      {/* Pending Requests Alert */}
      {pendingOwners.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <p style={{ fontWeight: 600, color: 'var(--warning)' }}>
            يوجد <strong>{pendingOwners.length}</strong> {pendingOwners.length === 1 ? 'طلب اشتراك' : 'طلبات اشتراك'} في انتظار مراجعتك.
          </p>
          <button
            onClick={() => setFilter('pending')}
            style={{
              marginRight: 'auto', background: 'var(--warning)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-full)',
              padding: '0.375rem 1rem', fontSize: '0.8125rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-arabic)',
            }}
          >مراجعة الطلبات</button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[['all', 'الكل'], ['pending', `⏳ طلبات معلقة (${pendingOwners.length})`], ['active', 'نشط'], ['trial', 'تجريبي'], ['expired', 'منتهي'], ['suspended', 'موقوف']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            style={{
              padding: '0.375rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-arabic)', border: 'none',
              background: filter === v ? 'var(--primary)' : 'var(--bg-elevated)',
              color: filter === v ? '#fff' : 'var(--text-secondary)',
            }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={60} />)}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>المالك</th>
                <th>الملعب</th>
                <th>الخطة</th>
                <th>الحالة</th>
                <th>تاريخ الانتهاء</th>
                <th>متبقي</th>
                <th>طلب معلق</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const expiry = o.subscriptionExpiry ? new Date(o.subscriptionExpiry) : null;
                const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / 86400000) : null;
                const hasPending = !!o.pendingSubscription;
                return (
                  <tr key={o.id} style={{ background: hasPending ? 'rgba(245,158,11,0.04)' : undefined }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.email}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{o.stadiumName}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {PLAN_NAMES[o.subscriptionPlanId] || o.subscriptionPlanId || '—'}
                    </td>
                    <td><Badge variant={statusColor(o.subscriptionStatus)}>{statusLabel(o.subscriptionStatus)}</Badge></td>
                    <td style={{ fontSize: '0.875rem' }}>{expiry ? formatDate(expiry.toISOString()) : '—'}</td>
                    <td>
                      {daysLeft !== null ? (
                        <span style={{ color: daysLeft < 7 ? 'var(--danger)' : daysLeft < 30 ? 'var(--warning)' : 'var(--success)', fontWeight: 700, fontSize: '0.875rem' }}>
                          {daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {hasPending ? (
                        <Badge variant="warning">⏳ طلب دفع</Badge>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>—</span>}
                    </td>
                    <td>
                      <Button variant="primary" size="sm" onClick={() => openReview(o)}>
                        {hasPending ? '🔍 مراجعة' : '✏️ تعديل'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`${selected?.pendingSubscription ? '🔍 مراجعة طلب دفع' : '✏️ تعديل اشتراك'} — ${selected?.stadiumName}`}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {selected?.pendingSubscription && (
              <Button variant="danger" onClick={handleReject} isLoading={actionLoading}>❌ رفض الطلب</Button>
            )}
            <Button variant="primary" onClick={handleApprove} isLoading={actionLoading}>✅ تفعيل الاشتراك</Button>
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Pending Payment Details */}
            {selected.pendingSubscription && (
              <div style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
              }}>
                <p style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: '0.75rem' }}>⏳ تفاصيل طلب الدفع</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <div><strong>الخطة المطلوبة:</strong><br />{PLAN_NAMES[selected.pendingSubscription.planId] || selected.pendingSubscription.planId}</div>
                  <div><strong>المبلغ المحوّل:</strong><br /><span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{selected.pendingSubscription.amount} ج.م.</span></div>
                  <div><strong>اسم المرسل:</strong><br />{selected.pendingSubscription.senderName}</div>
                  <div><strong>رقم المرسل:</strong><br /><span dir="ltr">{selected.pendingSubscription.senderPhone}</span></div>
                </div>
                {selected.pendingSubscription.paymentScreenshot && (
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>📸 صورة الإيصال:</p>
                    <a href={selected.pendingSubscription.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selected.pendingSubscription.paymentScreenshot}
                        alt="إيصال الدفع"
                        style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', cursor: 'zoom-in' }}
                      />
                    </a>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>انقر على الصورة لعرضها بالحجم الكامل</p>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Update Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>⚙️ إعدادات الاشتراك الجديدة</p>
              <div className="form-group">
                <label className="form-label">الخطة</label>
                <select className="form-input form-select" value={newPlanId} onChange={e => setNewPlanId(e.target.value)}>
                  <option value="plan-basic">🥉 البرونزية — 500 ج.م.</option>
                  <option value="plan-pro">🥈 الفضية — 1000 ج.م.</option>
                  <option value="plan-premium">🥇 الذهبية — 5000 ج.م.</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الحالة</label>
                <select className="form-input form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="active">نشط ✅</option>
                  <option value="trial">تجريبي 🎯</option>
                  <option value="expired">منتهي ❌</option>
                  <option value="suspended">موقوف ⚠️</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">مدة الاشتراك (بالأيام)</label>
                <input
                  className="form-input"
                  type="number"
                  value={expiryDays}
                  onChange={e => setExpiryDays(e.target.value)}
                  min="1"
                  dir="ltr"
                  placeholder="30"
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  تاريخ الانتهاء: {new Date(Date.now() + Number(expiryDays) * 86400000).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export const dynamic = 'force-dynamic';
