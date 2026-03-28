import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import { adminAPI, modulesAPI } from "../api/api";
import { PageHeader } from "../components/layout/GameLayout";
import ConfirmModal from "../components/ui/ConfirmModal";
import LoadingScreen from "../components/ui/LoadingScreen";
import AdminModuleFormSections from "./admin/AdminModuleFormSections";
import {
  MODULE_FORM_TABS,
  suggestNextOrder,
  resolveUniqueOrder,
  normalizeStepForForm,
  moduleFormComparable,
  isMultiplayerCategory,
} from "./admin/moduleEditorUtils";

function buildFormFromApi(full) {
  const sc = full.starterCode || {};
  const category = full.category;
  return {
    id: full._id,
    title: full.title ?? "",
    description: full.description ?? "",
    category,
    difficulty: full.difficulty,
    order: full.order ?? 0,
    content: full.content ?? "",
    moduleType: "vanilla",
    starterCode: {
      html: sc.html ?? "",
      css: sc.css ?? "",
      javascript: sc.javascript ?? "",
      jsx: "",
      serverJs: isMultiplayerCategory(category) ? (sc.serverJs ?? "") : "",
    },
    objectives: Array.isArray(full.objectives) ? [...full.objectives] : [],
    hints: Array.isArray(full.hints) ? [...full.hints] : [],
    steps: Array.isArray(full.steps)
      ? full.steps.map((s) => normalizeStepForForm(s))
      : [],
  };
}

export default function AdminModuleEditor() {
  const { moduleId: moduleIdParam } = useParams();
  const navigate = useNavigate();
  const moduleId = moduleIdParam != null ? String(moduleIdParam).trim() : "";
  const isNew = moduleId === "new";
  /** Bad links or stale URLs (e.g. `/modules/${undefined}`) */
  const missingEditId = !isNew && (!moduleId || moduleId === "undefined");

  const [form, setForm] = useState(null);
  const [sectionTab, setSectionTab] = useState("details");
  const [modulesList, setModulesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSteps, setGeneratingSteps] = useState(false);
  const [generatingCurriculum, setGeneratingCurriculum] = useState(null);
  const initialFormRef = useRef(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const curriculumPartsKey = useCallback(
    (parts) => [...parts].sort().join(","),
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setSectionTab("details");
    if (missingEditId) {
      toast.error("Invalid module link");
      navigate("/admin");
      setLoading(false);
      return;
    }
    try {
      const listRes = await modulesAPI.getAll("all");
      const list = listRes.data?.modules || [];
      setModulesList(list);

      if (isNew) {
        const category = "javascript-basics";
        const data = {
          title: "",
          description: "",
          category,
          difficulty: "beginner",
          order: suggestNextOrder(list),
          content: "",
          moduleType: "vanilla",
          starterCode: {
            html: "",
            css: "",
            javascript: "",
            jsx: "",
            serverJs: "",
          },
          objectives: [],
          hints: [],
          steps: [],
        };
        setForm(data);
        initialFormRef.current = JSON.parse(
          JSON.stringify(moduleFormComparable(data)),
        );
        return;
      }

      const res = await modulesAPI.getById(moduleId);
      const full = res.data?.module;
      if (!full) {
        toast.error("Module not found");
        navigate("/admin");
        return;
      }
      const data = buildFormFromApi(full);
      setForm(data);
      initialFormRef.current = JSON.parse(
        JSON.stringify(moduleFormComparable(data)),
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load module");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  }, [isNew, moduleId, missingEditId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isFormDirty = () => {
    if (!form || !initialFormRef.current) return false;
    return (
      JSON.stringify(moduleFormComparable(form)) !==
      JSON.stringify(moduleFormComparable(initialFormRef.current))
    );
  };

  const orderDuplicatesAnother = useMemo(() => {
    if (!form) return false;
    const my = Math.max(0, Math.floor(Number(form.order)) || 0);
    const myId = form.id != null ? String(form.id) : null;
    return modulesList.some(
      (m) => String(m._id) !== myId && (Number(m.order) || 0) === my,
    );
  }, [form, modulesList]);

  const goBack = (force = false) => {
    if (!force && isFormDirty()) {
      setConfirmModal({
        open: true,
        title: "Discard changes?",
        message: "You have unsaved changes. Leave without saving?",
        onConfirm: () => {
          setConfirmModal((p) => ({ ...p, open: false }));
          navigate("/admin");
        },
      });
      return;
    }
    navigate("/admin");
  };

  const handleSave = async () => {
    if (!form) return;
    const category = form.category;
    const moduleType = "vanilla";
    const sc = { ...(form.starterCode || {}) };
    sc.jsx = "";
    if (!isMultiplayerCategory(category)) sc.serverJs = "";
    const wantedOrder = Math.max(0, Math.floor(Number(form.order)) || 0);
    const order = resolveUniqueOrder(wantedOrder, form.id, modulesList);
    if (order !== wantedOrder) {
      toast.info(
        `Order ${wantedOrder} was already used; saved as ${order} (unique).`,
      );
    }
    const steps = (Array.isArray(form.steps) ? form.steps : [])
      .filter((s) => s.title && String(s.title).trim())
      .map((s) => {
        const verifyType = ["code", "checkConsole", "checkComments"].includes(
          s.verifyType,
        )
          ? s.verifyType
          : "code";
        let expectedConsole = s.expectedConsole;
        if (verifyType !== "checkConsole") expectedConsole = null;
        else if (!expectedConsole || typeof expectedConsole !== "object")
          expectedConsole = { type: "any" };
        return {
          title: String(s.title).trim(),
          instruction: String(s.instruction || ""),
          concept: String(s.concept || ""),
          verifyType,
          expectedConsole,
        };
      });
    const payload = {
      title: form.title,
      description: form.description,
      category,
      difficulty: form.difficulty,
      order,
      content: form.content || "",
      moduleType,
      starterCode: {
        html: sc.html ?? "",
        css: sc.css ?? "",
        javascript: sc.javascript ?? "",
        jsx: sc.jsx ?? "",
        serverJs: sc.serverJs ?? "",
      },
      objectives: (Array.isArray(form.objectives) ? form.objectives : [])
        .map((o) => String(o).trim())
        .filter(Boolean),
      hints: (Array.isArray(form.hints) ? form.hints : [])
        .map((h) => String(h).trim())
        .filter(Boolean),
      steps,
    };
    setSaving(true);
    try {
      if (form.id) {
        await modulesAPI.update(form.id, payload);
        toast.success("Module updated");
        const listRes = await modulesAPI.getAll("all");
        setModulesList(listRes.data?.modules || []);
        const refreshed = await modulesAPI.getById(form.id);
        const data = buildFormFromApi(refreshed.data.module);
        setForm(data);
        initialFormRef.current = JSON.parse(
          JSON.stringify(moduleFormComparable(data)),
        );
      } else {
        const res = await modulesAPI.create(payload);
        toast.success("Module created");
        const created = res.data?.module;
        const newId = created?._id;
        if (newId) {
          navigate(`/admin/modules/${newId}`, { replace: true });
        } else {
          navigate("/admin");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save module");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateModuleSteps = async () => {
    if (!form || form.id) return;
    if (!form.title?.trim()) {
      toast.error("Add a module title first (Details section).");
      setSectionTab("details");
      return;
    }
    setGeneratingSteps(true);
    try {
      const res = await adminAPI.generateModuleSteps({
        title: form.title.trim(),
        description: form.description || "",
        content: form.content || "",
        category: form.category,
        difficulty: form.difficulty,
        moduleType: "vanilla",
        stepCount: 5,
      });
      const steps = res.data?.steps || [];
      if (!steps.length) {
        toast.error("No steps were returned. Try again or add steps manually.");
        return;
      }
      setForm((p) => ({
        ...p,
        steps: steps.map((s) => normalizeStepForForm(s)),
      }));
      toast.success(`Generated ${steps.length} steps. Review them, then save.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate steps");
    } finally {
      setGeneratingSteps(false);
    }
  };

  const handleGenerateCurriculumParts = async (parts) => {
    if (!form) return;
    if (!form.title?.trim()) {
      toast.error("Add a module title first (Details section).");
      setSectionTab("details");
      return;
    }
    setGeneratingCurriculum(curriculumPartsKey(parts));
    try {
      const res = await adminAPI.generateModuleCurriculum({
        title: form.title.trim(),
        description: form.description || "",
        content: form.content || "",
        category: form.category,
        difficulty: form.difficulty,
        moduleType: "vanilla",
        parts,
        steps: (form.steps || [])
          .filter((s) => s.title?.trim())
          .map((s) => ({ title: s.title, instruction: s.instruction || "" })),
      });
      const { objectives, hints, starterCode } = res.data || {};
      setForm((p) => {
        const next = { ...p };
        if (objectives?.length) next.objectives = objectives;
        if (hints?.length) next.hints = hints;
        if (starterCode && typeof starterCode === "object") {
          const merged = { ...(p.starterCode || {}), ...starterCode, jsx: "" };
          if (!isMultiplayerCategory(p.category)) merged.serverJs = "";
          next.starterCode = merged;
        }
        return next;
      });
      const done = [];
      if (objectives?.length) done.push("objectives");
      if (hints?.length) done.push("hints");
      if (starterCode && typeof starterCode === "object")
        done.push("starter code");
      toast.success(
        done.length
          ? `Generated ${done.join(", ")}`
          : "Nothing new was applied",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "AI generation failed");
    } finally {
      setGeneratingCurriculum(null);
    }
  };

  if (loading || !form) {
    return <LoadingScreen message="Loading module editor" />;
  }

  const pageTitle = isNew ? "New module" : "Edit module";

  return (
    <div className="min-h-screen bg-neutral-900 text-blue-100 pb-24">
      <PageHeader title={pageTitle} subtitle="Admin · Modules" />

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-0 lg:gap-0 min-h-[calc(100vh-8rem)]">
        <aside className="hidden lg:flex w-52 shrink-0 flex-col border-r border-blue-800/80 bg-blue-950/40 pl-5 pr-4 mr-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 pl-1 pr-2 mb-2">
            Sections
          </p>
          <nav className="flex flex-col gap-1">
            {MODULE_FORM_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSectionTab(t.id)}
                className={`text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                  sectionTab === t.id
                    ? "bg-blue-600 text-black shadow-md shadow-blue-900/30"
                    : "text-blue-200 hover:bg-blue-800/80 hover:text-blue-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="shrink-0 flex flex-wrap items-center gap-3 pb-4 border-b border-blue-800/80 mb-4">
            <button
              type="button"
              onClick={() => goBack()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold text-blue-200 bg-blue-800/80 hover:bg-blue-700 hover:text-blue-50 transition-colors"
            >
              <FaArrowLeft className="text-xs" aria-hidden />
              Back to admin
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-blue-50 truncate">
                {form.title?.trim() || (isNew ? "Untitled module" : "Module")}
              </h2>
              <p className="text-[12px] text-blue-400">
                {(form.steps || []).length} step
                {(form.steps || []).length === 1 ? "" : "s"} ·{" "}
                {(form.objectives || []).length} objectives
                {form.id ? ` · id: ${form.id}` : ""}
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto pb-8">
            <AdminModuleFormSections
              form={form}
              setForm={setForm}
              sectionTab={sectionTab}
              setSectionTab={setSectionTab}
              generatingSteps={generatingSteps}
              generatingCurriculum={generatingCurriculum}
              curriculumPartsKey={curriculumPartsKey}
              handleGenerateModuleSteps={handleGenerateModuleSteps}
              handleGenerateCurriculumParts={handleGenerateCurriculumParts}
              orderDuplicatesAnother={orderDuplicatesAnother}
            />
          </div>

          <footer className="shrink-0 sticky bottom-0 left-0 right-0 flex flex-wrap justify-end gap-2 py-4 mt-4 border-t border-blue-800/80 bg-neutral-900/95 backdrop-blur-sm z-10">
            <button
              type="button"
              onClick={() => goBack()}
              className="px-4 py-2 text-[13px] font-semibold text-blue-300 hover:text-blue-50 hover:bg-blue-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.title?.trim()}
              className="px-5 py-2 bg-blue-500 text-black text-[13px] font-semibold rounded-xl shadow-md shadow-black/25 hover:bg-blue-400 transition-all disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {saving ? "Saving…" : "Save module"}
            </button>
          </footer>
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          if (typeof confirmModal.onConfirm === "function")
            confirmModal.onConfirm();
          setConfirmModal((p) => ({ ...p, open: false }));
        }}
        onCancel={() => setConfirmModal((p) => ({ ...p, open: false }))}
      />
    </div>
  );
}
