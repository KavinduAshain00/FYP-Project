/**
 * IndexedDB draft storage: auto-save module steps + code per signed-in user.
 */

const DB_NAME = "GamiLearnDrafts";
const DB_VERSION = 2;
const STORE_EDITOR = "code-editor";

let dbPromise = null;

export function editorDraftKey(userId, moduleId) {
  const u =
    userId != null && String(userId).trim()
      ? String(userId).trim()
      : "anonymous";
  const m =
    moduleId != null && String(moduleId).trim()
      ? String(moduleId).trim()
      : "";
  return `${u}::${m}`;
}

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      const { oldVersion } = e;
      if (oldVersion < 2 && db.objectStoreNames.contains(STORE_EDITOR)) {
        db.deleteObjectStore(STORE_EDITOR);
      }
      if (!db.objectStoreNames.contains(STORE_EDITOR)) {
        db.createObjectStore(STORE_EDITOR, { keyPath: "draftKey" });
      }
    };
  });
  return dbPromise;
}

/**
 * Save code editor draft (module steps, code).
 * @param {string} userId - account id (required for per-user isolation)
 * @param {string} moduleId
 * @param {object} data - { stepsVerified, currentStepIndex, code: { html, css, javascript, serverJs } }
 */
export async function saveEditorDraft(userId, moduleId, data) {
  if (!moduleId) return;
  const draftKey = editorDraftKey(userId, moduleId);
  try {
    const db = await openDB();
    const payload = {
      draftKey,
      moduleId: String(moduleId).trim(),
      userId: userId != null ? String(userId).trim() : "",
      ...data,
      timestamp: Date.now(),
    };
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EDITOR, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("aborted"));
      tx.objectStore(STORE_EDITOR).put(payload);
    });
  } catch (e) {
    console.warn("Editor draft save failed:", e);
  }
}

/**
 * Load code editor draft.
 * @param {string} userId
 * @param {string} moduleId
 * @returns {Promise<object|null>}
 */
export async function loadEditorDraft(userId, moduleId) {
  if (!moduleId) return null;
  const draftKey = editorDraftKey(userId, moduleId);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EDITOR, "readonly");
    const store = tx.objectStore(STORE_EDITOR);
    return new Promise((resolve, reject) => {
      const req = store.get(draftKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Editor draft load failed:", e);
    return null;
  }
}

export async function clearEditorDraft(userId, moduleId) {
  if (!moduleId) return;
  const draftKey = editorDraftKey(userId, moduleId);
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EDITOR, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("aborted"));
      tx.objectStore(STORE_EDITOR).delete(draftKey);
    });
  } catch (e) {
    console.warn("Editor draft clear failed:", e);
  }
}

/**
 * Most recently saved module id for this user (from editor drafts).
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function getLastWorkedEditorModuleId(userId) {
  const uid = userId != null && String(userId).trim() ? String(userId).trim() : "";
  if (!uid) return null;
  const prefix = `${uid}::`;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EDITOR, "readonly");
    const store = tx.objectStore(STORE_EDITOR);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? req.result : [];
        const mine = rows.filter(
          (row) => row && row.draftKey && String(row.draftKey).startsWith(prefix),
        );
        if (!mine.length) return resolve(null);
        const latest = mine.reduce((acc, row) => {
          if (!acc) return row;
          return (row.timestamp || 0) > (acc.timestamp || 0) ? row : acc;
        }, null);
        resolve(latest?.moduleId || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Last worked module lookup failed:", e);
    return null;
  }
}
