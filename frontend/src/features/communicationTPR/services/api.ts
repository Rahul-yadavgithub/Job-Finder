import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const commApi = axios.create({
  baseURL: `${BASE_URL}/communication-tpr`,
  withCredentials: true,
});

commApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (
        typeof window !== 'undefined' && 
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/reset-password') &&
        !window.location.pathname.includes('/forgot-password')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
