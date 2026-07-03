/**
 * Offline-First Sync Engine
 *
 * Forms, uploads, and photo capture queue locally and sync when connectivity returns.
 * Essential for rural and low-connectivity areas outside major wilayas.
 */

export interface SyncQueueItem {
  id: string;
  type: 'claim' | 'quote' | 'document_upload' | 'photo' | 'form_submission' | 'payment';
  data: Record<string, any>;
  files?: string[]; // Base64 encoded files
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  lastError?: string;
}

export interface SyncStatus {
  queueSize: number;
  pendingCount: number;
  syncingCount: number;
  failedCount: number;
  completedCount: number;
  lastSyncAt: string | null;
  isOnline: boolean;
}

/**
 * Add an item to the offline sync queue
 */
export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount' | 'status'>
): Promise<SyncQueueItem> {
  const queueItem: SyncQueueItem = {
    ...item,
    id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };

  console.log(`[Offline] Added to sync queue: ${queueItem.type} (${queueItem.id})`);

  // In production, persist to IndexedDB or SQLite via local storage
  if (typeof window !== 'undefined') {
    const existing = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    existing.push(queueItem);
    localStorage.setItem('syncQueue', JSON.stringify(existing));
  }

  return queueItem;
}

/**
 * Get all items in the sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem('syncQueue');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Process the sync queue - send pending items to the server
 */
export async function processSyncQueue(): Promise<SyncStatus> {
  const queue = await getSyncQueue();
  const pendingItems = queue.filter((item) => item.status === 'pending');

  if (pendingItems.length === 0) {
    return await getSyncStatus();
  }

  // Mark items as syncing
  const updatedQueue = queue.map((item) =>
    item.status === 'pending' ? { ...item, status: 'syncing' as const } : item
  );
  await saveSyncQueue(updatedQueue);

  // Process each item
  for (const item of pendingItems) {
    try {
      // In production, call appropriate API endpoint
      console.log(`[Offline] Syncing ${item.type} (${item.id})...`);
      await simulateSync(item);

      // Mark as completed
      const currentQueue = await getSyncQueue();
      const processed = currentQueue.map((i) =>
        i.id === item.id ? { ...i, status: 'completed' as const } : i
      );
      await saveSyncQueue(processed);
    } catch (error: any) {
      const currentQueue = await getSyncQueue();
      const failed = currentQueue.map((i) =>
        i.id === item.id
          ? { ...i, status: 'failed' as const, retryCount: i.retryCount + 1, lastError: error.message }
          : i
      );
      await saveSyncQueue(failed);
    }
  }

  return await getSyncStatus();
}

/**
 * Simulate sync request for offline items
 */
async function simulateSync(item: SyncQueueItem): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
  if (Math.random() > 0.9) {
    throw new Error('Simulated network error');
  }
}

/**
 * Save sync queue to local storage
 */
async function saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('syncQueue', JSON.stringify(queue));
  }
}

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const queue = await getSyncQueue();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return {
    queueSize: queue.length,
    pendingCount: queue.filter((i) => i.status === 'pending').length,
    syncingCount: queue.filter((i) => i.status === 'syncing').length,
    failedCount: queue.filter((i) => i.status === 'failed').length,
    completedCount: queue.filter((i) => i.status === 'completed').length,
    lastSyncAt: queue.length > 0 ? queue[queue.length - 1].createdAt : null,
    isOnline,
  };
}

/**
 * Clear completed items from the sync queue
 */
export async function clearCompletedSyncs(): Promise<void> {
  const queue = await getSyncQueue();
  const filtered = queue.filter((i) => i.status !== 'completed');
  await saveSyncQueue(filtered);
}

/**
 * Retry failed sync items
 */
export async function retryFailedSyncs(): Promise<void> {
  const queue = await getSyncQueue();
  const retried = queue.map((item) =>
    item.status === 'failed' && item.retryCount < 5
      ? { ...item, status: 'pending' as const }
      : item
  );
  await saveSyncQueue(retried);
}

/**
 * Check network connectivity status
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Listen for connectivity changes
 */
export function onConnectivityChange(
  callback: (online: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}