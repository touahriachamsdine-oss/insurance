'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import {
  Briefcase,
  DollarSign,
  Users2,
  FileText,
  Mail,
  Search,
  Plus,
  LogOut,
  Activity,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ClipboardList
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
  Legend
} from 'recharts';

interface Contract {
  id: string;
  contract_number: string;
  type: string;
  plan: string;
  status: string;
  coverage_amount: string;
  monthly_premium: string;
  created_at: string;
  client_id: string;
  client_name_ar: string;
  client_name_en: string;
  client_email: string;
  client_phone: string;
}

interface Client {
  id: string;
  full_name_ar: string;
  full_name_en: string;
  email: string;
  phone: string;
}

interface Summary {
  totalContracts: number;
  uniqueClients: number;
  activeContracts: number;
  pendingQuotes: number;
  totalPremium: number;
}

interface BrokerDashboardClientProps {
  user: {
    id: string;
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    role: string;
  };
  company: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  };
  summary: Summary;
  contracts: Contract[];
  clients: Client[];
}

interface QuoteDraft {
  clientId: string;
  coverageAmount: string;
  monthlyPremium: string;
  deductible: string;
  notes: string;
}

interface QuoteRecord {
  id: string;
  contractNumber: string;
  clientName: string;
  premium: string;
  createdAt: string;
}

export default function BrokerDashboardClient({ user, company, summary, contracts, clients }: BrokerDashboardClientProps) {
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const router = useRouter();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft>({
    clientId: '',
    coverageAmount: '',
    monthlyPremium: '',
    deductible: '',
    notes: ''
  });
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [quoteUploadFile, setQuoteUploadFile] = useState<File | null>(null);
  const [quoteUploadMessage, setQuoteUploadMessage] = useState<string | null>(null);
  const [quoteUploadRows, setQuoteUploadRows] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  const recentPipeline = useMemo(() => {
    return contracts.slice(0, 8);
  }, [contracts]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = { active: 0, pending: 0, cancelled: 0, other: 0 };
    contracts.forEach((contract) => {
      if (counts[contract.status] !== undefined) {
        counts[contract.status] += 1;
      } else {
        counts.other += 1;
      }
    });
    return [
      { name: isRtl ? 'نشط' : 'Active', value: counts.active },
      { name: isRtl ? 'معلق' : 'Pending', value: counts.pending },
      { name: isRtl ? 'ملغي' : 'Cancelled', value: counts.cancelled },
      { name: isRtl ? 'أخرى' : 'Other', value: counts.other }
    ];
  }, [contracts, isRtl]);

  const monthlyPremiumTrend = useMemo(() => {
    const months = [
      { name: isRtl ? 'جانفي' : 'Jan', value: 0 },
      { name: isRtl ? 'فيفري' : 'Feb', value: 0 },
      { name: isRtl ? 'مارس' : 'Mar', value: 0 },
      { name: isRtl ? 'أفريل' : 'Apr', value: 0 },
      { name: isRtl ? 'ماي' : 'May', value: 0 },
      { name: isRtl ? 'جوان' : 'Jun', value: 0 },
      { name: isRtl ? 'جويلية' : 'Jul', value: 0 }
    ];
    contracts.forEach((contract) => {
      const monthIndex = new Date(contract.created_at).getMonth();
      if (monthIndex >= 0 && monthIndex < months.length) {
        months[monthIndex].value += Number(contract.monthly_premium) || 0;
      }
    });
    return months;
  }, [contracts, isRtl]);

  const topClientPremium = useMemo(() => {
    const map: Record<string, number> = {};
    contracts.forEach((contract) => {
      const name = isRtl ? contract.client_name_ar : contract.client_name_en;
      map[name] = (map[name] || 0) + Number(contract.monthly_premium || 0);
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [contracts, isRtl]);

  const chartColors = ['#34D399', '#FBBF24', '#F87171', '#60A5FA'];

  const handleQuoteFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setQuoteUploadFile(file);
    setQuoteUploadMessage(null);
    setQuoteUploadRows(0);

    if (!file) {
      return;
    }

    const text = await file.text();
    const rows = text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
    setQuoteUploadRows(rows);
    setQuoteUploadMessage(isRtl ? `تم تحميل الملف بنجاح: ${file.name}` : `Uploaded file successfully: ${file.name}`);
  };

  const handleSubmitQuoteUpload = () => {
    if (!quoteUploadFile) {
      setQuoteUploadMessage(isRtl ? 'يرجى تحديد ملف عرض.' : 'Please select a quote file.');
      return;
    }
    setQuoteUploadMessage(isRtl ? `تمت معالجة ${quoteUploadRows} سطرًا بنجاح.` : `Processed ${quoteUploadRows} rows successfully.`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteDraft.clientId || !quoteDraft.coverageAmount || !quoteDraft.monthlyPremium) {
      setNotification(isRtl ? 'يرجى ملء جميع الحقول الأساسية.' : 'Please fill in all required quote fields.');
      return;
    }

    const client = clients.find((client) => client.id === quoteDraft.clientId);
    setQuotes((prev) => [
      {
        id: `${Date.now()}`,
        contractNumber: `QUOTE-${Date.now()}`,
        clientName: client ? (isRtl ? client.full_name_ar : client.full_name_en) : quoteDraft.clientId,
        premium: quoteDraft.monthlyPremium,
        createdAt: new Date().toISOString().slice(0, 10)
      },
      ...prev
    ]);

    setNotification(isRtl ? 'تم إرسال العرض بنجاح.' : 'Quote request sent successfully.');
    setQuoteDraft({ clientId: '', coverageAmount: '', monthlyPremium: '', deductible: '', notes: '' });
    setIsQuoteModalOpen(false);
  };

  const statusClasses = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300';
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300';
      case 'cancelled':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300';
      default:
        return 'bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">{tCommon('brokerDashboardTitle')}</p>
            <h1 className="text-3xl font-black mt-2">{isRtl ? company.nameAr : company.nameEn}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{user.email}</p>
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
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10 border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{tCommon('brokerSalesPipeline')}</p>
            </div>
            <p className="mt-4 text-4xl font-black">{summary.activeContracts}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{tCommon('brokerActiveDeals')}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10 border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{tCommon('brokerPendingQuotes')}</p>
            </div>
            <p className="mt-4 text-4xl font-black">{summary.pendingQuotes}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{tCommon('brokerQuoteGenerator')}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10 border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-3">
              <Users2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">{tCommon('brokerClientBook')}</p>
            </div>
            <p className="mt-4 text-4xl font-black">{summary.uniqueClients}</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{tCommon('brokerClients')}</p>
          </div>
          <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg shadow-zinc-900/10 border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-zinc-900 dark:text-white" />
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{isRtl ? 'إجمالي الأقساط' : 'Total Premium'}</p>
            </div>
            <p className="mt-4 text-4xl font-black">{new Intl.NumberFormat('en-US').format(summary.totalPremium)} DZD</p>
            <p className="text-xs uppercase tracking-[0.24em] mt-4 text-emerald-500 dark:text-emerald-300">{isRtl ? 'إيرادات متوقعة' : 'Projected Revenue'}</p>
          </div>
        </section>

        {notification && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 text-emerald-800 p-4 shadow-sm">
            {notification}
          </div>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">{tCommon('brokerSalesPipeline')}</p>
                <h2 className="text-2xl font-black mt-2">{isRtl ? 'صفقة المبيعات' : 'Pipeline Overview'}</h2>
              </div>
              <button
                onClick={() => setIsQuoteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition"
              >
                <Plus className="w-4 h-4" />
                {tCommon('brokerCreateQuote')}
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl bg-white dark:bg-zinc-900 p-4 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[11px] tracking-[0.18em]">
                  <tr>
                    <th className="px-4 py-3">{tCommon('insurancePolicyLabel')}</th>
                    <th className="px-4 py-3">{tCommon('client')}</th>
                    <th className="px-4 py-3">{isRtl ? 'القسط' : 'Premium'}</th>
                    <th className="px-4 py-3">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="px-4 py-3">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recentPipeline.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                        {tCommon('brokerNoPipeline')}
                      </td>
                    </tr>
                  ) : (
                    recentPipeline.map((contract) => (
                      <tr key={contract.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
                        <td className="px-4 py-4 font-semibold text-zinc-900 dark:text-white">
                          {contract.contract_number}
                          <div className="text-xs text-zinc-500 mt-1">{contract.plan}</div>
                        </td>
                        <td className="px-4 py-4 text-zinc-600 dark:text-zinc-300">
                          {isRtl ? contract.client_name_ar : contract.client_name_en}
                          <div className="text-[11px] text-zinc-400">{contract.client_email}</div>
                        </td>
                        <td className="px-4 py-4 text-zinc-900 dark:text-white font-bold">
                          {new Intl.NumberFormat('en-US').format(Number(contract.monthly_premium))} DZD
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses(contract.status)}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-[11px] font-bold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/70 transition">
                            <FileText className="w-3.5 h-3.5" />
                            {isRtl ? 'عرض' : 'Details'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{isRtl ? 'تحليلات الوسيط' : 'Broker Analytics'}</p>
                  <h3 className="text-xl font-black mt-2">{isRtl ? 'أداء خط الأنابيب' : 'Pipeline Performance'}</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-72 rounded-3xl bg-zinc-50 dark:bg-zinc-950/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{isRtl ? 'القسط الشهري' : 'Monthly Premium Trend'}</span>
                    <span className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{isRtl ? 'بالعقود الجديدة' : 'New policies'}</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPremiumTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(148,163,184,0.7)" />
                      <YAxis stroke="rgba(148,163,184,0.7)" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148,163,184,0.24)', color: '#fff' }} />
                      <Legend wrapperStyle={{ color: 'rgba(148,163,184,0.9)' }} />
                      <Bar dataKey="value" name={isRtl ? 'القسط' : 'Premium'} fill="#34D399" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-72 rounded-3xl bg-zinc-50 dark:bg-zinc-950/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{isRtl ? 'حالة العقود' : 'Contract Status Share'}</span>
                    <span className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{isRtl ? 'التوزيع' : 'Distribution'}</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, border: '1px solid rgba(148,163,184,0.24)', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid gap-2">
                    {statusDistribution.map((slice) => (
                      <div key={slice.name} className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-white">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[statusDistribution.indexOf(slice) % chartColors.length] }} />
                          {slice.name}
                        </span>
                        <span>{slice.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topClientPremium.map((entry) => (
                  <div key={entry.name} className="rounded-3xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200/60 dark:border-zinc-800/60">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{entry.name}</p>
                    <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">{new Intl.NumberFormat('en-US').format(entry.value)} DZD</p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-2">{isRtl ? 'إجمالي القسط الشهري' : 'Total monthly premium'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-zinc-50 dark:bg-zinc-900/80 p-6 shadow-lg border border-zinc-200/70 dark:border-zinc-800/70">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-400">{isRtl ? 'أحدث العروض' : 'Latest Quote Requests'}</p>
                  <h3 className="text-lg font-black mt-1">{quotes.length > 0 ? quotes[0].contractNumber : (isRtl ? 'لا توجد عروض بعد' : 'No quotes submitted yet')}</h3>
                </div>
              </div>
              {quotes.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{isRtl ? 'ابدأ بإنشاء عرض جديد لتتبع الطلبات.' : 'Start by creating a new quote to track request activity.'}</p>
              ) : (
                <div className="space-y-3">
                  {quotes.slice(0, 3).map((quote) => (
                    <div key={quote.id} className="rounded-2xl bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white">{quote.clientName}</p>
                          <p className="text-xs text-zinc-500">{quote.contractNumber}</p>
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{quote.premium} DZD</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-2">{quote.createdAt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">{tCommon('brokerClientBook')}</p>
                  <h2 className="text-xl font-bold mt-2">{isRtl ? 'قاعدة العملاء' : 'Client Book'}</h2>
                </div>
                <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-300">{summary.uniqueClients}</span>
              </div>
              <div className="space-y-4">
                {clients.length === 0 ? (
                  <p className="text-sm text-zinc-600">{tCommon('brokerNoClients')}</p>
                ) : (
                  clients.slice(0, 6).map((client) => (
                    <div key={client.id} className="rounded-3xl bg-zinc-50 dark:bg-zinc-950/60 p-4">
                      <p className="font-semibold text-zinc-900 dark:text-white">{isRtl ? client.full_name_ar : client.full_name_en}</p>
                      <p className="text-[11px] text-zinc-500">{client.email}</p>
                      <p className="text-[11px] text-zinc-500">{client.phone || (isRtl ? 'بدون هاتف' : 'No phone')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-[#DCCFC0]/60">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#6f7b67]">{isRtl ? 'ورشة عمل العروض' : 'Quote Workbench'}</p>
                  <h2 className="text-xl font-bold mt-2">{isRtl ? 'تحميل عروض الأسعار' : 'Upload Quotes'}</h2>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {isRtl ? 'اختر ملفاً' : 'Select a quote file'}
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleQuoteFileChange}
                    className="mt-3 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 focus:border-emerald-700 focus:outline-none"
                  />
                </label>
                <button
                  onClick={handleSubmitQuoteUpload}
                  className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition"
                >
                  <Plus className="w-4 h-4" />
                  {isRtl ? 'معالجة الملف' : 'Process File'}
                </button>
                {quoteUploadMessage && (
                  <div className="rounded-3xl bg-zinc-50 dark:bg-zinc-950/60 p-4 text-sm text-zinc-900 dark:text-white">
                    <p>{quoteUploadMessage}</p>
                    {quoteUploadRows > 0 && (
                      <p className="mt-2 text-xs text-[#6f7b67]">{isRtl ? `${quoteUploadRows} سطر في الملف` : `${quoteUploadRows} rows in file`}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-lg border border-[#DCCFC0]/60">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-[#778873]" />
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#6f7b67]">{isRtl ? 'خدمة العملاء' : 'Support Desk'}</p>
                  <h3 className="text-lg font-bold mt-1">{isRtl ? 'ابق متصلاً' : 'Stay connected'}</h3>
                </div>
              </div>
              <p className="text-sm text-[#6f7b67]">{isRtl ? 'أرسل إشعاراً للعميل أو راجع طلبات العرض في الحال.' : 'Send a quote reminder or review your active requests instantly.'}</p>
              <button className="mt-5 inline-flex items-center justify-center gap-2 w-full rounded-full bg-[#778873] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6d7f61] transition">
                <ArrowRight className="w-4 h-4" />
                {isRtl ? 'إرسال إشعار' : 'Send notification'}
              </button>
            </div>
          </aside>
        </section>
      </main>

      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white">{tCommon('brokerQuoteGenerator')}</h3>
                <p className="text-xs text-zinc-500 mt-1">{isRtl ? 'أرسل عرضاً سريعاً لعميلك' : 'Send a fast quote to your client'}</p>
              </div>
              <button onClick={() => setIsQuoteModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200">×</button>
            </div>
            <form onSubmit={handleCreateQuote} className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {tCommon('client')}
                  <select
                    value={quoteDraft.clientId}
                    onChange={(e) => setQuoteDraft({ ...quoteDraft, clientId: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#778873] focus:outline-none"
                  >
                    <option value="">{isRtl ? 'اختر عميل' : 'Select a client'}</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {isRtl ? client.full_name_ar : client.full_name_en}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {isRtl ? 'مبلغ التغطية' : 'Coverage Amount (DZD)'}
                  <input
                    type="number"
                    value={quoteDraft.coverageAmount}
                    onChange={(e) => setQuoteDraft({ ...quoteDraft, coverageAmount: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#778873] focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {isRtl ? 'القسط الشهري' : 'Monthly Premium (DZD)'}
                  <input
                    type="number"
                    value={quoteDraft.monthlyPremium}
                    onChange={(e) => setQuoteDraft({ ...quoteDraft, monthlyPremium: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#778873] focus:outline-none"
                  />
                </label>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {isRtl ? 'الخصم' : 'Deductible (DZD)'}
                  <input
                    type="number"
                    value={quoteDraft.deductible}
                    onChange={(e) => setQuoteDraft({ ...quoteDraft, deductible: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#778873] focus:outline-none"
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {tCommon('brokerQuoteNotes')}
                <textarea
                  rows={3}
                  value={quoteDraft.notes}
                  onChange={(e) => setQuoteDraft({ ...quoteDraft, notes: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-[#778873] focus:outline-none"
                />
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#778873] px-5 py-2 text-sm font-semibold text-white hover:bg-[#6d7f61]"
                >
                  {tCommon('brokerQuoteSubmit') || 'Send Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
