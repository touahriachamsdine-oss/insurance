/**
 * Chain-of-Custody Log for Document Digitization
 *
 * Tracks every physical document digitized - who scanned it, when, which branch.
 * Required for regulatory audit trail and to resolve disputes about lost paper files.
 */

export interface CustodyEvent {
  id: string;
  documentId: string;
  documentType: string;
  actorId: string;
  actorName: string;
  branchId: string;
  branchName: string;
  action: 'scanned' | 'verified' | 'rejected' | 're_scanned' | 'archived' | 'destroyed' | 'exported';
  timestamp: string;
  metadata: Record<string, any>;
  notes?: string;
}

export interface ChainOfCustodyLog {
  documentId: string;
  events: CustodyEvent[];
}

/**
 * Record a custody event for a document
 */
export async function recordCustodyEvent(
  event: Omit<CustodyEvent, 'id' | 'timestamp'>
): Promise<CustodyEvent> {
  const fullEvent: CustodyEvent = {
    ...event,
    id: `CUSTODY-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };

  console.log(`[ChainOfCustody] ${fullEvent.action.toUpperCase()} - Doc: ${fullEvent.documentId} by ${fullEvent.actorName} at ${fullEvent.branchName}`);

  // In production, persist to database
  return fullEvent;
}

/**
 * Build a full chain-of-custody timeline for a document
 */
export async function getDocumentCustodyLog(
  documentId: string,
  events: CustodyEvent[]
): Promise<ChainOfCustodyLog> {
  const sorted = [...events]
    .filter((e) => e.documentId === documentId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    documentId,
    events: sorted,
  };
}

/**
 * Get the current location/status of a physical document
 */
export async function getDocumentCurrentStatus(
  events: CustodyEvent[]
): Promise<{
  documentId: string;
  currentStatus: CustodyEvent['action'];
  lastEvent: CustodyEvent | null;
  location: string;
}> {
  const actionOrder: CustodyEvent['action'][] = [
    'scanned',
    're_scanned',
    'verified',
    'rejected',
    'archived',
    'destroyed',
    'exported',
  ];

  const lastEvent = events[events.length - 1] || null;
  const currentStatus = lastEvent?.action || 'scanned';

  const location = lastEvent
    ? `${lastEvent.branchName} (${lastEvent.action})`
    : 'Unknown';

  return {
    documentId: lastEvent?.documentId || '',
    currentStatus,
    lastEvent,
    location,
  };
}