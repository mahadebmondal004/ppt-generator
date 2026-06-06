import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// ─── Curriculum ────────────────────────────────────────────────
export const curriculumAPI = {
  getBoards: () => api.get('/curriculum/boards'),
  getGrades: (board) => api.get(`/curriculum/grades?board=${board}`),
  getSubjects: (board, grade) => api.get(`/curriculum/subjects?board=${encodeURIComponent(board)}&grade=${encodeURIComponent(grade)}`),
  getTopics: (board, grade, subject) => api.get(`/curriculum/topics?board=${encodeURIComponent(board)}&grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
};

// ─── Generate ──────────────────────────────────────────────────
export const generateAPI = {
  generate: (formData) => api.post('/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStatus: (id) => api.get(`/generate/${id}/status`),
  getGeneration: (id) => api.get(`/generate/${id}`),
  downloadPPT: (id) => `${window.location.origin}/api/generate/${id}/download/ppt`,
  downloadLesson: (id) => `${window.location.origin}/api/generate/${id}/download/lesson`,
  downloadZip: (id) => `${window.location.origin}/api/generate/${id}/download/zip`,
  regenerateAll: (id, data) => api.post(`/generate/${id}/regenerate`, data),
  regenerateSlide: (id, slideIndex, data) => api.post(`/generate/${id}/slides/${slideIndex}/regenerate`, data)
};

// ─── History ───────────────────────────────────────────────────
export const historyAPI = {
  getHistory: (page = 1) => api.get(`/history?page=${page}`),
  getItem: (id) => api.get(`/history/${id}`),
  deleteItem: (id) => api.delete(`/history/${id}`)
};

// ─── Question Paper & Grader ───────────────────────────────────
export const qpAPI = {
  generate: (formData) => api.post('/qp/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPapers: () => api.get('/qp'),
  getPaperDetails: (id) => api.get(`/qp/${id}`),
  evaluate: (id, formData) => api.post(`/qp/${id}/evaluate`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getEvaluationDetails: (id) => api.get(`/qp/evaluations/${id}`),
  getEvaluations: (paperId) => api.get(`/qp/evaluations${paperId ? `?paperId=${paperId}` : ''}`)
};

export default api;
