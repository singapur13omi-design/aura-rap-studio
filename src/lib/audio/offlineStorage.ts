/**
 * Browser IndexedDB storage for local persistence of recorded audio buffers
 * Ensures artists NEVER lose their recordings even if they refresh, close the tab, or experience network drops!
 * Synchronizes with cloud storage resiliently.
 */

const DB_NAME = 'AuraRapStudioAudioCache';
const STORE_NAME = 'track_recordings';
const DB_VERSION = 2;

export interface TrackSyncRecord {
  trackId: string;
  blob: Blob;
  savedAt: number;
  syncStatus: 'SYNCING' | 'SYNCED' | 'ERROR';
  checksum?: string;
  lastError?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'trackId' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTrackAudioLocally(
  trackId: string,
  blob: Blob,
  syncStatus: 'SYNCING' | 'SYNCED' | 'ERROR' = 'SYNCING'
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: TrackSyncRecord = {
        trackId,
        blob,
        savedAt: Date.now(),
        syncStatus,
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not cache track audio to IndexedDB:', err);
  }
}

export async function getTrackAudioLocally(trackId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function getTrackSyncRecord(trackId: string): Promise<TrackSyncRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function updateTrackSyncStatus(
  trackId: string,
  status: 'SYNCING' | 'SYNCED' | 'ERROR',
  errorMsg?: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(trackId);
      getReq.onsuccess = () => {
        if (getReq.result) {
          const updated = {
            ...getReq.result,
            syncStatus: status,
            lastError: errorMsg || undefined,
            updatedAt: Date.now(),
          };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Failed to update sync status in IndexedDB:', err);
  }
}

export async function listPendingSyncTracks(): Promise<TrackSyncRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records: TrackSyncRecord[] = req.result || [];
        resolve(records.filter((r) => r.syncStatus === 'ERROR' || r.syncStatus === 'SYNCING'));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function deleteTrackAudioLocally(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(trackId);
  } catch {
    // ignore
  }
}
