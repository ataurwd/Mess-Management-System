import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User, Category } from '../types';
import { getCurrentUser } from '../utils/auth';
import { Wallet, Plus, Calendar, User as UserIcon, CheckCircle2, DollarSign, Tags, ListFilter, Trash2, Search, RefreshCw, ShieldAlert } from 'lucide-react';

interface DepositItem {
  _id: string;
  userId: string;
  username?: string;
  category?: string;
  amount: number;
  date: string;
}

export const Balances: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isListView = location.pathname.includes('/list') || !isAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  // 2. TanStack Query: Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/v1/category/getCategory');
      const list = res.data?.data;
      return Array.isArray(list) ? list : [];
    },
  });

  // 3. TanStack Query: Fetch All Deposits
  const { data: depositsList = [], isLoading: fetchingList } = useQuery<DepositItem[]>({
    queryKey: ['deposits'],
    queryFn: async () => {
      const res = await api.get('/v1/balance/getBalances');
      const list = res.data?.data;
      return Array.isArray(list) ? list : [];
    },
  });

  // 4. TanStack Mutation: Add Deposit
  const addDepositMutation = useMutation({
    mutationFn: async (payload: { userId: string; amount: number; date: string; categoryId?: string }) => {
      const res = await api.post('/v1/balance/addBalance', payload);
      if (!res.data.success && res.data.status === false) {
        throw new Error(res.data.message || 'Failed to record deposit');
      }
      return res.data;
    },
    onSuccess: () => {
      setMessage('Member deposit recorded successfully!');
      setAmount('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Error recording deposit');
    },
  });

  // 5. TanStack Mutation: Delete Deposit
  const deleteDepositMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const res = await api.delete(`/v1/balance/deleteBalance/${depositId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleAddBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setMessage('');
    setError('');

    addDepositMutation.mutate({
      userId: selectedUser,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      categoryId: selectedCategory || undefined,
    });
  };

  const handleDeleteDeposit = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this deposit entry?')) return;
    deleteDepositMutation.mutate(id);
  };

  const filteredDeposits = depositsList.filter((item) =>
    (item.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentDeposits = [...depositsList].reverse().slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Header + Sub Route Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Member Deposits & Balances</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin ? 'Record advance money deposits and view transaction history.' : 'View complete mess deposits and member balance history.'}
          </p>
        </div>

        {/* Sub-route Navigation Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {isAdmin && (
            <button
              onClick={() => navigate('/balances')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                !isListView
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Record Deposit</span>
            </button>
          )}

          <button
            onClick={() => navigate('/balances/list')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isListView
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>All Deposits History ({depositsList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content: Form for Admin vs List View for Members */}
      {!isListView && isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Record Deposit Form */}
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-lg">Record Deposit</h2>
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

            <form onSubmit={handleAddBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Member</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username ? u.username.charAt(0).toUpperCase() + u.username.slice(1) : u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Deposit Amount (৳)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category (Optional)</label>
                <div className="relative">
                  <Tags className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None / General Deposit</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Deposit Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addDepositMutation.isPending || users.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {addDepositMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Real-time...</span>
                  </>
                ) : (
                  'Record Deposit'
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-lg mb-2">Manager Deposit Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                As a Mess Manager/Admin, you can record funds received from members. Standard members can view all deposits in real time.
              </p>

              <div className="grid grid-cols-1 gap-6">
                {/* Recent Deposits */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Wallet className="w-4 h-4 text-blue-400" /> Recent Deposits
                  </h4>
                  <div className="space-y-3">
                    {recentDeposits.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">No deposits found.</p>
                    ) : (
                      recentDeposits.map((dep) => (
                        <div key={dep._id} className="flex justify-between items-center text-xs">
                          <div>
                            <p className="text-white font-medium">{dep.username || 'Member'}</p>
                            <p className="text-slate-500 text-[10px]">{new Date(dep.date || new Date()).toLocaleDateString()}</p>
                          </div>
                          <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">
                            ৳{Number(dep.amount).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* All Deposits Table View for All Users */
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">All Deposits History</h3>
                <p className="text-xs text-slate-400">Complete log of all member deposits</p>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search member or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {fetchingList ? (
            <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Fetching live deposit history...</span>
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No deposit records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDeposits.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.username || 'Member'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700">
                          {item.category || 'General Deposit'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-400">
                        ৳{Number(item.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteDeposit(item._id)}
                            disabled={deleteDepositMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete deposit"
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
      )}
    </div>
  );
};
