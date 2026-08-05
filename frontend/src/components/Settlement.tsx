import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { 
  Scale, 
  Wallet, 
  UtensilsCrossed, 
  Home, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

export const Settlement: React.FC = () => {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // 1. Fetch Users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/v1/user/getUsers');
      return res.data?.data || [];
    },
  });

  // 2. Fetch Deposits
  const { data: balances = [] } = useQuery<any[]>({
    queryKey: ['balances'],
    queryFn: async () => {
      const res = await api.get('/v1/balance/getBalances');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  // 3. Fetch Expenses & Meals for Live Meal Rate
  const { data: expenses = [] } = useQuery<any[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/v1/expense/getExpenses');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  const { data: meals = [] } = useQuery<any[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const res = await api.get('/v1/meal/getMeals');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });

  // 4. Fetch House Rent Config
  const { data: rentConfig = { totalRent: 16500 } } = useQuery<any>({
    queryKey: ['houseRentConfig'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/house-rent/config');
        return res.data?.data || { totalRent: 16500 };
      } catch (e) { return { totalRent: 16500 }; }
    },
  });

  // 5. Fetch Utilities
  const { data: utilities = [] } = useQuery<any[]>({
    queryKey: ['utilityBills'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/utility/bills');
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (e) { return []; }
    },
  });

  // Live Meal Rate Calculation
  const totalExpense = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);
  const totalMeals = useMemo(() => meals.reduce((sum, m) => sum + (Number(m.numberOfMeal) || 0), 0), [meals]);
  const liveMealRate = useMemo(() => (totalMeals > 0 ? totalExpense / totalMeals : 0), [totalExpense, totalMeals]);

  const totalRentAmount = rentConfig?.totalRent || 16500;
  const membersCount = users.length || 1;
  const perPersonRent = Math.round(totalRentAmount / membersCount);

  const totalUtilityAmount = useMemo(() => utilities.reduce((sum, u) => sum + (Number(u.amount) || 0), 0), [utilities]);
  const perPersonUtility = Math.round(totalUtilityAmount / membersCount);

  // Calculate Net Position per Member
  const settlementData = useMemo(() => {
    return users.map((user) => {
      // Total Deposits by User
      const userDeposits = balances
        .filter((b) => b.userId === user._id)
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

      // Total Meals by User
      const userMeals = meals
        .filter((m) => m.userId === user._id)
        .reduce((sum, m) => sum + (Number(m.numberOfMeal) || 0), 0);

      const mealCost = Math.round(userMeals * liveMealRate);
      const totalCostShare = mealCost + perPersonRent + perPersonUtility;
      const netPosition = userDeposits - totalCostShare;

      return {
        userId: user._id,
        username: user.username || user.email,
        userDeposits,
        userMeals,
        mealCost,
        rentShare: perPersonRent,
        utilityShare: perPersonUtility,
        totalCostShare,
        netPosition,
        status: netPosition >= 0 ? 'refund' : 'due',
      };
    });
  }, [users, balances, meals, liveMealRate, perPersonRent, perPersonUtility]);

  const totalRefunds = settlementData.filter(s => s.netPosition > 0).reduce((sum, s) => sum + s.netPosition, 0);
  const totalDues = settlementData.filter(s => s.netPosition < 0).reduce((sum, s) => sum + Math.abs(s.netPosition), 0);

  const handleExportCSV = () => {
    const headers = ['Member Name,Total Deposits (৳),Total Meals,Meal Cost (৳),Rent Share (৳),Utility Share (৳),Total Cost (৳),Net Position (৳),Status\n'];
    const rows = settlementData.map(s => 
      `"${s.username}",${s.userDeposits},${s.userMeals},${s.mealCost},${s.rentShare},${s.utilityShare},${s.totalCostShare},${s.netPosition},"${s.status.toUpperCase()}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mess_Financial_Settlement_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-emerald-400" />
            Member Financial Settlement Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Calculates exact net balance (Refund / Due) for every mess member based on deposits, meals, rent, & utilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all shadow-md"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Live Meal Rate</span>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">৳{liveMealRate.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">৳{totalExpense.toLocaleString()} ÷ {totalMeals} Meals</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Rent Share / Person</span>
          <p className="text-3xl font-extrabold text-blue-400 mt-2">৳{perPersonRent.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">৳{totalRentAmount.toLocaleString()} ÷ {membersCount} Members</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Total Member Refunds</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">৳{totalRefunds.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 font-medium mt-1">Surplus money to return</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Total Member Dues</span>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">৳{totalDues.toLocaleString()}</p>
          <p className="text-xs text-rose-400 font-medium mt-1">Pending money to collect</p>
        </div>
      </div>

      {/* Settlement Master Ledger Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            Master Financial Ledger Summary
          </h3>
          <span className="text-xs text-slate-400">Formula: Net = Deposits - (Meals + Rent + Utility)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Total Deposits</th>
                <th className="py-3.5 px-4">Meals Count</th>
                <th className="py-3.5 px-4">Meal Expense</th>
                <th className="py-3.5 px-4">Rent Share</th>
                <th className="py-3.5 px-4">Utility Share</th>
                <th className="py-3.5 px-4">Total Cost</th>
                <th className="py-3.5 px-4">Net Settlement Position</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {settlementData.map((item) => (
                <tr key={item.userId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs">
                      {item.username[0]?.toUpperCase()}
                    </div>
                    <span>{item.username}</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-blue-400 text-sm">
                    ৳{item.userDeposits.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-slate-300 font-medium">
                    {item.userMeals} Meals
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    ৳{item.mealCost.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    ৳{item.rentShare.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    ৳{item.utilityShare.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-200">
                    ৳{item.totalCostShare.toLocaleString()}
                  </td>
                  <td className={`py-4 px-4 font-extrabold text-sm ${item.netPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.netPosition >= 0 ? `+৳${item.netPosition.toLocaleString()}` : `-৳${Math.abs(item.netPosition).toLocaleString()}`}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                      item.status === 'refund'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {item.status === 'refund' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{item.status === 'refund' ? 'Get Refund' : 'Owes Money'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
