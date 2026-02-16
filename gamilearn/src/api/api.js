import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_TIMEOUT = 30000; // 30s for most requests
const TUTOR_TIMEOUT = 60000;   // 60s for AI/tutor (can be slow)

const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// In-flight GET requests: same URL = same promise (deduplication)
const inFlight = new Map();

function dedupeGet(url, params = {}) {
  const hasParams = Object.keys(params).length > 0;
  const key = hasParams ? `${url}?${new URLSearchParams(params)}` : url;
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = api
    .get(url, { params: hasParams ? params : undefined })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Central error handling: 401 → logout + redirect; log others in dev only
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
        window.location.href = "/login";
      }
    } else if (import.meta.env.DEV) {
      console.error("API Error:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// --- Auth (no dedupe; no token yet) ---
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
};

// --- User (GETs deduplicated) ---
export const userAPI = {
  getProfile: () => dedupeGet("/user/profile"),
  getProfileFull: () => dedupeGet("/user/profile/full"),
  getDashboard: () => dedupeGet("/user/dashboard"),
  getModulesContext: () => dedupeGet("/user/modules-context"),
  getAvatars: () => dedupeGet("/user/avatars"),
  updateProfile: (payload) => api.put("/user/profile", payload),
  completeModule: (moduleId, sessionStats = {}) =>
    api.put("/user/module/complete", { moduleId, sessionStats }),
  setCurrentModule: (moduleId) => api.put("/user/module/current", { moduleId }),
};

// --- Modules ---
export const modulesAPI = {
  getAll: (category) =>
    dedupeGet("/modules", category && category !== "all" ? { category } : {}),
  getById: (id) => dedupeGet(`/modules/${id}`),
  create: (data) => api.post("/modules", data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
};

// --- Admin ---
export const adminAPI = {
  getUsers: () => dedupeGet("/admin/users"),
  getUser: (id) => dedupeGet(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// --- Achievements ---
export const achievementsAPI = {
  getAll: () => dedupeGet("/achievements"),
  getUserAchievements: () => dedupeGet("/achievements/user"),
  earnAchievement: (achievementId) =>
    api.post("/achievements/earn", { achievementId }),
  getStats: () => dedupeGet("/achievements/stats"),
  checkAchievements: (progressData) =>
    api.post("/achievements/check", progressData),
};

// --- Tutor (longer timeout for AI) ---
const tutorRequest = (config) =>
  api.request({ ...config, timeout: TUTOR_TIMEOUT });

export const tutorAPI = {
  ask: (message, context) =>
    tutorRequest({ method: "post", url: "/tutor", data: { message, context } }),
  verifyStep: (payload) =>
    tutorRequest({ method: "post", url: "/tutor/verify", data: payload }),
  generateMCQs: (payload) =>
    tutorRequest({ method: "post", url: "/tutor/mcq/generate", data: payload }),
  verifyMCQ: (payload) =>
    tutorRequest({ method: "post", url: "/tutor/mcq/verify", data: payload }),
  explainCode: (code, language) =>
    tutorRequest({
      method: "post",
      url: "/tutor/explain-code",
      data: { code, language },
    }),
  generateStarterCode: (planning) =>
    tutorRequest({
      method: "post",
      url: "/tutor/generate-starter-code",
      data: { planning },
    }),
};

// --- Config ---
export const configAPI = {
  getStudioLevel: (points) => dedupeGet("/config/studio-level", { points }),
  getAvatars: () => dedupeGet("/config/avatars"),
};

export default api;
