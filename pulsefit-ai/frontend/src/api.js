import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});
api.interceptors.request.use(c => {
  const token = localStorage.getItem('pulsefit_token');
  if (token) c.headers.Authorization = 'Bearer ' + token;
  return c;
});
export const imageUrl = p => p?.startsWith('http') ? p : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '') + p;
