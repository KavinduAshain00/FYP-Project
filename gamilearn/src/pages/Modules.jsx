import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { modulesAPI, userAPI } from "../api/api";
import { FaCheckCircle, FaPlay, FaFilter } from "react-icons/fa";
import { GameLayout } from "../components/layout/GameLayout";

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modulesRes, profileRes] = await Promise.all([
          modulesAPI.getAll("all"),
          userAPI.getProfile(),
        ]);
        setModules(modulesRes.data.modules);
        setProfile(profileRes.data.user);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching modules:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartModule = async (moduleId) => {
    try {
      await userAPI.setCurrentModule(moduleId);
      if (refreshProfile) await refreshProfile();
      navigate(`/editor/${moduleId}`);
    } catch (error) {
      console.error("Error starting module:", error);
    }
  };

  const completedModuleIds = useMemo(() => {
    if (!profile?.completedModules || !Array.isArray(profile.completedModules))
      return [];
    return profile.completedModules
      .map((m) => {
        if (m?.moduleId) {
          if (typeof m.moduleId === "object" && m.moduleId !== null)
            return m.moduleId._id?.toString() || m.moduleId.toString();
          return m.moduleId.toString();
        }
        if (typeof m === "string") return m;
        if (m?._id) return m._id.toString();
        return null;
      })
      .filter(Boolean);
  }, [profile]);

  const modulePath = useMemo(() => {
    const pathCategories = profile?.pathCategories;
    const filtered = pathCategories?.length
      ? modules.filter((m) => pathCategories.includes(m.category))
      : modules;
    return [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [modules, profile?.pathCategories]);

  const toId = (id) => (id && typeof id === "object" && id._id ? String(id._id) : String(id));

  // Free no-key image API: Picsum Photos — deterministic per module via seed
  const getModuleImageUrl = (module, width = 400, height = 250) => {
    const seed = (module._id || module.title || "").toString().replace(/\s/g, "");
    return `https://picsum.photos/seed/${seed || "module"}/${width}/${height}`;
  };

  const nextModule = modulePath.find(
    (m) => !completedModuleIds.includes(toId(m._id)),
  );

  const filterOptions = useMemo(() => {
    const categories = [...new Set(modules.map((m) => m.category).filter(Boolean))].sort();
    const difficulties = [...new Set(modules.map((m) => m.difficulty).filter(Boolean))].sort();
    return { categories, difficulties };
  }, [modules]);

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      if (filterCategory !== "all" && m.category !== filterCategory) return false;
      if (filterDifficulty !== "all" && m.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [modules, filterCategory, filterDifficulty]);

  const completionPct = modules.length
    ? Math.round((completedModuleIds.length / modules.length) * 100)
    : 0;
  const levelInfo = profile?.levelInfo || null;
  const level = levelInfo?.level ?? profile?.level ?? 1;

  if (loading) {
    return (
      <GameLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center text-gray-400 min-h-[50vh]">
          Loading...
        </div>
      </GameLayout>
    );
  }

  const difficultyStyles = {
    easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    hard: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  };
  const getDifficultyClass = (d) =>
    difficultyStyles[d?.toLowerCase()] || "bg-gray-500/20 text-gray-400 border-gray-500/40";

  const toTitleCase = (str) =>
    (str || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <GameLayout>
      <div className="min-h-[60vh]">
        {/* Header strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Quests
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {completedModuleIds.length} of {modules.length} completed
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/80 border border-gray-700/80">
                <span className="text-gray-400 text-sm">Level</span>
                <span className="font-semibold text-cyan-400">{level}</span>
              </div>
              <div className="h-8 w-px bg-gray-600 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div
                  className="h-2 flex-1 min-w-[80px] rounded-full bg-gray-800 overflow-hidden"
                  style={{ width: 96 }}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm tabular-nums w-10">{completionPct}%</span>
              </div>
              {nextModule && (
                <button
                  onClick={() => handleStartModule(nextModule._id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30 font-medium text-sm transition-colors"
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
            <span className="inline-flex items-center gap-2 text-gray-400 text-sm font-medium">
              <FaFilter className="w-4 h-4" /> Filter
            </span>
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-700 bg-gray-800/60 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-shadow"
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
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-700 bg-gray-800/60 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-shadow"
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
                  }}
                  className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-500 transition-colors"
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
            {filteredModules.map((module) => {
              const moduleIdStr = toId(module._id);
              const done = completedModuleIds.includes(moduleIdStr);
              const isNext = nextModule ? toId(nextModule._id) === moduleIdStr : false;
              return (
                <article
                  key={module._id}
                  className={`group relative overflow-hidden rounded-2xl border bg-gray-900/60 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 ${
                    done
                      ? "border-gray-700/80 shadow-lg shadow-black/10"
                      : isNext
                        ? "border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                        : "border-gray-700/60 hover:border-gray-600"
                  }`}
                >
                  {/* Image + overlay */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-800">
                    <img
                      src={getModuleImageUrl(module)}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate drop-shadow-lg">
                        {module.title}
                      </h3>
                      {module.difficulty && (
                        <span
                          className={`inline-block mt-1.5 text-[10px] sm:text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${getDifficultyClass(module.difficulty)}`}
                        >
                          {module.difficulty}
                        </span>
                      )}
                    </div>
                    {done && (
                      <div className="absolute top-3 right-3 rounded-full bg-emerald-500/90 p-1.5 shadow-lg">
                        <FaCheckCircle className="text-white w-4 h-4" />
                      </div>
                    )}
                    {isNext && !done && (
                      <div className="absolute top-3 right-3 rounded-full bg-cyan-500/90 px-2 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
                        Next
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {module.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                        {module.description}
                      </p>
                    )}
                    {done ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm">
                          <FaCheckCircle className="text-emerald-500 shrink-0" /> Completed
                        </span>
                        <button
                          onClick={() => handleStartModule(module._id)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartModule(module._id)}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isNext
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30"
                            : "bg-gray-800 text-gray-200 border border-gray-600 hover:bg-gray-700 hover:border-gray-500"
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

          {filteredModules.length === 0 && (
            <div className="rounded-2xl border border-gray-700/60 bg-gray-800/30 py-16 text-center">
              <p className="text-gray-500 text-sm">No quests match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
};

export default Modules;
