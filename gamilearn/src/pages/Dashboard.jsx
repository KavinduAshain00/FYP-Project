import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useShellPagesCache } from '../context/ShellPagesCacheContext';
import { userAPI } from '../api/api';
import { toast } from 'react-toastify';
import {
  FaArrowRight,
  FaBookOpen,
  FaBolt,
  FaCompass,
  FaLock,
  FaPlay,
  FaRocket,
  FaStar,
  FaTrophy,
  FaUserCircle,
  FaCheckCircle,
  FaChevronRight,
} from 'react-icons/fa';
import LoadingScreen from '../components/ui/LoadingScreen';
import { toModuleId } from '../utils/ids';
import { getLastWorkedEditorModuleId } from '../utils/draftStorage';

const ease = [0.25, 0.1, 0.25, 1];

const difficultyRankLabel = (d) => {
  if (d === 'advanced') return 'Elite';
  if (d === 'intermediate') return 'Veteran';
  return 'Trainee';
};

const Dashboard = () => {
  const { peek, put } = useShellPagesCache();
  const cached = peek('dashboard');
  const [dashboardData, setDashboardData] = useState(() => cached?.dashboardData ?? null);
  const [loading, setLoading] = useState(() => (cached?.dashboardData != null ? false : true));
  const [lastWorkedModuleId, setLastWorkedModuleId] = useState(() => cached?.lastWorkedModuleId ?? null);
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const snapshotRef = useRef({});
  snapshotRef.current = { dashboardData, lastWorkedModuleId, loading };
  useEffect(() => () => put('dashboard', snapshotRef.current), [put]);

  const dashboardDataRef = useRef(dashboardData);
  dashboardDataRef.current = dashboardData;

  useEffect(() => {
    const basicsMsg = searchParams.get('message') === 'start-basics';
    if (dashboardDataRef.current != null && !basicsMsg) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await userAPI.getDashboard();
        if (cancelled) return;
        setDashboardData(res.data || null);
        if (basicsMsg) {
          toast.info(
            'Welcome! Your JavaScript basics modules are ready - start from the first lesson on your path.'
          );
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!cancelled) setDashboardData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const loadLastWorkedModule = async () => {
      const moduleId = await getLastWorkedEditorModuleId();
      if (active) setLastWorkedModuleId(moduleId);
    };
    loadLastWorkedModule();
    return () => {
      active = false;
    };
  }, []);

  const handleStartModule = async (moduleId) => {
    try {
      await userAPI.setCurrentModule(moduleId);
      if (refreshProfile) await refreshProfile();
      navigate(`/editor/${moduleId}`);
    } catch (error) {
      console.error('Error starting module:', error);
    }
  };

  const profile = dashboardData?.user ?? null;
  const modules = useMemo(() => dashboardData?.modules ?? [], [dashboardData?.modules]);
  const achievements = useMemo(
    () => dashboardData?.achievements ?? [],
    [dashboardData?.achievements]
  );
  const completedModuleIds = useMemo(
    () => (dashboardData?.completedModuleIds ?? []).map((id) => (id && id.toString()) || id),
    [dashboardData?.completedModuleIds]
  );

  const levelInfo = profile?.levelInfo ?? user?.levelInfo ?? null;
  const completionPercentage =
    dashboardData?.completionPercentage ??
    (modules.length > 0 ? Math.round((completedModuleIds.length / modules.length) * 100) : 0);
  const experienceRank = levelInfo?.rank || { name: 'Apprentice' };
  const totalPoints = levelInfo?.totalPoints ?? profile?.totalPoints ?? user?.totalPoints ?? 0;
  const level = levelInfo?.level ?? profile?.level ?? user?.level ?? 1;
  const xpToNextLevel = levelInfo?.xpProgress?.xpToNext ?? 200;
  const currentModuleFromCatalog = useMemo(() => {
    const id = toModuleId(profile?.currentModule?._id);
    if (!id) return null;
    return modules.find((m) => toModuleId(m._id) === id) || null;
  }, [modules, profile?.currentModule?._id]);
  const hasCurrentModule =
    Boolean(profile?.currentModule && profile.currentModule._id) &&
    !(
      profile?.learningPath === 'advanced' &&
      currentModuleFromCatalog?.category === 'javascript-basics'
    );
  const modulePath = useMemo(() => {
    const pathCategories = profile?.pathCategories;
    const filtered = pathCategories?.length
      ? modules.filter((m) => pathCategories.includes(m.category))
      : modules;
    const withoutBasics =
      profile?.learningPath === 'advanced'
        ? filtered.filter((m) => m?.category !== 'javascript-basics')
        : filtered;
    return [...withoutBasics].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [modules, profile?.pathCategories, profile?.learningPath]);
  const continueModuleFromStorage = useMemo(() => {
    const id = toModuleId(lastWorkedModuleId);
    if (!id) return null;
    return modulePath.find((m) => toModuleId(m._id) === id) || null;
  }, [modulePath, lastWorkedModuleId]);
  const continueModule =
    continueModuleFromStorage || (hasCurrentModule ? currentModuleFromCatalog : null);
  const continueModuleId = toModuleId(continueModule?._id);
  const earnedAchievements = achievements.filter((a) => a.earned).length;

  const nextModule = modulePath.find((m) => !completedModuleIds.includes(toModuleId(m._id)));

  const pathCompletedCount = useMemo(() => {
    const pathIds = new Set(modulePath.map((m) => toModuleId(m._id)));
    return completedModuleIds.filter((id) => pathIds.has(id)).length;
  }, [modulePath, completedModuleIds]);

  const pathProgressPercent = modulePath.length
    ? Math.min(100, Math.round((pathCompletedCount / modulePath.length) * 100))
    : 0;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:min-h-0 lg:max-h-[100dvh] lg:overflow-hidden lg:h-[100dvh] lg:flex lg:items-center lg:justify-center lg:py-6">
        <LoadingScreen
            message="Loading your home"
            subMessage="Pulling up your progress, path, and next steps"
          />
      </div>
    );
  }

  const btnPrimary =
    'inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-500 text-black text-sm font-semibold shadow-md shadow-black/30 hover:bg-blue-400 active:scale-[0.99] transition-all w-full sm:w-auto';

  const pathLabel = profile?.learningPath?.replace('-', ' ') || 'All topics';

  const heroHeadline = continueModule
    ? continueModule.title
    : nextModule
      ? nextModule.title
      : 'You are caught up';
  const heroSub =
    continueModule
      ? 'Your work is saved automatically - pick up right where you left off.'
      : nextModule
        ? 'When you are ready, open the next lesson on your path.'
        : 'Browse the full catalog anytime for more lessons.';

  return (
    <div
      className={
        'max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 text-blue-50 ' +
        'lg:py-4 lg:pb-4 lg:h-[100dvh] lg:max-h-[100dvh] lg:min-h-0 lg:overflow-hidden lg:flex lg:flex-col'
      }
    >
        {/* -- Top: command center -- */}
        <motion.section
          className="shrink-0 rounded-3xl overflow-hidden relative mb-10 lg:mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <div className="absolute inset-0 bg-blue-900" />

          <div className="relative p-6 sm:p-8 lg:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-3 items-stretch">
              <div className="lg:col-span-8 rounded-2xl bg-blue-900/70 p-5 lg:p-5 shadow-lg shadow-black/30">
                <div className="flex gap-4 sm:gap-5 items-start">
                  <div className="relative shrink-0">
                    {profile?.avatarUrl || user?.avatarUrl ? (
                      <img
                        src={profile?.avatarUrl || user?.avatarUrl}
                        alt={`${profile?.name ?? user?.name ?? 'Your'} profile photo`}
                        className="w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] rounded-full object-cover object-center shadow-xl shadow-black/45"
                      />
                    ) : (
                      <div
                        className="w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem] rounded-full flex items-center justify-center bg-blue-600 shadow-xl shadow-black/40"
                        aria-hidden
                      >
                        <FaUserCircle className="text-[2.85rem] sm:text-[3.1rem] text-blue-100/90 -mb-0.5" />
                      </div>
                    )}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 min-w-[1.625rem] h-7 px-1.5 rounded-full bg-blue-300 text-blue-950 text-[11px] font-bold font-display flex items-center justify-center shadow-md tabular-nums"
                      title={`Level ${level}`}
                    >
                      {level}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-200">
                      Home
                    </p>
                    <h1 className="mt-1.5 text-3xl sm:text-4xl lg:text-3xl xl:text-[2rem] font-bold text-blue-50 leading-tight tracking-tight">
                      Hi,{' '}
                      <span className="text-blue-200">{profile?.name ?? user?.name ?? 'there'}</span>
                    </h1>
                    <p className="mt-2.5 text-blue-200 text-sm lg:text-xs leading-relaxed">
                      <span className="text-blue-50 font-medium">{experienceRank.name}</span> ·{' '}
                      <span className="text-blue-200 font-medium capitalize">{pathLabel}</span> track ·
                      level {level}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-blue-300 mb-1.5">
                    <span>XP to level {level + 1}</span>
                    <span className="tabular-nums">{xpToNextLevel} XP left</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-blue-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-blue-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${((totalPoints % 200) / 200) * 100}%` }}
                      transition={{ duration: 0.8, ease }}
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl bg-blue-900/75 p-5 lg:p-4 shadow-lg shadow-black/30 flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-blue-300 uppercase tracking-wider">Suggested next</p>
                    <p className="text-sm font-semibold text-blue-50 leading-snug line-clamp-2">
                      {heroHeadline}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-300 leading-relaxed">{heroSub}</p>
                <div className="mt-4">
                  {continueModule ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/editor/${continueModuleId}`)}
                      className={btnPrimary}
                    >
                      <FaPlay className="text-xs" /> Continue in editor
                    </button>
                  ) : nextModule ? (
                    <button
                      type="button"
                      onClick={() => handleStartModule(nextModule._id)}
                      className={btnPrimary}
                    >
                      <FaRocket className="text-xs" /> Start next lesson
                    </button>
                  ) : (
                    <button type="button" onClick={() => navigate('/modules')} className={btnPrimary}>
                      <FaCompass className="text-xs" /> Browse modules
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* -- Metrics ribbon -- */}
        <motion.div
          className="shrink-0 flex flex-wrap gap-3 sm:gap-4 mb-12 lg:mb-3 lg:gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.4, ease }}
        >
          {[
            { icon: FaBolt, label: 'Total XP', value: totalPoints, accent: 'text-amber-300' },
            {
              icon: FaCheckCircle,
              label: 'Modules done',
              value: `${completedModuleIds.length}/${modulePath.length || modules.length}`,
              accent: 'text-emerald-300',
            },
            { icon: FaTrophy, label: 'Achievements', value: earnedAchievements, accent: 'text-violet-300' },
            {
              icon: FaBookOpen,
              label: 'Path progress',
              value: `${completionPercentage}%`,
              accent: 'text-cyan-300',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 min-w-[140px] flex-1 sm:flex-none sm:min-w-[160px] lg:min-w-0 lg:flex-1 rounded-2xl bg-blue-900 px-4 py-3 lg:px-3 lg:py-2 shadow-lg shadow-black/25"
            >
              <span className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl bg-blue-800/90 flex items-center justify-center shrink-0">
                <item.icon className={`text-sm ${item.accent}`} />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-300">{item.label}</p>
                <p
                  className={`text-lg lg:text-base font-bold tabular-nums ${item.accent}`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        <div
          className={
            'flex flex-col gap-8 xl:gap-6 min-h-0 flex-1 ' +
            'lg:overflow-y-auto xl:overflow-hidden xl:grid xl:grid-cols-12'
          }
        >
          {/* -- Path: vertical list -- */}
          <motion.section
            className="flex flex-col min-h-0 xl:col-span-7 xl:h-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease }}
          >
            <div className="shrink-0 flex items-end justify-between gap-4 mb-3 lg:mb-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-300/90 font-display mb-1">
                  Quest map
                </p>
                <h2 className="text-xl lg:text-lg font-bold text-blue-50 font-display tracking-tight">
                  Your path
                </h2>
                <p className="text-sm lg:text-xs text-blue-300 mt-1 line-clamp-2 xl:line-clamp-1">
                  Clear stages in order—each victory unlocks the next checkpoint on your run.
                </p>
              </div>
            </div>
            <div className="rounded-3xl bg-blue-950 border border-blue-800/60 shadow-xl shadow-black/35 overflow-hidden flex-1 min-h-0 flex flex-col relative">
              {modulePath.length === 0 ? (
                <p className="text-sm text-blue-300 p-8 text-center relative z-[1]">
                  Nothing listed on this path yet.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/modules')}
                    className="text-blue-200 font-semibold hover:underline"
                  >
                    Browse all modules
                  </button>
                </p>
              ) : (
                <>
                  <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 relative z-[1]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                        Campaign progress
                      </p>
                      <p className="text-xs font-bold tabular-nums text-blue-100">
                        {pathCompletedCount}
                        <span className="text-blue-400 font-medium"> / </span>
                        {modulePath.length}
                        <span className="text-blue-400 font-medium ml-1">stages</span>
                      </p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-neutral-900 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-blue-500"
                        initial={false}
                        animate={{ width: `${pathProgressPercent}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto min-h-0 flex-1 lg:max-xl:max-h-[min(42vh,24rem)] xl:max-h-none scrollbar-hide px-3 sm:px-5 py-4 relative z-[1]">
                    <div className="space-y-0">
                      {modulePath.map((module, index) => {
                        const moduleIdStr = toModuleId(module._id);
                        const prevIdStr = modulePath[index - 1]
                          ? toModuleId(modulePath[index - 1]._id)
                          : null;
                        const isCompleted = completedModuleIds.includes(moduleIdStr);
                        const isCurrent = toModuleId(profile?.currentModule?._id) === moduleIdStr;
                        const isNext = nextModule ? toModuleId(nextModule._id) === moduleIdStr : false;
                        const isLocked =
                          profile?.learningPath === 'javascript-basics' &&
                          !isCompleted &&
                          !isCurrent &&
                          !isNext &&
                          index > 0 &&
                          prevIdStr !== null &&
                          !completedModuleIds.includes(prevIdStr);
                        const isLast = index === modulePath.length - 1;
                        const connectorClass = isCompleted
                          ? 'bg-blue-500'
                          : isLocked
                            ? 'bg-blue-900/90 opacity-70'
                            : 'bg-blue-700/50';

                        const nodeClass = (() => {
                          if (isCompleted) {
                            return 'bg-blue-400 text-blue-950 shadow-lg shadow-blue-400/35';
                          }
                          if (isCurrent) {
                            return 'bg-blue-500 text-black shadow-lg shadow-blue-400/45 animate-pulse';
                          }
                          if (isNext && !isLocked) {
                            return 'bg-blue-200 text-blue-950 shadow-lg shadow-blue-300/50';
                          }
                          if (isLocked) {
                            return 'bg-neutral-900 text-blue-500 opacity-75';
                          }
                          return 'bg-blue-800 text-blue-100 shadow-md shadow-black/20';
                        })();

                        return (
                          <div key={module._id} className="flex gap-3 sm:gap-4 items-start">
                            <div className="flex flex-col items-center w-12 sm:w-14 shrink-0">
                              <motion.div
                                initial={{ scale: 0.85, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.045, duration: 0.35, ease }}
                                className={`relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold font-display ${nodeClass}`}
                              >
                                {isCompleted ? (
                                  <FaCheckCircle className="text-xl sm:text-2xl" />
                                ) : isLocked ? (
                                  <FaLock className="text-base" />
                                ) : isCurrent ? (
                                  <FaPlay className="text-sm ml-0.5" />
                                ) : (
                                  <span className="tabular-nums">{index + 1}</span>
                                )}
                              </motion.div>
                              {!isLast && (
                                <div
                                  className={`w-1 sm:w-1.5 h-10 sm:h-12 mt-1.5 rounded-full shrink-0 ${connectorClass}`}
                                />
                              )}
                            </div>
                            <motion.div
                              className={`flex-1 min-w-0 ${isLast ? '' : 'pb-5 sm:pb-6'}`}
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.08 + index * 0.04, duration: 0.35, ease }}
                            >
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => !isLocked && handleStartModule(module._id)}
                                className={`w-full text-left rounded-2xl p-3.5 sm:p-4 transition-all duration-200 ${
                                  isLocked
                                    ? 'bg-neutral-900/60 cursor-not-allowed opacity-80'
                                    : isCurrent
                                      ? 'bg-blue-800/50 shadow-lg shadow-blue-950/40 hover:bg-blue-800/70'
                                      : isNext
                                        ? 'bg-blue-900/70 hover:bg-blue-800/60 shadow-md shadow-blue-950/30'
                                        : isCompleted
                                          ? 'bg-blue-900/35 hover:bg-blue-900/55'
                                          : 'bg-blue-900/50 hover:bg-blue-800/55'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                                        Stage {index + 1}
                                      </span>
                                      <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-neutral-900 text-blue-200">
                                        {difficultyRankLabel(module.difficulty)}
                                      </span>
                                    </div>
                                    <h3 className="mt-1.5 font-display font-bold text-blue-50 text-base sm:text-[15px] leading-snug">
                                      {module.title}
                                    </h3>
                                    {module.description && (
                                      <p className="text-xs text-blue-300 line-clamp-2 mt-1.5 leading-relaxed">
                                        {module.description}
                                      </p>
                                    )}
                                  </div>
                                  {!isLocked && (
                                    <span className="shrink-0 flex flex-col items-end gap-1.5">
                                      {isNext && !isCompleted && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-blue-50 text-blue-950 shadow-sm">
                                          <FaStar className="text-[10px]" /> Next
                                        </span>
                                      )}
                                      {isCurrent && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-blue-500 text-black">
                                          <FaBolt className="text-[10px]" /> Active
                                        </span>
                                      )}
                                      {isCompleted && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-blue-300">
                                          Cleared
                                        </span>
                                      )}
                                      <FaChevronRight className="text-blue-400 text-sm mt-0.5" />
                                    </span>
                                  )}
                                </div>
                              </button>
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.section>

          {/* -- Achievements + quick lessons -- */}
          <div className="flex flex-col gap-8 xl:gap-4 min-h-0 xl:col-span-5 xl:h-full xl:min-h-0">
            <motion.section
              className="shrink-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
            >
              <div className="flex items-end justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-xl lg:text-lg font-bold text-blue-50">Achievements</h2>
                  <p className="text-sm lg:text-xs text-blue-300 mt-1">
                    Recent achievements badges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="text-xs sm:text-sm font-semibold text-blue-200 hover:text-blue-100 shrink-0"
                >
                  Open profile →
                </button>
              </div>

              <div className="rounded-3xl p-4 lg:p-3 bg-blue-900 shadow-xl shadow-black/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-2.5">
                  {[...achievements]
                    .sort((a, b) => (a.earned === b.earned ? 0 : a.earned ? -1 : 1))
                    .slice(0, 8)
                    .map((ach) => (
                      <div
                        key={ach.id}
                        title={ach.name}
                        className={`rounded-2xl p-3 transition-colors ${
                          ach.earned
                            ? 'bg-blue-800'
                            : 'bg-blue-900'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                            ach.earned ? 'bg-blue-700' : 'bg-blue-800'
                          }`}
                        >
                          {ach.icon ? (
                            <img
                              src={ach.icon}
                              alt=""
                              className="w-6 h-6 object-contain brightness-0 invert"
                            />
                          ) : ach.earned ? (
                            <FaTrophy className="text-blue-50" />
                          ) : (
                            <FaLock className="text-blue-50 text-sm" />
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-blue-50 text-center line-clamp-2 leading-tight">
                          {ach.name}
                        </p>
                        <p
                          className={`mt-1 text-[10px] font-semibold text-center uppercase tracking-wide ${
                            ach.earned ? 'text-blue-200' : 'text-blue-300'
                          }`}
                        >
                          {ach.earned ? 'Unlocked' : 'Locked'}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </motion.section>

            <motion.section
              className="flex flex-col min-h-0 flex-1 xl:min-h-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease }}
            >
              <div className="shrink-0 flex items-center justify-between gap-2 mb-3 lg:mb-2">
                <div>
                  <h2 className="text-xl lg:text-lg font-bold text-blue-50">Next actions</h2>
                  <p className="text-sm lg:text-xs text-blue-300 mt-1">
                    Quick shortcuts for what to do next.
                  </p>
                </div>
              </div>
              <div className="rounded-3xl bg-blue-900 p-4 shadow-lg shadow-black/25 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    continueModule
                      ? navigate(`/editor/${continueModuleId}`)
                      : nextModule
                        ? handleStartModule(nextModule._id)
                        : navigate('/modules')
                  }
                  className="w-full text-left rounded-2xl bg-blue-800 px-4 py-3 hover:bg-blue-600 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wider text-blue-300">Continue learning</p>
                  <p className="text-sm text-black mt-1">
                    {continueModule
                      ? `Resume "${continueModule.title}" from where you stopped.`
                      : 'Open the next lesson on your path.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="w-full text-left rounded-2xl bg-blue-800 px-4 py-3 hover:bg-blue-600 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wider text-blue-300">Review progress</p>
                  <p className="text-sm text-black mt-1">See badges, level updates, and account settings.</p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/modules')}
                  className="w-full text-left rounded-2xl bg-blue-800 px-4 py-3 hover:bg-blue-600 transition-colors"
                >
                  <p className="text-[11px] uppercase tracking-wider text-blue-300">Explore modules</p>
                  <p className="text-sm text-black mt-1 flex items-center gap-1">
                    Browse by topic and difficulty <FaArrowRight className="text-xs text-black/70" />
                  </p>
                </button>
              </div>
            </motion.section>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
