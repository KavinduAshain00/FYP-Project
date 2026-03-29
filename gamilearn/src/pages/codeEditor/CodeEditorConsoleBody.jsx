export default function CodeEditorConsoleBody({
  isMultiplayerModule,
  serverLogs,
  clientLogs,
  consoleLogs,
  clearServerConsole,
  clearClientConsole,
}) {
  if (isMultiplayerModule) {
    return (
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center justify-between px-2 py-1 bg-blue-700 shrink-0">
            <span className="text-[10px] font-bold text-blue-400">Server</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearServerConsole();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  clearServerConsole();
                }
              }}
              className="text-[10px] text-blue-400 hover:text-blue-200 cursor-pointer"
            >
              Clear
            </span>
          </div>
          <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 py-1 font-mono text-[11px] space-y-0.5">
            {serverLogs.length === 0 ? (
              <p className="text-blue-500 italic text-[10px] px-1">
                No server output yet.
              </p>
            ) : (
              serverLogs.map((entry, i) => (
                <div
                  key={`s-${entry.timestamp}-${i}`}
                  className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                    entry.level === "error"
                      ? "text-blue-100 bg-blue-700"
                      : entry.level === "warn"
                        ? "text-black bg-blue-600"
                        : entry.level === "info"
                          ? "text-black bg-blue-400"
                          : "text-blue-300 bg-white/[0.03]"
                  }`}
                >
                  <span className="shrink-0 opacity-50 text-[10px]">
                    [{entry.level}]
                  </span>
                  <span className="break-all flex-1">{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-2 py-1 bg-blue-800 shrink-0">
            <span className="text-[10px] font-bold text-blue-200">
              Clients
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearClientConsole();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  clearClientConsole();
                }
              }}
              className="text-[10px] text-blue-400 hover:text-blue-200 cursor-pointer"
            >
              Clear
            </span>
          </div>
          <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 py-1 font-mono text-[11px] space-y-0.5">
            {clientLogs.length === 0 ? (
              <p className="text-blue-500 italic text-[10px] px-1">
                No client output yet.
              </p>
            ) : (
              clientLogs.map((entry, i) => (
                <div
                  key={`c-${entry.timestamp}-${i}`}
                  className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
                    entry.level === "error"
                      ? "text-blue-100 bg-blue-700"
                      : entry.level === "warn"
                        ? "text-black bg-blue-600"
                        : entry.level === "info"
                          ? "text-black bg-blue-400"
                          : "text-blue-300 bg-white/[0.03]"
                  }`}
                >
                  <span className="shrink-0 opacity-50 text-[10px]">
                    [{entry.level}]
                  </span>
                  <span className="break-all flex-1">{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0 px-2 pb-2 font-mono text-[11px] space-y-0.5">
      {consoleLogs.length === 0 ? (
        <p className="text-blue-500 italic text-[10px] px-1">
          No console output yet.
        </p>
      ) : (
        consoleLogs.map((entry, i) => (
          <div
            key={`${entry.timestamp}-${i}`}
            className={`flex gap-1.5 py-0.5 px-1.5 rounded ${
              entry.level === "error"
                ? "text-blue-100 bg-blue-700"
                : entry.level === "warn"
                  ? "text-black bg-blue-600"
                  : entry.level === "info"
                    ? "text-black bg-blue-400"
                    : "text-blue-300 bg-white/[0.03]"
            }`}
          >
            <span className="shrink-0 opacity-50 text-[10px]">
              [{entry.level}]
            </span>
            <span className="break-all flex-1">{entry.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
