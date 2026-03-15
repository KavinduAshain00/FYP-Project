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
import { achievementsAPI, userAPI } from "../api/api";
import { GameLayout } from "../components/layout/GameLayout";
import LoadingScreen from "../components/ui/LoadingScreen";

const buildPromptUrl = (prompt) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=42&nologo=true`;

const defaultAvatarPrompt = "Stylized hero portrait, simple avatar";

const AI_PRESETS = {
  learning: {
    label: "Learning",
    description: "Maximum support – friendly, detailed hints, extra follow-ups",
    tone: "friendly",
    hintDetail: "detailed",
    assistanceFrequency: "high",
  },
  balanced: {
    label: "Balanced",
    description: "Default – friendly, moderate detail, one next step when relevant",
    tone: "friendly",
    hintDetail: "moderate",
    assistanceFrequency: "normal",
  },
  quick: {
    label: "Quick",
    description: "Minimal – concise answers, short hints, no extra suggestions",
    tone: "concise",
    hintDetail: "minimal",
    assistanceFrequency: "low",
  },
};

const getPresetFromPrefs = (tone, hintDetail, assistanceFrequency) => {
  for (const [key, p] of Object.entries(AI_PRESETS)) {
    if (p.tone === tone && p.hintDetail === hintDetail && p.assistanceFrequency === assistanceFrequency) {
      return key;
    }
  }
  return "custom";
};

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
  const [aiTone, setAiTone] = useState("friendly");
  const [aiHintDetail, setAiHintDetail] = useState("moderate");
  const [aiFrequency, setAiFrequency] = useState("normal");
  const [aiPreset, setAiPreset] = useState("balanced");
  const [savingAi, setSavingAi] = useState(false);
  const [changePasswordCurrent, setChangePasswordCurrent] = useState("");
  const [changePasswordNew, setChangePasswordNew] = useState("");
  const [changePasswordConfirm, setChangePasswordConfirm] = useState("");
  const [changePasswordSaving, setChangePasswordSaving] = useState(false);

  useEffect(() => {
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
        const prefs = userData.aiPreferences || {};
        const tone = prefs.tone || "friendly";
        const hintDetail = prefs.hintDetail || "moderate";
        const frequency = prefs.assistanceFrequency || "normal";
        setAiTone(tone);
        setAiHintDetail(hintDetail);
        setAiFrequency(frequency);
        setAiPreset(getPresetFromPrefs(tone, hintDetail, frequency));
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
      await userAPI.updateProfile({
        aiPreferences: {
          tone: aiTone,
          hintDetail: aiHintDetail,
          assistanceFrequency: aiFrequency,
        },
      });
      await refreshProfile?.();
      toast.success("AI Companion settings saved!");
    } catch {
      toast.error("Could not save AI settings. Please try again.");
    } finally {
      setSavingAi(false);
    }
  };

  const applyPreset = (presetKey) => {
    if (presetKey === "custom") return;
    const p = AI_PRESETS[presetKey];
    if (!p) return;
    setAiTone(p.tone);
    setAiHintDetail(p.hintDetail);
    setAiFrequency(p.assistanceFrequency);
    setAiPreset(presetKey);
  };

  const handlePresetApplyAndSave = async (presetKey) => {
    applyPreset(presetKey);
    setSavingAi(true);
    try {
      const p = AI_PRESETS[presetKey];
      await userAPI.updateProfile({
        aiPreferences: {
          tone: p.tone,
          hintDetail: p.hintDetail,
          assistanceFrequency: p.assistanceFrequency,
        },
      });
      await refreshProfile?.();
      toast.success(`AI set to "${AI_PRESETS[presetKey].label}" and saved!`);
    } catch {
      toast.error("Could not save AI settings. Please try again.");
    } finally {
      setSavingAi(false);
    }
  };

  const handleAiToneChange = (v) => {
    setAiTone(v);
    setAiPreset(getPresetFromPrefs(v, aiHintDetail, aiFrequency));
  };
  const handleAiHintDetailChange = (v) => {
    setAiHintDetail(v);
    setAiPreset(getPresetFromPrefs(aiTone, v, aiFrequency));
  };
  const handleAiFrequencyChange = (v) => {
    setAiFrequency(v);
    setAiPreset(getPresetFromPrefs(aiTone, aiHintDetail, v));
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
  const totalPoints = levelInfo?.totalPoints ?? profile?.totalPoints ?? user?.totalPoints ?? 0;
  const level = levelInfo?.level ?? profile?.level ?? user?.level ?? 1;
  const xpToNext = levelInfo?.xpProgress?.xpToNext ?? 200;
  const earnedAchievements = achievements.filter((item) => item.earned).length;
  const completedModules = profile?.completedModules?.length || 0;

  if (loading) {
    return (
      <GameLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <LoadingScreen
            message="Loading your profile…"
            subMessage="Fetching your stats and achievements"
          />
        </div>
      </GameLayout>
    );
  }

  return (
    <GameLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-[#d8d0c4]">
        {/* Character card */}
        <div className="border border-[#252c3a] bg-[#111620] p-6 mb-6 rounded-2xl">
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
                  className="w-28 h-28 sm:w-36 sm:h-36 border border-[#2e3648] object-cover rounded-xl"
                />
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 border border-[#c8a040]/30 bg-[#1c2230] text-xs font-bold text-[#c8a040] rounded-lg">
                  Lv {level}
                </span>
                <button
                  onClick={() => setEditMode(true)}
                  className="absolute -top-1 -right-1 w-8 h-8 border border-[#2e3648] bg-[#1c2230] flex items-center justify-center text-[#9a9080] hover:bg-[#242c3c] rounded-lg transition-colors"
                >
                  <FaCamera className="text-sm" />
                </button>
              </div>
              <span className="mt-2 text-xs font-bold text-[#c8a040] border border-[#c8a040]/30 bg-[#c8a040]/5 px-2 py-0.5 rounded-lg">
                <FaCrown className="inline mr-1" /> {(profile?.levelInfo?.rank?.name || user?.levelInfo?.rank?.name || "Amateur").toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#d8d0c4] mb-1">
                {name || user?.name}
              </h1>
              <p className="text-[#706858] text-sm mb-2">{user?.email}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#2e3648] bg-[#1c2230] text-sm rounded-xl">
                <FaShieldAlt className="text-[#8070b0]" />
                Path:{" "}
                <span className="font-semibold capitalize text-[#d8d0c4]">
                  {profile?.learningPath?.replace("-", " ") || "Explorer"}
                </span>
              </div>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="mt-4 flex items-center gap-2 px-3 py-1.5 border border-[#2e3648] text-[#9a9080] text-sm font-medium hover:bg-[#1c2230] rounded-xl transition-colors"
                >
                  <FaEdit /> Edit Profile
                </button>
              )}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-[#585048] mb-1">
                  <span>
                    Level {level} → {level + 1}
                  </span>
                  <span className="font-semibold">{xpToNext} XP to next</span>
                </div>
                <div className="h-2 bg-[#1c2230] overflow-hidden rounded-full">
                  <div
                    className="h-full bg-[#c8a040] rounded-full transition-all"
                    style={{
                      width: `${levelInfo?.xpProgress?.percentage ?? ((totalPoints % 200) / 200) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Companion Settings */}
        <div className="border border-[#252c3a] bg-[#111620] p-6 mb-6 rounded-2xl">
          <h2 className="text-lg font-bold text-[#d8d0c4] flex items-center gap-2 mb-4">
            <FaRobot className="text-[#8070b0]" /> AI Companion Settings
          </h2>
          <p className="text-sm text-[#706858] mb-4">
            Use a preset to auto-apply tone, hint detail, and follow-up style in one click, or customize below.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(AI_PRESETS).map(([key, p]) => (
              <div key={key} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`px-3 py-2 rounded-xl border text-left text-sm transition-colors ${
                    aiPreset === key
                      ? "border-[#8070b0]/40 bg-[#8070b0]/10 text-[#b0a8d0]"
                      : "border-[#252c3a] bg-[#161c28] text-[#9a9080] hover:bg-[#1c2230]"
                  }`}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="block text-xs opacity-80 mt-0.5">{p.description}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetApplyAndSave(key)}
                  disabled={savingAi}
                  className="text-[10px] text-[#8070b0] hover:text-[#b0a8d0] disabled:opacity-50"
                >
                  Apply & save
                </button>
              </div>
            ))}
            {aiPreset === "custom" && (
              <div className="px-3 py-2 rounded-xl border border-[#252c3a] bg-[#161c28] text-[#706858] text-sm">
                Custom (edit below)
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-[#a09888] mb-1">Tone</label>
              <select
                value={aiTone}
                onChange={(e) => handleAiToneChange(e.target.value)}
                className="w-full rounded-xl border border-[#252c3a] bg-[#161c28] px-3 py-2 text-sm text-[#d8d0c4] focus:outline-none focus:ring-2 focus:ring-[#8070b0]/30 focus:border-[#8070b0]/40"
              >
                <option value="friendly">Friendly – warm and encouraging</option>
                <option value="formal">Formal – clear and professional</option>
                <option value="concise">Concise – brief and to the point</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a09888] mb-1">Hint detail</label>
              <select
                value={aiHintDetail}
                onChange={(e) => handleAiHintDetailChange(e.target.value)}
                className="w-full rounded-xl border border-[#252c3a] bg-[#161c28] px-3 py-2 text-sm text-[#d8d0c4] focus:outline-none focus:ring-2 focus:ring-[#8070b0]/30 focus:border-[#8070b0]/40"
              >
                <option value="minimal">Minimal – short hints only</option>
                <option value="moderate">Moderate – one clear explanation</option>
                <option value="detailed">Detailed – more explanation and examples</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a09888] mb-1">Assistance frequency</label>
              <select
                value={aiFrequency}
                onChange={(e) => handleAiFrequencyChange(e.target.value)}
                className="w-full rounded-xl border border-[#252c3a] bg-[#161c28] px-3 py-2 text-sm text-[#d8d0c4] focus:outline-none focus:ring-2 focus:ring-[#8070b0]/30 focus:border-[#8070b0]/40"
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
            className="flex items-center gap-2 px-4 py-2 border border-[#8070b0]/30 bg-[#8070b0]/10 text-[#b0a8d0] text-sm font-medium hover:bg-[#8070b0]/20 disabled:opacity-50 rounded-xl transition-colors"
          >
            <FaSave /> {savingAi ? "Saving..." : "Save AI settings"}
          </button>
        </div>

        {/* Edit profile panel */}
        {editMode && (
          <div className="border border-[#252c3a] bg-[#111620] p-6 mb-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#d8d0c4] flex items-center gap-2">
                <FaEdit className="text-[#9a9080]" /> Edit Profile
              </h2>
              <button
                onClick={() => setEditMode(false)}
                className="text-sm text-[#706858] hover:text-[#d8d0c4]"
              >
                Cancel
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a09888] mb-1">
                  Name
                </label>
                <div className="flex items-center gap-2 border border-[#252c3a] bg-[#161c28] px-3 py-2 rounded-xl">
                  <FaUser className="text-[#585048]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 bg-transparent text-[#d8d0c4] text-sm outline-none placeholder-[#585048]"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#a09888] mb-3">
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
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-[#2e3648] object-cover"
                      />
                      <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-[#1c2230] border border-[#2e3648] rounded-lg text-[10px] font-medium text-[#9a9080]">
                        Current
                      </span>
                    </div>
                    <p className="text-xs text-[#585048] sm:pt-2 max-w-xs">
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
                    <div className="max-h-[320px] overflow-y-auto overflow-x-hidden rounded-xl border border-[#252c3a] bg-[#161c28] pr-1 -mr-1">
                      <div className="space-y-5 p-1">
                      {sections.map((section) => {
                        const SectionIcon = section.icon;
                        return (
                        <div key={section.key}>
                          <h3 className="flex items-center gap-2 text-xs font-semibold text-[#706858] uppercase tracking-wider mb-3 sticky top-0 bg-[#161c28] py-1 z-10 -mx-1 px-1">
                            <SectionIcon className="text-[#c8a040]" /> {section.title}
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
                                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#c8a040]/30 focus:ring-offset-2 focus:ring-offset-[#111620] disabled:cursor-not-allowed disabled:opacity-60 ${
                                    selected
                                      ? "border-[#c8a040] scale-[1.02]"
                                      : av.unlocked
                                        ? "border-[#2e3648]"
                                        : "border-[#252c3a] grayscale hover:border-[#3a4258] hover:opacity-90"
                                  }`}
                                >
                                  <img
                                    src={av.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                  {!av.unlocked && (
                                    <>
                                      <span className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1017]/90 p-1">
                                        <FaLock className="text-[#585048] w-5 h-5 shrink-0 mb-0.5" />
                                        <span className="text-[8px] font-medium text-[#c8a040] text-center leading-tight line-clamp-2 px-0.5">
                                          {av.unlockLabel || "Unlock"}
                                        </span>
                                      </span>
                                    </>
                                  )}
                                  {av.unlocked && av.requirementTag && (
                                    <span className="absolute bottom-0 left-0 right-0 bg-[#0d1017]/80 text-[9px] text-[#c8a040] py-0.5 text-center font-medium truncate px-0.5">
                                      {av.requirementTag}
                                    </span>
                                  )}
                                  {selected && (
                                    <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-[#c8a040] flex items-center justify-center">
                                      <FaCheckCircle className="text-[#0d1017] w-3 h-3" />
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

                <div className="rounded-xl border border-[#252c3a] bg-[#161c28] p-4">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-[#706858] uppercase tracking-wider mb-2">
                    <FaLink className="text-[#4e9a8e]" /> Custom image URL
                  </h3>
                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-xl border border-[#2e3648] overflow-hidden bg-[#1c2230] shrink-0">
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
                        <div className="w-full h-full flex items-center justify-center text-[#585048]">
                          <FaCamera className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Paste any image URL"
                      className="flex-1 min-w-0 rounded-xl border border-[#252c3a] bg-[#1c2230] px-3 py-2 text-sm text-[#d8d0c4] placeholder-[#585048] focus:outline-none focus:ring-2 focus:ring-[#4e9a8e]/30 focus:border-[#4e9a8e]/40"
                    />
                  </div>
                  <p className="text-[10px] text-[#585048] mt-1.5">
                    Paste a direct image URL for a custom avatar. Choosing a preset above will replace this.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-[#4e9a8e]/30 bg-[#4e9a8e]/10 text-[#4e9a8e] text-sm font-medium hover:bg-[#4e9a8e]/20 disabled:opacity-50 rounded-xl transition-colors"
              >
                <FaSave /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Change password */}
        <div className="border border-[#252c3a] bg-[#111620] p-6 mb-6 rounded-2xl">
          <h2 className="text-lg font-bold text-[#d8d0c4] flex items-center gap-2 mb-4">
            <FaLock className="text-[#9a9080]" /> Change password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-[#a09888] mb-1">Current password</label>
              <input
                type="password"
                value={changePasswordCurrent}
                onChange={(e) => setChangePasswordCurrent(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-[#252c3a] bg-[#161c28] rounded-xl text-[#d8d0c4] placeholder-[#585048] focus:outline-none focus:border-[#3a4258]"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a09888] mb-1">New password</label>
              <input
                type="password"
                value={changePasswordNew}
                onChange={(e) => setChangePasswordNew(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full px-3 py-2 border border-[#252c3a] bg-[#161c28] rounded-xl text-[#d8d0c4] placeholder-[#585048] focus:outline-none focus:border-[#3a4258]"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a09888] mb-1">Confirm new password</label>
              <input
                type="password"
                value={changePasswordConfirm}
                onChange={(e) => setChangePasswordConfirm(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                className="w-full px-3 py-2 border border-[#252c3a] bg-[#161c28] rounded-xl text-[#d8d0c4] placeholder-[#585048] focus:outline-none focus:border-[#3a4258]"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={changePasswordSaving || !changePasswordCurrent || !changePasswordNew || !changePasswordConfirm}
              className="flex items-center gap-2 px-4 py-2 border border-[#4e9a8e]/30 bg-[#4e9a8e]/10 text-[#4e9a8e] text-sm font-medium hover:bg-[#4e9a8e]/20 disabled:opacity-50 rounded-xl transition-colors"
            >
              <FaSave /> {changePasswordSaving ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Total XP
            </div>
            <div className="text-xl font-bold text-[#c8a040]">{totalPoints}</div>
          </div>
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Level
            </div>
            <div className="text-xl font-bold text-[#d8d0c4]">{level}</div>
          </div>
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Modules Done
            </div>
            <div className="text-xl font-bold text-[#d8d0c4]">
              {completedModules}
            </div>
          </div>
          <div className="border border-[#252c3a] bg-[#111620] p-4 rounded-xl">
            <div className="text-xs text-[#706858] uppercase font-medium mb-1">
              Achievements
            </div>
            <div className="text-xl font-bold text-[#d8d0c4]">
              {earnedAchievements}/{achievements.length}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <h2 className="text-lg font-bold text-[#d8d0c4] mb-4 flex items-center gap-2">
          <FaTrophy className="text-[#c8a040]" /> Achievements
        </h2>
        {achievements.length === 0 ? (
          <div className="border border-[#252c3a] bg-[#111620] p-8 text-center text-[#706858] rounded-2xl">
            No achievements yet. Complete lessons and activities to unlock them.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`border p-4 flex items-start gap-3 rounded-xl transition-colors ${
                  ach.earned
                    ? "border-[#c8a040]/25 bg-[#c8a040]/5"
                    : "border-[#252c3a] bg-[#111620] opacity-80"
                }`}
              >
                <div
                  className={`w-12 h-12 border flex items-center justify-center shrink-0 rounded-xl ${
                    ach.earned ? "border-[#c8a040]/30 bg-[#c8a040]/10" : "border-[#2e3648] bg-[#1c2230]"
                  }`}
                >
                  {ach.earned ? (
                    <FaTrophy className="text-xl text-[#c8a040]" />
                  ) : (
                    <FaLock className="text-lg text-[#585048]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#d8d0c4] truncate">
                      {ach.name}
                    </h3>
                    {ach.earned && (
                      <FaCheckCircle className="text-[#5c9650] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#706858] line-clamp-2">
                    {ach.description}
                  </p>
                  {ach.xpReward && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#c8a040]">
                      <FaBolt /> +{ach.xpReward} XP
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 border rounded-lg ${
                    ach.earned
                      ? "border-[#5c9650]/30 text-[#5c9650] bg-[#5c9650]/5"
                      : "border-[#2e3648] text-[#585048]"
                  }`}
                >
                  {ach.earned ? "UNLOCKED" : "LOCKED"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default Profile;
