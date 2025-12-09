import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

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
  completeModule: (moduleId) => api.put('/user/module/complete', { moduleId }),
  setCurrentModule: (moduleId) => api.put('/user/module/current', { moduleId }),
};

// Modules API
export const modulesAPI = {
  getAll: (category) => api.get(`/modules${category ? `?category=${category}` : ''}`),
  getById: (id) => api.get(`/modules/${id}`),
};

// Achievements API
export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
  getUserAchievements: () => api.get('/achievements/user'),
  earnAchievement: (achievementId) => api.post('/achievements/earn', { achievementId }),
  getStats: () => api.get('/achievements/stats'),
};

export default api;
