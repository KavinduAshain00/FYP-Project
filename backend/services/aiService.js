const { Ollama } = require('ollama');
const { OLLAMA_HOST, OLLAMA_MODEL, OLLAMA_MCQ_MODEL, OLLAMA_CODER_MODEL, OLLAMA_MERMAID_MODEL } = require('../constants/ai');

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

if (!OLLAMA_API_KEY) {
  console.warn('Warning: OLLAMA_API_KEY not set. Ollama Cloud calls will fail until configured.');
}

const ollama = new Ollama({
  host: OLLAMA_HOST,
  headers: {
    Authorization: `Bearer ${OLLAMA_API_KEY}`,
  },
});

console.log(`Using Ollama at ${OLLAMA_HOST} with model ${OLLAMA_MODEL}`);

async function generateText(prompt, options = {}) {
  return generateTextWithModel(prompt, options, OLLAMA_MODEL);
}

/** Generate text with a specific model (e.g. qwen3-coder for MCQ). */
async function generateTextWithModel(prompt, options = {}, model = OLLAMA_MODEL) {
  if (!OLLAMA_API_KEY) throw new Error('OLLAMA_API_KEY not configured');

  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: options.temperature ?? 0.2,
        num_predict: options.maxTokens ?? 512,
      },
    });

    // Use only the assistant's reply text. Never expose thinking, model, or internal metadata.
    const msg = response.message;
    if (msg && typeof msg.content === 'string' && msg.content.trim()) {
      return msg.content.trim();
    }
    return ''; // Empty or thinking-only: return nothing; caller can show a friendly fallback
  } catch (err) {
    const message = err.message || String(err);
    throw new Error(`Ollama API error: ${message}`, { cause: err });
  }
}

async function generateMermaidDiagram(description, diagramType = 'flowchart', options = {}) {
  if (!OLLAMA_API_KEY) throw new Error('OLLAMA_API_KEY not configured');

  try {
    const prompt = `You are a Mermaid diagram expert. Generate ONLY valid Mermaid syntax based on the following description.

Description: ${description}
Diagram Type: ${diagramType}

Rules:
- Output ONLY the Mermaid syntax, no explanations or markdown code blocks
- For flowcharts, use proper flowchart syntax (e.g., graph TD, graph LR)
- For sequence diagrams, use sequenceDiagram
- For class diagrams, use classDiagram
- For state diagrams, use stateDiagram-v2
- For ER diagrams, use erDiagram
- Ensure all syntax is valid and properly formatted
- Use clear, descriptive node labels

Generate the Mermaid diagram now:`;

    const response = await ollama.chat({
      model: OLLAMA_MERMAID_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      options: {
        temperature: options.temperature ?? 0.3,
        num_predict: options.maxTokens ?? 1024,
      },
    });

    if (response.message && response.message.content) {
      let mermaidCode = response.message.content.trim();
      mermaidCode = mermaidCode.replace(/```mermaid\n?/g, '');
      mermaidCode = mermaidCode.replace(/```\n?/g, '');
      return mermaidCode.trim();
    }
    return JSON.stringify(response);
  } catch (err) {
    const message = err.message || String(err);
    throw new Error(`Ollama Mermaid generation error: ${message}`, { cause: err });
  }
}

/**
 * Summarize user code into a short markdown context (for tutor). No hallucinations:
 * only describe what is actually present in the code.
 */
async function summarizeCodeToMarkdown(codeByFile) {
  if (!OLLAMA_API_KEY) return 'Code context unavailable.';
  const parts = [];
  if (codeByFile.html) parts.push(`HTML (excerpt): ${codeByFile.html.substring(0, 400).replace(/\n/g, ' ')}`);
  if (codeByFile.css) parts.push(`CSS (excerpt): ${codeByFile.css.substring(0, 400).replace(/\n/g, ' ')}`);
  if (codeByFile.javascript) parts.push(`JavaScript (excerpt): ${codeByFile.javascript.substring(0, 600).replace(/\n/g, ' ')}`);
  if (codeByFile.jsx) parts.push(`JSX/React (excerpt): ${codeByFile.jsx.substring(0, 600).replace(/\n/g, ' ')}`);
  if (parts.length === 0) return 'No code provided.';

  const prompt = `You are a code summarizer. Given the following code excerpts, output ONLY a short markdown summary (2-4 bullet points) that describes what the code actually contains. Do NOT add features, fix bugs, or invent code that is not there. Only describe what is present.

${parts.join('\n\n')}

Output format: markdown bullet points only. No preamble. No code blocks.`;
  try {
    const raw = await generateText(prompt, { maxTokens: 256, temperature: 0.1 });
    const summary = raw.trim().replace(/^```\w*\n?|```$/g, '').trim();
    return summary || 'Code context could not be summarized.';
  } catch {
    return 'Code context could not be summarized.';
  }
}

/**
 * Verify that a tutor/hint response is safe and grounded: no fabricated code,
 * no harmful advice, and relevant to the question. Returns { ok: boolean, reason?: string }.
 */
async function verifyTutorResponse(question, response) {
  if (!OLLAMA_API_KEY) return { ok: true };
  const prompt = `You are a fact-checker for educational AI responses.

QUESTION: ${question.substring(0, 300)}

RESPONSE TO VERIFY: ${response.substring(0, 800)}

Rules:
1. Reply with ONLY a JSON object: {"ok": true} or {"ok": false, "reason": "brief reason"}.
2. Set ok to false if the response invents code or concepts not in the question/context, gives harmful or unsafe advice, or is clearly off-topic.
3. Set ok to true if the response is helpful, relevant, and does not fabricate facts.
4. No other text.`;
  try {
    const raw = await generateText(prompt, { maxTokens: 128, temperature: 0 });
    const trimmed = raw.trim().replace(/^```\w*\n?|```$/g, '').trim();
    const result = JSON.parse(trimmed);
    return typeof result.ok === 'boolean' ? result : { ok: true };
  } catch {
    return { ok: false, reason: 'Verification failed' };
  }
}

/**
 * Verify that a code summary accurately reflects the code (no added content).
 */
async function verifyCodeSummary(codeExcerpt, summary) {
  if (!OLLAMA_API_KEY) return true;
  const prompt = `You are a verifier. Does the following summary accurately describe ONLY what is in the code? Reply with ONLY "YES" or "NO".
If the summary adds features, fixes, or details not present in the code, say NO.

CODE EXCERPT: ${(codeExcerpt || '').substring(0, 500)}

SUMMARY: ${summary.substring(0, 400)}

Answer (YES or NO):`;
  try {
    const raw = await generateText(prompt, { maxTokens: 10, temperature: 0 });
    return /^\s*YES\s*$/i.test(raw.trim());
  } catch {
    return false;
  }
}

/**
 * Generate 1-2 MCQ questions for a step/concept using qwen3-coder (educational, code-focused).
 * Returns { questions: [{ question, options: string[], correctIndex: number }] }
 */
async function generateMCQs(stepTitle, stepConcept, moduleTitle, count = 2) {
  if (!OLLAMA_API_KEY) return { questions: [] };

  const prompt = `You are an educational quiz generator for programming. Generate exactly ${count} multiple-choice question(s) about the concept below. Keep questions clear and focused on what the student just learned.

MODULE: ${moduleTitle || 'Programming'}
STEP/CONCEPT: ${stepTitle}
${stepConcept ? `CONCEPT DETAIL: ${stepConcept}` : ''}

RULES:
1. Output ONLY valid JSON, no other text.
2. Format: {"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]}
3. correctIndex is 0-based (0 = first option).
4. Each question must have exactly 4 options. Options should be short (one line).
5. Questions should test understanding, not trivia. One correct answer per question.`;

  try {
    const raw = await generateTextWithModel(prompt, { maxTokens: 800, temperature: 0.4 }, OLLAMA_MCQ_MODEL);
    const trimmed = raw.trim().replace(/^```\w*\n?|```$/g, '').trim();
    const data = JSON.parse(trimmed);
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return { questions: questions.slice(0, count).filter((q) => q.question && Array.isArray(q.options) && typeof q.correctIndex === 'number') };
  } catch {
    return { questions: [] };
  }
}

/**
 * Explain why an MCQ answer is wrong (or confirm correct) using qwen3-coder.
 * Returns { correct: boolean, explanation: string }
 */
async function verifyMCQAnswer(question, options, correctIndex, selectedIndex) {
  if (!OLLAMA_API_KEY) return { correct: selectedIndex === correctIndex, explanation: 'Verification unavailable.' };

  const correct = selectedIndex === correctIndex;
  const selectedText = options[selectedIndex];
  const correctText = options[correctIndex];

  if (correct) {
    return { correct: true, explanation: 'Correct! Well done.' };
  }

  const prompt = `You are a patient programming tutor. The student chose the wrong answer. Explain briefly WHY their choice is wrong and WHY the correct answer is right. Teach the concept in 2-4 sentences. Be clear and encouraging.

QUESTION: ${question}
OPTIONS: ${(options || []).map((o, i) => `[${i}] ${o}`).join(' | ')}
CORRECT INDEX: ${correctIndex} (correct answer: "${correctText}")
STUDENT CHOSE INDEX: ${selectedIndex} (their answer: "${selectedText}")

Reply with ONLY a short explanation (2-4 sentences). No preamble like "The correct answer is...". Focus on WHY the wrong answer is wrong and what the right concept is.`;

  try {
    const explanation = await generateTextWithModel(prompt, { maxTokens: 256, temperature: 0.3 }, OLLAMA_MCQ_MODEL);
    return { correct: false, explanation: (explanation || '').trim() || 'That option is incorrect. Review the concept and try again.' };
  } catch {
    return { correct: false, explanation: 'That option is incorrect. The correct answer is option ' + (correctIndex + 1) + '.' };
  }
}

/**
 * Generate React game starter code from planning board data using qwen3-coder:480b.
 * Planning should include: name, description, mechanics, gameLoop, coreFeatures, winLoseConditions, gameMode.
 * Returns raw code string (single file or markdown with ``` blocks); caller may parse.
 */
async function generateGameStarterCode(planning) {
  if (!OLLAMA_API_KEY) throw new Error('OLLAMA_API_KEY not configured');
  const name = planning.name || 'My Game';
  const description = planning.description || 'A fun game';
  const mechanics = planning.mechanics || planning.mechanicsText || 'Score, basic controls';
  const gameLoop = planning.gameLoop || planning.gameLoopText || 'Start → Play → Win/Lose → Restart';
  const coreFeatures = planning.coreFeatures || 'Menu, playing state, score display';
  const winLose = planning.winLoseConditions || planning.winLoseConditionsText || 'Lose when lives reach 0; win by reaching goal';
  const isMultiplayer = planning.gameMode === 'multiplayer' || planning.isMultiplayer;

  const prompt = `You are an expert React game developer. Generate starter code for a browser game based on this plan.

GAME NAME: ${name}
FULL DESCRIPTION: ${description}
GAME MODE: ${isMultiplayer ? 'Multiplayer (2-player turn-based)' : 'Single Player'}

MECHANICS: ${mechanics}
GAME LOOP: ${gameLoop}
CORE FEATURES: ${coreFeatures}
WIN/LOSE CONDITIONS: ${winLose}

Requirements:
1. Use React (functional components, useState, useEffect, useCallback).
2. Break code into scripts: keep App.jsx as main component; optionally add src/utils/gameLogic.js for pure game logic (e.g. win check, state helpers) or a small helper file. Always include App.css.
3. Include game states: menu, playing, paused, gameover (or equivalent).
4. Implement the described mechanics and game loop as specified above.
5. Add keyboard controls (e.g. Space to start, Escape to pause).
6. Include score or progress tracking where relevant.
7. Add brief comments explaining key parts.
8. Output format:
   - First line (optional): PACKAGES: react, react-dom
   - Then code blocks. Use labels before each block: App.jsx, App.css, and optionally src/utils/gameLogic.js (or similar path). Use \`\`\`jsx for JSX, \`\`\`css for CSS, \`\`\`javascript for .js.
9. Make it a working mini-game that runs in the browser and demonstrates the core loop.

Generate the code now.`;

  try {
    const raw = await generateTextWithModel(
      prompt,
      { maxTokens: 4096, temperature: 0.3 },
      OLLAMA_CODER_MODEL
    );
    return (raw || '').trim();
  } catch (err) {
    const message = err.message || String(err);
    throw new Error(`Starter code generation failed: ${message}`, { cause: err });
  }
}

/**
 * Explain a highlighted code snippet (educational, concise). Uses main model.
 */
async function explainCodeSnippet(code, language = 'javascript') {
  if (!OLLAMA_API_KEY) throw new Error('OLLAMA_API_KEY not configured');
  if (!code || !code.trim()) throw new Error('No code provided');

  const prompt = `You are a friendly programming tutor. The student highlighted this code and asked for an explanation.

Code (${language}):
\`\`\`${language}
${code.substring(0, 2000)}
\`\`\`

Give a clear, concise explanation (3-6 sentences):
1. What this code does in plain language
2. Key concepts or syntax used
3. One tip or thing to watch out for (if relevant)

Do not repeat the code in full. Use simple language.`;

  try {
    const explanation = await generateText(prompt, { maxTokens: 400, temperature: 0.3 });
    return (explanation || '').trim() || 'Could not generate explanation.';
  } catch (err) {
    throw new Error(err.message || 'Explanation failed');
  }
}

module.exports = {
  generateText,
  generateTextWithModel,
  generateMermaidDiagram,
  summarizeCodeToMarkdown,
  verifyTutorResponse,
  verifyCodeSummary,
  generateMCQs,
  verifyMCQAnswer,
  generateGameStarterCode,
  explainCodeSnippet,
};
