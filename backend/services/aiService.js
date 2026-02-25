const { Ollama } = require("ollama");
const {
  OLLAMA_HOST,
  OLLAMA_MODEL,
  OLLAMA_MCQ_MODEL,
  OLLAMA_CODER_MODEL,
  OLLAMA_STEP_MODEL,
} = require("../constants/ai");

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

if (!OLLAMA_API_KEY) {
  console.warn("Warning: OLLAMA_API_KEY not set. Ollama calls will fail until configured.");
}

const ollama = new Ollama({
  host: OLLAMA_HOST,
  headers: { Authorization: `Bearer ${OLLAMA_API_KEY}` },
});

console.log(`Using Ollama at ${OLLAMA_HOST} with model ${OLLAMA_MODEL}`);

/**
 * Single entry point for chat completion. Uses main model unless overridden.
 */
async function generateText(prompt, options = {}) {
  return generateTextWithModel(prompt, options, OLLAMA_MODEL);
}

async function generateTextWithModel(prompt, options = {}, model = OLLAMA_MODEL) {
  if (!OLLAMA_API_KEY) throw new Error("OLLAMA_API_KEY not configured");
  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        temperature: options.temperature ?? 0.2,
        num_predict: options.maxTokens ?? 512,
      },
    });
    const msg = response.message;
    if (msg && typeof msg.content === "string" && msg.content.trim()) {
      return msg.content.trim();
    }
    return "";
  } catch (err) {
    throw new Error(`Ollama API error: ${err.message || err}`, { cause: err });
  }
}

/**
 * Summarize user code into short markdown for the tutor. One call, no verification.
 */
async function summarizeCodeToMarkdown(codeByFile) {
  if (!OLLAMA_API_KEY) return "Code context unavailable.";
  const parts = [];
  if (codeByFile.html) parts.push(`HTML: ${codeByFile.html.substring(0, 400).replace(/\n/g, " ")}`);
  if (codeByFile.css) parts.push(`CSS: ${codeByFile.css.substring(0, 400).replace(/\n/g, " ")}`);
  if (codeByFile.javascript) parts.push(`JavaScript: ${codeByFile.javascript.substring(0, 600).replace(/\n/g, " ")}`);
  if (codeByFile.jsx) parts.push(`JSX: ${codeByFile.jsx.substring(0, 600).replace(/\n/g, " ")}`);
  if (parts.length === 0) return "No code provided.";

  const prompt = `Summarize this code in 2-4 bullet points. Describe only what is present; do not add or fix anything.

${parts.join("\n\n")}

Output: markdown bullets only, no preamble or code blocks.`;
  try {
    const raw = await generateText(prompt, { maxTokens: 256, temperature: 0.1 });
    const summary = raw.trim().replace(/^```\w*\n?|```$/g, "").trim();
    return summary || "Code context could not be summarized.";
  } catch {
    return "Code context could not be summarized.";
  }
}

/**
 * Quick sanity check: response is non-empty and relevant (no second LLM call).
 */
function verifyTutorResponseSimple(question, response) {
  if (!response || typeof response !== "string") return { ok: false, reason: "Empty response" };
  const r = response.trim();
  if (r.length < 10) return { ok: false, reason: "Too short" };
  if (r.length > 4000) return { ok: false, reason: "Too long" };
  if (/<\s*script|eval\s*\(|javascript\s*:/i.test(r)) return { ok: false, reason: "Unsafe content" };
  return { ok: true };
}

/**
 * Verify tutor response. Uses simple checks only (no extra LLM call) for speed.
 */
function verifyTutorResponse(question, response) {
  return Promise.resolve(verifyTutorResponseSimple(question, response));
}

/**
 * Generate MCQs for a step. Returns { questions: [{ question, options, correctIndex }] }.
 */
async function generateMCQs(stepTitle, stepConcept, moduleTitle, count = 2) {
  if (!OLLAMA_API_KEY) return { questions: [] };
  const prompt = `Generate exactly ${count} multiple-choice question(s) about this programming concept. Clear and focused.

MODULE: ${moduleTitle || "Programming"}
STEP/CONCEPT: ${stepTitle}
${stepConcept ? `DETAIL: ${stepConcept}` : ""}

Output ONLY valid JSON: {"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]}
correctIndex is 0-based. Exactly 4 options per question.`;
  try {
    const raw = await generateTextWithModel(prompt, { maxTokens: 800, temperature: 0.4 }, OLLAMA_MCQ_MODEL);
    const trimmed = raw.trim().replace(/^```\w*\n?|```$/g, "").trim();
    const data = JSON.parse(trimmed);
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return {
      questions: questions.slice(0, count).filter(
        (q) => q.question && Array.isArray(q.options) && typeof q.correctIndex === "number"
      ),
    };
  } catch {
    return { questions: [] };
  }
}

/**
 * Explain why an MCQ answer is wrong (or confirm correct). Returns { correct, explanation }.
 */
async function verifyMCQAnswer(question, options, correctIndex, selectedIndex) {
  if (!OLLAMA_API_KEY) {
    return {
      correct: selectedIndex === correctIndex,
      explanation: "Verification unavailable.",
    };
  }
  if (selectedIndex === correctIndex) {
    return { correct: true, explanation: "Correct! Well done." };
  }
  const correctText = options[correctIndex];
  const selectedText = options[selectedIndex];
  const prompt = `You are a programming tutor. The student chose the wrong answer. Explain briefly WHY their choice is wrong and WHY the correct answer is right (2-4 sentences). Be clear and encouraging.

QUESTION: ${question}
OPTIONS: ${(options || []).map((o, i) => `[${i}] ${o}`).join(" | ")}
CORRECT: index ${correctIndex} ("${correctText}")
STUDENT CHOSE: index ${selectedIndex} ("${selectedText}")

Reply with only the explanation, no preamble.`;
  try {
    const explanation = await generateTextWithModel(
      prompt,
      { maxTokens: 256, temperature: 0.3 },
      OLLAMA_MCQ_MODEL
    );
    return {
      correct: false,
      explanation: (explanation || "").trim() || "That option is incorrect. Review the concept and try again.",
    };
  } catch {
    return {
      correct: false,
      explanation: `That option is incorrect. The correct answer is option ${correctIndex + 1}.`,
    };
  }
}

/**
 * Generate React game starter code from planning. Returns raw code string.
 */
async function generateGameStarterCode(planning) {
  if (!OLLAMA_API_KEY) throw new Error("OLLAMA_API_KEY not configured");
  const name = planning.name || "My Game";
  const description = planning.description || "A fun game";
  const mechanics = planning.mechanics || planning.mechanicsText || "Score, basic controls";
  const gameLoop = planning.gameLoop || planning.gameLoopText || "Start → Play → Win/Lose → Restart";
  const coreFeatures = planning.coreFeatures || "Menu, playing state, score display";
  const winLose = planning.winLoseConditions || planning.winLoseConditionsText || "Lose when lives reach 0";
  const isMultiplayer = planning.gameMode === "multiplayer" || planning.isMultiplayer;

  const prompt = `You are an expert React game developer. Generate starter code for a browser game.

GAME: ${name}
DESCRIPTION: ${description}
MODE: ${isMultiplayer ? "Multiplayer (2-player turn-based)" : "Single Player"}
MECHANICS: ${mechanics}
GAME LOOP: ${gameLoop}
FEATURES: ${coreFeatures}
WIN/LOSE: ${winLose}

Use React (functional components, useState, useEffect). Include states: menu, playing, paused, gameover. Add keyboard controls (Space, Escape). Include score/progress. Add brief comments. Output code blocks with labels: App.jsx, App.css, and optionally src/utils/gameLogic.js. Use \`\`\`jsx and \`\`\`css. Make it runnable.`;
  try {
    const raw = await generateTextWithModel(
      prompt,
      { maxTokens: 4096, temperature: 0.3 },
      OLLAMA_CODER_MODEL
    );
    return (raw || "").trim();
  } catch (err) {
    throw new Error(`Starter code generation failed: ${err.message || err}`, { cause: err });
  }
}

/**
 * Explain a highlighted code snippet. Concise, educational.
 */
async function explainCodeSnippet(code, language = "javascript") {
  if (!OLLAMA_API_KEY) throw new Error("OLLAMA_API_KEY not configured");
  if (!code || !code.trim()) throw new Error("No code provided");
  const prompt = `You are a programming tutor. Explain this code clearly in 3-6 sentences: what it does, key concepts, and one tip.

Code (${language}):
\`\`\`${language}
${code.substring(0, 2000)}
\`\`\`

Do not repeat the code in full. Use simple language.`;
  try {
    const explanation = await generateText(prompt, { maxTokens: 400, temperature: 0.3 });
    return (explanation || "").trim() || "Could not generate explanation.";
  } catch (err) {
    throw new Error(err.message || "Explanation failed");
  }
}

/**
 * Generate step-by-step instructions for a module from its content and objectives.
 * Returns { steps: [{ title, instruction, concept, verifyType, expectedConsole }] }
 */
async function generateModuleSteps(moduleTitle, content, objectives, difficulty) {
  if (!OLLAMA_API_KEY) return { steps: [] };
  const objList = Array.isArray(objectives) ? objectives.join("\n- ") : (objectives || "Complete the lesson");
  const prompt = `You are an expert programming instructor. Generate exactly 4 learning steps for a coding module. Each step must be a small, verifiable task the student performs in an online code editor.

MODULE TITLE: ${moduleTitle}
DIFFICULTY: ${difficulty || "beginner"}
OBJECTIVES:
- ${objList}

CONTENT (lesson material the student reads):
${(content || "").substring(0, 2000)}

Output ONLY valid JSON (no markdown, no preamble):
{"steps":[{"title":"short action title","instruction":"detailed instruction for the student","concept":"one-sentence concept the step teaches","verifyType":"code","expectedConsole":null}]}

Rules:
- Exactly 4 steps.
- verifyType is one of: "code", "checkConsole", "checkComments". Default "code".
- expectedConsole is null unless verifyType is "checkConsole" (then use { "type": "any" } or { "exactLine": "..." } or { "type": "multipleLines" }).
- Steps should progress from simple to integrative.
- instruction should be 1-3 sentences telling the student exactly what to do.
- concept should be 1 sentence explaining the idea behind the step.`;

  try {
    const raw = await generateTextWithModel(prompt, { maxTokens: 1200, temperature: 0.3 }, OLLAMA_STEP_MODEL);
    const trimmed = raw.trim().replace(/^```\w*\n?|```$/g, "").trim();
    const data = JSON.parse(trimmed);
    const steps = Array.isArray(data.steps) ? data.steps : [];
    return {
      steps: steps.slice(0, 5).filter(
        (s) => s.title && s.instruction
      ).map((s) => ({
        title: s.title,
        instruction: s.instruction || s.title,
        concept: s.concept || "",
        verifyType: ["code", "checkConsole", "checkComments"].includes(s.verifyType) ? s.verifyType : "code",
        expectedConsole: s.expectedConsole || null,
      })),
    };
  } catch (err) {
    console.error("Step generation error:", err.message || err);
    return { steps: [] };
  }
}

/**
 * Generate hints for a module from its content and objectives.
 * Returns { hints: ["hint1", "hint2", ...] }
 */
async function generateModuleHints(moduleTitle, content, objectives) {
  if (!OLLAMA_API_KEY) return { hints: [] };
  const objList = Array.isArray(objectives) ? objectives.join(", ") : (objectives || "");
  const prompt = `You are a programming tutor. Generate 3-4 short, helpful hints for a student working on this module. Each hint should nudge without giving away the answer.

MODULE: ${moduleTitle}
OBJECTIVES: ${objList}
CONTENT SUMMARY: ${(content || "").substring(0, 800)}

Output ONLY valid JSON: {"hints":["hint1","hint2","hint3"]}
Each hint: 1 short sentence. No preamble.`;

  try {
    const raw = await generateTextWithModel(prompt, { maxTokens: 400, temperature: 0.3 }, OLLAMA_STEP_MODEL);
    const trimmed = raw.trim().replace(/^```\w*\n?|```$/g, "").trim();
    const data = JSON.parse(trimmed);
    return { hints: Array.isArray(data.hints) ? data.hints.slice(0, 5) : [] };
  } catch (err) {
    console.error("Hint generation error:", err.message || err);
    return { hints: [] };
  }
}

/**
 * Generate starter code for a module from its content, objectives, and category.
 * Returns { starterCode: { html, css, javascript, jsx } }
 */
async function generateModuleStarterCode(moduleTitle, content, objectives, category, moduleType) {
  if (!OLLAMA_API_KEY) throw new Error("OLLAMA_API_KEY not configured");
  const isReact = moduleType === "react" || ["react-fundamentals", "react-game-dev", "advanced-concepts"].includes(category);
  const objList = Array.isArray(objectives) ? objectives.join(", ") : (objectives || "");

  const prompt = `You are an expert web developer. Generate starter code for a coding lesson. The student will modify this code to complete the objectives.

MODULE: ${moduleTitle}
CATEGORY: ${category || "javascript-basics"}
TYPE: ${isReact ? "React (JSX)" : "Vanilla (HTML/CSS/JS)"}
OBJECTIVES: ${objList}
CONTENT SUMMARY: ${(content || "").substring(0, 1200)}

Output ONLY valid JSON with starter code (the code students START with, not the finished solution):
${isReact
  ? '{"starterCode":{"html":"","css":"basic styles","javascript":"","jsx":"import React ...starter JSX"}}'
  : '{"starterCode":{"html":"<!DOCTYPE html>...basic page","css":"basic styles","javascript":"console.log(\\"Ready!\\");\\n// TODO comments guiding the student","jsx":""}}'
}

Rules:
- html: a simple HTML page with appropriate elements (canvas, divs, buttons) for the lesson.
- css: basic styling (body padding, fonts, colors).
- javascript: a console.log("Ready!") line and TODO comments guiding the student through the objectives. Do NOT include the solution.
- jsx: only if React module; otherwise empty string.
- Keep code concise. Add guiding comments like "// Step 1: ..." so the student knows where to write code.
- The starter code should be INCOMPLETE — the student completes it by following the steps.`;

  try {
    const raw = await generateTextWithModel(prompt, { maxTokens: 2000, temperature: 0.3 }, OLLAMA_STEP_MODEL);
    const trimmed = raw.trim().replace(/^```\w*\n?|```$/g, "").trim();
    const data = JSON.parse(trimmed);
    const sc = data.starterCode || {};
    return {
      starterCode: {
        html: sc.html || '<!DOCTYPE html>\n<html>\n<head><title>Lesson</title></head>\n<body>\n  <h1>Open the console</h1>\n</body>\n</html>',
        css: sc.css || 'body { font-family: Arial, sans-serif; padding: 24px; background: #f4f6fb; }',
        javascript: sc.javascript || 'console.log("Ready! Add your code below.");\n',
        jsx: sc.jsx || "",
      },
    };
  } catch (err) {
    console.error("Starter code generation error:", err.message || err);
    // Return sensible defaults
    return {
      starterCode: {
        html: '<!DOCTYPE html>\n<html>\n<head><title>Lesson</title></head>\n<body>\n  <h1>Open the console</h1>\n</body>\n</html>',
        css: 'body { font-family: Arial, sans-serif; padding: 24px; background: #f4f6fb; }',
        javascript: 'console.log("Ready! Add your code below.");\n',
        jsx: "",
      },
    };
  }
}

module.exports = {
  generateText,
  generateTextWithModel,
  summarizeCodeToMarkdown,
  verifyTutorResponse,
  generateMCQs,
  verifyMCQAnswer,
  generateGameStarterCode,
  explainCodeSnippet,
  generateModuleSteps,
  generateModuleHints,
  generateModuleStarterCode,
};
