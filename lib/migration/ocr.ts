/**
 * OCR + Classification Pipeline for Paper-to-Digital Migration Engine
 *
 * Handles document ingestion, OCR processing, classification, and field extraction
 * for Algerian insurance documents (French/Arabic bilingual).
 */

export interface OCRDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'tiff' | 'jpg' | 'png';
  pageCount: number;
  content: string;
  confidence: number;
}

export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  source: string;
}

export interface OCRResult {
  documentId: string;
  fields: ExtractedField[];
  overallConfidence: number;
  needsHumanReview: boolean;
  rawText: string;
  language: 'arabic' | 'french' | 'mixed';
}

export type DocumentCategory =
  | 'policy_contract'
  | 'application_form'
  | 'loss_run'
  | 'id_card'
  | 'bank_slip'
  | 'police_report'
  | 'medical_certificate'
  | 'invoice'
  | 'unknown';

export interface ClassificationResult {
  category: DocumentCategory;
  confidence: number;
  subCategory?: string;
}

/**
 * Valid document categories with their human-readable labels
 */
export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { ar: string; fr: string; en: string }> = {
  policy_contract: { ar: 'عقد تأمين', fr: 'Contrat d\'assurance', en: 'Policy Contract' },
  application_form: { ar: 'طلب تأمين', fr: 'Demande d\'assurance', en: 'Application Form' },
  loss_run: { ar: 'سجل الخسائر', fr: 'Relevé de sinistres', en: 'Loss Run' },
  id_card: { ar: 'بطاقة تعريف', fr: 'Carte d\'identité', en: 'ID Card' },
  bank_slip: { ar: 'إيصال بنكي', fr: 'Relevé bancaire', en: 'Bank Slip' },
  police_report: { ar: 'تقرير شرطة', fr: 'Rapport de police', en: 'Police Report' },
  medical_certificate: { ar: 'شهادة طبية', fr: 'Certificat médical', en: 'Medical Certificate' },
  invoice: { ar: 'فاتورة', fr: 'Facture', en: 'Invoice' },
  unknown: { ar: 'غير معروف', fr: 'Inconnu', en: 'Unknown' },
};

/**
 * Configuration for OCR processing
 */
export interface OCRConfig {
  minConfidence: number;           // Threshold for auto-accepting fields (0-1)
  arabicOCREnabled: boolean;       // Enable Arabic RTL OCR
  handwritingRecognition: boolean; // Enable handwriting recognition fallback
  autoSplitDocuments: boolean;     // Auto-split multi-page documents
  separatorSheets: boolean;         // Detect blank-page / barcode separator sheets
}

export const DEFAULT_OCR_CONFIG: OCRConfig = {
  minConfidence: 0.85,
  arabicOCREnabled: true,
  handwritingRecognition: true,
  autoSplitDocuments: true,
  separatorSheets: true,
};

/**
 * Process a scanned document through the OCR pipeline.
 * In production, this would call an external OCR service (e.g., Tesseract.js, Google Vision, Azure OCR)
 * with Arabic language pack support.
 */
export async function processDocument(
  document: OCRDocument,
  config: OCRConfig = DEFAULT_OCR_CONFIG
): Promise<OCRResult> {
  console.log(`[OCR Pipeline] Processing document: ${document.fileName} (${document.fileType})`);

  // Simulate OCR processing time
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In production, this would:
  // 1. Convert PDF/TIFF pages to images
  // 2. Run OCR with Arabic + French language packs
  // 3. Handle RTL layout for Arabic text
  // 4. Apply deskew, edge detection, glare correction
  // 5. Extract fields with confidence scoring

  const extractedFields = simulateFieldExtraction(document);
  const overallConfidence = calculateOverallConfidence(extractedFields);
  const needsHumanReview = overallConfidence < config.minConfidence || 
    extractedFields.some((f) => f.confidence < config.minConfidence);

  return {
    documentId: document.id,
    fields: extractedFields,
    overallConfidence,
    needsHumanReview,
    rawText: document.content,
    language: detectLanguage(document.content),
  };
}

/**
 * Detect whether text is Arabic, French, or mixed
 */
function detectLanguage(text: string): 'arabic' | 'french' | 'mixed' {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const latinPattern = /[a-zA-ZÀ-ÿ]/;

  const hasArabic = arabicPattern.test(text);
  const hasLatin = latinPattern.test(text);

  if (hasArabic && hasLatin) return 'mixed';
  if (hasArabic) return 'arabic';
  return 'french';
}

/**
 * Calculate overall confidence from extracted fields
 */
function calculateOverallConfidence(fields: ExtractedField[]): number {
  if (fields.length === 0) return 1;
  return fields.reduce((acc, f) => acc + f.confidence, 0) / fields.length;
}

/**
 * Simulate field extraction from document content.
 * In production, this would use ML-based NER and regex patterns tailored to Algerian document formats.
 */
function simulateFieldExtraction(document: OCRDocument): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const text = document.content;

  // Policy number extraction (Algerian format: e.g., "N° Police: 2026-ALG-001234")
  const policyMatch = text.match(/N[°°]?\s*(?:Pol(?:ice)?|Police)\s*[:\s]*([A-Z0-9\-/]+)/i);
  if (policyMatch) {
    fields.push({
      name: 'policy_number',
      value: policyMatch[1],
      confidence: 0.92,
      source: 'regex',
    });
  }

  // Algerian CIN/NIN (18-digit number)
  const cinMatch = text.match(/\b(\d{18})\b/);
  if (cinMatch) {
    fields.push({
      name: 'nin',
      value: cinMatch[1],
      confidence: 0.95,
      source: 'regex',
    });
  }

  // Policyholder name extraction (between "Souscripteur" / "المؤمن له" and next field)
  const nameMatch = text.match(/(?:Souscripteur|المؤمن له|Nom|الاسم)[\s:]*([A-Za-zÀ-ÿ\s\-]+)/i);
  if (nameMatch) {
    fields.push({
      name: 'policyholder_name',
      value: nameMatch[1].trim(),
      confidence: 0.85,
      source: 'regex',
    });
  }

  // Date extraction (DD/MM/YYYY or YYYY-MM-DD)
  const dateMatches = text.match(/\b(\d{2}[/-]\d{2}[/-]\d{4})\b/g);
  if (dateMatches && dateMatches.length >= 2) {
    fields.push({
      name: 'start_date',
      value: dateMatches[0],
      confidence: 0.90,
      source: 'regex',
    });
    fields.push({
      name: 'end_date',
      value: dateMatches[1],
      confidence: 0.90,
      source: 'regex',
    });
  }

  // Premium amount (DZD)
  const premiumMatch = text.match(/(?:Prime|قسط|Montant|المبلغ)[\s:]*([\d.,]+)\s*(?:DZD|د\.ج|DA)?/i);
  if (premiumMatch) {
    fields.push({
      name: 'premium_amount',
      value: premiumMatch[1].replace(/,/g, ''),
      confidence: 0.88,
      source: 'regex',
    });
  }

  // Vehicle registration (Algerian plate: 1234-12-01 format)
  const plateMatch = text.match(/\b(\d{3,4}[\s-]*\d{1,2}[\s-]*\d{1,2})\b/);
  if (plateMatch) {
    fields.push({
      name: 'vehicle_registration',
      value: plateMatch[1].replace(/\s+/g, '-'),
      confidence: 0.87,
      source: 'regex',
    });
  }

  // Property address
  const addressMatch = text.match(/(?:Adresse|العنوان|Bien|الممتلكات)[\s:]*([A-Za-z0-9À-ÿ\s,.\-]+)/i);
  if (addressMatch) {
    fields.push({
      name: 'property_address',
      value: addressMatch[1].trim(),
      confidence: 0.80,
      source: 'regex',
    });
  }

  return fields;
}

/**
 * Classify a document based on its OCR content and visual features
 */
export async function classifyDocument(
  document: OCRDocument,
  ocrResult?: OCRResult
): Promise<ClassificationResult> {
  // In production, this would use a trained ML model for Algerian document layouts
  const text = document.content.toLowerCase();
  const classification = classifyByContent(text);

  return classification;
}

/**
 * Content-based classification using keyword matching
 */
function classifyByContent(text: string): ClassificationResult {
  // Insurance policy keywords
  if (
    /\b(contrat\s*d'?assurance|وثيقة\s*تأمين|police\s*d'?assurance|conditions\s*générales)\b/i.test(text) &&
    /\b(prime|قسط|couverture|تغطية)\b/i.test(text)
  ) {
    return { category: 'policy_contract', confidence: 0.90 };
  }

  // Application form
  if (
    /\b(demande\s*d'?assurance|طلب\s*تأمين|formulaire\s*d'?adhésion|استمارة\s*انضمام)\b/i.test(text)
  ) {
    return { category: 'application_form', confidence: 0.85 };
  }

  // Loss run / claims history
  if (
    /\b(relevé\s*de\s*sinistres|سجل\s*الخسائر|historique\s*des\s*sinistres|تقرير\s*الحوادث)\b/i.test(text) ||
    (/\b(sinistre|حادث|claim)\b/i.test(text) && /\b(montant|المبلغ|indemnité|تعويض)\b/i.test(text))
  ) {
    return { category: 'loss_run', confidence: 0.88 };
  }

  // ID card / CIN
  if (
    /\b(carte\s*d'?identité|بطاقة\s*تعريف|cin|nin|رقم\s*الوطني)\b/i.test(text) ||
    /\b\d{18}\b/.test(text)
  ) {
    return { category: 'id_card', confidence: 0.92 };
  }

  // Bank slip / RIB
  if (
    /\b(rib|relevé\s*bancaire|إيصال\s*بنكي|حساب\s*بريدي|compte\s*bancaire)\b/i.test(text)
  ) {
    return { category: 'bank_slip', confidence: 0.90 };
  }

  // Police report
  if (
    /\b(procès-verbal|rapport\s*de\s*polic|تقرير\s*شرطة|محضر|constat)\b/i.test(text) &&
    /\b(accident|حادث|collision|اصطدام)\b/i.test(text)
  ) {
    return { category: 'police_report', confidence: 0.93 };
  }

  // Medical certificate
  if (
    /\b(certificat\s*médical|شهادة\s*طبية|rapport\s*médical|تقرير\s*طبي)\b/i.test(text) &&
    /\b(médecin|طبيب|diagnostic|تشخيص)\b/i.test(text)
  ) {
    return { category: 'medical_certificate', confidence: 0.91 };
  }

  // Invoice
  if (
    /\b(facture|فاتورة|devis|عرض\s*سعر)\b/i.test(text) &&
    /\b(montant\s*total|المبلغ\s*الإجمالي|tva|ضريبة)\b/i.test(text)
  ) {
    return { category: 'invoice', confidence: 0.86 };
  }

  return { category: 'unknown', confidence: 0.5 };
}

/**
 * Perform deskew, edge detection, and glare correction on a captured image
 */
export async function enhanceImage(imageBase64: string): Promise<string> {
  // In production, this would use OpenCV or a cloud image processing service
  console.log('[OCR Pipeline] Enhancing image...');
  await new Promise((resolve) => setTimeout(resolve, 200));
  return imageBase64;
}

/**
 * Split a multi-page document into individual pages based on blank pages or barcode separators
 */
export async function splitDocumentPages(
  document: OCRDocument,
  pages: string[]
): Promise<OCRDocument[]> {
  console.log(`[OCR Pipeline] Splitting ${pages.length} pages...`);

  const documents: OCRDocument[] = [];

  for (let i = 0; i < pages.length; i++) {
    documents.push({
      ...document,
      id: `${document.id}_p${i + 1}`,
      pageCount: 1,
      content: pages[i],
    });
  }

  return documents;
}