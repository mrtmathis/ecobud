import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { api } from './api.js';

const AuthContext = createContext(null);

// Keeps the logged-in user available to every page
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(data.user);
  };

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  };

  // Used after signup or recovery, once the user has saved their recovery code
  const signIn = (newUser) => setUser(newUser);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signIn }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Pages only for logged-in users
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Chargement…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

// Pages only for visitors (login, signup...)
export function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Chargement…</p>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}
