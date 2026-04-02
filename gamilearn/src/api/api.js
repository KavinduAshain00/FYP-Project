/**
 * api.js - Axios client for backend (baseURL = VITE_API_URL, usually …/api).
 * Auth: Bearer from localStorage. Avatars/achievements: localStorage + ETag 304 where supported.
 */
import axios from "axios";

/**
 * API_URL - Vite env base (e.g. http://localhost:5000/api).
 */
const API_URL = import.meta.env.VITE_API_URL;

/** REQUEST_TIMEOUT_MS - Client abort threshold (ms). */
const REQUEST_TIMEOUT_MS = 30000;

/** AVATARS_CACHE_KEY - localStorage key for GET /user/avatars payload. */
const AVATARS_CACHE_KEY = "gamilearn_avatars";

/** AVATARS_CACHE_TTL_MS - Freshness window for avatar cache. */
const AVATARS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** ACHIEVEMENTS_CACHE_KEY - localStorage key for GET /achievements/user. */
const ACHIEVEMENTS_CACHE_KEY = "gamilearn_achievements";

/** ACHIEVEMENTS_CATALOG_CACHE_KEY - localStorage key for GET /achievements. */
const ACHIEVEMENTS_CATALOG_CACHE_KEY = "gamilearn_achievements_catalog";

/** ACHIEVEMENTS_CACHE_TTL_MS - Freshness window for achievement caches. */
const ACHIEVEMENTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

/**
 * getNetworkErrorMessage - User-facing string from axios error (timeout, offline, server message).
 */
export function getNetworkErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error) return fallback;
  if (error.code === "ERR_CANCELED" || error.name === "CanceledError")
    return fallback;
  if (error.code === "ECONNABORTED" || /timeout/i.test(error.message || "")) {
    return "This is taking longer than usual. Please try again in a moment.";
  }
  if (error.response?.data?.message) return String(error.response.data.message);
  if (!error.response) {
    return "We couldn't connect. Check your internet connection and try again.";
  }
  return fallback;
}

/**
 * Request interceptor - Attach Authorization Bearer from localStorage token.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Response interceptor - Dev-only console logging on failure.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error("Request failed:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  },
);

/**
 * invalidateAvatarsCache - Clear GET /user/avatars local cache.
 */
export function invalidateAvatarsCache() {
  try {
    localStorage.removeItem(AVATARS_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * invalidateAchievementsCache - Clear GET /achievements and /achievements/user caches.
 */
export function invalidateAchievementsCache() {
  try {
    localStorage.removeItem(ACHIEVEMENTS_CACHE_KEY);
    localStorage.removeItem(ACHIEVEMENTS_CATALOG_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * invalidateUserCaches - Avatars + achievements caches (e.g. after XP or profile change).
 */
export function invalidateUserCaches() {
  invalidateAchievementsCache();
  invalidateAvatarsCache();
}

/**
 * authAPI - POST /auth/* (signup-precheck, signup, login, password reset; server rate limited).
 */
export const authAPI = {
  /** POST /auth/signup-precheck - Validate email/password before path step. */
  signupPrecheck: (data) => api.post("/auth/signup-precheck", data),
  /** POST /auth/signup - Create account. */
  signup: (data) => api.post("/auth/signup", data),
  /** POST /auth/login - JWT session. */
  login: (data) => api.post("/auth/login", data),
  /** POST /auth/forgot-password - Reset token flow. */
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  /** POST /auth/reset-password - Apply new password with token. */
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
};

/**
 * userAPI - GET/PUT /user/* (profile, dashboard, avatars, module progress; auth).
 */
export const userAPI = {
  /** GET /user/profile - Full profile + levelInfo. */
  getProfile: (config = {}) => api.get("/user/profile", config),
  /** GET /user/dashboard - Path, modules, achievement slice. */
  getDashboard: () => api.get("/user/dashboard"),

  /**
   * GET /user/avatars - Unlock list; localStorage + If-None-Match (304).
   * Call invalidateAvatarsCache() after changes that affect unlocks.
   */
  async getAvatars() {
    let cached = null;
    try {
      const raw = localStorage.getItem(AVATARS_CACHE_KEY);
      if (raw) {
        const { data, timestamp, etag } = JSON.parse(raw);
        if (timestamp && Date.now() - timestamp < AVATARS_CACHE_TTL_MS && data)
          return { data };
        cached = { data, timestamp, etag };
      }
    } catch {
      /* ignore */
    }
    const res = await api.get("/user/avatars", {
      headers: {
        ...(cached?.etag ? { "If-None-Match": cached.etag } : {}),
      },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (res.status === 304 && cached?.data) return { data: cached.data };
    const data = res.data;
    try {
      localStorage.setItem(
        AVATARS_CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          etag: res.headers?.etag || null,
        }),
      );
    } catch {
      /* ignore */
    }
    return { data };
  },

  /** PUT /user/profile - Name, avatar, AI preferences. */
  updateProfile: (payload) => api.put("/user/profile", payload),
  /** PUT /user/password - Change password. */
  changePassword: (currentPassword, newPassword) =>
    api.put("/user/password", { currentPassword, newPassword }),
  /** PUT /user/module/complete - First completion XP; optional sessionStats for badges. */
  completeModule: (moduleId, sessionStats = {}) =>
    api.put("/user/module/complete", { moduleId, sessionStats }),
  /** PUT /user/module/current - Resume module + optional step progress. */
  setCurrentModule: (moduleId, extra = {}) =>
    api.put("/user/module/current", { moduleId, ...extra }),
  /** GET /user/module/step-progress/:moduleId - Editor checkpoints. */
  getModuleStepProgress: (moduleId) =>
    api.get(`/user/module/step-progress/${encodeURIComponent(moduleId)}`),
};

/**
 * modulesAPI - GET /modules (learners); POST|PUT|DELETE /admin/modules (staff).
 */
export const modulesAPI = {
  /** GET /modules - Catalog query params (category, difficulty, …). */
  getAll: (category, params = {}) =>
    api.get("/modules", {
      params: { ...(category ? { category } : {}), ...params },
    }),
  /** GET /modules/:id - One module. */
  getById: (id) => api.get(`/modules/${id}`),
  /** POST /admin/modules - Create (admin). */
  create: (data) => api.post("/admin/modules", data),
  /** PUT /admin/modules/:id - Update (admin). */
  update: (id, data) => api.put(`/admin/modules/${id}`, data),
  /** DELETE /admin/modules/:id - Remove (admin). */
  delete: (id) => api.delete(`/admin/modules/${id}`),
};

/**
 * tutorAPI - POST /tutor/* (verify, MCQ, explain, lecture notes; auth, server rate limited).
 */
export const tutorAPI = {
  /** POST /tutor - Chat / hints / companion. */
  ask: (message, context) => api.post("/tutor", { message, context }),
  /** POST /tutor/verify - Step check. */
  verifyStep: (payload) => api.post("/tutor/verify", payload),
  /** POST /tutor/mcq/generate - Build quiz items. */
  generateMCQs: (payload) => api.post("/tutor/mcq/generate", payload),
  /** POST /tutor/mcq/verify - Grade selection. */
  verifyMCQ: (payload) => api.post("/tutor/mcq/verify", payload),
  /** POST /tutor/explain-code - Explain snippet. */
  explainCode: (code, language) =>
    api.post("/tutor/explain-code", { code, language }),
  /** POST /tutor/explain-error - Explain runtime/syntax error. */
  explainError: (errorMessage, codeSnippet, language) =>
    api.post("/tutor/explain-error", {
      errorMessage,
      codeSnippet: codeSnippet || "",
      language: language || "javascript",
    }),
  /** POST /tutor/lecture-notes - Overview notes. */
  generateLectureNotes: (payload) => api.post("/tutor/lecture-notes", payload),
};

/**
 * achievementsAPI - GET/POST /achievements/* (catalog, user rows, check; client cache on catalog/user).
 */
export const achievementsAPI = {
  /**
   * GET /achievements - Catalog; 24h localStorage cache (no ETag).
   */
  async getAll() {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_CATALOG_CACHE_KEY);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        if (
          timestamp &&
          Date.now() - timestamp < ACHIEVEMENTS_CACHE_TTL_MS &&
          data
        ) {
          return { data };
        }
      }
    } catch {
      /* ignore */
    }
    const res = await api.get("/achievements");
    const data = res.data;
    try {
      localStorage.setItem(
        ACHIEVEMENTS_CATALOG_CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() }),
      );
    } catch {
      /* ignore */
    }
    return { data };
  },

  /**
   * GET /achievements/user - Earned flags; localStorage + If-None-Match (304).
   */
  async getUserAchievements() {
    let cached = null;
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_CACHE_KEY);
      if (raw) {
        const { data, timestamp, etag } = JSON.parse(raw);
        if (
          timestamp &&
          Date.now() - timestamp < ACHIEVEMENTS_CACHE_TTL_MS &&
          data
        ) {
          return { data };
        }
        cached = { data, timestamp, etag };
      }
    } catch {
      /* ignore */
    }
    const res = await api.get("/achievements/user", {
      headers: {
        ...(cached?.etag ? { "If-None-Match": cached.etag } : {}),
      },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (res.status === 304 && cached?.data) return { data: cached.data };
    const data = res.data;
    try {
      localStorage.setItem(
        ACHIEVEMENTS_CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          etag: res.headers?.etag || null,
        }),
      );
    } catch {
      /* ignore */
    }
    return { data };
  },

  /** POST /achievements/earn - Manual grant. */
  earnAchievement: (achievementId) =>
    api.post("/achievements/earn", { achievementId }),
  /** GET /achievements/stats - Counts for current user. */
  getStats: () => api.get("/achievements/stats"),
  /** POST /achievements/check - Rule engine + session counters. */
  checkAchievements: (progressData) =>
    api.post("/achievements/check", progressData),
};

/**
 * adminAPI - GET|POST|PUT|DELETE /admin/* (mirrors backend/routes/admin.js; staff JWT).
 */
export const adminAPI = {
  /** GET /admin/admins - Admin emails. */
  listAdmins: () => api.get("/admin/admins"),
  /** POST /admin/admins - Promote by email. */
  addAdminByEmail: (email) => api.post("/admin/admins", { email }),
  /** DELETE /admin/admins/:email - Demote (encodeURIComponent). */
  removeAdminByEmail: (email) =>
    api.delete(`/admin/admins/${encodeURIComponent(email)}`),
  /** GET /admin/stats - Platform stats. */
  getStats: () => api.get("/admin/stats"),
  /** GET /admin/users - Paginated list. */
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  /** GET /admin/users/:id - One user. */
  getUser: (id) => api.get(`/admin/users/${id}`),
  /** PUT /admin/users/:id - Update fields. */
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  /** DELETE /admin/users/:id - Remove user. */
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  /** POST /admin/users/:id/achievements - Grant badge. */
  grantAchievement: (userId, achievementId) =>
    api.post(`/admin/users/${userId}/achievements`, { achievementId }),
  /** DELETE /admin/users/:id/achievements/:achievementId - Revoke badge. */
  revokeAchievement: (userId, achievementId) =>
    api.delete(`/admin/users/${userId}/achievements/${achievementId}`),
  /** POST /admin/users/:id/grant-admin - Promote. */
  grantAdmin: (userId) => api.post(`/admin/users/${userId}/grant-admin`),
  /** DELETE /admin/users/:id/revoke-admin - Demote. */
  revokeAdmin: (userId) => api.delete(`/admin/users/${userId}/revoke-admin`),
  /** GET /admin/modules - Module list (admin). */
  listModules: (params = {}) => api.get("/admin/modules", { params }),
  /** GET /admin/modules/:id - One module. */
  getModule: (id) => api.get(`/admin/modules/${id}`),
  /** POST /admin/modules - Create. */
  createModule: (data) => api.post("/admin/modules", data),
  /** PUT /admin/modules/:id - Update. */
  updateModule: (id, data) => api.put(`/admin/modules/${id}`, data),
  /** DELETE /admin/modules/:id - Delete. */
  deleteModule: (id) => api.delete(`/admin/modules/${id}`),
  /** POST /admin/modules/generate-steps - AI steps JSON. */
  generateModuleSteps: (body) =>
    api.post("/admin/modules/generate-steps", body),
  /** POST /admin/modules/generate-curriculum - AI hints/starter. */
  generateModuleCurriculum: (body) =>
    api.post("/admin/modules/generate-curriculum", body),
};

export default api;
