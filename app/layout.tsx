import { ReactNode } from 'react';
import { Cairo, Inter } from 'next/font/google';
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

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={`${cairo.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans transition-colors duration-300">
        {children}
      </body>
    </html>
  );
}
