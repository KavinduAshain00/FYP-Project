/**
 * AI (Ollama) configuration constants
 */
const OLLAMA_HOST = 'https://ollama.com';
const OLLAMA_MODEL = 'gemini-3-flash-preview';
/** Model used for MCQ generation and verification (explains why answers are wrong) */
const OLLAMA_MCQ_MODEL = 'gpt-oss:20b';
/** Model used for game starter code generation (React game scaffolding) */
const OLLAMA_CODER_MODEL = 'qwen3-coder:480b';
/** Model used for Mermaid/diagram generation (diagrams only, not deepseek) */
const OLLAMA_MERMAID_MODEL = 'mermaid';

module.exports = {
  OLLAMA_HOST,
  OLLAMA_MODEL,
  OLLAMA_MCQ_MODEL,
  OLLAMA_CODER_MODEL,
  OLLAMA_MERMAID_MODEL,
};
