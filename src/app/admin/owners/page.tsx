'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatDateTime } from '@/lib/utils';

interface Owner {
  id: string; name: string; email: string; phone: string; isActive: boolean;
  stadiumSlug: string; stadiumName: string; city: string;
  subscriptionStatus: string; subscriptionExpiry: string; approvalStatus: string; createdAt: string;
}

export default function AdminOwnersPage() {
  const { showToast } = useToast();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset password / subscription state
  const [newPassword, setNewPassword] = useState('');
  const [subStatus, setSubStatus] = useState('active');
  const [subExpiry, setSubExpiry] = useState('');
  const [subPlan, setSubPlan] = useState('plan-pro');

  // Create owner form
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', stadiumName: '', slug: '', city: 'القاهرة' });

  const loadOwners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/owners${query ? `?query=${encodeURIComponent(query)}` : ''}`);
      const json = await res.json();
      if (json.success) setOwners(json.data);
    } catch { showToast('خطأ في تحميل البيانات', 'error'); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { loadOwners(); }, [loadOwners]);

  const handleAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selectedOwner) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/owners/${selectedOwner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'تم بنجاح', 'success');
        setDetailOpen(false);
        loadOwners();
      } else { showToast(json.error || 'فشلت العملية', 'error'); }
    } catch { showToast('خطأ في الاتصال', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا المالك وملعبه نهائياً؟ لا يمكن التراجع.')) return;
    try {
      const res = await fetch(`/api/v1/admin/owners/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { showToast('تم الحذف بنجاح', 'success'); loadOwners(); }
      else { showToast(json.error || 'فشل الحذف', 'error'); }
    } catch { showToast('خطأ في الاتصال', 'error'); }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password || !createForm.stadiumName || !createForm.slug) {
      showToast('يرجى ملء جميع الحقول الإلزامية', 'error'); return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/v1/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم إنشاء حساب المالك بنجاح ✅', 'success');
        setCreateOpen(false);
        loadOwners();
      } else { showToast(json.error || 'فشل الإنشاء', 'error'); }
    } catch { showToast('خطأ في الاتصال', 'error'); }
    finally { setActionLoading(false); }
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'success' : s === 'trial' ? 'info' : s === 'expired' ? 'danger' : 'warning';
  const statusLabel = (s: string) =>
    ({ active: 'نشط', trial: 'تجريبي', expired: 'منتهي', suspended: 'موقوف' }[s] || s);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إدارة ملاك الملاعب</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>عرض وإدارة جميع حسابات أصحاب الملاعب المسجلة</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>➕ إنشاء حساب مالك</Button>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 ابحث بالاسم أو البريد أو اسم الملعب..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ maxWidth: '350px' }}
        />
        <Button variant="secondary" size="sm" onClick={loadOwners}>تحديث</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={64} />)}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>المالك</th>
                <th>الملعب</th>
                <th>المدينة</th>
                <th>الاشتراك</th>
                <th>الحالة</th>
                <th>تاريخ التسجيل</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {owners.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{o.stadiumName}</div>
                    <a href={`/${o.stadiumSlug}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>/{o.stadiumSlug} ↗</a>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{o.city}</td>
                  <td><Badge variant={statusColor(o.subscriptionStatus) as any}>{statusLabel(o.subscriptionStatus)}</Badge></td>
                  <td><Badge variant={o.isActive ? 'success' : 'danger'}>{o.isActive ? 'نشط' : 'موقوف'}</Badge></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatDate(o.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="secondary" size="sm" onClick={() => { setSelectedOwner(o); setSubStatus(o.subscriptionStatus); setDetailOpen(true); }}>إدارة</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(o.id)}>حذف</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Owner Detail/Actions Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`إدارة: ${selectedOwner?.name}`} size="lg">
        {selectedOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Account info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem', background: 'var(--bg-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div><strong>الاسم:</strong> {selectedOwner.name}</div>
              <div><strong>البريد:</strong> {selectedOwner.email}</div>
              <div><strong>الهاتف:</strong> {selectedOwner.phone || '—'}</div>
              <div><strong>الملعب:</strong> {selectedOwner.stadiumName}</div>
              <div><strong>المدينة:</strong> {selectedOwner.city}</div>
              <div><strong>الرابط:</strong> /{selectedOwner.stadiumSlug}</div>
            </div>

            {/* Suspend/Activate */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {selectedOwner.isActive ? (
                <Button variant="danger" onClick={() => handleAction('suspend')} isLoading={actionLoading}>🚫 تعليق الحساب</Button>
              ) : (
                <Button variant="primary" onClick={() => handleAction('activate')} isLoading={actionLoading}>✅ تفعيل الحساب</Button>
              )}
            </div>

            {/* Reset password */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>🔐 تغيير كلمة المرور</h4>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end' }}>
                <Input label="كلمة المرور الجديدة" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="8+ أحرف" />
                <Button variant="secondary" onClick={() => handleAction('reset_password', { password: newPassword })} isLoading={actionLoading} style={{ flexShrink: 0, height: '44px' }}>حفظ</Button>
              </div>
            </div>

            {/* Update subscription */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>💎 تحديث الاشتراك</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label">الخطة</label>
                  <select className="form-input form-select" value={subPlan} onChange={e => setSubPlan(e.target.value)}>
                    <option value="plan-basic">أساسي</option>
                    <option value="plan-pro">برو</option>
                    <option value="plan-premium">بريميوم</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة</label>
                  <select className="form-input form-select" value={subStatus} onChange={e => setSubStatus(e.target.value)}>
                    <option value="trial">تجريبي</option>
                    <option value="active">نشط</option>
                    <option value="expired">منتهي</option>
                    <option value="suspended">موقوف</option>
                  </select>
                </div>
                <Input label="تاريخ الانتهاء" type="date" value={subExpiry} onChange={e => setSubExpiry(e.target.value)} />
              </div>
              <Button variant="primary" size="sm" onClick={() => handleAction('update_subscription', { subscriptionStatus: subStatus, subscriptionExpiry: subExpiry, subscriptionPlanId: subPlan })} isLoading={actionLoading} style={{ marginTop: '0.75rem' }}>
                تحديث الاشتراك
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Owner Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="إنشاء حساب مالك جديد"
        footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>إلغاء</Button>
          <Button variant="primary" onClick={handleCreate} isLoading={actionLoading}>إنشاء الحساب</Button>
        </div>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="الاسم *" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} />
            <Input label="البريد الإلكتروني *" type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} />
            <Input label="كلمة المرور *" type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
            <Input label="الهاتف" value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} />
            <Input label="اسم الملعب *" value={createForm.stadiumName} onChange={e => setCreateForm({...createForm, stadiumName: e.target.value})} />
            <Input label="رابط الملعب (Slug) *" value={createForm.slug} onChange={e => setCreateForm({...createForm, slug: e.target.value.toLowerCase().replace(/\s/g,'-')})} placeholder="my-field" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
export const dynamic = 'force-dynamic';
