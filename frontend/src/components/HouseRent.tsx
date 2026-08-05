import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { 
  Home, 
  DollarSign, 
  Users as UsersIcon, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Search, 
  CreditCard,
  Building2,
  PieChart
} from 'lucide-react';

interface RentConfig {
  _id?: string;
  totalRent: number;
}

interface RentPayment {
  _id: string;
  userId: string;
  username?: string;
  amount: number;
  month: string;
  date: string;
  paymentMethod: string;
  note?: string;
}

export const HouseRent: React.FC = () => {
  const queryClient = useQueryClient();

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // State for Edit Total Rent Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newTotalRent, setNewTotalRent] = useState<number | string>(16500);

  // State for Record Payment Form
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [month, setMonth] = useState(
    new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  );
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Filter Search
  const [searchTerm, setSearchTerm] = useState('');

  // 1. TanStack Query: Fetch Members
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

  // 2. TanStack Query: Fetch House Rent Config
  const { data: rentConfig = { totalRent: 16500 }, isLoading: loadingConfig } = useQuery<RentConfig>({
    queryKey: ['houseRentConfig'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/house-rent/config');
        return res.data?.data || { totalRent: 16500 };
      } catch (e) {
        return { totalRent: 16500 };
      }
    },
  });

  React.useEffect(() => {
    if (rentConfig && rentConfig.totalRent) {
      setNewTotalRent(rentConfig.totalRent);
    }
  }, [rentConfig]);

  // 3. TanStack Query: Fetch Rent Payments History
  const { data: payments = [], isLoading: loadingPayments } = useQuery<RentPayment[]>({
    queryKey: ['houseRentPayments'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/house-rent/payments');
        const list = res.data?.data;
        return Array.isArray(list) ? list : [];
      } catch (e) {
        return [];
      }
    },
  });

  // 4. TanStack Mutation: Update Total Rent Settings
  const updateConfigMutation = useMutation({
    mutationFn: async (totalRent: number) => {
      const res = await api.post('/v1/house-rent/config', { totalRent });
      return res.data;
    },
    onSuccess: () => {
      setShowConfigModal(false);
      queryClient.invalidateQueries({ queryKey: ['houseRentConfig'] });
    },
  });

  // 5. TanStack Mutation: Add Rent Payment
  const addPaymentMutation = useMutation({
    mutationFn: async (payload: { userId: string; amount: number; month: string; paymentMethod: string; note: string }) => {
      const res = await api.post('/v1/house-rent/payments', payload);
      if (!res.data.success && res.data.status === false) {
        throw new Error(res.data.message || 'Failed to record payment');
      }
      return res.data;
    },
    onSuccess: () => {
      setMessage('Rent payment recorded successfully!');
      setAmount('');
      setNote('');
      setError('');

      queryClient.invalidateQueries({ queryKey: ['houseRentPayments'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Error recording payment');
    },
  });

  // 6. TanStack Mutation: Delete Rent Payment
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await api.delete(`/v1/house-rent/payments/${paymentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houseRentPayments'] });
    },
  });

  const handleUpdateTotalRent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    updateConfigMutation.mutate(Number(newTotalRent));
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setMessage('');
    setError('');

    addPaymentMutation.mutate({
      userId: selectedUser,
      amount: Number(amount),
      month,
      paymentMethod,
      note,
    });
  };

  const handleDeletePayment = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this rent payment entry?')) return;
    deletePaymentMutation.mutate(id);
  };

  // Rent Division Calculations
  const totalRentAmount = rentConfig?.totalRent || 16500;
  const membersCount = users.length || 1;
  const perPersonRent = Math.round(totalRentAmount / membersCount);

  // Per Member Payment Breakdown Summary for Current Month
  const memberRentBreakdown = useMemo(() => {
    const map = new Map<string, { userId: string; username: string; totalPaid: number }>();

    users.forEach((u) => {
      map.set(u._id, {
        userId: u._id,
        username: u.username || u.email,
        totalPaid: 0,
      });
    });

    payments.forEach((p) => {
      if (p.month.toLowerCase() === month.toLowerCase()) {
        const existing = map.get(p.userId) || {
          userId: p.userId,
          username: p.username || 'Member',
          totalPaid: 0,
        };
        existing.totalPaid += Number(p.amount) || 0;
        map.set(p.userId, existing);
      }
    });

    return Array.from(map.values()).map((item) => {
      const due = perPersonRent - item.totalPaid;
      let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (item.totalPaid >= perPersonRent) {
        status = 'paid';
      } else if (item.totalPaid > 0) {
        status = 'partial';
      }
      return {
        ...item,
        due: Math.max(0, due),
        status,
      };
    });
  }, [users, payments, perPersonRent, month]);

  const totalCollectedThisMonth = useMemo(() => {
    return memberRentBreakdown.reduce((sum, item) => sum + item.totalPaid, 0);
  }, [memberRentBreakdown]);

  const filteredPayments = payments.filter((item) =>
    (item.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.month || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Home className="w-7 h-7 text-emerald-400" />
            House Rent & Division Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin 
              ? 'Manage total monthly house rent, view per-person division, and record member rent payments.' 
              : 'Review total monthly house rent, per-member rent breakdown, and payment status.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all self-start sm:self-auto shadow-md"
          >
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>Edit Total Rent (৳{totalRentAmount.toLocaleString()})</span>
          </button>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total House Rent Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total House Rent</span>
            <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">৳{totalRentAmount.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 font-medium mt-1">Configured for your mess</p>
        </div>

        {/* Total Members Count Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Members</span>
            <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <UsersIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{membersCount} Members</p>
          <p className="text-xs text-blue-400 font-medium mt-1">Dividing total rent equally</p>
        </div>

        {/* Calculated Per-Person Rent Share */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rent Per Person</span>
            <div className="p-2 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-3">৳{perPersonRent.toLocaleString()}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">৳{totalRentAmount.toLocaleString()} ÷ {membersCount} Members</p>
        </div>

        {/* Collected This Month Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Collected ({month})</span>
            <div className="p-2 bg-teal-600/10 border border-teal-500/20 text-teal-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-teal-400 mt-3">৳{totalCollectedThisMonth.toLocaleString()}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {totalRentAmount > 0 ? `${Math.min(100, Math.round((totalCollectedThisMonth / totalRentAmount) * 100))}% of Total Rent` : '0%'}
          </p>
        </div>
      </div>

      {/* Per-Member Rent Status Breakdown Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Member Rent Division & Payment Status ({month})
            </h3>
            <p className="text-xs text-slate-400">Individual member rent share, amount paid, and due status</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. August 2026"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Rent Share</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Due Balance</th>
                <th className="py-3 px-4">Payment Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Quick Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {memberRentBreakdown.map((item) => (
                <tr key={item.userId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs">
                      {item.username[0]?.toUpperCase()}
                    </div>
                    <span>{item.username}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    ৳{perPersonRent.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-400">
                    ৳{item.totalPaid.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-rose-400">
                    ৳{item.due.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                      item.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : item.status === 'partial'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {item.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                      {item.status === 'partial' && <Clock className="w-3 h-3" />}
                      {item.status === 'unpaid' && <AlertCircle className="w-3 h-3" />}
                      <span>{item.status}</span>
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(item.userId);
                          setAmount(item.due > 0 ? item.due : perPersonRent);
                        }}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg transition-all text-[11px] font-semibold border border-emerald-500/30"
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

      {/* Main Content: Record Payment Form + Payment History Table */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        {/* Record Rent Payment Form (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-lg">Record Rent Payment</h2>
            </div>

            {message && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Member</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Amount (৳)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={`e.g. ${perPersonRent}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Month & Year</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="August 2026"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Note / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="Txn ID or memo"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={addPaymentMutation.isPending}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {addPaymentMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Record Rent Payment'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Rent Payments Log History Table */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} glass-card p-6 rounded-2xl border border-slate-800 space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Rent Payment History</h3>
              <p className="text-xs text-slate-400">Complete log of all member house rent payments</p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search member or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loadingPayments ? (
            <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Fetching rent payment history...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No rent payment entries found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">For Month</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Date</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPayments.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.username || 'Member'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-400">
                        ৳{Number(item.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700">
                          {item.month}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {item.paymentMethod || 'Cash'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeletePayment(item._id)}
                            disabled={deletePaymentMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete entry"
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
          )}
        </div>
      </div>

      {/* EDIT TOTAL RENT MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Change Total House Rent</h3>
                <p className="text-xs text-slate-400">Set overall monthly mess house rent amount</p>
              </div>
            </div>

            <form onSubmit={handleUpdateTotalRent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Total Monthly Rent (৳)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTotalRent}
                    onChange={(e) => setNewTotalRent(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Currently ৳{newTotalRent || 0} ÷ {membersCount} Members = <span className="text-emerald-400 font-bold">৳{Math.round(Number(newTotalRent || 0) / membersCount).toLocaleString()} / person</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Save Rent Amount'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
