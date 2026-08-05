import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../navigation/navigationRef';
import { useAuthStore } from '../store/authStore';

const API_URL = 'https://samaj-setu-backend.onrender.com/api';

// Render's free tier can take 30-50s to wake from sleep on the first request after
// idling — 15s was cutting that off mid-wake and surfacing as a network error.
const api = axios.create({ baseURL: API_URL, timeout: 60000 });

// ── Request interceptor — attach JWT ────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const authRaw = await AsyncStorage.getItem('auth');
  if (authRaw) {
    const { token } = JSON.parse(authRaw);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — silent token refresh on 401 ────────────────────
let isRefreshing    = false;
let refreshQueue    = [];   // queued callbacks waiting for new token

const drainQueue = (token) => { refreshQueue.forEach(cb => cb(token)); refreshQueue = []; };
const abortQueue = (err)   => { refreshQueue.forEach(cb => cb(null, err)); refreshQueue = []; };

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;

    // Only intercept 401s; skip the refresh endpoint itself to avoid loops
    if (response?.status !== 401 || config._retry || config.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request — it will retry once the refresh completes
      return new Promise((resolve, reject) => {
        refreshQueue.push((newToken, err) => {
          if (err) return reject(err);
          config._retry = true;
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    config._retry = true;
    isRefreshing  = true;

    try {
      const authRaw = await AsyncStorage.getItem('auth');
      if (!authRaw) throw new Error('no_auth');
      const stored = JSON.parse(authRaw);
      if (!stored.refreshToken) throw new Error('no_refresh_token');

      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: stored.refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data;

      // Persist new tokens
      stored.token        = accessToken;
      stored.refreshToken = newRefreshToken;
      await AsyncStorage.setItem('auth', JSON.stringify(stored));
      useAuthStore.getState().setAuth(stored.user, accessToken, newRefreshToken, stored.role);

      // Retry queued requests with new token
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      config.headers.Authorization              = `Bearer ${accessToken}`;
      drainQueue(accessToken);
      isRefreshing = false;
      return api(config);

    } catch (refreshErr) {
      isRefreshing = false;
      abortQueue(refreshErr);

      // Force logout and redirect to Welcome
      useAuthStore.getState().logout();
      navigationRef.current?.reset({ index: 0, routes: [{ name: 'Welcome' }] });

      return Promise.reject(refreshErr);
    }
  }
);

export const authAPI = {
  sendOtp:            (mobile) => api.post('/auth/send-otp', { mobile }),
  verifyOtp:          (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp }),
  register:           (data) => api.post('/auth/register', data),
  login:               (data) => api.post('/auth/login', data),
  refresh:             (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotAdminPassword: (username) => api.post('/auth/admin/forgot-password', { username }),
  resetAdminPassword:  (username, code, newPassword) => api.post('/auth/admin/reset-password', { username, code, newPassword }),
};

export const ticketAPI = {
  create:       (data) => api.post('/tickets', data),
  list:         (params) => api.get('/tickets', { params }),
  getById:      (id) => api.get(`/tickets/${id}`),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  assign:       (id, data) => api.patch(`/tickets/${id}/assign`, data),
  upvote:       (id) => api.post(`/tickets/${id}/upvote`),
  rate:         (id, data) => api.post(`/tickets/${id}/rate`, data),
  sos:          (data) => api.post('/tickets/sos', data),
  addNote:      (id, note) => api.post(`/tickets/${id}/note`, { note }),
};

export const paymentAPI = {
  initiate: (ticketId) => api.post('/payments/initiate', { ticketId }),
  confirm:  (id) => api.post(`/payments/${id}/confirm`),
  list:     (params) => api.get('/payments', { params }),
};

export const mediaAPI = {
  // Upload up to 5 files (photo / video / audio) attached to a ticket
  upload: (formData) =>
    api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // media uploads can take longer
    }),
};

export const communityAPI = {
  getBoard:      (params) => api.get('/community/board', { params }),
  getEvents:     () => api.get('/community/events'),
  getMissing:    () => api.get('/community/missing'),
  reportMissing: (data) => api.post('/community/missing', data),
  reportPost:    (ticketId, reason) => api.post(`/community/board/${ticketId}/report`, { reason }),
  getReports:    () => api.get('/community/board/reports'),
  hidePost:      (ticketId, hidden = true) => api.patch(`/community/board/${ticketId}/hide`, { hidden }),
};

export const adminAPI = {
  getStats:         () => api.get('/admin/stats'),
  getDeptStats:     () => api.get('/admin/dept-stats'),
  browseTable:      (table, params) => api.get(`/admin/db/${table}`, { params }),
  exportTable:      (table) => api.get(`/admin/export/${table}`, { responseType: 'blob' }),
  getImpressions:   () => api.get('/admin/impressions'),
  recordImpression: (data) => api.post('/admin/impressions', data),
  updateTeamMember: (id, data) => api.patch(`/admin/team-members/${id}`, data),
};

export const notificationAPI = {
  list:     () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const userAPI = {
  me:     () => api.get('/users/me'),
  update: (data) => api.patch('/users/me', data),
  list:   (params) => api.get('/users', { params }),
  block:  (id, blocked) => api.patch(`/users/${id}/block`, { blocked }),
};

export const departmentAPI = {
  list:         () => api.get('/departments'),
  addMember:    (deptId, data) => api.post(`/departments/${deptId}/members`, data),
  removeMember: (memberId) => api.delete(`/departments/members/${memberId}`),
};

export default api;
