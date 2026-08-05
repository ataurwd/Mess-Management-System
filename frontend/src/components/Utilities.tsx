import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { 
  Zap, 
  Flame, 
  Wifi, 
  UserCheck, 
  Droplet, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  DollarSign, 
  Calendar,
  CreditCard,
  PieChart
} from 'lucide-react';

interface UtilityBill {
  _id: string;
  title: string;
  amount: number;
  month: string;
  date: string;
}

interface UtilityPayment {
  _id: string;
  userId: string;
  username?: string;
  amount: number;
  month: string;
  date: string;
  paymentMethod: string;
  note?: string;
}

export const Utilities: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Add Bill Form State
  const [title, setTitle] = useState('Electricity Bill');
  const [billAmount, setBillAmount] = useState<number | string>('');
  const [month, setMonth] = useState(
    new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Record Payment Form State
  const [selectedUser, setSelectedUser] = useState('');
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNote, setPayNote] = useState('');

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');

  // 1. TanStack Query: Fetch Users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/v1/user/getUsers');
      return res.data?.data || [];
    },
  });

  React.useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]._id);
    }
  }, [users, selectedUser]);

  // 2. TanStack Query: Fetch Utility Bills
  const { data: bills = [], isLoading: loadingBills } = useQuery<UtilityBill[]>({
    queryKey: ['utilityBills'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/utility/bills');
        const list = res.data?.data;
        return Array.isArray(list) ? list : [];
      } catch (e) { return []; }
    },
  });

  // 3. TanStack Query: Fetch Utility Payments
  const { data: payments = [], isLoading: loadingPayments } = useQuery<UtilityPayment[]>({
    queryKey: ['utilityPayments'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/utility/payments');
        const list = res.data?.data;
        return Array.isArray(list) ? list : [];
      } catch (e) { return []; }
    },
  });

  // 4. Mutations
  const addBillMutation = useMutation({
    mutationFn: async (payload: { title: string; amount: number; month: string }) => {
      const res = await api.post('/v1/utility/bills', payload);
      return res.data;
    },
    onSuccess: () => {
      setMessage('Utility bill recorded successfully!');
      setBillAmount('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['utilityBills'] });
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/v1/utility/bills/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilityBills'] });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (payload: { userId: string; amount: number; month: string; paymentMethod: string; note: string }) => {
      const res = await api.post('/v1/utility/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      setMessage('Member utility payment recorded!');
      setPayAmount('');
      setPayNote('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['utilityPayments'] });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/v1/utility/payments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilityPayments'] });
    },
  });

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    addBillMutation.mutate({ title, amount: Number(billAmount), month });
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    addPaymentMutation.mutate({
      userId: selectedUser,
      amount: Number(payAmount),
      month,
      paymentMethod: payMethod,
      note: payNote,
    });
  };

  // Calculations
  const membersCount = users.length || 1;
  const totalBillsThisMonth = useMemo(() => {
    return bills
      .filter((b) => b.month.toLowerCase() === month.toLowerCase())
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [bills, month]);

  const perPersonUtility = Math.round(totalBillsThisMonth / membersCount);

  const memberBreakdown = useMemo(() => {
    const map = new Map<string, { userId: string; username: string; paid: number }>();
    users.forEach((u) => map.set(u._id, { userId: u._id, username: u.username || u.email, paid: 0 }));

    payments.forEach((p) => {
      if (p.month.toLowerCase() === month.toLowerCase()) {
        const existing = map.get(p.userId) || { userId: p.userId, username: p.username || 'Member', paid: 0 };
        existing.paid += Number(p.amount) || 0;
        map.set(p.userId, existing);
      }
    });

    return Array.from(map.values()).map((item) => {
      const due = perPersonUtility - item.paid;
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (item.paid >= perPersonUtility && perPersonUtility > 0) status = 'paid';
      else if (item.paid > 0) status = 'partial';
      return { ...item, due: Math.max(0, due), status };
    });
  }, [users, payments, perPersonUtility, month]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-amber-400" />
            Utility Bills & Per-Person Division
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track Electricity, Gas, Wi-Fi, Water & Maid Salary with equal per-member division.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Total Utilities ({month})</span>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">৳{totalBillsThisMonth.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Sum of all bills for this month</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Utility Cost Per Member</span>
          <p className="text-3xl font-extrabold text-teal-400 mt-2">৳{perPersonUtility.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">৳{totalBillsThisMonth.toLocaleString()} ÷ {membersCount} Members</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Active Bills Count</span>
          <p className="text-3xl font-extrabold text-blue-400 mt-2">{bills.length} Bills</p>
          <p className="text-xs text-slate-400 mt-1">Electricity, Gas, Wi-Fi, Maid</p>
        </div>
      </div>

      {/* Member Breakdown Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            Member Utility Division ({month})
          </h3>
          <input
            type="text"
            placeholder="Month e.g. August 2026"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Utility Share</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Due Balance</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Quick Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {memberBreakdown.map((item) => (
                <tr key={item.userId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs">
                      {item.username[0]?.toUpperCase()}
                    </div>
                    <span>{item.username}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    ৳{perPersonUtility.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-400">
                    ৳{item.paid.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-rose-400">
                    ৳{item.due.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'partial'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(item.userId);
                          setPayAmount(item.due > 0 ? item.due : perPersonUtility);
                        }}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-[11px] font-semibold border border-amber-500/30"
                      >
                        Record Payment
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms & Tables Section */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        {/* Record Utility Bill Form (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start space-y-4">
            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Utility Bill
            </h3>

            {message && <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs">{message}</div>}

            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Bill Type</label>
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="Electricity Bill">Electricity Bill ⚡</option>
                  <option value="Gas Bill">Gas Bill 🔥</option>
                  <option value="Wi-Fi Internet">Wi-Fi Internet 📶</option>
                  <option value="Maid / Cook Salary">Maid / Cook Salary 🧹</option>
                  <option value="Water Bill">Water Bill 💧</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Amount (৳)</label>
                <input
                  type="number"
                  required
                  placeholder="2400"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold">Month</label>
                <input
                  type="text"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={addBillMutation.isPending}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs"
              >
                Add Utility Bill
              </button>
            </form>
          </div>
        )}

        {/* Bills Log Table */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} glass-card p-6 rounded-2xl border border-slate-800`}>
          <h3 className="font-bold text-white text-lg mb-4">Utility Bills Log History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-3 px-4">Bill Title</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">For Month</th>
                  <th className="py-3 px-4">Date</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bills.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-white">{item.title}</td>
                    <td className="py-3.5 px-4 font-extrabold text-amber-400">৳{Number(item.amount).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-300">{item.month}</td>
                    <td className="py-3.5 px-4 text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteBillMutation.mutate(item._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
