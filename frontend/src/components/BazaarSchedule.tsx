import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { 
  ShoppingBag, 
  Calendar, 
  User as UserIcon, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';

interface BazaarDuty {
  _id: string;
  userId: string;
  username?: string;
  date: string;
  assignedBy?: string;
  note?: string;
  isCompleted: boolean;
}

export const BazaarSchedule: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const [selectedUser, setSelectedUser] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  // 1. Fetch Users
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

  // 2. Fetch Duties
  const { data: duties = [], isLoading } = useQuery<BazaarDuty[]>({
    queryKey: ['bazaarDuties'],
    queryFn: async () => {
      try {
        const res = await api.get('/v1/bazaar-schedule');
        const list = res.data?.data;
        return Array.isArray(list) ? list : [];
      } catch (e) { return []; }
    },
  });

  // 3. Mutations
  const addDutyMutation = useMutation({
    mutationFn: async (payload: { userId: string; date: string; note: string }) => {
      const res = await api.post('/v1/bazaar-schedule', payload);
      return res.data;
    },
    onSuccess: () => {
      setMessage('Bazaar duty scheduled successfully!');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['bazaarDuties'] });
    },
  });

  const toggleDutyMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const res = await api.put(`/v1/bazaar-schedule/${id}`, { isCompleted });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bazaarDuties'] });
    },
  });

  const deleteDutyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/v1/bazaar-schedule/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bazaarDuties'] });
    },
  });

  const handleAddDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    addDutyMutation.mutate({ userId: selectedUser, date, note });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <ShoppingBag className="w-7 h-7 text-teal-400" />
          Bazaar & Market Duty Schedule
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Assign daily market shopping duties to members on a rotating schedule.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        {/* Form Card (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start">
            <h3 className="font-bold text-white text-lg border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-400" />
              Schedule Bazaar Duty
            </h3>

            {message && <div className="p-3 mb-4 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs">{message}</div>}

            <form onSubmit={handleAddDuty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assign Member</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Market Duty Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Shopping Items Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rice 10kg, Chicken, Vegetables"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={addDutyMutation.isPending}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-teal-600/30"
              >
                Schedule Duty
              </button>
            </form>
          </div>
        )}

        {/* Schedule List */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} glass-card p-6 rounded-2xl border border-slate-800`}>
          <h3 className="font-bold text-white text-lg mb-4">Upcoming Bazaar Duty Schedule</h3>
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading schedule...</div>
          ) : duties.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No bazaar duties scheduled yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {duties.map((duty) => (
                <div key={duty._id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDutyMutation.mutate({ id: duty._id, isCompleted: !duty.isCompleted })}
                      className={`p-1.5 rounded-lg border transition-all ${
                        duty.isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                      title={duty.isCompleted ? 'Mark as Pending' : 'Mark as Done'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div>
                      <p className={`text-sm font-bold ${duty.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                        {duty.username}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        {new Date(duty.date).toLocaleDateString()} {duty.note && `• ${duty.note}`}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => deleteDutyMutation.mutate(duty._id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
