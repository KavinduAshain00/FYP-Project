const githubModels = require("./githubModelsService");
const { AI_MODEL, AI_MCQ_MODEL, AI_LECTURE_MODEL } = require("../constants/ai");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

module.exports = {
  generateTextWithModel,
  summarizeCodeToMarkdown,
  verifyTutorResponse,
  verifyCodeSummary,
  generateMCQs,
  verifyMCQAnswer,
  explain,
  generateLectureNotes,
};
