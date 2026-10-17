import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { api } from './api.js';
import { applyLanguage } from './i18n.js';
import { applyTheme } from './theme.js';

const AuthContext = createContext(null);

// Keeps the logged-in user available to every page
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when the first check could not reach the server: the app then shows a "no connection" screen
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch((err) => {
        setUser(null);
        setOffline(err.code === 'OFFLINE');
      })
      .finally(() => setLoading(false));
  }, []);

  // The language saved on the account wins once logged in
  const language = user?.language;
  useEffect(() => {
    if (language) applyLanguage(language);
  }, [language]);

  // The theme saved on the account wins too
  const skin = user?.skin;
  const appearance = user?.appearance;
  useEffect(() => {
    if (skin && appearance) applyTheme({ skin, appearance });
  }, [skin, appearance]);

  // Keeps the account time zone in line with the device, for "today" and reminder times
  const timezone = user?.timezone;
  useEffect(() => {
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone || !local || timezone === local) return;
    api('/settings/timezone', { method: 'PUT', body: { timezone: local } })
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, [timezone]);

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
    <AuthContext.Provider value={{ user, loading, offline, login, logout, signIn }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Pages only for logged-in users
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  if (loading) return <p>{t('common.loading')}</p>;
  if (!user) return <Navigate to="/login" replace />;
  // The first-login guide (theme, income, fixed expenses, budget, reminders) runs until finished or skipped
  if (!user.onboardingDone && pathname !== '/welcome') return <Navigate to="/welcome" replace />;
  return children;
}

// Pages only for visitors (login, signup...)
export function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <p>{t('common.loading')}</p>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}
