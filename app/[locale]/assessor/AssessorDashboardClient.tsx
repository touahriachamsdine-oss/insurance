'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface Claim {
  id: string;
  claim_number: string;
  status: string;
  incident_date: string;
  claimed_amount: string;
  policy_number: string;
  company_name_ar: string;
  company_name_en: string;
}

interface AssessorDashboardClientProps {
  user: {
    id: string;
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    role: string;
  };
  claims: Claim[];
}

export default function AssessorDashboardClient({ user, claims }: AssessorDashboardClientProps) {
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">{tCommon('assessorDashboardTitle')}</p>
            <h1 className="text-3xl font-black mt-2">{isRtl ? user.fullNameAr : user.fullNameEn}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button onClick={handleLogout} className="px-4 py-2 rounded-full bg-emerald-700 text-white font-semibold hover:bg-emerald-600 transition">
              {tCommon('logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <section className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-600">{tCommon('assessorReviewQueue')}</p>
              <h2 className="text-xl font-bold mt-2">{tCommon('assessorOpenClaims')}</h2>
            </div>
            <span className="text-xs font-semibold text-[#A1BC98]">{claims.length} {tCommon('insuranceClaims')}</span>
          </div>

          {claims.length === 0 ? (
            <p className="text-sm text-[#6f7b67] mt-6">{tCommon('assessorNoClaims')}</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {claims.map((claim) => (
                <div key={claim.id} className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{isRtl ? claim.company_name_ar : claim.company_name_en}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{claim.claim_number}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">{claim.status}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <div>{tCommon('insuranceIncidentDate')}: {claim.incident_date}</div>
                    <div>{tCommon('insuranceClaimAmountDzd')}: {claim.claimed_amount} DZD</div>
                  </div>
                  <p className="text-sm mt-3 text-zinc-900 dark:text-white">{tCommon('insurancePolicyNumber')}: {claim.policy_number}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
