'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';

const LOCALES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ar', label: 'العربية', short: 'ع' },
  { code: 'fr', label: 'Français', short: 'FR' },
] as const;

type LocaleCode = typeof LOCALES[number]['code'];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale() as LocaleCode;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  const handleSelect = (code: LocaleCode) => {
    setOpen(false);
    if (code !== currentLocale) {
      router.replace(pathname, { locale: code });
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-bold text-zinc-700 dark:text-zinc-200 px-3.5 py-2 shadow-sm transition duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
      >
        <span className="text-sm leading-none">{current.short}</span>
        <svg
          className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {LOCALES.map((locale) => (
            <li key={locale.code}>
              <button
                role="option"
                aria-selected={locale.code === currentLocale}
                type="button"
                onClick={() => handleSelect(locale.code)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors duration-150
                  ${locale.code === currentLocale
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <span className="w-6 text-center font-bold text-xs text-zinc-400">
                  {locale.short}
                </span>
                <span>{locale.label}</span>
                {locale.code === currentLocale && (
                  <svg className="ml-auto w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
