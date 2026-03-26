const { FALLBACK_HINTS, DEFAULT_FALLBACK_HINTS } = require('../constants/tutor');

/**
 * Assess confidence level based on question clarity and context
 */
function assessQuestionConfidence(message, context) {
  let confidence = 0.5;

  if (context?.code) {
    const codeLen = typeof context.code === 'string' ? context.code.length : 100;
    if (codeLen > 20) confidence += 0.2;
  }
  if (context?.errorMessage) confidence += 0.15;
  if (context?.currentFile) confidence += 0.1;

  const vaguePatterns = [/^why$/i, /doesn't work/i, /not working/i, /help me/i, /^how$/i];
  if (vaguePatterns.some((p) => p.test(message))) confidence -= 0.2;

  const specificPatterns = [/line \d+/i, /error:/i, /function \w+/i, /variable \w+/i];
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

/**
 * Build pedagogical prompt for hint-mode tutor
 * @param {string} message - Student question
 * @param {object} context - Code summary, module, etc.
 * @param {string} hintStyle - hint type (general, error-explanation, etc.)
 * @param {number} confidence - assessed confidence
 * @param {object} [aiPreferences] - user's tone, hintDetail, assistanceFrequency
 */
function buildPedagogicalPrompt(message, context, hintStyle, confidence, aiPreferences = {}) {
  const promptParts = [];

  const tone = aiPreferences.tone || 'friendly';
  const hintDetail = aiPreferences.hintDetail || 'moderate';
  const assistanceFrequency = aiPreferences.assistanceFrequency || 'normal';

  const baseInstruction = `You are a PEDAGOGICAL coding tutor and COMPANION for beginner game developers. Your role is to TUTOR (teach and explain) as well as give hints. Your PRIMARY GOAL is to help students LEARN, not just solve problems.

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

  promptParts.push(baseInstruction);

  // UC8: Apply user's preferred TONE
  const toneInstructions = {
    friendly: 'Use a warm, encouraging tone. Use casual language and occasional light encouragement (e.g. "You\'re on the right track!").',
    formal: 'Use a clear, professional tone. Be precise and avoid casual language. Stay instructive and neutral.',
    concise: 'Be brief and to the point. Use short sentences. Avoid filler; give only essential guidance.',
  };
  promptParts.push(`\nTONE (user preference): ${toneInstructions[tone] || toneInstructions.friendly}`);

  // UC8: Apply user's preferred HINT DETAIL level
  const detailInstructions = {
    minimal: 'Give very short hints (1-2 sentences). Point to the area only; avoid long explanations.',
    moderate: 'Give focused hints with one short explanation. Balance brevity with one key concept.',
    detailed: 'You may explain a bit more: why something works, one small example, and a follow-up suggestion.',
  };
  promptParts.push(`\nHINT DETAIL (user preference): ${detailInstructions[hintDetail] || detailInstructions.moderate}`);

  // UC8: Apply user's ASSISTANCE FREQUENCY (how much extra guidance to offer)
  const frequencyInstructions = {
    low: 'Give only the direct answer to what was asked. Do not suggest follow-up steps or "you might also..." unless the student asks.',
    normal: 'Answer the question and optionally suggest one natural next step if relevant.',
    high: 'After answering, briefly suggest 1-2 follow-up things to try or check, and offer to help with the next step.',
  };
  promptParts.push(`\nASSISTANCE FREQUENCY (user preference): ${frequencyInstructions[assistanceFrequency] || frequencyInstructions.normal}`);

  switch (hintStyle) {
    case 'error-explanation':
      promptParts.push(`\nHINT STYLE: Error Explanation
- Focus on explaining what the error message means in simple terms
- Explain WHY this type of error occurs (the underlying cause)
- Point to common mistakes that lead to this error
- Suggest what part of the code to examine
- DO NOT fix the error directly`);
      break;
    case 'logic-guidance':
      promptParts.push(`\nHINT STYLE: Logic Guidance
- Help the student trace through their code logic step-by-step
- Ask "What do you expect to happen at this point?"
- Suggest using console.log() to track values
- Guide them to identify where actual behavior differs from expected
- Focus on the flow of data and control`);
      break;
    case 'concept-reminder':
      promptParts.push(`\nHINT STYLE: Concept Reminder
- Explain the relevant programming concept clearly
- Use a simple analogy or real-world comparison
- Provide a tiny illustrative example (different from their code)
- Connect the concept back to their specific situation
- Keep it focused on ONE concept at a time`);
      break;
    case 'visual-gameloop':
      promptParts.push(`\nHINT STYLE: Visual/Game Loop Explanation
- Explain how game loops and animations work
- Describe the frame-by-frame update cycle
- Use visual metaphors ("like a flipbook")
- Explain requestAnimationFrame or setInterval timing
- Guide them to think about state changes over time`);
      break;
    default:
      promptParts.push(`\nHINT STYLE: General Guidance
- Start by acknowledging their question
- Identify the most likely area of confusion
- Provide ONE clear hint or direction to try
- End with an encouraging next step or question`);
  }

  if (confidence < 0.4) {
    promptParts.push(
      `\nNOTE: The question is vague. Start by asking clarifying questions or provide general conceptual guidance related to the topic.`
    );
  } else if (confidence < 0.6) {
    promptParts.push(
      `\nNOTE: Moderate context available. Provide focused hints but verify assumptions with the student.`
    );
  }

  if (context?.codeIsEmpty) {
    promptParts.push(`\nIMPORTANT: The student has NOT written any code yet (or the code is empty). Do NOT assume they have code.
- Tell them clearly that there is no code written yet.
- Give clear, step-by-step instructions on what to do to complete the current step correctly.
- Explain what they need to add and where, so they can get started properly.`);
  }
  if (context?.codeSummary) {
    promptParts.push(`\nSTUDENT'S CODE (summary for context only - do not invent code):\n${context.codeSummary}`);
  }
  if (context?.errorMessage) {
    promptParts.push(`\nERROR MESSAGE: ${context.errorMessage}`);
  }
  if (context?.moduleTitle) {
    promptParts.push(`\nMODULE: ${context.moduleTitle}`);
  }
  if (context?.objectives && Array.isArray(context.objectives)) {
    promptParts.push(`\nLEARNING OBJECTIVES: ${context.objectives.join(', ')}`);
  }
  const hasCurrentStep = context?.currentStepDescription !== undefined && context?.currentStepDescription !== '' ||
    (context?.currentStepIndex !== undefined && context?.currentStepIndex !== null);
  if (hasCurrentStep) {
    const stepIdx = typeof context.currentStepIndex === 'number' ? context.currentStepIndex : '?';
    const stepDesc = context.currentStepDescription || 'current step';
    promptParts.push(`\nCURRENT STEP THE STUDENT IS ON (index ${stepIdx}): "${stepDesc}". Use this to tutor them toward this step.`);
  }

  promptParts.push(`\nSTUDENT'S QUESTION: ${message}`);
  const wordLimits = { minimal: 80, moderate: 200, detailed: 280 };
  const wordLimit = wordLimits[hintDetail] ?? 200;
  promptParts.push(
    `\nProvide a helpful, pedagogical response (max ${wordLimit} words). Remember: GUIDE, don't solve!`
  );

  return promptParts.join('\n');
}

module.exports = {
  assessQuestionConfidence,
  getFallbackHints,
  buildPedagogicalPrompt,
};
