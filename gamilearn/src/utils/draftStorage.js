/**
 * Client persistence: IndexedDB code-editor drafts, localStorage mirrors, lecture notes cache.
 */

const DB_NAME = "GamiLearnDrafts";
const DB_VERSION = 2;
const STORE_EDITOR = "code-editor";

let dbPromise = null;

function editorDraftKey(userId, moduleId) {
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

// ─── IndexedDB: editor drafts ────────────────────────────────────────────────

/** Save module steps + file contents for the code editor (per user/module). */
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

/** Load a saved draft or null. */
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

/** Latest module id this user has a draft for (by timestamp). */
export async function getLastWorkedEditorModuleId(userId) {
  const uid =
    userId != null && String(userId).trim() ? String(userId).trim() : "";
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

// ─── localStorage: editor draft mirror ───────────────────────────────────────

const EDITOR_LOCAL_MIRROR_KEY = "gamilearn_editor_drafts_local";

function editorLocalEntryKey(userId, moduleId) {
  const u =
    userId != null && String(userId).trim()
      ? String(userId).trim()
      : "guest";
  const m =
    moduleId != null && String(moduleId).trim()
      ? String(moduleId).trim()
      : "";
  return `${u}::${m}`;
}

export function loadLocalEditorDraft(userId, moduleId) {
  if (!moduleId) return null;
  try {
    const raw = localStorage.getItem(EDITOR_LOCAL_MIRROR_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[editorLocalEntryKey(userId, moduleId)] ?? null;
  } catch {
    return null;
  }
}

function saveLocalEditorDraft(userId, moduleId, data) {
  if (!moduleId) return;
  try {
    const raw = localStorage.getItem(EDITOR_LOCAL_MIRROR_KEY) || "{}";
    const map = JSON.parse(raw);
    map[editorLocalEntryKey(userId, moduleId)] = {
      ...data,
      moduleId: String(moduleId).trim(),
      timestamp: Date.now(),
    };
    localStorage.setItem(EDITOR_LOCAL_MIRROR_KEY, JSON.stringify(map));
  } catch {
    /* quota or private mode */
  }
}

function clearLocalEditorDraft(userId, moduleId) {
  if (!moduleId) return;
  try {
    const raw = localStorage.getItem(EDITOR_LOCAL_MIRROR_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[editorLocalEntryKey(userId, moduleId)];
    localStorage.setItem(EDITOR_LOCAL_MIRROR_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Prefer the copy with the latest timestamp (falls back to IndexedDB if only one exists). */
export function pickNewerEditorDraft(idbDraft, localDraft) {
  if (!idbDraft && !localDraft) return null;
  if (!idbDraft) return localDraft;
  if (!localDraft) return idbDraft;
  const ta = Number(idbDraft.timestamp) || 0;
  const tb = Number(localDraft.timestamp) || 0;
  return tb > ta ? localDraft : idbDraft;
}

export async function saveEditorDraftWithLocalMirror(userId, moduleId, data) {
  await saveEditorDraft(userId, moduleId, data);
  saveLocalEditorDraft(userId, moduleId, data);
}

export async function clearEditorDraftEverywhere(userId, moduleId) {
  await clearEditorDraft(userId, moduleId);
  clearLocalEditorDraft(userId, moduleId);
}

// ─── localStorage: lecture notes cache ───────────────────────────────────────

export const LECTURE_NOTES_STORAGE_KEY = "gamilearn_lecture_notes";

export function loadCachedLectureNotes(moduleId) {
  if (!moduleId) return null;
  try {
    const raw = localStorage.getItem(LECTURE_NOTES_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.[moduleId] ?? null;
  } catch {
    return null;
  }
}

export function saveCachedLectureNotes(moduleId, notes) {
  if (!moduleId || !notes) return;
  try {
    const raw = localStorage.getItem(LECTURE_NOTES_STORAGE_KEY) || "{}";
    const data = JSON.parse(raw);
    data[moduleId] = notes;
    localStorage.setItem(LECTURE_NOTES_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
