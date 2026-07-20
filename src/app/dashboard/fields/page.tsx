'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils';
import { FIELD_STATUSES, BOOKING_DURATIONS } from '@/lib/constants';

interface Field {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  bookingDuration: number;
  openingTime: string;
  closingTime: string;
  status: 'available' | 'maintenance' | 'closed';
  coverImage?: string;
}

export default function FieldsManagement() {
  const { showToast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    description: '',
    pricePerHour: '',
    bookingDuration: '60',
    openingTime: '08:00',
    closingTime: '23:00',
    status: 'available' as Field['status'],
    coverImage: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const loadFields = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/fields');
      const json = await res.json();
      if (json.success) {
        setFields(json.data);
      }
    } catch (e) {
      console.error('Error loading fields:', e);
      showToast('خطأ في تحميل بيانات الملاعب', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setForm({
      name: '',
      description: '',
      pricePerHour: '',
      bookingDuration: '60',
      openingTime: '08:00',
      closingTime: '23:00',
      status: 'available',
      coverImage: 'https://images.unsplash.com/photo-1568194157720-8eae79728929?w=600&h=400&fit=crop',
    });
    setModalOpen(true);
  };

  const openEditModal = (field: Field) => {
    setEditId(field.id);
    setForm({
      name: field.name,
      description: field.description,
      pricePerHour: String(field.pricePerHour),
      bookingDuration: String(field.bookingDuration),
      openingTime: field.openingTime,
      closingTime: field.closingTime,
      status: field.status,
      coverImage: field.coverImage || '',
    });
    setModalOpen(true);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت', 'error');
      return;
    }
    
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: fd
      });
      const json = await res.json();
      if (json && json.success) {
        setForm(prev => ({ ...prev, coverImage: json.url }));
        showToast('تم رفع صورة الملعب بنجاح ✅', 'success');
      } else {
        showToast(json?.error || 'فشل رفع الصورة، يرجى المحاولة لاحقاً', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء رفع الصورة', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.pricePerHour || !form.openingTime || !form.closingTime) {
      showToast('يرجى تعبئة الحقول المطلوبة', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = editId ? `/api/v1/fields/${editId}` : '/api/v1/fields';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pricePerHour: Number(form.pricePerHour),
          bookingDuration: Number(form.bookingDuration),
        }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(editId ? 'تم تحديث بيانات الملعب بنجاح' : 'تم إضافة الملعب بنجاح', 'success');
        setModalOpen(false);
        loadFields();
      } else {
        showToast(json.error || 'فشلت عملية الحفظ', 'error');
      }
    } catch {
      showToast('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الملعب؟ سيتم حذف جميع الحجوزات المرتبطة به.')) return;
    try {
      const res = await fetch(`/api/v1/fields/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('تم حذف الملعب بنجاح', 'success');
        loadFields();
      } else {
        showToast(json.error || 'فشل حذف الملعب', 'error');
      }
    } catch {
      showToast('حدث خطأ أثناء الاتصال بالخادم', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.50rem', fontWeight: 800 }}>إدارة ملاعب كرة القدم</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>إضافة وتعديل وحذف الملاعب خماسية وسباعية التابعة للمجمع</p>
        </div>
        <Button variant="primary" onClick={openAddModal}>
          ➕ إضافة ملعب جديد
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height={320} />
          ))}
        </div>
      ) : fields.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏟️</span>
          <div className="empty-title">لا توجد ملاعب مضافة</div>
          <div className="empty-desc">ابدأ بإضافة أول ملعب لتمكين اللاعبين من حجزه إلكترونياً.</div>
          <Button variant="primary" onClick={openAddModal} style={{ marginTop: '1rem' }}>
            أضف ملعبك الأول الآن
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {fields.map((field) => (
            <Card key={field.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={field.coverImage}
                  alt={field.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                  <Badge variant={FIELD_STATUSES[field.status]?.color || 'primary'}>
                    {FIELD_STATUSES[field.status]?.label || field.status}
                  </Badge>
                </div>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.5rem' }}>
                <h3 className="feature-title" style={{ fontSize: '1.125rem', margin: 0 }}>{field.name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minHeight: '40px' }}>
                  {field.description || 'لا يوجد وصف مضاف لهذا الملعب.'}
                </p>
                
                <div style={{ fontSize: '0.875rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>سعر الساعة:</strong> <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{formatCurrency(field.pricePerHour)}</span></div>
                  <div><strong>مدة الحجز:</strong> {field.bookingDuration} دقيقة</div>
                  <div><strong>ساعات العمل:</strong> {field.openingTime} - {field.closingTime}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(field)} style={{ flex: 1 }}>
                    ✏️ تعديل
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(field.id)} style={{ flex: 1 }}>
                    🗑️ حذف
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'تعديل بيانات الملعب' : 'إضافة ملعب جديد للمجمع'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="اسم الملعب"
            placeholder="مثال: الملعب الخماسي الرئيسي"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="form-group">
            <label className="form-label">وصف الملعب</label>
            <textarea
              className="form-input form-textarea"
              placeholder="وصف تفصيلي عن أرضية الملعب، الإضاءة، الكور المتوفرة..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="سعر تأجير الساعة (ج.م)"
              type="number"
              placeholder="150"
              value={form.pricePerHour}
              onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
              required
            />
            
            <div className="form-group">
              <label className="form-label">أقل مدة حجز</label>
              <select
                className="form-input form-select"
                value={form.bookingDuration}
                onChange={(e) => setForm({ ...form, bookingDuration: e.target.value })}
              >
                {BOOKING_DURATIONS.map((dur) => (
                  <option key={dur.value} value={dur.value}>{dur.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="وقت الفتح الافتراضي"
              type="time"
              value={form.openingTime}
              onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
              required
            />
            <Input
              label="وقت الإغلاق الافتراضي"
              type="time"
              value={form.closingTime}
              onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">حالة الملعب</label>
              <select
                className="form-input form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                style={{ height: '42px' }}
              >
                <option value="available">متاح للحجز</option>
                <option value="maintenance">صيانة مؤقتة</option>
                <option value="closed">مغلق بالكامل</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="رابط صورة الملعب الرئيسية"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <label 
                className="btn btn-secondary" 
                style={{ cursor: 'pointer', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', margin: 0 }}
              >
                {uploadingCover ? 'جاري...' : '📤 رفع صورة'}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  disabled={uploadingCover} 
                  onChange={handleUploadFile} 
                />
              </label>
            </div>
          </div>

          <Button type="submit" variant="primary" isLoading={saving} fullWidth style={{ marginTop: '1rem' }}>
            حفظ البيانات
          </Button>
        </form>
      </Modal>
    </div>
  );
}
export const dynamic = 'force-dynamic';
