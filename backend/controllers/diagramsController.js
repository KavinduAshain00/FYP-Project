const { generateMermaidDiagram } = require('../services/aiService');
const { validateMermaidCode } = require('../utils/diagrams');
const { VALID_DIAGRAM_TYPES, DEFAULT_DIAGRAM_TYPE } = require('../constants/diagrams');

/**
 * POST /api/diagrams/generate
 */
async function generate(req, res) {
  const { description, diagramType, options } = req.body;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({
      error: 'description (string) is required',
      example: {
        description: 'A login process with username and password validation',
        diagramType: 'flowchart',
      },
    });
  }

  const type = diagramType || DEFAULT_DIAGRAM_TYPE;
  if (!VALID_DIAGRAM_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid diagram type. Must be one of: ${VALID_DIAGRAM_TYPES.join(', ')}`,
    });
  }

  try {
    console.log(`Generating ${type} diagram for user ${req.user?.username || 'unknown'}`);
    const mermaidCode = await generateMermaidDiagram(description, type, options);
    return res.json({
      mermaidCode,
      diagramType: type,
      description,
    });
  } catch (err) {
    console.error('Diagram generation error:', err.message || err);
    return res.status(500).json({
      error: 'Failed to generate diagram',
      details: err.message,
    });
  }
}

/**
 * POST /api/diagrams/validate
 */
async function validate(req, res) {
  const { mermaidCode } = req.body;

  if (!mermaidCode || typeof mermaidCode !== 'string') {
    return res.status(400).json({ error: 'mermaidCode (string) is required' });
  }

  try {
    const result = validateMermaidCode(mermaidCode);
    return res.json(result);
  } catch (err) {
    console.error('Validation error:', err.message || err);
    return res.status(500).json({ error: 'Validation failed' });
  }
}

module.exports = {
  generate,
  validate,
};
