/**
 * Build options object for tutorAPI.ask (hint mode).
 */
export function buildTutorAskOptions({
  question,
  codeRefs,
  activeTab,
  module,
  steps,
  currentStepIndex,
  recentErrors,
}) {
  const r = codeRefs.current;
  const errorFromQuestion =
    question.match(/error:?\s*(.+)/i)?.[1]?.trim() || null;
  const moduleStepTitles = Array.isArray(module?.steps)
    ? module.steps.map((s) => s?.title).filter(Boolean)
    : [];
  return {
    type: "hint-mode",
    hintStyle: "general",
    moduleTitle: module?.title,
    moduleDifficulty: module?.difficulty || "beginner",
    moduleStepTitles,
    currentStepIndex,
    currentStepDescription: steps[currentStepIndex]?.title ?? null,
    code: {
      html: r.html,
      css: r.css,
      javascript: r.js,
      serverJs: r.server,
    },
    currentFile: `${activeTab}.${activeTab === "js" ? "js" : activeTab}`,
    recentErrors,
    errorMessage:
      errorFromQuestion ||
      (recentErrors.length > 0 ? recentErrors[0] : null),
  };
}

/** Strip unsafe / broken API text from tutor answers. */
export function sanitizeTutorAnswer(answer) {
  if (
    typeof answer === "string" &&
    (answer.includes('"thinking"') ||
      answer.includes('"eval_count"') ||
      answer.includes('"model":'))
  ) {
    return "Something went wrong on our side. Please try your question again in a moment.";
  }
  return answer;
}
