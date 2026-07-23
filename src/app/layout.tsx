import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider } from '@/hooks/useSession';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080E14',
};

export const metadata: Metadata = {
  title: {
    default: 'منصة ملعبي | حجز ملاعب كرة القدم',
    template: '%s | ملعبي'
  },
  description: 'المنصة الاحترافية الأولى لحجز ملاعب كرة القدم وإدارتها. أنشئ موقعك الإلكتروني الخاص بملعبك خلال دقيقة واحدة بدون كود.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'منصة ملعبي | حجز ملاعب كرة القدم',
    description: 'المنصة الاحترافية الأولى لحجز ملاعب كرة القدم وإدارتها. أنشئ موقعك الإلكتروني الخاص بملعبك خلال دقيقة واحدة بدون كود.',
    type: 'website',
    locale: 'ar_EG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'منصة ملعبي | حجز ملاعب كرة القدم',
    description: 'المنصة الاحترافية الأولى لحجز ملاعب كرة القدم وإدارتها. أنشئ موقعك الإلكتروني الخاص بملعبك خلال دقيقة واحدة بدون كود.',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
