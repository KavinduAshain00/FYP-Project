import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../api/api";
import { toast } from "react-toastify";
import {
  FaArrowRight,
  FaBookOpen,
  FaChevronRight,
  FaCode,
  FaCompass,
  FaDoorOpen,
  FaGamepad,
  FaLayerGroup,
  FaLock,
  FaMapMarkerAlt,
  FaPlay,
  FaRocket,
  FaTrophy,
  FaUser,
  FaUserCircle,
  FaCheckCircle,
} from "react-icons/fa";
import { GameLayout } from "../components/layout/GameLayout";

const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [ongoingGames, setOngoingGames] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await userAPI.getDashboard();
        const data = res.data;
        setModules(data.modules || []);
        setProfile(data.user || null);
        setAchievements(data.achievements || []);
        setLoading(false);
        try {
          const saved = localStorage.getItem("savedGameProjects");
          if (saved) {
            const list = JSON.parse(saved);
            setOngoingGames(Array.isArray(list) ? list : []);
          }
        } catch {
          setOngoingGames([]);
        }
        if (searchParams.get("message") === "start-basics") {
          toast.info(
            "Welcome! We've prepared JavaScript basics modules for you to start with.",
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

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
    if (!profile?.completedModules) return [];
    return profile.completedModules
      .map((m) => {
        if (m.moduleId && typeof m.moduleId === "object" && m.moduleId._id)
          return m.moduleId._id.toString();
        if (m.moduleId) return m.moduleId.toString();
        return null;
      })
      .filter(Boolean);
  }, [profile]);

  const levelInfo = profile?.levelInfo || user?.levelInfo || null;
  const completionPercentage =
    modules.length > 0
      ? Math.round((completedModuleIds.length / modules.length) * 100)
      : 0;
  const experienceRank = levelInfo?.rank || { name: "Apprentice" };
  const totalPoints =
    levelInfo?.totalPoints ?? profile?.totalPoints ?? user?.totalPoints ?? 0;
  const level = levelInfo?.level ?? profile?.level ?? user?.level ?? 1;
  const xpToNextLevel = levelInfo?.xpProgress?.xpToNext ?? 200;
  const hasCurrentModule = profile?.currentModule && profile.currentModule._id;
  const earnedAchievements = achievements.filter((a) => a.earned).length;

  const modulePath = useMemo(() => {
    const pathCategories = profile?.pathCategories;
    const filtered = pathCategories?.length
      ? modules.filter((m) => pathCategories.includes(m.category))
      : modules;
    return [...filtered].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [modules, profile?.pathCategories]);

  const toId = (id) => (id && typeof id === "object" && id._id ? String(id._id) : String(id));

  const nextModule = modulePath.find(
    (m) => !completedModuleIds.includes(toId(m._id)),
  );

  if (loading) {
    return (
      <GameLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center text-gray-400 min-h-[50vh]">
          Loading...
        </div>
      </GameLayout>
    );
  }

  const btnClass =
    "px-3 py-2 border border-gray-600 bg-gray-800 text-gray-200 text-sm font-medium hover:bg-gray-700 rounded";
  const btnPrimaryClass =
    "px-3 py-2 border border-gray-600 bg-gray-700 text-gray-100 text-sm font-medium hover:bg-gray-600 rounded";

  return (
    <GameLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-gray-200">
        <div className="border border-gray-700 bg-gray-900/50 p-6 mb-6 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex items-center gap-4">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 border border-gray-600 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 border border-gray-600 flex items-center justify-center rounded-lg">
                  <FaUserCircle className="text-3xl text-gray-500" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-100">
                    {user?.name}
                  </h1>
                  <span className="px-2 py-0.5 border border-gray-500 text-xs font-bold text-gray-400 rounded">
                    {experienceRank.name.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{user?.email}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Level {level} → {level + 1}
                  </span>
                  <span>{xpToNextLevel} XP to next</span>
                </div>
                <div className="h-1.5 bg-gray-700 mt-1 overflow-hidden w-48 rounded">
                  <div
                    className="h-full bg-gray-500 rounded"
                    style={{ width: `${((totalPoints % 200) / 200) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Total XP
            </div>
            <div className="text-xl font-bold text-gray-100">{totalPoints}</div>
          </div>
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Modules Done
            </div>
            <div className="text-xl font-bold text-gray-100">
              {completedModuleIds.length}
            </div>
          </div>
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Achievements
            </div>
            <div className="text-xl font-bold text-gray-100">
              {earnedAchievements}
            </div>
          </div>
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Progress
            </div>
            <div className="text-xl font-bold text-gray-100">
              {completionPercentage}%
            </div>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-gray-400" /> Current Quest
          </h2>
          <div className="border border-gray-700 bg-gray-900/50 p-6 rounded-lg">
            {hasCurrentModule ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 border border-gray-600 flex items-center justify-center shrink-0 rounded-lg">
                  <FaCode className="text-xl text-gray-400" />
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 border border-gray-500 text-xs font-bold text-gray-400 mb-2 rounded">
                    IN PROGRESS
                  </span>
                  <h3 className="text-lg font-bold text-gray-100 mb-1">
                    {profile.currentModule?.title || "Current Module"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Continue where you left off
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(`/editor/${profile.currentModule._id}`)
                  }
                  className={btnPrimaryClass}
                >
                  <span className="flex items-center gap-2">
                    <FaPlay /> Continue
                  </span>
                </button>
              </div>
            ) : nextModule ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 border border-gray-600 flex items-center justify-center shrink-0 rounded-lg">
                  <FaRocket className="text-xl text-gray-400" />
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 border border-gray-500 text-xs font-bold text-gray-400 mb-2 rounded">
                    NEXT
                  </span>
                  <h3 className="text-lg font-bold text-gray-100 mb-1">
                    {nextModule.title}
                  </h3>
                  <p className="text-gray-400 text-sm">Ready to start</p>
                </div>
                <button
                  onClick={() => handleStartModule(nextModule._id)}
                  className={btnPrimaryClass}
                >
                  <span className="flex items-center gap-2">
                    <FaPlay /> Start
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 border border-gray-600 flex items-center justify-center mx-auto mb-3 rounded-lg">
                  <FaTrophy className="text-2xl text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-100 mb-2">
                  All Quests Complete!
                </h3>
                <button
                  onClick={() => navigate("/modules")}
                  className={btnClass}
                >
                  <span className="flex items-center gap-2">
                    <FaCompass /> Browse Modules
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <FaLayerGroup className="text-gray-400" /> Your Quest Map
            </h2>
            <button
              onClick={() => navigate("/modules")}
              className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
            >
              All Modules <FaChevronRight />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Modules in your chosen path: {profile?.learningPath?.replace("-", " ") || "All"}
          </p>
          <div className="border border-gray-700 bg-gray-900/50 p-4 overflow-x-auto rounded-lg">
            <div className="flex items-center gap-2 min-w-max pb-2">
              {modulePath.map((module, index) => {
                const moduleIdStr = toId(module._id);
                const prevIdStr = modulePath[index - 1] ? toId(modulePath[index - 1]._id) : null;
                const isCompleted = completedModuleIds.includes(moduleIdStr);
                const isCurrent = toId(profile?.currentModule?._id) === moduleIdStr;
                const isNext = nextModule ? toId(nextModule._id) === moduleIdStr : false;
                const isLocked =
                  !isCompleted &&
                  !isCurrent &&
                  !isNext &&
                  index > 0 &&
                  prevIdStr !== null &&
                  !completedModuleIds.includes(prevIdStr);
                return (
                  <div key={module._id} className="flex items-center gap-2">
                    <button
                      onClick={() => !isLocked && handleStartModule(module._id)}
                      disabled={isLocked}
                      className={`flex flex-col items-center p-2 border-2 min-w-[72px] text-center rounded-lg ${
                        isCompleted
                          ? "border-gray-500 bg-gray-800"
                          : isCurrent
                            ? "border-cyan-500/60 bg-gray-800"
                            : isNext
                              ? "border-gray-500 bg-gray-800"
                              : isLocked
                                ? "border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed"
                                : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
                      }`}
                    >
                      <div className="w-7 h-7 border border-gray-600 flex items-center justify-center mb-1 text-xs font-bold rounded">
                        {isCompleted ? (
                          <FaCheckCircle className="text-emerald-400 text-sm" />
                        ) : isLocked ? (
                          <FaLock className="text-gray-500 text-xs" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-gray-200 truncate w-full max-w-[64px]">
                        {module.title.length > 8 ? module.title.slice(0, 8) + "…" : module.title}
                      </span>
                    </button>
                    {index < modulePath.length - 1 && (
                      <span className="w-2 h-0.5 bg-gray-600 shrink-0" />
                    )}
                  </div>
                );
              })}
              {modulePath.length === 0 && (
                <p className="text-sm text-gray-500 py-2">
                  No modules in your path. <button onClick={() => navigate("/modules")} className="text-cyan-400 hover:underline">Pick modules</button>
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
            <FaGamepad className="text-gray-400" /> Game Studio
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() =>
                profile?.gameStudioEnabled
                  ? navigate("/custom-game")
                  : toast.info(
                      "Complete your learning path to unlock Game Studio.",
                    )
              }
              className={`border-2 p-4 flex items-center gap-4 text-left rounded-lg ${
                profile?.gameStudioEnabled
                  ? "border-gray-600 bg-gray-900/50 hover:border-gray-500"
                  : "border-gray-700 bg-gray-900/30 opacity-60"
              }`}
            >
              <div className="w-12 h-12 border border-gray-600 flex items-center justify-center shrink-0 rounded-lg">
                {profile?.gameStudioEnabled ? (
                  <FaRocket className="text-gray-400" />
                ) : (
                  <FaLock className="text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-100">Create Game</h3>
                <p className="text-xs text-gray-400">Build from scratch</p>
              </div>
            </button>
            <button
              onClick={() =>
                profile?.gameStudioEnabled
                  ? navigate("/game-planning", {
                      state: { fromDashboard: true },
                    })
                  : toast.info(
                      "Complete your learning path to unlock Game Studio.",
                    )
              }
              className={`border-2 p-4 flex items-center gap-4 text-left rounded-lg ${
                profile?.gameStudioEnabled
                  ? "border-gray-600 bg-gray-900/50 hover:border-gray-500"
                  : "border-gray-700 bg-gray-900/30 opacity-60"
              }`}
            >
              <div className="w-12 h-12 border border-gray-600 flex items-center justify-center shrink-0 rounded-lg">
                {profile?.gameStudioEnabled ? (
                  <FaCompass className="text-gray-400" />
                ) : (
                  <FaLock className="text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-100">Plan Game</h3>
                <p className="text-xs text-gray-400">Game planning</p>
              </div>
            </button>
          </div>

          {profile?.gameStudioEnabled && ongoingGames.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Ongoing game creations</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {ongoingGames.slice(0, 6).map((project) => (
                  <button
                    key={project.name + (project.timestamp || "")}
                    onClick={() =>
                      navigate("/custom-game", {
                        state: { loadProject: project },
                      })
                    }
                    className="border border-gray-600 bg-gray-800/50 p-3 text-left rounded-lg hover:border-gray-500 hover:bg-gray-800"
                  >
                    <span className="font-medium text-gray-100 block truncate">{project.name || "Untitled"}</span>
                    <span className="text-xs text-gray-500">
                      {project.timestamp ? new Date(project.timestamp).toLocaleDateString() : ""} · {Object.keys(project.files || {}).length} files
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-100 flex items-center gap-2">
              <FaTrophy className="text-gray-400" /> Achievements
            </h3>
            <button
              onClick={() => navigate("/profile")}
              className="text-sm text-cyan-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {[...achievements]
              .sort((a, b) => (a.earned === b.earned ? 0 : a.earned ? -1 : 1))
              .slice(0, 6)
              .map((ach) => (
                <div
                  key={ach.id}
                  className={`flex items-center gap-2 p-2 border rounded-lg ${
                    ach.earned
                      ? "border-gray-500 bg-gray-800"
                      : "border-gray-700 bg-gray-800/50 opacity-80"
                  }`}
                  title={ach.name}
                >
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded overflow-hidden bg-gray-800">
                    {ach.icon ? (
                      <img
                        src={ach.icon}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                    ) : ach.earned ? (
                      <FaTrophy className="text-amber-400 text-sm" />
                    ) : (
                      <FaLock className="text-gray-500 text-sm" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-200 truncate flex-1 min-w-0">
                    {ach.name}
                  </span>
                </div>
              ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <FaBookOpen className="text-gray-400" /> Available Quests
            </h2>
            <button onClick={() => navigate("/modules")} className={btnClass}>
              <span className="flex items-center gap-2">
                Browse All <FaChevronRight />
              </span>
            </button>
          </div>
          {modules.length === 0 ? (
            <div className="border border-gray-700 bg-gray-900/50 p-8 text-center text-gray-400 rounded-lg">
              No modules available
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.slice(0, 6).map((module) => {
                const isCompleted = completedModuleIds.includes(module._id);
                const isCurrent = profile?.currentModule?._id === module._id;
                return (
                  <button
                    key={module._id}
                    onClick={() => handleStartModule(module._id)}
                    className="border border-gray-700 bg-gray-900/50 p-4 text-left rounded-lg hover:border-gray-600 hover:bg-gray-800/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-100 truncate">
                        {module.title}
                      </span>
                      {isCompleted && (
                        <FaCheckCircle className="text-gray-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {module.description}
                    </p>
                    <span className="inline-block mt-2 text-xs text-gray-500 border border-gray-600 px-2 py-0.5 rounded">
                      {isCompleted ? "Done" : isCurrent ? "Active" : "Start"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </GameLayout>
  );
};

export default Dashboard;
