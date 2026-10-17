import { Suspense, lazy } from 'react';
import { BrowserRouter, Link, Route, Routes, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, GuestOnly, RequireAuth } from './auth.jsx';
import AppLayout from './components/AppLayout.jsx';
import GuestLayout from './components/GuestLayout.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

// Pages of the logged-in area are downloaded only when first opened, so the first visit loads faster
const Welcome = lazy(() => import('./pages/Welcome.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const TransactionForm = lazy(() => import('./pages/TransactionForm.jsx'));
const Budget = lazy(() => import('./pages/Budget.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const Recurrences = lazy(() => import('./pages/Recurrences.jsx'));
const RecurrenceForm = lazy(() => import('./pages/RecurrenceForm.jsx'));
const Recap = lazy(() => import('./pages/Recap.jsx'));
const DataReport = lazy(() => import('./pages/DataReport.jsx'));
const Legal = lazy(() => import('./pages/Legal.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));

// A new form when switching between "add an expense" and "add an income" in the menu
function NewTransaction() {
  const [params] = useSearchParams();
  return <TransactionForm key={params.get('type') || 'EXPENSE'} />;
}

// Shown for the split second a page is downloading
function Loading() {
  const { t } = useTranslation();
  return <p className="loading">{t('common.loading')}</p>;
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <main>
      <h1>{t('notFound.title')}</h1>
      <Link to="/">{t('notFound.back')}</Link>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<GuestLayout />}>
              <Route path="/" element={<GuestOnly><Home /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
              {/* Open to everyone, logged in or not */}
              <Route path="/legal" element={<Legal />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route
              path="/welcome"
              element={
                <RequireAuth>
                  <div className="guest">
                    <div className="guest-body wide">
                      <Welcome />
                    </div>
                  </div>
                </RequireAuth>
              }
            />
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/new" element={<NewTransaction />} />
              <Route path="/transactions/:id/edit" element={<TransactionForm />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/recurrences" element={<Recurrences />} />
              <Route path="/recurrences/new" element={<RecurrenceForm />} />
              <Route path="/recurrences/:id/edit" element={<RecurrenceForm />} />
              <Route path="/recap" element={<Recap />} />
              <Route path="/account" element={<Account />} />
              <Route path="/account/data" element={<DataReport />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
      {/* Anonymous visit counts, no cookie (see the privacy page) */}
      <Analytics />
    </BrowserRouter>
  );
}
