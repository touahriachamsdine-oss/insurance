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

// In-memory fallback queue to prevent data loss if localStorage quota (~5MB) is exceeded
let inMemoryQueue: SyncQueueItem[] = [];

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

  if (typeof window !== 'undefined') {
    try {
      const existing = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      existing.push(queueItem);
      localStorage.setItem('syncQueue', JSON.stringify(existing));
    } catch (e: any) {
      console.warn('[Offline] Storage quota exceeded or error occurred writing to localStorage. Trying cleanup.', e);
      
      // Try to clear completed syncs to free space, then write again
      try {
        const existing = JSON.parse(localStorage.getItem('syncQueue') || '[]');
        const filtered = existing.filter((i: any) => i.status !== 'completed');
        filtered.push(queueItem);
        localStorage.setItem('syncQueue', JSON.stringify(filtered));
      } catch (innerErr) {
        console.error('[Offline] Storage fully exhausted. Falling back to in-memory queue storage.', innerErr);
        // Fallback to in-memory storage for this session so we don't crash the user flow
        inMemoryQueue.push(queueItem);
      }
    }
  } else {
    // SSR/Node environment fallback
    inMemoryQueue.push(queueItem);
  }

  return queueItem;
}

/**
 * Get all items in the sync queue (merged local + in-memory fallback)
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  if (typeof window === 'undefined') return inMemoryQueue;

  try {
    const stored = localStorage.getItem('syncQueue');
    const diskQueue = stored ? JSON.parse(stored) : [];
    
    // Deduplicate in case items got copied or merged
    const combined = [...diskQueue];
    const diskIds = new Set(diskQueue.map((item: any) => item.id));
    
    for (const memItem of inMemoryQueue) {
      if (!diskIds.has(memItem.id)) {
        combined.push(memItem);
      }
    }
    
    return combined;
  } catch (e) {
    console.error('[Offline] Error reading from localStorage, using in-memory fallback.', e);
    return inMemoryQueue;
  }
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
    try {
      localStorage.setItem('syncQueue', JSON.stringify(queue));
      // If saved to disk successfully, we can clean up the memory copy of those disk items
      inMemoryQueue = inMemoryQueue.filter(
        (memItem) => !queue.some((diskItem) => diskItem.id === memItem.id)
      );
    } catch (e) {
      console.warn('[Offline] Quota exceeded on saveSyncQueue, retaining in-memory fallback.', e);
      // Keep entire queue in-memory if disk writes fail
      inMemoryQueue = queue;
    }
  } else {
    inMemoryQueue = queue;
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
  inMemoryQueue = inMemoryQueue.filter((i) => i.status !== 'completed');
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