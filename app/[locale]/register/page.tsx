'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { User, Building2, Briefcase, ClipboardCheck, ArrowRight, ArrowLeft, CheckCircle, Clock } from 'lucide-react';

type Role = 'client' | 'company_admin' | 'broker' | 'assessor';
type Wilaya = { code: string; name_ar: string; name_en: string };

const ROLES: { id: Role; icon: React.ReactNode; color: string }[] = [
  { id: 'client',        icon: <User className="w-6 h-6" />,          color: '#778873' },
  { id: 'company_admin', icon: <Building2 className="w-6 h-6" />,     color: '#A1BC98' },
  { id: 'broker',        icon: <Briefcase className="w-6 h-6" />,      color: '#6b8f6b' },
  { id: 'assessor',      icon: <ClipboardCheck className="w-6 h-6" />, color: '#5a7a68' },
];

export default function RegisterPage() {
  const tAuth = useTranslations('auth');
  const tReg  = useTranslations('register');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === 'ar';

  const [step, setStep]       = useState(1); // 1=role, 2=personal, 3=details
  const [role, setRole]       = useState<Role | null>(null);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  // Personal fields
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullNameAr, setFullNameAr]         = useState('');
  const [fullNameEn, setFullNameEn]         = useState('');
  const [phone, setPhone]                   = useState('');
  const [wilayaCode, setWilayaCode]         = useState('');

  // Client
  const [nationalId, setNationalId] = useState('');

  // Company
  const [companyNameAr, setCompanyNameAr]         = useState('');
  const [companyNameEn, setCompanyNameEn]         = useState('');
  const [companyCode, setCompanyCode]             = useState('');
  const [licenseNumber, setLicenseNumber]         = useState('');
  const [headquartersWilaya, setHeadquartersWilaya] = useState('');

  // Broker
  const [brokerLicense, setBrokerLicense] = useState('');

  // Assessor
  const [assessorLicense, setAssessorLicense]     = useState('');
  const [assessorSpecialty, setAssessorSpecialty] = useState('');

  useEffect(() => {
    fetch('/api/wilayas').then(r => r.json()).then(d => Array.isArray(d) && setWilayas(d)).catch(() => {});
  }, []);

  const stepNext = () => {
    setError(null);
    if (step === 1 && !role) { setError('Please select an account type'); return; }
    if (step === 2) {
      if (!email || !password || !fullNameAr) { setError('Email, password, and Arabic name are required'); return; }
      if (password !== confirmPassword) { setError(tAuth('passwordsDontMatch')); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, any> = { email, password, fullNameAr, fullNameEn, role, phone, wilayaCode };
      if (role === 'client')        { payload.nationalId = nationalId; }
      if (role === 'company_admin') { payload.companyNameAr = companyNameAr; payload.companyNameEn = companyNameEn; payload.companyCode = companyCode; payload.licenseNumber = licenseNumber; payload.headquartersWilaya = headquartersWilaya; }
      if (role === 'broker')        { payload.brokerLicense = brokerLicense; }
      if (role === 'assessor')      { payload.assessorLicense = assessorLicense; payload.assessorSpecialty = assessorSpecialty; }

      const res  = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (!res.ok) { setError(data.message || tAuth('errorOccurred')); setLoading(false); return; }

      if (role === 'client') { setAutoLogin(true); router.push('/client'); }
      else { setDone(true); }
    } catch { setError(tAuth('errorOccurred')); }
    setLoading(false);
  };

  // ── Pending success screen ──────────────────────────────────────────────
  if (done) return (
    <PageShell tCommon={tCommon}>
      <div className="w-full max-w-md mx-auto text-center space-y-6 py-12">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--bg-sage-deep)' }}>
          <Clock className="w-10 h-10" style={{ color: 'var(--sage-600)' }} />
        </div>
        <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{tAuth('pendingApproval')}</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{tReg('pendingNote')}</p>
        <Link href="/login" className="inline-block px-8 py-3 rounded-xl font-bold text-white text-sm" style={{ background: 'var(--sage-500)' }}>
          {tAuth('login')}
        </Link>
      </div>
    </PageShell>
  );

  // ── Step indicators ──────────────────────────────────────────────────────
  const steps = [tReg('step1'), tReg('step2'), tReg('step3')];

  return (
    <PageShell tCommon={tCommon}>
      <div className="w-full max-w-[560px] mx-auto space-y-6">

        {/* Steps bar */}
        <div className="flex items-center gap-2">
          {steps.map((label, i) => {
            const idx = i + 1;
            const active = step === idx;
            const done2  = step > idx;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: done2 ? 'var(--sage-500)' : active ? 'var(--sage-300)' : 'var(--bg-muted)',
                    color: done2 || active ? '#fff' : 'var(--text-faint)',
                  }}>
                  {done2 ? <CheckCircle className="w-4 h-4" /> : idx}
                </div>
                <span className="text-[10px] font-semibold hidden sm:block" style={{ color: active ? 'var(--text-primary)' : 'var(--text-faint)' }}>{label}</span>
                {i < steps.length - 1 && <div className="hidden" />}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-3xl border p-8 space-y-6 shadow-xl"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-sage)' }}>

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold flex items-center gap-2"
              style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              ⚠ {error}
            </div>
          )}

          {/* STEP 1 — Role selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h1 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{tReg('selectRole')}</h1>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(r => {
                  const selected = role === r.id;
                  return (
                    <button key={r.id} onClick={() => setRole(r.id)}
                      className="p-4 rounded-2xl border-2 text-start transition-all cursor-pointer space-y-2"
                      style={{
                        borderColor: selected ? r.color : 'var(--border)',
                        background: selected ? `${r.color}18` : 'var(--bg-muted)',
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: selected ? r.color : 'var(--bg-subtle)', color: selected ? '#fff' : 'var(--text-muted)' }}>
                        {r.icon}
                      </div>
                      <p className="text-sm font-bold" style={{ color: selected ? 'var(--text-primary)' : 'var(--text-body)' }}>
                        {tReg(`role${r.id.charAt(0).toUpperCase() + r.id.replace('_admin','').slice(1)}` as any)}
                      </p>
                      <p className="text-xs leading-snug" style={{ color: 'var(--text-faint)' }}>
                        {tReg(`role${r.id.charAt(0).toUpperCase() + r.id.replace('_admin','').slice(1)}Desc` as any)}
                      </p>
                    </button>
                  );
                })}
              </div>
              <StepBtn onNext={stepNext} tReg={tReg} isRtl={isRtl} />
            </div>
          )}

          {/* STEP 2 — Personal info */}
          {step === 2 && (
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); stepNext(); }}>
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{tReg('step2')}</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label={tAuth('fullNameAr')} required><input required value={fullNameAr} onChange={e=>setFullNameAr(e.target.value)} placeholder="محمد بن يوسف" className="field-input" /></Field>
                <Field label={tAuth('fullNameEn')}><input value={fullNameEn} onChange={e=>setFullNameEn(e.target.value)} placeholder="Mohamed Benyoussef" className="field-input" /></Field>
              </div>
              <Field label={tAuth('email')} required><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@daman.dz" className="field-input" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={tAuth('password')} required><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="field-input" /></Field>
                <Field label={tAuth('confirmPassword')} required><input required type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="••••••••" className="field-input" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={tAuth('phone')}><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0550123456" className="field-input" /></Field>
                <Field label={tAuth('wilaya')}>
                  <select value={wilayaCode} onChange={e=>setWilayaCode(e.target.value)} className="field-input">
                    <option value="">—</option>
                    {wilayas.map(w=><option key={w.code} value={w.code}>{w.code} - {isRtl ? w.name_ar : w.name_en}</option>)}
                  </select>
                </Field>
              </div>
              <StepBtn onBack={()=>setStep(1)} tReg={tReg} isRtl={isRtl} submitForm />
            </form>
          )}

          {/* STEP 3 — Role-specific details */}
          {step === 3 && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{tReg('step3')}</h2>

              {role === 'client' && (
                <Field label={`${tAuth('nationalId')} *`} required>
                  <input required value={nationalId} onChange={e=>setNationalId(e.target.value.replace(/\D/g,''))} maxLength={15} placeholder="123456789012345" className="field-input" />
                </Field>
              )}

              {role === 'company_admin' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="اسم الشركة (ع) *" required><input required value={companyNameAr} onChange={e=>setCompanyNameAr(e.target.value)} placeholder="الشركة الوطنية للتأمين" className="field-input" /></Field>
                    <Field label="Company Name (EN) *" required><input required value={companyNameEn} onChange={e=>setCompanyNameEn(e.target.value)} placeholder="National Insurance Co." className="field-input" /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={`${tAuth('companyCode')} *`} required><input required value={companyCode} onChange={e=>setCompanyCode(e.target.value.toUpperCase())} placeholder="SAA" className="field-input" /></Field>
                    <Field label={`${tAuth('companyLicense')} *`} required><input required value={licenseNumber} onChange={e=>setLicenseNumber(e.target.value)} placeholder="LIC-2026-DZ-001" className="field-input" /></Field>
                  </div>
                  <Field label={tAuth('headquartersWilaya')}>
                    <select value={headquartersWilaya} onChange={e=>setHeadquartersWilaya(e.target.value)} className="field-input">
                      <option value="">—</option>
                      {wilayas.map(w=><option key={w.code} value={w.code}>{w.code} - {isRtl ? w.name_ar : w.name_en}</option>)}
                    </select>
                  </Field>
                </>
              )}

              {role === 'broker' && (
                <Field label={`${tReg('brokerLicense')} *`} required>
                  <input required value={brokerLicense} onChange={e=>setBrokerLicense(e.target.value)} placeholder={tReg('brokerLicensePlaceholder')} className="field-input" />
                </Field>
              )}

              {role === 'assessor' && (
                <>
                  <Field label={`${tReg('assessorLicense')} *`} required>
                    <input required value={assessorLicense} onChange={e=>setAssessorLicense(e.target.value)} placeholder={tReg('assessorLicensePlaceholder')} className="field-input" />
                  </Field>
                  <Field label={tReg('assessorSpecialty')}>
                    <select value={assessorSpecialty} onChange={e=>setAssessorSpecialty(e.target.value)} className="field-input">
                      <option value="">—</option>
                      {['Auto','Health','Property','Agriculture','Life'].map(s=>(
                        <option key={s} value={s.toLowerCase()}>{tReg(`specialty${s}` as any)}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}

              {role !== 'client' && (
                <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--bg-sage)', color: 'var(--text-muted)', border: '1px solid var(--border-sage)' }}>
                  ⏳ {tReg('pendingNote')}
                </div>
              )}

              <StepBtn onBack={()=>setStep(2)} tReg={tReg} isRtl={isRtl} submitForm final loading={loading} />
            </form>
          )}
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {tAuth('alreadyHaveAccount')}{' '}
          <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--sage-500)' }}>
            {tAuth('signInHere')}
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1 flex-1">
      <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>{label}</label>
      {children}
    </div>
  );
}

function StepBtn({ onNext, onBack, tReg, isRtl, submitForm, final, loading }:
  { onNext?: ()=>void; onBack?: ()=>void; tReg: any; isRtl: boolean; submitForm?: boolean; final?: boolean; loading?: boolean }) {
  return (
    <div className={`flex gap-3 pt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
      {onBack && (
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold border transition cursor-pointer"
          style={{ borderColor: 'var(--border-sage)', color: 'var(--text-muted)', background: 'var(--bg-muted)' }}>
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {tReg('back')}
        </button>
      )}
      <button
        type={submitForm ? 'submit' : 'button'}
        onClick={submitForm ? undefined : onNext}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition cursor-pointer disabled:opacity-60"
        style={{ background: 'var(--sage-500)' }}>
        {loading ? '...' : final ? tReg('submit') : tReg('next')}
        {!loading && !final && (isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
      </button>
    </div>
  );
}

function PageShell({ children, tCommon }: { children: React.ReactNode; tCommon: any }) {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[120px]" style={{ background: 'rgba(161,188,152,0.12)' }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[120px]" style={{ background: 'rgba(220,207,192,0.15)' }} />
      </div>

      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md" style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)' }}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-md"
              style={{ background: 'linear-gradient(135deg, var(--sage-500), var(--sage-300))' }}>ض</div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tCommon('appName')}</span>
          </Link>
          <div className="flex items-center gap-3"><ThemeSwitcher /><LanguageSwitcher /></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 z-10">
        {children}
      </main>

      <style>{`
        .field-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-muted);
          color: var(--text-body);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .field-input:focus {
          border-color: var(--sage-500);
          box-shadow: 0 0 0 3px rgba(119,136,115,0.15);
        }
        .field-input option {
          background: var(--bg-surface);
        }
      `}</style>
    </div>
  );
}
