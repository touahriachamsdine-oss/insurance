/**
 * Role Registration Configuration
 *
 * Config-driven field definitions per role with validation rules,
 * role-differentiating fields, and role-proof verification logic.
 */

export type Role = 'client' | 'company_admin' | 'broker' | 'assessor' | 'superadmin' | 'agent';

export type FieldType =
  | 'text' | 'email' | 'tel' | 'password' | 'number'
  | 'select' | 'multiselect' | 'file' | 'otp' | 'signature'
  | 'date' | 'checkbox' | 'radio' | 'chip_group' | 'wilaya_select';

export interface FieldOption {
  value: string;
  label: string;
  group?: string;
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'min' | 'max' | 'email' | 'phone_dz' | 'match_field' | 'custom';
  value?: any;
  message: string;
  validate?: (value: any, formData: Record<string, any>) => boolean;
}

export interface RegistrationField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: FieldOption[];
  validation: ValidationRule[];
  /** If true, this field is unique to this role (differentiator) */
  isDifferentiator?: boolean;
  /** Help text shown below the field */
  helpText?: string;
  /** Group this field belongs to (for multi-step wizards) */
  group?: string;
  /** Conditionally show this field based on another field's value */
  dependsOn?: { field: string; value: any };
}

export interface RoleProofVerification {
  /** Description of what verification is performed */
  description: string;
  /** Type of verification */
  type: 'registry_lookup' | 'document_crosscheck' | 'employer_confirmation' | 'device_test' | 'otp' | 'callback_call' | 'territory_conflict' | 'domain_check' | 'token_validation' | 'audit_log';
  /** Whether this blocks activation */
  blocksActivation: boolean;
  /** Label shown in progress tracker */
  progressLabel: string;
}

export interface RoleConfig {
  id: Role;
  label: string;
  description: string;
  icon: string;
  /** Fields shown in step 3 (role-specific) */
  fields: RegistrationField[];
  /** Verification steps that prove this is a real person of this role */
  proofVerifications: RoleProofVerification[];
  /** Post-submit progress stages */
  progressStages: string[];
  /** Whether access is immediate (no pending state) */
  immediateAccess: boolean;
  /** Pending state labels */
  pendingStatus: string;
  pendingMessage: string;
  /** Steps for multi-step wizard (company_admin) */
  wizardSteps?: string[];
}

// ─── Shared validation rules ──────────────────────────────────────────────

const VALIDATORS = {
  required: (msg: string): ValidationRule => ({ type: 'required', message: msg }),
  email: (): ValidationRule => ({ type: 'email', message: 'Must be a valid email address' }),
  phoneDZ: (): ValidationRule => ({
    type: 'phone_dz',
    message: 'Must be a valid Algerian phone number (e.g., 0550123456)',
    validate: (v: string) => /^(05|06|07)\d{8}$/.test(v.replace(/\s/g, '')),
  }),
  pattern: (pattern: RegExp, msg: string): ValidationRule => ({ type: 'pattern', value: pattern, message: msg }),
  min: (n: number, msg: string): ValidationRule => ({ type: 'min', value: n, message: msg }),
  max: (n: number, msg: string): ValidationRule => ({ type: 'max', value: n, message: msg }),
  matchField: (field: string, msg: string): ValidationRule => ({ type: 'match_field', value: field, message: msg }),
  cin: (): ValidationRule => ({
    type: 'pattern',
    value: /^\d{18}$/,
    message: 'CIN must be 18 digits',
  }),
};

// ─── Role Configurations ──────────────────────────────────────────────────

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  // ═══════════════════════════════════════════════════════════════════════
  // BROKER
  // ═══════════════════════════════════════════════════════════════════════
  broker: {
    id: 'broker',
    label: 'Licensed Broker',
    description: 'Intermediate insurance products as a licensed broker',
    icon: 'Briefcase',
    fields: [
      { key: 'fullName', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'As on CIN', validation: [VALIDATORS.required('Full legal name is required')] },
      { key: 'agencyName', label: 'Brokerage / Agency Name', type: 'text', required: true, placeholder: 'Example Insurance Agency', validation: [VALIDATORS.required('Agency name is required')] },
      { key: 'brokerLicense', label: 'Professional Broker License Number', type: 'text', required: true, placeholder: 'BROKER-DZ-2026-001', validation: [VALIDATORS.required('License number is required'), VALIDATORS.pattern(/^BROKER/i, 'Must start with BROKER')], helpText: 'Algerian insurance broker accreditation ID' },
      { key: 'wilayaOperation', label: 'Wilaya of Operation', type: 'wilaya_select', required: true, placeholder: 'Select wilaya', validation: [VALIDATORS.required('Wilaya is required')] },
      { key: 'phone', label: 'Phone (OTP Verification)', type: 'otp', required: true, placeholder: '0550123456', validation: [VALIDATORS.required('Phone is required'), VALIDATORS.phoneDZ()] },
      { key: 'professionalEmail', label: 'Professional Email', type: 'email', required: false, placeholder: 'broker@agency.dz', validation: [VALIDATORS.email()] },
      { key: 'cinUpload', label: 'ID Card (CIN) Upload', type: 'file', required: true, validation: [VALIDATORS.required('CIN upload is required')], helpText: 'OCR will cross-check extracted name against typed name' },
      { key: 'registreCommerce', label: 'Registre de Commerce', type: 'file', required: true, validation: [VALIDATORS.required('Registre de Commerce is required')], helpText: 'Activity code must be consistent with insurance intermediation' },
      { key: 'ribBroker', label: 'Business Bank Account (RIB)', type: 'text', required: true, placeholder: '007 99999 00012345678 01', validation: [VALIDATORS.required('RIB is required')], helpText: 'Must be flagged "Compte Professionnel" — personal accounts will be rejected' },

      // ── DIFFERENTIATOR FIELDS ──
      { key: 'portfolioSize', label: 'Approximate Active Clients (Paper)', type: 'number', required: true, placeholder: 'e.g., 150', validation: [VALIDATORS.required('Portfolio size is required'), VALIDATORS.min(1, 'Must be at least 1')], isDifferentiator: true, helpText: 'How many active clients do you currently manage on paper?' },
      { key: 'carrierAppointments', label: 'Authorized Carrier Appointments', type: 'chip_group', required: true, options: [
        { value: 'SAA', label: 'SAA' }, { value: 'CAAT', label: 'CAAT' }, { value: 'CAAR', label: 'CAAR' },
        { value: 'Alliance', label: 'Alliance' }, { value: 'Trust', label: 'Trust' }, { value: 'Other', label: 'Other' },
      ], validation: [VALIDATORS.required('At least one carrier appointment is required')], isDifferentiator: true, helpText: 'Which insurers are you authorized to sell for? At least one must be confirmed by that carrier.' },
      { key: 'yearsActive', label: 'Years Active as Licensed Broker', type: 'number', required: true, placeholder: 'e.g., 5', validation: [VALIDATORS.required('Years active is required'), VALIDATORS.min(0, 'Cannot be negative')], isDifferentiator: true },
      { key: 'priorBrokerage', label: 'Prior Brokerage Name (if switching)', type: 'text', required: false, placeholder: 'Previous agency name', validation: [] as ValidationRule[], isDifferentiator: true },
      { key: 'ribType', label: 'RIB Account Type', type: 'chip_group', required: true, options: [
        { value: 'professional', label: 'Compte Professionnel (Business)' },
        { value: 'personal', label: 'Compte Personnel (Personal)' },
      ], validation: [
        VALIDATORS.required('RIB type is required'),
        {
          type: 'custom',
          message: 'Personal accounts are rejected. Commission payouts require a Compte Professionnel.',
          validate: (v: any) => v === 'professional',
        }
      ], isDifferentiator: true, helpText: 'Commission payouts require a professional/business account' },
    ],
    proofVerifications: [
      { description: 'License number validated against licensed-broker registry', type: 'registry_lookup', blocksActivation: true, progressLabel: 'License Check' },
      { description: 'Registre de Commerce activity code checked for insurance intermediation', type: 'document_crosscheck', blocksActivation: true, progressLabel: 'Document Check' },
      { description: 'At least one carrier appointment confirmed by that carrier\'s admin', type: 'employer_confirmation', blocksActivation: true, progressLabel: 'Carrier Confirmation' },
      { description: 'OCR on CIN cross-checks extracted name against typed name', type: 'document_crosscheck', blocksActivation: false, progressLabel: 'Identity Match' },
    ],
    progressStages: ['Submitted', 'License Check', 'Carrier Confirmation', 'Approved'],
    immediateAccess: false,
    pendingStatus: 'Pending License Verification',
    pendingMessage: 'Your broker license is being reviewed. We\'ll notify you once verified.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ASSESSOR
  // ═══════════════════════════════════════════════════════════════════════
  assessor: {
    id: 'assessor',
    label: 'Claims Assessor',
    description: 'Evaluate and appraise insurance claims',
    icon: 'ClipboardCheck',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Full name as on CIN', validation: [VALIDATORS.required('Name is required')] },
      { key: 'cin', label: 'National ID (CIN)', type: 'text', required: true, placeholder: '18-digit CIN number', validation: [VALIDATORS.required('CIN is required'), VALIDATORS.cin()] },
      { key: 'adjusterCertNumber', label: 'Adjuster Certification Number', type: 'text', required: false, placeholder: 'ASSESS-DZ-2026-001', validation: [] as ValidationRule[], helpText: 'Expert d\'assurance accreditation, if applicable' },
      { key: 'specialties', label: 'Specialization Tags', type: 'chip_group', required: true, options: [
        { value: 'auto', label: 'Automobile' }, { value: 'health', label: 'Health' },
        { value: 'property', label: 'Property & Home' }, { value: 'agriculture', label: 'Agriculture' },
        { value: 'life', label: 'Life' },
      ], validation: [VALIDATORS.required('At least one specialization is required')] },
      { key: 'coverageWilayas', label: 'Coverage Zones', type: 'wilaya_select', required: true, validation: [VALIDATORS.required('At least one coverage zone is required')] },
      { key: 'phone', label: 'Mobile Number (Mandatory)', type: 'tel', required: true, placeholder: '0550123456', validation: [VALIDATORS.required('Phone is required'), VALIDATORS.phoneDZ()] },
      { key: 'deviceType', label: 'Device Type', type: 'select', required: true, options: [
        { value: 'ios', label: 'iPhone / iOS' }, { value: 'android', label: 'Android' }, { value: 'other', label: 'Other' },
      ], validation: [VALIDATORS.required('Device type is required')] },
      { key: 'cameraGPSCheck', label: 'Camera & GPS Capability Check', type: 'checkbox', required: true, validation: [VALIDATORS.required('Device capability check is required')], helpText: 'Must pass live camera and GPS test during signup — account won\'t activate without it' },
      { key: 'employerAffiliation', label: 'Employer / Company Affiliation', type: 'select', required: false, options: [
        { value: 'independent', label: 'Independent Assessor' },
      ], validation: [] as ValidationRule[] },
      { key: 'isIndependent', label: 'Independent Assessor', type: 'checkbox', required: false, validation: [] as ValidationRule[] },

      // ── DIFFERENTIATOR FIELDS ──
      { key: 'hasVehicle', label: 'Do you own/use a vehicle for site visits?', type: 'chip_group', required: true, options: [
        { value: 'yes_car', label: 'Yes - Car' }, { value: 'yes_moto', label: 'Yes - Motorcycle' },
        { value: 'no', label: 'No - Public transport' },
      ], validation: [VALIDATORS.required('Required for claim routing')], isDifferentiator: true, helpText: 'Relevant for routing claims by travel radius' },
      { key: 'avgClaimsPerMonth', label: 'Average Claims Handled/Month (Prior)', type: 'number', required: true, placeholder: 'e.g., 15', validation: [VALIDATORS.required('Required'), VALIDATORS.min(0, 'Cannot be negative')], isDifferentiator: true, helpText: 'Signals real adjuster experience' },
      { key: 'languagesSpoken', label: 'Languages Spoken for Client Statements', type: 'chip_group', required: true, options: [
        { value: 'arabic', label: 'العربية' }, { value: 'french', label: 'Français' },
        { value: 'tamazight', label: 'ⵜⴰⵎⴰⵣⵉⵖⵜ' }, { value: 'english', label: 'English' },
      ], validation: [VALIDATORS.required('At least one language required')], isDifferentiator: true, helpText: 'Important for claimant-facing statement-taking' },
      { key: 'indemnityInsurance', label: 'Professional Indemnity Insurance Policy #', type: 'text', required: false, placeholder: 'If you carry your own liability cover', validation: [] as ValidationRule[], isDifferentiator: true, helpText: 'Many independent adjusters carry their own cover' },
    ],
    proofVerifications: [
      { description: 'Certification number validated against accreditation body (if provided)', type: 'registry_lookup', blocksActivation: false, progressLabel: 'Certification Check' },
      { description: 'Company admin confirms employment (if affiliated)', type: 'employer_confirmation', blocksActivation: true, progressLabel: 'Employment Confirmation' },
      { description: 'Device capability test (camera + GPS) must pass live', type: 'device_test', blocksActivation: true, progressLabel: 'Device Check' },
      { description: 'Random sample of independent applicants routed to manual verification call', type: 'callback_call', blocksActivation: false, progressLabel: 'Verification Call' },
    ],
    progressStages: ['Submitted', 'Review', 'Device Check', 'Approved'],
    immediateAccess: false,
    pendingStatus: 'Under Review',
    pendingMessage: 'Your assessor application is being reviewed.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COMPANY / CARRIER ADMIN
  // ═══════════════════════════════════════════════════════════════════════
  company_admin: {
    id: 'company_admin',
    label: 'Insurance Company',
    description: 'Register your company and manage clients',
    icon: 'Building2',
    wizardSteps: ['Legal Info', 'License Verification', 'Callback Confirmation', 'Structure', 'Branding', 'Payment'],
    fields: [
      // Group: Legal Info
      { key: 'companyNameAr', label: 'Company Legal Name (Arabic)', type: 'text', required: true, placeholder: 'الشركة الوطنية للتأمين', validation: [VALIDATORS.required('Arabic name is required')], group: 'legal' },
      { key: 'companyNameEn', label: 'Company Legal Name (English)', type: 'text', required: true, placeholder: 'National Insurance Co.', validation: [VALIDATORS.required('English name is required')], group: 'legal' },
      { key: 'companyCode', label: 'Company Code', type: 'text', required: true, placeholder: 'SAA', validation: [VALIDATORS.required('Code is required')], group: 'legal' },
      { key: 'nif', label: 'NIF (Tax ID)', type: 'text', required: true, placeholder: '0000123456789', validation: [VALIDATORS.required('NIF is required')], group: 'legal' },
      { key: 'registreCommerceNum', label: 'Registre de Commerce Number', type: 'text', required: true, placeholder: 'RC-2026-DZ-001', validation: [VALIDATORS.required('RC number is required')], group: 'legal' },
      { key: 'licenseNumber', label: 'Insurance Operating License Number', type: 'text', required: true, placeholder: 'LIC-2026-DZ-001', validation: [VALIDATORS.required('License is required')], group: 'legal', helpText: 'Regulatory authorization to underwrite in Algeria' },
      { key: 'primaryContactName', label: 'Primary Admin Contact Name', type: 'text', required: true, placeholder: 'Full Name', validation: [VALIDATORS.required('Contact name is required')], group: 'legal' },
      { key: 'primaryContactTitle', label: 'Admin Position/Title', type: 'text', required: true, placeholder: 'e.g., CEO, Head of Underwriting', validation: [VALIDATORS.required('Title is required')], group: 'legal', isDifferentiator: true, helpText: 'Must be a company role, not a personal title' },
      {
        key: 'primaryContactEmail',
        label: 'Primary Admin Email',
        type: 'email',
        required: true,
        placeholder: 'admin@company.dz',
        validation: [
          VALIDATORS.required('Admin email is required'),
          VALIDATORS.email(),
          {
            type: 'custom',
            message: 'Email domain must match the Company Official Domain, and public domains (Gmail, Yahoo, etc.) are strictly prohibited.',
            validate: (value: any, formData: Record<string, any>) => {
              if (!value) return true;
              const emailDomain = value.split('@')[1]?.toLowerCase();
              const companyDomain = formData.companyDomain?.toLowerCase();
              if (!emailDomain) return false;
              if (['gmail.com', 'yahoo.com', 'yahoo.fr', 'hotmail.com', 'outlook.com', 'aol.com', 'mail.ru'].includes(emailDomain)) {
                return false;
              }
              if (companyDomain && emailDomain !== companyDomain) {
                return false;
              }
              return true;
            }
          }
        ],
        group: 'legal',
        isDifferentiator: true,
        helpText: 'Must match company official domain'
      },
      { key: 'primaryContactPhone', label: 'Primary Admin Phone', type: 'tel', required: true, placeholder: '0550123456', validation: [VALIDATORS.required('Admin phone is required'), VALIDATORS.phoneDZ()], group: 'legal', isDifferentiator: true, helpText: 'Verification callback will be made to this number' },
      { key: 'companyDomain', label: 'Company Official Domain', type: 'text', required: true, placeholder: 'company.dz', validation: [VALIDATORS.required('Domain is required'), VALIDATORS.pattern(/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Must be a valid domain')], group: 'legal', isDifferentiator: true, helpText: 'Registration email domain must match this' },

      // Group: Structure
      { key: 'numBranches', label: 'Number of Branches', type: 'number', required: true, placeholder: '5', validation: [VALIDATORS.required('Required'), VALIDATORS.min(1, 'At least 1 branch')], group: 'structure' },
      { key: 'headquartersWilaya', label: 'Headquarters Wilaya', type: 'wilaya_select', required: true, validation: [VALIDATORS.required('Wilaya is required')], group: 'structure' },
      { key: 'wilayasCovered', label: 'Wilayas Covered', type: 'wilaya_select', required: false, validation: [] as ValidationRule[], group: 'structure' },
      { key: 'linesOfBusiness', label: 'Lines of Business Offered', type: 'chip_group', required: true, options: [
        { value: 'auto', label: 'Auto' }, { value: 'property', label: 'Property' },
        { value: 'liability', label: 'Liability' }, { value: 'health', label: 'Health' },
        { value: 'life', label: 'Life' }, { value: 'agriculture', label: 'Agriculture' },
        { value: 'cyber', label: 'Cyber' },
      ], validation: [VALIDATORS.required('At least one line of business required')], group: 'structure' },

      // Group: Branding
      { key: 'companyLogo', label: 'Company Logo', type: 'file', required: false, validation: [] as ValidationRule[], group: 'branding' },

      // Group: Billing
      { key: 'billingEmail', label: 'Billing Contact Email', type: 'email', required: true, placeholder: 'billing@company.dz', validation: [VALIDATORS.required('Billing email is required'), VALIDATORS.email()], group: 'billing' },
      { key: 'paymentMethod', label: 'Platform Subscription Payment Method', type: 'select', required: true, options: [
        { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'edahabia', label: 'Edahabia' },
        { value: 'cib', label: 'CIB' },
      ], validation: [VALIDATORS.required('Payment method is required')], group: 'billing' },

      // ── DIFFERENTIATOR FIELDS ──
      { key: 'solvencyMargin', label: 'Approximate Solvency Margin / Capital Declaration', type: 'text', required: true, placeholder: 'e.g., 200M DZD or reference to latest filing', validation: [VALIDATORS.required('Solvency declaration is required')], isDifferentiator: true, helpText: 'Required for insurers — meaningless for any other role' },
      { key: 'reinsurancePartners', label: 'Reinsurance Treaty Partners', type: 'chip_group', required: false, options: [
        { value: 'none', label: 'None' }, { value: 'cag', label: 'CAG' }, { value: 'scr', label: 'SCR' },
        { value: 'munich_re', label: 'Munich Re' }, { value: 'swiss_re', label: 'Swiss Re' },
        { value: 'other', label: 'Other' },
      ], validation: [] as ValidationRule[], isDifferentiator: true, helpText: 'Only a carrier would have these' },
      { key: 'annualGWP', label: 'Declared Annual Gross Written Premium (GWP) Range', type: 'select', required: true, options: [
        { value: '<100M', label: '< 100M DZD' }, { value: '100M-500M', label: '100M - 500M DZD' },
        { value: '500M-1B', label: '500M - 1B DZD' }, { value: '>1B', label: '> 1B DZD' },
      ], validation: [VALIDATORS.required('GWP range is required')], isDifferentiator: true, helpText: 'Used to right-size your dashboard tier' },
    ],
    proofVerifications: [
      { description: 'Insurance operating license checked for validity and uniqueness', type: 'registry_lookup', blocksActivation: true, progressLabel: 'License Check' },
      { description: 'Company-domain email enforced (no gmail/yahoo/outlook)', type: 'domain_check', blocksActivation: true, progressLabel: 'Domain Check' },
      { description: 'Callback verification to company\'s official regulatory phone number', type: 'callback_call', blocksActivation: true, progressLabel: 'Callback Confirmation' },
      { description: 'Registre de Commerce + operating license cross-checked (names must match)', type: 'document_crosscheck', blocksActivation: true, progressLabel: 'Document Cross-Check' },
    ],
    progressStages: ['Submitted', 'Under Legal Review', 'Callback Confirmation', 'Approved'],
    immediateAccess: false,
    pendingStatus: 'Under Legal Review',
    pendingMessage: 'Your company license is being verified. We\'ll contact you for a verification call. Once approved, this will auto-provision your /company, /broker, and /assessor environments.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PLATFORM ADMIN (Invite-only)
  // ═══════════════════════════════════════════════════════════════════════
  superadmin: {
    id: 'superadmin',
    label: 'Platform Admin',
    description: 'Manage tenants and platform settings',
    icon: 'Shield',
    fields: [
      { key: 'inviteToken', label: 'Invite Token', type: 'text', required: true, placeholder: 'INV-DAMAN-XXXX', validation: [VALIDATORS.required('Invite token is required')], helpText: 'Single-use, time-limited token from super admin' },
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name', validation: [VALIDATORS.required('Name is required')] },
      { key: 'securePassword', label: 'Secure Password', type: 'password', required: true, placeholder: '••••••••', validation: [VALIDATORS.required('Password is required'), VALIDATORS.min(12, 'Must be at least 12 characters')] },
      { key: 'twoFASetup', label: 'Mandatory 2FA Setup', type: 'signature', required: true, validation: [VALIDATORS.required('2FA is mandatory')], helpText: 'Authenticator app QR code — no skip option' },

      // ── DIFFERENTIATOR FIELDS ──
      { key: 'employeeId', label: 'Internal Employee ID / Department', type: 'text', required: true, placeholder: 'INS-EMP-001', validation: [VALIDATORS.required('Employee ID is required')], isDifferentiator: true, helpText: 'Insure Me internal staff ID, not customer-facing' },
      { key: 'permissionScope', label: 'Assigned Permission Scope', type: 'text', required: true, placeholder: 'Set by inviter at invite time', validation: [VALIDATORS.required('Permission scope is required')], isDifferentiator: true, helpText: 'Cannot self-select or escalate — set by inviting super admin' },
    ],
    proofVerifications: [
      { description: 'Invite token is single-use, time-limited, cryptographically tied to email', type: 'token_validation', blocksActivation: true, progressLabel: 'Token Validation' },
      { description: 'Mandatory 2FA enrollment enforced before account is usable', type: 'device_test', blocksActivation: true, progressLabel: '2FA Enrollment' },
      { description: 'Account creation logged to Global System Audit Log', type: 'audit_log', blocksActivation: false, progressLabel: 'Audit Logged' },
    ],
    progressStages: ['Token Validated', '2FA Enrolled', 'Active'],
    immediateAccess: true,
    pendingStatus: 'Active',
    pendingMessage: 'Immediate access granted per assigned permissions.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CLIENT (Policyholder)
  // ═══════════════════════════════════════════════════════════════════════
  client: {
    id: 'client',
    label: 'Individual Client',
    description: 'Manage your personal insurance policies',
    icon: 'User',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'As on CIN/passport', validation: [VALIDATORS.required('Name is required')] },
      { key: 'cin', label: 'CIN or Passport Number', type: 'text', required: true, placeholder: '18-digit CIN or passport number', validation: [VALIDATORS.required('CIN is required')] },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, validation: [VALIDATORS.required('Date of birth is required')] },
      { key: 'phone', label: 'Phone (OTP Primary Auth)', type: 'otp', required: true, placeholder: '0550123456', validation: [VALIDATORS.required('Phone is required'), VALIDATORS.phoneDZ()], helpText: 'Primary authentication factor for most Algerian users' },
      { key: 'email', label: 'Email (Optional)', type: 'email', required: false, placeholder: 'you@email.dz', validation: [VALIDATORS.email()] },
      { key: 'existingPolicyNumber', label: 'Existing Policy Number (if migrating)', type: 'text', required: false, placeholder: 'e.g., 2026-ALG-001234', validation: [] as ValidationRule[], helpText: 'Auto-matches against digitized archive to pre-fill history' },
      { key: 'existingInsurer', label: 'Current Insurer Name', type: 'select', required: false, options: [
        { value: 'SAA', label: 'SAA' }, { value: 'CAAT', label: 'CAAT' }, { value: 'CAAR', label: 'CAAR' },
        { value: 'Alliance', label: 'Alliance' }, { value: 'Trust', label: 'Trust' },
      ], validation: [] as ValidationRule[] },
      { key: 'preferredLang', label: 'Preferred Language', type: 'chip_group', required: true, options: [
        { value: 'ar', label: 'العربية' }, { value: 'fr', label: 'Français' },
      ], validation: [VALIDATORS.required('Language is required')] },
      { key: 'preferredChannel', label: 'Preferred Contact Channel', type: 'chip_group', required: true, options: [
        { value: 'app', label: 'App' }, { value: 'sms', label: 'SMS' }, { value: 'whatsapp', label: 'WhatsApp' },
      ], validation: [VALIDATORS.required('Channel is required')] },
      { key: 'linkFamily', label: 'Link Family Members / Assets', type: 'checkbox', required: false, validation: [] as ValidationRule[], helpText: 'Spouse policy, vehicle, home — during onboarding' },

      // ── DIFFERENTIATOR FIELDS (absence of professional fields is the signal) ──
      { key: 'policyRelationship', label: 'Relationship to Linked Policy', type: 'select', required: false, options: [
        { value: 'self', label: 'Self' }, { value: 'spouse', label: 'Spouse' },
        { value: 'dependent', label: 'Dependent' }, { value: 'employer', label: 'Employer-provided' },
      ], validation: [] as ValidationRule[], isDifferentiator: true, dependsOn: { field: 'existingPolicyNumber', value: '*' } },
      { key: 'dataConsent', label: 'I consent to data processing under Algerian data protection rules', type: 'checkbox', required: true, validation: [VALIDATORS.required('Consent is required')], isDifferentiator: true, helpText: 'Consumer-specific legal requirement' },
    ],
    proofVerifications: [
      { description: 'OTP to real, reachable Algerian mobile number', type: 'otp', blocksActivation: true, progressLabel: 'Phone Verified' },
      { description: 'If claiming existing policy, CIN must exactly match digitized archive record', type: 'registry_lookup', blocksActivation: false, progressLabel: 'Policy Match' },
    ],
    progressStages: ['Phone Verified', 'Active'],
    immediateAccess: true,
    pendingStatus: 'Verified',
    pendingMessage: 'Account created. You can start immediately.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // INDEPENDENT AGENT (Wilaya Rep)
  // ═══════════════════════════════════════════════════════════════════════
  agent: {
    id: 'agent',
    label: 'Independent Agent',
    description: 'Represent companies in wilayas',
    icon: 'Users',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'As on CIN', validation: [VALIDATORS.required('Name is required')] },
      { key: 'cin', label: 'National ID (CIN)', type: 'text', required: true, placeholder: '18-digit CIN', validation: [VALIDATORS.required('CIN is required'), VALIDATORS.cin()] },
      { key: 'agentWilaya', label: 'Wilaya of Coverage', type: 'wilaya_select', required: true, validation: [VALIDATORS.required('Wilaya is required')] },
      { key: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '0550123456', validation: [VALIDATORS.required('Phone is required'), VALIDATORS.phoneDZ()] },
      { key: 'commissionAgreement', label: 'Agent Commission Agreement', type: 'signature', required: true, validation: [VALIDATORS.required('Signature is required')], helpText: 'Digital signature — timestamped and hash-logged' },
      { key: 'bankDetails', label: 'Bank Details for Commission Payout', type: 'text', required: true, placeholder: '007 99999 00012345678 01', validation: [VALIDATORS.required('Bank details are required')] },
      { key: 'deviceCapable', label: 'Device Capability Check (Camera + GPS)', type: 'checkbox', required: true, validation: [VALIDATORS.required('Device check is required')], helpText: 'Must pass live test — agents are the field-digitization workforce' },

      // ── DIFFERENTIATOR FIELDS ──
      { key: 'exclusiveTerritory', label: 'Exclusive Territory Request (Communes)', type: 'text', required: true, placeholder: 'e.g., Bir Mourad Rais, Hydra, El Biar', validation: [VALIDATORS.required('Territory is required')], isDifferentiator: true, helpText: 'Specific communes within your wilaya — granularity no other role needs' },
      { key: 'physicalArchiveAccess', label: 'Do you hold physical paper policy files?', type: 'chip_group', required: true, options: [
        { value: 'yes_high', label: 'Yes — 100+ files' }, { value: 'yes_low', label: 'Yes — under 100 files' },
        { value: 'no', label: 'No' },
      ], validation: [VALIDATORS.required('Required')], isDifferentiator: true, helpText: 'Determines priority for field-digitization workforce' },
      { key: 'referringCompany', label: 'Referring Company or Broker (if any)', type: 'text', required: false, placeholder: 'Company or broker name', validation: [] as ValidationRule[], isDifferentiator: true, helpText: 'Optional but weighted — they will receive a confirmation request' },
    ],
    proofVerifications: [
      { description: 'Territory-conflict check against all other approved agents', type: 'territory_conflict', blocksActivation: true, progressLabel: 'Territory Check' },
      { description: 'If referring company named, they receive a confirmation request', type: 'employer_confirmation', blocksActivation: false, progressLabel: 'Reference Check' },
      { description: 'Digital signature timestamped, hash-logged, device/location recorded', type: 'audit_log', blocksActivation: false, progressLabel: 'Signature Logged' },
    ],
    progressStages: ['Submitted', 'Territory Check', 'Reference Check', 'Approved'],
    immediateAccess: false,
    pendingStatus: 'Pending Territory Check',
    pendingMessage: 'Your coverage territory is being verified. You\'ll be notified upon approval.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Get fields for a specific role, optionally filtered by group
 */
export function getRoleFields(role: Role, group?: string): RegistrationField[] {
  const config = ROLE_CONFIGS[role];
  if (!config) return [];
  if (group) return config.fields.filter(f => f.group === group);
  return config.fields;
}

/**
 * Get only the differentiator fields for a role
 */
export function getDifferentiatorFields(role: Role): RegistrationField[] {
  return ROLE_CONFIGS[role]?.fields.filter(f => f.isDifferentiator) || [];
}

/**
 * Validate a single field value
 */
export function validateField(field: RegistrationField, value: any, formData: Record<string, any>): string | null {
  for (const rule of field.validation) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && value.length === 0)) {
          return rule.message;
        }
        break;
      case 'pattern':
        if (value && !(rule.value as RegExp).test(value)) return rule.message;
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return rule.message;
        break;
      case 'phone_dz':
        if (value && !/^(05|06|07)\d{8}$/.test(value.replace(/\s/g, ''))) return rule.message;
        break;
      case 'min':
        if (value !== undefined && value !== '' && Number(value) < (rule.value as number)) return rule.message;
        break;
      case 'max':
        if (value !== undefined && value !== '' && Number(value) > (rule.value as number)) return rule.message;
        break;
      case 'match_field':
        if (value !== formData[rule.value as string]) return rule.message;
        break;
      case 'custom':
        if (rule.validate && !rule.validate(value, formData)) return rule.message;
        break;
    }
  }
  return null;
}

/**
 * Validate all fields for a role
 */
export function validateAllFields(role: Role, formData: Record<string, any>): Record<string, string> {
  const errors: Record<string, string> = {};
  const fields = getRoleFields(role);

  for (const field of fields) {
    // Skip fields with dependencies that aren't met
    if (field.dependsOn) {
      const depValue = formData[field.dependsOn.field];
      if (field.dependsOn.value !== '*' && depValue !== field.dependsOn.value) continue;
      if (field.dependsOn.value === '*' && !depValue) continue;
    }

    const error = validateField(field, formData[field.key], formData);
    if (error) errors[field.key] = error;
  }

  return errors;
}