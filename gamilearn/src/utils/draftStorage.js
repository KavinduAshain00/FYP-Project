/**
 * IndexedDB draft storage: auto-save files and module steps before user saves to system storage.
 * Used by Custom Game Studio (files, project) and Code Editor (module steps, code).
 */

const DB_NAME = "GamiLearnDrafts";
const DB_VERSION = 1;
const STORE_GAME = "custom-game";
const STORE_EDITOR = "code-editor";

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_GAME)) {
        db.createObjectStore(STORE_GAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_EDITOR)) {
        db.createObjectStore(STORE_EDITOR, { keyPath: "moduleId" });
      }
    };
  });
  return dbPromise;
}

/**
 * Save custom game studio draft (files, projectName, etc.).
 * @param {string} id - Project id (e.g. projectName or 'default')
 * @param {object} data - { files, projectName, folders, installedPackages, planningBoard }
 */
export async function saveGameDraft(id, data) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_GAME, "readwrite");
    const store = tx.objectStore(STORE_GAME);
    const payload = {
      id: id || "default",
      ...data,
      timestamp: Date.now(),
    };
    store.put(payload);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Draft save failed:", e);
  }
}

/**
 * Load custom game studio draft.
 * @param {string} id - Project id (e.g. projectName or 'default')
 * @returns {Promise<object|null>}
 */
export async function loadGameDraft(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_GAME, "readonly");
    const store = tx.objectStore(STORE_GAME);
    return new Promise((resolve, reject) => {
      const req = store.get(id || "default");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Draft load failed:", e);
    return null;
  }
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
    const tx = db.transaction(STORE_EDITOR, "readwrite");
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
    console.warn("Editor draft save failed:", e);
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
    const tx = db.transaction(STORE_EDITOR, "readonly");
    const store = tx.objectStore(STORE_EDITOR);
    return new Promise((resolve, reject) => {
      const req = store.get(moduleId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn("Editor draft load failed:", e);
    return null;
  }
}

export async function clearGameDraft(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_GAME, "readwrite");
    tx.objectStore(STORE_GAME).delete(id || "default");
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Draft clear failed:", e);
  }
}

export async function clearEditorDraft(moduleId) {
  if (!moduleId) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_EDITOR, "readwrite");
    tx.objectStore(STORE_EDITOR).delete(moduleId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("Editor draft clear failed:", e);
  }
}
