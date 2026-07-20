'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

interface City {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCitiesPage() {
  const { showToast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityName, setCityName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const loadCities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/cities');
      const json = await res.json();
      if (json.success) setCities(json.data);
    } catch { showToast('خطأ في تحميل المدن', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCities(); }, []);

  const handleAdd = async () => {
    if (!cityName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/v1/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cityName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تمت إضافة المدينة بنجاح', 'success');
        setCityName('');
        setCreateOpen(false);
        loadCities();
      } else { showToast(json.error || 'فشلت الإضافة', 'error'); }
    } catch { showToast('خطأ في الاتصال', 'error'); }
    finally { setAdding(false); }
  };

  const handleUpdate = async () => {
    if (!editingCity || !cityName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/v1/admin/cities/${editingCity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cityName.trim(), isActive: editingCity.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم تعديل المدينة بنجاح', 'success');
        setEditingCity(null);
        setCityName('');
        setEditOpen(false);
        loadCities();
      } else { showToast(json.error || 'فشل التعديل', 'error'); }
    } catch { showToast('خطأ في الاتصال', 'error'); }
    finally { setAdding(false); }
  };

  const toggleActive = async (city: City) => {
    try {
      const res = await fetch(`/api/v1/admin/cities/${city.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: city.name, isActive: !city.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`تم ${!city.isActive ? 'تفعيل' : 'تعطيل'} المدينة بنجاح`, 'success');
        loadCities();
      }
    } catch { showToast('خطأ في الاتصال', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه المدينة؟ قد يؤثر ذلك على الملاعب التابعة لها.')) return;
    try {
      const res = await fetch(`/api/v1/admin/cities/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { showToast('تم الحذف بنجاح', 'success'); loadCities(); }
      else { showToast(json.error || 'فشل الحذف', 'error'); }
    } catch { showToast('خطأ في الاتصال', 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إدارة المدن والمناطق</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>تحديد وتفعيل المدن المتاحة لأصحاب الملاعب واللاعبين</p>
        </div>
        <Button variant="primary" onClick={() => { setCityName(''); setCreateOpen(true); }}>➕ إضافة مدينة</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} />)}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>اسم المدينة</th><th>الحالة</th><th>تاريخ الإضافة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {cities.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td><Badge variant={c.isActive ? 'success' : 'danger'}>{c.isActive ? 'نشط' : 'معطل'}</Badge></td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="secondary" size="sm" onClick={() => { setEditingCity(c); setCityName(c.name); setEditOpen(true); }}>تعديل</Button>
                      <Button variant={c.isActive ? 'secondary' : 'primary'} size="sm" onClick={() => toggleActive(c)}>{c.isActive ? 'تعطيل' : 'تفعيل'}</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(c.id)}>حذف</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add City Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="إضافة مدينة جديدة"
        footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>إلغاء</Button>
          <Button variant="primary" onClick={handleAdd} isLoading={adding}>إضافة المدينة</Button>
        </div>}
      >
        <Input label="اسم المدينة بالعربية *" placeholder="مثال: القاهرة" value={cityName} onChange={e => setCityName(e.target.value)} required />
      </Modal>

      {/* Edit City Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="تعديل اسم المدينة"
        footer={<div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setEditOpen(false)}>إلغاء</Button>
          <Button variant="primary" onClick={handleUpdate} isLoading={adding}>حفظ التعديل</Button>
        </div>}
      >
        <Input label="اسم المدينة بالعربية *" value={cityName} onChange={e => setCityName(e.target.value)} required />
      </Modal>
    </div>
  );
}
export const dynamic = 'force-dynamic';
