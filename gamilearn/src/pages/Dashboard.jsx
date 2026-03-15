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
import LoadingScreen from "../components/ui/LoadingScreen";
import { toModuleId } from "../utils/ids";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await userAPI.getDashboard();
        setDashboardData(res.data || null);
        setLoading(false);
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

  const profile = dashboardData?.user ?? null;
  const modules = useMemo(() => dashboardData?.modules ?? [], [dashboardData?.modules]);
  const achievements = useMemo(() => dashboardData?.achievements ?? [], [dashboardData?.achievements]);
  const completedModuleIds = useMemo(
    () => (dashboardData?.completedModuleIds ?? []).map((id) => (id && id.toString()) || id),
    [dashboardData?.completedModuleIds],
  );

  const levelInfo = profile?.levelInfo ?? user?.levelInfo ?? null;
  const completionPercentage = dashboardData?.completionPercentage ?? (modules.length > 0 ? Math.round((completedModuleIds.length / modules.length) * 100) : 0);
  const experienceRank = levelInfo?.rank || { name: "Apprentice" };
  const totalPoints = levelInfo?.totalPoints ?? profile?.totalPoints ?? user?.totalPoints ?? 0;
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

  const nextModule = modulePath.find(
    (m) => !completedModuleIds.includes(toModuleId(m._id)),
  );

  if (loading) {
    return (
      <GameLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <LoadingScreen
            message="Loading your dashboard…"
            subMessage="Fetching your progress and modules"
          />
        </div>
      </GameLayout>
    );
  }

  const btnClass =
    "px-3 py-2 border border-[#2e3648] bg-[#1c2230] text-[#d8d0c4] text-sm font-medium hover:bg-[#242c3c] rounded-xl transition-colors";
  const btnPrimaryClass =
    "px-3 py-2 border border-[#4e9a8e]/40 bg-[#4e9a8e]/10 text-[#4e9a8e] text-sm font-medium hover:bg-[#4e9a8e]/20 rounded-xl transition-colors";

  return (
    <GameLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-[#d8d0c4]">
        {/* Hero card */}
        <div className="border border-[#252c3a] bg-[#111620] p-6 mb-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex items-center gap-4">
              {(profile?.avatarUrl || user?.avatarUrl) ? (
                <img
                  src={profile?.avatarUrl || user?.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 border border-[#2e3648] object-cover rounded-xl"
                />
              ) : (
                <div className="w-20 h-20 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center rounded-xl">
                  <FaUserCircle className="text-3xl text-[#585048]" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-[#d8d0c4]">
                    {profile?.name ?? user?.name}
                  </h1>
                  <span className="px-2 py-0.5 border border-[#c8a040]/30 bg-[#c8a040]/10 text-xs font-bold text-[#c8a040] rounded-lg">
                    {experienceRank.name.toUpperCase()}
                  </span>
                </div>
                <p className="text-[#706858] text-sm">{profile?.email ?? user?.email}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-[#585048]">
                  <span>
                    Level {level} → {level + 1}
                  </span>
                  <span>{xpToNextLevel} XP to next</span>
                </div>
                <div className="h-1.5 bg-[#1c2230] mt-1 overflow-hidden w-48 rounded-full">
                  <div
                    className="h-full bg-[#c8a040] rounded-full transition-all"
                    style={{ width: `${((totalPoints % 200) / 200) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Total XP
            </div>
            <div className="text-xl font-bold text-[#c8a040]">{totalPoints}</div>
          </div>
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Modules Done
            </div>
            <div className="text-xl font-bold text-[#d8d0c4]">
              {completedModuleIds.length}
            </div>
          </div>
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Achievements
            </div>
            <div className="text-xl font-bold text-[#d8d0c4]">
              {earnedAchievements}
            </div>
          </div>
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Progress
            </div>
            <div className="text-xl font-bold text-[#4e9a8e]">
              {completionPercentage}%
            </div>
          </div>
        </div>

        {/* Current quest */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-[#d8d0c4] mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-[#c8a040]" /> Current Quest
          </h2>
          <div className="border border-[#252c3a] bg-[#111620] p-6 rounded-2xl">
            {hasCurrentModule ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center shrink-0 rounded-xl">
                  <FaCode className="text-xl text-[#4e9a8e]" />
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 border border-[#4e9a8e]/30 bg-[#4e9a8e]/10 text-xs font-bold text-[#4e9a8e] mb-2 rounded-lg">
                    IN PROGRESS
                  </span>
                  <h3 className="text-lg font-bold text-[#d8d0c4] mb-1">
                    {profile.currentModule?.title || "Current Module"}
                  </h3>
                  <p className="text-[#9a9080] text-sm">
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
                <div className="w-14 h-14 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center shrink-0 rounded-xl">
                  <FaRocket className="text-xl text-[#c8a040]" />
                </div>
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 border border-[#c8a040]/30 bg-[#c8a040]/10 text-xs font-bold text-[#c8a040] mb-2 rounded-lg">
                    NEXT
                  </span>
                  <h3 className="text-lg font-bold text-[#d8d0c4] mb-1">
                    {nextModule.title}
                  </h3>
                  <p className="text-[#9a9080] text-sm">Ready to start</p>
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
                <div className="w-14 h-14 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center mx-auto mb-3 rounded-xl">
                  <FaTrophy className="text-2xl text-[#c8a040]" />
                </div>
                <h3 className="text-lg font-bold text-[#d8d0c4] mb-2">
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

        {/* Quest map */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#d8d0c4] flex items-center gap-2">
              <FaLayerGroup className="text-[#8070b0]" /> Your Quest Map
            </h2>
            <button
              onClick={() => navigate("/modules")}
              className="text-sm text-[#4e9a8e] hover:underline flex items-center gap-1"
            >
              All Modules <FaChevronRight />
            </button>
          </div>
          <p className="text-xs text-[#585048] mb-2">
            Modules in your chosen path: {profile?.learningPath?.replace("-", " ") || "All"}
          </p>
          <div className="border border-[#252c3a] bg-[#111620] p-4 overflow-x-auto rounded-2xl">
            <div className="flex items-center gap-2 min-w-max pb-2">
              {modulePath.map((module, index) => {
                const moduleIdStr = toModuleId(module._id);
                const prevIdStr = modulePath[index - 1] ? toModuleId(modulePath[index - 1]._id) : null;
                const isCompleted = completedModuleIds.includes(moduleIdStr);
                const isCurrent = toModuleId(profile?.currentModule?._id) === moduleIdStr;
                const isNext = nextModule ? toModuleId(nextModule._id) === moduleIdStr : false;
                // Beginner path: only first module unlocked; each next unlocks when previous is completed. Advanced: all unlocked.
                const isLocked =
                  profile?.learningPath === 'javascript-basics' &&
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
                      className={`flex flex-col items-center p-2 border-2 min-w-[72px] text-center rounded-xl transition-colors ${
                        isCompleted
                          ? "border-[#5c9650]/40 bg-[#5c9650]/5"
                          : isCurrent
                            ? "border-[#4e9a8e]/50 bg-[#4e9a8e]/5"
                            : isNext
                              ? "border-[#c8a040]/40 bg-[#c8a040]/5"
                              : isLocked
                                ? "border-[#252c3a] bg-[#111620]/50 opacity-50 cursor-not-allowed"
                                : "border-[#2e3648] hover:border-[#3a4258] bg-[#161c28]"
                      }`}
                    >
                      <div className="w-7 h-7 border border-[#2e3648] flex items-center justify-center mb-1 text-xs font-bold rounded-lg">
                        {isCompleted ? (
                          <FaCheckCircle className="text-[#5c9650] text-sm" />
                        ) : isLocked ? (
                          <FaLock className="text-[#585048] text-xs" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-[#d8d0c4] truncate w-full max-w-[64px]">
                        {module.title.length > 8 ? module.title.slice(0, 8) + "…" : module.title}
                      </span>
                    </button>
                    {index < modulePath.length - 1 && (
                      <span className="w-2 h-0.5 bg-[#2e3648] shrink-0" />
                    )}
                  </div>
                );
              })}
              {modulePath.length === 0 && (
                <p className="text-sm text-[#585048] py-2">
                  No modules in your path. <button onClick={() => navigate("/modules")} className="text-[#4e9a8e] hover:underline">Pick modules</button>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#d8d0c4] flex items-center gap-2">
              <FaTrophy className="text-[#c8a040]" /> Achievements
            </h3>
            <button
              onClick={() => navigate("/profile")}
              className="text-sm text-[#4e9a8e] hover:underline"
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
                  className={`flex items-center gap-2 p-2 border rounded-xl transition-colors ${
                    ach.earned
                      ? "border-[#c8a040]/30 bg-[#c8a040]/5"
                      : "border-[#252c3a] bg-[#111620] opacity-80"
                  }`}
                  title={ach.name}
                >
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg overflow-hidden bg-[#1c2230]">
                    {ach.icon ? (
                      <img
                        src={ach.icon}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                    ) : ach.earned ? (
                      <FaTrophy className="text-[#c8a040] text-sm" />
                    ) : (
                      <FaLock className="text-[#585048] text-sm" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-[#d8d0c4] truncate flex-1 min-w-0">
                    {ach.name}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* Available quests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#d8d0c4] flex items-center gap-2">
              <FaBookOpen className="text-[#5878a8]" /> Available Quests
            </h2>
            <button onClick={() => navigate("/modules")} className={btnClass}>
              <span className="flex items-center gap-2">
                Browse All <FaChevronRight />
              </span>
            </button>
          </div>
          {modules.length === 0 ? (
            <div className="border border-[#252c3a] bg-[#111620] p-8 text-center text-[#706858] rounded-2xl">
              No modules available
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.slice(0, 6).map((module) => {
                const moduleIdStr = toModuleId(module._id);
                const isCompleted = completedModuleIds.includes(moduleIdStr);
                const isCurrent = toModuleId(profile?.currentModule?._id) === moduleIdStr;
                return (
                  <button
                    key={module._id}
                    onClick={() => handleStartModule(module._id)}
                    className="border border-[#252c3a] bg-[#111620] p-4 text-left rounded-2xl hover:border-[#3a4258] hover:bg-[#161c28] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#d8d0c4] truncate">
                        {module.title}
                      </span>
                      {isCompleted && (
                        <FaCheckCircle className="text-[#5c9650] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#706858] line-clamp-2">
                      {module.description}
                    </p>
                    <span className={`inline-block mt-2 text-xs border px-2 py-0.5 rounded-lg ${
                      isCompleted
                        ? "border-[#5c9650]/30 text-[#5c9650] bg-[#5c9650]/5"
                        : isCurrent
                          ? "border-[#4e9a8e]/30 text-[#4e9a8e] bg-[#4e9a8e]/5"
                          : "border-[#2e3648] text-[#706858]"
                    }`}>
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
