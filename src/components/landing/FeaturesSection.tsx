import React from 'react';
import { Card } from '../ui/Card';

interface FeatureItem {
  icon: string;
  title: string;
  desc: string;
}

const features: FeatureItem[] = [
  {
    icon: '📅',
    title: 'حجز إلكتروني سريع',
    desc: 'احصل على صفحة حجز عامة متجاوبة تسمح للاعبين بحجز الملاعب في أقل من دقيقة واحدة بدون أي تعقيد.',
  },
  {
    icon: '📱',
    title: 'متوافق مع الهواتف',
    desc: 'تصميم احترافي "Mobile-First" متجاوب تماماً ليعمل بكفاءة مطلقة على جميع الهواتف الذكية والأجهزة اللوحية.',
  },
  {
    icon: '🧾',
    title: 'رفع إيصال الدفع',
    desc: 'يرفع العميل لقطة شاشة للتحويل المالي (Vodafone Cash / InstaPay) للمراجعة اليدوية الفورية من قبلك.',
  },
  {
    icon: '🗓️',
    title: 'تقويم حجوزات تفاعلي',
    desc: 'عرض مرئي لجميع المواعيد المتاحة والمحجوزة والمعلقة بالألوان المحددة لمنع أي تداخل أو حجز مزدوج.',
  },
  {
    icon: '👥',
    title: 'إدارة العملاء',
    desc: 'قاعدة بيانات متكاملة لبيانات اللاعبين وهواتفهم وسجل حجوزاتهم للتواصل معهم وإرسال العروض والتنبيهات.',
  },
  {
    icon: '📊',
    title: 'تقارير متكاملة',
    desc: 'احصل على تحليل كامل لأداء ملاعبك، المواعيد الأكثر طلباً، ومعدل إشغال الملاعب طوال الأسبوع.',
  },
  {
    icon: '💰',
    title: 'تتبع الإيرادات',
    desc: 'مراقبة فورية لإيرادات اليوم والإيرادات الشهرية الحالية، والتحويلات المؤكدة والمعلقة بمكان واحد.',
  },
  {
    icon: '⚡',
    title: 'حجز في دقيقة',
    desc: 'عملية حجز مبسطة جداً: اختر الملعب، التاريخ، الوقت، أدخل هاتفك، وارفع الإيصال. انتهى الحجز!',
  },
  {
    icon: '💻',
    title: 'لوحة تحكم احترافية',
    desc: 'لوحة تحكم ذكية وشاملة لأصحاب الملاعب للتحكم في الملاعب، أسعار المواعيد، الإجازات، وإعدادات الدفع.',
  },
  {
    icon: '🔔',
    title: 'إشعارات فورية',
    desc: 'إشعارات لحظية تظهر على شاشتك عند وصول حجز جديد أو إلغاء حجز بدون الحاجة لتحديث الصفحة.',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="section bg-surface" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <span>🛡️</span> مميزات المنصة
          </div>
          <h2 className="section-title">كل ما تحتاجه لإدارة ملاعبك بنقرة واحدة</h2>
          <p className="section-desc">
            وفرنا لك ترسانة من الأدوات التقنية المتطورة المصممة خصيصاً لتناسب احتياجات ملاعب كرة القدم في الوطن العربي.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feat, i) => (
            <Card key={i} className="feature-card animate-fadeInUp" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="feature-icon">{feat.icon}</div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
export default FeaturesSection;
