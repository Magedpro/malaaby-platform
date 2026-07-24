'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
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

export default function AdminCommissionsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<StadiumReport[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Screenshot Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/commissions');
      const json = await res.json();
      if (json.success && json.data) {
        setReports(json.data);
      } else {
        showToast(json.error || 'فشل جلب كشوف العمولات', 'error');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>💰 تحصيل وتأكيد عمولات الملاعب (5 ج.م / حجز)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          متابعة مستحقات العمولات الشهرية على كل ملعب والموافقة على التحويلات وفك/فرض الحجب.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="btn-spinner" style={{ width: '36px', height: '36px', margin: '0 auto 1rem' }} />
          <p>جاري تحميل كشوف العمولات لكل الملاعب...</p>
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
                <th>حالة الاشتراك</th>
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
                      {stadium.isFreeMonth ? (
                        <Badge variant="success">🎁 شهر مجاني 100%</Badge>
                      ) : (
                        <Badge variant="info">5 ج.م / حجز</Badge>
                      )}
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
