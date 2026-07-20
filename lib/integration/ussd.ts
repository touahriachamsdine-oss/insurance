/**
 * USSD/SMS Fallback Channel
 *
 * Basic policy status, premium due dates, and claim status check via SMS/USSD code
 * for clients without smartphones.
 */

export interface USSDRequest {
  sessionId: string;
  msisdn: string;
  input: string;
  serviceCode: string;
  language: 'ar' | 'fr';
}

export interface USSDResponse {
  message: string;
  type: 'input' | 'end';
  nextMenu?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
  language: 'ar' | 'fr';
  templateId?: string;
}

const MENU_MAIN_AR = `
1. حالة وثيقتي
2. موعد الدفع
3. حالة المطالبة
4. التحدث مع وكيل
0. رجوع
`;

const MENU_MAIN_FR = `
1. Statut de ma police
2. Date d'échéance
3. Statut du sinistre
4. Parler à un agent
0. Retour
`;

const MENU_POLICY_STATUS_AR = 'الرجاء إدخال رقم الوثيقة:';
const MENU_POLICY_STATUS_FR = 'Veuillez entrer le numéro de police:';
const MENU_CLAIM_STATUS_AR = 'الرجاء إدخال رقم المطالبة:';
const MENU_CLAIM_STATUS_FR = 'Veuillez entrer le numéro de sinistre:';

/**
 * Handle incoming USSD request and generate appropriate response
 */
export async function handleUSSDRequest(request: USSDRequest): Promise<USSDResponse> {
  const { input } = request;
  const lang = request.language;

  switch (input) {
    case '':
    case '0':
      return {
        message: lang === 'ar'
          ? `مرحباً بك في Insure Me للتأمين\n${MENU_MAIN_AR}`
          : `Bienvenue chez Insure Me Assurance\n${MENU_MAIN_FR}`,
        type: 'input',
        nextMenu: 'main',
      };

    case '1':
      return {
        message: lang === 'ar' ? MENU_POLICY_STATUS_AR : MENU_POLICY_STATUS_FR,
        type: 'input',
        nextMenu: 'policy_status',
      };

    case '2':
      return {
        message: lang === 'ar'
          ? 'سيتم إعلامك برسالة نصية بموعد الدفع القادم'
          : 'Vous recevrez un SMS avec la date d\'échéance',
        type: 'end',
      };

    case '3':
      return {
        message: lang === 'ar' ? MENU_CLAIM_STATUS_AR : MENU_CLAIM_STATUS_FR,
        type: 'input',
        nextMenu: 'claim_status',
      };

    case '4':
      return {
        message: lang === 'ar'
          ? 'سيتم الاتصال بك من قبل وكيلنا قريباً'
          : 'Un agent vous contactera sous peu',
        type: 'end',
      };

    default:
      return {
        message: lang === 'ar'
          ? 'إدخال غير صالح. الرجاء المحاولة مرة أخرى.'
          : 'Entrée invalide. Veuillez réessayer.',
        type: 'input',
        nextMenu: 'main',
      };
  }
}

/**
 * Send an SMS notification
 */
export async function sendSMS(message: SMSMessage): Promise<boolean> {
  console.log(`[SMS] Sending to ${message.to}: ${message.message}`);
  await new Promise((resolve) => setTimeout(resolve, 300));
  return true;
}

/**
 * Send premium due reminder SMS
 */
export async function sendPremiumReminder(
  phoneNumber: string,
  clientName: string,
  dueDate: string,
  amount: number,
  language: 'ar' | 'fr'
): Promise<boolean> {
  const message = language === 'ar'
    ? `عزيزي ${clientName}، نذكرك بأن قسط التأمين الخاص بك بمبلغ ${amount} د.ج مستحق في ${dueDate}. الرجاء الدفع في الوقت المحدد لتجنب انقطاع التغطية. - Insure Me للتأمين`
    : `Cher ${clientName}, votre prime d'assurance de ${amount} DZD arrive à échéance le ${dueDate}. Veuillez payer à temps pour éviter une interruption de couverture. - Insure Me Assurance`;

  return sendSMS({ to: phoneNumber, message, language });
}

/**
 * Send claim status update SMS
 */
export async function sendClaimStatusUpdate(
  phoneNumber: string,
  claimNumber: string,
  status: string,
  language: 'ar' | 'fr'
): Promise<boolean> {
  const statusMessages: Record<string, Record<string, string>> = {
    filed: { ar: 'تم استلام المطالبة', fr: 'Sinistre déposé' },
    under_review: { ar: 'قيد المراجعة', fr: "En cours d'examen" },
    approved: { ar: 'تمت الموافقة', fr: 'Approuvé' },
    paid: { ar: 'تم الدفع', fr: 'Payé' },
  };

  const statusText = statusMessages[status]?.[language] || status;

  const message = language === 'ar'
    ? `تحديث المطالبة ${claimNumber}: ${statusText}. - Insure Me للتأمين`
    : `Mise à jour sinistre ${claimNumber}: ${statusText}. - Insure Me Assurance`;

  return sendSMS({ to: phoneNumber, message, language });
}

/**
 * Send policy renewal reminder SMS
 */
export async function sendRenewalReminder(
  phoneNumber: string,
  policyNumber: string,
  expiryDate: string,
  language: 'ar' | 'fr'
): Promise<boolean> {
  const message = language === 'ar'
    ? `وثيقتك رقم ${policyNumber} ستنتهي في ${expiryDate}. جدد الآن لتجنب انقطاع التغطية. اتصل بوكيلك أو زر موقعنا. - Insure Me للتأمين`
    : `Votre police ${policyNumber} expire le ${expiryDate}. Renouvelez maintenant pour éviter toute interruption. Contactez votre agent ou visitez notre site. - Insure Me Assurance`;

  return sendSMS({ to: phoneNumber, message, language });
}