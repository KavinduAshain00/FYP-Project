import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { modulesAPI, userAPI } from "../api/api";
import { FaCheckCircle, FaPlay, FaFilter, FaLock } from "react-icons/fa";
import { GameLayout } from "../components/layout/GameLayout";
import LoadingScreen from "../components/ui/LoadingScreen";
import { toModuleId } from "../utils/ids";

const MODULES_PER_PAGE = 12;

const Modules = () => {
  const [gridModules, setGridModules] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: MODULES_PER_PAGE, totalPages: 1 });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [questPage, setQuestPage] = useState(1);
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Dashboard once: path modules, profile, nextModule, filter options
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await userAPI.getDashboard();
        setDashboard(res.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        setDashboard({ modules: [], user: null, completedModuleIds: [], nextModule: null });
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Paginated grid: refetch when page or filters change
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
        setPagination(res.data.pagination || { total: 0, page: questPage, limit: MODULES_PER_PAGE, totalPages: 1 });
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
  const pathModules = useMemo(() => dashboard?.modules ?? [], [dashboard?.modules]);
  const completedModuleIds = useMemo(() => {
    if (!dashboard?.completedModuleIds) return [];
    return dashboard.completedModuleIds.map((id) => (id && id.toString()) || id).filter(Boolean);
  }, [dashboard?.completedModuleIds]);

  const modulePath = useMemo(() => {
    return [...pathModules].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [pathModules]);

  const getModuleImageUrl = (module, width = 400, height = 250) => {
    const seed = (module._id || module.title || "").toString().replace(/\s/g, "");
    return `https://picsum.photos/seed/${seed || "module"}/${width}/${height}`;
  };

  const nextModule = dashboard?.nextModule ?? (modulePath.find(
    (m) => !completedModuleIds.includes(toModuleId(m._id)),
  ));

  // Beginner path (javascript-basics): lock all modules except the first; unlock next when previous is completed
  const lockedModuleIds = useMemo(() => {
    if (profile?.learningPath !== "javascript-basics") return new Set();
    const pathIds = modulePath.map((m) => toModuleId(m._id));
    const locked = new Set();
    for (let i = 1; i < pathIds.length; i++) {
      if (!completedModuleIds.includes(pathIds[i - 1])) locked.add(pathIds[i]);
    }
    return locked;
  }, [profile?.learningPath, modulePath, completedModuleIds]);
  const isModuleLocked = (moduleId) => lockedModuleIds.has(toModuleId(moduleId));

  const filterOptions = useMemo(() => {
    const categories = [...new Set(pathModules.map((m) => m.category).filter(Boolean))].sort();
    const difficulties = [...new Set(pathModules.map((m) => m.difficulty).filter(Boolean))].sort();
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
      <GameLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <LoadingScreen
            message="Loading modules…"
            subMessage="Fetching lessons and your progress"
          />
        </div>
      </GameLayout>
    );
  }

  const difficultyStyles = {
    easy: "bg-[#5c9650]/15 text-[#5c9650] border-[#5c9650]/30",
    medium: "bg-[#c8a040]/15 text-[#c8a040] border-[#c8a040]/30",
    hard: "bg-[#c04848]/15 text-[#c04848] border-[#c04848]/30",
  };
  const getDifficultyClass = (d) =>
    difficultyStyles[d?.toLowerCase()] || "bg-[#585048]/15 text-[#9a9080] border-[#585048]/30";

  const toTitleCase = (str) =>
    (str || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <GameLayout>
      <div className="min-h-[60vh]">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#d8d0c4] tracking-tight">
                Quests
              </h1>
              <p className="text-[#706858] text-sm mt-0.5">
                {completedModuleIds.length} of {totalPathModules} completed
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111620] border border-[#252c3a]">
                <span className="text-[#706858] text-sm">Level</span>
                <span className="font-semibold text-[#c8a040]">{level}</span>
              </div>
              <div className="h-8 w-px bg-[#252c3a] hidden sm:block" />
              <div className="flex items-center gap-2">
                <div
                  className="h-2 flex-1 min-w-[80px] rounded-full bg-[#1c2230] overflow-hidden"
                  style={{ width: 96 }}
                >
                  <div
                    className="h-full rounded-full bg-[#4e9a8e] transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="text-[#706858] text-sm tabular-nums w-10">{completionPct}%</span>
              </div>
              {nextModule && (
                <button
                  onClick={() => handleStartModule(nextModule._id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4e9a8e]/10 text-[#4e9a8e] border border-[#4e9a8e]/30 hover:bg-[#4e9a8e]/20 font-medium text-sm transition-colors"
                >
                  <FaPlay className="text-xs" /> Continue
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-[#9a9080] text-sm font-medium">
              <FaFilter className="w-4 h-4" /> Filter
            </span>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCategory}
                onChange={(e) => { setFilterCategory(e.target.value); setQuestPage(1); }}
                className="px-3 py-2 rounded-xl border border-[#252c3a] bg-[#111620] text-[#d8d0c4] text-sm focus:outline-none focus:ring-2 focus:ring-[#4e9a8e]/30 focus:border-[#4e9a8e]/40 transition-shadow"
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
                onChange={(e) => { setFilterDifficulty(e.target.value); setQuestPage(1); }}
                className="px-3 py-2 rounded-xl border border-[#252c3a] bg-[#111620] text-[#d8d0c4] text-sm focus:outline-none focus:ring-2 focus:ring-[#4e9a8e]/30 focus:border-[#4e9a8e]/40 transition-shadow"
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
                  className="px-3 py-2 rounded-xl text-sm text-[#9a9080] hover:text-[#d8d0c4] border border-[#2e3648] hover:border-[#3a4258] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {gridModules.map((module) => {
              const moduleIdStr = toModuleId(module._id);
              const done = completedModuleIds.includes(moduleIdStr);
              const isNext = nextModule ? toModuleId(nextModule._id) === moduleIdStr : false;
              const isLocked = isModuleLocked(module._id);
              return (
                <article
                  key={module._id}
                  className={`group relative overflow-hidden rounded-2xl border bg-[#111620] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 ${
                    isLocked
                      ? "border-[#252c3a] opacity-75"
                      : done
                        ? "border-[#5c9650]/30"
                        : isNext
                          ? "border-[#4e9a8e]/40"
                          : "border-[#252c3a] hover:border-[#3a4258]"
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1c2230]">
                    <img
                      src={getModuleImageUrl(module)}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-80"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-[#0d1017]/70" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-semibold text-[#d8d0c4] text-sm sm:text-base truncate">
                        {module.title}
                      </h3>
                      {module.difficulty && (
                        <span
                          className={`inline-block mt-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg border ${getDifficultyClass(module.difficulty)}`}
                        >
                          {module.difficulty}
                        </span>
                      )}
                    </div>
                    {done && (
                      <div className="absolute top-3 right-3 rounded-full bg-[#5c9650] p-1.5">
                        <FaCheckCircle className="text-white w-4 h-4" />
                      </div>
                    )}
                    {isLocked && !done && (
                      <div className="absolute top-3 right-3 rounded-full bg-[#1c2230] border border-[#2e3648] p-1.5" title="Complete the previous quest first">
                        <FaLock className="text-[#585048] w-4 h-4" />
                      </div>
                    )}
                    {isNext && !done && !isLocked && (
                      <div className="absolute top-3 right-3 rounded-lg bg-[#c8a040] px-2 py-1 text-[10px] font-bold text-[#0d1017] uppercase tracking-wider">
                        Next
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {module.description && (
                      <p className="text-xs text-[#706858] line-clamp-2 mb-4">
                        {module.description}
                      </p>
                    )}
                    {done ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[#9a9080] text-sm">
                          <FaCheckCircle className="text-[#5c9650] shrink-0" /> Completed
                        </span>
                        <button
                          onClick={() => handleStartModule(module._id)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#2e3648] text-[#d8d0c4] hover:bg-[#1c2230] hover:border-[#3a4258] transition-all"
                        >
                          Retry
                        </button>
                      </div>
                    ) : isLocked ? (
                      <button
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#252c3a] bg-[#161c28] text-[#585048] cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <FaLock className="text-xs" /> Complete previous quest first
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartModule(module._id)}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isNext
                            ? "bg-[#4e9a8e]/10 text-[#4e9a8e] border border-[#4e9a8e]/30 hover:bg-[#4e9a8e]/20"
                            : "bg-[#1c2230] text-[#d8d0c4] border border-[#2e3648] hover:bg-[#242c3c] hover:border-[#3a4258]"
                        }`}
                      >
                        {isNext ? "Continue quest" : "Start quest"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {gridModules.length === 0 && !loading && (
            <div className="rounded-2xl border border-[#252c3a] bg-[#111620] py-16 text-center">
              <p className="text-[#706858] text-sm">No quests match your filters.</p>
            </div>
          )}
          {totalQuestPages > 1 && gridModules.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setQuestPage((p) => Math.max(1, p - 1))}
                disabled={questPage <= 1}
                className="px-4 py-2 rounded-xl border border-[#252c3a] bg-[#161c28] text-[#d8d0c4] text-sm font-medium hover:bg-[#1c2230] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[#9a9080] text-sm">
                Page {questPage} of {totalQuestPages}
              </span>
              <button
                type="button"
                onClick={() => setQuestPage((p) => Math.min(totalQuestPages, p + 1))}
                disabled={questPage >= totalQuestPages}
                className="px-4 py-2 rounded-xl border border-[#252c3a] bg-[#161c28] text-[#d8d0c4] text-sm font-medium hover:bg-[#1c2230] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
};

export default Modules;
