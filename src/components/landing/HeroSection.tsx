'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';

export const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="hero">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-bg.png"
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="hero-bg" />
      <div className="hero-overlay" />
      
      <div className="hero-content animate-fadeIn">
        <div className="hero-badge">
          <span>✨</span>
          <span>ابدأ مجاناً اليوم - بدون بطاقة ائتمانية</span>
        </div>
        
        <h1 className="hero-title">
          أنشئ موقع حجز ملاعبك <br />
          <span className="gradient-text">في دقيقة واحدة</span>
        </h1>
        
        <p className="hero-subtitle">
          ملعبي هي المنصة الأولى المتكاملة لإدارة وحجز ملاعب كرة القدم. احصل على موقع حجز خاص بملعبك فوراً، نظم حجوزاتك، تتبع أرباحك، وقم بتنمية عملك باحترافية.
        </p>
        
        <div className="hero-actions">
          <Link href="/register">
            <Button variant="primary" size="xl">أنشئ موقع ملعبك</Button>
          </Link>
          <Link href="/#contact">
            <Button variant="secondary" size="xl">تواصل مع المبيعات</Button>
          </Link>
        </div>
        
        {/* Animated Counter/Stats Section */}
        <div className="hero-stats">
          <div>
            <div className="hero-stat-value">+٥٠٠</div>
            <div className="hero-stat-label">ملعب مسجل</div>
          </div>
          <div>
            <div className="hero-stat-value">+١٠٠ ألف</div>
            <div className="hero-stat-label">حجز مكتمل</div>
          </div>
          <div>
            <div className="hero-stat-value">+٢٠</div>
            <div className="hero-stat-label">مدينة مصرية</div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default HeroSection;
