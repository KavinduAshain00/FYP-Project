import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { modulesAPI, userAPI } from "../api/api";
import {
  FaBolt,
  FaCheckCircle,
  FaPlay,
  FaSlidersH,
  FaLock,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { LoadingScreen, useShellPagesCache } from "../App";
import { getXpBarProps } from "../utils/levelCurve";
import { getModuleImageUrl, toModuleId } from "../utils/moduleUtils";

const MODULES_PER_PAGE = 12;
const MODULES_FETCH_CAP = 100;

function moduleMatchesFilters(module, filterCategory, filterDifficulty) {
  if (!module) return false;
  if (filterCategory !== "all" && module.category !== filterCategory)
    return false;
  if (filterDifficulty !== "all" && module.difficulty !== filterDifficulty)
    return false;
  return true;
}

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
  const scrolledToNextKeyRef = useRef("");
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
    let cancelled = false;
    (async () => {
      try {
        const res = await userAPI.getDashboard();
        if (!cancelled) setDashboard(res.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        if (!cancelled) {
          setDashboard({
            modules: [],
            user: null,
            completedModuleIds: [],
            nextModule: null,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fetchPage = async () => {
      if (!dashboard) return;
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

  const nextModule =
    dashboard?.nextModule ??
    modulePath.find((m) => !completedModuleIds.includes(toModuleId(m._id)));

  const continueModule = useMemo(() => {
    const cur = dashboard?.user?.currentModule;
    if (cur?._id) {
      const idStr = toModuleId(cur._id);
      if (!completedModuleIds.includes(idStr)) {
        const mod = pathModules.find((m) => toModuleId(m._id) === idStr);
        if (mod) return mod;
      }
    }
    return nextModule;
  }, [
    dashboard?.user?.currentModule,
    pathModules,
    completedModuleIds,
    nextModule,
  ]);

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
  const xpBar = getXpBarProps(levelInfo);

  const continueModuleIdStr = continueModule
    ? toModuleId(continueModule._id)
    : "";

  useEffect(() => {
    scrolledToNextKeyRef.current = "";
  }, [continueModuleIdStr, filterCategory, filterDifficulty]);

  useEffect(() => {
    if (!dashboard || !continueModuleIdStr || !continueModule) return;
    if (
      !moduleMatchesFilters(continueModule, filterCategory, filterDifficulty)
    ) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        let page = 1;
        let totalPages = 1;
        do {
          const params = { page, limit: MODULES_FETCH_CAP };
          if (filterCategory !== "all") params.category = filterCategory;
          if (filterDifficulty !== "all") params.difficulty = filterDifficulty;
          const res = await modulesAPI.getAll("all", params);
          if (cancelled) return;
          const mods = res.data.modules || [];
          const pag = res.data.pagination || {};
          totalPages = Math.max(1, pag.totalPages || 1);
          if (mods.some((m) => toModuleId(m._id) === continueModuleIdStr)) {
            setQuestPage((p) => (p === page ? p : page));
            return;
          }
          page += 1;
        } while (page <= totalPages);
      } catch (e) {
        console.error("Could not locate continue module page:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    dashboard,
    continueModule,
    continueModuleIdStr,
    filterCategory,
    filterDifficulty,
  ]);

  const scrollToNextKey = continueModuleIdStr
    ? `${continueModuleIdStr}|${filterCategory}|${filterDifficulty}|p${questPage}`
    : "";

  useEffect(() => {
    if (loading || !scrollToNextKey || !continueModuleIdStr) return;
    if (scrolledToNextKeyRef.current === scrollToNextKey) return;
    const el = document.getElementById(`module-catalog-${continueModuleIdStr}`);
    if (!el) return;
    scrolledToNextKeyRef.current = scrollToNextKey;
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [gridModules, loading, scrollToNextKey, continueModuleIdStr]);

  const handleStartModule = async (moduleId) => {
    try {
      await userAPI.setCurrentModule(moduleId);
      if (refreshProfile) await refreshProfile();
      navigate(`/editor/${moduleId}`);
    } catch (error) {
      console.error("Error starting module:", error);
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="max-w-6xl mx-auto min-w-0 px-4 sm:px-6 py-8">
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
    "w-full min-w-0 sm:w-auto sm:min-w-[11rem] rounded-xl bg-blue-800 px-4 py-2.5 text-sm text-blue-50 outline-none focus:outline focus:outline-2 focus:outline-blue-400/50 cursor-pointer";

  const pageBtn =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed";

  return (
    <div className="max-w-6xl mx-auto min-w-0 px-4 sm:px-6 py-8 pb-16">
      <header className="mb-10 space-y-6">
        <div className="min-w-0">
          <p className="text-sm text-blue-300 mb-1">All lessons</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-blue-50 tracking-tight">
            Module catalog
          </h1>
          <p className="text-blue-300 mt-2 max-w-xl text-sm sm:text-base leading-relaxed">
            Browse everything in one place. Filters narrow the grid; your path
            card below matches Home. We jump to your continue lesson (in
            progress or next on the path) when it appears in the grid, including
            after changing pages.
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-blue-950/95 p-5 sm:p-6 lg:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-center min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-400 mb-2">
                Learning path
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-blue-50 tabular-nums">
                  {completionPct}%
                </span>
                <span className="text-sm text-blue-400 font-medium">
                  path complete
                </span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-blue-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-700"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <p className="text-xs text-blue-400 mt-2.5">
                <span className="text-blue-200 font-semibold tabular-nums">
                  {completedModuleIds.length}
                </span>
                <span className="text-blue-500"> / </span>
                <span className="tabular-nums">{totalPathModules}</span>
                <span className="text-blue-500"> modules on your track</span>
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col justify-center rounded-2xl bg-blue-950/55 px-4 py-4 sm:px-5 sm:py-5 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-400 mb-2">
                Your level
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-4xl sm:text-5xl font-black text-amber-300 tabular-nums shrink-0">
                  {level}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 text-[10px] text-blue-500 mb-1">
                    <span className="uppercase tracking-wide">To next</span>
                    <span className="tabular-nums text-blue-400 flex items-center gap-1">
                      <FaBolt className="text-amber-400/90 text-[9px]" />
                      {xpBar.xpToNext} XP
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-blue-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, xpBar.percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              {levelInfo?.rank?.title && (
                <p className="text-xs text-blue-300 mt-2.5 truncate">
                  {levelInfo.rank.title}
                </p>
              )}
            </div>

            <div className="lg:col-span-3 flex flex-col justify-center min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-400 mb-2">
                Continue
              </p>
              {continueModule &&
              moduleMatchesFilters(
                continueModule,
                filterCategory,
                filterDifficulty,
              ) &&
              !isModuleLocked(continueModule) ? (
                <>
                  <p className="text-sm font-semibold text-blue-50 line-clamp-2 leading-snug mb-4">
                    {continueModule.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleStartModule(continueModule._id)}
                    className="inline-flex w-full items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-blue-500 text-black text-sm font-bold hover:bg-blue-400 active:scale-[0.99] transition-all"
                  >
                    <FaPlay className="text-xs" />
                    Continue lesson
                  </button>
                </>
              ) : continueModule &&
                moduleMatchesFilters(
                  continueModule,
                  filterCategory,
                  filterDifficulty,
                ) &&
                isModuleLocked(continueModule) ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-50 line-clamp-2">
                    {continueModule.title}
                  </p>
                  <p className="text-xs text-blue-400 leading-relaxed flex items-start gap-2">
                    <FaLock className="text-xs mt-0.5 shrink-0" />
                    Complete the previous step on your path to unlock this
                    lesson.
                  </p>
                </div>
              ) : continueModule &&
                !moduleMatchesFilters(
                  continueModule,
                  filterCategory,
                  filterDifficulty,
                ) ? (
                <div className="space-y-3">
                  <p className="text-sm text-blue-300 leading-relaxed">
                    Your next lesson is hidden by the current filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory("all");
                      setFilterDifficulty("all");
                      setQuestPage(1);
                    }}
                    className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-black hover:bg-blue-600 transition-colors"
                  >
                    Reset filters and show next
                  </button>
                </div>
              ) : (
                <p className="text-sm text-blue-400 leading-relaxed">
                  You are caught up on your path. Browse any module below.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-3xl bg-blue-900 p-4 sm:p-6 mb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-50">
            <FaSlidersH className="text-blue-200" />
            Filter lessons
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:flex-1 sm:items-center min-w-0">
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
                className="w-full sm:w-auto rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-black hover:bg-blue-600"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {gridModules.map((module) => {
          const moduleIdStr = toModuleId(module._id);
          const done = completedModuleIds.includes(moduleIdStr);
          const isNext = continueModule
            ? toModuleId(continueModule._id) === moduleIdStr
            : false;
          const locked = isModuleLocked(module);
          return (
            <article
              id={`module-catalog-${moduleIdStr}`}
              key={module._id}
              className={`group flex flex-col rounded-3xl overflow-hidden transition-transform hover:-translate-y-0.5 scroll-mt-20 sm:scroll-mt-24 ${
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
                  <div className="absolute top-3 right-3 rounded-xl bg-emerald-600 px-2 py-1.5">
                    <FaCheckCircle className="text-white w-4 h-4" />
                  </div>
                )}
                {locked && !done && (
                  <div
                    className="absolute top-3 right-3 rounded-xl bg-blue-700 p-2"
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
                  <div className="absolute top-3 right-3 rounded-xl bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-950 uppercase tracking-wide">
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
                        ? "bg-blue-500 text-black hover:bg-blue-400 active:scale-[0.99]"
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
        <div className="rounded-3xl bg-blue-900 py-16 text-center mt-6">
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
