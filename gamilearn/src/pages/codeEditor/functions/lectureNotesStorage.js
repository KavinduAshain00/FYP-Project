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
