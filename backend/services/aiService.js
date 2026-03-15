const githubModels = require('./githubModelsService');
const { AI_MODEL, AI_MCQ_MODEL, AI_CODER_MODEL, AI_MERMAID_MODEL } = require('../constants/ai');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.warn('Warning: GITHUB_TOKEN not set. AI calls will fail until configured.');
}

console.log(`Using GitHub Models with model ${AI_MODEL}`);

async function generateText(prompt, options = {}) {
  return generateTextWithModel(prompt, options, AI_MODEL);
}

/** Generate text with a specific model. */
async function generateTextWithModel(prompt, options = {}, model = AI_MODEL) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');

  try {
    const content = await githubModels.chatCompletion(
      [{ role: 'user', content: prompt }],
      model,
      {
        temperature: options.temperature ?? 0.2,
        maxTokens: options.maxTokens ?? 512,
      },
    );

    if (content && typeof content === 'string' && content.trim()) {
      return content.trim();
    }
    return '';
  } catch (err) {
    const message = err.message || String(err);
    throw new Error(`GitHub Models API error: ${message}`, { cause: err });
  }
}

async function generateMermaidDiagram(description, diagramType = 'flowchart', options = {}) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');

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

    const content = await githubModels.chatCompletion(
      [{ role: 'user', content: prompt }],
      AI_MERMAID_MODEL,
      {
        temperature: options.temperature ?? 0.3,
        maxTokens: options.maxTokens ?? 1024,
      },
    );

    if (content) {
      let mermaidCode = content.trim();
      mermaidCode = mermaidCode.replace(/```mermaid\n?/g, '');
      mermaidCode = mermaidCode.replace(/```\n?/g, '');
      return mermaidCode.trim();
    }
    return '';
  } catch (err) {
    const message = err.message || String(err);
    throw new Error(`Mermaid generation error: ${message}`, { cause: err });
  }
}

/**
 * Summarize user code into a short markdown context (for tutor). No hallucinations:
 * only describe what is actually present in the code.
 */
async function summarizeCodeToMarkdown(codeByFile) {
  if (!GITHUB_TOKEN) return 'Code context unavailable.';
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
  if (!GITHUB_TOKEN) return true;
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
 * Generate 1-2 MCQ questions for a step/concept (educational, code-focused).
 * Returns { questions: [{ question, options: string[], correctIndex: number }] }
 */
async function generateMCQs(stepTitle, stepConcept, moduleTitle, count = 2) {
  if (!GITHUB_TOKEN) return { questions: [] };

  const prompt = `You are an educational quiz generator for programming. Generate exactly ${count} multiple-choice question(s) about the concept below. Keep questions clear and focused on what the student just learned.

MODULE: ${moduleTitle || 'Programming'}
STEP/CONCEPT: ${stepTitle}
${stepConcept ? `CONCEPT DETAIL: ${stepConcept}` : ''}

RULES:
1. Output ONLY a single JSON object, no other text before or after.
2. Format: {"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]}
3. correctIndex is 0-based (0 = first option). Each question must have exactly 4 options.
4. Options should be short (one line). One correct answer per question.`;

  const parseQuestions = (raw) => {
    const trimmed = raw.trim().replace(/^```\w*\n?|```$/g, '').trim();
    const data = JSON.parse(trimmed);
    const questions = Array.isArray(data.questions) ? data.questions : [];
    return questions.slice(0, count).filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4);
  };

  try {
    let raw = await generateTextWithModel(prompt, { maxTokens: 800, temperature: 0.4 }, AI_MCQ_MODEL);
    let questions = parseQuestions(raw);
    if (questions.length === 0 && raw.trim()) {
      raw = await generateTextWithModel(prompt, { maxTokens: 800, temperature: 0.2 }, AI_MCQ_MODEL);
      questions = parseQuestions(raw);
    }
    if (questions.length === 0) {
      return { questions: [{ question: 'What did you learn in this step?', options: ['I applied the concept correctly.', 'I need to review the instructions.', 'I am not sure yet.', 'I want to try again.'], correctIndex: 0 }] };
    }
    return { questions };
  } catch {
    return { questions: [{ question: 'What did you learn in this step?', options: ['I applied the concept correctly.', 'I need to review the instructions.', 'I am not sure yet.', 'I want to try again.'], correctIndex: 0 }] };
  }
}

/**
 * Explain why an MCQ answer is wrong (or confirm correct).
 * Returns { correct: boolean, explanation: string }
 */
async function verifyMCQAnswer(question, options, correctIndex, selectedIndex) {
  if (!GITHUB_TOKEN) return { correct: selectedIndex === correctIndex, explanation: 'Verification unavailable.' };

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
    const explanation = await generateTextWithModel(prompt, { maxTokens: 256, temperature: 0.3 }, AI_MCQ_MODEL);
    return { correct: false, explanation: (explanation || '').trim() || 'That option is incorrect. Review the concept and try again.' };
  } catch {
    return { correct: false, explanation: 'That option is incorrect. The correct answer is option ' + (correctIndex + 1) + '.' };
  }
}

/**
 * Generate React game starter code from planning board data.
 * Planning should include: name, description, mechanics, gameLoop, coreFeatures, winLoseConditions, gameMode.
 * Returns raw code string (single file or markdown with ``` blocks); caller may parse.
 */
async function generateGameStarterCode(planning) {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');
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
      AI_CODER_MODEL
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
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');
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

/**
 * Explain a runtime/syntax error message in simple terms. Pedagogical, no full solution.
 * Uses main model. Optional codeSnippet for context.
 */
async function explainErrorMessage(errorMessage, codeSnippet = '', language = 'javascript') {
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN not configured');
  if (!errorMessage || !String(errorMessage).trim()) throw new Error('No error message provided');

  const codeBlock = codeSnippet && codeSnippet.trim()
    ? `\nRelevant code (for context only):\n\`\`\`${language}\n${String(codeSnippet).substring(0, 800)}\n\`\`\``
    : '';

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
    const explanation = await generateText(prompt, { maxTokens: 400, temperature: 0.3 });
    return (explanation || '').trim() || 'Could not generate explanation.';
  } catch (err) {
    throw new Error(err.message || 'Error explanation failed');
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
  explainErrorMessage,
};
