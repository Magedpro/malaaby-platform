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

  const handleAction = async (stadiumSlug: string, action: 'approve_payment' | 'block' | 'unblock' | 'end_free_trial') => {
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

  const isCommissionMode = settings.billingMode === 'commission';
  const pendingPaymentsCount = reports.filter(r => !!r.pendingCommissionPayment).length;
  const totalUnpaid = reports.reduce((acc, r) => acc + (r.unpaidCommission || 0), 0);
  const freeStadiumsCount = reports.filter(r => r.isFreeMonth).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Page Title Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.6rem)', fontWeight: 800 }}>
          💰 إدارة وتحصيل العمولات والاشتراكات
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          تحكم في نظام المحاسبة المالي للمنصة وتحديد الأسعار وتأكيد التحويلات ومتابعة حسابات الملاعب.
        </p>
      </div>

      {/* Top Stats Overview (Responsive Grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '1rem',
      }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الملاعب</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '0.25rem' }}>{reports.length} ملعب</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ملاعب في الشهر المجاني</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>{freeStadiumsCount} ملعب</div>
        </div>

        <div style={{
          background: pendingPaymentsCount > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-surface)',
          border: pendingPaymentsCount > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-subtle)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تحويلات قيد الموافقة</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingPaymentsCount > 0 ? 'var(--warning)' : 'var(--text-main)', marginTop: '0.25rem' }}>
            {pendingPaymentsCount} إيصال
          </div>
        </div>

        <div style={{
          background: totalUnpaid > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
          border: totalUnpaid > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي العمولات المطلوبة</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: totalUnpaid > 0 ? 'var(--danger)' : '#10b981', marginTop: '0.25rem' }}>
            {totalUnpaid} ج.م
          </div>
        </div>
      </div>

      {/* Global Billing Model Settings Panel */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>⚙️ نظام المحاسبة المالي المفعل للمنصة</h2>
          <Badge variant={isCommissionMode ? 'success' : 'warning'}>
            {isCommissionMode ? '💸 نظام العمولة (المفعل حالياً)' : '💎 نظام الاشتراك الشهري'}
          </Badge>
        </div>

        {/* Toggle Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}>
          {/* Mode Switcher */}
          <div style={{
            background: 'var(--bg-base)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>اختيار نظام المحاسبة:</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button
                type="button"
                variant={isCommissionMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setSettings(prev => ({ ...prev, billingMode: 'commission' }));
                  handleUpdateGlobalSettings({ billingMode: 'commission' });
                }}
                disabled={savingSettings}
              >
                💸 نظام العمولة
              </Button>
              <Button
                type="button"
                variant={!isCommissionMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setSettings(prev => ({ ...prev, billingMode: 'subscription' }));
                  handleUpdateGlobalSettings({ billingMode: 'subscription' });
                }}
                disabled={savingSettings}
              >
                💎 نظام الاشتراك الشهري
              </Button>
            </div>
          </div>

          {/* Active Mode Dynamic Price Setting */}
          {isCommissionMode ? (
            <div style={{
              background: 'var(--bg-base)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                سعر العمولة العام (لكل حجز مكتمل لجميع الملاعب):
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  className="form-input"
                  style={{ maxWidth: '120px' }}
                  value={settings.defaultCommissionRate}
                  onChange={e => setSettings(prev => ({ ...prev, defaultCommissionRate: Number(e.target.value) }))}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ج.م / حجز</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateGlobalSettings({ defaultCommissionRate: settings.defaultCommissionRate })}
                  isLoading={savingSettings}
                >
                  تحديث العمولة العامة 🚀
                </Button>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-base)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                سعر الاشتراك الشهري العام لكل ملعب:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  className="form-input"
                  style={{ maxWidth: '120px' }}
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
                  تحديث سعر الاشتراك 🚀
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stadiums Commission & Collection Data Section */}
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
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
            📋 كشف ملاعب المنصة والمستحقات ({reports.length})
          </h2>

          {/* Desktop Data Table / Mobile Card Layout */}
          <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th>الملعب ومصاحبه</th>
                  <th>تعريفة العمولة</th>
                  <th>الحجوزات الخاضعة للعمولة</th>
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
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>{stadium.phone}</div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {stadium.isFreeMonth ? (
                            <Badge variant="success">🎁 شهر مجاني</Badge>
                          ) : (
                            <Badge variant="info">{stadium.commissionRate} ج.م / حجز</Badge>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStadium(stadium);
                              setCustomRate(String(stadium.commissionRate));
                            }}
                            title="تعديل عمولة هذا الملعب تحديداً"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '0.2rem' }}
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 700 }}>
                              📥 {stadium.pendingCommissionPayment?.amount} ج.م ({stadium.pendingCommissionPayment?.senderName})
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(stadium.pendingCommissionPayment?.paymentScreenshot || null)}
                              style={{
                                background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer',
                                fontSize: '0.78rem', textDecoration: 'underline', textAlign: 'right'
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
                          <Badge variant="danger">⛔ محجوب</Badge>
                        ) : (
                          <Badge variant="success">✅ نشط</Badge>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {stadium.isFreeMonth && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (confirm(`هل أنت تأكد من إلغاء الشهر المجاني لـ (${stadium.name}) وبدء احتساب العمولات والاشتراكات فوراً؟`)) {
                                  handleAction(stadium.slug, 'end_free_trial');
                                }
                              }}
                              isLoading={actionLoading === `${stadium.slug}-end_free_trial`}
                              title="إلغاء الشهر المجاني للملعب وبدء حساب العمولات فوراً"
                              style={{ color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.3)' }}
                            >
                              ⏳ إلغاء الشهر المجاني
                            </Button>
                          )}

                          {hasPending && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAction(stadium.slug, 'approve_payment')}
                              isLoading={actionLoading === `${stadium.slug}-approve_payment`}
                            >
                              ✅ تأكيد التحصيل
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
                              ⛔ حجب الملعب
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
