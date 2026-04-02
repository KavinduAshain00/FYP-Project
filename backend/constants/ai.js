/**
 * Config - GitHub Models API model IDs.
 * Override via env where githubModelsService reads GITHUB_MODELS_MODEL, GITHUB_MCQ_MODEL, etc.
 */

/**
 * AI_MODEL - Primary id for hints, tutor chat, summaries, code/error explanation.
 */
const AI_MODEL = "openai/gpt-4.1";

/**
 * AI_MCQ_MODEL - MCQ generation and answer verification.
 */
const AI_MCQ_MODEL = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";

/**
 * AI_GENERAL_MODEL - Step verification and game starter code generation.
 */
const AI_GENERAL_MODEL = "meta/Llama-4-Scout-17B-16E-Instruct";

/**
 * AI_CODER_MODEL - Step verification JSON (verifyStep); same id as general unless overridden elsewhere.
 */
const AI_CODER_MODEL = AI_GENERAL_MODEL;

/**
 * AI_LECTURE_MODEL - Learning Overview / lecture notes generation.
 */
const AI_LECTURE_MODEL = "mistral-ai/mistral-medium-2505";

module.exports = {
  AI_MODEL,
  AI_MCQ_MODEL,
  AI_GENERAL_MODEL,
  AI_CODER_MODEL,
  AI_LECTURE_MODEL,
};
