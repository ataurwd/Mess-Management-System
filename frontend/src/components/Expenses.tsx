import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User, Category } from '../types';
import { getCurrentUser } from '../utils/auth';
import { Receipt, Plus, Calendar, User as UserIcon, CheckCircle2, DollarSign, Tags, FileText, ListFilter, Trash2, Search, RefreshCw, UtensilsCrossed, Wallet } from 'lucide-react';

interface ExpenseItem {
  _id: string;
  userId: string;
  username?: string;
  category?: string;
  summary?: string;
  itemDetails?: string;
  amount: number;
  date: string;
}

export const Expenses: React.FC = () => {
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
  const [itemDetails, setItemDetails] = useState('');
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

  // 3. TanStack Query: Fetch Expenses
  const { data: expensesList = [], isLoading: fetchingList } = useQuery<ExpenseItem[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/v1/expense/getExpenses');
      const list = res.data?.data;
      return Array.isArray(list) ? list : [];
    },
  });



  // 4. TanStack Mutation: Add Expense
  const addExpenseMutation = useMutation({
    mutationFn: async (payload: { userId: string; amount: number; date: string; categoryId?: string; itemDetails: string; summary: string }) => {
      const res = await api.post('/v1/expense/addExpense', payload);
      if (!res.data.success && res.data.status === false) {
        throw new Error(res.data.message || 'Failed to record expense');
      }
      return res.data;
    },
    onSuccess: () => {
      setMessage('Mess expense recorded successfully!');
      setAmount('');
      setItemDetails('');
      setError('');

      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Error saving expense');
    },
  });

  // 5. TanStack Mutation: Delete Expense
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const res = await api.delete(`/v1/expense/deleteExpense/${expenseId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setMessage('');
    setError('');

    addExpenseMutation.mutate({
      userId: selectedUser,
      amount: Number(amount),
      date: new Date(date).toISOString(),
      categoryId: selectedCategory || undefined,
      itemDetails,
      summary: itemDetails,
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    deleteExpenseMutation.mutate(id);
  };

  const filteredExpenses = expensesList.filter((item) =>
    (item.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.summary || item.itemDetails || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentExpenses = [...expensesList].reverse().slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Header + Sub Route Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mess Expenses (Bazaar & Utilities)</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin ? 'Log daily mess expenditures and review complete expense records.' : 'Review complete mess expenditure records and bazaar history.'}
          </p>
        </div>

        {/* Sub-route Navigation Pills */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {isAdmin && (
            <button
              onClick={() => navigate('/expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                !isListView
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          )}

          <button
            onClick={() => navigate('/expenses/list')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isListView
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>All Expenses History ({expensesList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content: Add Expense vs Expenses List */}
      {!isListView && isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Record Expense Form */}
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-2 bg-rose-600/10 border border-rose-500/20 rounded-xl text-rose-400">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-lg">Add Expense</h2>
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

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Purchased / Recorded By</label>
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">Expense Amount (৳)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="850"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Expense Category</label>
                <div className="relative">
                  <Tags className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">General Expense</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Item Details / Memo</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Rice, Fish, Chicken & Oil"
                    value={itemDetails}
                    onChange={(e) => setItemDetails(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
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
                disabled={addExpenseMutation.isPending || users.length === 0}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {addExpenseMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Real-time...</span>
                  </>
                ) : (
                  'Record Expense'
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-lg mb-3">Expenses & Meal Rate Calculation</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                As Mess Manager, every expense logged here adjusts the live meal rate across the system.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* Recent Expenses */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Receipt className="w-4 h-4 text-rose-400" /> Recent Expenses
                  </h4>
                  <div className="space-y-3">
                    {recentExpenses.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">No expenses found.</p>
                    ) : (
                      recentExpenses.map((exp) => (
                        <div key={exp._id} className="flex justify-between items-center text-xs">
                          <div className="truncate pr-2">
                            <p className="text-white font-medium truncate">{exp.summary || exp.itemDetails || 'Expense'}</p>
                            <p className="text-slate-500 text-[10px]">{new Date(exp.date).toLocaleDateString()}</p>
                          </div>
                          <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded shrink-0">
                            ৳{Number(exp.amount).toLocaleString()}
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
        /* All Expenses Table View for All Users */
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">All Expenses History</h3>
                <p className="text-xs text-slate-400">Complete log of all mess expenditures</p>
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search memo or member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {fetchingList ? (
            <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
              <span>Fetching live expense history...</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No expense records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Item Details / Memo</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExpenses.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.username || 'Member'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700">
                          {item.category || 'General Expense'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {item.summary || item.itemDetails || 'Grocery / Bazaar'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-rose-400">
                        ৳{Number(item.amount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(item._id)}
                            disabled={deleteExpenseMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete expense"
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
