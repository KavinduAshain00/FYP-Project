import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  FaCalendarAlt,
  FaBolt,
  FaUserPlus,
  FaUserMinus,
  FaAward,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useShellPagesCache } from "../context/shellPagesCacheContext";
import { adminAPI, modulesAPI, achievementsAPI } from "../api/api";
import { PageHeader } from "../components/layout/GameLayout";
import ConfirmModal from "../components/ui/ConfirmModal";
import LoadingScreen from "../components/ui/LoadingScreen";
import { MODULE_CATEGORIES, DIFFICULTIES } from "./admin/moduleEditorUtils";

const LEARNING_PATHS = ["none", "javascript-basics", "advanced"];

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { peek, put } = useShellPagesCache();
  const savedAdmin = peek("admin");
  const hydratedAdmin = !!savedAdmin?.hydrated;

  const [tab, setTab] = useState(() => savedAdmin?.tab ?? "overview");
  const [users, setUsers] = useState(() => savedAdmin?.users ?? []);
  const [modules, setModules] = useState(() => savedAdmin?.modules ?? []);
  const [achievements, setAchievements] = useState(
    () => savedAdmin?.achievements ?? [],
  );
  const [loading, setLoading] = useState(() => !hydratedAdmin);
  const [userModal, setUserModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState(
    () => savedAdmin?.userSearch ?? "",
  );
  const [moduleSearch, setModuleSearch] = useState(
    () => savedAdmin?.moduleSearch ?? "",
  );
  const [userFilterPath, setUserFilterPath] = useState(
    () => savedAdmin?.userFilterPath ?? "",
  );
  const [moduleFilterCategory, setModuleFilterCategory] = useState(
    () => savedAdmin?.moduleFilterCategory ?? "",
  );
  const [moduleFilterDifficulty, setModuleFilterDifficulty] = useState(
    () => savedAdmin?.moduleFilterDifficulty ?? "",
  );
  const [userSortBy, setUserSortBy] = useState(
    () => savedAdmin?.userSortBy ?? "createdAt",
  );
  const [userSortOrder, setUserSortOrder] = useState(
    () => savedAdmin?.userSortOrder ?? "desc",
  );
  const [userPage, setUserPage] = useState(() => savedAdmin?.userPage ?? 1);
  const [userPageSize, setUserPageSize] = useState(
    () => savedAdmin?.userPageSize ?? 10,
  );
  const [userPagination, setUserPagination] = useState(
    () =>
      savedAdmin?.userPagination ?? {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
  );
  const [stats, setStats] = useState(
    () =>
      savedAdmin?.stats ?? {
        totalUsers: 0,
        totalXp: 0,
        totalCompleted: 0,
        avgLevel: 0,
        recentSignups: [],
      },
  );
  const [moduleSortBy, setModuleSortBy] = useState(
    () => savedAdmin?.moduleSortBy ?? "order",
  );
  const [moduleSortOrder, setModuleSortOrder] = useState(
    () => savedAdmin?.moduleSortOrder ?? "asc",
  );
  const [modulePage, setModulePage] = useState(
    () => savedAdmin?.modulePage ?? 1,
  );
  const [achievementSearch, setAchievementSearch] = useState(
    () => savedAdmin?.achievementSearch ?? "",
  );
  const MODULE_PAGE_SIZE = 10;
  const [adminActionUserId, setAdminActionUserId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const initialUserModalRef = useRef(null);
  const skipBootstrapLoad = useRef(hydratedAdmin);
  const skipUsersFetchOnce = useRef(hydratedAdmin);

  const adminSnapshotRef = useRef({});
  adminSnapshotRef.current = {
    hydrated: true,
    tab,
    users,
    modules,
    achievements,
    loading,
    userSearch,
    moduleSearch,
    userFilterPath,
    moduleFilterCategory,
    moduleFilterDifficulty,
    userSortBy,
    userSortOrder,
    userPage,
    userPageSize,
    userPagination,
    stats,
    moduleSortBy,
    moduleSortOrder,
    modulePage,
    achievementSearch,
  };
  useEffect(() => () => put("admin", adminSnapshotRef.current), [put]);

  const loadUsers = async (page = userPage) => {
    try {
      const res = await adminAPI.getUsers({
        page,
        limit: userPageSize,
        search: userSearch.trim() || undefined,
        learningPath: userFilterPath || undefined,
        sortBy: userSortBy,
        sortOrder: userSortOrder,
      });
      setUsers(res.data.users || []);
      if (res.data.pagination) setUserPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users");
    }
  };

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(
        res.data || {
          totalUsers: 0,
          totalXp: 0,
          totalCompleted: 0,
          avgLevel: 0,
          recentSignups: [],
        },
      );
    } catch {
      setStats({
        totalUsers: 0,
        totalXp: 0,
        totalCompleted: 0,
        avgLevel: 0,
        recentSignups: [],
      });
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
    if (skipBootstrapLoad.current) {
      skipBootstrapLoad.current = false;
      return;
    }
    const load = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadModules(), loadAchievements()]);
      setLoading(false);
    };
    load();
  }, []);

  // loadUsers intentionally depends on multiple pieces of component state, so it is not stable.
  // We keep the effect dependency list focused on those inputs and suppress the lint warning here.
  useEffect(() => {
    if (skipUsersFetchOnce.current) {
      skipUsersFetchOnce.current = false;
      return;
    }
    loadUsers(userPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userPage,
    userSearch,
    userFilterPath,
    userSortBy,
    userSortOrder,
    userPageSize,
  ]);

  const handleSaveUser = async () => {
    if (!userModal?.id) return;
    setSaving(true);
    try {
      await adminAPI.updateUser(userModal.id, {
        name: userModal.name,
        email: userModal.email,
        learningPath: userModal.learningPath,
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
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? res.data?.user
              ? { ...x, ...res.data.user }
              : { ...x, isAdmin: true }
            : x,
        ),
      );
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
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? res.data?.user
              ? { ...x, ...res.data.user }
              : { ...x, isAdmin: false }
            : x,
        ),
      );
      toast.success(`Admin revoked from ${u.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke admin");
    } finally {
      setAdminActionUserId(null);
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
      userModal.knowsJavaScript !== a.knowsJavaScript
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

  const openEditUser = (u) => {
    const data = {
      id: u.id,
      name: u.name,
      email: u.email,
      learningPath: u.learningPath || "none",
      knowsJavaScript: u.knowsJavaScript ?? false,
    };
    initialUserModalRef.current = { ...data };
    setUserModal(data);
  };

  const totalUserPages = Math.max(1, userPagination.totalPages || 1);
  const overviewStats = {
    totalXp: stats.totalXp ?? 0,
    totalCompleted: stats.totalCompleted ?? 0,
    avgLevel: stats.avgLevel ?? 0,
    recentSignups: stats.recentSignups || [],
  };

  const achievementEarnedCount = useMemo(() => {
    const map = {};
    achievements.forEach((a) => {
      map[a.id] = users.filter((u) =>
        u.earnedAchievements?.includes(a.id),
      ).length;
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
        (a.category || "").toLowerCase().includes(q),
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
          (m.description || "").toLowerCase().includes(q),
      );
    }
    if (moduleFilterCategory) {
      list = list.filter((m) => (m.category || "") === moduleFilterCategory);
    }
    if (moduleFilterDifficulty) {
      list = list.filter(
        (m) => (m.difficulty || "") === moduleFilterDifficulty,
      );
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
  }, [
    modules,
    moduleSearch,
    moduleFilterCategory,
    moduleFilterDifficulty,
    moduleSortBy,
    moduleSortOrder,
  ]);

  const totalModulePages = Math.max(
    1,
    Math.ceil(filteredModules.length / MODULE_PAGE_SIZE),
  );
  const paginatedModulesForAdmin = useMemo(() => {
    const start = (modulePage - 1) * MODULE_PAGE_SIZE;
    return filteredModules.slice(start, start + MODULE_PAGE_SIZE);
  }, [filteredModules, modulePage]);

  const exportUsersCSV = async () => {
    const headers = [
      "Name",
      "Email",
      "Level",
      "XP",
      "Completed",
      "Path",
      "Role",
    ];
    const res = await adminAPI
      .getUsers({ page: 1, limit: 10000 })
      .catch(() => ({ data: { users: [] } }));
    const allUsers = res.data.users || [];
    const rows = allUsers.map((u) => [
      u.name || "",
      u.email || "",
      u.level ?? 1,
      u.totalPoints ?? 0,
      u.completedModules?.length ?? 0,
      u.learningPath || "none",
      u.isAdmin ? "Admin" : "User",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
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
    setUserPage(1);
    if (userSortBy === key)
      setUserSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else setUserSortBy(key);
  };

  const toggleModuleSort = (key) => {
    if (moduleSortBy === key)
      setModuleSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else setModuleSortBy(key);
  };

  return (
    <>
      <PageHeader
        title="Admin"
        subtitle="Users, content, and achievements - all in one place"
        icon={FaShieldAlt}
        badge="Admin"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-blue-50">
        <p className="text-sm text-blue-300 mb-3">
          Pick a tab to work in. Search and filters stay where you left them
          while you move between these pages.
        </p>
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-blue-900 shadow-lg shadow-black/30 mb-8 max-w-3xl">
          {[
            { id: "overview", label: "Overview", icon: FaChartBar },
            { id: "users", label: "Users", icon: FaUsers },
            { id: "modules", label: "Modules", icon: FaLayerGroup },
            { id: "achievements", label: "Achievements", icon: FaTrophy },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                tab === id
                  ? "bg-blue-500 text-black shadow-md shadow-black/25"
                  : "text-blue-200 hover:text-blue-50 hover:bg-blue-800"
              }`}
            >
              <Icon className="text-sm" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingScreen
            message="Loading admin tools"
            subMessage="Gathering platform stats, users, and content"
            inline
          />
        ) : tab === "overview" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-900 rounded-2xl p-6 shadow-lg shadow-black/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-blue-700 text-blue-200">
                    <FaUsers className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-blue-300">
                    Total users
                  </span>
                </div>
                <p className="text-2xl font-semibold text-blue-50">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="bg-blue-900 rounded-2xl p-6 shadow-lg shadow-black/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-blue-700 text-blue-200">
                    <FaLayerGroup className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-blue-300">
                    Total modules
                  </span>
                </div>
                <p className="text-2xl font-semibold text-blue-50">
                  {modules.length}
                </p>
              </div>
              <div className="bg-blue-900 rounded-2xl p-6 shadow-lg shadow-black/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-blue-700 text-black">
                    <FaTrophy className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-blue-300">
                    Achievements
                  </span>
                </div>
                <p className="text-2xl font-semibold text-blue-50">
                  {achievements.length}
                </p>
              </div>
              <div className="bg-blue-900 rounded-2xl p-6 shadow-lg shadow-black/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-blue-700 text-blue-200">
                    <FaBolt className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-blue-300">
                    Total XP
                  </span>
                </div>
                <p className="text-2xl font-semibold text-blue-50">
                  {overviewStats.totalXp.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-900 rounded-2xl p-6 shadow-lg shadow-black/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-blue-700 text-black">
                    <FaAward className="text-xl" />
                  </div>
                  <span className="text-[13px] font-medium text-blue-300">
                    Avg level
                  </span>
                </div>
                <p className="text-2xl font-semibold text-blue-50">
                  {overviewStats.avgLevel}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-blue-900 rounded-2xl p-6 shadow-lg shadow-black/30">
                <h3 className="text-sm font-semibold text-blue-50 mb-3 flex items-center gap-2">
                  <FaBolt className="text-blue-50" /> Platform activity
                </h3>
                <p className="text-blue-300 text-[13px]">
                  <span className="text-blue-50 font-medium">
                    {overviewStats.totalCompleted}
                  </span>{" "}
                  modules completed across all users
                </p>
              </div>
              <div className="bg-blue-900 rounded-2xl p-6 shadow-lg shadow-black/30">
                <h3 className="text-sm font-semibold text-blue-50 mb-3 flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-400" /> Recent signups
                  (last 7 days)
                </h3>
                {overviewStats.recentSignups.length === 0 ? (
                  <p className="text-blue-300 text-[13px]">
                    No signups in the last 7 days.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {overviewStats.recentSignups.map((u) => (
                      <li
                        key={u._id || u.id || u.email}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-blue-50">{u.name}</span>
                        <span className="text-blue-300">{u.email}</span>
                        <span className="text-blue-300 text-[12px]">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : ""}
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
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                  />
                </div>
                <select
                  value={userFilterPath}
                  onChange={(e) => {
                    setUserFilterPath(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
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
                  onChange={(e) => {
                    setUserPageSize(Number(e.target.value));
                    setUserPage(1);
                  }}
                  className="px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <button
                onClick={exportUsersCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-black text-[13px] font-semibold hover:bg-blue-600 rounded-xl transition-colors"
              >
                <FaFileExport /> Export CSV
              </button>
            </div>
            <div className="bg-blue-900 overflow-hidden rounded-2xl shadow-xl shadow-black/35">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-blue-900">
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleUserSort("name")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Name{" "}
                          {userSortBy === "name" ? (
                            userSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleUserSort("email")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Email{" "}
                          {userSortBy === "email" ? (
                            userSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleUserSort("level")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Level{" "}
                          {userSortBy === "level" ? (
                            userSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleUserSort("totalPoints")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          XP{" "}
                          {userSortBy === "totalPoints" ? (
                            userSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Completed
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleUserSort("learningPath")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Path{" "}
                          {userSortBy === "learningPath" ? (
                            userSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Role
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-blue-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="even:bg-blue-900/50 hover:bg-blue-800 transition-colors"
                      >
                        <td className="py-3 px-4 text-blue-50">{u.name}</td>
                        <td className="py-3 px-4 text-blue-300">{u.email}</td>
                        <td className="py-3 px-4 text-blue-300">
                          Lv.{u.level ?? 1}
                        </td>
                        <td className="py-3 px-4 text-blue-50">
                          {u.totalPoints ?? 0}
                        </td>
                        <td className="py-3 px-4 text-blue-300">
                          {u.completedModules?.length ?? 0}
                        </td>
                        <td className="py-3 px-4 text-blue-300">
                          {u.learningPath || "none"}
                        </td>
                        <td className="py-3 px-4">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-800 text-blue-50">
                              <FaShieldAlt className="text-[10px]" /> Admin
                            </span>
                          ) : (
                            <span className="text-blue-700">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.isAdmin ? (
                            <button
                              onClick={() => handleRevokeAdmin(u)}
                              disabled={
                                u.id === user?.id || adminActionUserId === u.id
                              }
                              className="p-2 text-blue-300 hover:text-blue-200 hover:bg-blue-700 rounded-xl transition-colors disabled:text-blue-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                              title="Revoke admin"
                            >
                              <FaUserMinus />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGrantAdmin(u)}
                              disabled={adminActionUserId === u.id}
                              className="p-2 text-blue-300 hover:text-blue-50 hover:bg-blue-700 rounded-xl transition-colors disabled:text-blue-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                              title="Make admin"
                            >
                              <FaUserPlus />
                            </button>
                          )}
                          <button
                            onClick={() => openEditUser(u)}
                            className="p-2 text-blue-300 hover:text-blue-50 hover:bg-blue-700 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === user?.id}
                            className="p-2 text-blue-300 hover:text-blue-200 hover:bg-blue-700 rounded-xl transition-colors disabled:text-blue-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
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
                <p className="text-blue-300 text-[13px]">
                  Showing {(userPage - 1) * userPageSize + 1}–
                  {Math.min(userPage * userPageSize, userPagination.total)} of{" "}
                  {userPagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage <= 1}
                    className="px-4 py-2 rounded-xl bg-blue-700 text-black text-[13px] font-semibold hover:bg-blue-600 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed disabled:hover:bg-blue-900"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-blue-300 text-[13px]">
                    Page {userPage} of {totalUserPages}
                  </span>
                  <button
                    onClick={() =>
                      setUserPage((p) => Math.min(totalUserPages, p + 1))
                    }
                    disabled={userPage >= totalUserPages}
                    className="px-4 py-2 rounded-xl bg-blue-700 text-black text-[13px] font-semibold hover:bg-blue-600 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed disabled:hover:bg-blue-900"
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
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                <input
                  type="text"
                  placeholder="Search achievements..."
                  value={achievementSearch}
                  onChange={(e) => setAchievementSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                />
              </div>
            </div>
            <div className="bg-blue-900 overflow-hidden rounded-2xl shadow-xl shadow-black/35">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-blue-900">
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Points
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Earned by
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAchievements.map((a) => (
                      <tr
                        key={a.id}
                        className="even:bg-blue-900/50 hover:bg-blue-800 transition-colors"
                      >
                        <td className="py-3 px-4 text-blue-50 font-medium">
                          {a.name}
                        </td>
                        <td className="py-3 px-4 text-blue-300 max-w-[200px] truncate">
                          {a.description}
                        </td>
                        <td className="py-3 px-4 text-blue-50">
                          +{a.points ?? 0}
                        </td>
                        <td className="py-3 px-4 text-blue-300">
                          {a.category || "-"}
                        </td>
                        <td className="py-3 px-4 text-blue-300">
                          {achievementEarnedCount[a.id] ?? 0} users
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredAchievements.length === 0 && (
              <p className="text-blue-300 text-[13px] py-4 text-center">
                No achievements match your search.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by title, category..."
                    value={moduleSearch}
                    onChange={(e) => {
                      setModuleSearch(e.target.value);
                      setModulePage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                  />
                </div>
                <select
                  value={moduleFilterCategory}
                  onChange={(e) => {
                    setModuleFilterCategory(e.target.value);
                    setModulePage(1);
                  }}
                  className="px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
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
                  onChange={(e) => {
                    setModuleFilterDifficulty(e.target.value);
                    setModulePage(1);
                  }}
                  className="px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
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
                type="button"
                onClick={() => navigate("/admin/modules/new")}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-black text-[13px] font-semibold hover:bg-blue-600 rounded-xl transition-colors"
              >
                <FaPlus />
                Add module
              </button>
            </div>
            <div className="bg-blue-900 overflow-hidden rounded-2xl shadow-xl shadow-black/35">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-blue-900">
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleModuleSort("title")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Title{" "}
                          {moduleSortBy === "title" ? (
                            moduleSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        Description
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleModuleSort("category")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Category{" "}
                          {moduleSortBy === "category" ? (
                            moduleSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleModuleSort("difficulty")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Difficulty{" "}
                          {moduleSortBy === "difficulty" ? (
                            moduleSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-blue-300">
                        <button
                          type="button"
                          onClick={() => toggleModuleSort("order")}
                          className="flex items-center gap-1 hover:text-blue-50"
                        >
                          Order{" "}
                          {moduleSortBy === "order" ? (
                            moduleSortOrder === "asc" ? (
                              <FaSortUp />
                            ) : (
                              <FaSortDown />
                            )
                          ) : (
                            <FaSort className="text-blue-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-blue-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedModulesForAdmin.map((m) => (
                      <tr
                        key={m._id}
                        className="even:bg-blue-900/50 hover:bg-blue-800 transition-colors"
                      >
                        <td className="py-3 px-4 text-blue-50 font-medium">
                          {m.title}
                        </td>
                        <td
                          className="py-3 px-4 text-blue-300 max-w-[220px] truncate"
                          title={m.description}
                        >
                          {m.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-blue-300">
                          {m.category}
                        </td>
                        <td className="py-3 px-4 text-blue-300">
                          {m.difficulty || "-"}
                        </td>
                        <td className="py-3 px-4 text-blue-300">
                          {m.order ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/modules/${m._id}`)}
                            className="p-2 text-blue-300 hover:text-blue-50 hover:bg-blue-700 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(m)}
                            className="p-2 text-blue-300 hover:text-blue-200 hover:bg-blue-700 rounded-xl transition-colors"
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
              {totalModulePages > 1 && (
                <div className="mt-4 flex items-center justify-between px-4">
                  <p className="text-blue-300 text-[13px]">
                    Showing {(modulePage - 1) * MODULE_PAGE_SIZE + 1}–
                    {Math.min(
                      modulePage * MODULE_PAGE_SIZE,
                      filteredModules.length,
                    )}{" "}
                    of {filteredModules.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModulePage((p) => Math.max(1, p - 1))}
                      disabled={modulePage <= 1}
                      className="px-4 py-2 rounded-xl bg-blue-700 text-black text-[13px] font-semibold hover:bg-blue-600 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed disabled:hover:bg-blue-900"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1.5 text-blue-300 text-[13px]">
                      Page {modulePage} of {totalModulePages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setModulePage((p) => Math.min(totalModulePages, p + 1))
                      }
                      disabled={modulePage >= totalModulePages}
                      className="px-4 py-2 rounded-xl bg-blue-700 text-black text-[13px] font-semibold hover:bg-blue-600 disabled:bg-blue-900 disabled:text-blue-400 disabled:cursor-not-allowed disabled:hover:bg-blue-900"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User edit modal */}
      {userModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/75 backdrop-blur-sm"
          onClick={() => closeUserModal()}
          role="presentation"
        >
          <div
            className="bg-blue-900 rounded-3xl w-full max-w-md p-6 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-blue-50 mb-4">Edit user</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-blue-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={userModal.name}
                  onChange={(e) =>
                    setUserModal((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-blue-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userModal.email}
                  onChange={(e) =>
                    setUserModal((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-blue-300 mb-1">
                  Learning path
                </label>
                <select
                  value={userModal.learningPath}
                  onChange={(e) =>
                    setUserModal((p) => ({
                      ...p,
                      learningPath: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 bg-blue-800 text-blue-50 text-[13px] rounded-xl focus:outline-none focus:outline focus:outline-2 focus:outline-blue-400/50"
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
                  id="knowsJs"
                  checked={userModal.knowsJavaScript}
                  onChange={(e) =>
                    setUserModal((p) => ({
                      ...p,
                      knowsJavaScript: e.target.checked,
                    }))
                  }
                  className="rounded bg-blue-800 text-blue-400 accent-blue-400"
                />
                <label htmlFor="knowsJs" className="text-[13px] text-blue-300">
                  Knows JavaScript
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => closeUserModal()}
                className="px-4 py-2 text-[13px] font-semibold text-blue-300 hover:text-blue-50 hover:bg-blue-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-black text-[13px] font-semibold rounded-xl shadow-md shadow-black/25 hover:bg-blue-400 transition-all disabled:opacity-45 disabled:saturate-50 disabled:cursor-not-allowed disabled:shadow-none"
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
          if (typeof confirmModal.onConfirm === "function")
            confirmModal.onConfirm();
          setConfirmModal((p) => ({ ...p, open: false }));
        }}
        onCancel={() => setConfirmModal((p) => ({ ...p, open: false }))}
      />
    </>
  );
};

export default Admin;
