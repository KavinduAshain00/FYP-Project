import { AnimatePresence, motion } from "framer-motion";
import {
  FaChevronRight,
  FaExclamationTriangle,
  FaMagic,
  FaTimes,
} from "react-icons/fa";
import MarkdownContent from "../../components/ui/MarkdownContent";

export default function CodeEditorTutorSidebar({
  open,
  onClose,
  recentErrors,
  companionMessages,
  tutorQuestion,
  onTutorQuestionChange,
  tutorLoading,
  explainCodeLoading,
  explainErrorLoading,
  onExplainError,
  onExplainLastError,
  lastError,
  onExplainSelection,
  onSubmitQuestion,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-28 sm:top-32 right-0 bottom-0 w-80 max-w-[90vw] z-50 flex flex-col bg-neutral-900 shadow-[-8px_0_32px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0 bg-neutral-900">
            <h2 className="text-xs font-bold text-blue-50 flex items-center gap-2">
              <FaMagic className="text-blue-400" /> AI Companion
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md flex items-center justify-center text-blue-300 hover:text-blue-50 hover:bg-neutral-800 transition"
            >
              <FaTimes className="text-[10px]" />
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {recentErrors.length > 0 && (
              <div className="mx-3 mt-2 p-2.5 rounded-xl bg-blue-800 shrink-0 shadow-lg shadow-black">
                <p className="text-[9px] uppercase tracking-wider text-blue-200 font-bold mb-1.5 flex items-center gap-1.5">
                  <FaExclamationTriangle className="text-blue-300" /> Errors
                </p>
                <ul className="space-y-1.5">
                  {recentErrors.slice(-3).map((msg, i) => (
                    <li
                      key={`err-${i}`}
                      className="flex items-start gap-1.5 rounded-lg bg-blue-700 px-2 py-1.5"
                    >
                      <span className="text-[10px] text-blue-100 break-words flex-1 min-w-0 line-clamp-2 font-medium">
                        {msg}
                      </span>
                      <button
                        type="button"
                        onClick={() => onExplainError(msg)}
                        disabled={explainErrorLoading}
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-black hover:bg-blue-500 disabled:bg-blue-700 disabled:text-blue-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Explain
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
              {companionMessages.length === 0 &&
                !explainCodeLoading &&
                !tutorLoading &&
                !explainErrorLoading && (
                  <p className="text-[11px] text-blue-400 italic leading-relaxed">
                    Ask a question, select code and click &quot;Explain&quot;, or
                    paste an error message.
                  </p>
                )}
              {companionMessages.map((msg) => {
                const isErrorExplanation =
                  msg.type === "explain" &&
                  msg.userLabel === "Error explanation";
                const isCodeExplanation =
                  msg.type === "explain" && !isErrorExplanation;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl overflow-hidden ${
                      isErrorExplanation
                        ? "bg-neutral-900 shadow-lg shadow-black"
                        : isCodeExplanation
                          ? "bg-neutral-900 shadow-lg shadow-black"
                          : "bg-neutral-900 shadow-md shadow-black"
                    }`}
                  >
                    <div
                      className={`px-3 py-1.5 flex items-center justify-between gap-2 ${
                        isErrorExplanation
                          ? "text-blue-100 bg-blue-900"
                          : isCodeExplanation
                            ? "text-blue-200 bg-blue-800"
                            : "text-blue-400 bg-white/[0.03]"
                      } text-[10px] font-semibold`}
                    >
                      <span className="flex items-center gap-1.5">
                        {isErrorExplanation && (
                          <FaExclamationTriangle className="text-blue-300 shrink-0" />
                        )}
                        {isCodeExplanation && (
                          <FaMagic className="text-blue-400 shrink-0" />
                        )}
                        {isErrorExplanation
                          ? "Error explanation"
                          : isCodeExplanation
                            ? "Code explanation"
                            : "You"}
                        {msg.type === "hint" &&
                          msg.userLabel !== "Step help" && (
                            <span
                              className="text-blue-500 truncate max-w-[80px]"
                              title={msg.userLabel}
                            >
                              : {msg.userLabel}
                            </span>
                          )}
                      </span>
                      <span className="shrink-0 opacity-70">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div className="p-3 text-xs leading-relaxed text-blue-100">
                      <MarkdownContent content={msg.content} />
                    </div>
                    {msg.confidence != null && msg.type === "hint" && (
                      <div className="px-3 pb-2">
                        <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] text-blue-400">
                          {msg.confidence >= 0.6
                            ? "Targeted"
                            : msg.confidence >= 0.4
                              ? "General"
                              : "Needs context"}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {(explainCodeLoading ||
                tutorLoading ||
                explainErrorLoading) && (
                <div
                  className="rounded-xl bg-blue-800 p-3 flex items-center gap-2 text-blue-200 shadow-inner shadow-black"
                  role="status"
                >
                  <div
                    className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"
                    aria-hidden
                  />
                  <span className="text-[11px]">
                    {explainCodeLoading
                      ? "Explaining your code…"
                      : tutorLoading
                        ? "Thinking…"
                        : "Explaining this error…"}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 space-y-2 shrink-0 bg-neutral-900 shadow-[0_-6px_24px_rgba(0,0,0,0.3)]">
              <div className="flex gap-1.5">
                {lastError && (
                  <button
                    type="button"
                    onClick={onExplainLastError}
                    disabled={explainErrorLoading}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-blue-800 text-blue-200 text-[10px] font-semibold hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Explain error
                  </button>
                )}
                <button
                  type="button"
                  onClick={onExplainSelection}
                  disabled={explainCodeLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-blue-700 text-black text-[10px] font-semibold hover:bg-blue-600 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  <FaMagic className="text-[8px]" /> Explain code
                </button>
              </div>

              <form
                onSubmit={onSubmitQuestion}
                className="flex gap-1.5"
              >
                <textarea
                  className="flex-1 min-h-[36px] max-h-[80px] rounded-lg bg-neutral-900 p-2 text-[11px] text-blue-50 outline-none focus:ring-2 focus:ring-blue-400 resize-none shadow-inner shadow-black"
                  value={tutorQuestion}
                  onChange={(e) => onTutorQuestionChange(e.target.value)}
                  placeholder="Ask a question about this step…"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={tutorLoading || !tutorQuestion.trim()}
                  className="shrink-0 w-9 h-9 rounded-xl bg-blue-600 text-black flex items-center justify-center shadow-md shadow-black/30 hover:bg-blue-500 disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed transition-all"
                >
                  <FaChevronRight className="text-xs" />
                </button>
              </form>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
