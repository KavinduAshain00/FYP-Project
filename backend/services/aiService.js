const { Ollama } = require("ollama");
const {
  OLLAMA_HOST,
  OLLAMA_MODEL,
  OLLAMA_MCQ_MODEL,
  OLLAMA_CODER_MODEL,
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

module.exports = {
  generateText,
  generateTextWithModel,
  summarizeCodeToMarkdown,
  verifyTutorResponse,
  generateMCQs,
  verifyMCQAnswer,
  generateGameStarterCode,
  explainCodeSnippet,
};
