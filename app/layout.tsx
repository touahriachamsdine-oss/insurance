import { ReactNode } from 'react';
import { Cairo, Inter } from 'next/font/google';
import type { Viewport } from 'next';
import './globals.css';

type Props = {
  children: ReactNode;
};

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['latin', 'arabic'],
  weight: ['300', '400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

// ✅ Proper mobile viewport with safe-area support (prevents iOS over-scroll gaps)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#059669',
};

export const metadata = {
  title: 'أضمن لي | Insure Me',
  description: 'منصة أضمن لي لإدارة التأمينات في الجزائر',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'أضمن لي',
  },
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={`${cairo.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
