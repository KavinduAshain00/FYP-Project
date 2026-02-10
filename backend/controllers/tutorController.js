const ai = require('../services/aiService');
const {
  assessQuestionConfidence,
  getFallbackHints,
  buildPedagogicalPrompt,
} = require('../utils/tutor');

/** POST /api/tutor/mcq/generate - Generate 1-2 MCQs for a step (uses qwen3-coder:480b) */
async function generateMCQs(req, res) {
  const { stepTitle, stepConcept, moduleTitle, count } = req.body;
  if (!stepTitle || typeof stepTitle !== 'string') {
    return res.status(400).json({ error: 'stepTitle (string) is required' });
  }
  try {
    const result = await ai.generateMCQs(
      stepTitle,
      stepConcept || '',
      moduleTitle || '',
      typeof count === 'number' ? Math.min(2, Math.max(1, count)) : 2
    );
    return res.json(result);
  } catch (err) {
    console.error('MCQ generate error:', err.message || err);
    return res.status(500).json({ error: 'MCQ generation failed', questions: [] });
  }
}

/** POST /api/tutor/mcq/verify - Verify MCQ answer and return explanation if wrong (qwen3-coder:480b) */
async function verifyMCQ(req, res) {
  const { question, options, correctIndex, selectedIndex } = req.body;
  if (!question || !Array.isArray(options) || typeof correctIndex !== 'number' || typeof selectedIndex !== 'number') {
    return res.status(400).json({ error: 'question, options (array), correctIndex, and selectedIndex are required' });
  }
  try {
    const result = await ai.verifyMCQAnswer(question, options, correctIndex, selectedIndex);
    return res.json(result);
  } catch (err) {
    console.error('MCQ verify error:', err.message || err);
    return res.status(500).json({
      correct: false,
      explanation: 'Verification failed. Please try again.',
    });
  }
}

/** POST /api/tutor/explain-code - Explain a highlighted code snippet */
async function explainCode(req, res) {
  const { code, language } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code (string) is required' });
  }
  try {
    const explanation = await ai.explainCodeSnippet(code.trim(), language || 'javascript');
    return res.json({ explanation });
  } catch (err) {
    console.error('Explain code error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Explanation failed' });
  }
}

/** POST /api/tutor/generate-starter-code - Generate React game starter code from planning (qwen3-coder:480b) */
async function generateGameStarterCode(req, res) {
  const planning = req.body?.planning || req.body;
  if (!planning || typeof planning !== 'object') {
    return res.status(400).json({ error: 'planning (object) is required' });
  }
  if (!planning.name && !planning.description) {
    return res.status(400).json({ error: 'planning must include at least name or description' });
  }
  try {
    const code = await ai.generateGameStarterCode(planning);
    return res.json({ answer: code });
  } catch (err) {
    console.error('Generate starter code error:', err.message || err);
    return res.status(500).json({ error: err.message || 'Starter code generation failed' });
  }
}

/**
 * POST /api/tutor - AI tutor / hints
 * Code is summarized to markdown and verified; tutor response is verified before return.
 */
async function postTutor(req, res) {
  const { message, context } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) is required' });
  }

  try {
    if (context?.type === 'hint-mode') {
      const confidence = assessQuestionConfidence(message, context);
      const hintStyle = context?.hintStyle || 'general';

      if (confidence < 0.3) {
        const fallbackHints = getFallbackHints(message);
        return res.json({
          answer: `🤔 I need a bit more context to help you best. Here are some things to check:\n\n${fallbackHints.join('\n\n')}\n\n💬 Can you tell me more about what you're trying to do and what's happening?`,
          hintType: 'fallback',
          confidence,
        });
      }

      const normalized = getCodeForVerify(context?.code);
      const codeIsEmpty = normalized ? isCodeEmptyForStep(normalized) : true;

      let codeSummary = null;
      if (!codeIsEmpty && context?.code && typeof context.code === 'object') {
        codeSummary = await ai.summarizeCodeToMarkdown(context.code);
        const codeExcerpt = [context.code.html, context.code.css, context.code.javascript, context.code.jsx].filter(Boolean).join('\n').substring(0, 600);
        const summaryOk = await ai.verifyCodeSummary(codeExcerpt, codeSummary);
        if (!summaryOk) codeSummary = 'Code context (summary could not be verified).';
      } else if (!codeIsEmpty && context?.code && typeof context.code === 'string') {
        const file = context.currentFile || '';
        const codeObj = {};
        if (file.includes('html')) codeObj.html = context.code;
        else if (file.includes('css')) codeObj.css = context.code;
        else if (file.includes('jsx')) codeObj.jsx = context.code;
        else codeObj.javascript = context.code;
        codeSummary = await ai.summarizeCodeToMarkdown(codeObj);
      }
      if (codeIsEmpty) {
        codeSummary = 'No code written by the student yet.';
      }

      const aiPreferences = req.user?.aiPreferences || {};
      const prompt = buildPedagogicalPrompt(message, { ...context, codeSummary, codeIsEmpty }, hintStyle, confidence, aiPreferences);
      let answer = await ai.generateText(prompt, { maxTokens: 400, temperature: 0.4 });

      const verification = await ai.verifyTutorResponse(message, answer);
      if (!verification.ok) {
        answer = "I couldn't verify that response. Please try rephrasing your question or ask about a specific part of your code.";
      }
      if (!answer || !String(answer).trim()) {
        answer = "I couldn't generate a reply right now. Try asking again in a moment.";
      }

      return res.json({
        answer,
        hintType: hintStyle,
        confidence,
      });
    }

    // Other context types
    const promptParts = [];
    if (context?.type === 'game-planning') {
      promptParts.push(`You are an expert game design consultant and coding mentor. Help the student plan their game by:
- Providing clear, actionable game design advice
- Suggesting implementation strategies for React-based games
- Explaining game mechanics and how to code them
- Offering best practices for game development
Be encouraging and creative while keeping suggestions practical and achievable.`);
    } else if (context?.type === 'game-development') {
      promptParts.push(`You are a helpful game development coding assistant in the Game Studio. The student is working on a React-based game.
- Provide clear, concise code examples when appropriate
- Explain debugging strategies and suggest improvements
- Help with game mechanics, state, and React patterns
- Be friendly and encouraging. Answer in 1-4 short paragraphs; use code blocks when relevant.
Current file: ${context.currentFile || 'unknown'}
${context.codeSnippet ? `Relevant code (excerpt):\n\`\`\`\n${String(context.codeSnippet).slice(0, 1200)}\n\`\`\`` : 'No code excerpt provided.'}`);
    } else if (context?.type === 'multiplayer-game-development') {
      promptParts.push(`You are a helpful AI coding companion in the Multiplayer Game Studio. The student is building a multiplayer React game (real-time, rooms, networking).
- Help with multiplayer patterns: sync state, room logic, latency, reconnection
- Provide clear code examples and debugging tips
- Suggest best practices for real-time games and React
- Be friendly and concise. Answer in 1-4 short paragraphs; use code blocks when relevant.
Current file: ${context.currentFile || 'unknown'}
${context.codeSnippet ? `Relevant code (excerpt):\n\`\`\`\n${String(context.codeSnippet).slice(0, 1200)}\n\`\`\`` : 'No code excerpt provided.'}`);
    } else if (context?.type === 'contextual-tip') {
      promptParts.push(`You are a friendly AI coding companion giving a short, contextual tip in the Game Studio.
- The student may have errors, unused code, or general game-dev questions
- Keep the tip concise (2-4 paragraphs max), engaging, and practical
- Use emojis sparingly. Include a brief code example only if it helps
- End with an encouraging line. Do not repeat the instruction verbatim.`);
    } else if (context?.type === 'code-generation') {
      promptParts.push(`You are a code generation assistant for React game development.
- Generate clean, well-commented code
- Use modern React patterns (hooks, functional components)
- Include helpful console.log statements for debugging
- Make the code educational and easy to understand`);
    } else {
      promptParts.push(
        'You are an educational coding tutor. Provide clear, concise, step-by-step help and include example code snippets when relevant.'
      );
    }

    if (context && typeof context === 'object') {
      // Avoid duplicating large codeSnippet if already in prompt
      const ctxForJson = context.codeSnippet
        ? { ...context, codeSnippet: '(see above)' }
        : context;
      promptParts.push(`Additional context: ${JSON.stringify(ctxForJson)}`);
    }
    if (req.user && req.user.username) {
      promptParts.push(`Student: ${req.user.username}`);
    }
    promptParts.push(`Question: ${message}`);

    const prompt = promptParts.join('\n\n');
    const isLongForm = ['game-planning', 'code-generation', 'game-development', 'multiplayer-game-development', 'contextual-tip'].includes(context?.type);
    let maxTokens = 512;
    if (context?.type === 'code-generation' || context?.type === 'game-planning') maxTokens = 2048;
    else if (isLongForm) maxTokens = 1024;
    let answer = await ai.generateText(prompt, { maxTokens, temperature: 0.3 });

    // Skip verification for game studio and long-form: verifier often rejects valid companion/tip responses
    const skipVerification = context?.type === 'game-planning' || context?.type === 'code-generation' ||
      context?.type === 'game-development' || context?.type === 'multiplayer-game-development' || context?.type === 'contextual-tip';
    if (!skipVerification) {
      const verification = await ai.verifyTutorResponse(message, answer);
      if (!verification.ok) {
        answer = "I couldn't verify that response. Please try rephrasing your question or be more specific.";
      }
    }
    if (!answer || !String(answer).trim()) {
      answer = "I couldn't generate a reply right now. Try asking again in a moment.";
    }

    return res.json({ answer });
  } catch (err) {
    console.error('Tutor route error:', err.message || err);
    return res.status(500).json({ error: 'Tutor service failed to generate a response' });
  }
}

/**
 * Normalize code from request: frontend may send "javascript" or "js".
 */
function getCodeForVerify(code) {
  if (!code || typeof code !== 'object') return null;
  return {
    html: code.html || '',
    css: code.css || '',
    js: (code.javascript !== undefined ? code.javascript : code.js) || '',
    jsx: code.jsx || '',
  };
}

/**
 * Check if code is effectively empty: only whitespace or almost no code.
 * Returns true if code should be rejected as "empty" before calling AI.
 */
function isCodeEmptyForStep(normalized) {
  const full = [normalized.html, normalized.css, normalized.js, normalized.jsx].join('\n');
  const noWhitespace = full.replace(/\s+/g, ' ').trim();
  if (noWhitespace.length < 25) return true;
  const withoutComments = noWhitespace
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/#[^\n]*/g, '')
    .trim();
  if (withoutComments.length < 20) return true;
  return false;
}

/**
 * Parse AI verification response into { correct: boolean, feedback: string }.
 * Handles JSON in code blocks, extra text, and malformed output.
 */
function parseVerificationResponse(raw) {
  const fallbackFail = {
    correct: false,
    feedback: 'Verification could not be read. Please try again or ensure your code addresses the step.',
  };
  if (!raw || typeof raw !== 'string') return fallbackFail;

  const trimmed = raw.trim().replace(/^```json?\s*|\s*```$/g, '').trim();
  if (!trimmed) return fallbackFail;

  // 1) Try direct parse
  try {
    const result = JSON.parse(trimmed);
    if (typeof result.correct === 'boolean') {
      let feedback = 'Try again.';
      if (typeof result.feedback === 'string' && result.feedback.trim()) {
        feedback = result.feedback.trim();
      } else if (result.correct) {
        feedback = 'Step complete!';
      }
      return { correct: result.correct, feedback };
    }
  } catch {
    // continue to extraction
  }

  // 2) Try to extract JSON object (first { to matching })
  const firstBrace = trimmed.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < trimmed.length; i++) {
      if (trimmed[i] === '{') depth++;
      if (trimmed[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== -1) {
      try {
        const result = JSON.parse(trimmed.slice(firstBrace, end + 1));
        if (typeof result.correct === 'boolean') {
          let feedback = 'Try again.';
          if (typeof result.feedback === 'string' && result.feedback.trim()) {
            feedback = result.feedback.trim();
          } else if (result.correct) {
            feedback = 'Step complete!';
          }
          return { correct: result.correct, feedback };
        }
      } catch {
        // continue
      }
    }
  }

  // 3) Heuristic: look for "correct": true/false and "feedback": "..." in raw text
  const correctMatch = raw.match(/"correct"\s*:\s*(true|false)/i);
  const feedbackMatch = raw.match(/"feedback"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (correctMatch) {
    const correct = correctMatch[1].toLowerCase() === 'true';
    let feedback = 'Try again.';
    if (feedbackMatch && feedbackMatch[1]) {
      feedback = feedbackMatch[1].replace(/\\"/g, '"').trim();
    } else if (correct) {
      feedback = 'Step complete!';
    }
    return { correct, feedback };
  }

  // 4) Simple success indicators (model said yes / correct without valid JSON)
  if (/\bcorrect\s*:\s*true\b/i.test(raw) || /\b"correct"\s*:\s*true\b/i.test(raw)) {
    return { correct: true, feedback: 'Step complete!' };
  }
  if (/\b(the code is correct|yes,? it('s| is) correct|step complete)\b/i.test(raw)) {
    return { correct: true, feedback: 'Step complete!' };
  }

  return fallbackFail;
}

/**
 * Check console output against expected (for verifyType: checkConsole).
 * expectedConsole: { type: 'any'|'multipleLines' } or { exactLine: string } or { contains: string[] }
 */
function checkConsoleOutput(consoleOutput, expectedConsole) {
  if (!Array.isArray(consoleOutput) || consoleOutput.length === 0) {
    return { ok: false, feedback: 'Run the code first and check the Console panel. No output was captured yet.' };
  }
  const messages = consoleOutput.map((e) => (e && e.message ? String(e.message).trim() : '')).filter(Boolean);
  if (!expectedConsole || typeof expectedConsole !== 'object') {
    return { ok: true, feedback: 'Console output captured. Step complete!' };
  }
  if (expectedConsole.type === 'any' || expectedConsole.type === 'multipleLines') {
    const needMultiple = expectedConsole.type === 'multipleLines';
    if (needMultiple && messages.length < 2) {
      return { ok: false, feedback: 'You should see multiple lines in the console (all passage lines). Run the code and confirm several lines are logged.' };
    }
    return { ok: true, feedback: 'Console output looks good. Step complete!' };
  }
  if (expectedConsole.exactLine !== undefined && expectedConsole.exactLine !== null) {
    const expected = String(expectedConsole.exactLine).trim();
    const found = messages.some((m) => m === expected || m.includes(expected));
    if (!found) {
      return { ok: false, feedback: `In the Console you should see exactly one line: "${expected}". Run the code after commenting out the rest.` };
    }
    if (messages.length > 1) {
      return { ok: false, feedback: 'Only one line should appear in the console. Make sure the rest of the passage is inside a multi-line comment /* ... */.' };
    }
    return { ok: true, feedback: 'Correct! Only one line is logged. Step complete!' };
  }
  if (Array.isArray(expectedConsole.contains)) {
    const missing = expectedConsole.contains.filter((s) => !messages.some((m) => m.includes(s)));
    if (missing.length > 0) {
      return { ok: false, feedback: `Console should show: ${missing.join(', ')}. Run the code and check the Console panel.` };
    }
    return { ok: true, feedback: 'Console output matches. Step complete!' };
  }
  return { ok: true, feedback: 'Console output captured. Step complete!' };
}

/**
 * Check code for comment requirements (for verifyType: checkComments).
 */
function checkCommentsStep(stepDescription, normalized) {
  const stepLower = (stepDescription || '').toLowerCase();
  const js = (normalized && normalized.js) ? normalized.js : '';
  const jsLines = js.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Single-line comment on line 1 that says "Opening line"
  if (stepLower.includes('single-line comment') && (stepLower.includes("'opening line'") || stepLower.includes('opening line'))) {
    const hasOpeningLineComment = jsLines.some((line) => line.startsWith('//') && /opening\s*line/i.test(line));
    if (hasOpeningLineComment) {
      return { correct: true, feedback: 'Step complete! You added the single-line comment correctly.' };
    }
    return { correct: false, feedback: "On line 1, add a single-line comment that says Opening line. Use // before the text." };
  }

  // Comment above the commented block (e.g. "Rest of passage commented out")
  if (stepLower.includes('comment above') || stepLower.includes('above the commented block')) {
    const hasMultiLine = js.includes('/*') && js.includes('*/');
    const hasSingleLineNearBlock = jsLines.some((line) => line.startsWith('//') && line.length > 2);
    if (hasMultiLine && hasSingleLineNearBlock) {
      return { correct: true, feedback: 'Step complete! You added a comment above the block.' };
    }
    if (!hasMultiLine) {
      return { correct: false, feedback: 'Add a multi-line comment block (/* ... */) and a single-line comment above it describing what you did.' };
    }
    return { correct: false, feedback: "Add a single-line comment (// ...) above the multi-line comment block, e.g. // Rest of passage commented out." };
  }

  return null; // fallback to AI
}

/**
 * POST /api/tutor/verify - AI verify if user code satisfies current step objective
 * Body: { stepIndex, stepDescription, code, moduleTitle?, objectives?, verifyType?, consoleOutput?, expectedConsole? }
 * Returns: { correct: boolean, feedback: string }
 */
async function verifyStep(req, res) {
  const { stepIndex, stepDescription, code, moduleTitle, objectives, verifyType, consoleOutput, expectedConsole } = req.body;
  if (stepDescription === null || stepDescription === undefined || typeof stepDescription !== 'string') {
    return res.status(400).json({ error: 'stepDescription (string) is required' });
  }
  if (!code || typeof code !== 'object') {
    return res.status(400).json({ error: 'code (object with html/css/js/jsx) is required' });
  }

  const normalized = getCodeForVerify(code);

  // --- verifyType: checkConsole (non-coding step: user must run and have console output) ---
  if (verifyType === 'checkConsole') {
    const result = checkConsoleOutput(consoleOutput || [], expectedConsole);
    return res.json({ correct: result.ok, feedback: result.feedback });
  }

  // --- verifyType: checkComments (comment-only step; allow minimal/comment-only code) ---
  if (verifyType === 'checkComments') {
    const commentResult = checkCommentsStep(stepDescription, normalized);
    if (commentResult) {
      return res.json(commentResult);
    }
    // Fallback: still require some code (e.g. at least one line with // or /*)
    const hasComment = (normalized.js || '').includes('//') || (normalized.js || '').includes('/*');
    if (!hasComment) {
      return res.json({
        correct: false,
        feedback: 'Add the required comment in your code (single-line // or multi-line /* */), then click Check again.',
      });
    }
    return res.json({
      correct: true,
      feedback: 'Comment found. Step complete!',
    });
  }

  // --- verifyType: code (default) - require non-empty code ---
  if (isCodeEmptyForStep(normalized)) {
    return res.json({
      correct: false,
      feedback: 'Add code that actually implements the step before verifying. Empty or placeholder-only code cannot pass.',
    });
  }

  try {
    const codeBlock = [
      normalized.html ? `HTML:\n${normalized.html}` : '',
      normalized.css ? `CSS:\n${normalized.css}` : '',
      normalized.js ? `JavaScript:\n${normalized.js}` : '',
      normalized.jsx ? `JSX/React:\n${normalized.jsx}` : '',
    ].filter(Boolean).join('\n\n---\n\n');

    // Quick pass: single-line comment "Opening line" (also used for code steps that mention it)
    const stepLower = stepDescription.toLowerCase();
    const jsLines = (normalized.js || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (
      stepLower.includes('single-line comment') &&
      (stepLower.includes("'opening line'") || stepLower.includes('opening line')) &&
      jsLines.length > 0
    ) {
      const hasOpeningLineComment = jsLines.some(
        (line) => line.startsWith('//') && /opening\s*line/i.test(line)
      );
      if (hasOpeningLineComment) {
        return res.json({
          correct: true,
          feedback: 'Step complete! You added the single-line comment correctly.',
        });
      }
    }

    const prompt = `You are a coding tutor. Verify ONLY the CORE requirement for THIS step. Ensure the student's code does what they were instructed to do for this step, without errors.

MODULE: ${moduleTitle || 'Programming module'}
STEP TO VERIFY (index ${stepIndex}): "${stepDescription}"
${objectives?.length ? `All objectives for context: ${objectives.join('; ')}` : ''}

STUDENT'S CURRENT CODE:
${codeBlock}

VERIFICATION RULES:
1. Check ONLY the core thing needed for THIS step. Do not require extra or unrelated code from other steps.
2. The code must correctly implement what the step asks for and have no obvious syntax or runtime errors.
3. Reject empty, placeholder, or non-implementing code (comments/TODOs alone are NOT enough).
4. If the code properly does what the step instructs and runs without errors, return correct: true.
5. Respond with ONLY this JSON, no other text: {"correct": true or false, "feedback": "one or two sentences"}
6. For correct: false, feedback MUST explain WHY it is not working (e.g. "Did you write a single-line comment using two forward slashes?") and what to do instead. For correct: true, feedback is brief and positive.`;

    const raw = await ai.generateText(prompt, { maxTokens: 256, temperature: 0.2 });
    const result = parseVerificationResponse(raw);
    return res.json({ correct: result.correct, feedback: result.feedback });
  } catch (err) {
    console.error('Verify step error:', err.message || err);
    return res.status(500).json({
      correct: false,
      feedback: 'Verification service failed. Please try again.',
    });
  }
}

module.exports = {
  postTutor,
  verifyStep,
  generateMCQs,
  verifyMCQ,
  explainCode,
  generateGameStarterCode,
};
