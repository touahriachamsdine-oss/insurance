'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  ArrowRight, ArrowLeft, CheckCircle, Clock, Shield,
  Loader2, Camera, MapPin, Wifi,
} from 'lucide-react';
import RegistrationShell from '@/components/shared/RegistrationShell';
import FieldRenderer from '@/components/registration/FieldRenderer';
import {
  ROLE_CONFIGS,
  getRoleFields,
  validateAllFields,
  validateField,
} from '@/lib/registration/role-config';
import type { Role, RegistrationField } from '@/lib/registration/role-config';

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Step flow for each dedicated role page:
 * 1 = personal info (name, email, password)
 * 2 = role-specific fields (config-driven)
 * 3 = onboarding checklist (assessor/agent only — skips to done for others)
 */
type Step = 1 | 2 | 3;

interface FormData {
  [key: string]: any;
}

interface RegisterRolePageProps {
  role: Role;
}

// ─── Icons per role for the heading ──────────────────────────────────────

const ROLE_ICONS: Record<Role, string> = {
  broker: '📋',
  assessor: '🔍',
  company_admin: '🏢',
  superadmin: '🛡️',
  client: '👤',
  agent: '🤝',
};

// ─── Main Component ───────────────────────────────────────────────────────

export default function RegisterRolePage({ role }: RegisterRolePageProps) {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const config = ROLE_CONFIGS[role];
  const wizardGroups = ['legal', 'structure', 'branding', 'billing'];

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({});
  const [companyWizardStep, setCompanyWizardStep] = useState(0);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [showBrokerPrompt, setShowBrokerPrompt] = useState(false);

  const updateField = useCallback((key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
    setErrors(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });

    if (role === 'client' && typeof value === 'string') {
      const upperVal = value.toUpperCase();
      if (upperVal.includes('BROKER-') || upperVal.includes('LIC-') || upperVal.includes('ASSESS-')) {
        setShowBrokerPrompt(true);
      }
    }
  }, [role]);

  // ── Validate on touch ─────────────────────────────────────────────────
  useEffect(() => {
    const roleFields = getRoleFields(role);
    const newErrors: Record<string, string> = {};
    for (const field of roleFields) {
      if (touched[field.key]) {
        const err = validateField(field, formData[field.key], formData);
        if (err) newErrors[field.key] = err;
      }
    }
    setErrors(prev => ({ ...prev, ...newErrors }));
  }, [formData, touched, role]);

  // ── Role label helper ─────────────────────────────────────────────────
  const roleLabel = useMemo((): string => {
    const labels: Record<Role, string> = {
      client: isRtl ? 'عميل' : 'Client',
      company_admin: isRtl ? 'شركة تأمين' : 'Insurance Company',
      broker: isRtl ? 'وسيط' : 'Broker',
      assessor: isRtl ? 'خبير تقييم' : 'Assessor',
      agent: isRtl ? 'وكيل مستقل' : 'Independent Agent',
      superadmin: isRtl ? 'مسؤول المنصة' : 'Platform Admin',
    };
    return labels[role];
  }, [role, isRtl]);

  // ── Handle submit ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const allErrors = validateAllFields(role, formData);
    setErrors(allErrors);
    setTouched(Object.fromEntries(getRoleFields(role).map(f => [f.key, true])));

    if (Object.keys(allErrors).length > 0) {
      setError(isRtl ? 'يرجى تصحيح الأخطاء أدناه' : 'Please correct the errors below');
      return;
    }

    setError(null);
    setLoading(true);

    // 1. For superadmin, validate invite token
    if (role === 'superadmin') {
      const token = formData.inviteToken || '';
      if (!token.startsWith('INV-DAMAN-') || token.length < 14) {
        setError(isRtl 
          ? 'رمز الدعوة غير صالح أو منتهي الصلاحية. يجب أن يبدأ بـ INV-DAMAN-' 
          : 'Invalid or expired invite token. It must start with INV-DAMAN-.'
        );
        setLoading(false);
        return;
      }
    }

    // 2. For agent, simulate territory conflict check
    if (role === 'agent' && formData.exclusiveTerritory) {
      const territory = formData.exclusiveTerritory.toLowerCase();
      if (territory.includes('hydra') || territory.includes('alger') || territory.includes('el biar')) {
        setError(isRtl 
          ? 'تم اكتشاف تعارض في الإقليم: commune محجوزة بالفعل من قبل وكيل آخر. يتطلب هذا تحكيماً يدوياً.' 
          : 'Territory conflict detected: Commune is already assigned to another approved agent. This requires manual arbitration.'
        );
        setLoading(false);
        return;
      }
    }

    // 3. For client, simulate CIN policy mismatch
    if (role === 'client' && formData.existingPolicyNumber) {
      const policy = formData.existingPolicyNumber || '';
      if (policy.length > 0 && !policy.includes('12345')) {
        setError(isRtl 
          ? 'تعذر تأكيد هويتك: رقم وثيقة التأمين لا يتطابق تماماً مع رقم التعريف الوطني (CIN)' 
          : "We couldn't confirm this is you: The policy number does not match your National ID (CIN) in our archive."
        );
        setLoading(false);
        return;
      }
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For company_admin, handle wizard
      if (role === 'company_admin') {
        if (companyWizardStep < wizardGroups.length - 1) {
          setCompanyWizardStep(prev => prev + 1);
          setLoading(false);
          return;
        }
      }

      // For assessor/agent, show onboarding checklist
      if ((role === 'assessor' || role === 'agent') && Object.keys(checklist).length === 0) {
        const defaultChecklist: Record<string, boolean> = role === 'assessor'
          ? { location: false, camera: false, offline: false }
          : { camera_test: false, gps: false, offline: false };
        setChecklist(defaultChecklist);
        setStep(3);
        setLoading(false);
        return;
      }

      setDone(true);
    } catch (err) {
      setError(isRtl ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [role, formData, isRtl, companyWizardStep, checklist]);

  const handleChecklistDone = useCallback(() => {
    setDone(true);
  }, []);

  // ── Render role-specific fields ───────────────────────────────────────
  const renderRoleFields = useCallback(() => {
    const fields = getRoleFields(role);

    // For company_admin, filter by wizard group
    if (role === 'company_admin') {
      const group = wizardGroups[companyWizardStep];
      const groupFields = fields.filter(f => f.group === group);
      return groupFields.map(field => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={formData[field.key]}
          onChange={updateField}
          error={errors[field.key] || null}
          isRtl={isRtl}
        />
      ));
    }

    return fields.map(field => {
      // Skip fields with unmet dependencies
      if (field.dependsOn) {
        const depValue = formData[field.dependsOn.field];
        if (field.dependsOn.value !== '*' && depValue !== field.dependsOn.value) return null;
        if (field.dependsOn.value === '*' && !depValue) return null;
      }

      return (
        <FieldRenderer
          key={field.key}
          field={field}
          value={formData[field.key]}
          onChange={updateField}
          error={errors[field.key] || null}
          isRtl={isRtl}
        />
      );
    });
  }, [role, formData, errors, updateField, isRtl, companyWizardStep]);

  // ── Pending / Post-submit state ───────────────────────────────────────
  if (done) {
    const pendingStatus = config?.pendingStatus || 'Verified';
    const pendingMessage = config?.pendingMessage || 'Account created.';
    const isImmediate = config?.immediateAccess || false;
    const stages = config?.progressStages || [];

    return (
      <RegistrationShell appName={tCommon('appName')}>
        <div className="w-full text-center space-y-6 py-12">
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg"
            style={{ background: 'var(--bg-sage)' }}
          >
            {isImmediate ? (
              <CheckCircle className="w-10 h-10" style={{ color: 'var(--sage-500)' }} />
            ) : (
              <Clock className="w-10 h-10" style={{ color: 'var(--sage-400)' }} />
            )}
          </div>

          {/* Status pill — borderless soft-fill */}
          <div
            className="inline-block rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              background: isImmediate
                ? 'color-mix(in srgb, var(--sage-500) 20%, transparent)'
                : 'color-mix(in srgb, var(--sage-300) 25%, transparent)',
              color: isImmediate ? 'var(--sage-600)' : 'var(--text-body)',
            }}
          >
            {pendingStatus}
          </div>

          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            {pendingMessage}
          </p>

          {/* Progress tracker */}
          {!isImmediate && stages.length > 0 && (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              {stages.map((stage, i) => {
                const isActive = i === 0;
                const isDone = stage === stages[0];
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: isDone ? 'var(--sage-500)' : isActive ? 'var(--sage-300)' : 'var(--bg-muted)',
                        transform: isActive ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold" style={{ color: isActive ? '#fff' : 'var(--text-faint)' }}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-faint)' }}>
                      {stage}
                    </span>
                    {i < stages.length - 1 && (
                      <div className="w-6 h-px" style={{ background: 'var(--bg-muted)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isImmediate && (
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              {isRtl ? 'سيتم إعادة توجيهك...' : 'Redirecting...'}
            </p>
          )}

          {!isImmediate && (
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-xl font-bold text-white text-sm shadow-lg transition-transform active:scale-95"
              style={{ background: 'var(--sage-500)' }}
            >
              {tAuth('login')}
            </Link>
          )}
        </div>
      </RegistrationShell>
    );
  }

  // ── Company wizard step indicator ─────────────────────────────────────
  const renderCompanyWizard = () => {
    if (role !== 'company_admin') return null;
    const labels = isRtl
      ? ['البيانات القانونية', 'الهيكل', 'العلامة التجارية', 'الفوترة']
      : ['Legal Info', 'Structure', 'Branding', 'Billing'];

    return (
      <div className="flex items-center justify-center gap-1 mb-4">
        {wizardGroups.map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: i <= companyWizardStep ? 'var(--sage-500)' : 'var(--bg-muted)',
                transform: i === companyWizardStep ? 'scale(1.3)' : 'scale(1)',
              }}
            />
            {i < wizardGroups.length - 1 && (
              <div
                className="w-4 h-px transition-all"
                style={{ background: i < companyWizardStep ? 'var(--sage-500)' : 'var(--bg-muted)' }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // ── Verification steps display ────────────────────────────────────────
  const renderVerificationSteps = () => {
    if (!config?.proofVerifications) return null;

    return (
      <div className="rounded-xl p-3 text-xs space-y-2" style={{ background: 'var(--bg-sage)' }}>
        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>
          {isRtl ? 'التحقق المطلوب:' : 'Verification required:'}
        </p>
        {config.proofVerifications.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: v.blocksActivation
                  ? 'color-mix(in srgb, var(--sage-500) 15%, transparent)'
                  : 'var(--bg-muted)',
              }}
            >
              <span className="text-[8px] font-bold" style={{ color: v.blocksActivation ? 'var(--sage-600)' : 'var(--text-faint)' }}>
                {i + 1}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              {v.description}
              {v.blocksActivation && (
                <span className="font-semibold" style={{ color: 'var(--sage-500)' }}>
                  {' '}⛔
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // ── Onboarding checklist (assessor/agent) ─────────────────────────────
  const renderOnboardingChecklist = () => {
    if (step !== 3) return null;

    const items = role === 'assessor'
      ? [
          { key: 'location', icon: <MapPin className="w-4 h-4" />, label: isRtl ? 'تفعيل خدمات الموقع' : 'Enable location services' },
          { key: 'camera', icon: <Camera className="w-4 h-4" />, label: isRtl ? 'اختبار الكاميرا' : 'Test camera capture' },
          { key: 'offline', icon: <Wifi className="w-4 h-4" />, label: isRtl ? 'تأكيد إعدادات المزامنة دون اتصال' : 'Confirm offline-sync settings' },
        ]
      : [
          { key: 'camera_test', icon: <Camera className="w-4 h-4" />, label: isRtl ? 'اختبار الكاميرا للمسح الميداني' : 'Test camera for field digitization' },
          { key: 'gps', icon: <MapPin className="w-4 h-4" />, label: isRtl ? 'تفعيل GPS' : 'Enable GPS' },
          { key: 'offline', icon: <Wifi className="w-4 h-4" />, label: isRtl ? 'تأكيد التخزين المحلي' : 'Confirm offline storage' },
        ];

    const allDone = items.every(item => checklist[item.key]);

    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {role === 'assessor'
            ? (isRtl ? 'قائمة الإعداد' : 'Onboarding Checklist')
            : (isRtl ? 'قائمة إعداد الرقمنة الميدانية' : 'Field Digitization Setup')}
        </p>
        {items.map((item) => {
          const done = checklist[item.key] || false;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
              className="w-full rounded-xl p-3 flex items-center gap-3 text-left transition-all border-none cursor-pointer"
              style={{
                background: done
                  ? 'color-mix(in srgb, var(--sage-500) 15%, var(--bg-surface))'
                  : 'var(--bg-muted)',
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                style={{ background: done ? 'var(--sage-500)' : 'color-mix(in srgb, var(--bg-surface) 60%, var(--bg-muted))' }}
              >
                {done && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className={`text-sm ${done ? 'font-semibold' : ''}`} style={{ color: done ? 'var(--sage-600)' : 'var(--text-muted)' }}>
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleChecklistDone}
          disabled={!allDone}
          className="w-full flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 border-none cursor-pointer"
          style={{
            background: allDone ? 'var(--sage-500)' : 'var(--bg-muted)',
            color: allDone ? '#fff' : 'var(--text-faint)',
            opacity: allDone ? 1 : 0.5,
          }}
        >
          {isRtl ? 'إنشاء الحساب' : 'Create Account'}
        </button>
      </div>
    );
  };

  // ── Main form ─────────────────────────────────────────────────────────
  return (
    <RegistrationShell appName={tCommon('appName')}>
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-3xl">{ROLE_ICONS[role]}</span>
        <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
          {isRtl ? `تسجيل ${roleLabel}` : `Register as ${roleLabel}`}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {config?.description}
        </p>
      </div>

      {/* Content block — borderless card */}
      <div
        className="rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        {error && (
          <div
            className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: 'color-mix(in srgb, #d97706 12%, var(--bg-muted))', color: '#d97706' }}
          >
            ⚠ {error}
          </div>
        )}

        {showBrokerPrompt && (
          <div
            className="p-4 rounded-2xl text-xs space-y-2 mb-4 transition-all animate-fadeIn"
            style={{ background: 'var(--bg-sage)', color: 'var(--text-body)' }}
          >
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {isRtl ? 'هل تقصد التسجيل كـ وسيط أو خبير تقييم؟' : 'Did you mean to register as a Broker/Assessor?'}
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              {isRtl 
                ? 'يبدو أنك تقوم بإدخال رقم رخصة مهنية أو شهادة اعتماد. حساب العميل الفردي لا يتطلب هذه التفاصيل.' 
                : 'It looks like you are entering a professional license number or certification code. Individual client accounts do not require broker licenses or accreditation.'}
            </p>
            <div className="flex gap-2 pt-1">
              <Link
                href="/register/broker"
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white no-underline transition-all active:scale-95"
                style={{ background: 'var(--sage-500)' }}
              >
                {isRtl ? 'تسجيل كـ وسيط' : 'Register as Broker'}
              </Link>
              <Link
                href="/register/assessor"
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white no-underline transition-all active:scale-95"
                style={{ background: 'var(--sage-400)' }}
              >
                {isRtl ? 'تسجيل كـ خبير تقييم' : 'Register as Assessor'}
              </Link>
              <button
                type="button"
                onClick={() => setShowBrokerPrompt(false)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border-none cursor-pointer"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
              >
                {isRtl ? 'تجاهل' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 — Role-specific registration form */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); setStep(2); }}>
            <div className="space-y-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {isRtl ? 'المعلومات الشخصية' : 'Personal Information'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {isRtl ? 'املأ بياناتك الأساسية لتتمكن من إنشاء الحساب' : 'Fill in your basic details to create your account'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRenderer
                field={{
                  key: 'fullNameAr',
                  label: isRtl ? 'الاسم الكامل (عربي)' : 'Full Name (Arabic)',
                  type: 'text',
                  required: true,
                  placeholder: 'محمد بن يوسف',
                  validation: [{ type: 'required', message: isRtl ? 'الاسم مطلوب' : 'Name is required' }],
                }}
                value={formData['fullNameAr']}
                onChange={updateField}
                error={errors['fullNameAr'] || null}
                isRtl={isRtl}
              />
              <FieldRenderer
                field={{
                  key: 'fullNameEn',
                  label: isRtl ? 'الاسم الكامل (إنجليزية)' : 'Full Name (English)',
                  type: 'text',
                  required: false,
                  placeholder: 'Mohamed Benyoussef',
                  validation: [],
                }}
                value={formData['fullNameEn']}
                onChange={updateField}
                error={errors['fullNameEn'] || null}
                isRtl={isRtl}
              />
            </div>

            <FieldRenderer
              field={{
                key: 'email',
                label: isRtl ? 'البريد الإلكتروني' : 'Email',
                type: 'email',
                required: true,
                placeholder: 'you@daman.dz',
                validation: [
                  { type: 'required', message: isRtl ? 'البريد الإلكتروني مطلوب' : 'Email is required' },
                  { type: 'email', message: isRtl ? 'بريد إلكتروني غير صالح' : 'Invalid email' },
                ],
              }}
              value={formData['email']}
              onChange={updateField}
              error={errors['email'] || null}
              isRtl={isRtl}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRenderer
                field={{
                  key: 'password',
                  label: isRtl ? 'كلمة المرور' : 'Password',
                  type: 'password',
                  required: true,
                  placeholder: '••••••••',
                  validation: [
                    { type: 'required', message: isRtl ? 'كلمة المرور مطلوبة' : 'Password is required' },
                    { type: 'min', value: 8, message: isRtl ? '8 أحرف على الأقل' : 'At least 8 characters' },
                  ],
                }}
                value={formData['password']}
                onChange={updateField}
                error={errors['password'] || null}
                isRtl={isRtl}
              />
              <FieldRenderer
                field={{
                  key: 'confirmPassword',
                  label: isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password',
                  type: 'password',
                  required: true,
                  placeholder: '••••••••',
                  validation: [
                    { type: 'required', message: isRtl ? 'تأكيد كلمة المرور مطلوب' : 'Confirm password is required' },
                    { type: 'match_field', value: 'password', message: isRtl ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' },
                  ],
                }}
                value={formData['confirmPassword']}
                onChange={updateField}
                error={errors['confirmPassword'] || null}
                isRtl={isRtl}
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 border-none cursor-pointer"
              style={{ background: 'var(--sage-500)' }}
            >
              {isRtl ? 'التالي' : 'Next'}
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* STEP 2 — Role-specific details (config-driven) */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {role === 'company_admin'
                  ? (isRtl ? 'معلومات الشركة' : 'Company Information')
                  : (isRtl ? `تفاصيل ${roleLabel}` : `${roleLabel} Details`)}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {isRtl ? 'املأ التفاصيل الخاصة بدورك للتسجيل' : 'Fill in your role-specific details to complete registration'}
              </p>
            </div>

            {/* Company wizard step indicator */}
            {renderCompanyWizard()}

            {/* Config-driven fields */}
            {renderRoleFields()}

            {/* Verification steps */}
            {config?.proofVerifications && config.proofVerifications.length > 0 && renderVerificationSteps()}

            {/* Pending note for roles requiring approval */}
            {role !== 'client' && role !== 'superadmin' && (
              <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-sage)', color: 'var(--text-muted)' }}>
                ⏳ {isRtl ? 'سيتم مراجعة طلبك من قبل فريقنا' : 'Your application will be reviewed by our team'}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 border-none cursor-pointer"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {isRtl ? 'رجوع' : 'Back'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 border-none cursor-pointer"
                style={{ background: 'var(--sage-500)', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : role === 'company_admin' && companyWizardStep < 3 ? (
                  isRtl ? 'التالي' : 'Next'
                ) : (
                  isRtl ? 'إنشاء الحساب' : 'Create Account'
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 — Onboarding checklist (assessor/agent) */}
        {step === 3 && (role === 'assessor' || role === 'agent') && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {isRtl ? 'الإعداد الأولي' : 'Initial Setup'}
            </h2>
            {renderOnboardingChecklist()}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 border-none cursor-pointer"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isRtl ? 'رجوع' : 'Back'}
            </button>
          </div>
        )}
      </div>

      {/* Login link */}
      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {tAuth('alreadyHaveAccount')}{' '}
        <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--sage-500)' }}>
          {tAuth('signInHere')}
        </Link>
      </p>
    </RegistrationShell>
  );
}