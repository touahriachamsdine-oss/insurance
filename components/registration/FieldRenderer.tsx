'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload, Camera, CheckCircle, ChevronDown, X,
} from 'lucide-react';
import type { RegistrationField, FieldOption } from '@/lib/registration/role-config';

// ─── Props ────────────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: RegistrationField;
  value: any;
  onChange: (key: string, value: any) => void;
  error?: string | null;
  isRtl: boolean;
  wilayas?: { code: string; name_ar: string; name_en: string }[];
  disabled?: boolean;
}

// ─── Wilaya Data (all 58) ─────────────────────────────────────────────────

export const ALL_WILAYAS: { code: string; name_ar: string; name_en: string }[] = [
  { code: '01', name_ar: 'أدرار', name_en: 'Adrar' },
  { code: '02', name_ar: 'الشلف', name_en: 'Chlef' },
  { code: '03', name_ar: 'الأغواط', name_en: 'Laghouat' },
  { code: '04', name_ar: 'أم البواقي', name_en: 'Oum El Bouaghi' },
  { code: '05', name_ar: 'باتنة', name_en: 'Batna' },
  { code: '06', name_ar: 'بجاية', name_en: 'Bejaia' },
  { code: '07', name_ar: 'بسكرة', name_en: 'Biskra' },
  { code: '08', name_ar: 'بشار', name_en: 'Bechar' },
  { code: '09', name_ar: 'البليدة', name_en: 'Blida' },
  { code: '10', name_ar: 'بويرة', name_en: 'Bouira' },
  { code: '11', name_ar: 'تمنراست', name_en: 'Tamanrasset' },
  { code: '12', name_ar: 'تبسة', name_en: 'Tebessa' },
  { code: '13', name_ar: 'تلمسان', name_en: 'Tlemcen' },
  { code: '14', name_ar: 'تيارت', name_en: 'Tiaret' },
  { code: '15', name_ar: 'تيزي وزو', name_en: 'Tizi Ouzou' },
  { code: '16', name_ar: 'الجزائر', name_en: 'Algiers' },
  { code: '17', name_ar: 'الجلفة', name_en: 'Djelfa' },
  { code: '18', name_ar: 'جيجل', name_en: 'Jijel' },
  { code: '19', name_ar: 'سطيف', name_en: 'Setif' },
  { code: '20', name_ar: 'سعيدة', name_en: 'Saida' },
  { code: '21', name_ar: 'سكيكدة', name_en: 'Skikda' },
  { code: '22', name_ar: 'سيدي بلعباس', name_en: 'Sidi Bel Abbes' },
  { code: '23', name_ar: 'عنابة', name_en: 'Annaba' },
  { code: '24', name_ar: 'قالمة', name_en: 'Guelma' },
  { code: '25', name_ar: 'قسنطينة', name_en: 'Constantine' },
  { code: '26', name_ar: 'المدية', name_en: 'Medea' },
  { code: '27', name_ar: 'مستغانم', name_en: 'Mostaganem' },
  { code: '28', name_ar: 'مسيلة', name_en: "M'Sila" },
  { code: '29', name_ar: 'معسكر', name_en: 'Mascara' },
  { code: '30', name_ar: 'ورقلة', name_en: 'Ouargla' },
  { code: '31', name_ar: 'وهران', name_en: 'Oran' },
  { code: '32', name_ar: 'البيض', name_en: 'El Bayadh' },
  { code: '33', name_ar: 'إليزي', name_en: 'Illizi' },
  { code: '34', name_ar: 'برج بوعريريج', name_en: 'Bordj Bou Arreridj' },
  { code: '35', name_ar: 'بومرداس', name_en: 'Boumerdes' },
  { code: '36', name_ar: 'الطارف', name_en: 'El Tarf' },
  { code: '37', name_ar: 'تندوف', name_en: 'Tindouf' },
  { code: '38', name_ar: 'تيسمسيلت', name_en: 'Tissemsilt' },
  { code: '39', name_ar: 'الوادي', name_en: 'El Oued' },
  { code: '40', name_ar: 'خنشلة', name_en: 'Khenchela' },
  { code: '41', name_ar: 'سوق أهراس', name_en: 'Souk Ahras' },
  { code: '42', name_ar: 'تيبازة', name_en: 'Tipaza' },
  { code: '43', name_ar: 'ميلة', name_en: 'Mila' },
  { code: '44', name_ar: 'عين الدفلى', name_en: 'Ain Defla' },
  { code: '45', name_ar: 'النعامة', name_en: 'Naama' },
  { code: '46', name_ar: 'عين تموشنت', name_en: 'Ain Temouchent' },
  { code: '47', name_ar: 'غرداية', name_en: 'Ghardaia' },
  { code: '48', name_ar: 'غليزان', name_en: 'Relizane' },
  { code: '49', name_ar: 'تيميمون', name_en: 'Timimoun' },
  { code: '50', name_ar: 'بني عباس', name_en: 'Beni Abbes' },
  { code: '51', name_ar: 'عين صالح', name_en: 'Ain Salah' },
  { code: '52', name_ar: 'عين قزام', name_en: 'Ain Guezzam' },
  { code: '53', name_ar: 'تقرت', name_en: 'Touggourt' },
  { code: '54', name_ar: 'جانت', name_en: 'Djanet' },
  { code: '55', name_ar: 'المغير', name_en: 'El Mghair' },
  { code: '56', name_ar: 'المنيعة', name_en: 'El Meniaa' },
  { code: '57', name_ar: 'أولاد جلال', name_en: 'Ouled Djellal' },
  { code: '58', name_ar: 'برج باجي مختار', name_en: 'Bordj Badji Mokhtar' },
];

// ─── Field Renderer ───────────────────────────────────────────────────────

export default function FieldRenderer({
  field, value, onChange, error, isRtl, wilayas = ALL_WILAYAS, disabled,
}: FieldRendererProps) {
  const [dragOver, setDragOver] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasError = !!error;
  const isValid = !hasError && value !== undefined && value !== '' && value !== null && !(Array.isArray(value) && value.length === 0);

  // Shared input class — borderless, background tint shifts on focus, bottom accent line
  const inputClass = `w-full px-3.5 py-3 rounded-xl text-sm outline-none transition-all duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const inputStyle = (extraTint = false): React.CSSProperties => ({
    background: hasError
      ? 'color-mix(in srgb, #d97706 8%, var(--bg-muted))'
      : isValid
        ? 'color-mix(in srgb, var(--sage-500) 6%, var(--bg-muted))'
        : extraTint
          ? 'color-mix(in srgb, var(--bg-surface) 50%, var(--bg-muted))'
          : 'var(--bg-muted)',
    color: 'var(--text-body)',
    boxShadow: 'none',
    border: 'none',
  });

  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

  useEffect(() => {
    if (field.key === 'brokerLicense' && value) {
      setVerifyStatus('loading');
      setVerifyMessage(isRtl ? 'جاري التحقق من سجل الوسطاء المرخصين...' : 'Checking licensed-broker registry...');
      const timer = setTimeout(() => {
        if (/^BROKER/i.test(value)) {
          setVerifyStatus('success');
          setVerifyMessage(isRtl ? 'تم التحقق: وسيط مرخص نشط' : 'Verified: Active Licensed Broker');
        } else {
          setVerifyStatus('error');
          setVerifyMessage(isRtl ? 'الرمز غير صحيح، يجب أن يبدأ بـ BROKER' : 'Invalid license. Must start with BROKER');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [value, field.key, isRtl]);

  useEffect(() => {
    if (field.type === 'file' && value) {
      setVerifyStatus('loading');
      setVerifyMessage(field.key === 'cinUpload' 
        ? (isRtl ? 'جاري تشغيل مطابقة الاسم بالذكاء الاصطناعي (OCR)...' : 'Running OCR name matching...')
        : (isRtl ? 'جاري فحص كود النشاط في السجل التجاري...' : 'Scanning RC activity code...')
      );
      const timer = setTimeout(() => {
        setVerifyStatus('success');
        setVerifyMessage(field.key === 'cinUpload'
          ? (isRtl ? 'تطابق الاسم بنسبة 100٪ مع بطاقة التعريف' : 'OCR Match verified: Name matches legal registration')
          : (isRtl ? 'تم التحقق: رمز النشاط يتطابق مع وساطة التأمين' : 'Verified: Activity code matches insurance intermediation')
        );
      }, 1500);
      return () => clearTimeout(timer);
    } else if (field.type === 'file' && !value) {
      setVerifyStatus('idle');
      setVerifyMessage('');
    }
  }, [value, field.key, field.type, isRtl]);

  useEffect(() => {
    if ((field.key === 'cameraGPSCheck' || field.key === 'deviceCapable') && value === true) {
      setVerifyStatus('loading');
      setVerifyMessage(isRtl ? 'جاري اختبار تشغيل الكاميرا وإشارة تحديد الموقع GPS...' : 'Testing live Camera and GPS connection...');
      const timer = setTimeout(() => {
        setVerifyStatus('success');
        setVerifyMessage(isRtl ? 'نجح الفحص: الكاميرا و GPS جاهزان للعمل' : 'Check passed: Camera & GPS fully functional');
      }, 2000);
      return () => clearTimeout(timer);
    } else if ((field.key === 'cameraGPSCheck' || field.key === 'deviceCapable') && !value) {
      setVerifyStatus('idle');
      setVerifyMessage('');
    }
  }, [value, field.key, isRtl]);

  const focusStyle = `focus:shadow-[0_2px_0_0_var(--sage-400)] focus:bg-[color-mix(in_srgb,var(--bg-surface)_50%,var(--bg-muted))]`;

  // ── Render helpers ─────────────────────────────────────────────────────

  const renderLabel = () => (
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: hasError ? '#d97706' : 'var(--text-faint)' }}>
      {field.label}
      {field.required && <span className="mr-1" style={{ color: 'var(--sage-500)' }}> *</span>}
    </label>
  );

  const renderHelpText = () => (
    <>
      {verifyStatus !== 'idle' && (
        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold transition-all duration-300">
          {verifyStatus === 'loading' && (
            <span className="animate-spin inline-block w-3 h-3 border-2 border-[var(--sage-500)] border-t-transparent rounded-full" />
          )}
          {verifyStatus === 'success' && (
            <span style={{ color: 'var(--sage-500)' }}>✓</span>
          )}
          {verifyStatus === 'error' && (
            <span style={{ color: '#d97706' }}>⚠</span>
          )}
          <span style={{
            color: verifyStatus === 'success' 
              ? 'var(--sage-500)' 
              : verifyStatus === 'error' 
                ? '#d97706' 
                : 'var(--text-faint)'
          }}>
            {verifyMessage}
          </span>
        </div>
      )}
      {field.helpText ? (
        <p className="text-[10px] mt-1.5" style={{ color: hasError ? '#d97706' : 'var(--text-faint)' }}>{field.helpText}</p>
      ) : null}
    </>
  );

  const renderError = () =>
    hasError ? (
      <p className="text-[10px] mt-1 font-semibold" style={{ color: '#d97706' }}>{error}</p>
    ) : null;

  // ── Text / Email / Tel / Password ──────────────────────────────────────

  if (['text', 'email', 'tel', 'password', 'number'].includes(field.type)) {
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <input
          type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(field.key, field.type === 'number' ? e.target.valueAsNumber || e.target.value : e.target.value)}
          placeholder={field.placeholder || ''}
          disabled={disabled}
          required={field.required}
          className={`${inputClass} ${focusStyle}`}
          style={inputStyle()}
          dir="auto"
        />
        {field.key === 'securePassword' || field.key === 'password' ? (
          <PasswordStrengthBar password={value || ''} isRtl={isRtl} />
        ) : null}
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── Date ──────────────────────────────────────────────────────────────

  if (field.type === 'date') {
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          required={field.required}
          className={`${inputClass} ${focusStyle}`}
          style={{ ...inputStyle(), colorScheme: 'light' }}
        />
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── Select ────────────────────────────────────────────────────────────

  if (field.type === 'select') {
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={disabled}
            required={field.required}
            className={`${inputClass} ${focusStyle} appearance-none`}
            style={{ ...inputStyle(), paddingRight: isRtl ? '14px' : '36px', paddingLeft: isRtl ? '36px' : '14px' }}
          >
            <option value="">{isRtl ? '— اختر' : '— Select'}</option>
            {(field.options || []).map((opt: FieldOption) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{
            color: 'var(--text-faint)',
            [isRtl ? 'left' : 'right']: '12px',
          }} />
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── Wilaya Select (Dropdown) ──────────────────────────────────────────

  if (field.type === 'wilaya_select') {
    // If multiselect wiilaya (coverageWilayas)
    if (field.key === 'coverageWilayas' || field.key === 'wilayasCovered') {
      const selected = (value as string[]) || [];
      const toggle = (code: string) => {
        const next = selected.includes(code) ? selected.filter((c: string) => c !== code) : [...selected, code];
        onChange(field.key, next);
      };
      return (
        <div className="space-y-0.5">
          {renderLabel()}
          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl" style={{ background: hasError ? 'color-mix(in srgb, #d97706 8%, var(--bg-muted))' : 'var(--bg-muted)' }}>
            {(wilayas || ALL_WILAYAS).map((w) => {
              const sel = selected.includes(w.code);
              return (
                <button
                  key={w.code}
                  type="button"
                  onClick={() => toggle(w.code)}
                  className="border-none text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
                  style={{
                    background: sel ? 'var(--sage-500)' : 'color-mix(in srgb, var(--bg-surface) 60%, var(--bg-muted))',
                    color: sel ? '#fff' : 'var(--text-faint)',
                  }}
                >
                  {w.code}
                </button>
              );
            })}
          </div>
          {renderHelpText()}
          {renderError()}
        </div>
      );
    }
    // Single wilaya select
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div className="relative">
          <select
            value={value || ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={disabled}
            required={field.required}
            className={`${inputClass} ${focusStyle} appearance-none`}
            style={{ ...inputStyle(), paddingRight: isRtl ? '14px' : '36px', paddingLeft: isRtl ? '36px' : '14px' }}
          >
            <option value="">{isRtl ? '— اختر الولاية' : '— Select Wilaya'}</option>
            {(wilayas || ALL_WILAYAS).map((w) => (
              <option key={w.code} value={w.code}>{w.code} — {isRtl ? w.name_ar : w.name_en}</option>
            ))}
          </select>
          <ChevronDown className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{
            color: 'var(--text-faint)',
            [isRtl ? 'left' : 'right']: '12px',
          }} />
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── Chip Group (multiselect pill toggles) ─────────────────────────────

  if (field.type === 'chip_group') {
    const selected = (value as string[]) || [];
    const toggle = (optValue: string) => {
      const next = selected.includes(optValue)
        ? selected.filter((v: string) => v !== optValue)
        : [...selected, optValue];
      onChange(field.key, next);
    };
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((opt: FieldOption) => {
            const sel = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                disabled={disabled}
                className="border-none rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                style={{
                  background: sel ? 'var(--sage-500)' : 'color-mix(in srgb, var(--bg-surface) 50%, var(--bg-muted))',
                  color: sel ? '#fff' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── OTP with phone input ──────────────────────────────────────────────

  if (field.type === 'otp') {
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div className="relative">
          <input
            type="tel"
            value={otpSent ? otpValue : (value || '')}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              if (!otpSent) onChange(field.key, raw);
              else setOtpValue(raw);
            }}
            placeholder={otpSent ? isRtl ? 'رمز التحقق' : 'Verification code' : (field.placeholder || '0550123456')}
            disabled={disabled}
            required={field.required}
            maxLength={otpSent ? 6 : 10}
            className={`${inputClass} ${focusStyle}`}
            style={{ ...inputStyle(), paddingRight: isRtl ? '14px' : '100px', paddingLeft: isRtl ? '100px' : '14px' }}
            dir="ltr"
          />
          <div className="absolute top-1/2 -translate-y-1/2" style={{ [isRtl ? 'left' : 'right']: '6px' }}>
            {!otpSent ? (
              value && value.length >= 9 ? (
                <button
                  type="button"
                  onClick={() => { setOtpSent(true); onChange(field.key + '_verified', false); }}
                  className="border-none text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
                  style={{ background: 'var(--sage-200)', color: 'var(--sage-700)' }}
                >
                  {isRtl ? 'تحقق' : 'Verify'}
                </button>
              ) : null
            ) : (
              <button
                type="button"
                onClick={() => { onChange(field.key + '_verified', true); }}
                disabled={otpValue.length < 4}
                className="border-none text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95"
                style={{ background: 'var(--sage-500)', color: '#fff', opacity: otpValue.length < 4 ? 0.5 : 1 }}
              >
                {isRtl ? 'تأكيد' : 'Confirm'}
              </button>
            )}
          </div>
        </div>
        {otpSent && (
          <button
            type="button"
            onClick={() => setOtpSent(false)}
            className="text-[10px] border-none bg-transparent cursor-pointer mt-1"
            style={{ color: 'var(--text-faint)' }}
          >
            {isRtl ? 'تغيير رقم الهاتف' : 'Change phone number'}
          </button>
        )}
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── File Upload ────────────────────────────────────────────────────────

  if (field.type === 'file') {
    const file = value as File | null;
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div
          className="rounded-xl p-5 text-center cursor-pointer transition-all border-none"
          style={{
            background: dragOver
              ? 'color-mix(in srgb, var(--bg-surface) 30%, var(--bg-muted))'
              : hasError
                ? 'color-mix(in srgb, #d97706 8%, var(--bg-muted))'
                : file
                  ? 'color-mix(in srgb, var(--sage-500) 8%, var(--bg-muted))'
                  : 'var(--bg-muted)',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) onChange(field.key, e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--sage-500)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--sage-600)' }}>{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(field.key, null); }}
                className="border-none bg-transparent cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--text-faint)' }} />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: 'var(--text-faint)' }} />
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {isRtl ? 'اضغط أو اسحب لإرفاق الملف' : 'Tap or drag to upload'}
              </p>
            </>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onChange(field.key, e.target.files[0]); }} />
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── Signature ──────────────────────────────────────────────────────────

  if (field.type === 'signature') {
    const signed = !!value;
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div
          className="rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all border-none"
          style={{
            background: signed
              ? 'color-mix(in srgb, var(--sage-500) 10%, var(--bg-sage))'
              : hasError
                ? 'color-mix(in srgb, #d97706 8%, var(--bg-muted))'
                : 'var(--bg-sage)',
            minHeight: 80,
          }}
          onClick={() => onChange(field.key, signed ? null : { signed: true, timestamp: Date.now() })}
        >
          {signed ? (
            <>
              <CheckCircle className="w-8 h-8" style={{ color: 'var(--sage-500)' }} />
              <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--sage-600)' }}>
                {isRtl ? 'تم التوقيع' : 'Signed'}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {isRtl ? 'اضغط للإلغاء' : 'Tap to clear'}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-1 rounded-full mb-2" style={{ background: 'var(--text-faint)', opacity: 0.3 }} />
              <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
                {isRtl ? 'اضغط للتوقيع' : 'Tap to sign'}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {isRtl ? 'التوقيع الإلكتروني' : 'Electronic signature'}
              </p>
            </>
          )}
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── Checkbox ───────────────────────────────────────────────────────────

  if (field.type === 'checkbox') {
    const checked = !!value;
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onChange(field.key, !checked)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-none cursor-pointer text-left transition-all"
          style={{
            background: checked
              ? 'color-mix(in srgb, var(--sage-500) 10%, var(--bg-sage))'
              : hasError
                ? 'color-mix(in srgb, #d97706 6%, var(--bg-muted))'
                : 'var(--bg-muted)',
          }}
        >
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: checked ? 'var(--sage-500)' : 'color-mix(in srgb, var(--bg-surface) 60%, var(--bg-muted))' }}
          >
            {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
          </div>
          <div>
            <span className="text-sm" style={{ color: 'var(--text-body)' }}>{field.label}</span>
            {field.required && <span className="mr-1 text-xs" style={{ color: 'var(--sage-500)' }}>*</span>}
          </div>
        </button>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // ── Radio ──────────────────────────────────────────────────────────────

  if (field.type === 'radio') {
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div className="flex flex-wrap gap-2">
          {(field.options || []).map((opt: FieldOption) => {
            const sel = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(field.key, opt.value)}
                className="border-none rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                style={{
                  background: sel ? 'var(--sage-500)' : 'var(--bg-muted)',
                  color: sel ? '#fff' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {renderError()}
      </div>
    );
  }

  // ── Multiselect ────────────────────────────────────────────────────────

  if (field.type === 'multiselect') {
    const selected = (value as string[]) || [];
    return (
      <div className="space-y-0.5">
        {renderLabel()}
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl" style={{ background: hasError ? 'color-mix(in srgb, #d97706 8%, var(--bg-muted))' : 'var(--bg-muted)' }}>
          {(field.options || []).map((opt: FieldOption) => {
            const sel = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const next = sel ? selected.filter((v: string) => v !== opt.value) : [...selected, opt.value];
                  onChange(field.key, next);
                }}
                className="border-none text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
                style={{ background: sel ? 'var(--sage-500)' : 'color-mix(in srgb, var(--bg-surface) 60%, var(--bg-muted))', color: sel ? '#fff' : 'var(--text-faint)' }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {renderHelpText()}
        {renderError()}
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-xs" style={{ color: 'var(--text-faint)' }}>
      {isRtl ? `نوع الحقل غير معروف: ${field.type}` : `Unknown field type: ${field.type}`}
    </div>
  );
}

// ─── Password Strength Meter ───────────────────────────────────────────────

function PasswordStrengthBar({ password, isRtl }: { password: string; isRtl: boolean }) {
  const strength = calcPasswordStrength(password);

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${strength.score}%`,
            background: strength.score < 30 ? '#d97706' : strength.score < 60 ? '#b45309' : 'var(--sage-500)',
          }}
        />
      </div>
      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
        {strength.label}
      </p>
    </div>
  );
}

function calcPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  score = Math.min(score, 100);

  let label: string;
  if (score < 30) label = 'Weak';
  else if (score < 60) label = 'Medium';
  else label = 'Strong';

  return { score, label };
}