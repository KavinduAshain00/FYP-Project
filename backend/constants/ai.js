/**
 * AI (GitHub Models) configuration constants.
 * Defaults are in code; override via env if needed:
 *   GITHUB_MODELS_MODEL, GITHUB_MCQ_MODEL, GITHUB_GENERAL_MODEL
 */

/** Main model for hints, tutor, code summary, code/error explanation */
const AI_MODEL = "openai/gpt-4.1";
/** Model used for MCQ generation and verification */
const AI_MCQ_MODEL = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";
/** Model used for step verification and game starter code generation */
const AI_GENERAL_MODEL = "meta/Llama-4-Scout-17B-16E-Instruct";
/** Model used for lecture notes (Learning Overview popup) */
const AI_LECTURE_MODEL = "mistral-ai/mistral-medium-2505";

module.exports = {
  AI_MODEL,
  AI_MCQ_MODEL,
  AI_GENERAL_MODEL,
  AI_LECTURE_MODEL,
};
