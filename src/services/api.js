import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = __DEV__ ? 'http://10.0.2.2:5000/api' : 'https://your-production-url.com/api';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const authRaw = await AsyncStorage.getItem('auth');
  if (authRaw) {
    const { token } = JSON.parse(authRaw);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  sendOtp:   (mobile) => api.post('/auth/send-otp', { mobile }),
  verifyOtp: (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp }),
  register:  (data) => api.post('/auth/register', data),
  login:     (data) => api.post('/auth/login', data),
  refresh:   (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const ticketAPI = {
  create:       (data) => api.post('/tickets', data),
  list:         (params) => api.get('/tickets', { params }),
  getById:      (id) => api.get(`/tickets/${id}`),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
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

export const communityAPI = {
  getBoard:    (params) => api.get('/community/board', { params }),
  getEvents:   () => api.get('/community/events'),
  getMissing:  () => api.get('/community/missing'),
  reportMissing: (data) => api.post('/community/missing', data),
};

export const adminAPI = {
  getStats:    () => api.get('/admin/stats'),
  getDeptStats:() => api.get('/admin/dept-stats'),
  browseTable: (table, params) => api.get(`/admin/db/${table}`, { params }),
  exportTable: (table) => api.get(`/admin/export/${table}`, { responseType: 'blob' }),
  getImpressions: () => api.get('/admin/impressions'),
  recordImpression: (data) => api.post('/admin/impressions', data),
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
