import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaPlus,
  FaShieldAlt,
  FaTrash,
  FaUsers,
  FaLayerGroup,
  FaChartBar,
  FaSearch,
  FaTrophy,
  FaSyncAlt,
  FaRobot,
  FaCheckCircle,
  FaClock,
  FaFireAlt,
  FaBolt,
  FaMedal,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { adminAPI, modulesAPI, achievementsAPI } from "../api/api";
import { GameLayout, PageHeader } from "../components/layout/GameLayout";
import ConfirmModal from "../components/ui/ConfirmModal";

const LEARNING_PATHS = [
  "none", "javascript-basics", "game-development",
  "react-basics", "react-game-dev", "multiplayer", "advanced-concepts",
];

const MODULE_CATEGORIES = [
  "javascript-basics", "game-development", "react-game-dev",
  "multiplayer", "advanced-concepts",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];

const RARITY_STYLES = {
  common:    { badge: "bg-[#1f1f1f] text-[#a3a3a3] border border-[#2a2a2a]", dot: "bg-[#737373]", label: "Common",    bar: "#737373" },
  uncommon:  { badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30", dot: "bg-emerald-400", label: "Uncommon", bar: "#34d399" },
  rare:      { badge: "bg-blue-500/15 text-blue-400 border border-blue-500/30", dot: "bg-blue-400", label: "Rare",      bar: "#60a5fa" },
  epic:      { badge: "bg-purple-500/15 text-purple-400 border border-purple-500/30", dot: "bg-purple-400", label: "Epic",      bar: "#c084fc" },
  legendary: { badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30", dot: "bg-amber-400", label: "Legendary", bar: "#fbbf24" },
};

const DIFF_STYLES = {
  beginner:     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  advanced:     "bg-red-500/10 text-red-400 border border-red-500/20",
};

const CAT_COLORS = {
  "javascript-basics": "#f59e0b",
  "game-development":  "#3b82f6",
  "react-game-dev":    "#06b6d4",
  "multiplayer":       "#8b5cf6",
  "advanced-concepts": "#ef4444",
};

const RarityBadge = ({ rarity }) => {
  const s = RARITY_STYLES[rarity] || RARITY_STYLES.common;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const DiffBadge = ({ difficulty }) => (
  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${DIFF_STYLES[difficulty] || ""}`}>{difficulty}</span>
);

const TypeBadge = ({ type }) =>
  type === "react"
    ? <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">React</span>
    : <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-[#1f1f1f] text-[#737373] border border-[#262626]">Vanilla</span>;

const StatCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${accent ? "bg-amber-500/20 text-amber-400" : "bg-[#1a1a1a] text-[#a3a3a3]"}`}><Icon className="text-lg" /></div>
      <span className="text-[13px] font-medium text-[#737373]">{label}</span>
    </div>
    <p className="text-2xl font-semibold text-[#e5e5e5]">{value}</p>
    {sub && <p className="text-[12px] text-[#525252] mt-1">{sub}</p>}
  </div>
);

const MiniBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-[#a3a3a3]">{label}</span>
        <span className="text-[#737373]">{count} <span className="text-[#525252]">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color || "#a3a3a3" }} />
      </div>
    </div>
  );
};

const Admin = () => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? user?._id;
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userModal, setUserModal] = useState(null);
  const [moduleModal, setModuleModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [userFilterPath, setUserFilterPath] = useState("");
  const [userFilterRole, setUserFilterRole] = useState("");
  const [moduleFilterCategory, setModuleFilterCategory] = useState("");
  const [moduleFilterDifficulty, setModuleFilterDifficulty] = useState("");
  const [achSearch, setAchSearch] = useState("");
  const [achFilterCategory, setAchFilterCategory] = useState("");
  const [achFilterRarity, setAchFilterRarity] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    open: false, title: "", message: "", onConfirm: null,
  });
  const initialUserModalRef = useRef(null);
  const initialModuleModalRef = useRef(null);

  const loadUsers = async () => {
    const res = await adminAPI.getUsers();
    setUsers(res.data.users || []);
  };

  const loadModules = async () => {
    const res = await modulesAPI.getAll("all");
    setModules(res.data.modules || []);
  };

  const loadAchievements = async () => {
    const res = await achievementsAPI.getAll();
    setAchievements(res.data.achievements || []);
  };

  const loadStats = async () => {
    try { const res = await adminAPI.getStats(); setStats(res.data); } catch (_) {}
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { await Promise.all([loadUsers(), loadModules(), loadAchievements(), loadStats()]); }
      catch (err) { toast.error(err?.response?.data?.message || "Failed to load data"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSaveUser = async () => {
    if (!userModal?.id) return;
    setSaving(true);
    try {
      await adminAPI.updateUser(userModal.id, {
        name: userModal.name,
        email: userModal.email,
        learningPath: userModal.learningPath,
        gameStudioEnabled: userModal.gameStudioEnabled,
        knowsJavaScript: userModal.knowsJavaScript,
        role: userModal.role,
      });
      toast.success("User updated");
      setUserModal(null);
      initialUserModalRef.current = null;
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (u) => {
    if (u.id === currentUserId) {
      toast.error("You cannot delete your own account");
      return;
    }
    setConfirmModal({
      open: true,
      title: "Delete user",
      message: `Delete "${u.name}" (${u.email})? This cannot be undone.`,
      onConfirm: () => confirmDeleteUser(u),
    });
  };

  const confirmDeleteUser = async (u) => {
    setConfirmModal((p) => ({ ...p, open: false }));
    try {
      await adminAPI.deleteUser(u.id);
      toast.success("User deleted");
      setUserModal(null);
      initialUserModalRef.current = null;
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleSaveModule = async () => {
    if (!moduleModal) return;
    const payload = {
      title: moduleModal.title,
      description: moduleModal.description,
      category: moduleModal.category,
      difficulty: moduleModal.difficulty,
      order: Number(moduleModal.order) || 0,
      content: moduleModal.content || "",
      moduleType: moduleModal.moduleType || "vanilla",
      estimatedMinutes: Number(moduleModal.estimatedMinutes) || 15,
      tags: moduleModal.tags || [],
      objectives: Array.isArray(moduleModal.objectives) ? moduleModal.objectives : [],
    };
    setSaving(true);
    try {
      if (moduleModal.id) {
        await modulesAPI.update(moduleModal.id, payload);
        toast.success("Module updated");
      } else {
        await modulesAPI.create(payload);
        toast.success("Module created");
      }
      setModuleModal(null);
      initialModuleModalRef.current = null;
      await loadModules();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save module");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = (m) => {
    setConfirmModal({
      open: true,
      title: "Delete module",
      message: `Delete module "${m.title}"? This cannot be undone.`,
      onConfirm: () => confirmDeleteModule(m),
    });
  };

  const confirmDeleteModule = async (m) => {
    setConfirmModal((p) => ({ ...p, open: false }));
    try {
      await modulesAPI.delete(m._id);
      toast.success("Module deleted");
      setModuleModal(null);
      initialModuleModalRef.current = null;
      await loadModules();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete module");
    }
  };

  const handleRegenerateModule = (m) => {
    setConfirmModal({
      open: true,
      title: "Regenerate AI content",
      message: `Re-generate steps and hints for "${m.title}" using AI? This will overwrite existing AI content.`,
      onConfirm: () => confirmRegenerate(m),
    });
  };

  const confirmRegenerate = async (m) => {
    setConfirmModal((p) => ({ ...p, open: false }));
    setRegeneratingId(m._id);
    try {
      await modulesAPI.regenerateContent(m._id);
      toast.success("AI content regenerated");
      await loadModules();
    } catch (err) {
      toast.error(err.response?.data?.message || "Regeneration failed");
    } finally {
      setRegeneratingId(null);
    }
  };

  const isUserModalDirty = () => {
    if (!userModal || !initialUserModalRef.current) return false;
    const a = initialUserModalRef.current;
    return (
      userModal.name !== a.name ||
      userModal.email !== a.email ||
      userModal.learningPath !== a.learningPath ||
      userModal.gameStudioEnabled !== a.gameStudioEnabled ||
      userModal.knowsJavaScript !== a.knowsJavaScript ||
      (userModal.role || "user") !== (a.role || "user")
    );
  };

  const isModuleModalDirty = () => {
    if (!moduleModal || !initialModuleModalRef.current) return false;
    const a = initialModuleModalRef.current;
    return (
      moduleModal.title !== a.title ||
      moduleModal.description !== a.description ||
      moduleModal.category !== a.category ||
      moduleModal.difficulty !== a.difficulty ||
      String(moduleModal.order) !== String(a.order) ||
      (moduleModal.content || "") !== (a.content || "")
    );
  };

  const closeUserModal = (force = false) => {
    if (!force && isUserModalDirty()) {
      setConfirmModal({
        open: true,
        title: "Discard changes?",
        message: "You have unsaved changes. Close without saving?",
        onConfirm: () => {
          setConfirmModal((p) => ({ ...p, open: false }));
          setUserModal(null);
          initialUserModalRef.current = null;
        },
      });
      return;
    }
    setUserModal(null);
    initialUserModalRef.current = null;
  };

  const closeModuleModal = (force = false) => {
    if (!force && isModuleModalDirty()) {
      setConfirmModal({
        open: true,
        title: "Discard changes?",
        message: "You have unsaved changes. Close without saving?",
        onConfirm: () => {
          setConfirmModal((p) => ({ ...p, open: false }));
          setModuleModal(null);
          initialModuleModalRef.current = null;
        },
      });
      return;
    }
    setModuleModal(null);
    initialModuleModalRef.current = null;
  };

  const openEditUser = (u) => {
    const data = {
      id: u.id,
      name: u.name,
      email: u.email,
      learningPath: u.learningPath || "none",
      gameStudioEnabled: u.gameStudioEnabled ?? false,
      knowsJavaScript: u.knowsJavaScript ?? false,
      role: u.isAdmin ? "admin" : "user",
      totalPoints: u.totalPoints,
      level: u.level,
      createdAt: u.createdAt,
      completedCount: (u.completedModules || []).length,
      achievementCount: (u.earnedAchievements || []).length,
    };
    initialUserModalRef.current = { ...data };
    setUserModal(data);
  };

  const openEditModule = (m) => {
    if (!m) {
      const data = {
        title: "", description: "", category: "javascript-basics",
        difficulty: "beginner", order: 0, content: "",
        moduleType: "vanilla", estimatedMinutes: 15, tags: [], objectives: [],
      };
      initialModuleModalRef.current = { ...data };
      setModuleModal(data);
      return;
    }
    const data = {
      id: m._id, title: m.title, description: m.description,
      category: m.category, difficulty: m.difficulty,
      order: m.order ?? 0, content: m.content ?? "",
      moduleType: m.moduleType || "vanilla",
      estimatedMinutes: m.estimatedMinutes ?? 15,
      tags: m.tags || [], objectives: m.objectives || [],
      contentGenerated: m.contentGenerated,
    };
    initialModuleModalRef.current = { ...data };
    setModuleModal(data);
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    const q = userSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
      );
    }
    if (userFilterPath) {
      list = list.filter((u) => (u.learningPath || "none") === userFilterPath);
    }
    if (userFilterRole === "admin") {
      list = list.filter((u) => u.isAdmin);
    } else if (userFilterRole === "user") {
      list = list.filter((u) => !u.isAdmin);
    }
    return list;
  }, [users, userSearch, userFilterPath, userFilterRole]);

  const filteredModules = useMemo(() => {
    let list = [...modules];
    const q = moduleSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          (m.title || "").toLowerCase().includes(q) ||
          (m.category || "").toLowerCase().includes(q) ||
          (m.description || "").toLowerCase().includes(q)
      );
    }
    if (moduleFilterCategory) {
      list = list.filter((m) => (m.category || "") === moduleFilterCategory);
    }
    if (moduleFilterDifficulty) {
      list = list.filter((m) => m.difficulty === moduleFilterDifficulty);
    }
    return list.sort((a, b) => {
      if (a.category !== b.category) return (a.category || "").localeCompare(b.category || "");
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [modules, moduleSearch, moduleFilterCategory, moduleFilterDifficulty]);

  const filteredAchievements = useMemo(() => {
    let list = [...achievements];
    const q = achSearch.trim().toLowerCase();
    if (q) list = list.filter((a) => (a.name || "").toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q));
    if (achFilterCategory) list = list.filter((a) => a.category === achFilterCategory);
    if (achFilterRarity) list = list.filter((a) => a.rarity === achFilterRarity);
    return list.sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
  }, [achievements, achSearch, achFilterCategory, achFilterRarity]);

  const achCategories = useMemo(
    () => [...new Set(achievements.map((a) => a.category).filter(Boolean))].sort(),
    [achievements]
  );

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      await Promise.all([loadUsers(), loadModules(), loadAchievements(), loadStats()]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const tabCls = (t) =>
    `flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
      tab === t ? "border-[#a3a3a3] text-white" : "border-transparent text-[#737373] hover:text-[#e5e5e5]"
    }`;
  const inputCls =
    "w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]";

  return (
    <GameLayout>
      <PageHeader
        title="Admin"
        subtitle="Platform management"
        icon={FaShieldAlt}
        badge="Admin"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 border-b border-[#1f1f1f]">
            <button onClick={() => setTab("overview")} className={tabCls("overview")}>
              <FaChartBar /> Overview
            </button>
            <button onClick={() => setTab("users")} className={tabCls("users")}>
              <FaUsers /> Users
              <span className="ml-1 text-[11px] text-[#525252]">({users.length})</span>
            </button>
            <button onClick={() => setTab("modules")} className={tabCls("modules")}>
              <FaLayerGroup /> Modules
              <span className="ml-1 text-[11px] text-[#525252]">({modules.length})</span>
            </button>
            <button onClick={() => setTab("achievements")} className={tabCls("achievements")}>
              <FaTrophy /> Achievements
              <span className="ml-1 text-[11px] text-[#525252]">({achievements.length})</span>
            </button>
          </div>
          <button
            onClick={() => { loadAll(true); toast.success("Data refreshed"); }}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#737373] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50"
            title="Refresh all data"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-[#737373]">
            <FaSyncAlt className="animate-spin" /> Loading...
          </div>
        ) : tab === "overview" ? (
          <div className="space-y-6">
            {/* 6 stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={FaUsers} label="Users" value={users.length} sub={`${users.filter((u) => u.isAdmin).length} admin(s)`} />
              <StatCard icon={FaLayerGroup} label="Modules" value={modules.length} sub={`${modules.filter((m) => m.contentGenerated).length} AI-ready`} />
              <StatCard icon={FaTrophy} label="Achievements" value={achievements.length} />
              <StatCard
                icon={FaFireAlt}
                label="Total XP"
                value={(stats?.users?.totalXP ?? users.reduce((s, u) => s + (u.totalPoints || 0), 0)).toLocaleString()}
                accent
              />
              <StatCard
                icon={FaBolt}
                label="Avg level"
                value={stats?.users?.avgLevel != null ? Number(stats.users.avgLevel).toFixed(1) : (users.length ? (users.reduce((s, u) => s + (u.level || 1), 0) / users.length).toFixed(1) : "—")}
              />
              <StatCard
                icon={FaRobot}
                label="AI generated"
                value={modules.length ? `${Math.round((modules.filter((m) => m.contentGenerated).length / modules.length) * 100)}%` : "0%"}
                accent
              />
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-5">
                <h4 className="text-[13px] font-medium text-[#737373] mb-4">Modules by category</h4>
                <div className="space-y-2">
                  {MODULE_CATEGORIES.map((cat) => {
                    const count = modules.filter((m) => m.category === cat).length;
                    return <MiniBar key={cat} label={cat} count={count} total={modules.length || 1} color={CAT_COLORS[cat]} />;
                  })}
                </div>
              </div>
              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-5">
                <h4 className="text-[13px] font-medium text-[#737373] mb-4">Users by learning path</h4>
                <div className="space-y-2">
                  {LEARNING_PATHS.filter((p) => p !== "none").map((path) => {
                    const count = users.filter((u) => (u.learningPath || "none") === path).length;
                    if (count === 0) return null;
                    return <MiniBar key={path} label={path} count={count} total={users.length || 1} color="#6366f1" />;
                  })}
                  {users.filter((u) => !u.learningPath || u.learningPath === "none").length > 0 && (
                    <MiniBar label="none" count={users.filter((u) => !u.learningPath || u.learningPath === "none").length} total={users.length || 1} color="#3a3a3a" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-5">
                <h4 className="text-[13px] font-medium text-[#737373] mb-4">Achievements by rarity</h4>
                <div className="space-y-2">
                  {RARITY_ORDER.map((r) => {
                    const count = achievements.filter((a) => (a.rarity || "common") === r).length;
                    return (
                      <div key={r} className="flex items-center gap-3">
                        <RarityBadge rarity={r} />
                        <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${achievements.length ? (count / achievements.length) * 100 : 0}%`, backgroundColor: RARITY_STYLES[r].bar }}
                          />
                        </div>
                        <span className="text-[12px] text-[#525252] w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-5">
                <h4 className="text-[13px] font-medium text-[#737373] mb-4">Top learners</h4>
                <div className="space-y-2">
                  {[...users]
                    .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
                    .slice(0, 5)
                    .map((u, i) => (
                      <div key={u.id} className="flex items-center gap-3 text-[13px]">
                        <span className="w-4 text-[#3a3a3a] text-center text-[11px]">{i + 1}</span>
                        <div className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-[10px] text-[#737373]">
                          {(u.name || "?")[0].toUpperCase()}
                        </div>
                        <span className="flex-1 text-[#a3a3a3] truncate">{u.name}</span>
                        <span className="text-amber-400 font-medium">{(u.totalPoints || 0).toLocaleString()} XP</span>
                        <span className="text-[#525252] text-[11px]">Lv.{u.level ?? 1}</span>
                      </div>
                    ))}
                  {users.length === 0 && <p className="text-[12px] text-[#3a3a3a]">No users yet</p>}
                </div>
              </div>
            </div>

            {/* Recent signups */}
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-5">
              <h4 className="text-[13px] font-medium text-[#737373] mb-4">Recent signups</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] text-left">
                      <th className="py-2 pr-4 font-medium text-[#737373]">Name</th>
                      <th className="py-2 pr-4 font-medium text-[#737373]">Email</th>
                      <th className="py-2 pr-4 font-medium text-[#737373]">Path</th>
                      <th className="py-2 pr-4 font-medium text-[#737373]">XP</th>
                      <th className="py-2 pr-4 font-medium text-[#737373]">Completed</th>
                      <th className="py-2 font-medium text-[#737373]">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...users]
                      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                      .slice(0, 10)
                      .map((u) => (
                        <tr key={u.id} className="border-b border-[#1a1a1a]">
                          <td className="py-2 pr-4 text-[#e5e5e5]">{u.name}</td>
                          <td className="py-2 pr-4 text-[#a3a3a3]">{u.email}</td>
                          <td className="py-2 pr-4 text-[#a3a3a3]">{u.learningPath || "none"}</td>
                          <td className="py-2 pr-4 text-amber-400">{(u.totalPoints || 0).toLocaleString()}</td>
                          <td className="py-2 pr-4 text-[#737373]">{(u.completedModules || []).length}</td>
                          <td className="py-2 text-[#525252]">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === "users" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] text-sm" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <select
                value={userFilterPath}
                onChange={(e) => setUserFilterPath(e.target.value)}
                className="px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
              >
                <option value="">All paths</option>
                {LEARNING_PATHS.map((path) => (
                  <option key={path} value={path}>{path}</option>
                ))}
              </select>
              <select
                value={userFilterRole}
                onChange={(e) => setUserFilterRole(e.target.value)}
                className="px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
              >
                <option value="">All roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <span className="text-[12px] text-[#525252] ml-auto">{filteredUsers.length} of {users.length}</span>
            </div>
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] bg-[#0a0a0a]">
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">XP</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Completed</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Path</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Role</th>
                      <th className="text-right py-3 px-4 font-medium text-[#737373]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f]">
                        <td className="py-3 px-4 text-[#e5e5e5]">{u.name}</td>
                        <td className="py-3 px-4 text-[#a3a3a3]">{u.email}</td>
                        <td className="py-3 px-4 text-[#a3a3a3]">Lv.{u.level ?? 1}</td>
                        <td className="py-3 px-4 text-amber-400 font-medium">{(u.totalPoints || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-[#737373]">{(u.completedModules || []).length}</td>
                        <td className="py-3 px-4 text-[#a3a3a3]">{u.learningPath || "none"}</td>
                        <td className="py-3 px-4">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <FaShieldAlt className="text-[10px]" /> Admin
                            </span>
                          ) : (
                            <span className="text-[#525252]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditUser(u)}
                            className="p-2 text-[#737373] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === currentUserId}
                            className="p-2 text-[#737373] hover:text-red-400 hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === "modules" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] text-sm" />
                  <input
                    type="text"
                    placeholder="Search by title, category..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                  />
                </div>
                <select
                  value={moduleFilterCategory}
                  onChange={(e) => setModuleFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                >
                  <option value="">All categories</option>
                  {MODULE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={moduleFilterDifficulty}
                  onChange={(e) => setModuleFilterDifficulty(e.target.value)}
                  className="px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                >
                  <option value="">All difficulties</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="text-[12px] text-[#525252]">{filteredModules.length} of {modules.length}</span>
              </div>
              <button
                onClick={() => openEditModule(null)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] text-[#e5e5e5] text-[13px] font-medium hover:bg-[#262626] rounded transition-colors"
              >
                <FaPlus /> Add module
              </button>
            </div>
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] bg-[#0a0a0a]">
                      <th className="text-left py-3 px-4 font-medium text-[#737373] w-8">#</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Difficulty</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Mins</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">AI</th>
                      <th className="text-right py-3 px-4 font-medium text-[#737373]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModules.map((m) => (
                      <tr key={m._id} className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f]">
                        <td className="py-3 px-4 text-[#525252]">{m.order ?? 0}</td>
                        <td className="py-3 px-4 text-[#e5e5e5] max-w-[200px] truncate" title={m.title}>{m.title}</td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-medium"
                            style={{ backgroundColor: `${CAT_COLORS[m.category]}20`, color: CAT_COLORS[m.category] || "#a3a3a3" }}
                          >
                            {m.category}
                          </span>
                        </td>
                        <td className="py-3 px-4"><TypeBadge type={m.moduleType} /></td>
                        <td className="py-3 px-4"><DiffBadge difficulty={m.difficulty} /></td>
                        <td className="py-3 px-4 text-[#737373]">
                          <span className="flex items-center gap-1">
                            <FaClock className="text-[10px]" />{m.estimatedMinutes ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {m.contentGenerated ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                              <FaCheckCircle /> Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[#525252] text-[11px]">
                              <FaClock /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleRegenerateModule(m)}
                            disabled={regeneratingId === m._id}
                            className="p-2 text-[#737373] hover:text-blue-400 hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50"
                            title="Regenerate AI content"
                          >
                            {regeneratingId === m._id ? <FaSyncAlt className="animate-spin" /> : <FaRobot />}
                          </button>
                          <button
                            onClick={() => openEditModule(m)}
                            className="p-2 text-[#737373] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(m)}
                            className="p-2 text-[#737373] hover:text-red-400 hover:bg-[#1a1a1a] rounded transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === "achievements" ? (
          <div className="space-y-4">
            {/* Rarity filter chips */}
            <div className="flex flex-wrap gap-2">
              {RARITY_ORDER.map((r) => {
                const count = achievements.filter((a) => (a.rarity || "common") === r).length;
                return (
                  <button
                    key={r}
                    onClick={() => setAchFilterRarity(achFilterRarity === r ? "" : r)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all border ${RARITY_STYLES[r].badge} ${achFilterRarity === r ? "ring-1 ring-white/20 scale-105" : "opacity-70 hover:opacity-100"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${RARITY_STYLES[r].dot}`} />
                    {RARITY_STYLES[r].label}
                    <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
              {achFilterRarity && (
                <button onClick={() => setAchFilterRarity("")} className="px-3 py-1.5 rounded-full text-[12px] text-[#525252] hover:text-[#a3a3a3] border border-[#262626] transition-colors">
                  Clear
                </button>
              )}
            </div>

            {/* Search + category filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] text-sm" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={achSearch}
                  onChange={(e) => setAchSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <select
                value={achFilterCategory}
                onChange={(e) => setAchFilterCategory(e.target.value)}
                className="px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
              >
                <option value="">All categories</option>
                {achCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <span className="text-[12px] text-[#525252] ml-auto">{filteredAchievements.length} of {achievements.length}</span>
            </div>

            {/* Card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAchievements.map((a) => (
                <div
                  key={a.id}
                  className={`bg-[#0c0c0c] border rounded-lg p-4 flex items-start gap-3 transition-colors hover:bg-[#0f0f0f] ${
                    a.rarity === "legendary"
                      ? "border-amber-500/30"
                      : a.rarity === "epic"
                      ? "border-purple-500/20"
                      : "border-[#1f1f1f]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-[#141414] border border-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                    {a.icon ? (
                      <img src={a.icon} className="w-5 h-5 opacity-80" alt="" onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <FaTrophy className="text-[#525252]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-1">
                      <p className="font-medium text-[#e5e5e5] text-[13px] truncate">{a.name}</p>
                      <span className="text-amber-400 text-[12px] font-medium whitespace-nowrap">{a.points ?? 0} pts</span>
                    </div>
                    <p className="text-[12px] text-[#737373] mb-2 line-clamp-2">{a.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <RarityBadge rarity={a.rarity || "common"} />
                      {a.category && (
                        <span className="px-2 py-0.5 rounded text-[11px] bg-[#141414] text-[#525252] border border-[#262626]">
                          {a.category}
                        </span>
                      )}
                    </div>
                    {a.requirement && (
                      <p className="text-[11px] text-[#3a3a3a] mt-1.5 font-mono truncate" title={a.requirement}>
                        {a.requirement}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {filteredAchievements.length === 0 && (
                <div className="col-span-3 py-12 text-center text-[#525252] text-[13px]">No achievements match your filters</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* User edit modal */}
      {userModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => closeUserModal()}
          role="presentation"
        >
          <div
            className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Edit user</h3>
            {(userModal.totalPoints != null || userModal.level != null || userModal.createdAt) && (
              <div className="flex flex-wrap gap-4 mb-5 p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg text-[12px]">
                <span className="text-[#525252]">Lv.<span className="text-[#a3a3a3] ml-0.5">{userModal.level ?? 1}</span></span>
                <span className="text-[#525252]">XP <span className="text-amber-400 ml-0.5">{(userModal.totalPoints || 0).toLocaleString()}</span></span>
                <span className="text-[#525252]">Modules <span className="text-[#a3a3a3] ml-0.5">{userModal.completedCount ?? 0}</span></span>
                {userModal.createdAt && (
                  <span className="text-[#525252] ml-auto">Joined {new Date(userModal.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Name</label>
                <input
                  type="text"
                  value={userModal.name}
                  onChange={(e) => setUserModal((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Email</label>
                <input
                  type="email"
                  value={userModal.email}
                  onChange={(e) => setUserModal((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Learning path</label>
                <select
                  value={userModal.learningPath}
                  onChange={(e) => setUserModal((p) => ({ ...p, learningPath: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                >
                  {LEARNING_PATHS.map((path) => (
                    <option key={path} value={path}>
                      {path}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="gameStudio"
                  checked={userModal.gameStudioEnabled}
                  onChange={(e) =>
                    setUserModal((p) => ({ ...p, gameStudioEnabled: e.target.checked }))
                  }
                  className="rounded border-[#262626] bg-[#141414] text-[#a3a3a3]"
                />
                <label htmlFor="gameStudio" className="text-[13px] text-[#a3a3a3]">
                  Game Studio enabled
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="knowsJs"
                  checked={userModal.knowsJavaScript}
                  onChange={(e) =>
                    setUserModal((p) => ({ ...p, knowsJavaScript: e.target.checked }))
                  }
                  className="rounded border-[#262626] bg-[#141414] text-[#a3a3a3]"
                />
                <label htmlFor="knowsJs" className="text-[13px] text-[#a3a3a3]">
                  Knows JavaScript
                </label>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Role</label>
                <select
                  value={userModal.role || "user"}
                  onChange={(e) => setUserModal((p) => ({ ...p, role: e.target.value }))}
                  disabled={userModal.id === currentUserId}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {userModal.id === currentUserId && (
                  <p className="text-[11px] text-[#525252] mt-1">You cannot change your own role.</p>
                )}
              </div>

            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => closeUserModal()}
                className="px-4 py-2 text-[13px] font-medium text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="px-4 py-2 bg-[#262626] text-[#e5e5e5] text-[13px] font-medium hover:bg-[#404040] rounded transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module add/edit modal */}
      {moduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 overflow-y-auto"
          onClick={() => closeModuleModal()}
          role="presentation"
        >
          <div
            className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg w-full max-w-2xl p-6 my-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">
              {moduleModal.id ? "Edit module" : "Add module"}
            </h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Title</label>
                <input
                  type="text"
                  value={moduleModal.title}
                  onChange={(e) => setModuleModal((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Description</label>
                <input
                  type="text"
                  value={moduleModal.description}
                  onChange={(e) => setModuleModal((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">Category</label>
                  <select
                    value={moduleModal.category}
                    onChange={(e) => setModuleModal((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                  >
                    {MODULE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">Difficulty</label>
                  <select
                    value={moduleModal.difficulty}
                    onChange={(e) => setModuleModal((p) => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">Module type</label>
                  <select
                    value={moduleModal.moduleType || "vanilla"}
                    onChange={(e) => setModuleModal((p) => ({ ...p, moduleType: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                  >
                    <option value="vanilla">Vanilla JS</option>
                    <option value="react">React</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#737373] mb-1">Estimated minutes</label>
                  <input
                    type="number"
                    min={1}
                    value={moduleModal.estimatedMinutes ?? ""}
                    onChange={(e) => setModuleModal((p) => ({ ...p, estimatedMinutes: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Order</label>
                <input
                  type="number"
                  value={moduleModal.order}
                  onChange={(e) => setModuleModal((p) => ({ ...p, order: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Tags <span className="text-[#3a3a3a]">(comma-separated)</span></label>
                <input
                  type="text"
                  value={(moduleModal.tags || []).join(", ")}
                  onChange={(e) => setModuleModal((p) => ({ ...p, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))}
                  placeholder="e.g. variables, loops, functions"
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Learning objectives <span className="text-[#3a3a3a]">(one per line)</span></label>
                <textarea
                  value={(moduleModal.objectives || []).join("\n")}
                  onChange={(e) => setModuleModal((p) => ({ ...p, objectives: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) }))}
                  rows={3}
                  placeholder="Understand variables&#10;Use loops&#10;Write functions"
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Content (markdown)</label>
                <textarea
                  value={moduleModal.content}
                  onChange={(e) => setModuleModal((p) => ({ ...p, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040] font-mono"
                />
              </div>
              {moduleModal.id && (
                <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg text-[12px] text-[#525252]">
                  <FaRobot />
                  AI content:&nbsp;
                  {moduleModal.contentGenerated ? (
                    <span className="flex items-center gap-1 text-emerald-400"><FaCheckCircle /> Generated</span>
                  ) : (
                    <span className="flex items-center gap-1"><FaClock /> Pending — use Regenerate to generate</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => closeModuleModal()}
                className="px-4 py-2 text-[13px] font-medium text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModule}
                disabled={saving || !moduleModal.title?.trim()}
                className="px-4 py-2 bg-[#262626] text-[#e5e5e5] text-[13px] font-medium hover:bg-[#404040] rounded transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          if (typeof confirmModal.onConfirm === "function") confirmModal.onConfirm();
          setConfirmModal((p) => ({ ...p, open: false }));
        }}
        onCancel={() => setConfirmModal((p) => ({ ...p, open: false }))}
      />
    </GameLayout>
  );
};

export default Admin;
