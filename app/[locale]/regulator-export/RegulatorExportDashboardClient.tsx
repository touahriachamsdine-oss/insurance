'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { FileText, Download, LogOut, AlertTriangle, Upload, CheckCircle, Clock } from 'lucide-react';

interface Company {
  id: string;
  nameAr: string;
  nameEn: string;
  code: string;
  licenseNumber: string;
}

interface AggregateData {
  total_policies: number;
  total_premium: number;
  total_claims: number;
  total_payouts: number;
  total_clients: number;
}

interface Filing {
  id: string;
  period: string;
  report_type: string;
  generated_at: string;
  status: string;
}

interface Props {
  company: Company;
  aggregateData: AggregateData;
  previousFilings: Filing[];
  user: { id: string; email: string; fullNameAr: string; fullNameEn: string; role: string };
}

export default function RegulatorExportDashboardClient({
  company,
  aggregateData,
  previousFilings,
  user,
}: Props) {
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();

  const txt = (ar: string, fr: string, en: string) => {
    if (locale === 'ar') return ar;
    if (locale === 'fr') return fr;
    return en;
  };

  const [selectedPeriod, setSelectedPeriod] = useState('Q1-2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);
  const [solvencyStatus, setSolvencyStatus] = useState<{
    currentRatio: number;
    status: string;
    capitalAvailable: number;
    capitalRequired: number;
  } | null>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setGenerationResult(null);

    try {
      const res = await fetch('/api/regulator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id, period: selectedPeriod }),
      });
      const data = await res.json();
      if (data.success) {
        setGenerationResult(
          txt(
            `تم إنشاء التقرير بنجاح. معرف التقرير: ${data.reportId}`,
            `Rapport généré avec succès. ID: ${data.reportId}`,
            `Report generated successfully. Report ID: ${data.reportId}`
          )
        );
      } else {
        setGenerationResult(txt('فشل إنشاء التقرير', 'Échec de la génération du rapport', 'Report generation failed'));
      }
    } catch (error) {
      setGenerationResult(txt('حدث خطأ أثناء إنشاء التقرير', 'Erreur lors de la génération du rapport', 'Error generating report'));
    }
    setIsGenerating(false);
  };

  const checkSolvency = async () => {
    const res = await fetch(`/api/regulator/solvency?companyId=${company.id}`);
    const data = await res.json();
    if (data.success) {
      setSolvencyStatus(data.solvency);
    }
  };

  const solvencyColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-emerald-600';
      case 'warning': return 'text-amber-600';
      case 'breach': return 'text-rose-600';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              {txt('التقارير التنظيمية', 'Rapports Réglementaires', 'Regulatory Reporting')}
            </p>
            <h1 className="text-3xl font-black mt-2">
              {txt('تصدير هيئة الرقابة', 'Portail d\'Exportation Réglementaire', 'Regulator Export Portal')}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {locale === 'ar' ? company.nameAr : company.nameEn} ({company.code})
            </p>
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

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              {isRtl ? 'إجمالي الوثائق' : 'Total Policies'}
            </p>
            <p className="mt-2 text-3xl font-black">{aggregateData.total_policies}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              {isRtl ? 'إجمالي الأقساط' : 'Total Premium'}
            </p>
            <p className="mt-2 text-3xl font-black">
              {new Intl.NumberFormat('en-US').format(aggregateData.total_premium)} DZD
            </p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              {isRtl ? 'المطالبات' : 'Claims'}
            </p>
            <p className="mt-2 text-3xl font-black">{aggregateData.total_claims}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              {isRtl ? 'التعويضات' : 'Payouts'}
            </p>
            <p className="mt-2 text-3xl font-black">
              {new Intl.NumberFormat('en-US').format(aggregateData.total_payouts)} DZD
            </p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              {isRtl ? 'العملاء' : 'Clients'}
            </p>
            <p className="mt-2 text-3xl font-black">{aggregateData.total_clients}</p>
          </div>
        </section>

        {/* Report Generation */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-3 mb-5">
              <FileText className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                  {isRtl ? 'تقارير هيئة الرقابة' : 'UAR Reports'}
                </p>
                <h3 className="text-xl font-black mt-1">
                  {isRtl ? 'إنشاء تقرير جديد' : 'Generate New Report'}
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {isRtl ? 'الفترة' : 'Period'}
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm focus:border-emerald-700 focus:outline-none dark:bg-zinc-950 dark:text-white"
                >
                  <option value="Q1-2026">Q1 2026 (January - March)</option>
                  <option value="Q2-2026">Q2 2026 (April - June)</option>
                  <option value="Q3-2026">Q3 2026 (July - September)</option>
                  <option value="Q4-2026">Q4 2026 (October - December)</option>
                  <option value="Annual-2025">Annual 2025</option>
                </select>
              </label>

              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    {isRtl ? 'جارٍ الإنشاء...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {isRtl ? 'إنشاء التقرير' : 'Generate Report'}
                  </>
                )}
              </button>

              {generationResult && (
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {generationResult}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Solvency Monitor */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                  {isRtl ? 'مراقبة الملاءة' : 'Solvency Monitor'}
                </p>
                <h3 className="text-xl font-black mt-1">
                  {isRtl ? 'نسبة الملاءة المالية' : 'Solvency Ratio'}
                </h3>
              </div>
            </div>

            {solvencyStatus ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {isRtl ? 'نسبة الملاءة' : 'Current Ratio'}
                    </span>
                    <span className={`text-2xl font-black ${solvencyColor(solvencyStatus.status)}`}>
                      {solvencyStatus.currentRatio}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-zinc-500">
                      {isRtl ? 'الحد الأدنى' : 'Minimum Required'}
                    </span>
                    <span className="text-sm font-semibold">1.0</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-500">
                      {isRtl ? 'رأس المال المتاح' : 'Capital Available'}
                    </span>
                    <span className="text-sm font-semibold">
                      {new Intl.NumberFormat('en-US').format(solvencyStatus.capitalAvailable)} DZD
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-500">
                      {isRtl ? 'رأس المال المطلوب' : 'Capital Required'}
                    </span>
                    <span className="text-sm font-semibold">
                      {new Intl.NumberFormat('en-US').format(solvencyStatus.capitalRequired)} DZD
                    </span>
                  </div>
                </div>
                <div className={`rounded-2xl p-3 text-sm font-semibold text-center ${
                  solvencyStatus.status === 'compliant' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' :
                  solvencyStatus.status === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' :
                  'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
                }`}>
                  {isRtl
                    ? solvencyStatus.status === 'compliant' ? 'متوافق مع المتطلبات التنظيمية'
                    : solvencyStatus.status === 'warning' ? 'قريب من الحد الأدنى - انتباه مطلوب'
                    : 'غير متوافق - إجراء فوري مطلوب'
                    : solvencyStatus.status === 'compliant' ? 'Compliant with regulatory requirements'
                    : solvencyStatus.status === 'warning' ? 'Near minimum threshold - attention required'
                    : 'Non-compliant - immediate action required'}
                </div>
              </div>
            ) : (
              <button
                onClick={checkSolvency}
                className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 px-5 py-3 text-sm font-semibold hover:bg-zinc-300 transition"
              >
                <Upload className="w-4 h-4" />
                {isRtl ? 'حساب نسبة الملاءة' : 'Check Solvency Ratio'}
              </button>
            )}
          </div>
        </section>

        {/* Previous Filings */}
        <section className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3 mb-5">
            <Clock className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'التقارير السابقة' : 'Previous Filings'}
              </p>
              <h3 className="text-xl font-black mt-1">
                {isRtl ? 'أرشيف التقارير التنظيمية' : 'Regulatory Filing Archive'}
              </h3>
            </div>
          </div>
          {previousFilings.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isRtl ? 'لا توجد تقارير سابقة' : 'No previous filings found'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[11px] tracking-[0.18em]">
                  <tr>
                    <th className="px-4 py-3">{isRtl ? 'الفترة' : 'Period'}</th>
                    <th className="px-4 py-3">{isRtl ? 'النوع' : 'Type'}</th>
                    <th className="px-4 py-3">{isRtl ? 'تاريخ الإنشاء' : 'Generated'}</th>
                    <th className="px-4 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {previousFilings.map((filing) => (
                    <tr key={filing.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                      <td className="px-4 py-4 font-semibold">{filing.period}</td>
                      <td className="px-4 py-4 text-zinc-500">{filing.report_type}</td>
                      <td className="px-4 py-4 text-zinc-500">
                        {new Date(filing.generated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                          filing.status === 'submitted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {filing.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}