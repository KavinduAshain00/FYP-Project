import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useShellPagesCache } from "../context/shellPagesCacheContext";
import { modulesAPI, userAPI } from "../api/api";
import {
  FaCheckCircle,
  FaPlay,
  FaSlidersH,
  FaLock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import LoadingScreen from "../components/ui/LoadingScreen";
import { toModuleId } from "../utils/ids";

const MODULES_PER_PAGE = 12;

const defaultPagination = {
  total: 0,
  page: 1,
  limit: MODULES_PER_PAGE,
  totalPages: 1,
};

const Modules = () => {
  const { peek, put } = useShellPagesCache();
  const saved = peek("modules");
  const [gridModules, setGridModules] = useState(
    () => saved?.gridModules ?? [],
  );
  const [pagination, setPagination] = useState(
    () => saved?.pagination ?? { ...defaultPagination },
  );
  const [dashboard, setDashboard] = useState(() => saved?.dashboard ?? null);
  const [loading, setLoading] = useState(() =>
    saved?.dashboard ? false : true,
  );
  const [filterCategory, setFilterCategory] = useState(
    () => saved?.filterCategory ?? "all",
  );
  const [filterDifficulty, setFilterDifficulty] = useState(
    () => saved?.filterDifficulty ?? "all",
  );
  const [questPage, setQuestPage] = useState(() => saved?.questPage ?? 1);
  const skipModulesListFetchOnce = useRef(
    Boolean(saved?.dashboard && saved?.pagination),
  );
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const snapshotRef = useRef({});
  snapshotRef.current = {
    gridModules,
    pagination,
    dashboard,
    filterCategory,
    filterDifficulty,
    questPage,
    loading,
  };
  useEffect(() => () => put("modules", snapshotRef.current), [put]);

  useEffect(() => {
    if (dashboard) return;
    const fetchDashboard = async () => {
      try {
        const res = await userAPI.getDashboard();
        setDashboard(res.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        setDashboard({
          modules: [],
          user: null,
          completedModuleIds: [],
          nextModule: null,
        });
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [dashboard]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!dashboard) return;
      if (skipModulesListFetchOnce.current) {
        skipModulesListFetchOnce.current = false;
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = { page: questPage, limit: MODULES_PER_PAGE };
        if (filterCategory !== "all") params.category = filterCategory;
        if (filterDifficulty !== "all") params.difficulty = filterDifficulty;
        const res = await modulesAPI.getAll("all", params);
        setGridModules(res.data.modules || []);
        setPagination(
          res.data.pagination || {
            total: 0,
            page: questPage,
            limit: MODULES_PER_PAGE,
            totalPages: 1,
          },
        );
      } catch (error) {
        console.error("Error fetching modules:", error);
        setGridModules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [dashboard, questPage, filterCategory, filterDifficulty]);

  const handleStartModule = async (moduleId) => {
    try {
      await userAPI.setCurrentModule(moduleId);
      if (refreshProfile) await refreshProfile();
      navigate(`/editor/${moduleId}`);
    } catch (error) {
      console.error("Error starting module:", error);
    }
  };

  const profile = dashboard?.user ?? null;
  const pathModules = useMemo(
    () => dashboard?.modules ?? [],
    [dashboard?.modules],
  );
  const completedModuleIds = useMemo(() => {
    if (!dashboard?.completedModuleIds) return [];
    return dashboard.completedModuleIds
      .map((id) => (id && id.toString()) || id)
      .filter(Boolean);
  }, [dashboard?.completedModuleIds]);

  const modulePath = useMemo(() => {
    return [...pathModules].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [pathModules]);

  const getModuleImageUrl = (module, width = 400, height = 250) => {
    const seed = (module._id || module.title || "")
      .toString()
      .replace(/\s/g, "");
    return `https://picsum.photos/seed/${seed || "module"}/${width}/${height}`;
  };

  const nextModule =
    dashboard?.nextModule ??
    modulePath.find((m) => !completedModuleIds.includes(toModuleId(m._id)));

  const jsBasics = useMemo(() => {
    return [...pathModules]
      .filter((m) => m?.category === "javascript-basics")
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [pathModules]);
  const jsBasicsIds = useMemo(
    () => new Set(jsBasics.map((m) => toModuleId(m._id)).filter(Boolean)),
    [jsBasics],
  );
  const jsBasicsComplete = useMemo(() => {
    if (profile?.learningPath !== "javascript-basics") return true;
    if (jsBasicsIds.size === 0) return false;
    for (const id of jsBasicsIds) {
      if (!completedModuleIds.includes(id)) return false;
    }
    return true;
  }, [profile?.learningPath, jsBasicsIds, completedModuleIds]);
  const lockedJsBasicsIds = useMemo(() => {
    if (profile?.learningPath !== "javascript-basics") return new Set();
    const pathIds = jsBasics.map((m) => toModuleId(m._id));
    const locked = new Set();
    for (let i = 1; i < pathIds.length; i++) {
      if (!completedModuleIds.includes(pathIds[i - 1])) locked.add(pathIds[i]);
    }
    return locked;
  }, [profile?.learningPath, jsBasics, completedModuleIds]);
  const isModuleLocked = (module) => {
    if (profile?.learningPath !== "javascript-basics") return false;
    if (!module) return false;
    const id = toModuleId(module._id);
    const isJsBasics =
      module.category === "javascript-basics" || jsBasicsIds.has(id);
    if (!jsBasicsComplete && !isJsBasics) return true;
    if (isJsBasics) return lockedJsBasicsIds.has(id);
    return false;
  };

  const filterOptions = useMemo(() => {
    const categories = [
      ...new Set(pathModules.map((m) => m.category).filter(Boolean)),
    ].sort();
    const difficulties = [
      ...new Set(pathModules.map((m) => m.difficulty).filter(Boolean)),
    ].sort();
    return { categories, difficulties };
  }, [pathModules]);

  const totalQuestPages = Math.max(1, pagination.totalPages || 1);
  const totalPathModules = pathModules.length;
  const completionPct = totalPathModules
    ? Math.round((completedModuleIds.length / totalPathModules) * 100)
    : 0;
  const levelInfo = profile?.levelInfo || null;
  const level = levelInfo?.level ?? profile?.level ?? 1;

  if (loading || !dashboard) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <LoadingScreen
          message="Loading modules…"
          subMessage="Fetching lessons and your progress"
        />
      </div>
    );
  }

  const difficultyPill = (d) => {
    const x = (d || "").toLowerCase();
    if (x === "beginner" || x === "easy")
      return "bg-emerald-500/25 text-emerald-200";
    if (x === "intermediate" || x === "medium")
      return "bg-amber-500/25 text-amber-100";
    if (x === "advanced" || x === "hard")
      return "bg-violet-500/25 text-violet-200";
    return "bg-blue-700 text-blue-200";
  };

  const toTitleCase = (str) =>
    (str || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const selectClass =
    "rounded-xl bg-blue-800 px-4 py-2.5 text-sm text-blue-50 outline-none focus:outline focus:outline-2 focus:outline-blue-400/50 cursor-pointer";

  const pageBtn =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
      <header className="mb-10">
        <p className="text-sm text-blue-300 mb-1">All lessons</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-blue-50 tracking-tight">
              Module catalog
            </h1>
            <p className="text-blue-300 mt-2 max-w-xl">
              Browse everything in one place. Use filters to narrow the list;
              your path and progress match what you see on Home.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            <div className="rounded-2xl bg-blue-900 px-5 py-4 shadow-lg shadow-black/30 min-w-[200px]">
              <p className="text-[11px] uppercase tracking-wider text-blue-300">
                Path progress
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-2 flex-1 rounded-full bg-blue-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-500 shadow-sm shadow-black/20"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-blue-200 tabular-nums w-10">
                  {completionPct}%
                </span>
              </div>
              <p className="text-xs text-blue-300 mt-2">
                {completedModuleIds.length} of {totalPathModules} on your track
              </p>
            </div>
            <div className="rounded-2xl bg-blue-900 px-5 py-4 shadow-lg shadow-black/30 text-center sm:text-left">
              <p className="text-[11px] uppercase tracking-wider text-blue-300">
                Level
              </p>
              <p className="text-2xl font-bold text-blue-50">{level}</p>
            </div>
            {nextModule && (
              <button
                type="button"
                onClick={() => handleStartModule(nextModule._id)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-500 text-black text-sm font-semibold shadow-md shadow-black/30 hover:bg-blue-400 active:scale-[0.99] transition-all"
              >
                <FaPlay className="text-xs" /> Continue next
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="rounded-3xl bg-blue-900 p-5 sm:p-6 shadow-xl shadow-black/35 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-50">
            <FaSlidersH className="text-blue-200" />
            Filter lessons
          </span>
          <div className="flex flex-wrap gap-3 flex-1">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setQuestPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All categories</option>
              {filterOptions.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {toTitleCase(cat)}
                </option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => {
                setFilterDifficulty(e.target.value);
                setQuestPage(1);
              }}
              className={selectClass}
            >
              <option value="all">All difficulties</option>
              {filterOptions.difficulties.map((d) => (
                <option key={d} value={d}>
                  {toTitleCase(d)}
                </option>
              ))}
            </select>
            {(filterCategory !== "all" || filterDifficulty !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterDifficulty("all");
                  setQuestPage(1);
                }}
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-black hover:bg-blue-600"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {gridModules.map((module) => {
          const moduleIdStr = toModuleId(module._id);
          const done = completedModuleIds.includes(moduleIdStr);
          const isNext = nextModule
            ? toModuleId(nextModule._id) === moduleIdStr
            : false;
          const locked = isModuleLocked(module);
          return (
            <article
              key={module._id}
              className={`group flex flex-col rounded-3xl overflow-hidden shadow-xl shadow-black/35 transition-transform hover:-translate-y-0.5 ${
                done
                  ? "bg-blue-900"
                  : isNext && !locked
                    ? "bg-blue-900"
                    : "bg-blue-900"
              }`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-blue-800">
                <img
                  src={getModuleImageUrl(module)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-neutral-900/70" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-bold text-blue-50 text-base leading-snug line-clamp-2">
                    {module.title}
                  </h3>
                  {module.difficulty && (
                    <span
                      className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${difficultyPill(module.difficulty)}`}
                    >
                      {module.difficulty}
                    </span>
                  )}
                </div>
                {done && (
                  <div className="absolute top-3 right-3 rounded-xl bg-emerald-600 px-2 py-1.5 shadow-lg shadow-black/30">
                    <FaCheckCircle className="text-white w-4 h-4" />
                  </div>
                )}
                {locked && !done && (
                  <div
                    className="absolute top-3 right-3 rounded-xl bg-blue-700 p-2 shadow-lg"
                    title={
                      profile?.learningPath === "javascript-basics" &&
                      !jsBasicsComplete &&
                      module.category !== "javascript-basics"
                        ? "Finish all JavaScript basics modules first"
                        : "Complete the previous lesson in your path"
                    }
                  >
                    <FaLock className="text-blue-200 w-4 h-4" />
                  </div>
                )}
                {isNext && !done && !locked && (
                  <div className="absolute top-3 right-3 rounded-xl bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-950 uppercase tracking-wide shadow-lg">
                    Next up
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                {module.description && (
                  <p className="text-sm text-blue-200 line-clamp-2 mb-5 flex-1">
                    {module.description}
                  </p>
                )}
                {done ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-200">
                      <FaCheckCircle /> Completed
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartModule(module._id)}
                      className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-black hover:bg-blue-600"
                    >
                      Practice again
                    </button>
                  </div>
                ) : locked ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-2xl bg-blue-900 px-4 py-3 text-sm font-semibold text-blue-300 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FaLock className="text-xs" />
                    {profile?.learningPath === "javascript-basics" &&
                    !jsBasicsComplete &&
                    module.category !== "javascript-basics"
                      ? "Locked until basics path is done"
                      : "Locked - finish the previous step"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartModule(module._id)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                      isNext
                        ? "bg-blue-500 text-black shadow-md shadow-black/30 hover:bg-blue-400 active:scale-[0.99]"
                        : "bg-blue-700 text-black hover:bg-blue-600"
                    }`}
                  >
                    {isNext ? "Continue this module" : "Open module"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {gridModules.length === 0 && !loading && (
        <div className="rounded-3xl bg-blue-900 py-16 text-center shadow-lg shadow-black/30 mt-6">
          <p className="text-blue-300 text-sm">
            Nothing matches these filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterCategory("all");
              setFilterDifficulty("all");
              setQuestPage(1);
            }}
            className="mt-4 text-sm font-semibold text-blue-200 hover:text-blue-100"
          >
            Clear filters
          </button>
        </div>
      )}

      {totalQuestPages > 1 && gridModules.length > 0 && (
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setQuestPage((p) => Math.max(1, p - 1))}
            disabled={questPage <= 1}
            className={`${pageBtn} bg-blue-700 text-black hover:bg-blue-600`}
          >
            <FaChevronLeft className="text-xs" /> Newer
          </button>
          <span className="text-sm text-blue-300 tabular-nums">
            Page {questPage} of {totalQuestPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuestPage((p) => Math.min(totalQuestPages, p + 1))
            }
            disabled={questPage >= totalQuestPages}
            className={`${pageBtn} bg-blue-700 text-black hover:bg-blue-600`}
          >
            Older <FaChevronRight className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Modules;
