const githubModels = require("./githubModelsService");
const {
  AI_MODEL,
  AI_MCQ_MODEL,
  AI_LECTURE_MODEL,
  AI_GENERAL_MODEL,
} = require("../constants/ai");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const STEP_VERIFY_TYPES = new Set(["code", "checkConsole", "checkComments"]);

if (!GITHUB_TOKEN) {
  console.warn(
    "Warning: GITHUB_TOKEN not set. AI calls will fail until configured.",
  );
}

console.log(`Using GitHub Models with model ${AI_MODEL}`);

/** Generate text with a specific model. */
async function generateTextWithModel(prompt, options = {}, model = AI_MODEL) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");

  try {
    const content = await githubModels.chatCompletion(
      [{ role: "user", content: prompt }],
      model,
      {
        temperature: options.temperature ?? 0.2,
        maxTokens: options.maxTokens ?? 512,
      },
    );

    if (content && typeof content === "string" && content.trim()) {
      return content.trim();
    }
    return "";
  } catch (err) {
    const message = err.message || String(err);
    throw new Error(`GitHub Models API error: ${message}`, { cause: err });
  }
}

/**
 * Summarize user code into a short markdown context (for tutor). No hallucinations:
 * only describe what is actually present in the code.
 */
async function summarizeCodeToMarkdown(codeByFile) {
  if (!GITHUB_TOKEN) return "Code context unavailable.";
  const parts = [];
  if (codeByFile.html)
    parts.push(
      `HTML (excerpt): ${codeByFile.html.substring(0, 400).replace(/\n/g, " ")}`,
    );
  if (codeByFile.css)
    parts.push(
      `CSS (excerpt): ${codeByFile.css.substring(0, 400).replace(/\n/g, " ")}`,
    );
  if (codeByFile.javascript)
    parts.push(
      `JavaScript (excerpt): ${codeByFile.javascript.substring(0, 600).replace(/\n/g, " ")}`,
    );
  if (codeByFile.jsx)
    parts.push(
      `JSX/React (excerpt): ${codeByFile.jsx.substring(0, 600).replace(/\n/g, " ")}`,
    );
  if (parts.length === 0) return "No code provided.";

  const prompt = `You are a code summarizer. Given the following code excerpts, output ONLY a short markdown summary (2-4 bullet points) that describes what the code actually contains. Do NOT add features, fix bugs, or invent code that is not there. Only describe what is present.

${parts.join("\n\n")}

Output format: markdown bullet points only. No preamble. No code blocks.`;
  try {
    const raw = await generateTextWithModel(prompt, {
      maxTokens: 256,
      temperature: 0.1,
    });
    const summary = raw
      .trim()
      .replace(/^```\w*\n?|```$/g, "")
      .trim();
    return summary || "Code context could not be summarized.";
  } catch {
    return "Code context could not be summarized.";
  }
}

/**
 * Verify that a tutor/hint response is safe and grounded: no fabricated code,
 * no harmful advice, and relevant to the question. Returns { ok: boolean, reason?: string }.
 */
async function verifyTutorResponse(question, response) {
  if (!GITHUB_TOKEN) return { ok: true };
  const prompt = `You are a fact-checker for educational AI responses.

QUESTION: ${question.substring(0, 300)}

RESPONSE TO VERIFY: ${response.substring(0, 800)}

Rules:
1. Reply with ONLY a JSON object: {"ok": true} or {"ok": false, "reason": "brief reason"}.
2. Set ok to false if the response invents code or concepts not in the question/context, gives harmful or unsafe advice, or is clearly off-topic.
3. Set ok to true if the response is helpful, relevant, and does not fabricate facts.
4. No other text.`;
  try {
    const raw = await generateTextWithModel(prompt, {
      maxTokens: 128,
      temperature: 0,
    });
    const trimmed = raw
      .trim()
      .replace(/^```\w*\n?|```$/g, "")
      .trim();
    const result = JSON.parse(trimmed);
    return typeof result.ok === "boolean" ? result : { ok: true };
  } catch {
    return { ok: false, reason: "Verification failed" };
  }
}

/**
 * Verify that a code summary accurately reflects the code (no added content).
 */
async function verifyCodeSummary(codeExcerpt, summary) {
  if (!GITHUB_TOKEN) return true;
  const prompt = `You are a verifier. Does the following summary accurately describe ONLY what is in the code? Reply with ONLY "YES" or "NO".
If the summary adds features, fixes, or details not present in the code, say NO.

CODE EXCERPT: ${(codeExcerpt || "").substring(0, 500)}

SUMMARY: ${summary.substring(0, 400)}

Answer (YES or NO):`;
  try {
    const raw = await generateTextWithModel(prompt, {
      maxTokens: 10,
      temperature: 0,
    });
    return /^\s*YES\s*$/i.test(raw.trim());
  } catch {
    return false;
  }
}

/**
 * Generate 1-2 MCQ questions for a step/concept (educational, code-focused).
 * Returns { questions: [{ question, options: string[], correctIndex: number }] }
 */
async function generateMCQs(stepTitle, stepConcept, moduleTitle, count = 2) {
  if (!GITHUB_TOKEN) return { questions: [] };

  const prompt = `You are an educational quiz generator for programming. Generate exactly ${count} multiple-choice question(s) about the concept below. Keep questions clear and focused on what the student just learned.

MODULE: ${moduleTitle || "Programming"}
STEP/CONCEPT: ${stepTitle}
${stepConcept ? `CONCEPT DETAIL: ${stepConcept}` : ""}

RULES:
1. Output ONLY a single JSON object, no other text before or after.
2. Format: {"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]}
3. correctIndex is 0-based (0 = first option). Each question must have exactly 4 options.
4. Options should be short (one line). One correct answer per question.`;

  const parseQuestions = (raw) => {
    const trimmed = raw
      .trim()
      .replace(/^```\w*\n?|```$/g, "")
      .trim();
    const data = JSON.parse(trimmed);
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return questions
      .slice(0, count)
      .filter(
        (q) =>
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctIndex === "number" &&
          q.correctIndex >= 0 &&
          q.correctIndex < 4,
      );
  };

  try {
    let raw = await generateTextWithModel(
      prompt,
      { maxTokens: 800, temperature: 0.4 },
      AI_MCQ_MODEL,
    );
    let questions = parseQuestions(raw);
    if (questions.length === 0 && raw.trim()) {
      raw = await generateTextWithModel(
        prompt,
        { maxTokens: 800, temperature: 0.2 },
        AI_MCQ_MODEL,
      );
      questions = parseQuestions(raw);
    }
    if (questions.length === 0) {
      return {
        questions: [
          {
            question: "What did you learn in this step?",
            options: [
              "I applied the concept correctly.",
              "I need to review the instructions.",
              "I am not sure yet.",
              "I want to try again.",
            ],
            correctIndex: 0,
          },
        ],
      };
    }
    return { questions };
  } catch {
    return {
      questions: [
        {
          question: "What did you learn in this step?",
          options: [
            "I applied the concept correctly.",
            "I need to review the instructions.",
            "I am not sure yet.",
            "I want to try again.",
          ],
          correctIndex: 0,
        },
      ],
    };
  }
}

/**
 * Explain why an MCQ answer is wrong (or confirm correct).
 * Returns { correct: boolean, explanation: string }
 */
async function verifyMCQAnswer(question, options, correctIndex, selectedIndex) {
  if (!GITHUB_TOKEN)
    return {
      correct: selectedIndex === correctIndex,
      explanation: "Verification unavailable.",
    };

  const correct = selectedIndex === correctIndex;
  const selectedText = options[selectedIndex];
  const correctText = options[correctIndex];

  if (correct) {
    return { correct: true, explanation: "Correct! Well done." };
  }

  const prompt = `You are a patient programming tutor. The student chose the wrong answer. Explain briefly WHY their choice is wrong and WHY the correct answer is right. Teach the concept in 2-4 sentences. Be clear and encouraging.

QUESTION: ${question}
OPTIONS: ${(options || []).map((o, i) => `[${i}] ${o}`).join(" | ")}
CORRECT INDEX: ${correctIndex} (correct answer: "${correctText}")
STUDENT CHOSE INDEX: ${selectedIndex} (their answer: "${selectedText}")

Reply with ONLY a short explanation (2-4 sentences). No preamble like "The correct answer is...". Focus on WHY the wrong answer is wrong and what the right concept is.`;

  try {
    const explanation = await generateTextWithModel(
      prompt,
      { maxTokens: 256, temperature: 0.3 },
      AI_MCQ_MODEL,
    );
    return {
      correct: false,
      explanation:
        (explanation || "").trim() ||
        "That option is incorrect. Review the concept and try again.",
    };
  } catch {
    return {
      correct: false,
      explanation: `That option is incorrect. The correct answer is option ${correctIndex + 1}.`,
    };
  }
}

/**
 * Explain code or an error message (educational, concise). Uses main model.
 * @param {Object} opts
 * @param {'code'|'error'} opts.type - 'code' to explain highlighted code, 'error' to explain an error message
 * @param {string} [opts.code] - Code to explain (required when type is 'code')
 * @param {string} [opts.errorMessage] - Error message to explain (required when type is 'error')
 * @param {string} [opts.codeSnippet] - Optional code context when type is 'error'
 * @param {string} [opts.language='javascript']
 * @returns {Promise<string>}
 */
async function explain(opts) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const type = opts?.type;
  const language = opts?.language ?? "javascript";

  if (type === "code") {
    const code = opts?.code;
    if (!code || !String(code).trim()) throw new Error("No code provided");
    const prompt = `You are a friendly programming tutor. The student highlighted this code and asked for an explanation.

Code (${language}):
\`\`\`${language}
${String(code).substring(0, 2000)}
\`\`\`

Give a clear, concise explanation (3-6 sentences):
1. What this code does in plain language
2. Key concepts or syntax used
3. One tip or thing to watch out for (if relevant)

Do not repeat the code in full. Use simple language.`;
    try {
      const explanation = await generateTextWithModel(prompt, {
        maxTokens: 400,
        temperature: 0.3,
      });
      return (explanation || "").trim() || "Could not generate explanation.";
    } catch (err) {
      throw new Error(err.message || "Explanation failed", { cause: err });
    }
  }

  if (type === "error") {
    const errorMessage = opts?.errorMessage;
    const codeSnippet = opts?.codeSnippet ?? "";
    if (!errorMessage || !String(errorMessage).trim())
      throw new Error("No error message provided");
    const codeBlock =
      codeSnippet && String(codeSnippet).trim()
        ? `\nRelevant code (for context only):\n\`\`\`${language}\n${String(codeSnippet).substring(0, 800)}\n\`\`\``
        : "";
    const prompt = `You are a patient programming tutor. The student sees this error and wants to understand it.

ERROR MESSAGE:
${String(errorMessage).substring(0, 600)}
${codeBlock}

Explain in simple terms (2-3 short paragraphs):
1. What this error means in plain language
2. Common causes (e.g. typo, wrong type, missing bracket)
3. What to check or try first (do NOT write the full fix; point to the idea)

Do not provide the complete corrected code. Guide them to fix it themselves.`;
    try {
      const explanation = await generateTextWithModel(prompt, {
        maxTokens: 400,
        temperature: 0.3,
      });
      return (explanation || "").trim() || "Could not generate explanation.";
    } catch (err) {
      throw new Error(err.message || "Error explanation failed", {
        cause: err,
      });
    }
  }

  throw new Error('explain() requires type: "code" or "error"');
}

/**
 * Generate lecture-like notes from a module's learning overview (summary).
 * Expands the summary into step-by-step educational content explaining what the user will learn.
 * @param {Object} opts
 * @param {string} opts.overview - Module content/summary (the learning overview)
 * @param {string} opts.moduleTitle - Module title
 * @param {string} [opts.difficulty] - beginner | intermediate | advanced
 * @param {string} [opts.category] - e.g. javascript-basics, react-basics
 * @param {Array<{title:string,instruction?:string,concept?:string}>} [opts.steps] - Module steps
 * @param {string[]} [opts.objectives] - Module objectives (if no steps)
 * @param {string} [opts.userLevel] - User's experience level for personalization
 * @returns {Promise<string>} Markdown lecture notes
 */
async function generateLectureNotes(opts) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const overview = opts?.overview;
  const moduleTitle = opts?.moduleTitle || "This lesson";
  if (!overview || !String(overview).trim())
    throw new Error("overview (string) is required");

  let steps = [];
  if (Array.isArray(opts?.steps)) {
    steps = opts.steps;
  } else if (Array.isArray(opts?.objectives)) {
    steps = opts.objectives.map((o) => ({
      title: o,
      instruction: o,
      concept: "",
    }));
  }
  const difficulty = opts?.difficulty || "beginner";
  const category = opts?.category || "";
  const userLevel = opts?.userLevel || "";

  const stepsSection =
    steps.length > 0
      ? `\nSTEPS/CONCEPTS YOU WILL COVER:\n${steps.map((s, i) => `${i + 1}. ${s.title}${s.concept ? ` (${s.concept})` : ""}`).join("\n")}`
      : "";

  const personalization = userLevel
    ? `\nThe student's experience level: ${userLevel}. Adapt explanations to be accessible but not overly basic.`
    : "";

  const prompt = `You are a friendly programming instructor. Create LECTURE SLIDES from the learning overview below. Your output will be split into 2–4 slides - each \`##\` heading starts a new slide.

MODULE: ${moduleTitle}
DIFFICULTY: ${difficulty}
${category ? `CATEGORY: ${category}` : ""}${stepsSection}${personalization}

LEARNING OVERVIEW (summary only):
---
${String(overview).substring(0, 2000)}
---

LECTURE SLIDE STRUCTURE (use exactly 2–4 slides):
- Slide 1: Start with \`## What You'll Learn\` - 3–4 concise bullet points of key takeaways.
- Slides 2–3 (or 2–4): Each \`##\` heading begins a new slide. One main concept per slide. Use clear headings like \`## Creating a Room\`, \`## How It Works\`, \`## Key Concepts\`.
- Last slide: End with \`## Recap\` or \`## Summary\` - 2–3 bullet points reinforcing what was covered.

RULES:
1. Output RAW markdown only - never wrap your response in \`\`\`markdown or code fences.
2. Use \`##\` for every slide heading. Do NOT use \`#\` - only \`##\` so each section becomes a slide.
3. Keep each slide concise (2–5 bullet points or 1–2 short paragraphs). Slides are viewed one at a time.
4. Explain WHY concepts matter, not just WHAT they are. Be pedagogical and encouraging.
5. Do NOT include full code solutions - only brief snippets if they illustrate a concept, wrapped in \`\`\`javascript\`\`\`.
6. Write for a ${difficulty} learner. Use simple language, avoid jargon unless you explain it.
7. MARKDOWN FORMATTING:
   - For variable/state names: use INLINE code, e.g. \`roomCode\`, \`socket\` - never separate code blocks for single words.
   - Only use fenced code blocks (\`\`\`js\`\`\` or \`\`\`javascript\`\`\`) for multi-line code examples.
   - Use \`---\` between major sections if it improves readability.
   - No stray backticks or quotes on their own lines.`;

  try {
    let notes = await generateTextWithModel(
      prompt,
      { maxTokens: 1600, temperature: 0.35 },
      AI_LECTURE_MODEL,
    );
    notes = (notes || "").trim();
    // Strip wrapping code fences if AI wrapped response in ```markdown ... ```
    if (notes.startsWith("```")) {
      const firstNewline = notes.indexOf("\n");
      const closeFence = notes.indexOf("\n```", firstNewline + 1);
      if (closeFence !== -1)
        notes = notes.slice(firstNewline + 1, closeFence).trim();
      else
        notes = notes
          .replace(/^```\w*\n?/, "")
          .replace(/\n?```\s*$/, "")
          .trim();
    }
    return notes || "Could not generate lecture notes.";
  } catch (err) {
    throw new Error(err.message || "Lecture notes generation failed", {
      cause: err,
    });
  }
}

function normalizeAdminStep(raw) {
  const title = String(raw?.title ?? "")
    .trim()
    .slice(0, 200);
  const verifyType = STEP_VERIFY_TYPES.has(raw?.verifyType)
    ? raw.verifyType
    : "code";
  let expectedConsole = raw?.expectedConsole;
  if (verifyType !== "checkConsole") {
    expectedConsole = null;
  } else if (
    expectedConsole !== null &&
    expectedConsole !== undefined &&
    typeof expectedConsole !== "object"
  ) {
    expectedConsole = { type: "any" };
  }
  return {
    title: title || "Untitled step",
    instruction: String(raw?.instruction ?? "").slice(0, 4000),
    concept: String(raw?.concept ?? "").slice(0, 2000),
    verifyType,
    expectedConsole,
  };
}

/**
 * Generate 4–6 module steps for the admin panel (JSON), aligned with lesson content.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.description]
 * @param {string} [opts.content] - markdown lesson body
 * @param {string} [opts.category]
 * @param {string} [opts.difficulty]
 * @param {string} [opts.moduleType] - vanilla | react
 * @param {number} [opts.stepCount] - target count (clamped 4–6)
 * @returns {Promise<Array<object>>}
 */
async function generateModuleSteps(opts) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const title = String(opts?.title ?? "").trim();
  if (!title) throw new Error("title is required");

  const description = String(opts?.description ?? "").trim();
  const content = String(opts?.content ?? "").trim();
  const category = String(opts?.category ?? "").trim();
  const difficulty = String(opts?.difficulty ?? "beginner").trim();
  let n = parseInt(opts?.stepCount, 10);
  if (!Number.isFinite(n)) n = 5;
  n = Math.min(6, Math.max(4, n));

  const prompt = `You are a curriculum designer for a learn-to-code platform (game-themed lessons).

Create exactly ${n} sequential learning STEPS for one module. Each step is a small task the student completes in the code editor.

MODULE TITLE: ${title}
SHORT DESCRIPTION: ${description || "(none)"}
DIFFICULTY: ${difficulty}
CATEGORY: ${category || "(unspecified)"}
RUNTIME: Vanilla HTML / CSS / JavaScript in the browser (no React).

LESSON CONTENT (markdown, may be partial):
---
${content.slice(0, 6000) || "(no extra content — infer from title and description)"}
---

OUTPUT RULES — CRITICAL:
1. Reply with ONLY a JSON array (no markdown fences, no commentary).
2. Each element must be an object with these keys:
   - "title": short step name (string)
   - "instruction": what the student should do, plain text (string)
   - "concept": one sentence teaching the idea for an optional MCQ (string)
   - "verifyType": one of "code" | "checkConsole" | "checkComments"
   - "expectedConsole": null OR an object — only when verifyType is "checkConsole"
3. Use "checkConsole" when the step is about console.log / seeing output; set expectedConsole to {"type":"any"} for one line, {"type":"multipleLines"} when multiple logs are required.
4. Use "checkComments" when the step only requires adding meaningful comments (no console output needed). expectedConsole must be null.
5. Use "code" for steps verified against the student's code (variables, functions, DOM, canvas, etc.). expectedConsole must be null.
6. Steps must build in order; later steps may assume earlier ones are done.
7. Keep instructions concrete and appropriate for ${difficulty} level.
8. Assume module starter code will be a minimal scaffold only (not a full solution); each step must require the student to add or change code that is not already correctly implemented in such a scaffold.`;

  const raw = await generateTextWithModel(
    prompt,
    { maxTokens: 2500, temperature: 0.35 },
    AI_GENERAL_MODEL,
  );

  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    const firstNl = text.indexOf("\n");
    const close = text.indexOf("\n```", firstNl + 1);
    if (close !== -1) {
      text = text.slice(firstNl + 1, close).trim();
    } else {
      text = text
        .replace(/^```\w*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON for steps");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI did not return a steps array");
  }

  return parsed.slice(0, 8).map(normalizeAdminStep);
}

const CURRICULUM_PARTS = new Set(["objectives", "hints", "starterCode"]);

function stripAiJsonBlock(raw) {
  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    const firstNl = text.indexOf("\n");
    const close = text.indexOf("\n```", firstNl + 1);
    if (close !== -1) {
      text = text.slice(firstNl + 1, close).trim();
    } else {
      text = text
        .replace(/^```\w*\n?/, "")
        .replace(/\n?```\s*$/, "")
        .trim();
    }
  }
  return text;
}

function normalizeStarterCodeForAdmin(raw) {
  const d = (v) => String(v ?? "");
  const sc = raw && typeof raw === "object" ? raw : {};
  return {
    html: d(sc.html).slice(0, 24_000),
    css: d(sc.css).slice(0, 16_000),
    javascript: d(sc.javascript).slice(0, 24_000),
    jsx: "",
    serverJs: d(sc.serverJs).slice(0, 24_000),
  };
}

const FALLBACK_STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Lesson</title>
</head>
<body>
  <h1>Module starter</h1>
  <p>Edit HTML, CSS, and JavaScript in the editor.</p>
</body>
</html>`;

const FALLBACK_STARTER_CSS = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  padding: 1rem;
  background: #0f172a;
  color: #e2e8f0;
}

h1 {
  font-size: 1.25rem;
  color: #38bdf8;
}`;

const FALLBACK_STARTER_JS = "// Write your JavaScript here\n";

/**
 * Admin modules use vanilla HTML/CSS/JS only. Never omit html, css, or javascript.
 */
function ensureVanillaStarterCode(sc, moduleTitle) {
  const out = normalizeStarterCodeForAdmin(sc);
  out.jsx = "";
  const safeTitle = String(moduleTitle || "Lesson")
    .trim()
    .slice(0, 80)
    .replace(/</g, "");
  if (!out.html.trim()) {
    out.html = FALLBACK_STARTER_HTML.replace(
      "Module starter",
      safeTitle || "Module starter",
    );
  }
  if (!out.css.trim()) {
    out.css = FALLBACK_STARTER_CSS;
  }
  if (!out.javascript.trim()) {
    out.javascript = FALLBACK_STARTER_JS;
  }
  return out;
}

/**
 * Generate objectives, hints, and/or starter code for admin module editor.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.description]
 * @param {string} [opts.content]
 * @param {string} [opts.category]
 * @param {string} [opts.difficulty]
 * @param {string} [opts.moduleType]
 * @param {('objectives'|'hints'|'starterCode')[]} opts.parts
 * @param {Array<{title?:string,instruction?:string}>} [opts.steps] - optional context
 * @returns {Promise<{objectives?: string[], hints?: string[], starterCode?: object}>}
 */
async function generateModuleCurriculumParts(opts) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const title = String(opts?.title ?? "").trim();
  if (!title) throw new Error("title is required");

  let parts = Array.isArray(opts?.parts) ? opts.parts : [];
  parts = [...new Set(parts.filter((p) => CURRICULUM_PARTS.has(p)))];
  if (parts.length === 0) {
    throw new Error(
      "parts must include at least one of: objectives, hints, starterCode",
    );
  }

  const description = String(opts?.description ?? "").trim();
  const content = String(opts?.content ?? "").trim();
  const category = String(opts?.category ?? "").trim();
  const difficulty = String(opts?.difficulty ?? "beginner").trim();

  const stepsLines = Array.isArray(opts?.steps)
    ? opts.steps
        .map((s, i) => {
          const t = String(s?.title ?? "").trim();
          const ins = String(s?.instruction ?? "")
            .trim()
            .slice(0, 600);
          return t
            ? `${i + 1}. ${t}${ins ? `\n   What the student must do: ${ins}` : ""}`
            : null;
        })
        .filter(Boolean)
    : [];
  const stepsBlock =
    stepsLines.length > 0
      ? `\nEXISTING STEPS (starter code must NOT already accomplish these — leave work for the student):\n${stepsLines.join("\n\n")}\n`
      : "";

  const keyList = parts.map((p) => `"${p}"`).join(", ");
  const partRules = [];
  if (parts.includes("objectives")) {
    partRules.push(
      `"objectives": JSON array of exactly 3 to 5 short strings. Each is a clear, measurable learning goal for this module (no numbering prefix in the string).`,
    );
  }
  if (parts.includes("hints")) {
    partRules.push(
      `"hints": JSON array of exactly 4 to 6 short strings. Gentle nudges for stuck learners; do NOT give full solutions or complete code answers.`,
    );
  }
  if (parts.includes("starterCode")) {
    const isMultiplayerCat = category === "multiplayer";
    const serverPart = isMultiplayerCat
      ? `CATEGORY is multiplayer: include a non-empty "serverJs" scaffold only (Node/Socket.IO style) — listen/setup stubs without implementing full game sync or completing lesson logic in the starter.`
      : `CATEGORY is NOT multiplayer: set "serverJs" to exactly "" (empty string).`;
    partRules.push(
      `"starterCode": JSON object with string fields ONLY: html, css, javascript, jsx, serverJs. RUNTIME is always vanilla browser HTML/CSS/JS — NOT React. SCAFFOLD ONLY — this is the code loaded BEFORE the student starts. You MUST NOT implement the lesson outcome, game logic, step tasks, console.log outputs required by steps, or full event handlers that complete the project. Use: empty or stub function bodies, // TODO markers, placeholder values, and wiring only (e.g. canvas element in HTML, querySelector variables set to null or unused) so the student still has meaningful edits to make. If steps are listed above, the starter must intentionally leave every step's core work undone. You MUST include all three: "html", "css", and "javascript" as NON-EMPTY strings. "html": valid HTML document with structural elements for the lesson but no inline scripts that complete tasks. "css": layout/typography/theme only — no cheating by hiding required work. "javascript": comments, empty stubs, or minimal boilerplate (e.g. const canvas = document.getElementById('gameCanvas');) WITHOUT drawing, game loop, or completing instructions. "jsx": MUST be exactly "" (empty string). ${serverPart}`,
    );
  }

  const prompt = `You are a curriculum assistant for a game-themed coding education app.

MODULE TITLE: ${title}
DESCRIPTION: ${description || "(none)"}
DIFFICULTY: ${difficulty}
CATEGORY: ${category || "(unspecified)"}
RUNTIME: Vanilla HTML / CSS / JavaScript in the browser (no React, no JSX).

LESSON CONTENT (markdown):
---
${content.slice(0, 8000) || "(infer from title and description only)"}
---
${stepsBlock}
Generate ONLY the following JSON object keys: ${keyList}
Do not include any other top-level keys.

Rules for each key:
${partRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

OUTPUT RULES — CRITICAL:
1. Reply with ONLY one JSON object (no markdown fences, no commentary).
2. Escape newlines inside strings as \\n when needed; keep strings valid JSON.
3. Starter "html", "css", and "javascript" must all be non-empty and syntactically plausible for ${difficulty} learners.
${
  parts.includes("starterCode")
    ? `4. Starter code is INCOMPLETE by design: a new learner following the steps must still write or change JavaScript (and sometimes HTML/CSS) to pass verification — do not ship a working solution. If no steps were listed, still avoid a finished mini-project; use skeleton only.
5. Never put complete game loops, full implementations of step instructions, or final console.log outputs in the starter; those belong in the student's edits.`
    : ""
}`;

  const raw = await generateTextWithModel(
    prompt,
    {
      maxTokens: parts.includes("starterCode") ? 5000 : 1200,
      temperature: parts.includes("starterCode") ? 0.25 : 0.35,
    },
    AI_GENERAL_MODEL,
  );

  let parsed;
  try {
    parsed = JSON.parse(stripAiJsonBlock(raw));
  } catch {
    throw new Error("AI returned invalid JSON for curriculum parts");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned invalid curriculum payload");
  }

  const out = {};
  if (parts.includes("objectives")) {
    const arr = Array.isArray(parsed.objectives) ? parsed.objectives : [];
    out.objectives = arr
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .slice(0, 8);
    if (out.objectives.length === 0) {
      throw new Error("AI did not return objectives");
    }
  }
  if (parts.includes("hints")) {
    const arr = Array.isArray(parsed.hints) ? parsed.hints : [];
    out.hints = arr
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .slice(0, 12);
    if (out.hints.length === 0) {
      throw new Error("AI did not return hints");
    }
  }
  if (parts.includes("starterCode")) {
    if (!parsed.starterCode || typeof parsed.starterCode !== "object") {
      throw new Error("AI did not return starterCode object");
    }
    const isMultiplayerCat = category === "multiplayer";
    out.starterCode = ensureVanillaStarterCode(parsed.starterCode, title);
    if (!isMultiplayerCat) out.starterCode.serverJs = "";
  }

  return out;
}

module.exports = {
  generateTextWithModel,
  summarizeCodeToMarkdown,
  verifyTutorResponse,
  verifyCodeSummary,
  generateMCQs,
  verifyMCQAnswer,
  explain,
  generateLectureNotes,
  generateModuleSteps,
  generateModuleCurriculumParts,
};
