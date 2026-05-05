// GitHub Models IDs used by aiService and tutorController.
// To change the actual provider call behavior, see githubModelsService.

// Default model for general tutor text generation and safety verification.
const AI_MODEL = "openai/gpt-4.1";

// Model used for multiple-choice question generation and wrong-answer feedback.
const AI_MCQ_MODEL = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";

// Model used for admin curriculum helpers such as generated steps, hints, and starter code.
const AI_GENERAL_MODEL = "meta/Llama-4-Scout-17B-16E-Instruct";

// Model used by "Check my code" step verification in tutorController.
const AI_CODER_MODEL = AI_GENERAL_MODEL;

// Model used for lecture/overview slide generation.
const AI_LECTURE_MODEL = "mistral-ai/mistral-medium-2505";

module.exports = {
  AI_MODEL,
  AI_MCQ_MODEL,
  AI_GENERAL_MODEL,
  AI_CODER_MODEL,
  AI_LECTURE_MODEL,
};
