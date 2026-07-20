import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { PricingSection } from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/layout/Footer';
import { FloatingWhatsApp } from '@/components/ui/FloatingWhatsApp';
import { FloatingSubscription } from '@/components/ui/FloatingSubscription';

export default function Home() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh' }}>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
      {/* زر واتساب عائم — يوجه أصحاب الملاعب للتواصل مع المنصة */}
      <FloatingWhatsApp
        phone="201126947405"
        message="مرحباً، أريد الاستفسار عن تسجيل ملعبي في منصة ملعبي 🏟️"
        tooltip="تواصل معنا لتسجيل ملعبك"
      />
      {/* زر الاشتراك العائم المذهب */}
      <FloatingSubscription position="bottom-left" />
    </>
  );
}
export const dynamic = 'force-dynamic';
