'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  CheckCircle2, 
  UploadCloud, 
  AlertCircle, 
  Trash2, 
  Building2, 
  Sparkles, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  Briefcase, 
  FileCheck2, 
  User, 
  Download, 
  Plus, 
  HelpCircle,
  FileBadge,
  Calendar,
  Layers,
  Search,
  CheckCircle,
  ArrowLeft,
  Printer,
  QrCode,
  PieChart as PieIcon,
  BarChart2,
  UserCircle
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
  Tooltip
} from 'recharts';
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
  notes?: string;
  data?: any;
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
  description?: string;
  documents?: any;
}

interface Company {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
}

interface ClientDashboardClientProps {
  user: {
    id: string;
    email: string;
    fullNameAr: string;
    fullNameEn: string;
    role: string;
    phone?: string;
    nin?: string;
    createdAt?: string;
  };
  contracts: Contract[];
  claims: Claim[];
  companies: Company[];
}

interface UploadedFile {
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedAt: string;
  category: string;
}

const CATEGORIES = [
  { value: 'car', labelEn: 'Automobile Insurance', labelAr: 'تأمين السيارات', labelFr: 'Assurance Automobile', icon: '🚗' },
  { value: 'home', labelEn: 'Home Insurance', labelAr: 'تأمين السكن', labelFr: 'Assurance Habitation', icon: '🏠' },
  { value: 'health', labelEn: 'Health Insurance', labelAr: 'تأمين صحي', labelFr: 'Assurance Santé', icon: '🏥' },
  { value: 'life', labelEn: 'Life Insurance', labelAr: 'تأمين على الحياة', labelFr: 'Assurance Vie', icon: '👥' },
  { value: 'agriculture', labelEn: 'Agricultural Insurance', labelAr: 'التأمين الفلاحي', labelFr: 'Assurance Agricole', icon: '🌾' },
];

const PLANS = [
  { value: 'Standard', labelEn: 'Standard Plan', labelAr: 'المخطط القياسي', labelFr: 'Formule Standard', descEn: 'Essential liability and damage coverage', descAr: 'تغطية المسؤولية والأضرار الأساسية', descFr: 'Couverture responsabilité et dommages essentiels' },
  { value: 'Premium', labelEn: 'Premium Plan', labelAr: 'المخطط الممتاز', labelFr: 'Formule Premium', descEn: 'All-inclusive premium packages with lowest deductibles', descAr: 'باقات شاملة وممتازة مع أدنى حد من الاستقطاعات', descFr: 'Formules intégrales haut de gamme avec franchises minimales' },
];

// Helper to calculate premium and coverage based on type & plan (Monthly Premium & Maximum Coverage in DZD)
const calculateRates = (type: string, plan: string) => {
  switch (type) {
    case 'car':
      return plan === 'Standard' 
        ? { coverage: 2500000, premium: 2600 }
        : { coverage: 5000000, premium: 4800 };
    case 'home':
      return plan === 'Standard'
        ? { coverage: 8000000, premium: 650 }
        : { coverage: 18000000, premium: 1600 };
    case 'health':
      return plan === 'Standard'
        ? { coverage: 600000, premium: 1800 }
        : { coverage: 1500000, premium: 3800 };
    case 'life':
      return plan === 'Standard'
        ? { coverage: 4000000, premium: 2500 }
        : { coverage: 10000000, premium: 4800 };
    case 'agriculture':
      return plan === 'Standard'
        ? { coverage: 7500000, premium: 3200 }
        : { coverage: 18000000, premium: 6800 };
    default:
      return { coverage: 0, premium: 0 };
  }
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatCurrency = (val: number) => {
      return `${new Intl.NumberFormat('en-US').format(val)} DZD`;
    };

    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
        <p className="font-extrabold text-zinc-900 dark:text-zinc-100">
          {data.name || label}
        </p>
        {data.premium !== undefined && (
          <p className="text-zinc-650 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-450">Annualized Premium:</span> {formatCurrency(data.premium)}
          </p>
        )}
        {data.annualPremium !== undefined && (
          <p className="text-zinc-650 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-450">Annual Premium:</span> {formatCurrency(data.annualPremium)}
          </p>
        )}
        {data.monthlyPremium !== undefined && (
          <p className="text-zinc-650 dark:text-zinc-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-450">Monthly Premium:</span> {formatCurrency(data.monthlyPremium)}
          </p>
        )}
        {data.coverage !== undefined && data.coverage > 0 && (
          <p className="text-zinc-655 dark:text-zinc-350">
            <span className="font-semibold">Coverage:</span> {formatCurrency(data.coverage)}
          </p>
        )}
        {data.count !== undefined && (
          <p className="text-zinc-500">
            <span className="font-semibold">Policies:</span> {data.count}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ClientDashboardClient({ 
  user, 
  contracts: initialContracts, 
  claims: initialClaims, 
  companies = [] 
}: ClientDashboardClientProps) {
  const tCommon = useTranslations('common');
  const tContracts = useTranslations('contracts');
  const tClaims = useTranslations('claims');
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === 'ar';

  const txt = (ar: string, fr: string, en: string) => {
    if (locale === 'ar') return ar;
    if (locale === 'fr') return fr;
    return en;
  };

  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [claims, setClaims] = useState<Claim[]>(initialClaims);

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'claim' | 'documents' | 'profile'>('overview');

  // ── Toast notifications (replaces browser alert())
  type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // ── Confirm sheet (replaces window.confirm())
  const [confirmSheet, setConfirmSheet] = useState<{ open: boolean; message: string; onConfirm: () => void } | null>(null);
  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmSheet({ open: true, message, onConfirm });
  };
  
  // Set default tab to apply if new client
  useEffect(() => {
    if (contracts.length === 0) {
      setActiveTab('apply');
    }
  }, [contracts.length]);

  // Form State - Apply Policy
  const [applyCompany, setApplyCompany] = useState(companies[0]?.id || '');
  const [applyCategory, setApplyCategory] = useState('car');
  const [applyPlan, setApplyPlan] = useState('Standard');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  
  // Dynamic category fields
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleVin, setVehicleVin] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyWilaya, setPropertyWilaya] = useState('');
  const [propertyAreaSqm, setPropertyAreaSqm] = useState('');
  const [beneficiariesCount, setBeneficiariesCount] = useState('1');
  const [notes, setNotes] = useState('');

  // File Upload State
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingContractToPay, setPendingContractToPay] = useState<Contract | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'baridimob'>('card');
  const [paymentStep, setPaymentStep] = useState<'input' | 'otp' | 'success'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [receiptFile, setReceiptFile] = useState<UploadedFile | null>(null);
  const [receiptProgress, setReceiptProgress] = useState(0);
  const [isReceiptUploading, setIsReceiptUploading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Certificate Print State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedContractForPrint, setSelectedContractForPrint] = useState<Contract | null>(null);

  // Form State - Submit Claim
  const [claimContractId, setClaimContractId] = useState('');
  const [claimIncidentDate, setClaimIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [claimDescription, setClaimDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimFiles, setClaimFiles] = useState<UploadedFile[]>([]);
  const [claimProgress, setClaimProgress] = useState<Record<string, number>>({});
  const [isClaimSubmitting, setIsClaimSubmitting] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');

  // Form Submission Status
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const activeContractsList = contracts.filter((contract) => contract.status === 'active');
  const openClaimsList = claims.filter((claim) => claim.status !== 'rejected' && claim.status !== 'approved');

  // Chart colors (Sage theme matching the app aesthetic)
  const CHART_COLORS = [
    '#778873', // Sage / Olive
    '#b39c84', // Earth Clay
    '#a89875', // Ochre / Gold
    '#4f4830', // Deep Bronze
    '#a99f88', // Dried Moss
  ];

  const portfolioDistribution = React.useMemo(() => {
    const categoriesMap: Record<string, { name: string; coverage: number; premium: number; count: number }> = {};
    
    // Initialize map
    CATEGORIES.forEach(cat => {
      const catLabel = locale === 'ar' ? cat.labelAr : locale === 'fr' ? cat.labelFr : cat.labelEn;
      categoriesMap[cat.value] = {
        name: catLabel,
        coverage: 0,
        premium: 0,
        count: 0
      };
    });

    contracts.forEach(c => {
      if (c.status === 'active' || c.status === 'pending') {
        const catValue = c.type;
        const current = categoriesMap[catValue] || {
          name: catValue,
          coverage: 0,
          premium: 0,
          count: 0
        };
        current.coverage += parseFloat(c.coverage_amount || '0');
        current.premium += parseFloat(c.monthly_premium || '0') * 12; // Annualized
        current.count += 1;
        categoriesMap[catValue] = current;
      }
    });

    return Object.keys(categoriesMap)
      .map(key => ({
        category: key,
        ...categoriesMap[key]
      }))
      .filter(item => item.count > 0);
  }, [contracts, locale]);

  const premiumCostByPolicy = React.useMemo(() => {
    return contracts
      .filter(c => c.status === 'active' || c.status === 'pending')
      .map(c => {
        const cat = CATEGORIES.find(cat => cat.value === c.type);
        const nameLabel = locale === 'ar' ? (c.company_name_ar || c.company_name_en) : (c.company_name_en || c.company_name_ar);
        const catLabel = locale === 'ar' ? cat?.labelAr : locale === 'fr' ? cat?.labelFr : cat?.labelEn;
        return {
          id: c.id,
          name: `${nameLabel} (${catLabel || c.type})`,
          monthlyPremium: parseFloat(c.monthly_premium || '0'),
          annualPremium: parseFloat(c.monthly_premium || '0') * 12,
          coverage: parseFloat(c.coverage_amount || '0'),
          shortNumber: c.contract_number.slice(0, 8) + '...'
        };
      });
  }, [contracts, locale]);

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Simulate File Uploading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isClaimForm = false) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const fileId = `${file.name}-${Date.now()}`;
      
      // Initialize simulated progress
      if (isClaimForm) {
        setClaimProgress(prev => ({ ...prev, [fileId]: 0 }));
      } else {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      }
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          const uploaded: UploadedFile = {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            type: file.type || 'application/pdf',
            url: `https://daman.dz/documents/${encodeURIComponent(file.name)}`,
            uploadedAt: new Date().toLocaleString(),
            category: isClaimForm ? 'claim' : 'policy'
          };
          
          if (isClaimForm) {
            setClaimFiles(prev => [...prev, uploaded]);
          } else {
            setAttachedFiles(prev => [...prev, uploaded]);
          }
        }
        
        if (isClaimForm) {
          setClaimProgress(prev => ({ ...prev, [fileId]: currentProgress }));
        } else {
          setUploadProgress(prev => ({ ...prev, [fileId]: currentProgress }));
        }
      }, 300);
    });
  };

  const removeFile = (index: number, isClaimForm = false) => {
    if (isClaimForm) {
      setClaimFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Parse all uploaded documents across user contracts and claims
  const getDocumentHistory = (): UploadedFile[] => {
    const list: UploadedFile[] = [];
    
    // Parse from contracts notes (which may contain JSON array of files)
    contracts.forEach(c => {
      if (c.notes && c.notes.startsWith('[')) {
        try {
          const files = JSON.parse(c.notes);
          if (Array.isArray(files)) {
            files.forEach((f: any) => {
              list.push({
                name: f.name || 'Contract Attachment',
                size: f.size || 'N/A',
                type: f.type || 'application/pdf',
                url: f.url || '#',
                uploadedAt: f.uploadedAt || c.start_date,
                category: `Policy (${c.contract_number})`
              });
            });
          }
        } catch (e) {}
      }
    });

    // Parse from claims documents
    claims.forEach(cl => {
      if (cl.documents) {
        let docs = cl.documents;
        if (typeof docs === 'string' && docs.startsWith('[')) {
          try {
            docs = JSON.parse(docs);
          } catch (e) {}
        }
        if (Array.isArray(docs)) {
          docs.forEach((f: any) => {
            list.push({
              name: f.name || 'Claim Document',
              size: f.size || 'N/A',
              type: f.type || 'application/pdf',
              url: f.url || '#',
              uploadedAt: f.uploadedAt || cl.submitted_at.slice(0, 10),
              category: `Claim (${cl.claim_number})`
            });
          });
        }
      }
    });

    return list;
  };

  const documentHistory = getDocumentHistory();

  // Handle Policy Application
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const rates = calculateRates(applyCategory, applyPlan);

    const payload = {
      companyId: applyCompany || companies[0]?.id,
      type: applyCategory,
      plan: applyPlan,
      coverageAmount: rates.coverage,
      monthlyPremium: rates.premium,
      startDate,
      endDate,
      vehicleMake: applyCategory === 'car' ? vehicleMake : undefined,
      vehicleModel: applyCategory === 'car' ? vehicleModel : undefined,
      vehicleYear: applyCategory === 'car' ? vehicleYear : undefined,
      vehiclePlate: applyCategory === 'car' ? vehiclePlate : undefined,
      vehicleVin: applyCategory === 'car' ? vehicleVin : undefined,
      propertyAddress: applyCategory === 'home' ? propertyAddress : undefined,
      propertyWilaya: applyCategory === 'home' ? propertyWilaya : undefined,
      propertyAreaSqm: applyCategory === 'home' ? propertyAreaSqm : undefined,
      beneficiariesCount: ['health', 'life'].includes(applyCategory) ? beneficiariesCount : undefined,
      notes: attachedFiles.length > 0 ? JSON.stringify(attachedFiles) : notes || 'No extra notes'
    };

    try {
      const response = await fetch('/api/client/contracts/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Something went wrong');
      }

      const newContract = resData.contract;
      // Add localized company name manually for instant update
      const chosenCompany = companies.find(c => c.id === payload.companyId);
      newContract.company_name_en = chosenCompany?.name_en || 'Insurance Partner';
      newContract.company_name_ar = chosenCompany?.name_ar || 'شريك تأمين';

      setContracts(prev => [newContract, ...prev]);
      setPendingContractToPay(newContract);
      setFormSuccess(true);
      setPaymentModalOpen(true); // Auto-open payment portal!
      
      // Clear form
      setVehicleMake('');
      setVehicleModel('');
      setVehicleYear('');
      setVehiclePlate('');
      setVehicleVin('');
      setPropertyAddress('');
      setPropertyWilaya('');
      setPropertyAreaSqm('');
      setAttachedFiles([]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit application');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Cancel Pending Policy Application
  const handleCancelContract = async (contractId: string) => {
    showConfirm(
      isRtl ? 'هل أنت متأكد من إلغاء طلب التأمين هذا؟' : 'Are you sure you want to cancel this insurance request?',
      async () => {
        try {
          const response = await fetch('/api/client/contracts/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Failed to cancel');
          setContracts(prev => prev.filter(c => c.id !== contractId));
          showToast(isRtl ? 'تم إلغاء الطلب بنجاح' : 'Application cancelled successfully', 'success');
        } catch (err: any) {
          showToast(err.message || 'Error cancelling request', 'error');
        }
      }
    );
  };

  // Handle Print Certificate Action
  const handlePrintCertificate = (contract: Contract) => {
    setSelectedContractForPrint(contract);
    setPrintModalOpen(true);
  };

  // Simulate receipt file upload for bank transfer
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsReceiptUploading(true);
    setReceiptProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setReceiptFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'image/png',
          url: `https://daman.dz/receipts/${encodeURIComponent(file.name)}`,
          uploadedAt: new Date().toLocaleDateString(),
          category: 'Bank Transfer Receipt'
        });
        setIsReceiptUploading(false);
      }
      setReceiptProgress(progress);
    }, 200);
  };

  // Reset payment states on modal close
  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setPendingContractToPay(null);
    setPaymentMethod('card');
    setPaymentStep('input');
    setOtpCode('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setReceiptFile(null);
    setReceiptProgress(0);
    setIsReceiptUploading(false);
    setPaymentSuccess(false);
    setPaymentLoading(false);
  };

  // Handles moving from card input to OTP step
  const handleCardPaymentSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      showToast(isRtl ? 'يرجى ملء جميع حقول البطاقة.' : 'Please fill in all card details.', 'error');
      return;
    }
    setPaymentLoading(true);
    setTimeout(() => {
      setPaymentLoading(false);
      setPaymentStep('otp');
    }, 1200);
  };

  // Handle Mock Card Payment & Activation
  const handlePaymentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingContractToPay) return;
    
    setPaymentLoading(true);
    
    // Simulate gateway/processing delay
    setTimeout(async () => {
      try {
        const response = await fetch('/api/client/contracts/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractId: pendingContractToPay.id }),
        });
        
        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.message || 'Payment failed');
        }

        // Update local state status
        setContracts(prev => prev.map(c => c.id === pendingContractToPay.id ? { ...c, status: 'active' } : c));
        setPaymentStep('success');
        setPaymentSuccess(true);
        
        setTimeout(() => {
          handleClosePaymentModal();
          setActiveTab('overview');
        }, 2000);

      } catch (err: any) {
        showToast(err.message || 'Payment failed. Please retry.', 'error');
      } finally {
        setPaymentLoading(false);
      }
    }, 1500);
  };

  // Handle Claim Submission
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClaimSubmitting(true);
    setClaimSuccessMessage('');

    if (!claimContractId) {
      showToast(isRtl ? 'يرجى اختيار عقد تأمين' : 'Please select a policy', 'error');
      setIsClaimSubmitting(false);
      return;
    }

    const payload = {
      contractId: claimContractId,
      incidentDate: claimIncidentDate,
      description: claimDescription,
      claimedAmount: parseFloat(claimAmount),
      documents: claimFiles
    };

    try {
      const response = await fetch('/api/client/claims/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to file claim');
      }

      const newClaim = resData.claim;
      const contractRef = contracts.find(c => c.id === claimContractId);
      newClaim.policy_number = contractRef?.contract_number || 'N/A';
      newClaim.company_name_en = contractRef?.company_name_en || 'Partner';
      newClaim.company_name_ar = contractRef?.company_name_ar || 'شريك';

      setClaims(prev => [newClaim, ...prev]);
      setClaimSuccessMessage(isRtl ? 'تم إرسال المطالبة وتوثيقها بنجاح!' : 'Claim filed and documented successfully!');
      
      // Reset form
      setClaimContractId('');
      setClaimDescription('');
      setClaimAmount('');
      setClaimFiles([]);
      
      setTimeout(() => {
        setClaimSuccessMessage('');
        setActiveTab('overview');
      }, 2500);
    } catch (err: any) {
      showToast(err.message || 'Error filing claim', 'error');
    } finally {
      setIsClaimSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300">

      {/* ── TOAST STACK (top-right, mobile-safe) ── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 'min(340px, calc(100vw - 2rem))' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error'   ? 'bg-rose-600 text-white' :
            'bg-zinc-800 text-white'
          }`}>
            <span className="text-base leading-none mt-0.5">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>

      {/* ── CONFIRM BOTTOM SHEET ── */}
      {confirmSheet?.open && (
        <div className="fixed inset-0 z-[90] flex flex-col justify-end" onClick={() => setConfirmSheet(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="sheet-enter relative bg-white dark:bg-zinc-900 rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-5" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 text-center mb-6 leading-relaxed">{confirmSheet.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSheet(null)} className="flex-1 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-300 active:scale-95 transition-transform">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={() => { confirmSheet.onConfirm(); setConfirmSheet(null); }} className="flex-1 py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold active:scale-95 transition-transform">
                {isRtl ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Top Banner for New Users */}
      {contracts.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 text-white px-6 py-3.5 text-center text-xs font-bold flex items-center justify-center gap-2 relative overflow-hidden">
          <Sparkles className="w-4 h-4 animate-bounce" />
          <span>
            {txt(
              'مرحباً بك في Insure Me! يرجى تقديم طلبك الأول لتفعيل بوالص التأمين والمطالبات.',
              'Bienvenue sur Insure Me ! Veuillez soumettre votre première demande de police d\'assurance ci-dessous.',
              'Welcome to Insure Me! Submit your first insurance policy application below to start.'
            )}
          </span>
        </div>
      )}

      {/* HEADER SECTION — hidden on mobile, shown on desktop */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60">
        {/* ── Desktop header: original full layout ── */}
        <div className="hidden md:flex max-w-7xl mx-auto px-6 py-4 items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <FileBadge className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-xxs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400 font-extrabold">{tCommon('clientDashboardTitle')}</p>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{isRtl ? user.fullNameAr : user.fullNameEn}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <button onClick={handleLogout} className="px-4 py-2 text-xs rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-500 shadow-sm active:scale-95 transition-all">
              {tCommon('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD TABS NAVIGATION — desktop only, hidden on mobile (bottom nav takes over) */}
      <div className="hidden md:block border-b border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950/40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-start gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('overview')}
            disabled={contracts.length === 0}
            className={`px-5 py-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              contracts.length === 0 ? 'opacity-40 cursor-not-allowed border-transparent' :
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            {txt('نظرة عامة وبوالصي', 'Aperçu et mes polices', 'Policies Overview')}
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-5 py-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'apply'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Plus className="w-4 h-4" />
            {txt('طلب بوليصة وتأمين', 'Souscrire une police', 'Apply & Submit Files')}
          </button>
          <button
            onClick={() => setActiveTab('claim')}
            disabled={activeContractsList.length === 0}
            className={`px-5 py-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeContractsList.length === 0 ? 'opacity-40 cursor-not-allowed border-transparent' :
              activeTab === 'claim'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            {txt('تقديم مطالبة تعويض', 'Déclarer un sinistre', 'File a Claim')}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-5 py-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            {txt('مركز المستندات', 'Centre de documents', 'My Uploads Center')}
            {documentHistory.length > 0 && (
              <span className="ml-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">
                {documentHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION BAR — 5 icons ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* raised card effect */}
        <div className="mx-3 mb-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-xl shadow-black/10">
          <div className="flex items-center h-[62px] px-1">

            {/* 1 — Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              disabled={contracts.length === 0}
              className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] h-full rounded-xl transition-all duration-150 active:scale-90 ${
                contracts.length === 0 ? 'opacity-30 pointer-events-none' : ''
              } ${
                activeTab === 'overview' ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
              }`}
            >
              {activeTab === 'overview' && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded-full bg-emerald-500" />
              )}
              <Layers
                strokeWidth={activeTab === 'overview' ? 2.5 : 1.8}
                className={`w-[22px] h-[22px] transition-all ${
                  activeTab === 'overview' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />
              <span className={`text-[9px] font-bold leading-none transition-colors ${
                activeTab === 'overview' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}>
                {txt('بوالصي', 'Polices', 'Policies')}
              </span>
            </button>

            {/* 2 — Claims */}
            <button
              onClick={() => setActiveTab('claim')}
              disabled={activeContractsList.length === 0}
              className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] h-full rounded-xl transition-all duration-150 active:scale-90 ${
                activeContractsList.length === 0 ? 'opacity-30 pointer-events-none' : ''
              } ${
                activeTab === 'claim' ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
              }`}
            >
              {activeTab === 'claim' && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded-full bg-emerald-500" />
              )}
              <FileCheck2
                strokeWidth={activeTab === 'claim' ? 2.5 : 1.8}
                className={`w-[22px] h-[22px] transition-all ${
                  activeTab === 'claim' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />
              <span className={`text-[9px] font-bold leading-none transition-colors ${
                activeTab === 'claim' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}>
                {txt('مطالبة', 'Sinistre', 'Claims')}
              </span>
            </button>

            {/* 3 — Apply (CENTER FAB — raised Plus button) */}
            <div className="flex-1 flex items-center justify-center" style={{ marginBottom: '1.6rem' }}>
              <button
                onClick={() => setActiveTab('apply')}
                className="relative flex flex-col items-center justify-center w-[58px] h-[58px] rounded-[20px] active:scale-90 transition-all duration-150"
                style={{
                  background: activeTab === 'apply'
                    ? 'linear-gradient(145deg,#047857,#059669)'
                    : 'linear-gradient(145deg,#059669,#0d9488)',
                  boxShadow: '0 8px 24px rgba(5,150,105,0.45), 0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <Plus className="w-7 h-7 text-white" strokeWidth={2.8} />
                <span className="text-[8px] text-white/90 font-black leading-none mt-[2px]">
                  {txt('جديد', 'Nouveau', 'New')}
                </span>
              </button>
            </div>

            {/* 4 — Documents */}
            <button
              onClick={() => setActiveTab('documents')}
              className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] h-full rounded-xl transition-all duration-150 active:scale-90 ${
                activeTab === 'documents' ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
              }`}
            >
              {activeTab === 'documents' && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded-full bg-emerald-500" />
              )}
              <div className="relative">
                <FileText
                  strokeWidth={activeTab === 'documents' ? 2.5 : 1.8}
                  className={`w-[22px] h-[22px] transition-all ${
                    activeTab === 'documents' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                />
                {documentHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center leading-none">
                    {documentHistory.length > 9 ? '9+' : documentHistory.length}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-bold leading-none transition-colors ${
                activeTab === 'documents' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}>
                {txt('ملفات', 'Docs', 'Docs')}
              </span>
            </button>

            {/* 5 — Profile */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative flex-1 flex flex-col items-center justify-center gap-[3px] h-full rounded-xl transition-all duration-150 active:scale-90 ${
                activeTab === 'profile' ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
              }`}
            >
              {activeTab === 'profile' && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-[3px] rounded-full bg-emerald-500" />
              )}
              <UserCircle
                strokeWidth={activeTab === 'profile' ? 2.5 : 1.8}
                className={`w-[22px] h-[22px] transition-all ${
                  activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                }`}
              />
              <span className={`text-[9px] font-bold leading-none transition-colors ${
                activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
              }`}>
                {txt('حسابي', 'Profil', 'Profile')}
              </span>
            </button>

          </div>
        </div>
      </nav>


      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8 pb-bottom-nav md:pb-8">
        
        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & POLICY LIST                                 */}
        {/* ============================================================== */}
        {activeTab === 'overview' && contracts.length > 0 && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
              <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 md:p-5 hover:shadow-md transition">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{tCommon('insurancePolicyCount')}</span>
                <p className="text-2xl md:text-3xl font-black mt-2 text-zinc-900 dark:text-white">{contracts.length}</p>
                <div className="flex items-center gap-1 mt-2 text-xxs text-zinc-400 font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  {isRtl ? 'إجمالي البوالص المودعة' : 'Total policies registered'}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 md:p-5 hover:shadow-md transition">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{tCommon('activePolicies')}</span>
                <p className="text-2xl md:text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-400">{activeContractsList.length}</p>
                <div className="flex items-center gap-1 mt-2 text-xxs text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isRtl ? 'نشطة ومغطاة' : 'Fully active and covered'}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 md:p-5 hover:shadow-md transition">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{tCommon('insuranceClaimCount')}</span>
                <p className="text-2xl md:text-3xl font-black mt-2 text-zinc-900 dark:text-white">{claims.length}</p>
                <div className="flex items-center gap-1 mt-2 text-xxs text-zinc-400 font-medium">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  {isRtl ? 'مطالبات الحوادث المقدمة' : 'Filed accident reports'}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4 md:p-5 hover:shadow-md transition">
                <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">{tCommon('openClaims')}</span>
                <p className="text-2xl md:text-3xl font-black mt-2 text-amber-650 dark:text-amber-400">{openClaimsList.length}</p>
                <div className="flex items-center gap-1 mt-2 text-xxs text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  {isRtl ? 'قيد الدراسة والمراجعة' : 'Under assessment'}
                </div>
              </div>
            </div>

            {/* Visual Analytics Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
              {/* Premium & Policy Distribution Pie Chart */}
              <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    {isRtl ? 'توزيع الأقساط حسب الفئة' : 'Premium Distribution by Category'}
                  </h4>
                  {portfolioDistribution.length > 0 ? (
                    <div className="h-[180px] md:h-[240px] w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="h-[160px] md:h-[200px] w-full sm:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={portfolioDistribution}
                              dataKey="premium"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              innerRadius={45}
                              paddingAngle={4}
                            >
                              {portfolioDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full sm:w-1/2 space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {portfolioDistribution.map((entry, index) => {
                          const percent = (entry.premium / portfolioDistribution.reduce((acc, c) => acc + c.premium, 0)) * 100;
                          return (
                            <div key={entry.category} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} 
                                />
                                <span className="text-zinc-650 dark:text-zinc-400 font-medium">{entry.name}</span>
                              </div>
                              <span className="text-zinc-900 dark:text-zinc-200 font-bold">
                                {percent.toFixed(0)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-zinc-400 dark:text-zinc-550 text-xs">
                      {isRtl ? 'لا توجد بيانات كافية للرسم البياني' : 'No sufficient data for chart'}
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly/Annual Premiums comparison per company/policy */}
              <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    {isRtl ? 'القسط السنوي حسب العقد' : 'Annual Premium by Policy'}
                  </h4>
                  {premiumCostByPolicy.length > 0 ? (
                    <div className="h-[180px] md:h-[240px] w-full text-[11px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={premiumCostByPolicy}
                          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800/30" vertical={false} />
                          <XAxis 
                            dataKey="shortNumber" 
                            stroke="#a1a1aa" 
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#a1a1aa" 
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="annualPremium" 
                            fill="#778873" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-zinc-400 dark:text-zinc-550 text-xs">
                      {isRtl ? 'لا توجد بيانات كافية للرسم البياني' : 'No sufficient data for chart'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Lists Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Policies list column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4.5 h-4.5 text-emerald-500" />
                    {isRtl ? 'قائمة بوالص التأمين الخاصة بي' : 'My Insurance Policies'}
                  </h3>
                  <button 
                    onClick={() => setActiveTab('apply')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isRtl ? 'طلب تأمين جديد' : 'New Policy'}
                  </button>
                </div>

                <div className="space-y-4">
                  {contracts.map((c) => (
                    <div 
                      key={c.id} 
                      className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="capitalize text-xxs font-extrabold px-2.5 py-1 rounded-full bg-zinc-150 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {CATEGORIES.find(cat => cat.value === c.type)?.icon} {isRtl ? CATEGORIES.find(cat => cat.value === c.type)?.labelAr : CATEGORIES.find(cat => cat.value === c.type)?.labelEn}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-3">
                            {isRtl ? c.company_name_ar : c.company_name_en}
                          </h4>
                          <p className="text-xxs font-mono text-zinc-400 mt-1">{c.contract_number}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xxs font-bold ${
                          c.status === 'active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 animate-pulse'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {isRtl 
                            ? (c.status === 'active' ? 'نشط' : 'قيد الدفع')
                            : (c.status === 'active' ? 'Active' : 'Awaiting Payment')
                          }
                        </span>
                      </div>

                      {/* Detail grids */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                        <div>
                          <p className="text-zinc-400 text-xxs uppercase tracking-wider">{tCommon('insurancePlanLabel')}</p>
                          <p className="font-bold text-zinc-850 dark:text-zinc-200 mt-0.5">{c.plan}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xxs uppercase tracking-wider">{isRtl ? 'القسط الشهري' : 'Premium'}</p>
                          <p className="font-bold text-zinc-850 dark:text-zinc-200 mt-0.5">{new Intl.NumberFormat('en-US').format(parseFloat(c.monthly_premium))} DZD</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xxs uppercase tracking-wider">{isRtl ? 'فترة التغطية' : 'Coverage Period'}</p>
                          <p className="font-medium text-zinc-850 dark:text-zinc-200 mt-0.5">{c.start_date.slice(0, 10)}</p>
                        </div>
                      </div>

                      {/* Pending payment or active certificate actions */}
                      {c.status === 'pending' ? (
                        <div className="mt-5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xxs font-medium text-amber-850 dark:text-amber-300">
                            {isRtl ? 'بانتظار سداد الرسوم للتفعيل.' : 'Awaiting payment to activate.'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCancelContract(c.id)}
                              className="px-3 py-1.5 text-xxs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition active:scale-95"
                            >
                              {isRtl ? 'إلغاء الطلب' : 'Cancel Request'}
                            </button>
                            <button
                              onClick={() => {
                                setPendingContractToPay(c);
                                setPaymentModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 text-xxs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:shadow-md hover:shadow-emerald-500/10 transition flex items-center gap-1 active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {isRtl ? 'ادفع الآن' : 'Pay Now'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 pt-4 border-t border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xxs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {isRtl ? 'التغطية التأمينية نشطة بالكامل' : 'Coverage is fully active'}
                          </span>
                          <button
                            onClick={() => handlePrintCertificate(c)}
                            className="px-3.5 py-1.5 text-xxs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-600 hover:text-white rounded-lg transition flex items-center gap-1.5 active:scale-95"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            {isRtl ? 'طباعة شهادة التأمين' : 'Print Certificate'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Claims list column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                    <FileCheck2 className="w-4.5 h-4.5 text-rose-500" />
                    {isRtl ? 'المطالبات والتعويضات الحالية' : 'Accident Claims History'}
                  </h3>
                  {activeContractsList.length > 0 && (
                    <button 
                      onClick={() => setActiveTab('claim')}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isRtl ? 'تقديم مطالبة' : 'Report Incident'}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {claims.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-zinc-200/40 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 text-zinc-400">
                      <HelpCircle className="w-10 h-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                      <p className="text-xs font-semibold">{tCommon('insuranceNoClaims')}</p>
                    </div>
                  ) : (
                    claims.map((cl) => (
                      <div 
                        key={cl.id} 
                        className="p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                              {cl.claim_number}
                            </h4>
                            <p className="text-xxs text-zinc-450 mt-1">
                              {isRtl ? 'البوليصة' : 'Policy'}: {cl.policy_number}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold ${
                            cl.status === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 animate-pulse'
                              : cl.status === 'approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                          }`}>
                            {cl.status}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 line-clamp-2">
                          {cl.description}
                        </p>

                        <div className="flex items-center justify-between mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xxs font-semibold">
                          <span className="text-zinc-400">{cl.incident_date}</span>
                          <span className="text-zinc-900 dark:text-white">
                            {new Intl.NumberFormat('en-US').format(parseFloat(cl.claimed_amount))} DZD
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: APPLICATION & UPLOAD                                   */}
        {/* ============================================================== */}
        {activeTab === 'apply' && (
          <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
            
            {/* Context Message */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600/5 to-teal-600/5 border border-emerald-100 dark:border-emerald-950/20">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {isRtl ? 'طلب تأمين رقمي مباشر' : 'Direct Digital Insurance Request'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                {isRtl 
                  ? 'اختر الشريك والنوع وخطة التأمين المناسبة لك. سيُطلب منك تحميل الوثائق الثبوتية اللازمة ثم السداد لتفعيل التغطية فورياً.'
                  : 'Select your preferred carrier, policy type, and plan. You will be prompted to upload supporting documents, followed by card processing to activate coverage.'
                }
              </p>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Application */}
            <form onSubmit={handleApplySubmit} className="space-y-6 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-xl shadow-zinc-900/5">
              
              {/* Select Company */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {isRtl ? '1. اختر شركة التأمين' : '1. Choose Insurance Carrier'}
                </label>
                {companies.length === 0 ? (
                  <p className="text-xs text-zinc-400">No active companies found</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {companies.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => setApplyCompany(comp.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          applyCompany === comp.id
                            ? 'border-emerald-600 bg-emerald-50/10 dark:bg-emerald-950/10 ring-1 ring-emerald-600'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            applyCompany === comp.id 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-650'
                          }`}>
                            {comp.code}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">{isRtl ? comp.name_ar : comp.name_en}</p>
                            <p className="text-[10px] text-zinc-400">{isRtl ? 'مرخصة رسمياً' : 'Licensed Partner'}</p>
                          </div>
                        </div>
                        {applyCompany === comp.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Select Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {isRtl ? '2. نوع التغطية المطلوبة' : '2. Select Policy Type'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.value}
                      onClick={() => setApplyCategory(cat.value)}
                      className={`p-3 rounded-2xl border cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                        applyCategory === cat.value
                          ? 'border-emerald-600 bg-emerald-50/10 dark:bg-emerald-950/10 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span className="text-[10px] tracking-tight">{isRtl ? cat.labelAr : cat.labelEn}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Select Plan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {isRtl ? '3. اختر خطة التغطية' : '3. Choose Plan level'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PLANS.map((planOption) => {
                    const rates = calculateRates(applyCategory, planOption.value);
                    const isSelected = applyPlan === planOption.value;
                    return (
                      <div
                        key={planOption.value}
                        onClick={() => setApplyPlan(planOption.value)}
                        className={`p-5 rounded-2xl border cursor-pointer relative overflow-hidden transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/10 dark:bg-emerald-950/10 ring-1 ring-emerald-600'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-150">{isRtl ? planOption.labelAr : planOption.labelEn}</span>
                            {isSelected && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-1">{isRtl ? planOption.descAr : planOption.descEn}</p>
                        </div>

                        {/* Calculated Rates display */}
                        <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xxs font-bold">
                          <div>
                            <span className="text-zinc-400 block font-normal">{isRtl ? 'التغطية الكلية' : 'Max Coverage'}</span>
                            <span className="text-zinc-850 dark:text-zinc-250">{new Intl.NumberFormat('en-US').format(rates.coverage)} DZD</span>
                          </div>
                          <div className="text-right">
                            <span className="text-zinc-400 block font-normal">{isRtl ? 'قسط شهري' : 'Premium/Mo'}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('en-US').format(rates.premium)} DZD</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic inputs based on Category */}
              <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800/80">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? '4. تفاصيل الموضوع والموقع' : '4. Coverage Subject Details'}
                </label>
                
                {/* 1. CAR INSURANCE FIELDS */}
                {applyCategory === 'car' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'الشركة المصنعة للسيارة' : 'Vehicle Make'}</span>
                      <input
                        type="text"
                        placeholder="e.g. Renault"
                        value={vehicleMake}
                        onChange={e => setVehicleMake(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'طراز السيارة' : 'Vehicle Model'}</span>
                      <input
                        type="text"
                        placeholder="e.g. Clio 4"
                        value={vehicleModel}
                        onChange={e => setVehicleModel(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'سنة الصنع' : 'Manufacture Year'}</span>
                      <input
                        type="number"
                        placeholder="e.g. 2020"
                        value={vehicleYear}
                        onChange={e => setVehicleYear(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'رقم اللوحة الرقمية' : 'License Plate'}</span>
                      <input
                        type="text"
                        placeholder="e.g. 12345-120-16"
                        value={vehiclePlate}
                        onChange={e => setVehiclePlate(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'رقم تعريف السيارة (VIN)' : 'Chassis Number (VIN)'}</span>
                      <input
                        type="text"
                        placeholder="e.g. VF3123456789012"
                        value={vehicleVin}
                        onChange={e => setVehicleVin(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* 2. HOME INSURANCE FIELDS */}
                {applyCategory === 'home' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3 space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'العنوان الكامل للعقار' : 'Property Full Address'}</span>
                      <input
                        type="text"
                        placeholder="e.g. Cité 500 Logements, Bab Ezzouar"
                        value={propertyAddress}
                        onChange={e => setPropertyAddress(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'الولاية' : 'Wilaya Code'}</span>
                      <input
                        type="text"
                        placeholder="e.g. 16"
                        value={propertyWilaya}
                        onChange={e => setPropertyWilaya(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'المساحة (متر مربع)' : 'Area (Sqm)'}</span>
                      <input
                        type="number"
                        placeholder="e.g. 120"
                        value={propertyAreaSqm}
                        onChange={e => setPropertyAreaSqm(e.target.value)}
                        required
                        className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* 3. HEALTH / LIFE INSURANCE FIELDS */}
                {['health', 'life'].includes(applyCategory) && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'عدد المستفيدين من التغطية' : 'Number of Beneficiaries'}</span>
                    <input
                      type="number"
                      min="1"
                      value={beneficiariesCount}
                      onChange={e => setBeneficiariesCount(e.target.value)}
                      required
                      className="w-full max-w-xs text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* 4. AGRICULTURE FIELDS */}
                {applyCategory === 'agriculture' && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-450 font-bold">{isRtl ? 'تفاصيل المحاصيل أو المواشي وموقع المزرعة' : 'Livestock/Crop details & Farm Location'}</span>
                    <textarea
                      rows={3}
                      placeholder={isRtl ? 'مثال: حقل قمح بمساحة 10 هكتارات في ولاية تيارت...' : 'e.g. 10 Hectares of wheat field in Tiaret...'}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      required
                      className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* DATE PICKERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-450 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {isRtl ? 'تاريخ بداية التأمين' : 'Start Date'}
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-450 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {isRtl ? 'تاريخ نهاية التأمين' : 'End Date'}
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                    className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* FILE UPLOAD ZONE */}
              <div className="space-y-3 pt-4 border-t border-zinc-150 dark:border-zinc-800/80">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? '5. تحميل الملفات والوثائق الثبوتية' : '5. Upload Supporting Documents'}
                </label>
                
                {/* Drag and Drop Box */}
                <div className="relative group border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 rounded-2xl p-6 bg-zinc-50/20 dark:bg-zinc-950/10 flex flex-col items-center justify-center text-center transition-all">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-zinc-400 group-hover:text-emerald-500 transition mb-2" />
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {isRtl ? 'اضغط لتحديد الملفات أو اسحبها هنا' : 'Click or Drag files here to upload'}
                  </p>
                  <p className="text-[10px] text-zinc-450 mt-1">
                    PDF, JPG, PNG (Max 10MB) - ID Card, driving license, registration cards, etc.
                  </p>
                </div>

                {/* Upload Progress/List */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2 mt-3">
                    {Object.entries(uploadProgress).map(([fileId, progress]) => {
                      const name = fileId.slice(0, fileId.lastIndexOf('-'));
                      return (
                        <div key={fileId} className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-950/20 flex flex-col gap-1 text-xxs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold truncate max-w-[200px]">{name}</span>
                            <span className="font-bold text-emerald-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Successfully Attached List */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <span className="text-[10px] font-bold text-zinc-400 block">{isRtl ? 'المستندات المرفقة بالتطبيق:' : 'Attached Documents:'}</span>
                    {attachedFiles.map((file, i) => (
                      <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 flex items-center justify-between text-xxs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-500" />
                          <div>
                            <p className="font-bold text-zinc-850 dark:text-zinc-200 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{file.size} • {file.uploadedAt}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Application Button */}
              <div className="pt-6 border-t border-zinc-150 dark:border-zinc-800/80">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full px-6 py-3.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {formLoading ? (
                    <span>{isRtl ? 'جاري حفظ الطلب...' : 'Submitting application...'}</span>
                  ) : (
                    <>
                      <FileBadge className="w-4 h-4" />
                      <span>{isRtl ? 'تقديم الطلب والانتقال للدفع' : 'Submit Application & Pay'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: FILE A CLAIM                                           */}
        {/* ============================================================== */}
        {activeTab === 'claim' && activeContractsList.length > 0 && (
          <div className="max-w-2xl mx-auto animate-fade-in space-y-6">
            
            {/* Header info */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-500/5 to-orange-500/5 border border-rose-100/30 dark:border-rose-950/20">
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-450 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {isRtl ? 'الإبلاغ عن حادث وطلب تعويض' : 'Report Incident & Claim Compensation'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                {isRtl 
                  ? 'اختر بوليصة التأمين النشطة المعنية بالحادث، حدد تاريخ الحادث ووصفه بالتفصيل، ثم أرفق الوثائق الثبوتية اللازمة (محضر الشرطة، فواتير الإصلاح، صور الخسائر).'
                  : 'Select your active policy, describe the accident details, estimate the damage cost, and attach verified documents (e.g. police statement, repair quotes, damage photos).'
                }
              </p>
            </div>

            {/* Success message */}
            {claimSuccessMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{claimSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleClaimSubmit} className="space-y-6 bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-xl shadow-zinc-900/5">
              
              {/* Select Active Contract */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? 'اختر بوليصة التأمين المعنية' : 'Select Associated Policy'}
                </label>
                <select
                  value={claimContractId}
                  onChange={e => setClaimContractId(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="">{isRtl ? '-- اختر بوليصة نشطة --' : '-- Select active policy --'}</option>
                  {activeContractsList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.contract_number} ({isRtl ? c.company_name_ar : c.company_name_en}) - {c.plan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Incident Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? 'تاريخ الحادث' : 'Incident Date'}
                </label>
                <input
                  type="date"
                  value={claimIncidentDate}
                  onChange={e => setClaimIncidentDate(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Incident Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? 'وصف تفصيلي للحادث' : 'Detailed Incident Description'}
                </label>
                <textarea
                  rows={4}
                  placeholder={isRtl ? 'يرجى تقديم تفاصيل كاملة حول الحادث والأضرار الناجمة...' : 'Describe what happened, conditions, and damages...'}
                  value={claimDescription}
                  onChange={e => setClaimDescription(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Claimed Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? 'مبلغ التعويض المقدر (د.ج)' : 'Estimated Claim Amount (DZD)'}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={claimAmount}
                  onChange={e => setClaimAmount(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Document attachment */}
              <div className="space-y-3 pt-3">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {isRtl ? 'إرفاق وثائق الحادث والأضرار' : 'Attach Incident & Damage Documents'}
                </label>
                
                {/* Drag zone */}
                <div className="relative group border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-rose-500 rounded-2xl p-6 bg-zinc-50/20 dark:bg-zinc-950/10 flex flex-col items-center justify-center text-center transition-all">
                  <input
                    type="file"
                    multiple
                    onChange={e => handleFileChange(e, true)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-10 h-10 text-zinc-400 group-hover:text-rose-500 transition mb-2" />
                  <p className="text-xs font-bold text-zinc-850 dark:text-zinc-250">
                    {isRtl ? 'اضغط لإرفاق صور الحوادث أو محاضر الضبط' : 'Drag photos, invoices, and reports here'}
                  </p>
                  <p className="text-[10px] text-zinc-450 mt-1">
                    Accident Report (Constat), Repair Quotes, Loss Images (Max 10MB)
                  </p>
                </div>

                {/* Progress bars */}
                {Object.keys(claimProgress).length > 0 && (
                  <div className="space-y-2 mt-2">
                    {Object.entries(claimProgress).map(([fileId, progress]) => {
                      const name = fileId.slice(0, fileId.lastIndexOf('-'));
                      return (
                        <div key={fileId} className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-950/20 flex flex-col gap-1 text-xxs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold truncate max-w-[200px]">{name}</span>
                            <span className="font-bold text-rose-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* File list */}
                {claimFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {claimFiles.map((file, i) => (
                      <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 flex items-center justify-between text-xxs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-500" />
                          <div>
                            <p className="font-bold text-zinc-850 dark:text-zinc-200 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-[10px] text-zinc-450 mt-0.5">{file.size} • {file.uploadedAt}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(i, true)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-zinc-150 dark:border-zinc-800/80">
                <button
                  type="submit"
                  disabled={isClaimSubmitting}
                  className="w-full px-6 py-3.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-orange-600 rounded-xl hover:shadow-lg hover:shadow-rose-500/10 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isClaimSubmitting ? (
                    <span>{isRtl ? 'جاري الإبلاغ...' : 'Reporting incident...'}</span>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>{isRtl ? 'إرسال وثائق ومطالبة التعويض' : 'Submit Claim Request'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: MY UPLOADS & FILE CENTER                                */}
        {/* ============================================================== */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  {isRtl ? 'مركز المستندات والملفات المرفوعة' : 'My Uploaded Documents'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {isRtl ? 'تصفح وقم بتنزيل كافة الوثائق التي قمت بتحميلها وتأمينها في النظام.' : 'Browse and download all verification files and claim documents stored on Neon DB.'}
                </p>
              </div>
            </div>

            {documentHistory.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-zinc-200/50 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 text-zinc-400 max-w-lg mx-auto">
                <UploadCloud className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm font-bold">{isRtl ? 'لا توجد مستندات مرفوعة بعد' : 'No documents uploaded yet'}</p>
                <p className="text-xs text-zinc-400 mt-1">{isRtl ? 'قم بالتقديم على بوليصة جديدة وأرفق وثائقك للبدء.' : 'Attach files during policy requests or claims filing to list them here.'}</p>
                <button 
                  onClick={() => setActiveTab('apply')}
                  className="mt-5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition shadow"
                >
                  {isRtl ? 'طلب بوليصة الآن' : 'Apply & Upload Now'}
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-850 overflow-hidden shadow-sm">
                <table className="w-full text-start text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 font-bold border-b border-zinc-150 dark:border-zinc-800 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-start">{isRtl ? 'اسم الملف' : 'File Name'}</th>
                      <th className="px-6 py-4 text-start">{isRtl ? 'المرجع والارتباط' : 'Associated Item'}</th>
                      <th className="px-6 py-4 text-start">{isRtl ? 'حجم الملف' : 'Size'}</th>
                      <th className="px-6 py-4 text-start">{isRtl ? 'تاريخ الرفع' : 'Uploaded At'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'العمليات' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {documentHistory.map((file, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4.5 h-4.5 text-indigo-500" />
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-650 dark:text-zinc-400">
                          {file.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                          {file.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                          {file.uploadedAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex p-1.5 text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      {/* ============================================================== */}
      {/* EXPANDED ELECTRONIC PAYMENT PORTAL MODAL                       */}
      {/* ============================================================== */}
      {paymentModalOpen && pendingContractToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden relative">
            
            {/* Header branding */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider">
                  {isRtl ? 'بوابة الدفع والتفعيل الإلكتروني' : 'Secure Payment & Activation Portal'}
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">DAMAN Pay</span>
            </div>

            {/* Payment Tabs Selection (only in input step) */}
            {paymentStep === 'input' && !paymentSuccess && (
              <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-955/50 p-2 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xxs font-bold transition flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-450 shadow-sm border border-zinc-200/50 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isRtl ? 'بطاقة دفع (ذهبية/CIB)' : 'Card Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xxs font-bold transition flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'bank'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-455 shadow-sm border border-zinc-200/50 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {isRtl ? 'حوالة بنكية' : 'Bank Transfer'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('baridimob')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xxs font-bold transition flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'baridimob'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-455 shadow-sm border border-zinc-200/50 dark:border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {isRtl ? 'بريدي موب QR' : 'BaridiMob QR'}
                </button>
              </div>
            )}

            {/* Content info */}
            <div className="p-6 space-y-5">
              
              {/* Receipt Summary */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850/80 space-y-2 text-xxs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isRtl ? 'رقم الطلب:' : 'Application Ref:'}</span>
                  <span className="font-mono font-bold">{pendingContractToPay.contract_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isRtl ? 'نوع التأمين:' : 'Coverage Type:'}</span>
                  <span className="font-bold capitalize">{pendingContractToPay.type} ({pendingContractToPay.plan})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">{isRtl ? 'المؤمن:' : 'Carrier:'}</span>
                  <span className="font-bold">{isRtl ? pendingContractToPay.company_name_ar : pendingContractToPay.company_name_en}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                  <span className="font-bold text-zinc-850 dark:text-zinc-150">{isRtl ? 'المبلغ المطلوب دفعه:' : 'Amount to Pay:'}</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat('en-US').format(parseFloat(pendingContractToPay.monthly_premium))} DZD</span>
                </div>
              </div>

              {/* Steps and Methods Form Rendering */}
              {paymentStep === 'success' ? (
                <div className="p-6 text-center space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 mb-2 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">
                    {isRtl ? 'تم التفعيل بنجاح!' : 'Policy Activated Successfully!'}
                  </p>
                  <p className="text-xxs text-zinc-400">
                    {isRtl 
                      ? 'تم تسجيل الدفع وتنشيط تغطيتك التأمينية. يمكنك الآن طباعة شهادة التأمين.' 
                      : 'Payment registered and your coverage is active. You can now print your certificate.'}
                  </p>
                </div>
              ) : paymentStep === 'otp' ? (
                <form onSubmit={(e) => { e.preventDefault(); handlePaymentSubmit(); }} className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-955/10 border border-blue-100 dark:border-blue-900/30 text-xxs text-blue-750 dark:text-blue-300">
                    {isRtl 
                      ? 'تم إرسال رمز تحقق (OTP) إلى هاتفك المحمول المسجل +213 ••• •• 45 لإتمام المعاملة.' 
                      : 'A One-Time Password (OTP) has been sent to your registered mobile +213 ••• •• 45.'}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">
                      {isRtl ? 'رمز التحقق (OTP)' : 'Verification Code (OTP)'}
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      required
                      className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center text-sm"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStep('input')}
                      className="flex-1 py-3 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                    >
                      {isRtl ? 'رجوع' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={paymentLoading || otpCode.length < 4}
                      className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {paymentLoading ? (
                        <span>{isRtl ? 'جاري التحقق...' : 'Verifying...'}</span>
                      ) : (
                        <span>{isRtl ? 'تأكيد الرمز وتفعيل' : 'Verify & Activate'}</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Method Inputs */
                <>
                  {paymentMethod === 'card' && (
                    <form onSubmit={handleCardPaymentSubmitStep1} className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">
                          {isRtl ? 'رقم بطاقة الدفع الإلكتروني' : 'Card Number (Dahabia / CIB)'}
                        </span>
                        <div className="relative">
                          <input
                            type="text"
                            pattern="\d{16}"
                            maxLength={16}
                            placeholder="6026 1234 5678 9012"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value.replace(/\D/g, ''))}
                            required
                            className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                          />
                          <div className="absolute right-3 top-2.5 flex gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-yellow-100 text-yellow-800 border border-yellow-200">Dahabia</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-100 text-blue-800 border border-blue-200">CIB</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">
                            {isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}
                          </span>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            required
                            className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 text-center font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">CVV2</span>
                          <input
                            type="password"
                            pattern="\d{3}"
                            maxLength={3}
                            placeholder="•••"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            required
                            className="w-full text-xs px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 focus:outline-none focus:border-emerald-500 text-center font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClosePaymentModal}
                          className="flex-1 py-3 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={paymentLoading}
                          className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {paymentLoading ? (
                            <span>{isRtl ? 'جاري التحقق...' : 'Checking...'}</span>
                          ) : (
                            <span>{isRtl ? 'إرسال الرمز والتأكيد' : 'Proceed to OTP'}</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-4">
                      {/* Bank Coordinates */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/60 dark:border-zinc-800 space-y-2 text-xxs">
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 text-center border-b border-zinc-150 dark:border-zinc-800/80 pb-2">
                          {isRtl ? 'الحساب البنكي الرسمي لشركة Insure Me' : 'Official Insure Me Bank Account'}
                        </p>
                        <div className="flex justify-between">
                          <span className="text-zinc-450">{isRtl ? 'البنك:' : 'Bank Name:'}</span>
                          <span className="font-bold">{isRtl ? 'البنك الخارجي الجزائري (BEA)' : "Banque Extérieure d'Algérie (BEA)"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-455">{isRtl ? 'اسم الحساب:' : 'Account Holder:'}</span>
                          <span className="font-bold">DAMAN INSURANCE SPA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-455">RIB:</span>
                          <span className="font-bold font-mono">002 00123 1234567890 45</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-455">IBAN:</span>
                          <span className="font-bold font-mono">DZ16 0020 0123 1234 5678 9045</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider block">
                          {isRtl ? 'تحميل وصل الإيداع/التحويل البنكي' : 'Upload Bank Deposit/Transfer Receipt'}
                        </span>
                        
                        {receiptFile ? (
                          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 dark:border-emerald-955/40 dark:bg-emerald-955/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xxs">
                              <FileText className="w-4.5 h-4.5 text-emerald-500" />
                              <div>
                                <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{receiptFile.name}</p>
                                <p className="text-[10px] text-zinc-455">{receiptFile.size}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReceiptFile(null)}
                              className="text-xxs text-rose-500 font-bold hover:underline"
                            >
                              {isRtl ? 'حذف' : 'Remove'}
                            </button>
                          </div>
                        ) : isReceiptUploading ? (
                          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55/30 dark:bg-zinc-950 space-y-2">
                            <div className="flex justify-between text-xxs font-bold">
                              <span>{isRtl ? 'جاري رفع الوصل...' : 'Uploading receipt...'}</span>
                              <span>{receiptProgress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${receiptProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 rounded-xl p-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-zinc-50/20 hover:bg-emerald-500/5 transition">
                            <UploadCloud className="w-6 h-6 text-zinc-400" />
                            <span className="text-xxs font-bold text-zinc-700 dark:text-zinc-300">
                              {isRtl ? 'اضغط لتحميل وصل الدفع' : 'Click to upload receipt document'}
                            </span>
                            <span className="text-[10px] text-zinc-400">PDF, JPG, PNG (Max 5MB)</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleReceiptUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClosePaymentModal}
                          className="flex-1 py-3 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          disabled={!receiptFile || paymentLoading}
                          onClick={() => handlePaymentSubmit()}
                          className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {paymentLoading ? (
                            <span>{isRtl ? 'جاري معالجة الوصل...' : 'Processing...'}</span>
                          ) : (
                            <span>{isRtl ? 'إرسال وثيقة الدفع للتفعيل' : 'Submit & Activate'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'baridimob' && (
                    <div className="space-y-4 flex flex-col items-center text-center">
                      <p className="text-xxs text-zinc-500 leading-relaxed">
                        {isRtl 
                          ? 'امسح رمز الاستجابة السريع (QR Code) التالي عبر تطبيق بريدي موب لإجراء تحويل فوري ودفع القيمة المطلوبة.' 
                          : 'Scan the QR Code below using BaridiMob app to execute the instant P2P transfer.'}
                      </p>

                      {/* Mock QR Code representation */}
                      <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-850 flex flex-col items-center gap-3">
                        <div className="w-36 h-36 border border-zinc-150 p-2 bg-white rounded-lg flex items-center justify-center">
                          <svg className="w-full h-full text-zinc-900" viewBox="0 0 100 100">
                            {/* Inner custom designed pseudo QR code */}
                            <path d="M5 5h30v30H5zm10 10h10v10H15zm50-10h30v30H65zm10 10h10v10H75zm-70 50h30v30H5zm10 10h10v10H15zm60 0h10v10H75zm10 10h10v10H85zm-40-70h10v10H45zm10 20h10v10H55zm-10 20h10v10H45zm20 10h10v10H65zm-20 20h10v10H45zm20-30h10v10H65zm-10 10h10v10H55z" fill="currentColor" />
                            {/* Center Logo placeholder */}
                            <rect x="38" y="38" width="24" height="24" rx="4" fill="#d97706" />
                            <text x="50" y="52" fill="white" fontSize="8" fontWeight="black" textAnchor="middle">CCP</text>
                          </svg>
                        </div>
                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-955/30 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                          BaridiMob e-CCP Pay
                        </span>
                      </div>

                      <div className="w-full flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClosePaymentModal}
                          className="flex-1 py-3 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          disabled={paymentLoading}
                          onClick={() => handlePaymentSubmit()}
                          className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {paymentLoading ? (
                            <span>{isRtl ? 'جاري التحقق من الشبكة...' : 'Checking System...'}</span>
                          ) : (
                            <span>{isRtl ? 'التحقق من إرسال الدفع' : 'Verify & Activate'}</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRINTABLE INSURANCE CERTIFICATE MODAL VIEW                     */}
      {/* ============================================================== */}
      {printModalOpen && selectedContractForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in no-print">
          
          {/* Style Injector to isolate just this certificate when window.print() is called */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              .no-print, .no-print * {
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              #printable-certificate, #printable-certificate * {
                visibility: visible !important;
              }
              #printable-certificate {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                color: black !important;
              }
            }
          ` }} />

          <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8">
            
            {/* Modal Controls Bar */}
            <div className="bg-zinc-50 dark:bg-zinc-955 px-6 py-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">
                  {isRtl ? 'معاينة شهادة التأمين الرسمية' : 'Insurance Certificate Preview'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedContractForPrint(null);
                    setPrintModalOpen(false);
                  }}
                  className="px-4 py-2 text-xxs font-bold text-zinc-500 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-xl transition"
                >
                  {isRtl ? 'إغلاق' : 'Close'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xxs font-bold text-white bg-indigo-650 hover:bg-indigo-600 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {isRtl ? 'طباعة الوثيقة' : 'Print Document'}
                </button>
              </div>
            </div>

            {/* Certificate Template Render */}
            <div className="p-8 md:p-12 bg-zinc-100 dark:bg-zinc-955/60 overflow-x-auto flex justify-center">
              
              <div 
                id="printable-certificate" 
                className="w-[794px] h-[1123px] bg-white border-[16px] border-double border-emerald-700 text-zinc-900 p-10 relative flex flex-col justify-between shadow-lg print:border-emerald-700"
                style={{ contentVisibility: 'auto' }}
              >
                {/* Background Watermark Stamp */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                  <svg className="w-[500px] h-[500px]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                    <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor">DAMAN</text>
                  </svg>
                </div>

                {/* Top Border Banner Line (Algerian Red and Green Colors) */}
                <div className="absolute top-0 left-0 right-0 h-2 flex">
                  <div className="w-1/2 bg-emerald-600 h-full" />
                  <div className="w-1/2 bg-rose-600 h-full" />
                </div>

                {/* Header (Bilingual Official Representation) */}
                <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-5">
                  <div className="text-left font-serif max-w-[280px]">
                    <p className="text-[9px] font-black tracking-wider uppercase">People's Democratic Republic of Algeria</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">Ministry of Finance - Directorate of Insurance</p>
                    <p className="text-xs font-bold text-emerald-800 mt-3 uppercase tracking-wider">DAMAN INSURANCE SPA</p>
                    <p className="text-[8px] text-zinc-400 font-mono mt-0.5">Licence: No 01-12/A14-2022</p>
                  </div>
                  
                  {/* National Crest Badge representation */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border border-zinc-300 rounded-full flex items-center justify-center bg-zinc-50 text-[10px] font-extrabold text-emerald-700">
                      ★ ★ ★
                    </div>
                    <span className="text-[6px] font-bold text-zinc-400 mt-1">REPUBLIC OF ALGERIA</span>
                  </div>

                  <div className="text-right font-serif max-w-[280px]" dir="rtl">
                    <p className="text-[10px] font-black tracking-wider">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">وزارة المالية - مديرية الإشراف على التأمينات</p>
                    <p className="text-xs font-bold text-emerald-850 mt-3">شركة Insure Me للتأمين ش.م.جزائرية</p>
                    <p className="text-[8px] text-zinc-400 font-mono mt-0.5">رخصة رقم: 01-12/أ14-2022</p>
                  </div>
                </div>

                {/* Certificate Core Title */}
                <div className="text-center my-6 space-y-1">
                  <h2 className="text-lg font-black tracking-widest text-zinc-900 uppercase">
                    Official Certificate of Insurance
                  </h2>
                  <h3 className="text-base font-black text-emerald-800" dir="rtl">
                    شهادة التأمين الرسمية والمعتمدة
                  </h3>
                  <div className="inline-block px-4 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full font-mono text-[9px] font-bold mt-2">
                    {isRtl ? 'رقم الشهادة: ' : 'Certificate ID: '} {selectedContractForPrint.id.substring(0, 8).toUpperCase()}-{selectedContractForPrint.contract_number}
                  </div>
                </div>

                {/* Main Information Tables (Bilingual Rows) */}
                <div className="space-y-4 flex-grow mt-2">
                  
                  {/* Grid 1: Basic Information */}
                  <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 bg-zinc-50 border-b border-zinc-800 text-[10px] font-black uppercase tracking-wider py-2 px-4">
                      <span>1. Policyholder & Insurer Details</span>
                      <span className="text-right" dir="rtl">1. معلومات المؤمن له وشركة التأمين</span>
                    </div>

                    <div className="p-3 text-[10px] space-y-2">
                      <div className="grid grid-cols-12 gap-1 items-center">
                        <span className="col-span-3 text-zinc-500 font-medium">Policyholder Name:</span>
                        <span className="col-span-6 font-bold text-center">
                          {isRtl ? user?.email : user?.email} {/* Fallback user details */}
                        </span>
                        <span className="col-span-3 text-right font-bold" dir="rtl">اسم المؤمن له:</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-center border-t border-zinc-100 pt-2">
                        <span className="col-span-3 text-zinc-500 font-medium">Insurance Company:</span>
                        <span className="col-span-6 font-bold text-emerald-800 text-center uppercase">
                          {selectedContractForPrint.company_name_en}
                        </span>
                        <span className="col-span-3 text-right font-bold" dir="rtl">شركة التأمين الضامنة:</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-center border-t border-zinc-100 pt-2">
                        <span className="col-span-3 text-zinc-500 font-medium">Policy Contract Number:</span>
                        <span className="col-span-6 font-mono font-bold text-center">
                          {selectedContractForPrint.contract_number}
                        </span>
                        <span className="col-span-3 text-right font-bold" dir="rtl">رقم عقد التأمين:</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Cover and Risks Details */}
                  <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 bg-zinc-50 border-b border-zinc-800 text-[10px] font-black uppercase tracking-wider py-2 px-4">
                      <span>2. Coverage Scope & Limits</span>
                      <span className="text-right" dir="rtl">2. نطاق وحدود التغطية التأمينية</span>
                    </div>

                    <div className="p-3 text-[10px] space-y-2">
                      <div className="grid grid-cols-12 gap-1 items-center">
                        <span className="col-span-3 text-zinc-500 font-medium">Insurance Plan Tier:</span>
                        <span className="col-span-6 font-bold text-center uppercase tracking-wide">
                          {selectedContractForPrint.plan} Tier Cover
                        </span>
                        <span className="col-span-3 text-right font-bold" dir="rtl">فئة خطة التأمين:</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-center border-t border-zinc-100 pt-2">
                        <span className="col-span-3 text-zinc-500 font-medium">Insurance Risk Type:</span>
                        <span className="col-span-6 font-bold text-center capitalize">
                          {selectedContractForPrint.type} Insurance
                        </span>
                        <span className="col-span-3 text-right font-bold" dir="rtl">نوع المخاطر المؤمنة:</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-center border-t border-zinc-100 pt-2">
                        <span className="col-span-3 text-zinc-500 font-medium">Effective Period:</span>
                        <span className="col-span-6 font-bold text-center text-zinc-700">
                          {selectedContractForPrint.start_date.substring(0, 10)} {isRtl ? 'إلى' : 'to'} {selectedContractForPrint.end_date.substring(0, 10)}
                        </span>
                        <span className="col-span-3 text-right font-bold" dir="rtl">فترة صلاحية التأمين:</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-center border-t border-zinc-100 pt-2">
                        <span className="col-span-3 text-zinc-500 font-medium">Annual Premium Value:</span>
                        <span className="col-span-6 font-bold text-center text-emerald-700">
                          {new Intl.NumberFormat('en-US').format(parseFloat(selectedContractForPrint.monthly_premium) * 12)} DZD
                        </span>
                        <span className="col-span-3 text-right font-bold" dir="rtl">قيمة القسط السنوي:</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid 3: Specific Risk Variables Details */}
                  <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 bg-zinc-50 border-b border-zinc-800 text-[10px] font-black uppercase tracking-wider py-2 px-4">
                      <span>3. Insured Subject Properties</span>
                      <span className="text-right" dir="rtl">3. خصائص ومواصفات الشيء المؤمن عليه</span>
                    </div>

                    <div className="p-3 text-[10px] space-y-2 font-mono">
                      <div className="grid grid-cols-12 gap-1">
                        <span className="col-span-4 text-zinc-500">Risk Object Reference:</span>
                        <span className="col-span-8 text-right font-bold">
                          {selectedContractForPrint.type === 'car' ? 'Motor Vehicle (Algiers License)' : 'Real Estate / Institutional Property'}
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 border-t border-zinc-100 pt-2">
                        <span className="col-span-4 text-zinc-500">Subject Metadata:</span>
                        <span className="col-span-8 text-right text-zinc-700 truncate">
                          {JSON.stringify(selectedContractForPrint.data || {})}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Declarations / Terms of Use */}
                <div className="text-[7px] text-zinc-400 font-serif leading-relaxed border-t border-zinc-350 pt-3 text-justify my-2">
                  <p>
                    <strong>Declaration:</strong> This certificate is issued as evidence of active insurance coverage under written policy contract constraints stored within the Insure Me Insurance ledger. The contract terms, limits, and deductible requirements are fully governed by Algerian Commercial Law (Decree 95-07 relative to insurance regulations). Verification of this certificate validity can be verified electronically.
                  </p>
                  <p className="mt-1" dir="rtl">
                    <strong>تصريح رسمي:</strong> تُمنح هذه الشهادة كدليل رسمي على سريان التغطية التأمينية بموجب بنود وأحكام عقد التأمين المبرم والمسجل إلكترونياً. تخضع شروط التعاقد والالتزامات وحدود المسؤوليات للقانون التجاري الجزائري والأمر رقم 95-07 المتعلق بالتأمينات. يمكن التحقق من صحة وصلاحية هذه الشهادة عبر مسح رمز الاستجابة السريع.
                  </p>
                </div>

                {/* Validation and Digital Signatures Footer */}
                <div className="flex justify-between items-center border-t border-zinc-800 pt-4 mt-2">
                  
                  {/* Verification QR Code */}
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-14 border p-1 bg-white flex items-center justify-center">
                      <svg className="w-full h-full text-zinc-900" viewBox="0 0 100 100">
                        <path d="M5 5h30v30H5zm10 10h10v10H15zm50-10h30v30H65zm10 10h10v10H75zm-70 50h30v30H5zm10 10h10v10H15zm50 0h30v30H65zm10 10h10v10H75zm-15-40h10v10H50zm10 20h10v10H60z" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="text-[7px] font-mono leading-none">
                      <p className="font-bold text-zinc-800">SECURE VERIFIED</p>
                      <p className="text-zinc-450 mt-1">ID: {selectedContractForPrint.contract_number}</p>
                      <p className="text-zinc-455 mt-0.5">DATE: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Stamp and Seal */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* SVG Seal */}
                    <svg className="w-full h-full text-rose-700/85 absolute rotate-12" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,1" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
                      <text x="50" y="44" textAnchor="middle" fontSize="6" fontWeight="black" fill="currentColor">DAMAN INSURANCE</text>
                      <text x="50" y="52" textAnchor="middle" fontSize="8" fontWeight="black" fill="currentColor">Insure Me للتأمين</text>
                      <text x="50" y="60" textAnchor="middle" fontSize="5" fontWeight="bold" fill="currentColor">GENERAL SEAL</text>
                    </svg>
                  </div>

                  {/* Official Signatures */}
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wide">For and on behalf of Insure Me Spa</p>
                    <p className="text-[8px] font-bold text-zinc-850 mt-0.5" dir="rtl">عن المدير العام لشركة Insure Me</p>
                    
                    {/* Mock Signature Line */}
                    <div className="h-6 w-24 flex items-center justify-center my-1 opacity-70">
                      <svg className="w-full h-full text-blue-800" viewBox="0 0 100 40">
                        <path d="M10 25c15-10 20 20 35-5s25-15 45 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <span className="text-[7px] font-mono text-zinc-400">Auth Signature Code: #78A12B</span>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: PROFILE                                                 */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          {/* Profile Card */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
            {/* Header Banner */}
            <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
              <div className="absolute -bottom-8 left-6 h-16 w-16 rounded-2xl border-4 border-white dark:border-zinc-900 bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
                <UserCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="pt-10 px-6 pb-6">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">{isRtl ? user.fullNameAr : user.fullNameEn}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{user.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                  {txt('عميل Insure Me', 'Client Insure Me', 'Insure Me Client')}
                </span>
                <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold">
                  {contracts.length} {txt('بوليصة', 'police(s)', 'policy(ies)')}
                </span>
              </div>
            </div>
          </div>

          {/* Info Rows */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            {[
              { label: txt('البريد الإلكتروني', 'Email', 'Email'), value: user.email, icon: '📧' },
              { label: txt('رقم الهاتف', 'Téléphone', 'Phone'), value: user.phone || txt('غير محدد', 'Non renseigné', 'Not set'), icon: '📞' },
              { label: txt('رقم التعريف الوطني', 'N° identité', 'NIN'), value: user.nin || '—', icon: '🪪' },
              { label: txt('تاريخ الانضمام', 'Membre depuis', 'Member since'), value: user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : '—', icon: '📅' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4">
                <span className="text-xl w-8 text-center shrink-0">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold leading-none mb-1">{label}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden">
            <button className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors" onClick={() => setActiveTab('documents')}>
              <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{txt('ملفاتي', 'Mes documents', 'My Documents')}</span>
              <span className="text-zinc-300 dark:text-zinc-600 text-lg">{isRtl ? '‹' : '›'}</span>
            </button>
            <button className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors" onClick={() => setActiveTab('overview')}>
              <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{txt('بوالصي', 'Mes polices', 'My Policies')}</span>
              <span className="text-zinc-300 dark:text-zinc-600 text-lg">{isRtl ? '‹' : '›'}</span>
            </button>
            <button
              className="w-full flex items-center gap-4 px-5 py-4 text-left active:bg-rose-50 dark:active:bg-rose-950/20 transition-colors"
              onClick={handleLogout}
            >
              <span className="w-5 h-5 flex items-center justify-center text-rose-500 shrink-0 text-base">⏏</span>
              <span className="flex-1 text-sm font-semibold text-rose-600">{tCommon('logout')}</span>
            </button>
          </div>

        </div>
      )}

      </main>

    </div>
  );
}
