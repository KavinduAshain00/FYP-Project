import { AnimatePresence, motion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import MarkdownContent from "../../components/ui/MarkdownContent";
import { getSlideImage } from "./functions/lectureSlideImages";

export default function LectureOverviewPopup({
  open,
  onClose,
  module,
  lectureNotes,
  lectureNotesLoading,
  lectureNotesError,
  lectureSlides,
  hasSlides,
  lectureSlideIndex,
  setLectureSlideIndex,
}) {
  if (!module) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm z-[100]"
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[94vw] max-w-[1080px] h-[88vh] rounded-3xl flex flex-col bg-neutral-900 shadow-2xl shadow-black pointer-events-auto overflow-hidden"
            >
              <div className="shrink-0 px-5 sm:px-6 py-4 bg-neutral-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                      Learning Overview
                    </p>
                    <h2 className="mt-1 text-lg sm:text-xl font-bold text-blue-50 truncate">
                      {module.title}
                    </h2>
                    <p className="mt-1 text-xs text-blue-300">
                      {hasSlides
                        ? `Slide ${lectureSlideIndex + 1} of ${lectureSlides.length}`
                        : "Quick intro before you start coding"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-blue-300 hover:text-blue-50 hover:bg-blue-800 transition-colors"
                    aria-label="Close"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              </div>

              {lectureNotesLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 bg-neutral-900">
                  <div className="h-12 w-12 rounded-full border-2 border-blue-200/40 border-t-blue-200 animate-spin" />
                  <p className="text-base font-semibold text-blue-50 mt-6">
                    Generating lecture slides...
                  </p>
                  <p className="text-xs text-blue-300 mt-1">
                    This usually takes a few seconds
                  </p>
                </div>
              ) : lectureNotesError ? (
                <div className="flex-1 flex flex-col p-5 sm:p-6 bg-neutral-900">
                  <div className="flex items-start gap-2 p-4 rounded-2xl bg-neutral-900 mb-4">
                    <FaExclamationTriangle className="text-blue-200 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-50">{lectureNotesError}</p>
                  </div>
                  <p className="text-xs text-blue-300 mb-3">
                    Showing original overview instead:
                  </p>
                  <div className="text-blue-100 leading-relaxed overflow-y-auto flex-1 [&_.markdown-content]:[&_h2]:text-lg">
                    <MarkdownContent content={module.content} />
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full py-3 rounded-2xl bg-blue-600 text-black font-semibold shadow-md shadow-black/30 hover:bg-blue-500 transition-all"
                  >
                    Continue to editor
                  </button>
                </div>
              ) : hasSlides ? (
                <>
                  <div className="relative h-[30%] min-h-[140px] shrink-0">
                    <img
                      src={getSlideImage(
                        lectureSlides[lectureSlideIndex],
                        module.title,
                        module.category,
                      )}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-neutral-900/55 pointer-events-none"
                      aria-hidden
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-6 py-4">
                      <h3 className="text-lg sm:text-xl font-bold text-blue-50 drop-shadow-lg">
                        {module.title}
                      </h3>
                      <p className="text-xs text-blue-50 mt-0.5">
                        Focus on one step, then move to the next.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 scrollbar-hide flex flex-col bg-neutral-900">
                    <div className="text-blue-50 [&_.markdown-content_h2]:text-lg [&_.markdown-content_h2]:mb-2 [&_.markdown-content_h3]:text-base [&_.markdown-content_p]:text-[15px] [&_.markdown-content_ul]:space-y-1 [&_.markdown-content_ol]:space-y-1">
                      <MarkdownContent
                        content={
                          lectureSlides[lectureSlideIndex] || lectureSlides[0]
                        }
                        className="[&_ul]:list-disc [&_ol]:list-decimal"
                      />
                    </div>
                    {module.hints?.length > 0 && (
                      <div className="mt-4 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1.5">
                          Hints
                        </p>
                        <ul className="list-disc list-inside text-xs text-blue-200 space-y-0.5">
                          {module.hints.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-3 bg-neutral-900">
                    <button
                      type="button"
                      onClick={() =>
                        setLectureSlideIndex((i) => Math.max(0, i - 1))
                      }
                      disabled={lectureSlideIndex === 0}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-blue-200 hover:text-blue-50 hover:bg-blue-700 disabled:text-blue-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronLeft className="text-xs" /> Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {lectureSlides.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLectureSlideIndex(i)}
                          className={`h-1.5 rounded-full transition-all ${
                            i === lectureSlideIndex
                              ? "w-6 bg-blue-200"
                              : "w-1.5 bg-blue-700 hover:bg-blue-300"
                          }`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setLectureSlideIndex((i) =>
                          Math.min(lectureSlides.length - 1, i + 1),
                        )
                      }
                      disabled={
                        lectureSlideIndex >= lectureSlides.length - 1
                      }
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium text-blue-200 hover:text-blue-50 hover:bg-blue-700 disabled:text-blue-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                    >
                      Next <FaChevronRight className="text-xs" />
                    </button>
                  </div>

                  <div className="shrink-0 px-5 sm:px-6 pb-5 bg-neutral-900">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-2xl bg-blue-600 text-black text-sm font-semibold shadow-md shadow-black/30 hover:bg-blue-500 transition-all"
                    >
                      Start coding
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative h-[28%] min-h-[120px] shrink-0">
                    <img
                      src={getSlideImage(
                        lectureNotes || module.content,
                        module.title,
                        module.category,
                      )}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-neutral-900/55 pointer-events-none"
                      aria-hidden
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-5 sm:px-6 py-4">
                      <h3 className="text-lg sm:text-xl font-bold text-blue-50 drop-shadow-lg">
                        {module.title}
                      </h3>
                      <p className="text-xs text-blue-50 mt-0.5">
                        Learning overview
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 scrollbar-hide bg-neutral-900">
                    <div className="text-blue-50 [&_.markdown-content_h2]:text-lg [&_.markdown-content_p]:text-[15px]">
                      {lectureNotes ? (
                        <MarkdownContent content={lectureNotes} />
                      ) : (
                        <MarkdownContent content={module.content} />
                      )}
                    </div>
                    {module.hints?.length > 0 && (
                      <div className="mt-4 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1.5">
                          Hints
                        </p>
                        <ul className="list-disc list-inside text-xs text-blue-200 space-y-0.5">
                          {module.hints.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 px-5 sm:px-6 pb-5 bg-neutral-900">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 rounded-2xl bg-blue-600 text-black text-sm font-semibold shadow-md shadow-black/30 hover:bg-blue-500 transition-all"
                    >
                      Start coding
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
