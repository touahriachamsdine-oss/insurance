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
  Globe, 
  Phone, 
  FileText,
  AlertCircle,
  Plus,
  TrendingUp,
  Users,
  Briefcase,
  FileCheck2,
  X,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Bell,
  Eye,
  Download,
  Printer,
  CreditCard
} from 'lucide-react';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface Contract {
  id: string;
  contract_number: string;
  client_id: string;
  type: string;
  plan: string;
  status: string;
  coverage_amount: string;
  monthly_premium: string;
  deductible: string;
  start_date: string;
  end_date: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_plate: string | null;
  vehicle_vin: string | null;
  property_address: string | null;
  property_wilaya: string | null;
  property_area_sqm: string | null;
  beneficiaries_count: number | null;
  notes: string | null;
  created_at: string;
  client_name_ar: string;
  client_name_en: string;
  client_email: string;
  client_phone: string;
}

interface Claim {
  id: string;
  claim_number: string;
  contract_id: string;
  client_id: string;
  company_id: string;
  status: string;
  incident_date: string;
  description: string;
  estimated_amount: string;
  approved_amount: string | null;
  rejection_reason: string | null;
  created_at: string;
  client_name_ar: string;
  client_name_en: string;
  client_email: string;
  contract_number: string;
  documents?: any;
}

interface TransferRequest {
  id: string;
  contract_id: string;
  client_id: string;
  from_company_id: string;
  to_company_id: string;
  reason: string;
  status: string;
  rejection_reason: string | null;
  requested_at: string;
  client_name_ar: string;
  client_name_en: string;
  from_name_ar: string;
  from_name_en: string;
  to_name_ar: string;
  to_name_en: string;
  contract_number: string;
}

interface ClientUser {
  id: string;
  full_name_ar: string;
  full_name_en: string;
  email: string;
  phone: string;
}

interface CompanyDashboardClientProps {
  company: {
    id: string;
    nameAr: string;
    nameEn: string;
    code: string;
  };
  contracts: Contract[];
  claims: Claim[];
  transfers: TransferRequest[];
  clients: ClientUser[];
  user: {
    id: string;
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    role: string;
    companyId: string;
  };
}

export default function CompanyDashboardClient({
  company,
  contracts: initialContracts,
  claims: initialClaims,
  transfers: initialTransfers,
  clients,
  user
}: CompanyDashboardClientProps) {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tRoles = useTranslations('roles');
  const tInsurance = useTranslations('insurance');
  const tContracts = useTranslations('contracts');
  const tClaims = useTranslations('claims');
  const tTransfers = useTranslations('transfers');
  
  const currentLocale = useLocale();
  const isRtl = currentLocale === 'ar';
  const router = useRouter();

  // State Management
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [claims, setClaims] = useState<Claim[]>(() =>
    initialClaims.map(c => c.status === 'submitted' || c.status === 'under_review' ? { ...c, status: 'pending' } : c)
  );
  const [transfers, setTransfers] = useState<TransferRequest[]>(initialTransfers);

  const [activeTab, setActiveTab] = useState<'contracts' | 'claims' | 'transfers' | 'analytics'>('contracts');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Live Notifications State
  const [liveNotifications, setLiveNotifications] = useState<any[]>([
    {
      id: '1',
      title_en: 'New Claim Submitted',
      title_ar: 'تم تقديم مطالبة جديدة',
      desc_en: 'Claim CLM-84920 has been submitted for review.',
      desc_ar: 'تم تقديم المطالبة CLM-84920 للمراجعة.',
      time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false
    },
    {
      id: '2',
      title_en: 'Contract Payment Pending',
      title_ar: 'دفع العقد معلق',
      desc_en: 'A new contract requires activation payment.',
      desc_ar: 'يتطلب عقد جديد دفع التفعيل.',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: true
    }
  ]);
  const [isNotificationBellOpen, setIsNotificationBellOpen] = useState(false);

  // Document Viewer Modal State
  const [selectedClaimDocs, setSelectedClaimDocs] = useState<any[] | null>(null);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  // Payment Modal State
  const [selectedContractForPayment, setSelectedContractForPayment] = useState<Contract | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCardNumber, setPaymentCardNumber] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Modals & Popups
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isClaimReviewModalOpen, setIsClaimReviewModalOpen] = useState(false);
  const [isTransferReviewModalOpen, setIsTransferReviewModalOpen] = useState(false);
  
  // Modal Processing States
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Claim Review inputs
  const [claimActionType, setClaimActionType] = useState<'approved' | 'rejected'>('approved');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [claimRejectionReason, setClaimRejectionReason] = useState('');

  // Transfer Review inputs
  const [transferActionType, setTransferActionType] = useState<'approved' | 'rejected'>('approved');
  const [transferRejectionReason, setTransferRejectionReason] = useState('');

  // Create Contract form inputs
  const [newContractForm, setNewContractForm] = useState({
    clientId: '',
    type: 'car',
    plan: '',
    coverageAmount: '',
    monthlyPremium: '',
    deductible: '',
    startDate: '',
    endDate: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehiclePlate: '',
    vehicleVin: '',
    propertyAddress: '',
    propertyWilaya: '',
    propertyAreaSqm: '',
    beneficiariesCount: '1',
    notes: ''
  });

  // Derived stats
  const totalPremium = contracts.reduce((acc, c) => acc + (parseFloat(c.monthly_premium) || 0), 0);
  const activeContractsCount = contracts.filter(c => c.status === 'active').length;
  const pendingClaimsCount = claims.filter(c => c.status === 'pending').length;
  const pendingTransfersCount = transfers.filter(t => t.status === 'pending' && t.from_company_id === company.id).length;

  // Dynamic Analytics Calculation
  const activeContracts = contracts.filter(c => c.status === 'active');
  const pendingContracts = contracts.filter(c => c.status === 'pending');
  const approvedClaims = claims.filter(c => c.status === 'approved');
  
  const totalActivePremium = activeContracts.reduce((acc, c) => acc + (parseFloat(c.monthly_premium) || 0), 0);
  const totalClaimsPaid = approvedClaims.reduce((acc, c) => acc + (parseFloat(c.approved_amount || '0') || 0), 0);
  
  // Loss Ratio Calculation
  const calculatedLossRatio = totalActivePremium > 0 
    ? Math.round((totalClaimsPaid / (totalActivePremium * 12)) * 100)
    : 0;

  // Group contracts by type
  const policyTypeCounts = contracts.reduce((acc: any, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  const distributionData = Object.keys(policyTypeCounts).map(type => ({
    name: tInsurance(`categories.${type}` as any) || type,
    value: policyTypeCounts[type]
  }));

  const COLORS = ['#06b6d4', '#6366f1', '#ec4899', '#f59e0b', '#10b981'];

  // Standard monthly trend data that incorporates dynamic metrics
  const monthlyTrendData = [
    { name: isRtl ? 'جانفي' : 'Jan', Premium: Math.round(totalActivePremium * 0.7), Claims: Math.round(totalClaimsPaid * 0.1) },
    { name: isRtl ? 'فيفري' : 'Feb', Premium: Math.round(totalActivePremium * 0.8), Claims: Math.round(totalClaimsPaid * 0.15) },
    { name: isRtl ? 'مارس' : 'Mar', Premium: Math.round(totalActivePremium * 0.95), Claims: Math.round(totalClaimsPaid * 0.2) },
    { name: isRtl ? 'أفريل' : 'Apr', Premium: Math.round(totalActivePremium * 1.0), Claims: Math.round(totalClaimsPaid * 0.25) },
    { name: isRtl ? 'ماي' : 'May', Premium: Math.round(totalActivePremium * 1.05), Claims: Math.round(totalClaimsPaid * 0.4) },
    { name: isRtl ? 'جوان' : 'Jun', Premium: Math.round(totalActivePremium * 1.1), Claims: Math.round(totalClaimsPaid * 0.7) },
    { name: isRtl ? 'جويلية' : 'Jul', Premium: Math.round(totalActivePremium * 1.25), Claims: totalClaimsPaid }
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/company/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContractForm),
      });
      const data = await res.json();

      if (data.success) {
        // Find client details to append locally
        const selectedClient = clients.find(c => c.id === newContractForm.clientId);
        const addedContract: Contract = {
          ...data.contract,
          client_name_ar: selectedClient?.full_name_ar || '',
          client_name_en: selectedClient?.full_name_en || '',
          client_email: selectedClient?.email || '',
          client_phone: selectedClient?.phone || ''
        };

        setContracts(prev => [addedContract, ...prev]);
        setNotification({
          type: 'success',
          message: tContracts('addSuccess')
        });
        setIsContractModalOpen(false);
        // Reset form
        setNewContractForm({
          clientId: '',
          type: 'car',
          plan: '',
          coverageAmount: '',
          monthlyPremium: '',
          deductible: '',
          startDate: '',
          endDate: '',
          vehicleMake: '',
          vehicleModel: '',
          vehicleYear: '',
          vehiclePlate: '',
          vehicleVin: '',
          propertyAddress: '',
          propertyWilaya: '',
          propertyAreaSqm: '',
          beneficiariesCount: '1',
          notes: ''
        });
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to create contract'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/company/claims/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: selectedClaim.id,
          status: claimActionType,
          approvedAmount: claimActionType === 'approved' ? parseFloat(approvedAmount) : null,
          rejectionReason: claimActionType === 'rejected' ? claimRejectionReason : null
        })
      });
      const data = await res.json();

      if (data.success) {
        setClaims(prev => 
          prev.map(c => c.id === selectedClaim.id ? { 
            ...c, 
            status: claimActionType,
            approved_amount: claimActionType === 'approved' ? approvedAmount : null,
            rejection_reason: claimActionType === 'rejected' ? claimRejectionReason : null
          } : c)
        );

        // Add to live notifications
        const notifMsgEn = `Claim ${selectedClaim.claim_number} was ${claimActionType === 'approved' ? 'approved for ' + approvedAmount + ' DZD' : 'rejected'}.`;
        const notifMsgAr = `تم ${claimActionType === 'approved' ? 'الموافقة على المطالبة ' + selectedClaim.claim_number + ' بمبلغ ' + approvedAmount + ' د.ج' : 'رفض المطالبة ' + selectedClaim.claim_number}.`;
        setLiveNotifications(prev => [
          {
            id: Date.now().toString(),
            title_en: claimActionType === 'approved' ? 'Claim Approved' : 'Claim Rejected',
            title_ar: claimActionType === 'approved' ? 'تم قبول المطالبة' : 'تم رفض المطالبة',
            desc_en: notifMsgEn,
            desc_ar: notifMsgAr,
            time: new Date().toISOString(),
            read: false
          },
          ...prev
        ]);

        setNotification({
          type: 'success',
          message: 'Claim status updated successfully'
        });
        setIsClaimReviewModalOpen(false);
        setSelectedClaim(null);
        setApprovedAmount('');
        setClaimRejectionReason('');
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to review claim'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransfer) return;
    setSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/company/transfers/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: selectedTransfer.id,
          status: transferActionType,
          rejectionReason: transferActionType === 'rejected' ? transferRejectionReason : null
        })
      });
      const data = await res.json();

      if (data.success) {
        setTransfers(prev => 
          prev.map(t => t.id === selectedTransfer.id ? { 
            ...t, 
            status: transferActionType,
            rejection_reason: transferActionType === 'rejected' ? transferRejectionReason : null
          } : t)
        );

        // If transfer request was approved, remove the contract from our local contracts list since ownership moved
        if (transferActionType === 'approved') {
          setContracts(prev => prev.filter(c => c.id !== selectedTransfer.contract_id));
        }

        // Add to live notifications
        const notifMsgEn = `Transfer request for contract ${selectedTransfer.contract_number} was ${transferActionType}.`;
        const notifMsgAr = `تم ${transferActionType === 'approved' ? 'قبول' : 'رفض'} طلب تحويل العقد ${selectedTransfer.contract_number}.`;
        setLiveNotifications(prev => [
          {
            id: Date.now().toString(),
            title_en: transferActionType === 'approved' ? 'Transfer Approved' : 'Transfer Rejected',
            title_ar: transferActionType === 'approved' ? 'تم قبول التحويل' : 'تم رفض التحويل',
            desc_en: notifMsgEn,
            desc_ar: notifMsgAr,
            time: new Date().toISOString(),
            read: false
          },
          ...prev
        ]);

        setNotification({
          type: 'success',
          message: 'Transfer request processed successfully'
        });
        setIsTransferReviewModalOpen(false);
        setSelectedTransfer(null);
        setTransferRejectionReason('');
      } else {
        setNotification({
          type: 'error',
          message: data.message || 'Failed to process transfer request'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Network error occurred'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForPayment) return;
    setPaymentLoading(true);
    setNotification(null);

    try {
      const res = await fetch('/api/company/contracts/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: selectedContractForPayment.id })
      });
      const data = await res.json();

      if (data.success) {
        setContracts(prev => 
          prev.map(c => c.id === selectedContractForPayment.id ? { ...c, status: 'active' } : c)
        );

        // Add to live notifications
        const titleEn = 'Contract Activated';
        const titleAr = 'تم تفعيل العقد';
        const descEn = `Contract ${selectedContractForPayment.contract_number} has been activated successfully via CIB/Dahabia payment.`;
        const descAr = `تم تفعيل العقد ${selectedContractForPayment.contract_number} بنجاح عبر الدفع بالبطاقة الذهبية/البنكية.`;

        setLiveNotifications(prev => [
          {
            id: Date.now().toString(),
            title_en: titleEn,
            title_ar: titleAr,
            desc_en: descEn,
            desc_ar: descAr,
            time: new Date().toISOString(),
            read: false
          },
          ...prev
        ]);

        setNotification({
          type: 'success',
          message: t('paymentSuccess')
        });

        // Clear card inputs
        setPaymentCardNumber('');
        setPaymentExpiry('');
        setPaymentCvv('');
        
        // Let's also update the selectedContractForPayment status locally so the success receipt renders with status active
        setSelectedContractForPayment(prev => prev ? { ...prev, status: 'active' } : null);
      } else {
        setNotification({
          type: 'error',
          message: data.message || t('paymentError')
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Network error occurred during payment processing.'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || c.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredClaims = claims.filter(c => {
    const matchesSearch = 
      c.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name_en.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = 
      t.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_name_en.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              ض
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                {isRtl ? company.nameAr : company.nameEn}
              </h1>
              <p className="text-xs text-zinc-500">
                {user.email} • {tRoles(user.role as any)}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Banner Alert for Pending Actions */}
        {pendingTransfersCount > 0 && (
          <div className="p-4 rounded-xl flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 animate-bounce text-amber-500" />
              <span className="text-sm font-semibold">
                {isRtl 
                  ? `لديك ${pendingTransfersCount} طلبات تحويل عقود معلقة بحاجة لمراجعتك.`
                  : `You have ${pendingTransfersCount} pending contract transfer requests requiring your review.`
                }
              </span>
            </div>
            <button 
              onClick={() => {
                setActiveTab('transfers');
                setSearchQuery('');
              }}
              className="px-3 py-1 bg-amber-200/50 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 rounded-lg text-xs font-extrabold transition"
            >
              {t('reviewTransfer')}
            </button>
          </div>
        )}

        {/* Toast Feedbacks */}
        {notification && (
          <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-300'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
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

        {/* Overview Stats Dashboard Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{t('totalPremium')}</p>
              <p className="text-2xl font-black mt-1 text-zinc-950 dark:text-white">
                {new Intl.NumberFormat('en-US').format(totalPremium)} <span className="text-sm font-medium">DZD/mo</span>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{t('activeContracts')}</p>
              <p className="text-2xl font-black mt-1 text-emerald-600">{activeContractsCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{t('pendingClaims')}</p>
              <p className="text-2xl font-black mt-1 text-rose-600">{pendingClaimsCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{t('pendingTransfers')}</p>
              <p className="text-2xl font-black mt-1 text-indigo-600">{pendingTransfersCount}</p>
            </div>
          </div>

        </section>

        {/* Tab switcher, create button and Search filters */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Tabs header bar */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl w-full md:w-auto self-start">
              <button
                onClick={() => { setActiveTab('contracts'); setSearchQuery(''); }}
                className={`flex-1 md:flex-none px-5 py-2 text-xs font-extrabold rounded-lg transition ${
                  activeTab === 'contracts' 
                    ? 'bg-white dark:bg-zinc-900 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {t('contractList')}
              </button>
              <button
                onClick={() => { setActiveTab('claims'); setSearchQuery(''); }}
                className={`flex-1 md:flex-none px-5 py-2 text-xs font-extrabold rounded-lg transition relative ${
                  activeTab === 'claims' 
                    ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {t('claimsList')}
                {pendingClaimsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                    {pendingClaimsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('transfers'); setSearchQuery(''); }}
                className={`flex-1 md:flex-none px-5 py-2 text-xs font-extrabold rounded-lg transition relative ${
                  activeTab === 'transfers' 
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {t('transfersList')}
                {pendingTransfersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">
                    {pendingTransfersCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('analytics'); setSearchQuery(''); }}
                className={`flex-1 md:flex-none px-5 py-2 text-xs font-extrabold rounded-lg transition relative ${
                  activeTab === 'analytics' 
                    ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {t('analytics') || (isRtl ? 'التحليلات والمؤشرات' : 'Analytics & Trends')}
              </button>
            </div>

            {/* Quick Actions and Search filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              
              {/* Category selector for Contracts tab */}
              {activeTab === 'contracts' && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                >
                  <option value="all">{isRtl ? 'جميع الفئات' : 'All Categories'}</option>
                  <option value="car">{tInsurance('categories.car')}</option>
                  <option value="home">{tInsurance('categories.home')}</option>
                  <option value="health">{tInsurance('categories.health')}</option>
                  <option value="life">{tInsurance('categories.life')}</option>
                  <option value="agriculture">{tInsurance('categories.agriculture')}</option>
                </select>
              )}

              {/* Text Search input */}
              {activeTab !== 'analytics' && (
                <div className="relative w-full sm:w-64">
                  <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 w-4 h-4 text-zinc-450`} />
                  <input 
                    type="text"
                    placeholder={tCommon('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full text-xs ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition`}
                  />
                </div>
              )}

              {/* Add Policy Button for Agents */}
              {activeTab === 'contracts' && (
                <button
                  onClick={() => setIsContractModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl hover:shadow-md hover:shadow-cyan-500/10 active:scale-95 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  {t('createContract')}
                </button>
              )}
            </div>

          </div>

          {/* TABLE VIEWS */}
          <div className="overflow-x-auto">
            
            {/* 1. CONTRACTS TABLE */}
            {activeTab === 'contracts' && (
              <table className="w-full text-start text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-start">{tContracts('contractNumber')}</th>
                    <th className="px-6 py-4 text-start">{tContracts('policyHolder')}</th>
                    <th className="px-6 py-4 text-start">{tContracts('category')}</th>
                    <th className="px-6 py-4 text-start">{tContracts('startDate')} / {tContracts('endDate')}</th>
                    <th className="px-6 py-4 text-start">{tContracts('premium')}</th>
                    <th className="px-6 py-4 text-start">{tContracts('status')}</th>
                    <th className="px-6 py-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">
                        {t('noContracts')}
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => (
                      <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4.5 h-4.5 text-zinc-400" />
                            <span className="font-mono font-bold text-zinc-900 dark:text-white">{c.contract_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {isRtl ? c.client_name_ar : c.client_name_en}
                          </div>
                          <div className="text-xxs text-zinc-400 font-medium">{c.client_email} • {c.client_phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="capitalize px-2.5 py-1 rounded-full text-xxs font-semibold bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300">
                            {tInsurance(`categories.${c.type}` as any)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-medium">
                          <div>{c.start_date}</div>
                          <div className="text-xxs text-zinc-450">{c.end_date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-900 dark:text-white">
                          {new Intl.NumberFormat('en-US').format(parseFloat(c.monthly_premium))} DZD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold ${
                            c.status === 'active' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 animate-pulse'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {tInsurance(`status.${c.status}` as any)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {c.status === 'pending' ? (
                            <button
                              onClick={() => {
                                setSelectedContractForPayment(c);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-750 hover:to-teal-750 active:scale-95 transition inline-flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {isRtl ? 'دفع وتفعيل' : 'Pay & Activate'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 font-semibold inline-flex items-center gap-1 justify-center">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              {isRtl ? 'مفعّل' : 'Activated'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 2. CLAIMS TABLE */}
            {activeTab === 'claims' && (
              <table className="w-full text-start text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-start">{tClaims('claimNumber')}</th>
                    <th className="px-6 py-4 text-start">{tContracts('contractNumber')}</th>
                    <th className="px-6 py-4 text-start">{t('client')}</th>
                    <th className="px-6 py-4 text-start">{tClaims('dateSubmitted')}</th>
                    <th className="px-6 py-4 text-start">{tClaims('estimatedAmount')}</th>
                    <th className="px-6 py-4 text-start">{tClaims('status')}</th>
                    <th className="px-6 py-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">
                        {t('noClaims')}
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((cl) => (
                      <tr key={cl.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-zinc-900 dark:text-white">
                          {cl.claim_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-zinc-500 font-semibold">
                          {cl.contract_number}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {isRtl ? cl.client_name_ar : cl.client_name_en}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-semibold">
                          {cl.incident_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold">
                          {new Intl.NumberFormat('en-US').format(parseFloat(cl.estimated_amount))} DZD
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold ${
                            cl.status === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 animate-pulse'
                              : cl.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              cl.status === 'pending' ? 'bg-amber-500' : cl.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />
                            {tInsurance(`status.${cl.status}` as any)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {cl.status === 'pending' ? (
                            <button
                              onClick={() => {
                                setSelectedClaim(cl);
                                setIsClaimReviewModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 active:scale-95 transition"
                            >
                              {t('reviewClaim')}
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 font-semibold">
                              {cl.status === 'approved' 
                                ? `${new Intl.NumberFormat('en-US').format(parseFloat(cl.approved_amount || '0'))} DZD`
                                : cl.rejection_reason || 'Rejected'
                              }
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 3. B2B TRANSFERS TABLE */}
            {activeTab === 'transfers' && (
              <table className="w-full text-start text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-start">{tContracts('contractNumber')}</th>
                    <th className="px-6 py-4 text-start">{t('client')}</th>
                    <th className="px-6 py-4 text-start">{isRtl ? 'من شركة' : 'From Company'}</th>
                    <th className="px-6 py-4 text-start">{isRtl ? 'إلى شركة' : 'To Company'}</th>
                    <th className="px-6 py-4 text-start">{tTransfers('dateRequested')}</th>
                    <th className="px-6 py-4 text-start">{tTransfers('status')}</th>
                    <th className="px-6 py-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-400 font-medium">
                        {t('noTransfers')}
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((tr) => {
                      const isIncoming = tr.from_company_id === company.id;
                      return (
                        <tr key={tr.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition">
                          <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-zinc-900 dark:text-white">
                            {tr.contract_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-zinc-900 dark:text-white">
                              {isRtl ? tr.client_name_ar : tr.client_name_en}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">
                            {isRtl ? tr.from_name_ar : tr.from_name_en}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">
                            {isRtl ? tr.to_name_ar : tr.to_name_en}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                            {tr.requested_at.slice(0, 10)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold ${
                              tr.status === 'pending'
                                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400'
                                : tr.status === 'approved'
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                tr.status === 'pending' ? 'bg-amber-500' : tr.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`} />
                              {tInsurance(`status.${tr.status}` as any)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {tr.status === 'pending' && isIncoming ? (
                              <button
                                onClick={() => {
                                  setSelectedTransfer(tr);
                                  setIsTransferReviewModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition"
                              >
                                {t('reviewTransfer')}
                              </button>
                            ) : (
                              <span className="text-[11px] text-zinc-400 font-semibold">
                                {isIncoming ? 'Reviewed' : 'Awaiting Release'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

          </div>

          {/* 4. ANALYTICS VIEW */}
          {activeTab === 'analytics' && (
            <div className="p-6 space-y-8 animate-fade-in border-t border-zinc-100 dark:border-zinc-800">
              
              {/* Analytics Header Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Metric 1: Loss Ratio */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-100/50 dark:border-purple-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xxs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {t('lossRatio') || (isRtl ? 'نسبة الخسارة' : 'Loss Ratio')}
                    </span>
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white">
                      {calculatedLossRatio}%
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      calculatedLossRatio < 60 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                        : calculatedLossRatio < 80 
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' 
                        : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {calculatedLossRatio < 60 
                        ? (isRtl ? 'ممتاز' : 'Healthy') 
                        : calculatedLossRatio < 80 
                        ? (isRtl ? 'معتدل' : 'Moderate') 
                        : (isRtl ? 'خطورة عالية' : 'High Risk')
                      }
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                    {isRtl 
                      ? 'نسبة المطالبات المدفوعة إلى إجمالي الأقساط السنوية.' 
                      : 'Ratio of paid claims to total active annual premiums.'
                    }
                  </p>
                </div>

                {/* Metric 2: Projected Annual Revenue */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-teal-500/5 border border-cyan-100/50 dark:border-cyan-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xxs font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                      {isRtl ? 'الأقساط السنوية المتوقعة' : 'Projected Annual Revenue'}
                    </span>
                    <Briefcase className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white">
                    {new Intl.NumberFormat('en-US').format(totalActivePremium * 12)} DZD
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                    {isRtl 
                      ? 'بناءً على الأقساط الشهرية النشطة الحالية.' 
                      : 'Based on current active monthly policy premiums.'
                    }
                  </p>
                </div>

                {/* Metric 3: Total Claims Paid Out */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-500/5 to-orange-500/5 border border-rose-100/50 dark:border-rose-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xxs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      {t('claimsPayout') || (isRtl ? 'المطالبات المدفوعة' : 'Claims Paid Out')}
                    </span>
                    <FileCheck2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-3xl font-black text-zinc-900 dark:text-white">
                    {new Intl.NumberFormat('en-US').format(totalClaimsPaid)} DZD
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                    {isRtl 
                      ? 'إجمالي تعويضات المطالبات المقبولة.' 
                      : 'Total payout of approved and finalized claims.'
                    }
                  </p>
                </div>

              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Premium vs Claims Chart */}
                <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-100">
                      {t('premiumVsClaims') || (isRtl ? 'الأقساط مقابل المطالبات' : 'Premiums vs Claims')}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {isRtl ? 'تطور الأقساط المحصلة والتعويضات المدفوعة شهرياً' : 'Monthly trend of collected premiums and paid claims'}
                    </p>
                  </div>
                  <div className="h-72 w-full text-[10px] font-medium">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyTrendData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800/50" />
                        <XAxis dataKey="name" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgb(24 24 27)', 
                            border: '1px solid rgb(63 63 70)',
                            borderRadius: '12px',
                            color: '#fff' 
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="Premium" 
                          name={isRtl ? 'الأقساط' : 'Premium'} 
                          stroke="#06b6d4" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorPremium)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Claims" 
                          name={isRtl ? 'المطالبات' : 'Claims'} 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorClaims)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Policy Type Distribution Pie Chart */}
                <div className="p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-zinc-850 dark:text-zinc-100">
                      {t('distribution') || (isRtl ? 'توزيع بوالص التأمين' : 'Policy Distribution')}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      {isRtl ? 'توزيع العقود والاشتراكات حسب فئات التأمين' : 'Distribution of active policies across insurance categories'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-around h-72">
                    {distributionData.length > 0 ? (
                      <>
                        <div className="h-56 w-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={distributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {distributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                        
                        <div className="flex flex-col gap-2 mt-4 sm:mt-0 max-w-[200px] w-full">
                          {distributionData.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between text-xxs">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-zinc-650 dark:text-zinc-400 font-semibold">{entry.name}</span>
                              </div>
                              <span className="font-bold text-zinc-905 dark:text-white">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-zinc-400 italic">
                        {isRtl ? 'لا توجد بيانات بوالص كافية للرسم البياني' : 'No policy data available for charting'}
                      </div>
                    )}
                  </div>
                </div>

              </div>
              
            </div>
          )}

      </section>

      </main>

      {/* MODALS */}

      {/* 1. CREATE CONTRACT MODAL */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsContractModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {tContracts('createContract')}
                </h3>
                <p className="text-xxs text-zinc-400">
                  Fill in all required fields to activate a new insurance policy
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-5">
              
              {/* Client and Policy Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {t('client')} *
                  </label>
                  <select
                    required
                    value={newContractForm.clientId}
                    onChange={(e) => setNewContractForm({ ...newContractForm, clientId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                  >
                    <option value="">{isRtl ? 'اختر عميل' : 'Select a client'}</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {isRtl ? c.full_name_ar : c.full_name_en} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {tContracts('category')} *
                  </label>
                  <select
                    required
                    value={newContractForm.type}
                    onChange={(e) => setNewContractForm({ ...newContractForm, type: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                  >
                    <option value="car">{tInsurance('categories.car')}</option>
                    <option value="home">{tInsurance('categories.home')}</option>
                    <option value="health">{tInsurance('categories.health')}</option>
                    <option value="life">{tInsurance('categories.life')}</option>
                    <option value="agriculture">{tInsurance('categories.agriculture')}</option>
                  </select>
                </div>
              </div>

              {/* Pricing details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {isRtl ? 'خطة التأمين' : 'Insurance Plan'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tous Risques, Basique"
                    value={newContractForm.plan}
                    onChange={(e) => setNewContractForm({ ...newContractForm, plan: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {isRtl ? 'القسط الشهري (د.ج)' : 'Monthly Premium (DZD)'} *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500"
                    value={newContractForm.monthlyPremium}
                    onChange={(e) => setNewContractForm({ ...newContractForm, monthlyPremium: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {isRtl ? 'المبلغ المقتطع (د.ج)' : 'Deductible (DZD)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={newContractForm.deductible}
                    onChange={(e) => setNewContractForm({ ...newContractForm, deductible: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Coverage and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {isRtl ? 'مبلغ التغطية الأقصى (د.ج)' : 'Coverage Limit (DZD)'} *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500000"
                    value={newContractForm.coverageAmount}
                    onChange={(e) => setNewContractForm({ ...newContractForm, coverageAmount: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {tContracts('startDate')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={newContractForm.startDate}
                    onChange={(e) => setNewContractForm({ ...newContractForm, startDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {tContracts('endDate')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={newContractForm.endDate}
                    onChange={(e) => setNewContractForm({ ...newContractForm, endDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Conditional Vehicle details for Car type */}
              {newContractForm.type === 'car' && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 space-y-4">
                  <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                    {isRtl ? 'تفاصيل المركبة' : 'Vehicle Specifications'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Make</label>
                      <input
                        type="text"
                        placeholder="e.g. Peugeot"
                        value={newContractForm.vehicleMake}
                        onChange={(e) => setNewContractForm({ ...newContractForm, vehicleMake: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Model</label>
                      <input
                        type="text"
                        placeholder="e.g. 208"
                        value={newContractForm.vehicleModel}
                        onChange={(e) => setNewContractForm({ ...newContractForm, vehicleModel: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Year</label>
                      <input
                        type="number"
                        placeholder="e.g. 2021"
                        value={newContractForm.vehicleYear}
                        onChange={(e) => setNewContractForm({ ...newContractForm, vehicleYear: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xxs font-extrabold text-zinc-500 mb-1">License Plate</label>
                      <input
                        type="text"
                        placeholder="e.g. 01234-121-16"
                        value={newContractForm.vehiclePlate}
                        onChange={(e) => setNewContractForm({ ...newContractForm, vehiclePlate: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-extrabold text-zinc-500 mb-1">VIN / Chassis Number</label>
                      <input
                        type="text"
                        placeholder="17-digit code"
                        value={newContractForm.vehicleVin}
                        onChange={(e) => setNewContractForm({ ...newContractForm, vehicleVin: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Property details for Home type */}
              {newContractForm.type === 'home' && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 space-y-4">
                  <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                    {isRtl ? 'تفاصيل العقار' : 'Property Specifications'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Address</label>
                      <input
                        type="text"
                        placeholder="Property street address"
                        value={newContractForm.propertyAddress}
                        onChange={(e) => setNewContractForm({ ...newContractForm, propertyAddress: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Wilaya</label>
                      <input
                        type="text"
                        placeholder="e.g. Algiers"
                        value={newContractForm.propertyWilaya}
                        onChange={(e) => setNewContractForm({ ...newContractForm, propertyWilaya: e.target.value })}
                        className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Property Area (Sqm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={newContractForm.propertyAreaSqm}
                      onChange={(e) => setNewContractForm({ ...newContractForm, propertyAreaSqm: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Beneficiary count for health/life type */}
              {(newContractForm.type === 'health' || newContractForm.type === 'life') && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850">
                  <div>
                    <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                      {isRtl ? 'عدد المستفيدين' : 'Beneficiaries Count'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newContractForm.beneficiariesCount}
                      onChange={(e) => setNewContractForm({ ...newContractForm, beneficiariesCount: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                  {isRtl ? 'ملاحظات إضافية' : 'Notes / Additional Information'}
                </label>
                <textarea
                  placeholder="Additional contract details"
                  rows={2}
                  value={newContractForm.notes}
                  onChange={(e) => setNewContractForm({ ...newContractForm, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4.5 py-2.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl transition"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl hover:shadow-md disabled:opacity-50 transition"
                >
                  {submitting ? 'Creating...' : tCommon('save')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. CLAIM REVIEW MODAL */}
      {isClaimReviewModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsClaimReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {t('reviewClaim')}
              </h3>
              <p className="text-xxs text-zinc-400">
                Claim {selectedClaim.claim_number} • Contract {selectedClaim.contract_number}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/50 dark:border-zinc-850 space-y-2.5 mb-5 text-xxs text-zinc-500">
              <div>
                <span className="font-extrabold text-zinc-450 uppercase block">Client</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {isRtl ? selectedClaim.client_name_ar : selectedClaim.client_name_en} ({selectedClaim.client_email})
                </span>
              </div>
              <div>
                <span className="font-extrabold text-zinc-450 uppercase block">Incident Date</span>
                <span className="font-semibold text-zinc-900 dark:text-white">{selectedClaim.incident_date}</span>
              </div>
              <div>
                <span className="font-extrabold text-zinc-450 uppercase block">Client Description</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block italic">
                  "{selectedClaim.description}"
                </span>
              </div>
              <div>
                <span className="font-extrabold text-zinc-450 uppercase block">Estimated Claim Amount</span>
                <span className="font-black text-zinc-900 dark:text-white">
                  {new Intl.NumberFormat('en-US').format(parseFloat(selectedClaim.estimated_amount))} DZD
                </span>
              </div>
              <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <span className="font-extrabold text-zinc-450 uppercase block mb-1.5">{t('viewDocuments')}</span>
                {selectedClaim.documents && Array.isArray(selectedClaim.documents) && selectedClaim.documents.length > 0 ? (
                  <div className="space-y-1.5 mt-1">
                    {selectedClaim.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                            {doc.name || `Document ${idx + 1}`}
                          </span>
                          {doc.size && (
                            <span className="text-[10px] text-zinc-450">({doc.size})</span>
                          )}
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 text-[10px] font-bold text-cyan-650 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 rounded-lg transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t('preview')}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-zinc-400 italic block mt-1">{t('noDocuments')}</span>
                )}
              </div>
            </div>

            <form onSubmit={handleReviewClaim} className="space-y-4">
              
              <div>
                <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-3 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setClaimActionType('approved')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${
                      claimActionType === 'approved' 
                        ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-450 shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    {t('approve')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClaimActionType('rejected')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${
                      claimActionType === 'rejected' 
                        ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-450 shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    {t('reject')}
                  </button>
                </div>
              </div>

              {claimActionType === 'approved' ? (
                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {t('approvedAmount')} *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Enter approved payout amount"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {t('rejectionReason')} *
                  </label>
                  <textarea
                    required
                    placeholder="Explain why this claim is rejected"
                    rows={3}
                    value={claimRejectionReason}
                    onChange={(e) => setClaimRejectionReason(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsClaimReviewModalOpen(false)}
                  className="px-4.5 py-2.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 transition"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting...' : tCommon('submit')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 3. B2B TRANSFER REVIEW MODAL */}
      {isTransferReviewModalOpen && selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsTransferReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {t('reviewTransfer')}
              </h3>
              <p className="text-xxs text-zinc-400">
                Contract Transfer • {selectedTransfer.contract_number}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-250/50 dark:border-zinc-850 space-y-2.5 mb-5 text-xxs text-zinc-500">
              <div>
                <span className="font-extrabold text-zinc-450 uppercase block">Client</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {isRtl ? selectedTransfer.client_name_ar : selectedTransfer.client_name_en}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-extrabold text-zinc-450 uppercase block">Source (Releasing)</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {isRtl ? selectedTransfer.from_name_ar : selectedTransfer.from_name_en}
                  </span>
                </div>
                <div>
                  <span className="font-extrabold text-zinc-450 uppercase block">Target (Receiving)</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {isRtl ? selectedTransfer.to_name_ar : selectedTransfer.to_name_en}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-extrabold text-zinc-450 uppercase block">Request Reason</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 block italic">
                  "{selectedTransfer.reason}"
                </span>
              </div>
            </div>

            <form onSubmit={handleReviewTransfer} className="space-y-4">
              
              <div>
                <label className="block text-xxs font-extrabold text-zinc-500 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-3 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTransferActionType('approved')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${
                      transferActionType === 'approved' 
                        ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-450 shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    {tTransfers('approve')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferActionType('rejected')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition ${
                      transferActionType === 'rejected' 
                        ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-450 shadow-sm'
                        : 'text-zinc-500'
                    }`}
                  >
                    {tTransfers('reject')}
                  </button>
                </div>
              </div>

              {transferActionType === 'rejected' && (
                <div>
                  <label className="block text-xxs font-extrabold text-zinc-500 mb-1">
                    {t('rejectionReason')} *
                  </label>
                  <textarea
                    required
                    placeholder="Reason for rejecting release"
                    rows={3}
                    value={transferRejectionReason}
                    onChange={(e) => setTransferRejectionReason(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsTransferReviewModalOpen(false)}
                  className="px-4.5 py-2.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 transition"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:opacity-90 disabled:opacity-50 transition"
                >
                  {submitting ? 'Submitting...' : tCommon('submit')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
