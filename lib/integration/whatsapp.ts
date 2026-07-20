/**
 * WhatsApp Business Integration
 *
 * Claim filing, document upload, and status updates via WhatsApp.
 * Since it's the dominant messaging channel in Algeria, this meets clients
 * where they already are instead of requiring app adoption.
 */

export interface WhatsAppMessage {
  to: string;
  templateName: string;
  parameters: Record<string, string>;
  language: 'ar' | 'fr';
}

export interface WhatsAppDocument {
  to: string;
  documentUrl: string;
  documentType: string;
  caption: string;
}

export interface WhatsAppSession {
  id: string;
  phoneNumber: string;
  status: 'active' | 'completed' | 'expired';
  lastInteraction: string;
  context: Record<string, any>;
}

/**
 * Send a WhatsApp template message
 */
export async function sendWhatsAppTemplate(
  message: WhatsAppMessage
): Promise<boolean> {
  console.log(`[WhatsApp] Sending template "${message.templateName}" to ${message.to}`);
  // In production, call WhatsApp Business API
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
}

/**
 * Send claim status update via WhatsApp
 */
export async function sendClaimStatusWhatsApp(
  phoneNumber: string,
  claimNumber: string,
  status: string,
  clientName: string,
  language: 'ar' | 'fr'
): Promise<boolean> {
  const statusLabels: Record<string, Record<string, string>> = {
    filed: { ar: 'تم استلام المطالبة', fr: 'Sinistre déposé' },
    under_review: { ar: 'قيد المراجعة', fr: "En cours d'examen" },
    assessor_assigned: { ar: 'تم تعيين الخبير', fr: 'Expert assigné' },
    awaiting_documents: { ar: 'في انتظار المستندات', fr: 'En attente de documents' },
    payout_approved: { ar: 'تمت الموافقة على الدفع', fr: 'Paiement approuvé' },
    disbursed: { ar: 'تم الصرف', fr: 'Décaissé' },
  };

  const statusText = statusLabels[status]?.[language] || status;

  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: 'claim_status_update',
    parameters: {
      client_name: clientName,
      claim_number: claimNumber,
      status: statusText,
    },
    language,
  });
}

/**
 * Send policy renewal reminder via WhatsApp
 */
export async function sendRenewalWhatsApp(
  phoneNumber: string,
  clientName: string,
  policyNumber: string,
  expiryDate: string,
  language: 'ar' | 'fr'
): Promise<boolean> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: 'renewal_reminder',
    parameters: {
      client_name: clientName,
      policy_number: policyNumber,
      expiry_date: expiryDate,
    },
    language,
  });
}

/**
 * Send payment confirmation via WhatsApp
 */
export async function sendPaymentConfirmationWhatsApp(
  phoneNumber: string,
  clientName: string,
  amount: number,
  reference: string,
  language: 'ar' | 'fr'
): Promise<boolean> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: 'payment_confirmation',
    parameters: {
      client_name: clientName,
      amount: amount.toLocaleString(),
      reference,
    },
    language,
  });
}

/**
 * Send document request via WhatsApp
 */
export async function requestDocumentWhatsApp(
  phoneNumber: string,
  clientName: string,
  documentType: string,
  claimNumber: string,
  language: 'ar' | 'fr'
): Promise<boolean> {
  const docLabels: Record<string, Record<string, string>> = {
    police_report: { ar: 'تقرير الشرطة', fr: 'Rapport de police' },
    medical_certificate: { ar: 'شهادة طبية', fr: 'Certificat médical' },
    id_card: { ar: 'بطاقة التعريف', fr: "Carte d'identité" },
    invoice: { ar: 'فاتورة', fr: 'Facture' },
    photos: { ar: 'صور الحادث', fr: 'Photos de l\'accident' },
  };

  const docText = docLabels[documentType]?.[language] || documentType;

  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: 'document_request',
    parameters: {
      client_name: clientName,
      document_type: docText,
      claim_number: claimNumber,
    },
    language,
  });
}

/**
 * Handle incoming WhatsApp message (webhook handler)
 */
export async function handleIncomingWhatsApp(
  from: string,
  messageType: string,
  messageContent: any
): Promise<{ response: string; action?: string }> {
  console.log(`[WhatsApp] Received ${messageType} from ${from}`);

  // In production, parse message content and route to appropriate handler
  switch (messageType) {
    case 'text':
      return {
        response: 'شكراً لتواصلك مع Insure Me. كيف يمكننا مساعدتك؟',
        action: 'greeting',
      };
    case 'document':
      return {
        response: 'تم استلام مستندك. سيتم مراجعته من قبل فريقنا.',
        action: 'document_received',
      };
    case 'image':
      return {
        response: 'تم استلام الصورة. سيتم إرفاقها بملف مطالبتك.',
        action: 'photo_received',
      };
    default:
      return {
        response: 'شكراً لتواصلك. سنعود إليك قريباً.',
        action: 'unknown',
      };
  }
}