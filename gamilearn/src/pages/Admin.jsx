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
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
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
    return list;
  }, [users, userSearch, userFilterPath]);

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
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [modules, moduleSearch, moduleFilterCategory]);

  return (
    <GameLayout>
      <PageHeader
        title="Admin"
        subtitle="Manage users and modules"
        icon={FaShieldAlt}
        badge="Admin"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 border-b border-[#1f1f1f] mb-6">
          <button
            onClick={() => setTab("overview")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "overview"
                ? "border-[#a3a3a3] text-white"
                : "border-transparent text-[#737373] hover:text-[#e5e5e5]"
            }`}
          >
            <FaChartBar />
            Overview
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "users"
                ? "border-[#a3a3a3] text-white"
                : "border-transparent text-[#737373] hover:text-[#e5e5e5]"
            }`}
          >
            <FaUsers />
            Users
          </button>
          <button
            onClick={() => setTab("modules")}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "modules"
                ? "border-[#a3a3a3] text-white"
                : "border-transparent text-[#737373] hover:text-[#e5e5e5]"
            }`}
          >
            <FaLayerGroup />
            Modules
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#737373]">
            Loading...
          </div>
        ) : tab === "overview" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#1a1a1a] text-[#a3a3a3]">
                  <FaUsers className="text-xl" />
                </div>
                <span className="text-[13px] font-medium text-[#737373]">Total users</span>
              </div>
              <p className="text-2xl font-semibold text-[#e5e5e5]">{users.length}</p>
            </div>
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#1a1a1a] text-[#a3a3a3]">
                  <FaLayerGroup className="text-xl" />
                </div>
                <span className="text-[13px] font-medium text-[#737373]">Total modules</span>
              </div>
              <p className="text-2xl font-semibold text-[#e5e5e5]">{modules.length}</p>
            </div>
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#1a1a1a] text-[#a3a3a3]">
                  <FaShieldAlt className="text-xl" />
                </div>
                <span className="text-[13px] font-medium text-[#737373]">Achievements</span>
              </div>
              <p className="text-2xl font-semibold text-[#e5e5e5]">{achievements.length}</p>
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
                  <option key={path} value={path}>
                    {path}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] bg-[#0a0a0a]">
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Level</th>
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
                          disabled={u.id === user?.id}
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
        ) : (
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
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            <div className="flex justify-end">
              <button
                onClick={() => openEditModule(null)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] text-[#e5e5e5] text-[13px] font-medium hover:bg-[#262626] rounded transition-colors"
              >
                <FaPlus />
                Add module
              </button>
            </div>
            </div>
            <div className="bg-[#0c0c0c] border border-[#1f1f1f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] bg-[#0a0a0a]">
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Difficulty</th>
                      <th className="text-left py-3 px-4 font-medium text-[#737373]">Order</th>
                      <th className="text-right py-3 px-4 font-medium text-[#737373]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModules.map((m) => (
                        <tr key={m._id} className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f]">
                          <td className="py-3 px-4 text-[#e5e5e5]">{m.title}</td>
                          <td className="py-3 px-4 text-[#a3a3a3]">{m.category}</td>
                          <td className="py-3 px-4 text-[#a3a3a3]">{m.difficulty}</td>
                          <td className="py-3 px-4 text-[#a3a3a3]">{m.order ?? 0}</td>
                          <td className="py-3 px-4 text-right">
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
            className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Edit user</h3>
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
            className="bg-[#0c0c0c] border border-[#1f1f1f] rounded-lg w-full max-w-2xl p-6 shadow-xl my-8"
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
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
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
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
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
                <label className="block text-[11px] font-medium text-[#737373] mb-1">Content (markdown)</label>
                <textarea
                  value={moduleModal.content}
                  onChange={(e) => setModuleModal((p) => ({ ...p, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] text-[#e5e5e5] text-[13px] rounded focus:outline-none focus:border-[#404040] font-mono"
                />
              </div>
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
