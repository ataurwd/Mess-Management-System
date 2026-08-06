import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { 
  UtensilsCrossed, 
  Plus, 
  Calendar, 
  User as UserIcon, 
  CheckCircle2, 
  ListFilter, 
  Trash2, 
  Search, 
  RefreshCw,
  PieChart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Filter,
  XCircle
} from 'lucide-react';

interface MealLogItem {
  _id: string;
  userId: string;
  username?: string;
  numberOfMeal: number;
  date: string;
}

type SortField = 'date' | 'name' | 'meals';
type SortOrder = 'asc' | 'desc';

export const Meals: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const isSummaryView = location.pathname.includes('/summary');
  const isListView = location.pathname.includes('/list') || (!isAdmin && !isSummaryView);

  // Input States for Log Meal Form
  const [selectedUser, setSelectedUser] = useState('');
  const [numberOfMeal, setNumberOfMeal] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Filter States
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  // 2. TanStack Query: Fetch Meals
  const { data: mealsList = [], isLoading: fetchingList } = useQuery<MealLogItem[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const res = await api.get('/v1/meal/getMeals');
      const list = res.data?.data;
      return Array.isArray(list) ? list : [];
    },
  });

  // 3. TanStack Query: Fetch Current Meal Rate for Summary calculations
  const { data: mealRate = 0 } = useQuery<number>({
    queryKey: ['mealRate'],
    queryFn: async () => {
      const res = await api.get('/v1/meal/mealRateInMonth');
      const val = res.data?.data?.mealRate || res.data?.data;
      return typeof val === 'number' ? val : (parseFloat(val) || 0);
    },
  });

  // 4. TanStack Mutation: Add Meal
  const addMealMutation = useMutation({
    mutationFn: async (payload: { userId: string; numberOfMeal: number; date: string }) => {
      const res = await api.post('/v1/meal/addMeal', payload);
      if (!res.data.success && res.data.status === false) {
        throw new Error(res.data.message || 'Failed to add meal');
      }
      return res.data;
    },
    onSuccess: () => {
      setMessage('Meal entry logged successfully!');
      setNumberOfMeal(1);
      setError('');

      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mealRate'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Error submitting meal');
    },
  });

  // 5. TanStack Mutation: Delete Meal
  const deleteMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      const res = await api.delete(`/v1/meal/deleteMeal/${mealId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mealRate'] });
    },
  });

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setMessage('');
    setError('');

    addMealMutation.mutate({
      userId: selectedUser,
      numberOfMeal: Number(numberOfMeal),
      date: new Date(date).toISOString(),
    });
  };

  const handleDeleteMeal = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this meal entry?')) return;
    deleteMealMutation.mutate(id);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setFilterUserId('');
    setFilterDate('');
    setSearchTerm('');
  };

  const isFilterActive = filterUserId !== '' || filterDate !== '' || searchTerm !== '';

  // Filtered and Sorted Meals List for History View
  const sortedAndFilteredMeals = useMemo(() => {
    const filtered = mealsList.filter((item) => {
      if (filterUserId && item.userId !== filterUserId) {
        return false;
      }
      if (filterDate) {
        const itemDateStr = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
        if (itemDateStr !== filterDate) {
          return false;
        }
      }
      if (searchTerm && !(item.username || '').toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = (a.username || '').localeCompare(b.username || '');
      } else if (sortField === 'meals') {
        comparison = a.numberOfMeal - b.numberOfMeal;
      } else {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [mealsList, filterUserId, filterDate, searchTerm, sortField, sortOrder]);

  // Aggregated Total Meals per Member Summary
  const userMealSummary = useMemo(() => {
    const map = new Map<string, { userId: string; username: string; totalMeals: number; entryCount: number }>();

    const targetUsers = filterUserId ? users.filter(u => u._id === filterUserId) : users;
    targetUsers.forEach((u) => {
      map.set(u._id, {
        userId: u._id,
        username: u.username || u.email,
        totalMeals: 0,
        entryCount: 0,
      });
    });

    mealsList.forEach((m) => {
      if (filterUserId && m.userId !== filterUserId) return;
      if (filterDate) {
        const itemDateStr = m.date ? new Date(m.date).toISOString().split('T')[0] : '';
        if (itemDateStr !== filterDate) return;
      }

      const existing = map.get(m.userId) || {
        userId: m.userId,
        username: m.username || 'Member',
        totalMeals: 0,
        entryCount: 0,
      };
      existing.totalMeals += Number(m.numberOfMeal) || 0;
      existing.entryCount += 1;
      map.set(m.userId, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalMeals - a.totalMeals);
  }, [users, mealsList, filterUserId, filterDate]);

  const grandTotalMeals = useMemo(() => {
    return userMealSummary.reduce((sum, item) => sum + item.totalMeals, 0);
  }, [userMealSummary]);

  const recentMeals = [...mealsList].reverse().slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Header + Sub Route Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daily Meal Log & Member Summary</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin ? 'Filter by Date or Member, sort history, and manage meal entries.' : 'View daily meal logs and total meal count summaries per member.'}
          </p>
        </div>

        {/* Sub-route Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 self-start lg:self-auto">
          {isAdmin && (
            <button
              onClick={() => navigate('/meals')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                !isListView && !isSummaryView
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Log Meal Entry</span>
            </button>
          )}

          <button
            onClick={() => navigate('/meals/list')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isListView
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>All Meal Logs ({mealsList.length})</span>
          </button>

          <button
            onClick={() => navigate('/meals/summary')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isSummaryView
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Total Meal Summary</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LOG MEAL ENTRY (Admin Only) */}
      {!isListView && !isSummaryView && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card */}
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-lg">Add Meal Entry</h2>
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

            <form onSubmit={handleAddMeal} className="space-y-4">
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">Number of Meals</label>
                <div className="relative">
                  <UtensilsCrossed className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    required
                    value={numberOfMeal}
                    onChange={(e) => setNumberOfMeal(parseFloat(e.target.value))}
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
                disabled={addMealMutation.isPending || users.length === 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {addMealMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Real-time...</span>
                  </>
                ) : (
                  'Save Meal Entry'
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-lg mb-2">Real-Time Meal Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Meal counts logged here automatically update monthly total meals and cost-per-meal calculations across the system.
              </p>

              <div className="grid grid-cols-1 gap-6">
                {/* Recent Meals */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-400" /> Recent Meals
                  </h4>
                  <div className="space-y-3">
                    {recentMeals.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">No meals found.</p>
                    ) : (
                      recentMeals.map((meal) => (
                        <div key={meal._id} className="flex justify-between items-center text-xs">
                          <div>
                            <p className="text-white font-medium">{meal.username || 'Member'}</p>
                            <p className="text-slate-500 text-[10px]">{new Date(meal.date).toLocaleDateString()}</p>
                          </div>
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                            {meal.numberOfMeal} meals
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
      )}

      {/* VIEW 2: ALL MEAL LOGS WITH DATE & USER DROPDOWN FILTERS */}
      {isListView && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">All Meal Logs History</h3>
                <p className="text-xs text-slate-400">Filter by specific member dropdown, specific date, or sort by date/meals</p>
              </div>
            </div>

            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="self-start lg:self-auto px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* FILTER CONTROLS BAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                Filter Member
              </label>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All Members ({users.length})</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Filter Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                Search
              </label>
              <input
                type="text"
                placeholder="Search member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                Sort By
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="date">Date</option>
                  <option value="name">Member Name</option>
                  <option value="meals">Meals Count</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 transition-all shrink-0"
                  title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 text-blue-400" /> : <ArrowDown className="w-4 h-4 text-blue-400" />}
                </button>
              </div>
            </div>
          </div>

          {fetchingList ? (
            <div className="text-center py-12 text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Fetching live meal logs...</span>
            </div>
          ) : sortedAndFilteredMeals.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm space-y-2">
              <p>No meal logs found matching your selected filters.</p>
              {isFilterActive && (
                <button onClick={clearFilters} className="text-xs text-blue-400 hover:underline">
                  Reset filters to view all entries
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                      Member Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('meals')}>
                      Meals Count {sortField === 'meals' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>
                      Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedAndFilteredMeals.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.username || 'Member'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-blue-400">
                        {item.numberOfMeal} Meals
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteMeal(item._id)}
                            disabled={deleteMealMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete meal entry"
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

      {/* VIEW 3: MEMBER MEAL SUMMARY TAB */}
      {isSummaryView && (
        <div className="space-y-6">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-400">Filter Summary:</span>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">All Members ({users.length})</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline self-start sm:self-auto"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-400">Grand Total Mess Meals</span>
              <p className="text-3xl font-extrabold text-white mt-2">{grandTotalMeals} Meals</p>
              <p className="text-xs text-blue-400 font-medium mt-1">Accumulated across selected criteria</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-400">Current Cost Per Meal</span>
              <p className="text-3xl font-extrabold text-amber-400 mt-2">৳{mealRate.toFixed(2)}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Based on monthly bazaar expenses</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold uppercase text-slate-400">Filtered Members Count</span>
              <p className="text-3xl font-extrabold text-emerald-400 mt-2">{userMealSummary.length} Members</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">Showing active meals summary</p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-white text-lg">Member-wise Total Meals Breakdown</h3>
                <p className="text-xs text-slate-400">Total accumulated meals per user and estimated meal expenses</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Total Meals</th>
                    <th className="py-3 px-4">% of Total Meals</th>
                    <th className="py-3 px-4">Est. Meal Expense</th>
                    <th className="py-3 px-4 text-right">Logs Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {userMealSummary.map((item) => {
                    const percentage = grandTotalMeals > 0 ? ((item.totalMeals / grandTotalMeals) * 100).toFixed(1) : '0';
                    const estimatedExpense = (item.totalMeals * mealRate).toFixed(2);
                    return (
                      <tr key={item.userId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                            {item.username[0]?.toUpperCase()}
                          </div>
                          <span>{item.username}</span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-blue-400 text-sm">
                          {item.totalMeals} Meals
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                              ></div>
                            </div>
                            <span>{percentage}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-400">
                          ৳{Number(estimatedExpense).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400">
                          {item.entryCount} entries
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
