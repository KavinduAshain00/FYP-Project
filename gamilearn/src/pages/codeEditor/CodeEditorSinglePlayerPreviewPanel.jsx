import { motion } from "framer-motion";
import { FaExternalLinkAlt, FaSyncAlt } from "react-icons/fa";

export default function CodeEditorSinglePlayerPreviewPanel({
  previewKey,
  getPreviewContent,
  onOpenInNewTab,
  previewAutoRefresh,
  onPreviewAutoRefreshChange,
  onManualPreviewRefresh,
}) {
  return (
    <>
      <motion.div
        className="flex flex-wrap items-center justify-between gap-2 bg-neutral-900 border-b border-neutral-800 px-3 py-2.5 sm:px-4 shrink-0"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
          <FaSyncAlt className="text-[9px] text-emerald-400/90" aria-hidden />{" "}
          Live preview
        </span>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div
            className="flex items-center rounded-lg border border-neutral-700/90 p-0.5 bg-neutral-950/60"
            role="group"
            aria-label="Preview refresh mode"
          >
            <button
              type="button"
              onClick={() => onPreviewAutoRefreshChange(true)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                previewAutoRefresh
                  ? "bg-blue-600 text-black shadow-sm"
                  : "text-blue-400 hover:text-blue-200"
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => onPreviewAutoRefreshChange(false)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                !previewAutoRefresh
                  ? "bg-amber-900/90 text-amber-100"
                  : "text-blue-400 hover:text-blue-200"
              }`}
            >
              Stop
            </button>
          </div>
          {!previewAutoRefresh && (
            <button
              type="button"
              onClick={onManualPreviewRefresh}
              className="px-2.5 py-1 rounded-lg bg-blue-800 text-blue-100 text-[10px] font-bold hover:bg-blue-700 transition-colors"
            >
              Run
            </button>
          )}
          <button
            type="button"
            onClick={onOpenInNewTab}
            className="text-blue-400 hover:text-blue-100 text-[10px] transition p-1"
            title="Open in new tab"
          >
            <FaExternalLinkAlt aria-hidden />
          </button>
        </div>
      </motion.div>
      <iframe
        key={previewKey}
        className="flex-1 border-0 bg-neutral-900 w-full min-h-0"
        title="preview"
        srcDoc={getPreviewContent()}
        sandbox="allow-scripts allow-same-origin"
      />
    </>
  );
}
