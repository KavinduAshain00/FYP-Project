const {
  FALLBACK_HINTS,
  DEFAULT_FALLBACK_HINTS,
} = require("../constants/tutor");

/**
 * Assess confidence level based on question clarity and context
 */
function assessQuestionConfidence(message, context) {
  let confidence = 0.5;

  if (context?.code) {
    const codeLen =
      typeof context.code === "string" ? context.code.length : 100;
    if (codeLen > 20) confidence += 0.2;
  }
  if (context?.errorMessage) confidence += 0.15;
  if (
    context?.recentErrors &&
    Array.isArray(context.recentErrors) &&
    context.recentErrors.length > 0
  )
    confidence += 0.15;
  if (context?.currentFile) confidence += 0.1;

  const vaguePatterns = [
    /^why$/i,
    /doesn't work/i,
    /not working/i,
    /help me/i,
    /^how$/i,
  ];
  if (vaguePatterns.some((p) => p.test(message))) confidence -= 0.2;

  const specificPatterns = [
    /line \d+/i,
    /error:/i,
    /function \w+/i,
    /variable \w+/i,
  ];
  if (specificPatterns.some((p) => p.test(message))) confidence += 0.15;

  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Get fallback hints based on keywords in the message
 */
function getFallbackHints(message) {
  const lowerMessage = message.toLowerCase();
  const hints = [];

  for (const [keyword, keywordHints] of Object.entries(FALLBACK_HINTS)) {
    if (lowerMessage.includes(keyword)) {
      hints.push(...keywordHints);
    }
  }

  return hints.length > 0 ? hints : DEFAULT_FALLBACK_HINTS;
}

const PEDAGOGICAL_BASE_INSTRUCTION = `You are a PEDAGOGICAL coding tutor and COMPANION for beginner game developers. Your role is to TUTOR (teach and explain) as well as give hints. Your PRIMARY GOAL is to help students LEARN, not just solve problems.

You are aware of the MODULE the student is in and the CURRENT STEP they are working on. Use the module instructions and current step to tailor your tutoring: explain concepts, guide them toward the step objective, and answer questions in that context.

CRITICAL RULES:
1. NEVER provide the complete solution or final answer directly
2. Guide students with step-by-step hints and questions
3. Explain WHY something is wrong, not just WHAT to fix
4. Encourage debugging and problem-solving skills
5. Use analogies and simple examples when explaining concepts
6. Limit code snippets to small, illustrative examples (max 3-5 lines)
7. Ask guiding questions to help the student think
8. Celebrate small wins and encourage experimentation

DO NOT:
- Give complete working code solutions
- Fix the code for them directly
- Provide copy-paste answers
- Overwhelm with too much information at once

INSTEAD:
- Point to the area where the issue might be
- Explain the underlying concept
- Suggest what to look for or try
- Break down the problem into manageable steps`;

const TONE_INSTRUCTIONS = {
  friendly:
    'Use a warm, encouraging tone. Use casual language and occasional light encouragement (e.g. "You\'re on the right track!").',
  formal:
    "Use a clear, professional tone. Be precise and avoid casual language. Stay instructive and neutral.",
  concise:
    "Be brief and to the point. Use short sentences. Avoid filler; give only essential guidance.",
};

const DETAIL_INSTRUCTIONS = {
  minimal:
    "Give very short hints (1-2 sentences). Point to the area only; avoid long explanations.",
  moderate:
    "Give focused hints with one short explanation. Balance brevity with one key concept.",
  detailed:
    "You may explain a bit more: why something works, one small example, and a follow-up suggestion.",
};

const FREQUENCY_INSTRUCTIONS = {
  low: 'Give only the direct answer to what was asked. Do not suggest follow-up steps or "you might also..." unless the student asks.',
  normal:
    "Answer the question and optionally suggest one natural next step if relevant.",
  high: "After answering, briefly suggest 1-2 follow-up things to try or check, and offer to help with the next step.",
};

const HINT_STYLE_SECTIONS = {
  "error-explanation": `\nHINT STYLE: Error Explanation (DIRECTIVE)
- Explain what the error message means in simple terms and what to fix
- Explain WHY this type of error occurs (underlying cause)
- Point to common mistakes (typo, wrong type, missing bracket, etc.)
- Suggest what part of the code to examine; do NOT write the full fix
- Keep the response focused and under the word limit`,
  "logic-guidance": `\nHINT STYLE: Logic Guidance
- Help the student trace through their code logic step-by-step
- Ask "What do you expect to happen at this point?"
- Suggest using console.log() to track values
- Guide them to identify where actual behavior differs from expected
- Focus on the flow of data and control`,
  "concept-reminder": `\nHINT STYLE: Concept Reminder
- Explain the relevant programming concept clearly
- Use a simple analogy or real-world comparison
- Provide a tiny illustrative example (different from their code)
- Connect the concept back to their specific situation
- Keep it focused on ONE concept at a time`,
  "visual-gameloop": `\nHINT STYLE: Visual/Game Loop Explanation
- Explain how game loops and animations work
- Describe the frame-by-frame update cycle
- Use visual metaphors ("like a flipbook")
- Explain requestAnimationFrame or setInterval timing
- Guide them to think about state changes over time`,
  default: `\nHINT STYLE: General Guidance
- Start by acknowledging their question
- Identify the most likely area of confusion
- Provide ONE clear hint or direction to try
- End with an encouraging next step or question`,
};

const WORD_LIMITS_BY_DETAIL = { minimal: 80, moderate: 200, detailed: 280 };

function appendPedagogicalPreferenceLines(parts, tone, hintDetail, assistanceFrequency) {
  parts.push(PEDAGOGICAL_BASE_INSTRUCTION);
  parts.push(
    `\nTONE (user preference): ${TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.friendly}`,
  );
  parts.push(
    `\nHINT DETAIL (user preference): ${DETAIL_INSTRUCTIONS[hintDetail] || DETAIL_INSTRUCTIONS.moderate}`,
  );
  parts.push(
    `\nASSISTANCE FREQUENCY (user preference): ${FREQUENCY_INSTRUCTIONS[assistanceFrequency] || FREQUENCY_INSTRUCTIONS.normal}`,
  );
}

function appendHintStyleSection(parts, hintStyle) {
  parts.push(HINT_STYLE_SECTIONS[hintStyle] || HINT_STYLE_SECTIONS.default);
}

function appendConfidenceNotes(parts, confidence) {
  if (confidence < 0.4) {
    parts.push(
      `\nNOTE: The question is vague. Start by asking clarifying questions or provide general conceptual guidance related to the topic.`,
    );
  } else if (confidence < 0.6) {
    parts.push(
      `\nNOTE: Moderate context available. Provide focused hints but verify assumptions with the student.`,
    );
  }
}

function appendCodeAndErrorContext(parts, context) {
  if (context?.codeIsEmpty) {
    parts.push(`\nIMPORTANT: The student has NOT written any code yet (or the code is empty). Do NOT assume they have code.
- Tell them clearly that there is no code written yet.
- Give clear, step-by-step instructions on what to do to complete the current step correctly.
- Explain what they need to add and where, so they can get started properly.`);
  }
  if (context?.codeSummary) {
    parts.push(
      `\nSTUDENT'S CODE (summary for context only - do not invent code):\n${context.codeSummary}`,
    );
  }
  const hasErrorContext =
    context?.errorMessage ||
    (context?.recentErrors && context.recentErrors.length > 0);
  if (!hasErrorContext) return;
  parts.push(
    `\nPRIORITY: The student has an error. Explain this error in simple terms and what to check or fix. Do NOT give the full solution; guide them.`,
  );
  if (context.errorMessage) {
    parts.push(`\nERROR MESSAGE (primary): ${context.errorMessage}`);
  }
  if (context.recentErrors && context.recentErrors.length > 0) {
    const errList = context.recentErrors
      .slice(0, 5)
      .map((e) => `- ${e}`)
      .join("\n");
    parts.push(`\nRECENT CONSOLE ERRORS:\n${errList}`);
  }
}

function appendModuleContext(parts, context) {
  if (context?.moduleTitle) {
    parts.push(`\nMODULE: ${context.moduleTitle}`);
  }
  if (context?.moduleStepTitles && Array.isArray(context.moduleStepTitles)) {
    const titles = context.moduleStepTitles
      .map((t) => String(t ?? "").trim())
      .filter(Boolean);
    if (titles.length) {
      parts.push(`\nMODULE STEPS (titles): ${titles.join(", ")}`);
    }
  }
  const hasCurrentStep =
    (context?.currentStepDescription !== undefined &&
      context?.currentStepDescription !== "") ||
    (context?.currentStepIndex !== undefined &&
      context?.currentStepIndex !== null);
  if (!hasCurrentStep) return;
  const stepIdx =
    typeof context.currentStepIndex === "number"
      ? context.currentStepIndex
      : "?";
  const stepDesc = context.currentStepDescription || "current step";
  parts.push(
    `\nCURRENT STEP THE STUDENT IS ON (index ${stepIdx}): "${stepDesc}". Use this to tutor them toward this step.`,
  );
}

function appendQuestionAndWordLimit(parts, message, hintDetail) {
  parts.push(`\nSTUDENT'S QUESTION: ${message}`);
  const wordLimit = WORD_LIMITS_BY_DETAIL[hintDetail] ?? 200;
  parts.push(
    `\nProvide a helpful, pedagogical response (max ${wordLimit} words). Remember: GUIDE, don't solve!`,
  );
}

/**
 * Build pedagogical prompt for hint-mode tutor
 * @param {string} message - Student question
 * @param {object} context - Code summary, module, etc.
 * @param {string} hintStyle - hint type (general, error-explanation, etc.)
 * @param {number} confidence - assessed confidence
 * @param {object} [aiPreferences] - user's tone, hintDetail, assistanceFrequency
 */
function buildPedagogicalPrompt(
  message,
  context,
  hintStyle,
  confidence,
  aiPreferences = {},
) {
  const parts = [];
  const tone = aiPreferences.tone || "friendly";
  const hintDetail = aiPreferences.hintDetail || "moderate";
  const assistanceFrequency = aiPreferences.assistanceFrequency || "normal";

  appendPedagogicalPreferenceLines(parts, tone, hintDetail, assistanceFrequency);
  appendHintStyleSection(parts, hintStyle);
  appendConfidenceNotes(parts, confidence);
  appendCodeAndErrorContext(parts, context);
  appendModuleContext(parts, context);
  appendQuestionAndWordLimit(parts, message, hintDetail);

  return parts.join("\n");
}

module.exports = {
  assessQuestionConfidence,
  getFallbackHints,
  buildPedagogicalPrompt,
};
