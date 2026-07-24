'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

interface StadiumReport {
  slug: string;
  name: string;
  phone: string;
  ownerId: string;
  createdAt: string;
  isFreeMonth: boolean;
  freeUntilDate: string | null;
  totalCompletedBookings: number;
  commissionRate: number;
  totalCalculatedCommission: number;
  unpaidCommission: number;
  commissionStatus: 'active' | 'blocked';
  lastSettledDate: string | null;
  pendingCommissionPayment: {
    amount: number;
    senderName: string;
    senderPhone: string;
    paymentScreenshot: string;
    createdAt: string;
  } | null;
}

interface BillingSettings {
  billingMode: 'commission' | 'subscription';
  defaultCommissionRate: number;
  monthlySubscriptionPrice: number;
}

export default function AdminCommissionsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<StadiumReport[]>([]);
  const [settings, setSettings] = useState<BillingSettings>({
    billingMode: 'commission',
    defaultCommissionRate: 5,
    monthlySubscriptionPrice: 200,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit Rate Modal State
  const [editingStadium, setEditingStadium] = useState<StadiumReport | null>(null);
  const [customRate, setCustomRate] = useState<string>('');

  // Screenshot Preview Modal State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Settings Save State
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/commissions');
      const json = await res.json();
      if (json.success && json.data) {
        setReports(json.data.stadiums || []);
        if (json.data.settings) {
          setSettings(json.data.settings);
        }
      } else {
        showToast(json.error || 'فشل جلب كشوف العمولات والاشتراكات', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateGlobalSettings = async (updates: Partial<BillingSettings>) => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/v1/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_global_billing',
          ...settings,
          ...updates,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'تم حفظ الإعدادات بنجاح ⚙️', 'success');
        fetchReports();
      } else {
        showToast(json.error || 'فشل حفظ الإعدادات', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateStadiumRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStadium) return;
    setActionLoading(`rate-${editingStadium.slug}`);
    try {
      const res = await fetch('/api/v1/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stadium_rate',
          stadiumSlug: editingStadium.slug,
          commissionRate: Number(customRate),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'تم تحديث عمولة الملعب بنجاح ✅', 'success');
        setEditingStadium(null);
        fetchReports();
      } else {
        showToast(json.error || 'فشل التحديث', 'error');
      }
    } catch {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (stadiumSlug: string, action: 'approve_payment' | 'block' | 'unblock') => {
    setActionLoading(`${stadiumSlug}-${action}`);
    try {
      const res = await fetch('/api/v1/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadiumSlug, action }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message || 'تم الإجراء بنجاح', 'success');
        fetchReports();
      } else {
        showToast(json.error || 'فشل تنفيذ الإجراء', 'error');
      }
    } catch {
      showToast('حدث خطأ غير متوقع', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* Page Title Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💰 إدارة وتحصيل عمولات واشتراكات الملاعب</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          التحكم في نموذج العمل المالي (نظام العمولة أو نظام الاشتراك الشهري) وتحديد الأسعار وتأكيد التحويلات.
        </p>
      </div>

      {/* Global Billing Model Settings Panel */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>⚙️ نموذج المحاسبة المالي للمنصة</h2>
          <Badge variant={settings.billingMode === 'commission' ? 'success' : 'warning'}>
            النظام المفعل حالياً: {settings.billingMode === 'commission' ? 'نظام العمولة (5 ج.م / حجز)' : 'نظام الاشتراك الشهري (موقوف حالياً)'}
          </Badge>
        </div>

        {/* Toggle & Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          
          {/* Billing Mode Switch */}
          <div style={{
            background: 'var(--bg-base)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
              اختيار نموذج الربح والمحاسبة:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button
                type="button"
                variant={settings.billingMode === 'commission' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setSettings(prev => ({ ...prev, billingMode: 'commission' }));
                  handleUpdateGlobalSettings({ billingMode: 'commission' });
                }}
                disabled={savingSettings}
              >
                💸 نظام العمولة (المفعل)
              </Button>
              <Button
                type="button"
                variant={settings.billingMode === 'subscription' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setSettings(prev => ({ ...prev, billingMode: 'subscription' }));
                  handleUpdateGlobalSettings({ billingMode: 'subscription' });
                }}
                disabled={savingSettings}
              >
                💎 نظام الاشتراك الشهري (مؤجل)
              </Button>
            </div>
          </div>

          {/* Default Commission Rate Input */}
          <div style={{
            background: 'var(--bg-base)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
              سعر العمولة الافتراضي (لكل حجز مكتمل):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                className="form-input"
                style={{ maxWidth: '130px' }}
                value={settings.defaultCommissionRate}
                onChange={e => setSettings(prev => ({ ...prev, defaultCommissionRate: Number(e.target.value) }))}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ج.م</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleUpdateGlobalSettings({ defaultCommissionRate: settings.defaultCommissionRate })}
                isLoading={savingSettings}
              >
                تحديث السعر
              </Button>
            </div>
          </div>

          {/* Monthly Subscription Price Input */}
          <div style={{
            background: 'var(--bg-base)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
              سعر الاشتراك الشهري (في حال تفعيله مستقبلاً):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                className="form-input"
                style={{ maxWidth: '130px' }}
                value={settings.monthlySubscriptionPrice}
                onChange={e => setSettings(prev => ({ ...prev, monthlySubscriptionPrice: Number(e.target.value) }))}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ج.م / شهر</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleUpdateGlobalSettings({ monthlySubscriptionPrice: settings.monthlySubscriptionPrice })}
                isLoading={savingSettings}
              >
                تحديث السعر
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Stadiums Commission & Collection Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="btn-spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1rem' }} />
          <p>جاري تحميل كشوف العمولات والملاعب...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏟️</span>
          <div className="empty-title">لا توجد ملاعب مسجلة حالياً</div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>الملعب</th>
                <th>عمولة الملعب الخاصة</th>
                <th>الحجوزات المكتملة</th>
                <th>المستحقات المطلوب سدادها</th>
                <th>إثبات التحويل المرفوع</th>
                <th>حالة اللوحة</th>
                <th>الإجراءات والتسوية</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(stadium => {
                const isBlocked = stadium.commissionStatus === 'blocked';
                const hasPending = !!stadium.pendingCommissionPayment;

                return (
                  <tr key={stadium.slug}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stadium.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stadium.phone}</div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {stadium.isFreeMonth ? (
                          <Badge variant="success">🎁 شهر مجاني 100%</Badge>
                        ) : (
                          <Badge variant="info">{stadium.commissionRate} ج.م / حجز</Badge>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStadium(stadium);
                            setCustomRate(String(stadium.commissionRate));
                          }}
                          title="تعديل عمولة هذا الملعب"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          ✏️
                        </button>
                      </div>
                    </td>

                    <td style={{ fontWeight: 700 }}>
                      {stadium.totalCompletedBookings} حجز
                    </td>

                    <td style={{ fontWeight: 800, color: stadium.unpaidCommission > 0 ? 'var(--danger)' : '#10b981' }}>
                      {stadium.unpaidCommission} ج.م
                    </td>

                    <td>
                      {hasPending ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 700 }}>
                            📥 {stadium.pendingCommissionPayment?.amount} ج.م ({stadium.pendingCommissionPayment?.senderName})
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreviewImage(stadium.pendingCommissionPayment?.paymentScreenshot || null)}
                            style={{
                              background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer',
                              fontSize: '0.8rem', textDecoration: 'underline', textAlign: 'right'
                            }}
                          >
                            👁️ معاينة إيصال التحويل
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>لا يوجد تحويل معلق</span>
                      )}
                    </td>

                    <td>
                      {isBlocked ? (
                        <Badge variant="danger">⛔ محجوب مؤقتاً</Badge>
                      ) : (
                        <Badge variant="success">✅ نشط</Badge>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {hasPending && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAction(stadium.slug, 'approve_payment')}
                            isLoading={actionLoading === `${stadium.slug}-approve_payment`}
                          >
                            ✅ تأكيد التحصيل وفك الحجب
                          </Button>
                        )}

                        {isBlocked ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAction(stadium.slug, 'unblock')}
                            isLoading={actionLoading === `${stadium.slug}-unblock`}
                          >
                            🔓 فك الحجب
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAction(stadium.slug, 'block')}
                            isLoading={actionLoading === `${stadium.slug}-block`}
                          >
                            ⛔ حجب اللوحة
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Custom Commission Rate Modal */}
      {editingStadium && (
        <Modal isOpen={true} onClose={() => setEditingStadium(null)} title={`✏️ تعديل عمولة ملعب: ${editingStadium.name}`}>
          <form onSubmit={handleUpdateStadiumRate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="قيمة العمولة لهذا الملعب تحديداً (ج.م لكل حجز مكتمل)"
              type="number"
              value={customRate}
              onChange={e => setCustomRate(e.target.value)}
              required
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={() => setEditingStadium(null)}>إلغاء</Button>
              <Button type="submit" variant="primary" isLoading={actionLoading === `rate-${editingStadium.slug}`}>حفظ العمولة الجديد ✅</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <Modal isOpen={true} onClose={() => setPreviewImage(null)} title="🖼️ معاينة إيصال تحويل العمولات">
          <div style={{ textAlign: 'center' }}>
            <img src={previewImage} alt="إيصال التحويل" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 'var(--radius-md)' }} />
          </div>
        </Modal>
      )}
    </div>
  );
}
