import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';
const C = createContext();
export const useAuth = () => useContext(C);
export function AuthProvider({
  children
}) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem('pulsefit_token')) {
      setLoading(false);
      return;
    }
    api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('pulsefit_token')).finally(() => setLoading(false));
  }, []);
  async function login(email, password) {
    const {
      data
    } = await api.post('/auth/login', {
      email,
      password
    });
    localStorage.setItem('pulsefit_token', data.token);
    setUser(data.user);
  }
  async function register(name, email, password) {
    const {
      data
    } = await api.post('/auth/register', {
      name,
      email,
      password
    });
    localStorage.setItem('pulsefit_token', data.token);
    setUser(data.user);
  }
  function logout() {
    localStorage.removeItem('pulsefit_token');
    setUser(null);
  }
  return <C.Provider value={{
    user,
    setUser,
    loading,
    login,
    register,
    logout
  }}>{children}</C.Provider>;
}
