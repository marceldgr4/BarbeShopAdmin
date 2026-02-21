import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/admin/',
  headers: {
    'Content-Type': 'application/json',
    'x-dev-bypass': 'true', // Solo para desarrollo
  },
});

export const dashboardApi = {
  getStats: () => api.get('dashboard'),
  getRevenue: () => api.get('dashboard/revenue'),
  getAppointmentsByDay: () => api.get('dashboard/appointments/by-day'),
};

export const barbershopsApi = {
  getAll: (params?: any) => api.get('barbershops', { params }),
  getById: (id: string) => api.get(`barbershops/${id}`),
  create: (data: any) => api.post('barbershops', data),
  update: (id: string, data: any) => api.patch(`barbershops/${id}`, data),
  toggle: (id: string) => api.patch(`barbershops/${id}/toggle`),
  delete: (id: string) => api.delete(`barbershops/${id}`),
};

export const barbersApi = {
  getAll: (params?: any) => api.get('barbers', { params }),
  getById: (id: string) => api.get(`barbers/${id}`),
  create: (data: any) => api.post('barbers', data),
  update: (id: string, data: any) => api.patch(`barbers/${id}`, data),
  toggle: (id: string) => api.patch(`barbers/${id}/toggle`),
  getStats: (id: string) => api.get(`barbers/${id}/stats`),
  delete: (id: string) => api.delete(`barbers/${id}`),
};

export const servicesApi = {
  getAll: (params?: any) => api.get('services', { params }),
  getById: (id: string) => api.get(`services/${id}`),
  create: (data: any) => api.post('services', data),
  update: (id: string, data: any) => api.patch(`services/${id}`, data),
  toggle: (id: string) => api.patch(`services/${id}/toggle`),
  delete: (id: string) => api.delete(`services/${id}`),
};

export const appointmentsApi = {
  getAll: (params?: any) => api.get('appointments', { params }),
  getToday: () => api.get('appointments/today'),
  getById: (id: string) => api.get(`appointments/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`appointments/${id}/status`, { status }),
};

export default api;
