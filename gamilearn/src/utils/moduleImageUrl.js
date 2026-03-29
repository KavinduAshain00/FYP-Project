/**
 * Placeholder art for module cards / completion UI — same seed as Modules catalog so images match per module.
 */
export function getModuleImageUrl(module, width = 400, height = 250) {
  const seed = (module?._id || module?.title || "")
    .toString()
    .replace(/\s/g, "");
  return `https://picsum.photos/seed/${seed || "module"}/${width}/${height}`;
}
