import { motion } from "framer-motion";
import { FaUser, FaSyncAlt } from "react-icons/fa";

const PREVIEW_TABS = [
  {
    key: "server",
    label: "Server",
    activeClass: "text-black bg-blue-600",
  },
  {
    key: "player1",
    label: "Client 1",
    activeClass: "text-black bg-blue-300",
    icon: FaUser,
  },
  {
    key: "player2",
    label: "Client 2",
    activeClass: "text-black bg-blue-200",
    icon: FaUser,
  },
];

export default function CodeEditorMultiplayerPreviewPanel({
  activePreviewTab,
  onPreviewTabChange,
  serverPreviewKey,
  player1PreviewKey,
  player2PreviewKey,
  multiplayerSnapshot,
  getPreviewContent,
  previewAutoRefresh,
  onPreviewAutoRefreshChange,
  onManualPreviewRefresh,
}) {
  return (
    <>
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-900">
        <motion.div
          className="flex"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {PREVIEW_TABS.map(({ key, label, activeClass, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onPreviewTabChange(key)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-semibold transition rounded-t-md ${
                activePreviewTab === key
                  ? activeClass
                  : "text-blue-500 hover:text-blue-200 hover:bg-neutral-800"
              }`}
            >
              {Icon && <Icon className="text-[8px]" aria-hidden />} {label}
            </button>
          ))}
        </motion.div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-neutral-800/70">
          <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide flex items-center gap-1.5">
            <FaSyncAlt className="text-[9px] text-emerald-400/80" aria-hidden />
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
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-neutral-900 overflow-hidden min-h-0 relative">
        <iframe
          key={`server-${serverPreviewKey}`}
          srcDoc={
            multiplayerSnapshot?.server ?? getPreviewContent("server")
          }
          className={
            activePreviewTab === "server"
              ? "w-full flex-1 min-h-0 border-0"
              : "absolute w-px h-px opacity-0 pointer-events-none overflow-hidden"
          }
          sandbox="allow-scripts allow-same-origin"
          title="Server"
        />
        <div
          className={
            activePreviewTab === "player1"
              ? "flex flex-col flex-1 min-h-0"
              : "absolute w-px h-px opacity-0 pointer-events-none overflow-hidden"
          }
        >
          <div className="px-2 py-1 bg-blue-700 text-blue-100 text-[10px] font-bold text-center shrink-0">
            Client 1
          </div>
          <iframe
            key={`p1-${player1PreviewKey}`}
            srcDoc={
              multiplayerSnapshot?.player1 ?? getPreviewContent("player1")
            }
            className="flex-1 w-full min-h-0 border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Client 1"
          />
        </div>
        <div
          className={
            activePreviewTab === "player2"
              ? "flex flex-col flex-1 min-h-0"
              : "absolute w-px h-px opacity-0 pointer-events-none overflow-hidden"
          }
        >
          <div className="px-2 py-1 bg-blue-600 text-black text-[10px] font-bold text-center shrink-0">
            Client 2
          </div>
          <iframe
            key={`p2-${player2PreviewKey}`}
            srcDoc={
              multiplayerSnapshot?.player2 ?? getPreviewContent("player2")
            }
            className="flex-1 w-full min-h-0 border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Client 2"
          />
        </div>
      </div>
    </>
  );
}
