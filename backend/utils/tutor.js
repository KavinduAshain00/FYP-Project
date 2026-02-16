const {
  FALLBACK_HINTS,
  DEFAULT_FALLBACK_HINTS,
} = require("../constants/tutor");

/**
 * Normalize code from request (frontend may send "javascript" or "js").
 */
function getCodeForVerify(code) {
  if (!code || typeof code !== "object") return null;
  return {
    html: code.html || "",
    css: code.css || "",
    js: (code.javascript !== undefined ? code.javascript : code.js) || "",
    jsx: code.jsx || "",
  };
}

/**
 * True if code is effectively empty (whitespace/comments only).
 */
function isCodeEmptyForStep(normalized) {
  const full = [normalized.html, normalized.css, normalized.js, normalized.jsx].join("\n");
  const noWhitespace = full.replace(/\s+/g, " ").trim();
  if (noWhitespace.length < 25) return true;
  const withoutComments = noWhitespace
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/#[^\n]*/g, "")
    .trim();
  return withoutComments.length < 20;
}

/**
 * Confidence that we have enough context to give a good hint (0–1).
 */
function assessQuestionConfidence(message, context) {
  let confidence = 0.5;
  if (context?.code) {
    const codeLen = typeof context.code === "string" ? context.code.length : 100;
    if (codeLen > 20) confidence += 0.2;
  }
  if (context?.errorMessage) confidence += 0.15;
  if (context?.currentFile) confidence += 0.1;
  if (/^why$/i.test(message) || /doesn't work|not working|help me|^how$/i.test(message)) confidence -= 0.2;
  if (/line \d+|error:|function \w+|variable \w+/i.test(message)) confidence += 0.15;
  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Fallback hints when the question is too vague (keyword-based).
 */
function getFallbackHints(message) {
  const lower = message.toLowerCase();
  const hints = [];
  for (const [keyword, keywordHints] of Object.entries(FALLBACK_HINTS)) {
    if (lower.includes(keyword)) hints.push(...keywordHints);
  }
  return hints.length > 0 ? hints : DEFAULT_FALLBACK_HINTS;
}

/**
 * Build the hint-mode prompt (one clear prompt for the model).
 */
function buildPedagogicalPrompt(message, context, _hintStyle, _confidence, aiPreferences = {}) {
  const hintDetail = aiPreferences.hintDetail || "moderate";
  const wordLimit = hintDetail === "minimal" ? 80 : hintDetail === "detailed" ? 250 : 150;

  const parts = [
    "You are a coding tutor for beginners. Give hints only—do not write the full solution.",
    "Rules: (1) Explain what might be wrong or what to try next. (2) Use the student's step and code to tailor your answer. (3) Keep replies short.",
  ];
  if (context?.codeIsEmpty) {
    parts.push("The student has not written code yet. Tell them what to add first and where.");
  }
  if (context?.codeSummary) parts.push(`Code summary:\n${context.codeSummary}`);
  if (context?.errorMessage) parts.push(`Error: ${context.errorMessage}`);
  if (context?.moduleTitle) parts.push(`Module: ${context.moduleTitle}`);
  if (context?.currentStepDescription) {
    parts.push(`Current step: "${context.currentStepDescription}". Guide them toward this.`);
  }
  parts.push(`Question: ${message}`);
  parts.push(`Reply in under ${wordLimit} words.`);

  return parts.join("\n\n");
}

module.exports = {
  getCodeForVerify,
  isCodeEmptyForStep,
  assessQuestionConfidence,
  getFallbackHints,
  buildPedagogicalPrompt,
};
