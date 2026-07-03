'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import {
  Users2,
  DollarSign,
  FileText,
  LogOut,
  TrendingUp,
  Camera,
  Handshake,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface Agent {
  id: string;
  full_name_ar: string;
  full_name_en: string;
  email: string;
  phone: string;
  wilaya: string;
  client_count: number;
  policy_count: number;
  total_premium: string;
}

interface Handoff {
  id: string;
  client_name: string;
  client_phone: string;
  wilaya: string;
  product_type: string;
  notes: string;
  created_at: string;
  agent_name_ar: string;
  agent_name_en: string;
}

interface Props {
  user: { id: string; email: string; fullNameAr: string; fullNameEn: string; role: string };
  agents: Agent[];
  pendingHandoffs: Handoff[];
  digitizationStats: { total_scanned: number; verified: number; pending: number };
}

export default function AgentNetworkDashboardClient({
  user,
  agents,
  pendingHandoffs,
  digitizationStats,
}: Props) {
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();

  const totalPremium = useMemo(
    () => agents.reduce((sum, a) => sum + Number(a.total_premium), 0),
    [agents]
  );

  const agentPerformanceData = useMemo(
    () =>
      agents.slice(0, 10).map((a) => ({
        name: isRtl ? a.full_name_ar : a.full_name_en,
        premium: Number(a.total_premium),
        clients: Number(a.client_count),
      })),
    [agents, isRtl]
  );

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              {isRtl ? 'شبكة الوكلاء' : 'Agent Network'}
            </p>
            <h1 className="text-3xl font-black mt-2">
              {isRtl ? 'لوحة تحكم الوكلاء' : 'Agent Network Dashboard'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full bg-emerald-700 text-white font-semibold hover:bg-emerald-600 transition"
            >
              {tCommon('logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-3">
              <Users2 className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'الوكلاء' : 'Agents'}
              </p>
            </div>
            <p className="mt-4 text-4xl font-black">{agents.length}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500">
              {isRtl ? 'إجمالي الوكلاء النشطين' : 'Total Active Agents'}
            </p>
          </div>

          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'إجمالي الأقساط' : 'Total Premium'}
              </p>
            </div>
            <p className="mt-4 text-4xl font-black">
              {new Intl.NumberFormat('en-US').format(totalPremium)} DZD
            </p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500">
              {isRtl ? 'الأقساط المدارة' : 'Managed Premium'}
            </p>
          </div>

          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'المسح الميداني' : 'Field Digitization'}
              </p>
            </div>
            <p className="mt-4 text-4xl font-black">{digitizationStats.total_scanned}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500">
              {isRtl ? 'مستند تم مسحه' : 'Documents Scanned'}
            </p>
          </div>

          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-3">
              <Handshake className="w-6 h-6 text-zinc-900 dark:text-white" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'تحويلات العملاء' : 'Client Hand-offs'}
              </p>
            </div>
            <p className="mt-4 text-4xl font-black">{pendingHandoffs.length}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-amber-500">
              {isRtl ? 'بانتظار المعالجة' : 'Pending Processing'}
            </p>
          </div>
        </section>

        {/* Agent Performance Chart */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-3 mb-5">
              <BarChart3 className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                  {isRtl ? 'أداء الوكلاء' : 'Agent Performance'}
                </p>
                <h3 className="text-xl font-black mt-1">
                  {isRtl ? 'الأقساط حسب الوكيل' : 'Premium by Agent'}
                </h3>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(148,163,184,0.7)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(148,163,184,0.7)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: 12,
                      border: '1px solid rgba(148,163,184,0.24)',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="premium" name={isRtl ? 'القسط' : 'Premium'} fill="#34D399" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Hand-offs */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-3 mb-5">
              <Handshake className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                  {isRtl ? 'تحويلات معلقة' : 'Pending Hand-offs'}
                </p>
                <h3 className="text-xl font-black mt-1">
                  {isRtl ? 'قائمة الانتظار' : 'Queue'}
                </h3>
              </div>
            </div>
            {pendingHandoffs.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isRtl ? 'لا توجد تحويلات معلقة' : 'No pending hand-offs'}
              </p>
            ) : (
              <div className="space-y-3">
                {pendingHandoffs.slice(0, 5).map((h) => (
                  <div
                    key={h.id}
                    className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 p-4 border border-zinc-200 dark:border-zinc-800"
                  >
                    <p className="font-semibold text-zinc-900 dark:text-white">{h.client_name}</p>
                    <p className="text-xs text-zinc-500">{h.client_phone}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-zinc-400">{h.wilaya}</span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {h.product_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Agent List */}
        <section className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3 mb-5">
            <Users2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'قائمة الوكلاء' : 'Agent Directory'}
              </p>
              <h3 className="text-xl font-black mt-1">
                {isRtl ? 'جميع الوكلاء' : 'All Agents'}
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[11px] tracking-[0.18em]">
                <tr>
                  <th className="px-4 py-3">{isRtl ? 'الاسم' : 'Name'}</th>
                  <th className="px-4 py-3">{isRtl ? 'البريد' : 'Email'}</th>
                  <th className="px-4 py-3">{isRtl ? 'الولاية' : 'Wilaya'}</th>
                  <th className="px-4 py-3">{isRtl ? 'العملاء' : 'Clients'}</th>
                  <th className="px-4 py-3">{isRtl ? 'القسط' : 'Premium'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                    <td className="px-4 py-4 font-semibold">
                      {isRtl ? agent.full_name_ar : agent.full_name_en}
                    </td>
                    <td className="px-4 py-4 text-zinc-500">{agent.email}</td>
                    <td className="px-4 py-4 text-zinc-500">{agent.wilaya}</td>
                    <td className="px-4 py-4">{agent.client_count}</td>
                    <td className="px-4 py-4 font-bold">
                      {new Intl.NumberFormat('en-US').format(Number(agent.total_premium))} DZD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Digitization Stats */}
        <section className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3 mb-5">
            <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'الرقمنة الميدانية' : 'Field Digitization'}
              </p>
              <h3 className="text-xl font-black mt-1">
                {isRtl ? 'تقدم المسح' : 'Scan Progress'}
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{digitizationStats.total_scanned}</p>
              <p className="text-xs text-zinc-500 mt-2">{isRtl ? 'تم المسح' : 'Scanned'}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 p-4 text-center">
              <p className="text-3xl font-black text-blue-600">{digitizationStats.verified}</p>
              <p className="text-xs text-zinc-500 mt-2">{isRtl ? 'تم التحقق' : 'Verified'}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 p-4 text-center">
              <p className="text-3xl font-black text-amber-600">{digitizationStats.pending}</p>
              <p className="text-xs text-zinc-500 mt-2">{isRtl ? 'قيد الانتظار' : 'Pending'}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}