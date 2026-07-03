'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
  User, Building2, Briefcase, ClipboardCheck, Shield, Users,
  ArrowLeft, ChevronRight,
} from 'lucide-react';
import RegistrationShell from '@/components/shared/RegistrationShell';

// ─── Role card data ──────────────────────────────────────────────────────

interface RoleCard {
  id: string;
  path: string;
  icon: React.ReactNode;
  labelKey: string;
  descKey: string;
  color: string;
  inviteOnly?: boolean;
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: 'client',
    path: '/register/client',
    icon: <User className="w-6 h-6" />,
    labelKey: 'roleClient',
    descKey: 'roleClientDesc',
    color: 'var(--sage-500)',
  },
  {
    id: 'broker',
    path: '/register/broker',
    icon: <Briefcase className="w-6 h-6" />,
    labelKey: 'roleBroker',
    descKey: 'roleBrokerDesc',
    color: 'var(--sage-500)',
  },
  {
    id: 'assessor',
    path: '/register/assessor',
    icon: <ClipboardCheck className="w-6 h-6" />,
    labelKey: 'roleAssessor',
    descKey: 'roleAssessorDesc',
    color: 'var(--sage-500)',
  },
  {
    id: 'agent',
    path: '/register/agent',
    icon: <Users className="w-6 h-6" />,
    labelKey: 'roleAgent',
    descKey: 'roleAgentDesc',
    color: 'var(--sage-500)',
  },
  {
    id: 'company',
    path: '/register/company',
    icon: <Building2 className="w-6 h-6" />,
    labelKey: 'roleCompany',
    descKey: 'roleCompanyDesc',
    color: 'var(--sage-500)',
  },
  {
    id: 'admin',
    path: '/register/admin',
    icon: <Shield className="w-6 h-6" />,
    labelKey: 'roleAdmin',
    descKey: 'roleAdminDesc',
    color: 'var(--sage-500)',
    inviteOnly: true,
  },
];

// ─── Component ───────────────────────────────────────────────────────────

export default function RegisterHubPage() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tReg = useTranslations('register');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const roleLabel = (key: string): string => {
    const labels: Record<string, string> = {
      roleClient: isRtl ? 'زبون فردي' : 'Individual Client',
      roleClientDesc: isRtl ? 'إدارة وثائق التأمين الشخصية الخاصة بك' : 'Manage your personal insurance policies',
      roleBroker: isRtl ? 'وسيط مرخص' : 'Licensed Broker',
      roleBrokerDesc: isRtl ? 'وساطة منتجات التأمين بصفتك وسيطاً معتمداً' : 'Intermediate insurance products as a licensed broker',
      roleAssessor: isRtl ? 'خبير تقييم' : 'Claims Assessor',
      roleAssessorDesc: isRtl ? 'تقييم وفحص مطالبات التأمين' : 'Evaluate and appraise insurance claims',
      roleAgent: isRtl ? 'وكيل مستقل' : 'Independent Agent',
      roleAgentDesc: isRtl ? 'تمثيل الشركات في الولايات' : 'Represent companies in wilayas',
      roleCompany: isRtl ? 'شركة تأمين' : 'Insurance Company',
      roleCompanyDesc: isRtl ? 'تسجيل شركتك وإدارة العملاء' : 'Register your company and manage clients',
      roleAdmin: isRtl ? 'مسؤول المنصة' : 'Platform Admin',
      roleAdminDesc: isRtl ? 'دعوة فقط — إدارة المستأجرين والإعدادات' : 'Invite-only — manage tenants and platform settings',
    };
    return labels[key] || key;
  };

  return (
    <RegistrationShell appName={tCommon('appName')}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
          {isRtl ? 'اختر نوع الحساب' : 'Select Account Type'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isRtl
            ? 'اختر دورك لبدء التسجيل في منصة ضمان'
            : 'Choose your role to start registration on the Daman platform'}
        </p>
      </div>

      {/* Role cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.path}
            className="block p-4 rounded-2xl transition-all no-underline hover:scale-[1.02] active:scale-[0.98] group"
            style={{ background: 'var(--bg-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: 'color-mix(in srgb, var(--sage-500) 12%, transparent)',
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {roleLabel(card.labelKey)}
                  </p>
                  {card.inviteOnly && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                      style={{
                        background: 'color-mix(in srgb, var(--sage-500) 15%, transparent)',
                        color: 'var(--sage-500)',
                      }}
                    >
                      {isRtl ? 'دعوة فقط' : 'Invite'}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-faint)' }}>
                  {roleLabel(card.descKey)}
                </p>
              </div>
              <ChevronRight
                className="w-4 h-4 flex-shrink-0 mt-2 transition-transform group-hover:translate-x-0.5"
                style={{ color: 'var(--text-faint)' }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Existing /register page note */}
      <div
        className="rounded-2xl p-4 text-sm leading-relaxed shadow-sm"
        style={{ background: 'var(--bg-sage)' }}
      >
        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
          {isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 font-bold hover:underline"
          style={{ color: 'var(--sage-500)' }}
        >
          {isRtl ? 'سجل الدخول هنا' : 'Sign in here'}
        </Link>
      </div>
    </RegistrationShell>
  );
}