'use client';

import { useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface RegistrationShellProps {
  children: React.ReactNode;
  appName: string;
}

/**
 * Shared Registration Shell
 * 
 * Borderless card-less layout — separation via background-color contrast,
 * drop-shadow, and whitespace only. No borders anywhere.
 * 
 * RTL layout auto-flips the entire form including field order and icon alignment.
 */
export default function RegistrationShell({ children, appName }: RegistrationShellProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ background: 'var(--bg-base)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[120px]"
          style={{ background: 'rgba(161,188,152,0.12)' }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[120px]"
          style={{ background: 'rgba(220,207,192,0.15)' }}
        />
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-md"
        style={{
          background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-md"
              style={{ background: 'linear-gradient(135deg, var(--sage-500), var(--sage-300))' }}
            >
              ض
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {appName}
            </span>
          </a>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 z-10">
        <div className="w-full max-w-[560px] mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
}