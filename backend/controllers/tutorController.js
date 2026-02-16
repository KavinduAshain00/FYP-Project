const ai = require("../services/aiService");
const {
  getCodeForVerify,
  isCodeEmptyForStep,
  assessQuestionConfidence,
  getFallbackHints,
  buildPedagogicalPrompt,
} = require("../utils/tutor");

/** POST /api/tutor/mcq/generate */
async function generateMCQs(req, res) {
  const { stepTitle, stepConcept, moduleTitle, count } = req.body;
  if (!stepTitle || typeof stepTitle !== "string") {
    return res.status(400).json({ error: "stepTitle (string) is required" });
  }
  try {
    const result = await ai.generateMCQs(
      stepTitle,
      stepConcept || "",
      moduleTitle || "",
      typeof count === "number" ? Math.min(2, Math.max(1, count)) : 2
    );
    return res.json(result);
  } catch (err) {
    console.error("MCQ generate error:", err.message || err);
    return res.status(500).json({ error: "MCQ generation failed", questions: [] });
  }
}

/** POST /api/tutor/mcq/verify */
async function verifyMCQ(req, res) {
  const { question, options, correctIndex, selectedIndex } = req.body;
  if (
    !question ||
    !Array.isArray(options) ||
    typeof correctIndex !== "number" ||
    typeof selectedIndex !== "number"
  ) {
    return res.status(400).json({
      error: "question, options (array), correctIndex, and selectedIndex are required",
    });
  }
  try {
    const result = await ai.verifyMCQAnswer(question, options, correctIndex, selectedIndex);
    return res.json(result);
  } catch (err) {
    console.error("MCQ verify error:", err.message || err);
    return res.status(500).json({
      correct: false,
      explanation: "Verification failed. Please try again.",
    });
  }
}

/** POST /api/tutor/explain-code */
async function explainCode(req, res) {
  const { code, language } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "code (string) is required" });
  }
  try {
    const explanation = await ai.explainCodeSnippet(code.trim(), language || "javascript");
    return res.json({ explanation });
  } catch (err) {
    console.error("Explain code error:", err.message || err);
    return res.status(500).json({ error: err.message || "Explanation failed" });
  }
}

/** POST /api/tutor/generate-starter-code */
async function generateGameStarterCode(req, res) {
  const planning = req.body?.planning || req.body;
  if (!planning || typeof planning !== "object") {
    return res.status(400).json({ error: "planning (object) is required" });
  }
  if (!planning.name && !planning.description) {
    return res.status(400).json({ error: "planning must include at least name or description" });
  }
  try {
    const code = await ai.generateGameStarterCode(planning);
    return res.json({ answer: code });
  } catch (err) {
    console.error("Generate starter code error:", err.message || err);
    return res.status(500).json({ error: err.message || "Starter code generation failed" });
  }
}

/**
 * POST /api/tutor - AI tutor / hints.
 * Hint-mode: low confidence → fallback hints; else summarize code once, build prompt, generate, verify.
 * General: single prompt + generate.
 */
async function postTutor(req, res) {
  const { message, context } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message (string) is required" });
  }

  try {
    if (context?.type === "hint-mode") {
      const confidence = assessQuestionConfidence(message, context);
      const hintStyle = context?.hintStyle || "general";

      if (confidence < 0.3) {
        const fallbackHints = getFallbackHints(message);
        return res.json({
          answer: `🤔 I need a bit more context to help you best. Here are some things to check:\n\n${fallbackHints.join("\n\n")}\n\n💬 Can you tell me more about what you're trying to do and what's happening?`,
          hintType: "fallback",
          confidence,
        });
      }

      const normalized = getCodeForVerify(context?.code);
      const codeIsEmpty = normalized ? isCodeEmptyForStep(normalized) : true;

      let codeSummary = "No code written by the student yet.";
      if (!codeIsEmpty && context?.code) {
        if (typeof context.code === "object") {
          const toSummarize = {
            html: context.code.html,
            css: context.code.css,
            javascript: context.code.javascript ?? context.code.js,
            jsx: context.code.jsx,
          };
          codeSummary = await ai.summarizeCodeToMarkdown(toSummarize);
        } else if (typeof context.code === "string") {
          const file = context.currentFile || "";
          const codeObj = {};
          if (file.includes("html")) codeObj.html = context.code;
          else if (file.includes("css")) codeObj.css = context.code;
          else if (file.includes("jsx")) codeObj.jsx = context.code;
          else codeObj.javascript = context.code;
          codeSummary = await ai.summarizeCodeToMarkdown(codeObj);
        }
      }

      const aiPreferences = req.user?.aiPreferences || {};
      const prompt = buildPedagogicalPrompt(
        message,
        { ...context, codeSummary, codeIsEmpty },
        hintStyle,
        confidence,
        aiPreferences
      );
      let answer = await ai.generateText(prompt, { maxTokens: 400, temperature: 0.4 });

      const verification = await ai.verifyTutorResponse(message, answer);
      if (!verification.ok) {
        answer =
          "I couldn't verify that response. Please try rephrasing your question or ask about a specific part of your code.";
      }
      if (!answer || !String(answer).trim()) {
        answer = "I couldn't generate a reply right now. Try asking again in a moment.";
      }

      return res.json({ answer, hintType: hintStyle, confidence });
    }

    // General tutor
    const codeSnippet = context?.codeSnippet
      ? `\nRelevant code:\n\`\`\`\n${String(context.codeSnippet).slice(0, 800)}\n\`\`\``
      : "";
    const prompt = `You are an educational coding tutor. Answer the student's question clearly and concisely. Use the context below if provided. Short code examples only when they help.
${codeSnippet}
Question: ${message}`;
    const answer = await ai.generateText(prompt, { maxTokens: 512, temperature: 0.3 });
    const verification = await ai.verifyTutorResponse(message, answer);
    const finalAnswer = !verification.ok
      ? "I couldn't verify that response. Please try rephrasing your question."
      : (answer && String(answer).trim()) || "I couldn't generate a reply right now. Try again in a moment.";
    return res.json({ answer: finalAnswer });
  } catch (err) {
    console.error("Tutor route error:", err.message || err);
    return res.status(500).json({ error: "Tutor service failed to generate a response" });
  }
}

/**
 * Parse AI verification JSON from step verification. Handles code blocks and malformed output.
 */
function parseVerificationResponse(raw) {
  const fallbackFail = {
    correct: false,
    feedback: "Verification could not be read. Please try again or ensure your code addresses the step.",
  };
  if (!raw || typeof raw !== "string") return fallbackFail;
  const trimmed = raw.trim().replace(/^```json?\s*|\s*```$/g, "").trim();
  if (!trimmed) return fallbackFail;

  try {
    const result = JSON.parse(trimmed);
    if (typeof result.correct === "boolean") {
      const feedback =
        typeof result.feedback === "string" && result.feedback.trim()
          ? result.feedback.trim()
          : result.correct
            ? "Step complete!"
            : "Try again.";
      return { correct: result.correct, feedback };
    }
  } catch {
    // try extraction
  }

  const firstBrace = trimmed.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < trimmed.length; i++) {
      if (trimmed[i] === "{") depth++;
      if (trimmed[i] === "}") {
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
        if (typeof result.correct === "boolean") {
          const feedback =
            typeof result.feedback === "string" && result.feedback.trim()
              ? result.feedback.trim()
              : result.correct ? "Step complete!" : "Try again.";
          return { correct: result.correct, feedback };
        }
      } catch {
        // continue
      }
    }
  }

  const correctMatch = raw.match(/"correct"\s*:\s*(true|false)/i);
  const feedbackMatch = raw.match(/"feedback"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (correctMatch) {
    const correct = correctMatch[1].toLowerCase() === "true";
    let feedback = "Try again.";
    if (feedbackMatch?.[1]) feedback = feedbackMatch[1].replace(/\\"/g, '"').trim();
    else if (correct) feedback = "Step complete!";
    return { correct, feedback };
  }
  if (/\bcorrect\s*:\s*true\b/i.test(raw) || /\b"correct"\s*:\s*true\b/i.test(raw)) {
    return { correct: true, feedback: "Step complete!" };
  }
  return fallbackFail;
}

/**
 * Check console output against expected (verifyType: checkConsole).
 */
function checkConsoleOutput(consoleOutput, expectedConsole) {
  if (!Array.isArray(consoleOutput) || consoleOutput.length === 0) {
    return {
      ok: false,
      feedback: "Run the code first and check the Console panel. No output was captured yet.",
    };
  }
  const messages = consoleOutput
    .map((e) => (e?.message ? String(e.message).trim() : ""))
    .filter(Boolean);
  if (!expectedConsole || typeof expectedConsole !== "object") {
    return { ok: true, feedback: "Console output captured. Step complete!" };
  }
  if (expectedConsole.type === "any" || expectedConsole.type === "multipleLines") {
    const needMultiple = expectedConsole.type === "multipleLines";
    if (needMultiple && messages.length < 2) {
      return {
        ok: false,
        feedback: "You should see multiple lines in the console. Run the code and confirm several lines are logged.",
      };
    }
    return { ok: true, feedback: "Console output looks good. Step complete!" };
  }
  if (expectedConsole.exactLine != null) {
    const expected = String(expectedConsole.exactLine).trim();
    const found = messages.some((m) => m === expected || m.includes(expected));
    if (!found) {
      return {
        ok: false,
        feedback: `In the Console you should see: "${expected}". Run the code after commenting out the rest.`,
      };
    }
    if (messages.length > 1) {
      return {
        ok: false,
        feedback: "Only one line should appear in the console. Put the rest in a multi-line comment.",
      };
    }
    return { ok: true, feedback: "Correct! Only one line is logged. Step complete!" };
  }
  if (Array.isArray(expectedConsole.contains)) {
    const missing = expectedConsole.contains.filter((s) => !messages.some((m) => m.includes(s)));
    if (missing.length > 0) {
      return {
        ok: false,
        feedback: `Console should show: ${missing.join(", ")}. Run the code and check the Console panel.`,
      };
    }
    return { ok: true, feedback: "Console output matches. Step complete!" };
  }
  return { ok: true, feedback: "Console output captured. Step complete!" };
}

/**
 * Check comment-only step (verifyType: checkComments).
 */
function checkCommentsStep(stepDescription, normalized) {
  const stepLower = (stepDescription || "").toLowerCase();
  const js = normalized?.js ?? "";
  const jsLines = js.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (
    stepLower.includes("single-line comment") &&
    (stepLower.includes("'opening line'") || stepLower.includes("opening line"))
  ) {
    const hasOpening = jsLines.some((line) => line.startsWith("//") && /opening\s*line/i.test(line));
    if (hasOpening) return { correct: true, feedback: "Step complete! You added the single-line comment correctly." };
    return {
      correct: false,
      feedback: "On line 1, add a single-line comment that says Opening line. Use // before the text.",
    };
  }
  if (stepLower.includes("comment above") || stepLower.includes("above the commented block")) {
    const hasMultiLine = js.includes("/*") && js.includes("*/");
    const hasSingleNearBlock = jsLines.some((line) => line.startsWith("//") && line.length > 2);
    if (hasMultiLine && hasSingleNearBlock) {
      return { correct: true, feedback: "Step complete! You added a comment above the block." };
    }
    if (!hasMultiLine) {
      return {
        correct: false,
        feedback: "Add a multi-line comment block (/* ... */) and a single-line comment above it.",
      };
    }
    return {
      correct: false,
      feedback: "Add a single-line comment (// ...) above the multi-line block, e.g. // Rest of passage commented out.",
    };
  }
  return null;
}

/**
 * POST /api/tutor/verify - Verify if user code satisfies current step.
 * Body: { stepIndex, stepDescription, code, moduleTitle?, objectives?, verifyType?, consoleOutput?, expectedConsole? }
 */
async function verifyStep(req, res) {
  const {
    stepIndex,
    stepDescription,
    code,
    moduleTitle,
    objectives,
    verifyType,
    consoleOutput,
    expectedConsole,
  } = req.body;

  if (stepDescription == null || typeof stepDescription !== "string") {
    return res.status(400).json({ error: "stepDescription (string) is required" });
  }
  if (!code || typeof code !== "object") {
    return res.status(400).json({ error: "code (object with html/css/js/jsx) is required" });
  }

  const normalized = getCodeForVerify(code);

  if (verifyType === "checkConsole") {
    const result = checkConsoleOutput(consoleOutput || [], expectedConsole);
    return res.json({ correct: result.ok, feedback: result.feedback });
  }

  if (verifyType === "checkComments") {
    const commentResult = checkCommentsStep(stepDescription, normalized);
    if (commentResult) return res.json(commentResult);
    const hasComment = (normalized?.js || "").includes("//") || (normalized?.js || "").includes("/*");
    if (!hasComment) {
      return res.json({
        correct: false,
        feedback: "Add the required comment in your code (// or /* */), then click Check again.",
      });
    }
    return res.json({ correct: true, feedback: "Comment found. Step complete!" });
  }

  if (isCodeEmptyForStep(normalized)) {
    return res.json({
      correct: false,
      feedback: "Add code that implements the step before verifying. Empty or placeholder code cannot pass.",
    });
  }

  try {
    const codeBlock = [
      normalized.html ? `HTML:\n${normalized.html}` : "",
      normalized.css ? `CSS:\n${normalized.css}` : "",
      normalized.js ? `JavaScript:\n${normalized.js}` : "",
      normalized.jsx ? `JSX/React:\n${normalized.jsx}` : "",
    ]
      .filter(Boolean)
      .join("\n\n---\n\n");

    const stepLower = stepDescription.toLowerCase();
    const jsLines = (normalized.js || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (
      stepLower.includes("single-line comment") &&
      (stepLower.includes("'opening line'") || stepLower.includes("opening line")) &&
      jsLines.length > 0
    ) {
      const hasOpening = jsLines.some((line) => line.startsWith("//") && /opening\s*line/i.test(line));
      if (hasOpening) {
        return res.json({
          correct: true,
          feedback: "Step complete! You added the single-line comment correctly.",
        });
      }
    }

    const prompt = `You are a coding tutor. Verify ONLY the CORE requirement for THIS step.

MODULE: ${moduleTitle || "Programming module"}
STEP (index ${stepIndex}): "${stepDescription}"
${objectives?.length ? `Objectives: ${objectives.join("; ")}` : ""}

STUDENT'S CODE:
${codeBlock}

RULES:
1. Check ONLY what this step asks for. Do not require code from other steps.
2. Code must implement the step and have no obvious syntax/runtime errors.
3. Reject empty or placeholder code (comments/TODOs alone are NOT enough).
4. Reply with ONLY this JSON, no other text: {"correct": true or false, "feedback": "one or two sentences"}
5. For correct: false, feedback must explain WHY and what to do. For correct: true, feedback is brief and positive.`;

    const raw = await ai.generateText(prompt, { maxTokens: 256, temperature: 0.2 });
    const result = parseVerificationResponse(raw);
    return res.json({ correct: result.correct, feedback: result.feedback });
  } catch (err) {
    console.error("Verify step error:", err.message || err);
    return res.status(500).json({
      correct: false,
      feedback: "Verification service failed. Please try again.",
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
