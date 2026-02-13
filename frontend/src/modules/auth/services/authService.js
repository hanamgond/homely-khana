import api from '@/shared/lib/api';
import Cookies from 'js-cookie';

export const AuthService = {
  login: async (phone, password) => {
    const response = await api.post('/api/auth/login', { phone, password });
    if (response.data.token) {
      Cookies.set('token', response.data.token, { expires: 7 });
    }
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/api/auth/signup', userData);
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await api.post('/api/auth/verify-otp', { email, otp });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  // FIXED: Put back the '/api' prefix now that the backend route exists
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post('/api/auth/reset-password', { 
      email, 
      otp, 
      newPassword 
    });
    return response.data;
  },

  logout: () => {
    Cookies.remove('token');
    window.location.href = '/login';
  }
};