'use client';

import React, { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import {
  Layers,
  CheckCircle,
  FileCheck2,
  Clock,
  TrendingUp,
  BarChart3,
  LogOut,
  FolderOpen,
  User,
  ShieldCheck,
  AlertCircle,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface Claim {
  id: string;
  claim_number: string;
  status: string;
  incident_date: string;
  claimed_amount: string;
  policy_number: string;
  company_name_ar: string;
  company_name_en: string;
  description?: string;
  estimated_amount?: string;
  submitted_at?: string;
  client_name_ar?: string;
  client_name_en?: string;
  client_email?: string;
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

  const CHART_COLORS = [
    '#778873', // Sage / Olive
    '#b39c84', // Earth Clay
    '#a89875', // Ochre / Gold
    '#4f4830', // Deep Bronze
    '#a99f88', // Dried Moss
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Memoize Quick Stats
  const stats = useMemo(() => {
    return {
      total: claims.length,
      pending: claims.filter(c => c.status === 'pending').length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length,
      underAssessment: claims.filter(c => c.status === 'under_assessment' || c.status === 'assessing').length,
    };
  }, [claims]);

  // Memoize status distribution for Pie Chart
  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    claims.forEach((claim) => {
      const statusKey = claim.status || 'pending';
      map[statusKey] = (map[statusKey] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => {
      let label = name;
      if (name === 'pending') label = isRtl ? 'قيد الانتظار' : 'Pending';
      else if (name === 'approved') label = isRtl ? 'تمت الموافقة' : 'Approved';
      else if (name === 'rejected') label = isRtl ? 'مرفوض' : 'Rejected';
      else if (name === 'under_assessment' || name === 'assessing') label = isRtl ? 'قيد التقييم' : 'Under Assessment';
      
      return { name: label, value };
    });
  }, [claims, isRtl]);

  // Memoize company claim distribution for Bar Chart
  const companyClaimDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    claims.forEach((claim) => {
      const companyName = isRtl ? claim.company_name_ar : claim.company_name_en;
      const amount = parseFloat(claim.claimed_amount) || 0;
      map[companyName] = (map[companyName] || 0) + amount;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value
    }));
  }, [claims, isRtl]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30';
      case 'rejected':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30';
      default:
        return 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-650 dark:text-zinc-350 border border-zinc-200/50 dark:border-zinc-700/30';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'pending') return isRtl ? 'معلق' : 'Pending';
    if (status === 'approved') return isRtl ? 'مقبول' : 'Approved';
    if (status === 'rejected') return isRtl ? 'مرفوض' : 'Rejected';
    return isRtl ? 'قيد الدراسة' : 'Under Assessment';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-400 font-extrabold">{tCommon('assessorDashboardTitle')}</p>
            <h1 className="text-3xl font-black mt-2">{isRtl ? user.fullNameAr : user.fullNameEn}</h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button onClick={handleLogout} className="px-4 py-2 rounded-full bg-emerald-700 text-white font-semibold hover:bg-emerald-600 transition flex items-center gap-2 cursor-pointer border-none">
              <LogOut className="w-4 h-4" />
              <span>{tCommon('logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{isRtl ? 'إجمالي المطالبات' : 'Total Assigned'}</span>
            <p className="text-3xl font-black mt-2 text-zinc-900 dark:text-white">{stats.total}</p>
            <div className="flex items-center gap-1 mt-2 text-xxs text-zinc-400 font-medium">
              <FolderOpen className="w-3.5 h-3.5" />
              {isRtl ? 'المطالبات الموكلة للتقييم' : 'Total claims in file'}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{isRtl ? 'المطالبات المعلقة' : 'Pending Review'}</span>
            <p className="text-3xl font-black mt-2 text-amber-600 dark:text-amber-400">{stats.pending}</p>
            <div className="flex items-center gap-1 mt-2 text-xxs text-amber-600 dark:text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              {isRtl ? 'في انتظار الإجراء' : 'Awaiting action'}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{isRtl ? 'قيد التقييم' : 'Under Assessment'}</span>
            <p className="text-3xl font-black mt-2 text-blue-600 dark:text-blue-400">{stats.underAssessment}</p>
            <div className="flex items-center gap-1 mt-2 text-xxs text-blue-600 dark:text-blue-400 font-bold">
              <Activity className="w-3.5 h-3.5" />
              {isRtl ? 'جاري التحقق والمراجعة' : 'Actively reviewing'}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{isRtl ? 'تمت الموافقة' : 'Approved Claims'}</span>
            <p className="text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
            <div className="flex items-center gap-1 mt-2 text-xxs text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              {isRtl ? 'مطالبات تمت تسويتها' : 'Settled successfully'}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{isRtl ? 'المرفوضة' : 'Rejected Claims'}</span>
            <p className="text-3xl font-black mt-2 text-rose-600 dark:text-rose-400">{stats.rejected}</p>
            <div className="flex items-center gap-1 mt-2 text-xxs text-rose-600 dark:text-rose-400 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              {isRtl ? 'مطالبات غير مقبولة' : 'Declined claims'}
            </div>
          </div>
        </div>

        {/* Visual Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Claim Status Share */}
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                {isRtl ? 'حالة المطالبات الموكلة' : 'Claims Status Distribution'}
              </h4>
              {claims.length > 0 ? (
                <div className="h-[240px] w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="h-[200px] w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148,163,184,0.24)', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 grid gap-2">
                    {statusDistribution.map((slice, index) => (
                      <div key={slice.name} className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span>{slice.name}</span>
                        </div>
                        <span className="text-zinc-400 dark:text-zinc-550">{slice.value} ({Math.round((slice.value / claims.length) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-xs text-zinc-400">
                  {tCommon('noSufficientDataForChart')}
                </div>
              )}
            </div>
          </div>

          {/* Claimed Amount by Insurance Company */}
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                {isRtl ? 'حجم المطالبات المالية حسب الشركاء' : 'Claimed Volume by Company (DZD)'}
              </h4>
              {claims.length > 0 ? (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyClaimDistribution} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(148,163,184,0.5)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => [`${value} DZD`, isRtl ? 'المطالبة' : 'Claimed']} contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148,163,184,0.24)', color: '#fff' }} />
                      <Bar dataKey="value" fill="#778873" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-xs text-zinc-400">
                  {tCommon('noSufficientDataForChart')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Claims Table / Queue */}
        <section className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/5 border border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-500 font-extrabold">{tCommon('assessorReviewQueue')}</p>
              <h2 className="text-xl font-bold mt-2 text-zinc-900 dark:text-white">{tCommon('assessorOpenClaims')}</h2>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              {claims.length} {tCommon('insuranceClaims')}
            </span>
          </div>

          {claims.length === 0 ? (
            <p className="text-sm text-zinc-500 mt-6">{tCommon('assessorNoClaims')}</p>
          ) : (
            <div className="mt-6 grid gap-6">
              {claims.map((claim) => (
                <div key={claim.id} className="rounded-2xl border border-zinc-250/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/30 p-5 hover:border-zinc-400 dark:hover:border-zinc-700 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-extrabold">
                        {isRtl ? claim.company_name_ar : claim.company_name_en}
                      </p>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                        {tCommon('insurancePolicyLabel')}: {claim.policy_number}
                      </h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">ID: {claim.claim_number}</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(claim.status)}`}>
                        {getStatusLabel(claim.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Client Details */}
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-zinc-400 dark:text-zinc-550 block mb-1">{isRtl ? 'صاحب المطالبة' : 'Policyholder'}</span>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-250">
                          {isRtl ? claim.client_name_ar : claim.client_name_en}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 block ml-6">{claim.client_email}</span>
                    </div>

                    {/* Financial details */}
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-zinc-400 dark:text-zinc-550 block mb-1">{isRtl ? 'المبلغ المطلوب' : 'Claimed Amount'}</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400 text-lg">
                        {parseFloat(claim.claimed_amount).toLocaleString()} DZD
                      </span>
                      {claim.estimated_amount && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {isRtl ? 'المقدر:' : 'Estimated:'} {parseFloat(claim.estimated_amount).toLocaleString()} DZD
                        </p>
                      )}
                    </div>

                    {/* Timeline */}
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-zinc-400 dark:text-zinc-550 block mb-1">{isRtl ? 'تاريخ الحادث و التقديم' : 'Timeline'}</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        <strong>{tCommon('insuranceIncidentDate')}:</strong> {claim.incident_date}
                      </p>
                      {claim.submitted_at && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          <strong>{isRtl ? 'تاريخ التقديم:' : 'Submitted:'}</strong> {new Date(claim.submitted_at).toLocaleDateString(locale)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Claim Description */}
                  {claim.description && (
                    <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/40">
                      <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block mb-1">
                        {isRtl ? 'وصف الحادث' : 'Incident Details / Description'}
                      </span>
                      <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed">
                        {claim.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

