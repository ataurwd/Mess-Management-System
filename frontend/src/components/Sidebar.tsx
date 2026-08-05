import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Wallet, 
  Receipt, 
  Tags, 
  Users, 
  LogOut,
  Building2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/meals', label: 'Daily Meals', icon: UtensilsCrossed },
    { path: '/balances', label: 'Deposits / Balance', icon: Wallet },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/categories', label: 'Categories', icon: Tags },
    { path: '/members', label: 'Mess Members', icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col h-screen sticky top-0 backdrop-blur-xl shrink-0 z-40">
      {/* Brand Header with Emerald Accents */}
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3.5">
        <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-lg shadow-emerald-600/30 text-white flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white tracking-tight leading-tight">MessManager</h1>
          <p className="text-[11px] text-emerald-400 font-bold tracking-wide uppercase">Smart Green System</p>
        </div>
      </div>

      {/* User info widget */}
      {user && (
        <div className="mx-4 my-4 p-3.5 bg-slate-800/40 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-sm shadow-inner">
            {user.username ? user.username[0].toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">{user.username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                user.role === 'admin' 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {user.role || 'Member'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation</div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25 border border-emerald-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? 'text-white opacity-100 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer logout */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 text-xs font-bold transition-all shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
