/**
 * Normalize module or document id (object with _id or primitive) to string.
 */
export function toModuleId(id) {
  if (id && typeof id === "object" && id._id != null) return String(id._id);
  return id != null ? String(id) : "";
}
