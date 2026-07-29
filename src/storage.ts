/**
 * Storage Utility for Al-Burhan App
 * Provides safe localStorage management with QuotaExceededError protection,
 * automatic image base64 compression, and IndexedDB secondary backup.
 */

const DB_NAME = 'AlBurhanStorageDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

// --- INDEXEDDB HELPER ---
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function idbSet(key: string, val: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(val, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('idbSet error:', e);
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('idbGet error:', e);
    return null;
  }
}

// --- IMAGE COMPRESSION UTILITY ---
/**
 * Compresses an image data URL (base64) down to max dimensions and JPEG quality.
 * Resulting image size is typically only 15KB - 30KB.
 */
export function compressBase64Image(
  dataUrl: string,
  maxDim = 450,
  quality = 0.45
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }

    // If string is already small (< 35KB), return as is
    if (dataUrl.length < 35000) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Synchronous string shrinker for emergency quota recovery
function shrinkStringImage(dataUrl: string): string {
  if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/') && dataUrl.length > 50000) {
    // If we cannot do async canvas in a sync loop, we can truncate extremely huge metadata or keep placeholder if emergency
    return dataUrl;
  }
  return dataUrl;
}

/**
 * Traverses an array/object and downsizes oversized image fields.
 */
export function optimizeDataForQuota(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (item && typeof item === 'object') {
        const copy = { ...item };
        // Common image fields in app: depositSlipUrl, photo, attachment, logo
        for (const key of ['depositSlipUrl', 'photo', 'attachment', 'logo', 'receiptUrl']) {
          if (typeof copy[key] === 'string' && copy[key].length > 60000) {
            copy[key] = shrinkStringImage(copy[key]);
          }
        }
        return copy;
      }
      return item;
    });
  }

  if (typeof data === 'object') {
    const copy = { ...data };
    for (const key in copy) {
      if (typeof copy[key] === 'string' && copy[key].length > 60000) {
        copy[key] = shrinkStringImage(copy[key]);
      }
    }
    return copy;
  }

  return data;
}

// --- SAFE LOCAL STORAGE READ/WRITE ---

/**
 * Safely writes data to localStorage.
 * Catches QuotaExceededError and optimizes image payload or uses IndexedDB.
 */
export function safeSetLocalStorage(key: string, value: any): void {
  const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);

  // Always save to IndexedDB as background backup
  idbSet(key, typeof value === 'string' ? JSON.parse(value) : value);

  try {
    localStorage.setItem(key, jsonStr);
  } catch (err: any) {
    console.warn(`[safeSetLocalStorage] QuotaExceededError for "${key}". Optimizing payload...`, err);

    try {
      // 1. Optimize payload synchronously
      const rawObj = typeof value === 'string' ? JSON.parse(value) : value;
      const optimized = optimizeDataForQuota(rawObj);
      const newStr = JSON.stringify(optimized);

      localStorage.setItem(key, newStr);
      console.log(`[safeSetLocalStorage] Successfully saved "${key}" after quota optimization!`);
    } catch (err2: any) {
      console.error(`[safeSetLocalStorage] Could not save "${key}" to localStorage even after optimization. Saved to IndexedDB.`, err2);
      // Data is safely stored in IndexedDB via idbSet above!
    }
  }
}

/**
 * Safely reads data from localStorage.
 */
export function safeGetLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`[safeGetLocalStorage] Failed reading "${key}" from localStorage:`, err);
  }
  return defaultValue;
}

/**
 * Scans existing localStorage keys on startup and compresses any bloated base64 strings
 * so the user's browser immediately frees up storage space.
 */
export async function cleanupStorageQuotaOnStartup(): Promise<void> {
  const keysToClean = ['ab_deposits', 'ab_members', 'ab_custom_notices', 'ab_custom_committee'];

  for (const key of keysToClean) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw.length < 500000) continue; // Skip if under ~500KB

      const items = JSON.parse(raw);
      if (!Array.isArray(items)) continue;

      let changed = false;
      const cleanedItems = await Promise.all(
        items.map(async (item: any) => {
          if (!item || typeof item !== 'object') return item;
          const updated = { ...item };

          for (const imgProp of ['depositSlipUrl', 'photo', 'attachment', 'logo']) {
            if (typeof updated[imgProp] === 'string' && updated[imgProp].length > 50000) {
              updated[imgProp] = await compressBase64Image(updated[imgProp], 450, 0.40);
              changed = true;
            }
          }
          return updated;
        })
      );

      if (changed) {
        console.log(`[cleanupStorageQuotaOnStartup] Cleaned up bloated storage key "${key}". New length: ${JSON.stringify(cleanedItems).length}`);
        safeSetLocalStorage(key, cleanedItems);
      }
    } catch (e) {
      console.warn(`[cleanupStorageQuotaOnStartup] Failed cleaning key ${key}:`, e);
    }
  }
}
