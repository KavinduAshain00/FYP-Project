import axios from "axios";

// ─── Config ─────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

const AVATARS_CACHE_KEY = "gamilearn_avatars";
const AVATARS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const ACHIEVEMENTS_CACHE_KEY = "gamilearn_achievements";
const ACHIEVEMENTS_CATALOG_CACHE_KEY = "gamilearn_achievements_catalog";
const ACHIEVEMENTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

/**
 * Short message for people using the app when a request fails (slow network, offline, etc.).
 * When the server sends its own message, that is shown instead.
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

// ─── Interceptors ────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error("Request failed:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  },
);

// ─── Client-side cache invalidation ──────────────────────────────────────────
export function invalidateAvatarsCache() {
  try {
    localStorage.removeItem(AVATARS_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function invalidateAchievementsCache() {
  try {
    localStorage.removeItem(ACHIEVEMENTS_CACHE_KEY);
    localStorage.removeItem(ACHIEVEMENTS_CATALOG_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/** Clears avatars + achievements local caches (e.g. after XP or profile changes). */
export function invalidateUserCaches() {
  invalidateAchievementsCache();
  invalidateAvatarsCache();
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  signupPrecheck: (data) => api.post("/auth/signup-precheck", data),
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
};

// ─── User profile, dashboard, lesson progress ─────────────────────────────────
export const userAPI = {
  getProfile: (config = {}) => api.get("/user/profile", config),
  getDashboard: () => api.get("/user/dashboard"),

  /** Picture choices; cached until sign-out or level change (see invalidateAvatarsCache). */
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

  updateProfile: (payload) => api.put("/user/profile", payload),
  changePassword: (currentPassword, newPassword) =>
    api.put("/user/password", { currentPassword, newPassword }),
  completeModule: (moduleId, sessionStats = {}) =>
    api.put("/user/module/complete", { moduleId, sessionStats }),
  /** @param {string} moduleId @param {object} [extra] - { currentStepIndex?, stepsVerified? } */
  setCurrentModule: (moduleId, extra = {}) =>
    api.put("/user/module/current", { moduleId, ...extra }),
  getModuleStepProgress: (moduleId) =>
    api.get(`/user/module/step-progress/${encodeURIComponent(moduleId)}`),
};

// ─── Modules (catalog + CRUD for staff) ──────────────────────────────────────
export const modulesAPI = {
  getAll: (category, params = {}) =>
    api.get("/modules", {
      params: { ...(category ? { category } : {}), ...params },
    }),
  getById: (id) => api.get(`/modules/${id}`),
  create: (data) => api.post("/modules", data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
};

// ─── Tutor (hints, verify, MCQ, lecture notes) ───────────────────────────────
export const tutorAPI = {
  ask: (message, context) => api.post("/tutor", { message, context }),
  verifyStep: (payload) => api.post("/tutor/verify", payload),
  generateMCQs: (payload) => api.post("/tutor/mcq/generate", payload),
  verifyMCQ: (payload) => api.post("/tutor/mcq/verify", payload),
  explainCode: (code, language) =>
    api.post("/tutor/explain-code", { code, language }),
  explainError: (errorMessage, codeSnippet, language) =>
    api.post("/tutor/explain-error", {
      errorMessage,
      codeSnippet: codeSnippet || "",
      language: language || "javascript",
    }),
  generateLectureNotes: (payload) => api.post("/tutor/lecture-notes", payload),
};

// ─── Achievements ─────────────────────────────────────────────────────────────
export const achievementsAPI = {
  /** Full catalog (cached); staff list uses this too. */
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

  /** Current user’s badges (cached + ETag). */
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

  earnAchievement: (achievementId) =>
    api.post("/achievements/earn", { achievementId }),
  getStats: () => api.get("/achievements/stats"),
  checkAchievements: (progressData) =>
    api.post("/achievements/check", progressData),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers: (params = {}) => api.get("/admin/users", { params }),
  getStats: () => api.get("/admin/stats"),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  grantAchievement: (userId, achievementId) =>
    api.post(`/admin/users/${userId}/achievements`, { achievementId }),
  revokeAchievement: (userId, achievementId) =>
    api.delete(`/admin/users/${userId}/achievements/${achievementId}`),
  grantAdmin: (userId) => api.post(`/admin/users/${userId}/grant-admin`),
  revokeAdmin: (userId) => api.delete(`/admin/users/${userId}/revoke-admin`),
  generateModuleSteps: (body) =>
    api.post("/admin/modules/generate-steps", body),
  generateModuleCurriculum: (body) =>
    api.post("/admin/modules/generate-curriculum", body),
};

export default api;
