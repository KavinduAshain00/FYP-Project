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
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  getDashboard: () => api.get('/user/dashboard'),
  getAvatars: () => api.get('/user/avatars'),
  updateProfile: (payload) => api.put('/user/profile', payload),
  completeModule: (moduleId, sessionStats = {}) =>
    api.put('/user/module/complete', { moduleId, sessionStats }),
  setCurrentModule: (moduleId) => api.put('/user/module/current', { moduleId }),
};

// Modules API
export const modulesAPI = {
  getAll: (category) => api.get(`/modules${category ? `?category=${category}` : ''}`),
  getById: (id) => api.get(`/modules/${id}`),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
};

// Admin API (requires admin role)
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

// Achievements API
export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
  getUserAchievements: () => api.get('/achievements/user'),
  earnAchievement: (achievementId) => api.post('/achievements/earn', { achievementId }),
  getStats: () => api.get('/achievements/stats'),
  checkAchievements: (progressData) => api.post('/achievements/check', progressData),
};

// Tutor API (Gemini / Ollama)
export const tutorAPI = {
  ask: (message, context) => api.post('/tutor', { message, context }),
  verifyStep: (payload) => api.post('/tutor/verify', payload),
  generateMCQs: (payload) => api.post('/tutor/mcq/generate', payload),
  verifyMCQ: (payload) => api.post('/tutor/mcq/verify', payload),
  explainCode: (code, language) => api.post('/tutor/explain-code', { code, language }),
  generateStarterCode: (planning) => api.post('/tutor/generate-starter-code', { planning }),
};

// Diagrams API (Mermaid)
export const diagramsAPI = {
  generate: (description, diagramType, options) =>
    api.post('/diagrams/generate', { description, diagramType, options }),
  validate: (mermaidCode) =>
    api.post('/diagrams/validate', { mermaidCode }),
};

// Config API (studio level, avatars)
export const configAPI = {
  getStudioLevel: (points) => api.get('/config/studio-level', { params: { points } }),
  getAvatars: () => api.get('/config/avatars'),
};

export default api;
