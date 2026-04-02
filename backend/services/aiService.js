const githubModels = require("./githubModelsService");
const {
  AI_MODEL,
  AI_MCQ_MODEL,
  AI_LECTURE_MODEL,
  AI_GENERAL_MODEL,
} = require("../constants/ai");
const { debug } = require("../utils/logger");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const STEP_VERIFY_TYPES = new Set(["code", "checkConsole", "checkComments"]);

// Appended to prompts so tutor copy stays warm and scannable.
const USER_REPLY_STYLE = `--- How your answer should feel (learners read this) ---
  Voice    Warm, patient, encouraging—like a supportive coach, not a cold manual.
  Layout   Short paragraphs; use bullet lists when you give several steps or ideas.
  Emojis   A few purposeful ones (💡 tip, ✅ cheer, ⚠️ caution, 🎯 focus)—never every line.`;

if (!GITHUB_TOKEN) {
  console.warn(
    "Warning: GITHUB_TOKEN not set. GitHub Models calls will fail until configured.",
  );
}

debug(`Using GitHub Models with model ${AI_MODEL}`);

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
  if (parts.length === 0) return "No code provided.";

  const prompt = `You create short, accurate code summaries for a live tutor. Stay grounded in what you see—no imagination.

--- Your job ---
  • Read the excerpts below.
  • Write ONLY 2–4 markdown bullet points describing what is actually there.
  • Do NOT add features, fix bugs, or mention code that does not appear.

${USER_REPLY_STYLE}

--- Excerpts ---
${parts.join("\n\n")}

--- Output ---
Markdown bullets only. No intro line. No fenced code blocks.`;
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

async function verifyTutorResponse(question, response) {
  if (!GITHUB_TOKEN) return { ok: true };
  const prompt = `You are a careful fact-checker for educational AI answers.

--- QUESTION (truncated) ---
${question.substring(0, 300)}

--- RESPONSE TO CHECK ---
${response.substring(0, 800)}

--- YOUR TASK ---
Reply with ONLY a JSON object, nothing else:
  • {"ok": true}  → helpful, on-topic, no invented code or facts
  • {"ok": false, "reason": "brief reason"}  → harmful, off-topic, or fabricates details

Rules: no markdown fences, no extra keys, no explanation outside the JSON.`;
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

async function verifyCodeSummary(codeExcerpt, summary) {
  if (!GITHUB_TOKEN) return true;
  const prompt = `You verify whether a short summary stays faithful to code.

--- CODE EXCERPT ---
${(codeExcerpt || "").substring(0, 500)}

--- SUMMARY TO CHECK ---
${summary.substring(0, 400)}

--- RULE ---
Answer with ONLY the word YES or NO (uppercase).
  YES → summary describes only what is really in the excerpt.
  NO  → summary adds features, fixes, or details not in the code.

Your answer:`;
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

async function generateMCQs(stepTitle, stepConcept, moduleTitle, count = 2) {
  if (!GITHUB_TOKEN) return { questions: [] };

  const prompt = `You write friendly, fair multiple-choice quizzes for a coding lesson. Build exactly ${count} question(s).

--- Context ---
  Module: ${moduleTitle || "Programming"}
  Step: ${stepTitle}
${stepConcept ? `  Teaching focus (stick to this; do not drift into unrelated topics):\n  ${stepConcept}` : ""}

--- Fairness (non-negotiable) ---
  • Each question has exactly ONE correct option; the other three must be clearly wrong for that wording.
  • Before you output: if an expert could defend a second option, rewrite the question or replace distractors.
  • Anchor questions in THIS step when needed ("In this step…", "From what you practiced…").

--- Distractors ---
  • Three different wrong ideas (common mistake, wrong API name, reversed cause/effect, plausible but false behavior).
  • Never two options that are both valid answers.
  • Avoid vague "it depends" unless the question is truly about that.
  • Each option: one short line (~120 chars max), concrete, meaningfully different from the others.

--- Friendly look ---
  • You may start each question string with one relevant emoji. Keep option text plain (no emojis inside options).

--- Output (machine-readable) ---
  Return ONLY one JSON object—no markdown fences, no chat before or after.
  Shape: {"questions":[{"question":"...","options":["opt0","opt1","opt2","opt3"],"correctIndex":0}]}
  correctIndex is 0-based. Exactly four options per question.`;

  const parseQuestions = (raw) => {
    const trimmed = raw
      .trim()
      .replace(/^```\w*\n?|```$/g, "")
      .trim();
    const data = JSON.parse(trimmed);
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return questions
      .slice(0, count)
      .filter((q) => {
        if (
          !q.question ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          typeof q.correctIndex !== "number" ||
          q.correctIndex < 0 ||
          q.correctIndex > 3
        ) {
          return false;
        }
        const opts = q.options.map((o) => String(o).trim()).filter(Boolean);
        if (opts.length !== 4) return false;
        const keys = new Set(opts.map((o) => o.toLowerCase()));
        if (keys.size !== 4) return false;
        return true;
      })
      .map((q) => ({
        ...q,
        question: String(q.question).trim(),
        options: q.options.map((o) => String(o).trim()),
      }));
  };

  try {
    let raw = await generateTextWithModel(
      prompt,
      { maxTokens: 900, temperature: 0.35 },
      AI_MCQ_MODEL,
    );
    let questions = parseQuestions(raw);
    if (questions.length === 0 && raw.trim()) {
      raw = await generateTextWithModel(
        prompt,
        { maxTokens: 900, temperature: 0.15 },
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

  const prompt = `You are a kind programming tutor. The learner picked the wrong MCQ option—help them understand, not feel bad.

${USER_REPLY_STYLE}

--- The question ---
${question}

--- Options ---
${(options || []).map((o, i) => `  [${i}] ${o}`).join("\n")}

--- Answer key ---
  Correct index: ${correctIndex} ("${correctText}")
  Student chose: ${selectedIndex} ("${selectedText}")

--- Your reply ---
  • 2–4 sentences only. No opening like "The correct answer is…".
  • Explain WHY their choice misses the mark and WHY the right idea fits.
  • Plain text only (this feeds straight into the UI).`;

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

async function explain(opts) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const type = opts?.type;
  const language = opts?.language ?? "javascript";

  if (type === "code") {
    const code = opts?.code;
    if (!code || !String(code).trim()) throw new Error("No code provided");
    const prompt = `You are a friendly programming tutor. The learner highlighted code and wants to understand it.

${USER_REPLY_STYLE}

--- Code (${language}) ---
\`\`\`${language}
${String(code).substring(0, 2000)}
\`\`\`

--- Cover these gently (about 3–6 sentences total) ---
  1. What the snippet does in everyday language
  2. Main ideas or syntax worth noticing
  3. One practical tip or pitfall (if it helps)

Do not dump the whole code back. Keep language simple and inviting.`;
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
    const prompt = `You are a calm programming tutor. The learner hit an error and wants clarity, not panic.

${USER_REPLY_STYLE}

--- Error message ---
${String(errorMessage).substring(0, 600)}
${codeBlock}

--- Explain in 2–3 short, friendly paragraphs ---
  1. What the message is trying to say (plain English)
  2. Typical causes (typo, type mismatch, missing bracket, etc.)
  3. What to inspect or try first—ideas only, not a full pasted fix

Never hand them the complete corrected program; empower them to fix it.`;
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

async function generateLectureNotes(opts) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const overview = opts?.overview;
  const moduleTitle = opts?.moduleTitle || "This lesson";
  if (!overview || !String(overview).trim())
    throw new Error("overview (string) is required");

  const steps = Array.isArray(opts?.steps) ? opts.steps : [];
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

  const prompt = `You are a warm, clear programming instructor. Turn the overview below into inviting lecture slides learners swipe through one at a time.

--- Module ---
  Title: ${moduleTitle}
  Level: ${difficulty}
${category ? `  Category: ${category}` : ""}${stepsSection}${personalization}

--- Source material (summary) ---
${String(overview).substring(0, 2000)}

--- Slide flow (use 2–4 slides total) ---
  • First slide: \`## What You'll Learn\` with 3–4 crisp bullets of takeaways.
  • Middle slide(s): one big idea each; friendly headings like \`## How It Works\` or \`## Key Concepts\`.
  • Last slide: \`## Recap\` or \`## Summary\` with 2–3 reinforcing bullets.

--- Quality bar ---
  • Explain WHY ideas matter, not only WHAT they are.
  • Audience: ${difficulty}—simple words; define jargon when you use it.
  • No full solutions; tiny code samples only inside \`\`\`javascript\`\`\` fences when they teach a point.
  • Each slide: 2–5 bullets or 1–2 short paragraphs so nothing feels like a wall of text.

--- Markdown rules ---
  • Output RAW markdown only (never wrap the whole answer in \`\`\`markdown\`\`\`).
  • Every slide starts with \`## Heading\`. Do not use a single \`#\` top-level title.
  • Names like \`playerScore\` use inline backticks—not their own code block.
  • Multi-line examples only in fenced \`\`\`js\`\`\` or \`\`\`javascript\`\`\` blocks.
  • Optional \`---\` between sections if it helps the eye.

--- Voice on the slides ---
${USER_REPLY_STYLE}
  You may use light emoji in bullet text; headings can stay plain or include one emoji if it stays readable.`;

  try {
    let notes = await generateTextWithModel(
      prompt,
      { maxTokens: 1600, temperature: 0.35 },
      AI_LECTURE_MODEL,
    );
    notes = (notes || "").trim();
    // Strip wrapping ```markdown ... ``` fences from the response
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

  const prompt = `You design bite-sized lesson steps for a playful, game-themed coding platform. Each step is something the learner does in the editor—not a lecture.

--- Module snapshot ---
  Title: ${title}
  Blurb: ${description || "(none)"}
  Level: ${difficulty}
  Category: ${category || "(unspecified)"}
  Stack: Vanilla HTML, CSS, JavaScript in the browser (no React).

--- Lesson content (may be partial) ---
${content.slice(0, 6000) || "(infer from title and description)"}

--- Build exactly ${n} steps ---
  • Order them so each step naturally follows the last.
  • Wording should feel doable and specific for a ${difficulty} learner.
  • Starter code is only a thin scaffold: every step must still require real edits the student has not already finished.

--- Each step object (JSON) ---
  "title"           Short, motivating name (optional leading emoji).
  "instruction"     Plain language: what to do, where to look, what “done” looks like.
  "concept"         One sentence that could back an MCQ.
  "verifyType"      One of: "code" | "checkConsole" | "checkComments"
  "expectedConsole" null unless verifyType is "checkConsole"

--- verifyType cheatsheet ---
  "checkConsole"    Step is about console.log / seeing output → expectedConsole {"type":"any"} (one line) or {"type":"multipleLines"}.
  "checkComments"   Only meaningful comments needed → expectedConsole must be null.
  "code"            DOM, variables, canvas, logic, etc. → expectedConsole null.

${USER_REPLY_STYLE}
  Apply voice/layout hints to "title" and "instruction" only (strings shown in the app).

--- Output ---
  Reply with ONLY a JSON array—no fences, no preamble.`;

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
    throw new Error("Invalid JSON in steps response");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Steps response was not a non-empty array");
  }

  return parsed.slice(0, 8).map(normalizeAdminStep);
}

const CURRICULUM_PARTS = new Set(["hints", "starterCode"]);

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

function ensureVanillaStarterCode(sc, moduleTitle) {
  const out = normalizeStarterCodeForAdmin(sc);
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

async function generateModuleCurriculumParts(opts) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const title = String(opts?.title ?? "").trim();
  if (!title) throw new Error("title is required");

  let parts = Array.isArray(opts?.parts) ? opts.parts : [];
  parts = [...new Set(parts.filter((p) => CURRICULUM_PARTS.has(p)))];
  if (parts.length === 0) {
    throw new Error("parts must include at least one of: hints, starterCode");
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
  if (parts.includes("hints")) {
    partRules.push(
      `"hints": JSON array of 4–6 short strings—warm nudges, never full solutions. ${USER_REPLY_STYLE} Each hint may start with one small emoji.`,
    );
  }
  if (parts.includes("starterCode")) {
    const isMultiplayerCat = category === "multiplayer";
    const serverPart = isMultiplayerCat
      ? `CATEGORY is multiplayer: include a non-empty "serverJs" scaffold only (Node/Socket.IO style) — listen/setup stubs without implementing full game sync or completing lesson logic in the starter.`
      : `CATEGORY is NOT multiplayer: set "serverJs" to exactly "" (empty string).`;
    partRules.push(
      `"starterCode": JSON object with string fields ONLY: html, css, javascript, serverJs. RUNTIME is always vanilla browser HTML/CSS/JS — NOT React or JSX. SCAFFOLD ONLY — this is the code loaded BEFORE the student starts. You MUST NOT implement the lesson outcome, game logic, step tasks, console.log outputs required by steps, or full event handlers that complete the project. Use: empty or stub function bodies, // TODO markers, placeholder values, and wiring only (e.g. canvas element in HTML, querySelector variables set to null or unused) so the student still has meaningful edits to make. If steps are listed above, the starter must intentionally leave every step's core work undone. You MUST include all three: "html", "css", and "javascript" as NON-EMPTY strings. "html": valid HTML document with structural elements for the lesson but no inline scripts that complete tasks. "css": layout/typography/theme only — no cheating by hiding required work. "javascript": comments, empty stubs, or minimal boilerplate (e.g. const canvas = document.getElementById('gameCanvas');) WITHOUT drawing, game loop, or completing instructions. ${serverPart}`,
    );
  }

  const prompt = `You help author curriculum for a game-flavored coding school: hints that feel human, and starter code that invites tinkering—not finished games.

--- Module ---
  Title: ${title}
  About: ${description || "(none)"}
  Level: ${difficulty}
  Category: ${category || "(unspecified)"}
  Stack: Vanilla HTML / CSS / JavaScript (no React, no JSX).

--- Lesson body ---
${content.slice(0, 8000) || "(infer from title and description)"}
${stepsBlock}
--- Produce ONLY these JSON keys ---
${keyList}
(No other top-level keys.)

--- Rules per key ---
${partRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

--- Output contract ---
1. One JSON object only—no markdown fences, no chit-chat.
2. Escape newlines inside strings as \\n; keep valid JSON.
3. If starterCode is included: "html", "css", and "javascript" must each be a non-empty, believable string for ${difficulty} learners.
${
  parts.includes("starterCode")
    ? `4. Starter stays deliberately incomplete: after loading it, the learner must still edit JS (and sometimes HTML/CSS) to pass checks—never ship a solved mini-game.
5. No finished game loops, no completed step logic, no final console.log outputs that satisfy the lesson; those belong in student code.`
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
    throw new Error("Invalid JSON in curriculum response");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid curriculum response payload");
  }

  const out = {};
  if (parts.includes("hints")) {
    const arr = Array.isArray(parsed.hints) ? parsed.hints : [];
    out.hints = arr
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .slice(0, 12);
    if (out.hints.length === 0) {
      throw new Error("Hints missing from response");
    }
  }
  if (parts.includes("starterCode")) {
    if (!parsed.starterCode || typeof parsed.starterCode !== "object") {
      throw new Error("starterCode missing from response");
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
