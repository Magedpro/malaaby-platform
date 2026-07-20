'use client';

import React, { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: 'هل أحتاج لخبرة برمجية لإنشاء موقع لحجز ملعبي؟',
    a: 'لا، على الإطلاق! منصة ملعبي مصممة لتكون بسيطة ومريحة جداً. كل ما عليك فعله هو إدخال بيانات ملعبك وصور الملاعب وأرقام التحويل المالي وسيقوم النظام بتوليد موقع الحجز الخاص بك وتنشيطه فوراً.',
  },
  {
    q: 'كيف تتم عملية التحقق من الدفع للملاك؟',
    a: 'عندما يقوم اللاعب باختيار موعد، يعرض له النظام معلومات التحويل (فودافون كاش أو إنستا باي). بعد التحويل، يرفع العميل لقطة شاشة للعملية، ويظهر لك إشعار فوري بلوحة التحكم لمراجعة الإيصال يدوياً وتأكيد الحجز أو رفضه.',
  },
  {
    q: 'ماذا يحدث لو انتهى اشتراكي في المنصة؟',
    a: 'في حال انتهاء صلاحية الاشتراك، لن يفقد ملعبك بياناته أو إحصائياته وتظل الحجوزات السابقة ظاهرة لك. ولكن، سيتم إيقاف استقبال حجوزات جديدة من اللاعبين مؤقتاً لحين تجديد الاشتراك.',
  },
  {
    q: 'هل يمكنني منع حجز مواعيد معينة أو إغلاق الملاعب للصيانة؟',
    a: 'نعم، بكل تأكيد. تتيح لك لوحة التحكم إمكانية إغلاق أي ملعب مؤقتاً، أو تحديد مواعيد صيانة دورية، أو حظر مواعيد محددة في التقويم يدوياً بنقرة واحدة فلا تظهر للاعبين كأوقات متاحة.',
  },
  {
    q: 'هل يمكنني إضافة أكثر من ملعب وتعيين أسعار مختلفة لها؟',
    a: 'نعم، يمكنك إضافة ملاعب متعددة (مثال: ملعب خماسي وملعب سباعي)، وتخصيص سعر الساعة الافتراضي لكل ملعب، وتحديد فترات العمل ومدة الحجز لكل ملعب على حدة.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    if (openIndex === i) {
      setOpenIndex(null);
    } else {
      setOpenIndex(i);
    }
  };

  return (
    <section id="faq" className="section bg-surface" style={{ backgroundColor: 'var(--bg-surface)' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-tag">
            <span>❓</span> الأسئلة الشائعة
          </div>
          <h2 className="section-title">لديك استفسار؟ لدينا إجابة</h2>
          <p className="section-desc">
            تصفح الأسئلة الشائعة حول كيفية عمل المنصة وإدارة الحجوزات والدفع.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => toggle(i)}>
                  <span>{faq.q}</span>
                  <span className="faq-icon">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="faq-answer animate-fadeIn">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default FaqSection;
