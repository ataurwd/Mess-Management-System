import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { Users, UserPlus, Trash2, Mail, Phone, Lock, CheckCircle2, RefreshCw, Edit3, X, Save } from 'lucide-react';

export const Members: React.FC = () => {
  const queryClient = useQueryClient();

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Add Member State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editPassword, setEditPassword] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');

  // 1. TanStack Query: Fetch Members
  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/v1/user/getUsers');
      return res.data?.data || [];
    },
  });

  // 2. TanStack Mutation: Add Member
  const addMemberMutation = useMutation({
    mutationFn: async (payload: { username: string; email: string; password: string; phone: string; role: string }) => {
      const res = await api.post('/v1/user/addUser', payload);
      if (!res.data.success && res.data.status === false) {
        throw new Error(res.data.message || 'Failed to add member');
      }
      return res.data;
    },
    onSuccess: () => {
      setMessage('New member added to your Mess!');
      setUsername('');
      setEmail('');
      setPassword('');
      setPhone('');
      setError('');

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Error creating user');
    },
  });

  // 3. TanStack Mutation: Edit Member
  const editMemberMutation = useMutation({
    mutationFn: async ({ userId, payload }: { userId: string; payload: any }) => {
      const res = await api.patch('/v1/user/updateProfile', { userId, ...payload });
      if (!res.data.success && res.data.status === false) {
        throw new Error(res.data.message || 'Failed to update member');
      }
      return res.data;
    },
    onSuccess: () => {
      setEditMessage('Member updated successfully!');
      setEditError('');

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      setTimeout(() => {
        setEditingUser(null);
        setEditMessage('');
      }, 1000);
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.message || err.message || 'Error updating member');
    },
  });

  // 4. TanStack Mutation: Remove Member
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/v1/user/removeUser/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setMessage('');
    setError('');

    addMemberMutation.mutate({
      username,
      email,
      password,
      phone,
      role,
    });
  };

  const handleOpenEditModal = (member: User) => {
    setEditingUser(member);
    setEditUsername(member.username || '');
    setEditEmail(member.email || '');
    setEditPhone(member.phone || '');
    setEditRole(member.role === 'admin' ? 'admin' : 'user');
    setEditPassword('');
    setEditMessage('');
    setEditError('');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !isAdmin) return;

    editMemberMutation.mutate({
      userId: editingUser._id,
      payload: {
        username: editUsername,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        password: editPassword.trim() || undefined,
      },
    });
  };

  const handleRemove = (userId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to remove this member from your mess?')) return;
    removeMemberMutation.mutate(userId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Mess Members Directory</h1>
        <p className="text-sm text-slate-400 mt-1">
          {isAdmin ? 'Add, edit details, and manage accounts for all members living in your mess.' : 'Directory of all active members registered in your mess.'}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        {/* Add Member Form (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-lg">Add New Member</h2>
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

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Tanvir Ahmed"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="tanvir@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="01712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="user">Standard Member</option>
                  <option value="admin">Mess Manager / Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addMemberMutation.isPending}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {addMemberMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Adding Real-time...</span>
                  </>
                ) : (
                  'Add Member'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Member Directory Grid */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-4`}>
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Current Members ({members.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-12 text-slate-400 text-sm">Loading members...</div>
            ) : members.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No members registered in this mess yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.map((m) => (
                  <div key={m._id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                          {m.username ? m.username[0].toUpperCase() : 'M'}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{m.username}</h4>
                          <p className="text-xs text-slate-400">{m.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${m.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {m.role || 'user'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                      <span className="text-xs text-slate-500">{m.phone || 'No phone'}</span>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Edit member details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(m._id)}
                            disabled={removeMemberMutation.isPending}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MEMBER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Edit Member Account</h3>
                  <p className="text-xs text-slate-400">Update details for {editingUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMessage && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editMessage}</span>
              </div>
            )}

            {editError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="user">Standard Member</option>
                  <option value="admin">Mess Manager / Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Reset Password <span className="text-slate-500 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  placeholder="New password (optional)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMemberMutation.isPending}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {editMemberMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
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
