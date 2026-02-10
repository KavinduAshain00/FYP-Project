/**
 * Diagram (Mermaid) constants
 */
const VALID_DIAGRAM_TYPES = [
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram-v2',
  'erDiagram',
  'gantt',
  'pie',
];

const VALID_MERMAID_STARTS = [
  'graph',
  'flowchart',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'erDiagram',
  'gantt',
  'pie',
  'gitGraph',
];

const DEFAULT_DIAGRAM_TYPE = 'flowchart';

module.exports = {
  VALID_DIAGRAM_TYPES,
  VALID_MERMAID_STARTS,
  DEFAULT_DIAGRAM_TYPE,
};
