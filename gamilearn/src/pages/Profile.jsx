import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaArrowRight,
  FaBolt,
  FaCheckCircle,
  FaCrown,
  FaEdit,
  FaGraduationCap,
  FaLock,
  FaSave,
  FaShieldAlt,
  FaStar,
  FaLink,
  FaTrophy,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { achievementsAPI, userAPI } from "../api/api";
import { LoadingScreen, useShellPagesCache } from "../App";
import { getXpBarProps } from "../utils/levelCurve";

const groupAvatarsByUnlock = (avatars) => {
  const default_ = avatars.filter((a) => a.unlockType === "default");
  const level = avatars
    .filter((a) => a.unlockType === "level")
    .sort((a, b) => {
      const lvA = parseInt(a.requirementTag?.replace(/\D/g, "") || "0", 10);
      const lvB = parseInt(b.requirementTag?.replace(/\D/g, "") || "0", 10);
      return lvA - lvB;
    });
  const achievement = avatars.filter((a) => a.unlockType === "achievement");
  return { default: default_, level, achievement };
};

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const { peek, put } = useShellPagesCache();
  const saved = peek("profile");

  const [profile, setProfile] = useState(() => saved?.profile ?? null);
  const [achievements, setAchievements] = useState(
    () => saved?.achievements ?? [],
  );
  const [avatars, setAvatars] = useState(() => saved?.avatars ?? []);
  const [name, setName] = useState(
    () => saved?.name ?? saved?.profile?.name ?? "",
  );
  const [avatarUrl, setAvatarUrl] = useState(
    () => saved?.avatarUrl ?? saved?.profile?.avatarUrl ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(() => saved?.editMode ?? false);
  const [loading, setLoading] = useState(() => (saved?.profile ? false : true));
  const [changePasswordCurrent, setChangePasswordCurrent] = useState("");
  const [changePasswordNew, setChangePasswordNew] = useState("");
  const [changePasswordConfirm, setChangePasswordConfirm] = useState("");
  const [changePasswordSaving, setChangePasswordSaving] = useState(false);

  const snapshotRef = useRef({});
  snapshotRef.current = {
    profile,
    achievements,
    avatars,
    name,
    avatarUrl,
    editMode,
    loading,
  };
  useEffect(() => () => put("profile", snapshotRef.current), [put]);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (profileRef.current) return;

    const loadProfile = async () => {
      try {
        const [profileRes, achievementsRes, avatarsRes] = await Promise.all([
          userAPI.getProfile(),
          achievementsAPI.getUserAchievements(),
          userAPI.getAvatars(),
        ]);
        const userData = profileRes.data.user;
        setProfile(userData);
        setName(userData.name || "");
        setAvatarUrl(userData.avatarUrl || "");
        setAchievements(achievementsRes.data.achievements || []);
        setAvatars(avatarsRes.data.avatars || []);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a display name.");
      return;
    }
    setSaving(true);
    try {
      await userAPI.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      await refreshProfile?.();
      toast.success("Profile updated successfully.");
      setEditMode(false);
    } catch {
      toast.error("We couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (changePasswordNew !== changePasswordConfirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (changePasswordNew.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    setChangePasswordSaving(true);
    try {
      await userAPI.changePassword(changePasswordCurrent, changePasswordNew);
      toast.success("Password updated.");
      setChangePasswordCurrent("");
      setChangePasswordNew("");
      setChangePasswordConfirm("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update password.");
    } finally {
      setChangePasswordSaving(false);
    }
  };

  const levelInfo = profile?.levelInfo || user?.levelInfo || null;
  const xpBar = getXpBarProps(levelInfo);
  const totalPoints =
    levelInfo?.totalPoints ?? profile?.totalPoints ?? user?.totalPoints ?? 0;
  const level = levelInfo?.level ?? profile?.level ?? user?.level ?? 1;
  const xpToNext = xpBar.xpToNext;
  const earnedAchievements = achievements.filter((item) => item.earned).length;
  const completedModules = profile?.completedModules?.length || 0;
  const avatarGroups = groupAvatarsByUnlock(avatars);
  const unlockedAvatarCount = avatars.filter((a) => a.unlocked).length;
  const nextLevelAvatar = avatarGroups.level.find((a) => !a.unlocked) || null;
  const nextAchievementAvatar =
    avatarGroups.achievement.find((a) => !a.unlocked) || null;

  const btnPrimary =
    "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-500 text-black text-sm font-semibold shadow-md shadow-black/25 hover:bg-blue-400 active:scale-[0.99] transition-all disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none";
  const inputShell =
    "w-full flex items-center gap-2 rounded-2xl bg-blue-800 px-4 py-3 focus-within:outline focus-within:outline-2 focus-within:outline-blue-400/50";
  const inputClass =
    "flex-1 bg-transparent text-blue-50 text-sm outline-none placeholder-blue-300";

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl min-w-0 px-4 py-10 sm:px-6">
        <LoadingScreen
          message="Loading your profile"
          subMessage="Getting your account, badges, and avatar options"
        />
      </div>
    );
  }

  const avatarSections = [
    {
      key: "default",
      title: "Starter avatars",
      icon: FaStar,
      list: avatarGroups.default,
    },
    {
      key: "level",
      title: "Level unlocks",
      icon: FaCrown,
      list: avatarGroups.level,
    },
    {
      key: "achievement",
      title: "Achievement unlocks",
      icon: FaTrophy,
      list: avatarGroups.achievement,
    },
  ].filter((s) => s.list.length > 0);

  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.earned === b.earned) return 0;
    return a.earned ? -1 : 1;
  });

  const statTiles = [
    {
      label: "Total XP",
      value: totalPoints,
      icon: FaBolt,
      iconClass: "text-cyan-300",
    },
    {
      label: "Level",
      value: level,
      icon: FaCrown,
      iconClass: "text-amber-300",
    },
    {
      label: "Modules done",
      value: completedModules,
      icon: FaGraduationCap,
      iconClass: "text-blue-300",
    },
    {
      label: "Achievements",
      value: `${earnedAchievements}/${achievements.length}`,
      icon: FaTrophy,
      iconClass: "text-blue-200",
    },
  ];

  const xpPct = xpBar.percentage;

  return (
    <div className="mx-auto max-w-5xl min-w-0 px-4 py-8 pb-20 text-blue-50 sm:px-6 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-50 sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 max-w-xl text-sm text-blue-300">
          Your progress, avatar, and security settings in one place.
        </p>
      </header>

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-blue-900 border border-blue-800/60 shadow-xl shadow-blue-950/30">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
            <div className="relative mx-auto shrink-0 md:mx-0">
              <div className="rounded-3xl bg-blue-950/40 p-1.5 shadow-inner shadow-blue-950/50">
                {avatarUrl.trim() ? (
                  <img
                    src={avatarUrl.trim()}
                    alt={`${name || user?.name || "Your"} profile photo`}
                    className="h-32 w-32 rounded-2xl object-cover object-center shadow-lg shadow-blue-950/40 sm:h-36 sm:w-36"
                  />
                ) : (
                  <div
                    className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-950/40 sm:h-36 sm:w-36"
                    aria-hidden
                  >
                    <FaUserCircle className="-mb-1 text-[4.75rem] text-blue-100/90 sm:text-[5.5rem]" />
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 rounded-xl bg-amber-500 px-2.5 py-1 text-xs font-bold text-blue-950 shadow-md shadow-black/20">
                Lv {level}
              </span>
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-black shadow-lg shadow-blue-950/40 transition-colors hover:bg-blue-500"
                aria-label={editMode ? "Close profile editor" : "Edit profile"}
              >
                <FaEdit className="text-sm" />
              </button>
            </div>

            <div className="min-w-0 flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-blue-50 sm:text-3xl">
                {name || user?.name}
              </h2>
              <p className="mt-1 break-all text-sm text-blue-300 sm:break-words md:truncate">
                {user?.email}
              </p>
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-blue-950/35 px-4 py-2.5 text-sm md:justify-start">
                <FaShieldAlt className="text-blue-300" aria-hidden />
                <span className="text-blue-300">Path</span>
                <span className="font-semibold capitalize text-blue-50">
                  {profile?.learningPath?.replace("-", " ") || "Explorer"}
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex flex-wrap items-end justify-between gap-2 text-sm">
                  <span className="text-blue-300">
                    Level {level}
                    <span className="text-blue-500"> → </span>
                    {level + 1}
                  </span>
                  <span className="font-medium tabular-nums text-blue-100">
                    {xpToNext} XP to go
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-blue-950/60">
                  <div
                    className="h-full rounded-full bg-blue-400 transition-all duration-500 shadow-sm shadow-black/20"
                    style={{ width: `${Math.min(100, Math.max(0, xpPct))}%` }}
                  />
                </div>
              </div>

              {!editMode && (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-blue-500"
                >
                  <FaEdit /> Edit name & avatar
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
            {statTiles.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl bg-blue-950/40 px-3 py-2.5 shadow-md shadow-blue-950/25 sm:px-4 sm:py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                      {s.label}
                    </p>
                    <Icon
                      className={`text-lg opacity-90 ${s.iconClass}`}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1 text-lg font-bold tabular-nums text-blue-50 sm:text-xl md:text-2xl">
                    {s.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 min-w-0 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-3xl bg-blue-900/80 p-6 shadow-xl shadow-blue-950/25 sm:p-7">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                  Avatar studio
                </p>
                <h2 className="mt-1 text-xl font-bold text-blue-50">
                  Look & display name
                </h2>
                <p className="mt-2 text-sm text-blue-300">
                  <span className="font-semibold text-blue-100">
                    {unlockedAvatarCount}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-blue-100">
                    {avatars.length}
                  </span>{" "}
                  avatars unlocked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-blue-600"
              >
                {editMode ? "Done browsing" : "Customize"}{" "}
                <FaArrowRight className="text-xs" />
              </button>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-blue-800/80 px-4 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                  Next by level
                </p>
                <p className="mt-1.5 text-sm leading-snug text-blue-100">
                  {nextLevelAvatar?.unlockLabel ||
                    nextLevelAvatar?.requirementTag ||
                    "All level avatars unlocked"}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-800/80 px-4 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                  Next by achievement
                </p>
                <p className="mt-1.5 text-sm leading-snug text-blue-100">
                  {nextAchievementAvatar?.unlockLabel ||
                    nextAchievementAvatar?.requirementTag ||
                    "All achievement avatars unlocked"}
                </p>
              </div>
            </div>

            {editMode ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-blue-200">
                      Display name
                    </label>
                    <div className={inputShell}>
                      <FaUser className="shrink-0 text-blue-300" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-blue-200">
                      Custom image URL
                    </label>
                    <div className={inputShell}>
                      <FaLink className="shrink-0 text-blue-200" />
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://…"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="max-h-[min(24rem,50vh)] overflow-y-auto rounded-2xl bg-blue-800/60 p-4">
                  <div className="space-y-6">
                    {avatarSections.map((section) => {
                      const SectionIcon = section.icon;
                      return (
                        <div key={section.key}>
                          <h3 className="sticky top-0 z-10 mb-3 flex items-center gap-2 bg-blue-800/95 py-2 text-xs font-semibold uppercase tracking-wider text-blue-300 backdrop-blur-sm">
                            <SectionIcon className="text-blue-100" />{" "}
                            {section.title}
                          </h3>
                          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                            {section.list.map((av) => {
                              const selected = avatarUrl === av.url;
                              return (
                                <button
                                  key={av.index}
                                  type="button"
                                  onClick={() =>
                                    av.unlocked && setAvatarUrl(av.url)
                                  }
                                  disabled={!av.unlocked}
                                  title={
                                    !av.unlocked ? av.unlockLabel : undefined
                                  }
                                  className={`relative aspect-square overflow-hidden rounded-xl transition-transform focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed ${
                                    selected
                                      ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-blue-800 scale-[1.02]"
                                      : ""
                                  } ${av.unlocked ? "hover:brightness-110" : ""}`}
                                >
                                  <img
                                    src={av.url}
                                    alt=""
                                    className={`h-full w-full object-cover ${!av.unlocked ? "grayscale" : ""}`}
                                  />
                                  {!av.unlocked && (
                                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-blue-950/85 p-1">
                                      <FaLock className="mb-1 h-5 w-5 text-blue-300" />
                                      <span className="line-clamp-2 px-0.5 text-center text-[8px] font-medium leading-tight text-blue-100">
                                        {av.unlockLabel || "Locked"}
                                      </span>
                                    </span>
                                  )}
                                  {av.unlocked && av.requirementTag && (
                                    <span className="absolute bottom-0 left-0 right-0 truncate bg-blue-950/90 px-0.5 py-0.5 text-center text-[9px] font-medium text-blue-50">
                                      {av.requirementTag}
                                    </span>
                                  )}
                                  {selected && (
                                    <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 shadow-md">
                                      <FaCheckCircle className="h-3.5 w-3.5 text-blue-950" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={btnPrimary}
                  >
                    <FaSave /> {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-blue-800/50 px-5 py-6 text-center text-sm text-blue-300 sm:text-left">
                <p className="mx-auto max-w-md sm:mx-0">
                  Tap{" "}
                  <span className="font-semibold text-blue-100">Customize</span>{" "}
                  to change your name, pick an avatar, or paste a custom image
                  URL.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-blue-900/80 p-6 shadow-xl shadow-blue-950/25 sm:p-7">
            <h2 className="flex items-center gap-2 text-lg font-bold text-blue-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-800 text-blue-200">
                <FaLock className="text-sm" />
              </span>
              Security
            </h2>
            <p className="mt-2 text-sm text-blue-300">
              Update your password any time.
            </p>
            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-blue-200">
                  Current password
                </label>
                <input
                  type="password"
                  value={changePasswordCurrent}
                  onChange={(e) => setChangePasswordCurrent(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-blue-800/90 px-4 py-3 text-blue-50 placeholder-blue-400 outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-blue-200">
                  New password
                </label>
                <input
                  type="password"
                  value={changePasswordNew}
                  onChange={(e) => setChangePasswordNew(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="w-full rounded-2xl bg-blue-800/90 px-4 py-3 text-blue-50 placeholder-blue-400 outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-blue-200">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={changePasswordConfirm}
                  onChange={(e) => setChangePasswordConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={6}
                  className="w-full rounded-2xl bg-blue-800/90 px-4 py-3 text-blue-50 placeholder-blue-400 outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={
                  changePasswordSaving ||
                  !changePasswordCurrent ||
                  !changePasswordNew ||
                  !changePasswordConfirm
                }
                className={`${btnPrimary} w-full sm:w-auto`}
              >
                <FaSave />{" "}
                {changePasswordSaving ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>
        </aside>
      </div>

      <section className="mt-12">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-blue-50">
              <FaTrophy className="text-amber-300" />
              Achievements
            </h2>
            <p className="mt-1 text-sm text-blue-300">
              Unlocked achievements glow; locked ones stay dim until you earn
              them.
            </p>
          </div>
          {achievements.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3 py-1 font-semibold text-cyan-200 ring-1 ring-cyan-400/35">
                <FaCheckCircle className="text-cyan-400" aria-hidden />
                {earnedAchievements} unlocked
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-semibold text-amber-200/90 ring-1 ring-amber-400/25">
                <FaLock className="text-amber-400/90" aria-hidden />
                {achievements.length - earnedAchievements} locked
              </span>
            </div>
          )}
        </div>
        {achievements.length === 0 ? (
          <div className="rounded-3xl bg-blue-900/70 px-6 py-16 text-center shadow-lg shadow-blue-950/20">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-800/80 text-blue-300">
              <FaTrophy className="text-2xl" />
            </div>
            <p className="text-blue-200">No achievements yet.</p>
            <p className="mt-1 text-sm text-blue-400">
              Complete lessons to unlock your first badge.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedAchievements.map((ach) => (
              <article
                key={ach.id}
                className={`relative flex gap-4 overflow-hidden rounded-2xl p-4 sm:p-5 ${
                  ach.earned
                    ? "bg-blue-800 shadow-lg shadow-black/20 ring-2 ring-blue-400/50"
                    : "bg-blue-950/90 shadow-inner shadow-blue-950/40 ring-1 ring-amber-900/40"
                }`}
              >
                {!ach.earned && (
                  <FaLock
                    className="pointer-events-none absolute -bottom-1 -right-1 text-6xl text-blue-900/50 sm:text-7xl"
                    aria-hidden
                  />
                )}
                <div
                  className={`w-1.5 shrink-0 self-stretch rounded-full ${
                    ach.earned
                      ? "bg-blue-400 shadow-[0_0_10px_rgb(var(--color-blue-400-rgb)/0.45)]"
                      : "bg-amber-800"
                  }`}
                  aria-hidden
                />
                <div
                  className={`relative z-[1] flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                    ach.earned
                      ? "bg-blue-400/20 text-blue-100 ring-2 ring-blue-400/45 shadow-md shadow-blue-500/20"
                      : "bg-blue-900 text-amber-200/90 ring-1 ring-amber-700/50"
                  }`}
                >
                  {ach.icon ? (
                    <img
                      src={ach.icon}
                      alt=""
                      className={`h-8 w-8 object-contain brightness-0 invert ${
                        ach.earned ? "" : "opacity-45 grayscale"
                      }`}
                    />
                  ) : ach.earned ? (
                    <FaTrophy className="text-2xl text-amber-200" />
                  ) : (
                    <FaLock className="text-xl text-amber-400" />
                  )}
                </div>
                <div className="relative z-[1] min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-bold ${ach.earned ? "text-blue-50" : "text-blue-400"}`}
                    >
                      {ach.name}
                    </h3>
                    {ach.earned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-50 ring-1 ring-cyan-300/40">
                        <FaCheckCircle
                          className="text-xs text-cyan-200"
                          aria-hidden
                        />
                        Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200/95 ring-1 ring-amber-600/35">
                        <FaLock
                          className="text-[9px] text-amber-400"
                          aria-hidden
                        />
                        Locked
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1.5 text-sm leading-relaxed ${
                      ach.earned ? "text-blue-100" : "text-blue-500"
                    }`}
                  >
                    {ach.description}
                  </p>
                  {ach.xpReward ? (
                    <div
                      className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${
                        ach.earned ? "text-cyan-100" : "text-blue-600"
                      }`}
                    >
                      <FaBolt
                        className={
                          ach.earned ? "text-cyan-300" : "text-amber-600/80"
                        }
                      />
                      {ach.earned
                        ? `+${ach.xpReward} XP earned`
                        : `+${ach.xpReward} XP when unlocked`}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
