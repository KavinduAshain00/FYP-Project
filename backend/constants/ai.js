/**
 * AI (GitHub Models) configuration constants.
 * Reads from process.env so you can override per task via .env:
 *   GITHUB_MODELS_MODEL  - main tutor, hints, summary, explain
 *   GITHUB_MCQ_MODEL    - MCQ generate and verify
 *   GITHUB_CODER_MODEL  - step verification, game starter code
 *   GITHUB_MERMAID_MODEL - Mermaid/diagram generation
 */
const DEFAULT_MODEL = 'meta/Llama-4-Scout-17B-16E-Instruct';

/** Main model for hints, tutor, code summary, code/error explanation */
const AI_MODEL = process.env.GITHUB_MODELS_MODEL || DEFAULT_MODEL;
/** Model used for MCQ generation and verification */
const AI_MCQ_MODEL = process.env.GITHUB_MCQ_MODEL || DEFAULT_MODEL;
/** Model used for step verification and game starter code generation */
const AI_CODER_MODEL = process.env.GITHUB_CODER_MODEL || DEFAULT_MODEL;
/** Model used for Mermaid/diagram generation */
const AI_MERMAID_MODEL = process.env.GITHUB_MERMAID_MODEL || DEFAULT_MODEL;

module.exports = {
  AI_MODEL,
  AI_MCQ_MODEL,
  AI_CODER_MODEL,
  AI_MERMAID_MODEL,
};
