/**
 * AI (GitHub Models) configuration constants.
 * Defaults are in code; override via env if needed:
 *   GITHUB_MODELS_MODEL, GITHUB_MCQ_MODEL, GITHUB_CODER_MODEL, GITHUB_MERMAID_MODEL
 */
const DEFAULT_MODEL = 'meta/Llama-4-Scout-17B-16E-Instruct';

/** Main model for hints, tutor, code summary, code/error explanation */
const AI_MODEL =  'openai/gpt-4.1';
/** Model used for MCQ generation and verification */
const AI_MCQ_MODEL = 'meta/Llama-4-Maverick-17B-128E-Instruct-FP8';
/** Model used for step verification and game starter code generation */
const AI_CODER_MODEL = DEFAULT_MODEL;
/** Model used for Mermaid/diagram generation */
const AI_MERMAID_MODEL = DEFAULT_MODEL;

module.exports = {
  AI_MODEL,
  AI_MCQ_MODEL,
  AI_CODER_MODEL,
  AI_MERMAID_MODEL,
};
