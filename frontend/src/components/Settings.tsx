import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { getCurrentUser } from '../utils/auth';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  Settings as SettingsIcon,
  KeyRound,
  UserCircle,
  BadgeCheck,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  // ─── Profile State ────────────────────────────────────────────
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // ─── Password State ───────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  // ─── Fetch live profile ───────────────────────────────────────
  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const res = await api.get('/v1/user/getProfile');
      return res.data?.data || null;
    },
  });

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // ─── Update Profile Mutation ──────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { username: string; email: string; phone: string }) => {
      const res = await api.patch('/v1/user/updateProfile', payload);
      if (res.data?.status === false) throw new Error(res.data.message || 'Update failed');
      return res.data;
    },
    onSuccess: (data) => {
      setProfileMsg('Profile updated successfully!');
      setProfileErr('');
      // Refresh cached user everywhere
      const updated = data?.data || {};
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updated }));
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setTimeout(() => setProfileMsg(''), 4000);
    },
    onError: (err: any) => {
      setProfileErr(err.response?.data?.message || err.message || 'Failed to update profile');
    },
  });

  // ─── Change Password Mutation ─────────────────────────────────
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { oldPassword: string; newPassword: string }) => {
      const res = await api.patch('/v1/user/changePassword', payload);
      if (res.data?.status === false || !res.data?.success) {
        throw new Error(res.data?.message || 'Password change failed');
      }
      return res.data;
    },
    onSuccess: () => {
      setPassMsg('Password changed successfully!');
      setPassErr('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassMsg(''), 4000);
    },
    onError: (err: any) => {
      setPassErr(err.response?.data?.message || err.message || 'Incorrect current password');
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setProfileErr('Username cannot be empty');
    if (!email.trim()) return setProfileErr('Email cannot be empty');
    setProfileMsg('');
    setProfileErr('');
    updateProfileMutation.mutate({ username: username.trim(), email: email.trim(), phone: phone.trim() });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) return setPassErr('Please enter your current password');
    if (newPassword.length < 6) return setPassErr('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setPassErr('Passwords do not match');
    setPassMsg('');
    setPassErr('');
    changePasswordMutation.mutate({ oldPassword, newPassword });
  };

  const passwordStrength = (pw: string) => {
    if (!pw) return { label: '', color: '', width: '0%' };
    if (pw.length < 6) return { label: 'Weak', color: 'bg-rose-500', width: '25%' };
    if (pw.length < 8) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    return { label: 'Good', color: 'bg-teal-500', width: '75%' };
  };

  const strength = passwordStrength(newPassword);
  const avatarLetter = (username || profile?.username || 'U')[0]?.toUpperCase();

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-slateald-400" />
            Account Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Update your personal information and manage your account password.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading your profile...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Profile Card ── */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center space-y-4">
              <div className="relative inline-block mx-auto">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-4xl flex items-center justify-center shadow-xl shadow-emerald-600/20 mx-auto">
                  {avatarLetter}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 ${profile?.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} title={profile?.role === 'admin' ? 'Admin' : 'Member'} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white capitalize">{profile?.username || '—'}</p>
                <p className="text-xs text-slate-400">{profile?.email || '—'}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                profile?.role === 'admin'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {profile?.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                {profile?.role === 'admin' ? 'Mess Admin' : 'Member'}
              </span>

              {profile?.phone && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>

            {/* Quick Info Card */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Account Info</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-xs">
                  <UserCircle className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-slate-500">Username</span>
                    <p className="text-white font-semibold capitalize">{profile?.username || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-slate-500">Email</span>
                    <p className="text-white font-semibold">{profile?.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-slate-500">Phone</span>
                    <p className="text-white font-semibold">{profile?.phone || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Edit Forms ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Profile Update Form ── */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Personal Information</h2>
                  <p className="text-xs text-slate-400">Update your name, email, and phone number</p>
                </div>
              </div>

              {profileMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}
              {profileErr && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileErr}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        placeholder="e.g. 01712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    {updateProfileMutation.isPending ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                    ) : (
                      <><Save className="w-4 h-4" /><span>Save Changes</span></>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Change Password Form ── */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Change Password</h2>
                  <p className="text-xs text-slate-400">Ensure your account uses a strong, unique password</p>
                </div>
              </div>

              {passMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passMsg}</span>
                </div>
              )}
              {passErr && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passErr}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    <input
                      type={showOld ? 'text' : 'password'}
                      required
                      placeholder="Enter current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                      {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type={showNew ? 'text' : 'password'}
                        required
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength Bar */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                        </div>
                        <p className={`text-[10px] font-semibold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full bg-slate-800/80 border rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-rose-500 focus:border-rose-500'
                            : confirmPassword && confirmPassword === newPassword
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-slate-700 focus:border-amber-500'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <p className={`text-[10px] font-semibold mt-1.5 ${confirmPassword === newPassword ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {confirmPassword === newPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Security tips */}
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Password Tips</p>
                  <p>• Use at least 8 characters with uppercase letters & numbers</p>
                  <p>• Avoid using your name, email, or common words</p>
                  <p>• Never share your password with anyone</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-105 active:scale-95"
                  >
                    {changePasswordMutation.isPending ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /><span>Updating...</span></>
                    ) : (
                      <><KeyRound className="w-4 h-4" /><span>Update Password</span></>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
