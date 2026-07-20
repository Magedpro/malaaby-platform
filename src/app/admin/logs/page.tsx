'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, timeAgo } from '@/lib/utils';

interface Log {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  targetId: string;
  targetType: string;
  details?: Record<string, any>;
  createdAt: string;
}

export default function AdminLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/logs').then(r => r.json()).then(j => {
      if (j.success) setLogs(j.data);
    }).catch(() => showToast('خطأ في تحميل سجل النشاط', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const actionLabel = (action: string) => {
    switch (action) {
      case 'user_register': return '👤 تسجيل حساب مالك جديد';
      case 'user_login': return '🔑 تسجيل دخول للمنصة';
      case 'admin_create_owner': return '➕ إنشاء حساب مالك من الأدمن';
      case 'admin_update_owner': return '✏️ تعديل بيانات مالك';
      case 'admin_suspend_owner': return '🚫 تعليق حساب مالك';
      case 'admin_activate_owner': return '✅ تفعيل حساب مالك';
      case 'admin_delete_owner': return '🗑️ حذف حساب مالك وملعبه';
      case 'admin_reset_password': return '🔒 إعادة تعيين كلمة المرور';
      case 'admin_update_subscription': return '💎 تحديث حالة الاشتراك';
      case 'create_field': return '🏟️ إضافة ملعب جديد';
      case 'update_field': return '✏️ تعديل بيانات ملعب';
      case 'delete_field': return '🗑️ حذف ملعب';
      case 'update_stadium_settings': return '⚙️ تعديل إعدادات مجمع الملاعب';
      case 'create_booking': return '⚽ تسجيل حجز جديد';
      case 'approve_booking': return '✅ تأكيد طلب حجز';
      case 'reject_booking': return '❌ رفض طلب حجز';
      case 'cancel_booking': return '🚫 إلغاء حجز';
      case 'admin_create_city': return '🏙️ إضافة مدينة جديدة';
      case 'admin_update_city': return '✏️ تعديل بيانات مدينة';
      case 'admin_delete_city': return '🗑️ حذف مدينة';
      case 'admin_update_settings': return '⚙️ تعديل إعدادات المنصة';
      default: return action;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>سجل نشاط المنصة (Activity Logs)</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>مراقبة وتتبع جميع العمليات التي تتم في المنصة من المشرفين والملاك</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <div className="empty-title">السجل فارغ</div>
          <div className="empty-desc">لا توجد عمليات مسجلة في النظام حتى الآن.</div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>العملية</th>
                <th>القائم بالعملية</th>
                <th>المعرف المستهدف</th>
                <th>التاريخ والوقت</th>
                <th>منذ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 600 }}>{actionLabel(log.action)}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{log.performedByName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {log.performedBy}</div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {log.targetType}: {log.targetId}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{formatDateTime(log.createdAt)}</td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--primary-light)', fontWeight: 600 }}>{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export const dynamic = 'force-dynamic';
