import { toast } from "react-toastify";
import { FaMagic, FaChevronUp, FaChevronDown, FaTrash } from "react-icons/fa";
import {
  MODULE_CATEGORIES,
  MODULE_FORM_TABS,
  VERIFY_TYPES,
  isMultiplayerCategory,
  emptyModuleStep,
  DIFFICULTIES,
} from "../../utils/moduleUtils";

/**
 * Shared create/edit fields for lesson modules in the admin editor.
 * @param {object} props
 * @param {object} props.form
 * @param {function} props.setForm
 * @param {string} props.sectionTab
 * @param {function} props.setSectionTab
 * @param {boolean} props.generatingSteps
 * @param {string|null} props.generatingCurriculum
 * @param {function} props.curriculumPartsKey
 * @param {function} props.handleGenerateModuleSteps
 * @param {function} props.handleGenerateCurriculumParts
 * @param {boolean} props.orderDuplicatesAnother
 */
export default function AdminModuleFormSections({
  form,
  setForm,
  sectionTab,
  setSectionTab,
  generatingSteps,
  generatingCurriculum,
  curriculumPartsKey,
  handleGenerateModuleSteps,
  handleGenerateCurriculumParts,
  orderDuplicatesAnother,
}) {
  return (
    <div className="pl-0 sm:pl-3 md:pl-5 lg:pl-6 min-w-0">
      <div
        className="lg:hidden flex flex-wrap gap-1.5 mb-4 p-1 bg-blue-950/60 rounded-xl border border-blue-800/80"
        role="tablist"
      >
        {MODULE_FORM_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={sectionTab === t.id}
            onClick={() => setSectionTab(t.id)}
            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors ${
              sectionTab === t.id
                ? "bg-blue-600 text-black shadow-sm"
                : "bg-blue-900 text-blue-100 hover:text-blue-50 hover:bg-blue-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sectionTab === "details" && (
          <>
            <div>
              <label className="block text-[11px] font-medium text-blue-300 mb-1">
                Lesson title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-blue-300 mb-1">
                Short description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-blue-300 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const category = e.target.value;
                    setForm((p) => {
                      const sc = { ...(p.starterCode || {}) };
                      if (!isMultiplayerCategory(category)) sc.serverJs = "";
                      return {
                        ...p,
                        category,
                        moduleType: "vanilla",
                        starterCode: sc,
                      };
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                >
                  {MODULE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-blue-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, difficulty: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-blue-300 mb-1">
                  Lesson order
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, order: e.target.value }))
                  }
                  className={`w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50 ${
                    orderDuplicatesAnother
                      ? "ring-2 ring-amber-500/70 ring-offset-2 ring-offset-blue-900"
                      : ""
                  }`}
                />
                <p className="text-[11px] text-blue-400 mt-1">
                  Each lesson needs a different order number. If this number
                  matches another lesson, it will be moved to the next free slot
                  when you save.
                </p>
                {orderDuplicatesAnother && (
                  <p className="text-[11px] text-amber-300 mt-1 font-medium">
                    This order is already used. Saving will assign the next free
                    number.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-blue-300 mb-1">
                  Editor
                </label>
                <div className="px-3 py-2.5 bg-blue-950/80 text-blue-100 text-[13px] rounded-xl border border-blue-800/80">
                  Vanilla — HTML, CSS, and JavaScript in the browser
                </div>
                <p className="text-[11px] text-blue-400 mt-1">
                  Starter code always includes HTML, CSS, and JS panels.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-blue-300 mb-1">
                Lesson content
              </label>
              <textarea
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                rows={8}
                className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50 font-mono"
              />
              <p className="text-[11px] text-blue-400 mt-1">
                Shown in the lesson view and used as context when generating steps
                with AI.
              </p>
            </div>
          </>
        )}

        {sectionTab === "steps" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-blue-950/50 border border-blue-700/60">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-blue-100 flex items-center gap-2">
                  <FaMagic className="text-cyan-300 shrink-0" aria-hidden />
                  Generate learner steps with AI
                </p>
                <p className="text-[12px] text-blue-400 mt-1">
                  Uses the lesson <span className="text-blue-200">Difficulty</span>{" "}
                  from Details, plus the title, description, category, and lesson
                  content, to suggest an ordered step plan (advanced modules
                  generate many more guided steps). You can edit
                  everything before saving.
                  {form.id ? (
                    <>
                      {" "}
                      If you already have steps, generating again replaces the
                      whole list in this form (you will be asked to confirm).
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateModuleSteps}
                disabled={
                  generatingSteps ||
                  !!generatingCurriculum ||
                  !form.title?.trim()
                }
                className="shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-blue-500 text-black hover:bg-blue-400 disabled:opacity-45 disabled:cursor-not-allowed shadow-md shadow-black/25"
              >
                {generatingSteps ? "Generating…" : "Generate steps"}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] text-blue-300">
                These steps appear in the Code Editor sidebar and control lesson checks.
              </p>
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    steps: [...(p.steps || []), emptyModuleStep()],
                  }))
                }
                className="px-3 py-1.5 text-[12px] font-semibold rounded-lg bg-blue-600 text-black hover:bg-blue-500"
              >
                + Add step
              </button>
            </div>

            {(form.steps || []).length === 0 ? (
              <p className="text-[13px] text-blue-400 py-6 text-center border border-dashed border-blue-700 rounded-xl">
                No steps yet. Generate steps with AI or add them manually.
              </p>
            ) : (
              <ul className="space-y-3 list-none p-0 m-0">
                {(form.steps || []).map((step, i) => {
                  const ec = step.expectedConsole;
                  const ecPreset =
                    ec && ec.type === "multipleLines"
                      ? "multipleLines"
                      : ec && ec.type === "any"
                        ? "any"
                        : step.verifyType === "checkConsole"
                          ? "custom"
                          : "any";
                  return (
                    <li
                      key={`step-${i}`}
                      className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide">
                          Step {i + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Move up"
                            disabled={i === 0}
                            onClick={() =>
                              setForm((p) => {
                                const arr = [...(p.steps || [])];
                                if (i < 1) return p;
                                [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                                return { ...p, steps: arr };
                              })
                            }
                            className="p-2 rounded-lg text-blue-300 hover:bg-blue-800 disabled:opacity-30"
                          >
                            <FaChevronUp className="text-xs" />
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            disabled={i >= (form.steps || []).length - 1}
                            onClick={() =>
                              setForm((p) => {
                                const arr = [...(p.steps || [])];
                                if (i >= arr.length - 1) return p;
                                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                                return { ...p, steps: arr };
                              })
                            }
                            className="p-2 rounded-lg text-blue-300 hover:bg-blue-800 disabled:opacity-30"
                          >
                            <FaChevronDown className="text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                steps: (p.steps || []).filter(
                                  (_, j) => j !== i,
                                ),
                              }))
                            }
                            className="p-2 rounded-lg text-red-300 hover:bg-blue-800 hover:text-red-200"
                            title="Remove step"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Step title"
                        value={step.title}
                        onChange={(e) =>
                          setForm((p) => {
                            const steps = [...(p.steps || [])];
                            steps[i] = { ...steps[i], title: e.target.value };
                            return { ...p, steps };
                          })
                        }
                        className="w-full px-3 py-2 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                      />
                      <textarea
                        placeholder="Instructions for the learner"
                        value={step.instruction}
                        onChange={(e) =>
                          setForm((p) => {
                            const steps = [...(p.steps || [])];
                            steps[i] = {
                              ...steps[i],
                              instruction: e.target.value,
                            };
                            return { ...p, steps };
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                      />
                      <input
                        type="text"
                        placeholder="Concept (short note for quizzes and tutor help)"
                        value={step.concept}
                        onChange={(e) =>
                          setForm((p) => {
                            const steps = [...(p.steps || [])];
                            steps[i] = { ...steps[i], concept: e.target.value };
                            return { ...p, steps };
                          })
                        }
                        className="w-full px-3 py-2 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-blue-300 mb-1">
                            How to check this step
                          </label>
                          <select
                            value={step.verifyType}
                            onChange={(e) => {
                              const verifyType = e.target.value;
                              setForm((p) => {
                                const steps = [...(p.steps || [])];
                                const next = { ...steps[i], verifyType };
                                if (verifyType === "checkConsole")
                                  next.expectedConsole = steps[i]
                                    .expectedConsole || {
                                    type: "any",
                                  };
                                else next.expectedConsole = null;
                                steps[i] = next;
                                return { ...p, steps };
                              });
                            }}
                            className="w-full px-3 py-2 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                          >
                            {VERIFY_TYPES.map((vt) => (
                              <option key={vt.value} value={vt.value}>
                                {vt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {step.verifyType === "checkConsole" && (
                          <div>
                            <label className="block text-[11px] font-medium text-blue-300 mb-1">
                              Console expectation
                            </label>
                            <select
                              value={ecPreset}
                              onChange={(e) => {
                                const v = e.target.value;
                                setForm((p) => {
                                  const steps = [...(p.steps || [])];
                                  let expectedConsole = { type: "any" };
                                  if (v === "multipleLines")
                                    expectedConsole = { type: "multipleLines" };
                                  else if (v === "custom")
                                    expectedConsole =
                                      steps[i].expectedConsole &&
                                      typeof steps[i].expectedConsole ===
                                        "object" &&
                                      steps[i].expectedConsole.type !== "any" &&
                                      steps[i].expectedConsole.type !==
                                        "multipleLines"
                                        ? steps[i].expectedConsole
                                        : { contains: [""] };
                                  steps[i] = { ...steps[i], expectedConsole };
                                  return { ...p, steps };
                                });
                              }}
                              className="w-full px-3 py-2 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                            >
                              <option value="any">Any output</option>
                              <option value="multipleLines">
                                Multiple lines
                              </option>
                              <option value="custom">Custom (JSON)</option>
                            </select>
                          </div>
                        )}
                      </div>
                      {step.verifyType === "checkConsole" &&
                        ecPreset === "custom" && (
                          <div>
                            <label className="block text-[11px] font-medium text-blue-300 mb-1">
                              Console check JSON
                            </label>
                            <textarea
                              key={`ec-json-${i}-${form.id || "new"}`}
                              defaultValue={JSON.stringify(
                                step.expectedConsole || {},
                                null,
                                2,
                              )}
                              onBlur={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  if (
                                    typeof parsed !== "object" ||
                                    parsed === null
                                  ) {
                                    toast.error(
                                      "Console check must be a JSON object.",
                                    );
                                    return;
                                  }
                                  setForm((p) => {
                                    const steps = [...(p.steps || [])];
                                    steps[i] = {
                                      ...steps[i],
                                      expectedConsole: parsed,
                                    };
                                    return { ...p, steps };
                                  });
                                } catch {
                                  toast.error(
                                    "Console check JSON is invalid.",
                                  );
                                }
                              }}
                              rows={3}
                              className="w-full px-3 py-2 bg-blue-800 text-blue-50 text-[12px] rounded-xl font-mono focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                            />
                            <p className="text-[10px] text-blue-500 mt-1">
                              Click away from this field to apply JSON changes.
                            </p>
                          </div>
                        )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {sectionTab === "hints" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 p-4 rounded-xl bg-blue-950/50 border border-blue-700/60">
              <span className="text-[13px] font-semibold text-blue-100 flex items-center gap-2 shrink-0">
                <FaMagic className="text-cyan-300" aria-hidden />
                Generate hints with AI
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateCurriculumParts(["hints"])}
                  disabled={
                    !!generatingCurriculum ||
                    generatingSteps ||
                    !form.title?.trim()
                  }
                  className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-blue-700 text-black hover:bg-blue-600 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {generatingCurriculum === curriculumPartsKey(["hints"])
                    ? "…"
                    : "Hints"}
                </button>
              </div>
              <p className="text-[11px] text-blue-400 sm:w-full basis-full">
                Uses <span className="text-blue-200">Difficulty</span> from Details,
                title, description, lesson content, and step titles (if any).
                Generated hints replace the current hint list after a successful request.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium text-blue-300">
                  Hints
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      hints: [...(p.hints || []), ""],
                    }))
                  }
                  className="text-[12px] font-semibold text-cyan-300 hover:text-cyan-100"
                >
                  Add hint
                </button>
              </div>
              <ul className="space-y-2 list-none p-0 m-0">
                {(form.hints || []).map((hint, i) => (
                  <li key={`hint-${i}`} className="flex gap-2">
                    <input
                      type="text"
                      value={hint}
                      onChange={(e) =>
                        setForm((p) => {
                          const hints = [...(p.hints || [])];
                          hints[i] = e.target.value;
                          return { ...p, hints };
                        })
                      }
                      className="flex-1 px-3 py-2 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                      placeholder={`Hint ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          hints: (p.hints || []).filter((_, j) => j !== i),
                        }))
                      }
                      className="p-2 text-red-300 hover:bg-blue-800 rounded-xl"
                      title="Remove"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </li>
                ))}
              </ul>
              {(form.hints || []).length === 0 && (
                <p className="text-[12px] text-blue-500 py-2">
                  No hints yet.
                </p>
              )}
            </div>
          </div>
        )}

        {sectionTab === "code" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-blue-950/50 border border-blue-700/60">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-blue-100 flex items-center gap-2">
                  <FaMagic className="text-cyan-300 shrink-0" aria-hidden />
                  Generate starter code with AI
                </p>
                <p className="text-[12px] text-blue-400 mt-1">
                  Uses <span className="text-blue-200">Difficulty</span> from
                  Details. Starter code should be a small scaffold, so learners
                  still complete the lesson themselves.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateCurriculumParts(["starterCode"])}
                disabled={
                  !!generatingCurriculum ||
                  generatingSteps ||
                  !form.title?.trim()
                }
                className="shrink-0 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-blue-500 text-black hover:bg-blue-400 disabled:opacity-45 disabled:cursor-not-allowed shadow-md shadow-black/25"
              >
                {generatingCurriculum === curriculumPartsKey(["starterCode"])
                  ? "Generating…"
                  : "Generate starter code"}
              </button>
            </div>
            {[
              "html",
              "css",
              "javascript",
              ...(isMultiplayerCategory(form.category) ? ["serverJs"] : []),
            ].map((key) => (
              <div key={key}>
                <label className="block text-[11px] font-medium text-blue-300 mb-1 capitalize">
                  {key === "javascript"
                    ? "JavaScript"
                    : key === "serverJs"
                      ? "Server starter (Node / Socket.IO)"
                      : key}
                </label>
                <textarea
                  value={(form.starterCode && form.starterCode[key]) || ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      starterCode: {
                        ...(p.starterCode || {}),
                        [key]: e.target.value,
                      },
                    }))
                  }
                  rows={key === "html" || key === "javascript" ? 6 : 4}
                  className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[12px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50 font-mono"
                />
              </div>
            ))}
            {!isMultiplayerCategory(form.category) && (
              <p className="text-[12px] text-blue-400 border border-dashed border-blue-700 rounded-xl px-3 py-2">
                Server starter code is only available when the category is{" "}
                <span className="text-blue-200 font-medium">multiplayer</span>.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
