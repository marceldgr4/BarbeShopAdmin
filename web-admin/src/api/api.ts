import axios from 'axios';

const TOKEN_STORAGE_KEY = 'barber_admin_token';
const USER_STORAGE_KEY = 'barber_admin_user';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const enableDevBypass = import.meta.env.VITE_ENABLE_DEV_BYPASS === 'true';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/admin/',
  headers: {
    'Content-Type': 'application/json',
    ...(enableDevBypass ? { 'x-dev-bypass': 'true' } : {}),
  },
});

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
  getUser: () => {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  },
  setUser: (user: any) => localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_STORAGE_KEY),
  clearSession: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  },
};

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clearSession();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en web-admin/.env');
    }

    const response = await axios.post(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      { email, password },
      {
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  },

};

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
