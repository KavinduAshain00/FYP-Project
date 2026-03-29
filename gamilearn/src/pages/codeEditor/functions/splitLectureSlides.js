/**
 * Split overview / lecture markdown into 2–4 slides by ## sections, paragraphs, or length.
 * @param {string} raw
 * @returns {string[]}
 */
export function splitLectureSlides(raw) {
  if (!raw.trim()) return [];
  let parts = raw.split(/(?=^##\s+.+$)/gm).filter((p) => p.trim());
  const minSlides = 2;
  const maxSlides = 4;
  if (parts.length < minSlides) {
    parts = raw.split(/\n{2,}/).filter((p) => p.trim());
  }
  if (parts.length <= maxSlides && parts.length >= minSlides) {
    return parts.map((p) => p.trim()).filter(Boolean);
  }
  if (parts.length > maxSlides) {
    const slides = [];
    const chunkSize = Math.ceil(parts.length / maxSlides);
    for (let i = 0; i < maxSlides; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, parts.length);
      const merged = parts.slice(start, end).join("\n\n").trim();
      if (merged) slides.push(merged);
    }
    return slides;
  }
  if (parts.length === 1) {
    const len = parts[0].length;
    const targetSlides = 3;
    const chunkLen = Math.ceil(len / targetSlides);
    const slides = [];
    let pos = 0;
    while (pos < len && slides.length < maxSlides) {
      let end = Math.min(pos + chunkLen, len);
      if (end < len) {
        const nextNewline = parts[0].indexOf("\n\n", end);
        end = nextNewline > end ? nextNewline + 2 : end;
      }
      slides.push(parts[0].slice(pos, end).trim());
      pos = end;
    }
    return slides.filter(Boolean);
  }
  return [raw.trim()];
}
