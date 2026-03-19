/**
 * IndexedDB draft storage: auto-save module steps before user saves to system storage.
 * Used by Code Editor (module steps, code).
 */

const DB_NAME = 'GamiLearnDrafts';
const DB_VERSION = 1;
const STORE_EDITOR = 'code-editor';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_EDITOR)) {
        db.createObjectStore(STORE_EDITOR, { keyPath: 'moduleId' });
      }
    };
  });
  return dbPromise;
}

/**
 * Save code editor draft (module steps, code).
 * @param {string} moduleId
 * @param {object} data - { stepsVerified, currentStepIndex, code: { html, css, javascript, jsx } }
 */
export async function saveEditorDraft(moduleId, data) {
  if (!moduleId) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EDITOR, 'readwrite');
    const store = tx.objectStore(STORE_EDITOR);
    const payload = {
      moduleId,
      ...data,
      timestamp: Date.now(),
    };
    store.put(payload);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Editor draft save failed:', e);
  }
}

/**
 * Load code editor draft.
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function loadEditorDraft(moduleId) {
  if (!moduleId) return null;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EDITOR, 'readonly');
    const store = tx.objectStore(STORE_EDITOR);
    return new Promise((resolve, reject) => {
      const req = store.get(moduleId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Editor draft load failed:', e);
    return null;
  }
}

export async function clearEditorDraft(moduleId) {
  if (!moduleId) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EDITOR, 'readwrite');
    tx.objectStore(STORE_EDITOR).delete(moduleId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Editor draft clear failed:', e);
  }
}
