'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  Upload,
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Camera,
  Scan,
  Users,
  Archive,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface MigrationStats {
  totalDocuments: number;
  digitized: number;
  verified: number;
  rejected: number;
  pendingReview: number;
  duplicateFound: number;
  reconciliationTickets: number;
}

interface BranchProgress {
  branchName: string;
  totalBoxes: number;
  scanned: number;
  verified: number;
  completionPercent: number;
}

interface Props {
  stats: MigrationStats;
  branchProgress: BranchProgress[];
  companyName: string;
}

const CHART_COLORS = ['#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA'];

export default function MigrationDashboard({
  stats,
  branchProgress,
  companyName,
}: Props) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const digitizationData = useMemo(
    () => [
      { name: isRtl ? 'مؤمن رقميًا' : 'Digitized', value: stats.digitized, color: '#34D399' },
      { name: isRtl ? 'تم التحقق' : 'Verified', value: stats.verified, color: '#60A5FA' },
      { name: isRtl ? 'قيد المراجعة' : 'Pending Review', value: stats.pendingReview, color: '#FBBF24' },
      { name: isRtl ? 'مرفوض' : 'Rejected', value: stats.rejected, color: '#F87171' },
    ],
    [stats, isRtl]
  );

  const completionRate = stats.totalDocuments > 0
    ? Math.round((stats.digitized / stats.totalDocuments) * 100)
    : 0;

  const verificationRate = stats.digitized > 0
    ? Math.round((stats.verified / stats.digitized) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-md border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              {isRtl ? 'إجمالي المستندات' : 'Total Documents'}
            </span>
          </div>
          <p className="mt-3 text-3xl font-black">{stats.totalDocuments}</p>
          <div className="mt-2 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {completionRate}% {isRtl ? 'مؤمن' : 'digitized'}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-md border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              {isRtl ? 'تم التحقق' : 'Verified'}
            </span>
          </div>
          <p className="mt-3 text-3xl font-black">{stats.verified}</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {verificationRate}% {isRtl ? 'معدل التحقق' : 'verification rate'}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-md border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              {isRtl ? 'المكررات' : 'Duplicates'}
            </span>
          </div>
          <p className="mt-3 text-3xl font-black">{stats.duplicateFound}</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {isRtl ? 'تم اكتشافها' : 'detected'}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-md border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span className="text-xs uppercase tracking-wider text-zinc-500">
              {isRtl ? 'تذاكر التسوية' : 'Reconciliation'}
            </span>
          </div>
          <p className="mt-3 text-3xl font-black">{stats.reconciliationTickets}</p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {isRtl ? 'بحاجة للمراجعة' : 'need review'}
          </p>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3 mb-5">
            <BarChart3 className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'تقدم الرقمنة' : 'Digitization Progress'}
              </p>
              <h3 className="text-lg font-black mt-1">
                {isRtl ? 'حالة المستندات' : 'Document Status'}
              </h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={digitizationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {digitizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.24)',
                    color: '#fff',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: 'rgba(148,163,184,0.9)', fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3 mb-5">
            <Archive className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
                {isRtl ? 'الفروع' : 'Branches'}
              </p>
              <h3 className="text-lg font-black mt-1">
                {isRtl ? 'تقدم كل فرع' : 'Per-Branch Progress'}
              </h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchProgress} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" horizontal={false} />
                <XAxis type="number" stroke="rgba(148,163,184,0.7)" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="branchName" stroke="rgba(148,163,184,0.7)" width={100} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, isRtl ? 'الإنجاز' : 'Completion']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148,163,184,0.24)', color: '#fff' }}
                />
                <Bar dataKey="completionPercent" name={isRtl ? 'الإنجاز' : 'Completion'} fill="#34D399" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Upload Scanner Section */}
      <section className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-3 mb-5">
          <Upload className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">
              {isRtl ? 'رفع المستندات' : 'Document Upload'}
            </p>
            <h3 className="text-lg font-black mt-1">
              {isRtl ? 'إدخال المسح الضوئي' : 'Scan Intake'}
            </h3>
          </div>
        </div>

        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 text-center hover:border-emerald-400 transition cursor-pointer">
          <Scan className="w-10 h-10 mx-auto text-zinc-400" />
          <p className="mt-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            {isRtl
              ? 'اسحب ملفات المسح الضوئي هنا أو انقر للرفع'
              : 'Drag scanned files here or click to upload'}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {isRtl ? 'PDF, TIFF, JPG, PNG - حتى 100 صفحة' : 'PDF, TIFF, JPG, PNG - up to 100 pages'}
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center gap-3 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition">
          <Camera className="w-6 h-6 text-emerald-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {isRtl ? 'التقاط صورة' : 'Capture Photo'}
            </p>
            <p className="text-[11px] text-emerald-600/70">
              {isRtl ? 'تصوير مستند باستخدام الكاميرا' : 'Scan document with camera'}
            </p>
          </div>
        </button>

        <button className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 p-4 flex items-center gap-3 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition">
          <Users className="w-6 h-6 text-blue-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              {isRtl ? 'التحقق البشري' : 'Human Review'}
            </p>
            <p className="text-[11px] text-blue-600/70">
              {isRtl ? 'مراجعة المستندات منخفضة الثقة' : 'Review low-confidence docs'}
            </p>
          </div>
        </button>

        <button className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 flex items-center gap-3 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition">
          <Archive className="w-6 h-6 text-amber-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {isRtl ? 'إدارة الصناديق' : 'Box Management'}
            </p>
            <p className="text-[11px] text-amber-600/70">
              {isRtl ? 'تتبع صناديق الأرشيف للتخلص' : 'Track archive boxes for disposal'}
            </p>
          </div>
        </button>
      </section>
    </div>
  );
}