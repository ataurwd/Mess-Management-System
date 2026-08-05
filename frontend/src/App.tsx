import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { Meals } from './components/Meals';
import { Balances } from './components/Balances';
import { Expenses } from './components/Expenses';
import { Categories } from './components/Categories';
import { Members } from './components/Members';
import api from './api/client';
import { ShieldCheck, User as UserIcon, Bell } from 'lucide-react';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    if (token) {
      api.get('/v1/user/getProfile')
        .then((res) => {
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleLoginSuccess = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/balances/list')) return 'All Deposits History';
    if (pathname.includes('/balances')) return 'Member Deposits & Balance';
    if (pathname.includes('/expenses/list')) return 'All Expenses History';
    if (pathname.includes('/expenses')) return 'Mess Expenses';
    if (pathname.includes('/meals/list')) return 'All Meal Logs History';
    if (pathname.includes('/meals')) return 'Daily Meal Log';
    if (pathname.includes('/categories')) return 'Category Management';
    if (pathname.includes('/members')) return 'Mess Members Directory';
    return 'Overview Dashboard';
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-tight">{getPageTitle(location.pathname)}</h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{user.username || user.email}</span>
                <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-300 text-[10px] uppercase font-bold rounded">
                  {user.role || 'User'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/meals/*" element={<Meals />} />
            <Route path="/balances/*" element={<Balances />} />
            <Route path="/expenses/*" element={<Expenses />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/members" element={<Members />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
