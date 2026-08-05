import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { 
  Wallet, 
  Receipt, 
  UtensilsCrossed, 
  Calculator, 
  ArrowUpRight, 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  Activity,
  CheckCircle,
  Users,
  Sparkles
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch live raw lists for real-time calculations
  const { data: dashboardData, isLoading, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [balancesRes, expensesRes, mealsRes, usersRes] = await Promise.allSettled([
        api.get('/v1/balance/getBalances'),
        api.get('/v1/expense/getExpenses'),
        api.get('/v1/meal/getMeals'),
        api.get('/v1/user/getUsers'),
      ]);

      let totalBalance = 0;
      let totalExpense = 0;
      let totalMeals = 0;
      let usersCount = 0;
      let recentDeposits: any[] = [];
      let recentExpenses: any[] = [];

      // 1. Sum up all member deposits
      if (balancesRes.status === 'fulfilled' && balancesRes.value.data?.data) {
        const deposits = Array.isArray(balancesRes.value.data.data) ? balancesRes.value.data.data : [];
        totalBalance = deposits.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        recentDeposits = deposits.slice(0, 3);
      }

      // 2. Sum up all mess expenses
      if (expensesRes.status === 'fulfilled' && expensesRes.value.data?.data) {
        const expenses = Array.isArray(expensesRes.value.data.data) ? expensesRes.value.data.data : [];
        totalExpense = expenses.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        recentExpenses = expenses.slice(0, 3);
      }

      // 3. Sum up all member meals
      if (mealsRes.status === 'fulfilled' && mealsRes.value.data?.data) {
        const meals = Array.isArray(mealsRes.value.data.data) ? mealsRes.value.data.data : [];
        totalMeals = meals.reduce((sum: number, item: any) => sum + (Number(item.numberOfMeal) || 0), 0);
      }

      // 4. Count users
      if (usersRes.status === 'fulfilled' && usersRes.value.data?.data) {
        usersCount = Array.isArray(usersRes.value.data.data) ? usersRes.value.data.data.length : 0;
      }

      // Formula: Meal Rate = Total Expense / Total Meals
      const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;
      const currentAvailableBalance = totalBalance - totalExpense;

      return {
        messTotalBalance: totalBalance,
        messTotalExpense: totalExpense,
        totalMeals,
        mealRate,
        currentAvailableBalance,
        usersCount,
        recentDeposits,
        recentExpenses,
      };
    },
    refetchInterval: 3000, // Background polling every 3 seconds for true real-time multi-device sync
  });

  const summary = dashboardData || {
    messTotalBalance: 0,
    messTotalExpense: 0,
    currentAvailableBalance: 0,
    totalMeals: 0,
    mealRate: 0,
    usersCount: 0,
    recentDeposits: [],
    recentExpenses: [],
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  // Fetch notices
  const { data: notices = [] } = useQuery<any[]>({
    queryKey: ['notices'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/notice');
        const list = res.data?.data;
        return Array.isArray(list) ? list : [];
      } catch (e) { return []; }
    },
  });

  const pinnedNotice = notices[0];

  return (
    <div className="space-y-8">
      {/* Modern Emerald Hero Header */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 shadow-2xl shadow-emerald-950/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-extrabold uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Emerald Real-Time Dashboard
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                Live 3s Polling
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Mess Financial Overview</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Live tracking of member deposits, expenditures, daily meal counts, and automatic meal rate calculations.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 border border-emerald-400/30 transition-all flex items-center gap-2.5 self-start md:self-auto hover:scale-105 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Sync Emerald Engine</span>
          </button>
        </div>
      </div>

      {/* Mess Notice Board Banner */}
      {pinnedNotice && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-amber-400 tracking-wider">Announcement: {pinnedNotice.title}</span>
                <span className="text-[10px] text-slate-400">• {new Date(pinnedNotice.date).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">{pinnedNotice.content}</p>
            </div>
          </div>
          <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-md shrink-0">
            PINNED NOTICE
          </span>
        </div>
      )}

      {/* 4 Green Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Mess Deposits */}
        <div className="group relative p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 shadow-lg shadow-emerald-950/20 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Deposits</span>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl font-black text-white tracking-tight">
              ৳{isLoading ? '...' : summary.messTotalBalance.toLocaleString()}
            </div>
            <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> Live member money deposited
            </p>
          </div>
        </div>

        {/* 2. Total Expenses */}
        <div className="group relative p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 shadow-lg shadow-emerald-950/20 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl font-black text-white tracking-tight">
              ৳{isLoading ? '...' : summary.messTotalExpense.toLocaleString()}
            </div>
            <p className="text-xs font-semibold text-teal-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Bazaar & mess expenditures
            </p>
          </div>
        </div>

        {/* 3. Total Meals */}
        <div className="group relative p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 shadow-lg shadow-emerald-950/20 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Meals</span>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl font-black text-white tracking-tight">
              {isLoading ? '...' : summary.totalMeals} <span className="text-xs text-slate-400 font-bold">Meals</span>
            </div>
            <p className="text-xs font-semibold text-emerald-400 mt-2">Logged count this month</p>
          </div>
        </div>

        {/* 4. Live Meal Rate - Highlighted Neon Green Card */}
        <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-400/40 shadow-xl shadow-emerald-900/30 hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Live Meal Rate</span>
            <div className="p-3 bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 rounded-xl group-hover:scale-110 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              ৳{isLoading ? '...' : summary.mealRate.toFixed(2)}
            </div>
            <p className="text-xs font-bold text-slate-300 mt-2">
              (Total Expense ÷ Total Meals)
            </p>
          </div>
        </div>
      </div>

      {/* Main Section: Financial Health Widget + Recent Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Status & Formula Card */}
        <div className="lg:col-span-2 p-7 rounded-3xl bg-slate-900/90 border border-emerald-500/20 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Financial Health & Meal Rate Formula</h3>
                <p className="text-xs text-slate-400">Live ratio of expenses versus member deposit funds</p>
              </div>
            </div>
          </div>

          {/* Green Formula Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="uppercase tracking-wider">Meal Rate Dynamic Formula</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[10px]">Real-Time Sync</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 font-mono text-xs text-slate-200">
              <span>
                Meal Rate = <strong className="text-emerald-400">৳{summary.messTotalExpense.toLocaleString()}</strong> ÷ <strong className="text-emerald-300">{summary.totalMeals} Meals</strong>
              </span>
              <span className="font-extrabold text-sm text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/40">
                = ৳{summary.mealRate.toFixed(2)} / meal
              </span>
            </div>
          </div>

          {/* Budget Utilization Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Expense Budget Utilization</span>
              <span className="text-emerald-400">
                {summary.messTotalBalance > 0 ? ((summary.messTotalExpense / summary.messTotalBalance) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    summary.messTotalBalance > 0 ? (summary.messTotalExpense / summary.messTotalBalance) * 100 : 0,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Key Financial Badges */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-xs text-slate-400 font-semibold block">Available Cash Balance</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">৳{summary.currentAvailableBalance.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500">(Total Deposits minus Total Expenses)</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <span className="text-xs text-slate-400 font-semibold block">Active Mess Members</span>
              <p className="text-2xl font-black text-teal-400 mt-1">{summary.usersCount} Members</p>
              <span className="text-[11px] text-slate-500">Registered users directory</span>
            </div>
          </div>
        </div>

        {/* Modern Recent Activity Feeds */}
        <div className="space-y-6">
          {/* Recent Deposits */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/20 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Recent Deposits
              </span>
              <span className="text-xs text-emerald-400 font-bold">Live</span>
            </h3>

            {summary.recentDeposits.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No deposit records found.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {summary.recentDeposits.map((d: any) => (
                  <div key={d._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{d.username || 'Member'}</p>
                      <p className="text-[11px] text-slate-400">{d.category || 'General Deposit'}</p>
                    </div>
                    <span className="font-black text-emerald-400">৳{Number(d.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/20 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                Recent Expenses
              </span>
              <span className="text-xs text-teal-400 font-bold">Live</span>
            </h3>

            {summary.recentExpenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No expense records found.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {summary.recentExpenses.map((ex: any) => (
                  <div key={ex._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{ex.summary || ex.itemDetails || 'Bazaar'}</p>
                      <p className="text-[11px] text-slate-400">By {ex.username || 'Member'}</p>
                    </div>
                    <span className="font-black text-rose-400">৳{Number(ex.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
