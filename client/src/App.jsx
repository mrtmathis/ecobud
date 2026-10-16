import { BrowserRouter, Link, Route, Routes, useSearchParams } from 'react-router';
import { AuthProvider, GuestOnly, RequireAuth } from './auth.jsx';
import AppLayout from './components/AppLayout.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import TransactionForm from './pages/TransactionForm.jsx';
import Budget from './pages/Budget.jsx';
import Account from './pages/Account.jsx';

// A new form when switching between "add an expense" and "add an income" in the menu
function NewTransaction() {
  const [params] = useSearchParams();
  return <TransactionForm key={params.get('type') || 'EXPENSE'} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<GuestOnly><Home /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/new" element={<NewTransaction />} />
            <Route path="/transactions/:id/edit" element={<TransactionForm />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/account" element={<Account />} />
          </Route>
          <Route
            path="*"
            element={
              <main>
                <h1>Page introuvable</h1>
                <Link to="/">Retour à l’accueil</Link>
              </main>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
