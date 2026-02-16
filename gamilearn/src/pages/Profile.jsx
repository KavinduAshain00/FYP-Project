import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FaBolt,
  FaCamera,
  FaCheckCircle,
  FaEdit,
  FaRobot,
  FaSave,
  FaShieldAlt,
  FaTrophy,
  FaUser,
  FaCrown,
  FaLock,
  FaStar,
  FaLink,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../api/api";
import { GameLayout } from "../components/layout/GameLayout";

const buildPromptUrl = (prompt) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=42&nologo=true`;

const defaultAvatarPrompt = "Stylized hero portrait, simple avatar";

const groupAvatarsByUnlock = (avatars) => {
  const default_ = avatars.filter((a) => a.unlockType === "default");
  const level = avatars.filter((a) => a.unlockType === "level").sort((a, b) => {
    const lvA = parseInt(a.requirementTag?.replace(/\D/g, "") || "0", 10);
    const lvB = parseInt(b.requirementTag?.replace(/\D/g, "") || "0", 10);
    return lvA - lvB;
  });
  const achievement = avatars.filter((a) => a.unlockType === "achievement");
  return { default: default_, level, achievement };
};

const Profile = () => {
  const { user, refreshProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  // UC8: Personalize AI – tone, hint detail, assistance frequency
  const [aiTone, setAiTone] = useState("friendly");
  const [aiHintDetail, setAiHintDetail] = useState("moderate");
  const [aiFrequency, setAiFrequency] = useState("normal");
  const [savingAi, setSavingAi] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await userAPI.getProfileFull();
        const { user: userData, achievements: achList, avatars: avatarList } = res.data;
        setProfile(userData);
        setName(userData.name || "");
        setAvatarUrl(userData.avatarUrl || "");
        const prefs = userData.aiPreferences || {};
        setAiTone(prefs.tone || "friendly");
        setAiHintDetail(prefs.hintDetail || "moderate");
        setAiFrequency(prefs.assistanceFrequency || "normal");
        setAchievements(achList || []);
        setAvatars(avatarList || []);
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
      const res = await userAPI.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim(),
      });
      if (res.data.user) refreshProfile?.(res.data.user);
      toast.success("Your profile has been updated!");
      setEditMode(false);
    } catch {
      toast.error("We couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAiSettings = async () => {
    setSavingAi(true);
    try {
      const res = await userAPI.updateProfile({
        aiPreferences: {
          tone: aiTone,
          hintDetail: aiHintDetail,
          assistanceFrequency: aiFrequency,
        },
      });
      if (res.data.user) refreshProfile?.(res.data.user);
      toast.success("AI Companion settings saved!");
    } catch {
      toast.error("Could not save AI settings. Please try again.");
    } finally {
      setSavingAi(false);
    }
  };

  const levelInfo = profile?.levelInfo || user?.levelInfo || null;
  const totalPoints = levelInfo?.totalPoints ?? profile?.totalPoints ?? user?.totalPoints ?? 0;
  const level = levelInfo?.level ?? profile?.level ?? user?.level ?? 1;
  const xpToNext = levelInfo?.xpProgress?.xpToNext ?? 200;
  const earnedAchievements = achievements.filter((item) => item.earned).length;
  const completedModules = profile?.completedModules?.length || 0;

  if (loading) {
    return (
      <GameLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center text-gray-400 min-h-[50vh]">
          Loading your profile...
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-gray-200">
        <div className="border border-gray-700 bg-gray-900/50 p-6 mb-6 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={
                    avatarUrl.trim()
                      ? avatarUrl
                      : buildPromptUrl(defaultAvatarPrompt)
                  }
                  alt="Profile"
                  className="w-28 h-28 sm:w-36 sm:h-36 border border-gray-600 object-cover rounded-lg"
                />
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 border border-gray-500 bg-gray-800 text-xs font-bold text-gray-200 rounded">
                  Lv {level}
                </span>
                <button
                  onClick={() => setEditMode(true)}
                  className="absolute -top-1 -right-1 w-8 h-8 border border-gray-600 bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 rounded"
                >
                  <FaCamera className="text-sm" />
                </button>
              </div>
              <span className="mt-2 text-xs font-bold text-gray-400 border border-gray-600 px-2 py-0.5 rounded">
                <FaCrown className="inline mr-1" /> {(profile?.levelInfo?.rank?.name || user?.levelInfo?.rank?.name || "Amateur").toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-100 mb-1">
                {name || user?.name}
              </h1>
              <p className="text-gray-400 text-sm mb-2">{user?.email}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-600 bg-gray-800 text-sm rounded">
                <FaShieldAlt className="text-gray-400" />
                Path:{" "}
                <span className="font-semibold capitalize text-gray-200">
                  {profile?.learningPath?.replace("-", " ") || "Explorer"}
                </span>
              </div>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="mt-4 flex items-center gap-2 px-3 py-1.5 border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-700 rounded"
                >
                  <FaEdit /> Edit Profile
                </button>
              )}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>
                    Level {level} → {level + 1}
                  </span>
                  <span className="font-semibold">{xpToNext} XP to next</span>
                </div>
                <div className="h-2 bg-gray-700 overflow-hidden rounded">
                  <div
                    className="h-full bg-gray-500 rounded"
                    style={{
                      width: `${levelInfo?.xpProgress?.percentage ?? ((totalPoints % 200) / 200) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UC8: Personalize AI Guide – tone, hint detail, assistance frequency */}
        <div className="border border-gray-700 bg-gray-900/50 p-6 mb-6 rounded-lg">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2 mb-4">
            <FaRobot className="text-indigo-400" /> AI Companion Settings
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Customize how the AI tutor responds: tone, level of detail in hints, and how much follow-up guidance you get.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tone</label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              >
                <option value="friendly">Friendly – warm and encouraging</option>
                <option value="formal">Formal – clear and professional</option>
                <option value="concise">Concise – brief and to the point</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Hint detail</label>
              <select
                value={aiHintDetail}
                onChange={(e) => setAiHintDetail(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              >
                <option value="minimal">Minimal – short hints only</option>
                <option value="moderate">Moderate – one clear explanation</option>
                <option value="detailed">Detailed – more explanation and examples</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Assistance frequency</label>
              <select
                value={aiFrequency}
                onChange={(e) => setAiFrequency(e.target.value)}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              >
                <option value="low">Low – answer only what I ask</option>
                <option value="normal">Normal – one natural next step if relevant</option>
                <option value="high">High – suggest follow-ups and next steps</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveAiSettings}
            disabled={savingAi}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-600 bg-indigo-600/20 text-indigo-200 text-sm font-medium hover:bg-indigo-600/30 disabled:opacity-50 rounded-lg"
          >
            <FaSave /> {savingAi ? "Saving..." : "Save AI settings"}
          </button>
        </div>

        {editMode && (
          <div className="border border-gray-700 bg-gray-900/50 p-6 mb-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <FaEdit className="text-gray-400" /> Edit Profile
              </h2>
              <button
                onClick={() => setEditMode(false)}
                className="text-sm text-gray-400 hover:text-gray-100"
              >
                Cancel
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <div className="flex items-center gap-2 border border-gray-600 bg-gray-800 px-3 py-2 rounded">
                  <FaUser className="text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 bg-transparent text-gray-200 text-sm outline-none placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Avatar
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="relative shrink-0">
                      <img
                        src={
                          avatarUrl.trim()
                            ? avatarUrl
                            : buildPromptUrl(defaultAvatarPrompt)
                        }
                        alt="Current"
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-gray-600 object-cover ring-2 ring-gray-700/50"
                      />
                      <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-[10px] font-medium text-gray-300">
                        Current
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 sm:pt-2 max-w-xs">
                      Pick an unlocked avatar below or paste a custom image link. Locked avatars unlock as you level up or earn achievements.
                    </p>
                  </div>
                </div>

                {avatars.length > 0 && (() => {
                  const groups = groupAvatarsByUnlock(avatars);
                  const sections = [
                    { key: "default", title: "Starter", icon: FaStar, list: groups.default },
                    { key: "level", title: "Level unlocks", icon: FaCrown, list: groups.level },
                    { key: "achievement", title: "Achievement unlocks", icon: FaTrophy, list: groups.achievement },
                  ].filter((s) => s.list.length > 0);

                  return (
                    <div className="max-h-[320px] overflow-y-auto overflow-x-hidden rounded-lg border border-gray-700 bg-gray-800/30 pr-1 -mr-1">
                      <div className="space-y-5 p-1">
                      {sections.map((section) => {
                        const SectionIcon = section.icon;
                        return (
                        <div key={section.key}>
                          <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 sticky top-0 bg-gray-800/95 backdrop-blur py-1 z-10 -mx-1 px-1">
                            <SectionIcon className="text-amber-500/80" /> {section.title}
                          </h3>
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                            {section.list.map((av) => {
                              const selected = avatarUrl === av.url;
                              return (
                                <button
                                  key={av.index}
                                  type="button"
                                  onClick={() => av.unlocked && setAvatarUrl(av.url)}
                                  disabled={!av.unlocked}
                                  title={!av.unlocked ? av.unlockLabel : undefined}
                                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-60 ${
                                    selected
                                      ? "border-amber-500 scale-[1.02]"
                                      : av.unlocked
                                        ? "border-gray-600"
                                        : "border-gray-700 grayscale hover:border-gray-500 hover:opacity-90"
                                  }`}
                                >
                                  <img
                                    src={av.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  {!av.unlocked && (
                                    <>
                                      <span className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-1">
                                        <FaLock className="text-gray-500 w-5 h-5 shrink-0 mb-0.5" />
                                        <span className="text-[8px] font-medium text-amber-400/90 text-center leading-tight line-clamp-2 px-0.5">
                                          {av.unlockLabel || "Unlock"}
                                        </span>
                                      </span>
                                    </>
                                  )}
                                  {av.unlocked && av.requirementTag && (
                                    <span className="absolute bottom-0 left-0 right-0 bg-black/75 text-[9px] text-amber-300 py-0.5 text-center font-medium truncate px-0.5">
                                      {av.requirementTag}
                                    </span>
                                  )}
                                  {selected && (
                                    <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                      <FaCheckCircle className="text-gray-900 w-3 h-3" />
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
                  );
                })()}

                <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    <FaLink className="text-cyan-500/80" /> Custom image URL
                  </h3>
                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-lg border border-gray-600 overflow-hidden bg-gray-800 shrink-0">
                      {avatarUrl.trim() ? (
                        <img
                          src={avatarUrl}
                          alt="Custom"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <FaCamera className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Paste any image URL"
                      className="flex-1 min-w-0 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5">
                    Paste a direct image URL for a custom avatar. Choosing a preset above will replace this.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-600 bg-gray-700 text-gray-100 text-sm font-medium hover:bg-gray-600 disabled:opacity-50 rounded"
              >
                <FaSave /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Total XP
            </div>
            <div className="text-xl font-bold text-gray-100">{totalPoints}</div>
          </div>
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Level
            </div>
            <div className="text-xl font-bold text-gray-100">{level}</div>
          </div>
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Modules Done
            </div>
            <div className="text-xl font-bold text-gray-100">
              {completedModules}
            </div>
          </div>
          <div className="border border-gray-700 bg-gray-900/50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">
              Achievements
            </div>
            <div className="text-xl font-bold text-gray-100">
              {earnedAchievements}/{achievements.length}
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
          <FaTrophy className="text-gray-400" /> Achievements
        </h2>
        {achievements.length === 0 ? (
          <div className="border border-gray-700 bg-gray-900/50 p-8 text-center text-gray-500 rounded-lg">
            No achievements yet. Complete lessons and activities to unlock them.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`border p-4 flex items-start gap-3 rounded-lg ${
                  ach.earned
                    ? "border-gray-500 bg-gray-800/50"
                    : "border-gray-700 bg-gray-900/30 opacity-80"
                }`}
              >
                <div
                  className={`w-12 h-12 border flex items-center justify-center shrink-0 rounded ${
                    ach.earned ? "border-gray-500" : "border-gray-600"
                  }`}
                >
                  {ach.earned ? (
                    <FaTrophy className="text-xl text-gray-400" />
                  ) : (
                    <FaLock className="text-lg text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-100 truncate">
                      {ach.name}
                    </h3>
                    {ach.earned && (
                      <FaCheckCircle className="text-gray-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {ach.description}
                  </p>
                  {ach.xpReward && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <FaBolt /> +{ach.xpReward} XP
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {ach.rarity && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-gray-600 text-gray-500">
                      {ach.rarity}
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 border rounded ${
                      ach.earned
                        ? "border-gray-500 text-gray-400"
                        : "border-gray-600 text-gray-500"
                    }`}
                  >
                    {ach.earned ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default Profile;
