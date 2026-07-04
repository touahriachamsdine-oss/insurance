'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  Search, 
  CheckCircle, 
  LogOut, 
  Phone, 
  FileText,
  AlertCircle,
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  Activity,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface Company {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
  license_number: string;
  headquarters_wilaya: string;
  phone: string;
  email: string;
  website: string;
  is_active: boolean;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name_ar: string;
  full_name_en: string;
  role: 'broker' | 'assessor' | 'company_agent' | 'company_admin';
  is_active: boolean;
  phone: string | null;
  wilaya_code: string | null;
  email: string;
  broker_license: string | null;
  assessor_license: string | null;
  assessor_specialty: string | null;
  company_name_ar: string | null;
  company_name_en: string | null;
  created_at: string;
}

interface GrowthDataItem {
  month_date: string;
  users: string | number;
  policies: string | number;
  revenue: string | number;
}

interface ClaimsDataItem {
  month_date: string;
  claimed: string | number;
  paid: string | number;
}

interface RoleDistributionItem {
  role: string;
  is_active: boolean;
  count: string | number;
}

interface AdminDashboardClientProps {
  companies: Company[];
  users: UserProfile[];
  growthData?: GrowthDataItem[];
  claimsData?: ClaimsDataItem[];
  roleDistribution?: RoleDistributionItem[];
  user: {
    id: string;
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    role: string;
  };
}

export default function AdminDashboardClient({ 
  companies: initialCompanies, 
  users: initialUsers, 
  growthData = [],
  claimsData = [],
  roleDistribution = [],
  user 
}: AdminDashboardClientProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const locale = useLocale();

  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers || []);
  const [activeTab, setActiveTab] = useState<'companies' | 'professionals' | 'analytics'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeTabSubtitle = activeTab === 'companies'
    ? t('companyListSubtitle')
    : activeTab === 'professionals'
    ? t('professionalsListSubtitle')
    : '';

  const noRecordsMessage = activeTab === 'companies'
    ? t('noCompanyRecords')
    : t('noProfessionalRecords');

  // Statistics - Companies
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.is_active).length;
  const pendingCompanies = companies.filter(c => !c.is_active).length;

  // Statistics - Professionals
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const pendingUsers = users.filter(u => !u.is_active).length;

  // 1. Growth & Claims Data preparation
  const formatMonth = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formattedGrowthData = (growthData || []).map(item => ({
    ...item,
    name: formatMonth(item.month_date),
  }));

  const formattedClaimsData = (claimsData || []).map(item => ({
    ...item,
    name: formatMonth(item.month_date),
  }));

  // 2. Role distribution
  const rolesCounts = (roleDistribution || []).reduce((acc: Record<string, number>, curr: RoleDistributionItem) => {
    const role = curr.role;
    acc[role] = (acc[role] || 0) + Number(curr.count);
    return acc;
  }, {});

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
  const roleChartData = Object.keys(rolesCounts).map((role, idx) => ({
    name: tRoles(role) || role,
    value: rolesCounts[role],
    color: COLORS[idx % COLORS.length]
  }));

  // 3. Status breakdown
  const activeProCount = (roleDistribution || []).filter((r: RoleDistributionItem) => r.is_active).reduce((sum: number, curr: RoleDistributionItem) => sum + Number(curr.count), 0);
  const pendingProCount = (roleDistribution || []).filter((r: RoleDistributionItem) => !r.is_active).reduce((sum: number, curr: RoleDistributionItem) => sum + Number(curr.count), 0);

  const statusChartData = [
    { name: t('verified'), value: activeProCount, color: '#10b981' },
    { name: t('pendingApproval'), value: pendingProCount, color: '#f59e0b' }
  ];

  const handleApproveCompany = async (companyId: string) => {
    setProcessingId(companyId);
    setNotification(null);
    try {
      const res = await fetch('/api/auth/companies/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      
      let data;
      if (res.status === 404) {
        const fallbackRes = await fetch('/api/admin/companies/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId }),
        });
        data = await fallbackRes.json();
      } else {
        data = await res.json();
      }

      if (data.success) {
        setCompanies(prev => 
          prev.map(c => c.id === companyId ? { ...c, is_active: true } : c)
        );
        setNotification({
          type: 'success',
          message: t('approved')
        });
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Error processing approval'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    setProcessingId(userId);
    setNotification(null);
    const newStatus = !currentStatus;
    try {
      const res = await fetch('/api/admin/users/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: newStatus }),
      });
      
      const data = await res.json();

      if (data.success) {
        setUsers(prev => 
          prev.map(u => u.id === userId ? { ...u, is_active: newStatus } : u)
        );
        setNotification({
          type: 'success',
          message: newStatus ? t('userApproved') : t('userSuspended')
        });
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Error updating status'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Filter & Search Logic for Companies
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = 
      c.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.license_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'active') return matchesSearch && c.is_active;
    if (statusFilter === 'pending') return matchesSearch && !c.is_active;
    return matchesSearch;
  });

  // Filter & Search Logic for Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.broker_license && u.broker_license.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.assessor_license && u.assessor_license.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tRoles(u.role).toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'active') return matchesSearch && u.is_active;
    if (statusFilter === 'pending') return matchesSearch && !u.is_active;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-theme bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-sage flex items-center justify-center text-white font-extrabold text-xl shadow-sage">
              ض
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                {t('title')}
              </h1>
              <p className="text-xs text-muted">
                {user.email} • {tRoles('superadmin')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title={tCommon('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Toast Notification */}
        {notification && (
          <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-theme-sage text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            )}
            <span className="text-sm font-semibold">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ms-auto text-xs hover:underline font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-theme gap-2">
          <button
            onClick={() => {
              setActiveTab('companies');
              setSearchQuery('');
            }}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'companies'
                ? 'border-theme-strong text-emerald-600 dark:text-emerald-400 font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {t('companiesTab')}
          </button>
          <button
            onClick={() => {
              setActiveTab('professionals');
              setSearchQuery('');
            }}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'professionals'
                ? 'border-theme-strong text-emerald-600 dark:text-emerald-400 font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Users className="w-4 h-4" />
            {t('professionalsTab')}
          </button>
          <button
            onClick={() => {
              setActiveTab('analytics');
              setSearchQuery('');
            }}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-theme-strong text-emerald-600 dark:text-emerald-400 font-black'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {t('analyticsTab')}
          </button>
        </div>

        {/* Dynamic Statistics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm flex items-center gap-5 relative overflow-hidden bg-sage-card">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {activeTab === 'companies' ? <Building2 className="w-6 h-6" /> : (activeTab === 'professionals' ? <Users className="w-6 h-6" /> : <Building2 className="w-6 h-6" />)}
            </div>
            <div>
              <p className="text-xs text-muted font-bold uppercase tracking-wider">
                {activeTab === 'companies' ? t('companiesCount') : (activeTab === 'professionals' ? t('professionalsCount') : t('companiesCount'))}
              </p>
              <p className="text-3xl font-black mt-1 text-zinc-950 dark:text-white">
                {activeTab === 'companies' ? totalCompanies : (activeTab === 'professionals' ? totalUsers : totalCompanies)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {activeTab === 'companies' ? <UserCheck className="w-6 h-6" /> : (activeTab === 'professionals' ? <UserCheck className="w-6 h-6" /> : <Users className="w-6 h-6" />)}
            </div>
            <div>
              <p className="text-xs text-muted font-bold uppercase tracking-wider">
                {activeTab === 'companies' ? t('activeCompanies') : (activeTab === 'professionals' ? t('activeProfessionals') : t('professionalsCount'))}
              </p>
              <p className="text-3xl font-black mt-1 text-emerald-600">
                {activeTab === 'companies' ? activeCompanies : (activeTab === 'professionals' ? activeUsers : totalUsers)}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted font-bold uppercase tracking-wider">
                {activeTab === 'companies' ? t('pendingCompanies') : (activeTab === 'professionals' ? t('pendingProfessionals') : `${t('pendingCompanies')} / ${t('pendingProfessionals')}`)}
              </p>
              <p className="text-3xl font-black mt-1 text-amber-600">
                {activeTab === 'companies' ? pendingCompanies : (activeTab === 'professionals' ? pendingUsers : (pendingCompanies + pendingUsers))}
              </p>
            </div>
          </div>
        </section>

        {/* Tab-based Content Area */}
        {activeTab !== 'analytics' ? (
          <section className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-theme flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {activeTab === 'companies' ? t('companyList') : t('professionalsTab')}
                </h2>
                <p className="text-xs text-muted">
                  {activeTabSubtitle}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
                  <input 
                    type="text"
                    placeholder={tCommon('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-theme rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-theme-strong transition"
                  />
                </div>

                {/* Status Filter Tab Group */}
                <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl w-full sm:w-auto border border-theme">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                      statusFilter === 'all' 
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300'
                    }`}
                  >
                    {t('allFilter')}
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                      statusFilter === 'active' 
                        ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300'
                    }`}
                  >
                    {t('activeFilter')}
                  </button>
                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                      statusFilter === 'pending' 
                        ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300'
                    }`}
                  >
                    {t('pendingFilter')}
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              {activeTab === 'companies' ? (
                <table className="w-full text-start text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 border-b border-theme text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-start">Company & Code</th>
                      <th className="px-6 py-4 text-start">License details</th>
                      <th className="px-6 py-4 text-start">Contact info</th>
                      <th className="px-6 py-4 text-start">Wilaya</th>
                      <th className="px-6 py-4 text-start">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                          {statusFilter === 'pending' ? t('noPending') : noRecordsMessage}
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 font-extrabold flex items-center justify-center text-sm">
                                {c.code}
                              </div>
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-white">
                                  {c.name_en}
                                </div>
                                <div className="text-xs text-muted font-medium">
                                  {c.name_ar}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                              <FileText className="w-4.5 h-4.5 text-zinc-400" />
                              <span className="font-mono text-xs">{c.license_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-0.5 text-xs">
                              <div className="text-zinc-900 dark:text-white">{c.email}</div>
                              <div className="text-zinc-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {c.phone || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {c.headquarters_wilaya}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {c.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {t('verified')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {t('pendingApproval')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {!c.is_active ? (
                              <button
                                onClick={() => handleApproveCompany(c.id)}
                                disabled={processingId !== null}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg hover:shadow-md disabled:opacity-50 active:scale-95 transition"
                              >
                                {processingId === c.id ? 'Processing...' : t('approveBtn')}
                              </button>
                            ) : (
                              <span className="text-xs text-zinc-400 font-semibold">Verified</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-start text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 border-b border-theme text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-start">Name & Email</th>
                      <th className="px-6 py-4 text-start">Role</th>
                      <th className="px-6 py-4 text-start">Credentials</th>
                      <th className="px-6 py-4 text-start">Wilaya</th>
                      <th className="px-6 py-4 text-start">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                          {statusFilter === 'pending' ? t('noPendingUsers') : 'No professional records found matching your filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white">
                                {u.full_name_en}
                              </div>
                              <div className="text-xs text-muted font-medium">
                                {u.full_name_ar} • {u.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            {tRoles(u.role)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            {u.role === 'broker' && u.broker_license && (
                              <span className="font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded border border-theme-sage">
                                License: {u.broker_license}
                              </span>
                            )}
                            {u.role === 'assessor' && u.assessor_license && (
                              <div className="space-y-1">
                                <span className="font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded block w-fit border border-theme-sage">
                                  License: {u.assessor_license}
                                </span>
                                {u.assessor_specialty && (
                                  <span className="text-[10px] text-zinc-400 block font-semibold">
                                    Specialty: {tRegister(`specialty${u.assessor_specialty.charAt(0).toUpperCase() + u.assessor_specialty.slice(1)}`)}
                                  </span>
                                )}
                              </div>
                            )}
                            {u.role === 'company_agent' && (
                              <span className="text-zinc-500 font-bold">
                                {u.company_name_en || 'N/A'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs">
                            {u.wilaya_code ? (
                              <span className="font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded">
                                {u.wilaya_code}
                              </span>
                            ) : (
                              <span className="text-zinc-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {t('verified')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {t('pendingApproval')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleToggleUserActive(u.id, u.is_active)}
                              disabled={processingId !== null}
                              className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg hover:shadow-md disabled:opacity-50 active:scale-95 transition ${
                                u.is_active 
                                  ? 'bg-gradient-to-r from-rose-600 to-red-650' 
                                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                              }`}
                            >
                              {processingId === u.id 
                                ? 'Processing...' 
                                : u.is_active 
                                  ? t('deactivateBtn') 
                                  : t('activateBtn')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        ) : (
          /* Charts and Visual Analytics Section */
          <div className="space-y-8">
            {/* Row 1: Premium Revenue Growth & Money Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Premium Revenue Growth */}
              <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    {t('revenue')}
                  </h3>
                  <p className="text-xs text-muted">
                    {t('platformGrowthSub')}
                  </p>
                </div>
                <div className="h-80 w-full text-[11px] font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={formattedGrowthData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800/50" vertical={false} />
                      <XAxis dataKey="name" stroke="#a1a1aa" tickLine={false} />
                      <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgb(24 24 27)', 
                          border: '1px solid rgb(63 63 70)',
                          borderRadius: '12px',
                          color: '#fff' 
                        }}
                        formatter={(value: number | string) => [`${Number(value).toLocaleString()} DZD`]}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        name={t('revenue')} 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Claims Analysis */}
              <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
                    {t('moneyFlow')}
                  </h3>
                  <p className="text-xs text-muted">
                    {t('moneyFlowSub')}
                  </p>
                </div>
                <div className="h-80 w-full text-[11px] font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={formattedClaimsData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorClaimed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800/50" vertical={false} />
                      <XAxis dataKey="name" stroke="#a1a1aa" tickLine={false} />
                      <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgb(24 24 27)', 
                          border: '1px solid rgb(63 63 70)',
                          borderRadius: '12px',
                          color: '#fff' 
                        }}
                        formatter={(value: number | string) => [`${Number(value).toLocaleString()} DZD`]}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area 
                        type="monotone" 
                        dataKey="claimed" 
                        name={t('claimsClaimed')} 
                        stroke="#ec4899" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorClaimed)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="paid" 
                        name={t('claimsPaid')} 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPaid)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Users & Policies Growth & Roles Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Users & Policies Growth */}
              <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    {t('platformGrowth')}
                  </h3>
                  <p className="text-xs text-muted">
                    {t('platformGrowthSub')}
                  </p>
                </div>
                <div className="h-80 w-full text-[11px] font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formattedGrowthData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800/50" vertical={false} />
                      <XAxis dataKey="name" stroke="#a1a1aa" tickLine={false} />
                      <YAxis stroke="#a1a1aa" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgb(24 24 27)', 
                          border: '1px solid rgb(63 63 70)',
                          borderRadius: '12px',
                          color: '#fff' 
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="square" />
                      <Bar dataKey="users" name={t('users')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="policies" name={t('policies')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Role Distribution Pie Chart */}
              <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    {t('roleDistribution')}
                  </h3>
                  <p className="text-xs text-muted">
                    {t('roleDistributionSub')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-around h-72">
                  {roleChartData.length > 0 ? (
                    <>
                      <div className="h-56 w-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={roleChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {roleChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgb(24 24 27)', 
                                border: '1px solid rgb(63 63 70)',
                                borderRadius: '12px',
                                color: '#fff' 
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3 mt-4 sm:mt-0">
                        {roleChartData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{entry.name}</span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white">({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-400 text-xs">{t('noProfessionalRecords')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Account Verification Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900 border border-theme-sage rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    {t('roleDistributionSub')}
                  </h3>
                  <p className="text-xs text-muted">
                    {t('professionalsListSubtitle')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-around h-72">
                  {activeProCount + pendingProCount > 0 ? (
                    <>
                      <div className="h-56 w-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {statusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgb(24 24 27)', 
                                border: '1px solid rgb(63 63 70)',
                                borderRadius: '12px',
                                color: '#fff' 
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3 mt-4 sm:mt-0">
                        {statusChartData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{entry.name}</span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white">({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-400 text-xs">{t('noProfessionalRecords')}</div>
                  )}
                </div>
              </div>

              {/* Aesthetic Card explaining Super Admin Duties */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-theme-sage rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    System Administration Panel
                  </h3>
                  <p className="text-sm text-zinc-650 dark:text-zinc-300 mt-4 leading-relaxed">
                    Welcome to the Algerian Daman Insurance Management Platform. As a Super Administrator, you hold full auditing and credentialing rights over insurance partners and specialized professionals.
                  </p>
                  <p className="text-sm text-zinc-650 dark:text-zinc-300 mt-3 leading-relaxed">
                    Always verify company license certificates and broker authorization credentials with the Ministry of Finance records before approving registration.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-theme-sage text-xs text-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active Session Role: {user.role === 'superadmin' ? 'Super Administrator' : user.role}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
