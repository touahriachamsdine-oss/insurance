import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import ThemeInitializer from '@/components/ThemeInitializer';

export const metadata = {
  title: 'ضمان | Daman Insurance',
  description: 'منصة ضمان لإدارة التأمينات في الجزائر | Daman Algerian Insurance Management Platform',
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="min-h-full flex flex-col">
      <ThemeInitializer />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
