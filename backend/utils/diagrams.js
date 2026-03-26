const { VALID_MERMAID_STARTS } = require('../constants/diagrams');

/**
 * Validate Mermaid diagram code (basic checks)
 * @param {string} mermaidCode - Raw Mermaid code
 * @returns {{ valid: boolean, message?: string }}
 */
function validateMermaidCode(mermaidCode) {
  const code = mermaidCode.trim();

  const startsWithValid = VALID_MERMAID_STARTS.some((start) => code.startsWith(start));
  if (!startsWithValid) {
    return {
      valid: false,
      message: 'Mermaid code must start with a valid diagram type declaration',
    };
  }

  if (code.length < 10) {
    return {
      valid: false,
      message: 'Mermaid code seems too short to be a valid diagram',
    };
  }

  return {
    valid: true,
    message: 'Mermaid syntax appears valid (basic check)',
  };
}

module.exports = {
  validateMermaidCode,
};
