import { useState, useEffect, useMemo, startTransition } from "react";
import { tutorAPI } from "../../../api/api";
import {
  loadCachedLectureNotes,
  saveCachedLectureNotes,
} from "./lectureNotesStorage";
import { splitLectureSlides } from "./splitLectureSlides";

/**
 * Lecture notes state, localStorage cache, AI generation when overview opens, and slide splitting.
 */
export function useLectureOverview({
  moduleId,
  module,
  showOverviewPopup,
  user,
}) {
  const [lectureNotes, setLectureNotes] = useState(null);
  const [lectureNotesLoading, setLectureNotesLoading] = useState(false);
  const [lectureNotesError, setLectureNotesError] = useState(null);
  const [lectureSlideIndex, setLectureSlideIndex] = useState(0);

  const lectureSlides = useMemo(
    () => splitLectureSlides(lectureNotes || module?.content || ""),
    [lectureNotes, module?.content],
  );

  const hasSlides = lectureSlides.length >= 2;

  useEffect(() => {
    if (!moduleId) return;
    startTransition(() => {
      setLectureNotes(null);
      setLectureNotesError(null);
      setLectureSlideIndex(0);
    });
  }, [moduleId]);

  useEffect(() => {
    if (!showOverviewPopup || !module || !moduleId) return;

    const cached = loadCachedLectureNotes(moduleId);
    if (cached && typeof cached === "string" && cached.trim()) {
      startTransition(() => {
        setLectureNotes(cached);
        setLectureNotesLoading(false);
        setLectureNotesError(null);
      });
      return;
    }

    let cancelled = false;
    startTransition(() => {
      setLectureNotesLoading(true);
      setLectureNotesError(null);
    });

    const payload = {
      overview: module.content || "",
      moduleTitle: module.title || "",
      difficulty: module.difficulty || "beginner",
      category: module.category || "",
      steps: module.steps?.length
        ? module.steps.map((s) => ({
            title: s.title,
            instruction: s.instruction || s.title,
            concept: s.concept || "",
          }))
        : undefined,
      userLevel: user?.level
        ? `Level ${user.level}`
        : user?.levelInfo?.rank?.name || "",
    };

    tutorAPI
      .generateLectureNotes(payload)
      .then((res) => {
        const notes = res.data?.lectureNotes;
        if (cancelled) return;
        if (notes && typeof notes === "string" && notes.trim()) {
          const trimmed = notes.trim();
          setLectureNotes(trimmed);
          saveCachedLectureNotes(moduleId, trimmed);
          setLectureNotesError(null);
        } else {
          setLectureNotesError("Could not generate lecture notes");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err.response?.data?.error || err.message || "Generation failed";
        setLectureNotesError(msg);
        setLectureNotes(null);
      })
      .finally(() => {
        if (!cancelled) setLectureNotesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    showOverviewPopup,
    module,
    moduleId,
    user?.level,
    user?.levelInfo?.rank?.name,
  ]);

  return {
    lectureNotes,
    lectureNotesLoading,
    lectureNotesError,
    lectureSlides,
    hasSlides,
    lectureSlideIndex,
    setLectureSlideIndex,
  };
}
