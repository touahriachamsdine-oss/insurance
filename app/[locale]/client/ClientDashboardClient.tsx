'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';

interface Contract {
  id: string;
  contract_number: string;
  type: string;
  plan: string;
  status: string;
  coverage_amount: string;
  monthly_premium: string;
  start_date: string;
  end_date: string;
  company_name_ar: string;
  company_name_en: string;
}

interface Claim {
  id: string;
  claim_number: string;
  contract_id: string;
  status: string;
  incident_date: string;
  claimed_amount: string;
  submitted_at: string;
  policy_number: string;
  company_name_ar: string;
  company_name_en: string;
}

interface ClientDashboardClientProps {
  user: {
    id: string;
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    role: string;
  };
  contracts: Contract[];
  claims: Claim[];
}

function claimStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    approved: 'Approved',
    rejected: 'Rejected',
    submitted: 'Submitted',
    processing: 'Processing',
    open: 'Open',
  };
  return labels[status] || status;
}

export default function ClientDashboardClient({ user, contracts, claims }: ClientDashboardClientProps) {
  const tCommon = useTranslations('common');
  const tContracts = useTranslations('contracts');
  const tClaims = useTranslations('claims');
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === 'ar';

  const activeContracts = contracts.filter((contract) => contract.status === 'active');
  const openClaims = claims.filter((claim) => claim.status !== 'rejected' && claim.status !== 'approved');
  const approvedClaimsCount = claims.filter((claim) => claim.status === 'approved').length;
  const rejectedClaimsCount = claims.filter((claim) => claim.status === 'rejected').length;
  const pendingClaimsCount = claims.filter((claim) => claim.status !== 'approved' && claim.status !== 'rejected').length;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{tCommon('clientDashboardTitle')}</p>
            <h1 className="text-3xl font-black mt-2">{isRtl ? user.fullNameAr : user.fullNameEn}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">{tCommon('insuranceDashboardNote')}</p>
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
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tCommon('insurancePolicyCount')}</p>
            <p className="text-4xl font-black mt-4">{contracts.length}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{tCommon('insurancePolicies')}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tCommon('activePolicies')}</p>
            <p className="text-4xl font-black mt-4">{activeContracts.length}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{tCommon('insurancePolicies')}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tCommon('insuranceClaimCount')}</p>
            <p className="text-4xl font-black mt-4">{claims.length}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{tCommon('insuranceClaims')}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tCommon('openClaims')}</p>
            <p className="text-4xl font-black mt-4">{openClaims.length}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{tCommon('insuranceOpenClaimsMessage')}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-[#778873]/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#6f7b67]">{tCommon('insuranceRecentPolicies')}</p>
                <h2 className="text-xl font-bold mt-2">{tCommon('activePolicies')}</h2>
              </div>
              <span className="text-xs font-semibold text-[#778873]">{activeContracts.length} {tCommon('insurancePolicyCount')}</span>
            </div>
            {activeContracts.length === 0 ? (
              <p className="text-sm text-[#6f7b67]">{tCommon('insuranceNoPolicies')}</p>
            ) : (
              <div className="space-y-4">
                {activeContracts.slice(0, 3).map((contract) => (
                  <div key={contract.id} className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{isRtl ? contract.company_name_ar : contract.company_name_en}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{contract.contract_number}</p>
                    <p className="text-sm mt-3">{tCommon('insurancePlanLabel')}: {contract.plan}</p>
                    <p className="text-sm mt-1">{tCommon('insurancePolicyStatus')}: {contract.status}</p>
                    <p className="text-sm mt-1">{tCommon('insurancePolicyPeriod')}: {contract.start_date} → {contract.end_date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-[#A1BC98]/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#6f7b67]">{tCommon('insuranceRecentClaims')}</p>
                <h2 className="text-xl font-bold mt-2">{tCommon('openClaims')}</h2>
              </div>
              <span className="text-xs font-semibold text-[#A1BC98]">{openClaims.length} {tCommon('insuranceClaimCount')}</span>
            </div>
            {openClaims.length === 0 ? (
              <p className="text-sm text-[#6f7b67]">{tCommon('insuranceNoClaims')}</p>
            ) : (
              <div className="space-y-4">
                {openClaims.slice(0, 3).map((claim) => (
                  <div key={claim.id} className="rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{isRtl ? claim.company_name_ar : claim.company_name_en}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{claim.claim_number}</p>
                    <p className="text-sm mt-3">{tCommon('insuranceClaimStatus')}: {claimStatusLabel(claim.status)}</p>
                    <p className="text-sm mt-1">{tCommon('insuranceIncidentDate')}: {claim.incident_date}</p>
                    <p className="text-sm mt-1">{tCommon('insuranceClaimAmountDzd')}: {claim.claimed_amount} DZD</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}