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
import { HouseRent } from './components/HouseRent';
import { Utilities } from './components/Utilities';
import { Settlement } from './components/Settlement';
import { BazaarSchedule } from './components/BazaarSchedule';
import api from './api/client';
import { ShieldCheck, User as UserIcon, Bell, LogOut } from 'lucide-react';

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
    if (pathname.includes('/house-rent')) return 'House Rent & Per-Person Division';
    if (pathname.includes('/utilities')) return 'Utility Bills & Per-Person Division';
    if (pathname.includes('/settlement')) return 'Financial Settlement Ledger';
    if (pathname.includes('/bazaar-schedule')) return 'Bazaar & Market Duty Schedule';
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
        <header className="h-[4.5rem] bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-tight">{getPageTitle(location.pathname)}</h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Sync
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
                  {user.username ? user.username[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">{user.username}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'admin'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {user.role || 'Member'}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 text-xs font-bold transition-all shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
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
            <Route path="/house-rent" element={<HouseRent />} />
            <Route path="/utilities" element={<Utilities />} />
            <Route path="/settlement" element={<Settlement />} />
            <Route path="/bazaar-schedule" element={<BazaarSchedule />} />
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
