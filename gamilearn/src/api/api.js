import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Avatars cache: fetch once, invalidate on logout or when level/achievements change
const AVATARS_CACHE_KEY = 'gamilearn_avatars';
const AVATARS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function invalidateAvatarsCache() {
  try {
    localStorage.removeItem(AVATARS_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getDashboard: () => api.get('/user/dashboard'),
  /** Fetches avatars once and caches in localStorage; use invalidateAvatarsCache() on logout or when level/achievements change. */
  async getAvatars() {
    let cached = null;
    try {
      const raw = localStorage.getItem(AVATARS_CACHE_KEY);
      if (raw) {
        const { data, timestamp, etag } = JSON.parse(raw);
        if (timestamp && Date.now() - timestamp < AVATARS_CACHE_TTL_MS && data) return { data };
        cached = { data, timestamp, etag };
      }
    } catch {
      /* ignore */
    }
    const res = await api.get('/user/avatars', {
      headers: {
        ...(cached?.etag ? { 'If-None-Match': cached.etag } : {}),
      },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (res.status === 304 && cached?.data) {
      return { data: cached.data };
    }
    const data = res.data;
    try {
      localStorage.setItem(
        AVATARS_CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now(), etag: res.headers?.etag || null })
      );
    } catch {
      /* ignore */
    }
    return { data };
  },
  updateProfile: (payload) => api.put('/user/profile', payload),
  changePassword: (currentPassword, newPassword) =>
    api.put('/user/password', { currentPassword, newPassword }),
  completeModule: (moduleId, sessionStats = {}) =>
    api.put('/user/module/complete', { moduleId, sessionStats }),
  setCurrentModule: (moduleId, currentStepIndex) =>
    api.put('/user/module/current', {
      moduleId,
      ...(typeof currentStepIndex === 'number' ? { currentStepIndex } : {}),
    }),
};

// Modules API
export const modulesAPI = {
  getAll: (category, params = {}) =>
    api.get('/modules', { params: { ...(category ? { category } : {}), ...params } }),
  getById: (id) => api.get(`/modules/${id}`),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
};

// Admin API (requires admin role)
export const adminAPI = {
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getStats: () => api.get('/admin/stats'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  grantAchievement: (userId, achievementId) =>
    api.post(`/admin/users/${userId}/achievements`, { achievementId }),
  revokeAchievement: (userId, achievementId) =>
    api.delete(`/admin/users/${userId}/achievements/${achievementId}`),
  grantAdmin: (userId) => api.post(`/admin/users/${userId}/grant-admin`),
  revokeAdmin: (userId) => api.delete(`/admin/users/${userId}/revoke-admin`),
};

// Achievements cache: single key, invalidate on logout or when user earns
const ACHIEVEMENTS_CACHE_KEY = 'gamilearn_achievements';
const ACHIEVEMENTS_CATALOG_CACHE_KEY = 'gamilearn_achievements_catalog';
const ACHIEVEMENTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function invalidateAchievementsCache() {
  try {
    localStorage.removeItem(ACHIEVEMENTS_CACHE_KEY);
    localStorage.removeItem(ACHIEVEMENTS_CATALOG_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function invalidateUserCaches() {
  invalidateAchievementsCache();
  invalidateAvatarsCache();
}

// Achievements API
export const achievementsAPI = {
  /** Cached catalog (all achievements); used by Admin. */
  async getAll() {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_CATALOG_CACHE_KEY);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        if (timestamp && Date.now() - timestamp < ACHIEVEMENTS_CACHE_TTL_MS && data)
          return { data };
      }
    } catch {
      /* ignore */
    }
    const res = await api.get('/achievements');
    const data = res.data;
    try {
      localStorage.setItem(
        ACHIEVEMENTS_CATALOG_CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now() })
      );
    } catch {
      /* ignore */
    }
    return { data };
  },
  /** Fetches user achievements once and caches in localStorage; use invalidateAchievementsCache() on logout or after earning. */
  async getUserAchievements() {
    let cached = null;
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_CACHE_KEY);
      if (raw) {
        const { data, timestamp, etag } = JSON.parse(raw);
        if (timestamp && Date.now() - timestamp < ACHIEVEMENTS_CACHE_TTL_MS && data)
          return { data };
        cached = { data, timestamp, etag };
      }
    } catch {
      /* ignore */
    }
    const res = await api.get('/achievements/user', {
      headers: {
        ...(cached?.etag ? { 'If-None-Match': cached.etag } : {}),
      },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
    });
    if (res.status === 304 && cached?.data) {
      return { data: cached.data };
    }
    const data = res.data;
    try {
      localStorage.setItem(
        ACHIEVEMENTS_CACHE_KEY,
        JSON.stringify({ data, timestamp: Date.now(), etag: res.headers?.etag || null })
      );
    } catch {
      /* ignore */
    }
    return { data };
  },
  earnAchievement: (achievementId) => api.post('/achievements/earn', { achievementId }),
  getStats: () => api.get('/achievements/stats'),
  checkAchievements: (progressData) => api.post('/achievements/check', progressData),
};

// Tutor API
export const tutorAPI = {
  ask: (message, context) => api.post('/tutor', { message, context }),
  verifyStep: (payload) => api.post('/tutor/verify', payload),
  generateMCQs: (payload) => api.post('/tutor/mcq/generate', payload),
  verifyMCQ: (payload) => api.post('/tutor/mcq/verify', payload),
  explainCode: (code, language) => api.post('/tutor/explain-code', { code, language }),
  explainError: (errorMessage, codeSnippet, language) =>
    api.post('/tutor/explain-error', {
      errorMessage,
      codeSnippet: codeSnippet || '',
      language: language || 'javascript',
    }),
  /** Generate lecture notes from module learning overview (on popup open) */
  generateLectureNotes: (payload) => api.post('/tutor/lecture-notes', payload),
};

export default api;
