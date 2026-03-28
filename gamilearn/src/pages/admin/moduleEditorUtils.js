export const MODULE_CATEGORIES = [
  'javascript-basics',
  'game-development',
  'multiplayer',
  'advanced-concepts',
];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export const MODULE_FORM_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'steps', label: 'Steps' },
  { id: 'objectives', label: 'Objectives & hints' },
  { id: 'code', label: 'Starter code' },
];

export const VERIFY_TYPES = [
  { value: 'code', label: 'Code check' },
  { value: 'checkConsole', label: 'Console output' },
  { value: 'checkComments', label: 'Comments' },
];

export function isMultiplayerCategory(category) {
  return category === 'multiplayer';
}

/** Legacy DB categories still appear in the dropdown once. */
export function moduleCategorySelectOptions(currentCategory) {
  const cur = currentCategory && String(currentCategory).trim();
  if (cur && !MODULE_CATEGORIES.includes(cur)) {
    return [cur, ...MODULE_CATEGORIES];
  }
  return [...MODULE_CATEGORIES];
}

export function suggestNextOrder(modulesList, excludeModuleId = null) {
  const ex = excludeModuleId != null ? String(excludeModuleId) : null;
  const used = new Set(
    (modulesList || [])
      .filter((m) => (ex ? String(m._id) !== ex : true))
      .map((m) => Number(m.order) || 0)
  );
  let o = 0;
  while (used.has(o)) o += 1;
  return o;
}

export function resolveUniqueOrder(wanted, currentModuleId, modulesList) {
  const idStr = currentModuleId != null ? String(currentModuleId) : null;
  const used = new Set(
    (modulesList || [])
      .filter((m) => (idStr ? String(m._id) !== idStr : true))
      .map((m) => Number(m.order) || 0)
  );
  let o = Math.max(0, Math.floor(Number(wanted)) || 0);
  if (!used.has(o)) return o;
  while (used.has(o)) o += 1;
  return o;
}

export function normalizeStepForForm(s) {
  const verifyType = ['code', 'checkConsole', 'checkComments'].includes(s?.verifyType)
    ? s.verifyType
    : 'code';
  const ec = s?.expectedConsole;
  const expectedConsole =
    verifyType === 'checkConsole' && ec && typeof ec === 'object' ? ec : null;
  return {
    title: s?.title ?? '',
    instruction: s?.instruction ?? '',
    concept: s?.concept ?? '',
    verifyType,
    expectedConsole,
  };
}

export function emptyModuleStep() {
  return {
    title: '',
    instruction: '',
    concept: '',
    verifyType: 'code',
    expectedConsole: null,
  };
}

export function moduleFormComparable(m) {
  if (!m) return null;
  const sc = m.starterCode || {};
  const category = m.category ?? '';
  return {
    title: m.title ?? '',
    description: m.description ?? '',
    category,
    difficulty: m.difficulty ?? '',
    order: String(m.order ?? ''),
    content: m.content ?? '',
    moduleType: 'vanilla',
    objectives: m.objectives || [],
    hints: m.hints || [],
    steps: m.steps || [],
    starterCode: {
      html: sc.html ?? '',
      css: sc.css ?? '',
      javascript: sc.javascript ?? '',
      jsx: '',
      serverJs: sc.serverJs ?? '',
    },
  };
}
