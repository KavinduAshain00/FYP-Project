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
  FaFileExport,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaAward,
  FaCalendarAlt,
  FaBolt,
  FaUserPlus,
  FaUserMinus,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import { adminAPI, modulesAPI, achievementsAPI } from "../api/api";
import { GameLayout, PageHeader } from "../components/layout/GameLayout";
import ConfirmModal from "../components/ui/ConfirmModal";

const LEARNING_PATHS = [
  "none",
  "javascript-basics",
  "game-development",
  "react-basics",
  "multiplayer",
  "advanced-concepts",
  "advanced",
];

const MODULE_CATEGORIES = [
  "javascript-basics",
  "game-development",
  "multiplayer",
  "advanced-concepts",
  "react-fundamentals",
  "react-game-dev",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const Admin = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userModal, setUserModal] = useState(null);
  const [moduleModal, setModuleModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [userFilterPath, setUserFilterPath] = useState("");
  const [moduleFilterCategory, setModuleFilterCategory] = useState("");
  const [moduleFilterDifficulty, setModuleFilterDifficulty] = useState("");
  const [userSortBy, setUserSortBy] = useState("createdAt");
  const [userSortOrder, setUserSortOrder] = useState("desc");
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [moduleSortBy, setModuleSortBy] = useState("order");
  const [moduleSortOrder, setModuleSortOrder] = useState("asc");
  const [achievementSearch, setAchievementSearch] = useState("");
  const [grantModal, setGrantModal] = useState(null);
  const [grantSaving, setGrantSaving] = useState(false);
  const [adminActionUserId, setAdminActionUserId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const initialUserModalRef = useRef(null);
  const initialModuleModalRef = useRef(null);

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    }
  };

  const loadModules = async () => {
    try {
      const res = await modulesAPI.getAll("all");
      setModules(res.data.modules || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load modules");
    }
  };

  const loadAchievements = async () => {
    try {
      const res = await achievementsAPI.getAll();
      setAchievements(res.data.achievements || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load achievements");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadModules(), loadAchievements()]);
      setLoading(false);
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
    if (u.id === user?.id) {
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

  const handleGrantAdmin = async (u) => {
    if (u.isAdmin) return;
    setAdminActionUserId(u.id);
    try {
      const res = await adminAPI.grantAdmin(u.id);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? (res.data?.user ? { ...x, ...res.data.user } : { ...x, isAdmin: true }) : x)));
      toast.success(`${u.name} is now an admin`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to grant admin");
    } finally {
      setAdminActionUserId(null);
    }
  };

  const handleRevokeAdmin = async (u) => {
    if (!u.isAdmin || u.id === user?.id) return;
    setAdminActionUserId(u.id);
    try {
      const res = await adminAPI.revokeAdmin(u.id);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? (res.data?.user ? { ...x, ...res.data.user } : { ...x, isAdmin: false }) : x)));
      toast.success(`Admin revoked from ${u.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke admin");
    } finally {
      setAdminActionUserId(null);
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
      starterCode: moduleModal.starterCode || {
        html: "<!DOCTYPE html>...",
        css: "",
        javascript: "// Start here",
        jsx: "",
      },
      objectives: Array.isArray(moduleModal.objectives) ? moduleModal.objectives : [],
      hints: Array.isArray(moduleModal.hints) ? moduleModal.hints : [],
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

  const isUserModalDirty = () => {
    if (!userModal || !initialUserModalRef.current) return false;
    const a = initialUserModalRef.current;
    return (
      userModal.name !== a.name ||
      userModal.email !== a.email ||
      userModal.learningPath !== a.learningPath ||
      userModal.gameStudioEnabled !== a.gameStudioEnabled ||
      userModal.knowsJavaScript !== a.knowsJavaScript
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
    };
    initialUserModalRef.current = { ...data };
    setUserModal(data);
  };

  const openEditModule = (m) => {
    if (!m) {
      const data = {
        title: "",
        description: "",
        category: "javascript-basics",
        difficulty: "beginner",
        order: 0,
        content: "",
        moduleType: "vanilla",
        starterCode: { html: "", css: "", javascript: "", jsx: "" },
        objectives: [],
        hints: [],
      };
      initialModuleModalRef.current = { ...data };
      setModuleModal(data);
      return;
    }
    const data = {
      id: m._id,
      title: m.title,
      description: m.description,
      category: m.category,
      difficulty: m.difficulty,
      order: m.order ?? 0,
      content: m.content ?? "",
      moduleType: m.moduleType || "vanilla",
      starterCode: m.starterCode || { html: "", css: "", javascript: "", jsx: "" },
      objectives: m.objectives || [],
      hints: m.hints || [],
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
    const key = userSortBy;
    const order = userSortOrder === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (key === "createdAt") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (key === "name" || key === "email" || key === "learningPath") {
        va = (va || "").toLowerCase();
        vb = (vb || "").toLowerCase();
        return order * (va < vb ? -1 : va > vb ? 1 : 0);
      }
      va = Number(va) || 0;
      vb = Number(vb) || 0;
      return order * (va - vb);
    });
    return list;
  }, [users, userSearch, userFilterPath, userSortBy, userSortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));

  const overviewStats = useMemo(() => {
    const totalXp = users.reduce((acc, u) => acc + (u.totalPoints || 0), 0);
    const totalCompleted = users.reduce(
      (acc, u) => acc + (u.completedModules?.length || 0),
      0
    );
    const avgLevel =
      users.length > 0
        ? (users.reduce((acc, u) => acc + (u.level || 1), 0) / users.length).toFixed(1)
        : 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSignups = users
      .filter((u) => u.createdAt && new Date(u.createdAt) >= weekAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    return { totalXp, totalCompleted, avgLevel, recentSignups };
  }, [users]);

  const achievementEarnedCount = useMemo(() => {
    const map = {};
    achievements.forEach((a) => {
      map[a.id] = users.filter((u) => u.earnedAchievements?.includes(a.id)).length;
    });
    return map;
  }, [achievements, users]);

  const filteredAchievements = useMemo(() => {
    const q = achievementSearch.trim().toLowerCase();
    if (!q) return achievements;
    return achievements.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        (a.category || "").toLowerCase().includes(q)
    );
  }, [achievements, achievementSearch]);

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
      list = list.filter((m) => (m.difficulty || "") === moduleFilterDifficulty);
    }
    const key = moduleSortBy;
    const order = moduleSortOrder === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (key === "order" || key === "title") {
        if (key === "order") {
          va = Number(va) || 0;
          vb = Number(vb) || 0;
          return order * (va - vb);
        }
        va = (va || "").toLowerCase();
        vb = (vb || "").toLowerCase();
        return order * (va < vb ? -1 : va > vb ? 1 : 0);
      }
      va = (va || "").toLowerCase();
      vb = (vb || "").toLowerCase();
      return order * (va < vb ? -1 : va > vb ? 1 : 0);
    });
    return list;
  }, [modules, moduleSearch, moduleFilterCategory, moduleFilterDifficulty, moduleSortBy, moduleSortOrder]);

  const handleGrantAchievement = async () => {
    if (!grantModal?.userId || grantModal?.achievementId == null) return;
    setGrantSaving(true);
    try {
      await adminAPI.grantAchievement(grantModal.userId, grantModal.achievementId);
      toast.success("Achievement granted");
      setGrantModal(null);
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to grant achievement");
    } finally {
      setGrantSaving(false);
    }
  };

  const exportUsersCSV = () => {
    const headers = ["Name", "Email", "Level", "XP", "Completed", "Path", "Role"];
    const rows = filteredUsers.map((u) => [
      u.name || "",
      u.email || "",
      u.level ?? 1,
      u.totalPoints ?? 0,
      u.completedModules?.length ?? 0,
      u.learningPath || "none",
      u.isAdmin ? "Admin" : "User",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gamilearn-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const toggleUserSort = (key) => {
    if (userSortBy === key) setUserSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else setUserSortBy(key);
  };

  const toggleModuleSort = (key) => {
    if (moduleSortBy === key) setModuleSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else setModuleSortBy(key);
  };

  return (
    <GameLayout>
      <PageHeader
        title="Admin"
        subtitle="Manage users and modules"
        icon={FaShieldAlt}
        badge="Admin"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 border-b border-[#252c3a] mb-6">
          <button
            onClick={() => setTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "overview"
                ? "border-[#9a9080] text-white"
                : "border-transparent text-[#706858] hover:text-[#d8d0c4]"
            }`}
          >
            <FaChartBar />
            Overview
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "users"
                ? "border-[#9a9080] text-white"
                : "border-transparent text-[#706858] hover:text-[#d8d0c4]"
            }`}
          >
            <FaUsers />
            Users
          </button>
          <button
            onClick={() => setTab("modules")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "modules"
                ? "border-[#9a9080] text-white"
                : "border-transparent text-[#706858] hover:text-[#d8d0c4]"
            }`}
          >
            <FaLayerGroup />
            Modules
          </button>
          <button
            onClick={() => setTab("achievements")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "achievements"
                ? "border-[#9a9080] text-white"
                : "border-transparent text-[#706858] hover:text-[#d8d0c4]"
            }`}
          >
            <FaTrophy />
            Achievements
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#706858]">
            Loading...
          </div>
        ) : tab === "overview" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[#111620] border border-[#252c3a] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-[#1c2230] text-[#9a9080]">
                    <FaUsers className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-[#706858]">Total users</span>
                </div>
                <p className="text-2xl font-semibold text-[#d8d0c4]">{users.length}</p>
              </div>
              <div className="bg-[#111620] border border-[#252c3a] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-[#1c2230] text-[#9a9080]">
                    <FaLayerGroup className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-[#706858]">Total modules</span>
                </div>
                <p className="text-2xl font-semibold text-[#d8d0c4]">{modules.length}</p>
              </div>
              <div className="bg-[#111620] border border-[#252c3a] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-[#1c2230] text-[#c8a040]">
                    <FaTrophy className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-[#706858]">Achievements</span>
                </div>
                <p className="text-2xl font-semibold text-[#d8d0c4]">{achievements.length}</p>
              </div>
              <div className="bg-[#111620] border border-[#252c3a] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-[#1c2230] text-[#4e9a8e]">
                    <FaBolt className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-[#706858]">Total XP</span>
                </div>
                <p className="text-2xl font-semibold text-[#d8d0c4]">{overviewStats.totalXp.toLocaleString()}</p>
              </div>
              <div className="bg-[#111620] border border-[#252c3a] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-[#1c2230] text-[#c8a040]">
                    <FaAward className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-[#706858]">Avg level</span>
                </div>
                <p className="text-2xl font-semibold text-[#d8d0c4]">{overviewStats.avgLevel}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111620] border border-[#252c3a] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#d8d0c4] mb-3 flex items-center gap-2">
                  <FaBolt className="text-[#c8a040]" /> Platform activity
                </h3>
                <p className="text-[#706858] text-[13px]">
                  <span className="text-[#d8d0c4] font-medium">{overviewStats.totalCompleted}</span> modules completed across all users
                </p>
              </div>
              <div className="bg-[#111620] border border-[#252c3a] rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#d8d0c4] mb-3 flex items-center gap-2">
                  <FaCalendarAlt className="text-[#4e9a8e]" /> Recent signups (last 7 days)
                </h3>
                {overviewStats.recentSignups.length === 0 ? (
                  <p className="text-[#706858] text-[13px]">No signups in the last 7 days.</p>
                ) : (
                  <ul className="space-y-2">
                    {overviewStats.recentSignups.map((u) => (
                      <li key={u.id} className="flex items-center justify-between text-[13px]">
                        <span className="text-[#d8d0c4]">{u.name}</span>
                        <span className="text-[#706858]">{u.email}</span>
                        <span className="text-[#585048] text-[12px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : tab === "users" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706858] text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                  />
                </div>
                <select
                  value={userFilterPath}
                  onChange={(e) => setUserFilterPath(e.target.value)}
                  className="px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                >
                  <option value="">All paths</option>
                  {LEARNING_PATHS.map((path) => (
                    <option key={path} value={path}>
                      {path}
                    </option>
                  ))}
                </select>
                <select
                  value={userPageSize}
                  onChange={(e) => { setUserPageSize(Number(e.target.value)); setUserPage(1); }}
                  className="px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <button
                onClick={exportUsersCSV}
                className="flex items-center gap-2 px-4 py-2 bg-[#1c2230] border border-[#2e3648] text-[#d8d0c4] text-[13px] font-medium hover:bg-[#242c3c] rounded-xl transition-colors"
              >
                <FaFileExport /> Export CSV
              </button>
            </div>
            <div className="bg-[#111620] border border-[#252c3a] overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#252c3a] bg-[#0d1017]">
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleUserSort("name")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Name {userSortBy === "name" ? (userSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleUserSort("email")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Email {userSortBy === "email" ? (userSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleUserSort("level")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Level {userSortBy === "level" ? (userSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleUserSort("totalPoints")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          XP {userSortBy === "totalPoints" ? (userSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Completed</th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleUserSort("learningPath")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Path {userSortBy === "learningPath" ? (userSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Role</th>
                      <th className="text-right py-3 px-4 font-medium text-[#706858]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#1c2230] hover:bg-[#161c28]">
                        <td className="py-3 px-4 text-[#d8d0c4]">{u.name}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{u.email}</td>
                        <td className="py-3 px-4 text-[#9a9080]">Lv.{u.level ?? 1}</td>
                        <td className="py-3 px-4 text-[#c8a040]">{u.totalPoints ?? 0}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{u.completedModules?.length ?? 0}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{u.learningPath || "none"}</td>
                        <td className="py-3 px-4">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#c8a040]/10 text-[#c8a040] border border-[#c8a040]/30">
                              <FaShieldAlt className="text-[10px]" /> Admin
                            </span>
                          ) : (
                            <span className="text-[#3a4258]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                        {u.isAdmin ? (
                          <button
                            onClick={() => handleRevokeAdmin(u)}
                            disabled={u.id === user?.id || adminActionUserId === u.id}
                            className="p-2 text-[#706858] hover:text-[#c04848] hover:bg-[#1c2230] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Revoke admin"
                          >
                            <FaUserMinus />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGrantAdmin(u)}
                            disabled={adminActionUserId === u.id}
                            className="p-2 text-[#706858] hover:text-[#c8a040] hover:bg-[#1c2230] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Make admin"
                          >
                            <FaUserPlus />
                          </button>
                        )}
                        <button
                          onClick={() => setGrantModal({ userId: u.id, userName: u.name, achievementId: null })}
                          className="p-2 text-[#706858] hover:text-[#c8a040] hover:bg-[#1c2230] rounded-lg transition-colors"
                          title="Grant achievement"
                        >
                          <FaAward />
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-2 text-[#706858] hover:text-white hover:bg-[#1c2230] rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === user?.id}
                          className="p-2 text-[#706858] hover:text-[#c04848] hover:bg-[#1c2230] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            {totalUserPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-[#706858] text-[13px]">
                  Showing {(userPage - 1) * userPageSize + 1}–{Math.min(userPage * userPageSize, filteredUsers.length)} of {filteredUsers.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-[#252c3a] bg-[#161c28] text-[#d8d0c4] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-[#9a9080] text-[13px]">
                    Page {userPage} of {totalUserPages}
                  </span>
                  <button
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={userPage >= totalUserPages}
                    className="px-3 py-1.5 rounded-lg border border-[#252c3a] bg-[#161c28] text-[#d8d0c4] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : tab === "achievements" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706858] text-sm" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={achievementSearch}
                  onChange={(e) => setAchievementSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                />
              </div>
            </div>
            <div className="bg-[#111620] border border-[#252c3a] overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#252c3a] bg-[#0d1017]">
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Points</th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Earned by</th>
                      <th className="text-right py-3 px-4 font-medium text-[#706858]">Grant to user</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAchievements.map((a) => (
                      <tr key={a.id} className="border-b border-[#1c2230] hover:bg-[#161c28]">
                        <td className="py-3 px-4 text-[#d8d0c4] font-medium">{a.name}</td>
                        <td className="py-3 px-4 text-[#9a9080] max-w-[200px] truncate">{a.description}</td>
                        <td className="py-3 px-4 text-[#c8a040]">+{a.points ?? 0}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{a.category || "—"}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{achievementEarnedCount[a.id] ?? 0} users</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setGrantModal({ userId: null, userName: null, achievementId: a.id, achievementName: a.name })}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-[#4e9a8e]/10 text-[#4e9a8e] border border-[#4e9a8e]/30 hover:bg-[#4e9a8e]/20"
                          >
                            Grant to user
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredAchievements.length === 0 && (
              <p className="text-[#706858] text-[13px] py-4 text-center">No achievements match your search.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#706858] text-sm" />
                  <input
                    type="text"
                    placeholder="Search by title, category..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                  />
                </div>
                <select
                  value={moduleFilterCategory}
                  onChange={(e) => setModuleFilterCategory(e.target.value)}
                  className="px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                >
                  <option value="">All categories</option>
                  {MODULE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <select
                  value={moduleFilterDifficulty}
                  onChange={(e) => setModuleFilterDifficulty(e.target.value)}
                  className="px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                >
                  <option value="">All difficulties</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => openEditModule(null)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1c2230] border border-[#2e3648] text-[#d8d0c4] text-[13px] font-medium hover:bg-[#242c3c] rounded-xl transition-colors"
              >
                <FaPlus />
                Add module
              </button>
            </div>
            <div className="bg-[#111620] border border-[#252c3a] overflow-hidden rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#252c3a] bg-[#0d1017]">
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleModuleSort("title")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Title {moduleSortBy === "title" ? (moduleSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleModuleSort("category")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Category {moduleSortBy === "category" ? (moduleSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleModuleSort("difficulty")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Difficulty {moduleSortBy === "difficulty" ? (moduleSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-[#706858]">
                        <button type="button" onClick={() => toggleModuleSort("order")} className="flex items-center gap-1 hover:text-[#d8d0c4]">
                          Order {moduleSortBy === "order" ? (moduleSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-[#706858]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModules.map((m) => (
                      <tr key={m._id} className="border-b border-[#1c2230] hover:bg-[#161c28]">
                        <td className="py-3 px-4 text-[#d8d0c4] font-medium">{m.title}</td>
                        <td className="py-3 px-4 text-[#9a9080] max-w-[220px] truncate" title={m.description}>{m.description || "—"}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{m.category}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{m.difficulty || "—"}</td>
                        <td className="py-3 px-4 text-[#9a9080]">{m.order ?? 0}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditModule(m)}
                            className="p-2 text-[#706858] hover:text-white hover:bg-[#1c2230] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(m)}
                            className="p-2 text-[#706858] hover:text-[#c04848] hover:bg-[#1c2230] rounded-lg transition-colors"
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
        )}
      </div>

      {/* User edit modal */}
      {userModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => closeUserModal()}
          role="presentation"
        >
          <div
            className="bg-[#111620] border border-[#252c3a] rounded-2xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-[#d8d0c4] mb-4">Edit user</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#706858] mb-1">Name</label>
                <input
                  type="text"
                  value={userModal.name}
                  onChange={(e) => setUserModal((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#706858] mb-1">Email</label>
                <input
                  type="email"
                  value={userModal.email}
                  onChange={(e) => setUserModal((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#706858] mb-1">Learning path</label>
                <select
                  value={userModal.learningPath}
                  onChange={(e) => setUserModal((p) => ({ ...p, learningPath: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
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
                  className="rounded border-[#252c3a] bg-[#161c28] text-[#4e9a8e]"
                />
                <label htmlFor="gameStudio" className="text-[13px] text-[#9a9080]">
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
                  className="rounded border-[#252c3a] bg-[#161c28] text-[#4e9a8e]"
                />
                <label htmlFor="knowsJs" className="text-[13px] text-[#9a9080]">
                  Knows JavaScript
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => closeUserModal()}
                className="px-4 py-2 text-[13px] font-medium text-[#9a9080] hover:text-white hover:bg-[#1c2230] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="px-4 py-2 bg-[#1c2230] border border-[#2e3648] text-[#d8d0c4] text-[13px] font-medium hover:bg-[#242c3c] rounded-xl transition-colors disabled:opacity-50"
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
            className="bg-[#111620] border border-[#252c3a] rounded-2xl w-full max-w-2xl p-6 shadow-xl my-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-[#d8d0c4] mb-4">
              {moduleModal.id ? "Edit module" : "Add module"}
            </h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-[11px] font-medium text-[#706858] mb-1">Title</label>
                <input
                  type="text"
                  value={moduleModal.title}
                  onChange={(e) => setModuleModal((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#706858] mb-1">Description</label>
                <input
                  type="text"
                  value={moduleModal.description}
                  onChange={(e) => setModuleModal((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-[#706858] mb-1">Category</label>
                  <select
                    value={moduleModal.category}
                    onChange={(e) => setModuleModal((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                  >
                    {MODULE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#706858] mb-1">Difficulty</label>
                  <select
                    value={moduleModal.difficulty}
                    onChange={(e) => setModuleModal((p) => ({ ...p, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#706858] mb-1">Order</label>
                <input
                  type="number"
                  value={moduleModal.order}
                  onChange={(e) => setModuleModal((p) => ({ ...p, order: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#706858] mb-1">Content (markdown)</label>
                <textarea
                  value={moduleModal.content}
                  onChange={(e) => setModuleModal((p) => ({ ...p, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258] font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => closeModuleModal()}
                className="px-4 py-2 text-[13px] font-medium text-[#9a9080] hover:text-white hover:bg-[#1c2230] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModule}
                disabled={saving || !moduleModal.title?.trim()}
                className="px-4 py-2 bg-[#1c2230] border border-[#2e3648] text-[#d8d0c4] text-[13px] font-medium hover:bg-[#242c3c] rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant achievement modal */}
      {grantModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={() => setGrantModal(null)}
          role="presentation"
        >
          <div
            className="bg-[#111620] border border-[#252c3a] rounded-2xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-[#d8d0c4] mb-4 flex items-center gap-2">
              <FaAward className="text-[#c8a040]" /> Grant achievement
            </h3>
            {grantModal.userId ? (
              <>
                <p className="text-[#9a9080] text-[13px] mb-3">
                  Grant an achievement to <span className="text-[#d8d0c4] font-medium">{grantModal.userName}</span>
                </p>
                <div>
                  <label className="block text-[11px] font-medium text-[#706858] mb-1">Achievement</label>
                  <select
                    value={grantModal.achievementId != null ? grantModal.achievementId : ""}
                    onChange={(e) => setGrantModal((p) => ({ ...p, achievementId: e.target.value === "" ? null : Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                  >
                    <option value="">Select achievement</option>
                    {achievements.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (+{a.points} XP)</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <p className="text-[#9a9080] text-[13px] mb-3">
                  Grant <span className="text-[#d8d0c4] font-medium">{grantModal.achievementName}</span> to a user
                </p>
                <div>
                  <label className="block text-[11px] font-medium text-[#706858] mb-1">User</label>
                  <select
                    value={grantModal.userId != null ? grantModal.userId : ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setGrantModal((p) => ({ ...p, userId: null, userName: null }));
                        return;
                      }
                      const u = users.find((x) => x.id === id);
                      setGrantModal((p) => ({ ...p, userId: id, userName: u?.name || "" }));
                    }}
                    className="w-full px-3 py-2 bg-[#161c28] border border-[#252c3a] text-[#d8d0c4] text-[13px] rounded-xl focus:outline-none focus:border-[#3a4258]"
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setGrantModal(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#9a9080] hover:text-white hover:bg-[#1c2230] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantAchievement}
                disabled={grantSaving || !grantModal.userId || grantModal.achievementId == null}
                className="px-4 py-2 bg-[#4e9a8e]/20 border border-[#4e9a8e]/40 text-[#4e9a8e] text-[13px] font-medium hover:bg-[#4e9a8e]/30 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {grantSaving ? "Granting..." : "Grant"}
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
