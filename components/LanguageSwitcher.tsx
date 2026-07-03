'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();

  const toggleLanguage = () => {
    const nextLocale = currentLocale === 'ar' ? 'fr' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="rounded-full bg-white/80 dark:bg-zinc-900/80 text-xs font-bold text-zinc-700 dark:text-zinc-200 px-4 py-2 shadow-sm transition duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer border-none"
    >
      {currentLocale === 'ar' ? 'Français' : 'العربية'}
    </button>
  );
}
