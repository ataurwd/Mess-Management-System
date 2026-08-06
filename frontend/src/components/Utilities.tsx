import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { 
  Zap, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  DollarSign, 
  Calendar,
  CreditCard,
  PieChart,
  User as UserIcon,
  X,
  Edit2
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
  utilityType?: string;
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
  const [billMessage, setBillMessage] = useState('');
  const [billError, setBillError] = useState('');

  // Record Payment Modal / Form State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payUtilityType, setPayUtilityType] = useState('General Utility');
  const [payNote, setPayNote] = useState('');
  const [payMessage, setPayMessage] = useState('');
  const [payError, setPayError] = useState('');

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

  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [editBillId, setEditBillId] = useState('');
  const [editBillTitle, setEditBillTitle] = useState('');
  const [editBillAmount, setEditBillAmount] = useState<number | string>('');
  const [editBillError, setEditBillError] = useState('');

  // 4. Mutations
  const addBillMutation = useMutation({
    mutationFn: async (payload: { title: string; amount: number; month: string }) => {
      const res = await api.post('/v1/utility/bills', payload);
      return res.data;
    },
    onSuccess: () => {
      setBillMessage('Utility bill recorded successfully!');
      setBillAmount('');
      setBillError('');
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

  const updateBillMutation = useMutation({
    mutationFn: async (payload: { id: string; title: string; amount: number; month: string }) => {
      const res = await api.put(`/v1/utility/bills/${payload.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      setBillMessage('Utility bill updated successfully!');
      setShowEditBillModal(false);
      queryClient.invalidateQueries({ queryKey: ['utilityBills'] });
    },
    onError: (err: any) => {
      setEditBillError(err.response?.data?.message || err.message || 'Error updating bill');
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (payload: { userId: string; amount: number; month: string; paymentMethod: string; utilityType: string; note: string }) => {
      const res = await api.post('/v1/utility/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      setPayMessage('Member utility payment recorded successfully!');
      setPayAmount('');
      setPayNote('');
      setPayError('');

      queryClient.invalidateQueries({ queryKey: ['utilityPayments'] });
      setTimeout(() => {
        setShowPaymentModal(false);
        setPayMessage('');
      }, 1000);
    },
    onError: (err: any) => {
      setPayError(err.response?.data?.message || err.message || 'Error saving payment');
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
    setBillMessage('');
    setBillError('');
    addBillMutation.mutate({ title, amount: Number(billAmount), month });
  };

  const handleUpdateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setEditBillError('');
    updateBillMutation.mutate({ id: editBillId, title: editBillTitle, amount: Number(editBillAmount), month });
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setPayMessage('');
    setPayError('');
    addPaymentMutation.mutate({
      userId: selectedUser,
      amount: Number(payAmount),
      month,
      paymentMethod: payMethod,
      utilityType: payUtilityType,
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
      const difference = perPersonUtility - item.paid;
      let status: 'paid' | 'partial' | 'unpaid' | 'overpaid' = 'unpaid';
      
      if (item.paid > perPersonUtility) status = 'overpaid';
      else if (item.paid === perPersonUtility && perPersonUtility > 0) status = 'paid';
      else if (item.paid > 0) status = 'partial';
      
      return { 
        ...item, 
        due: Math.max(0, difference), 
        refund: Math.max(0, -difference),
        status 
      };
    });
  }, [users, payments, perPersonUtility, month]);

  const totalCollectedUtilities = useMemo(() => {
    return memberBreakdown.reduce((sum, item) => sum + item.paid, 0);
  }, [memberBreakdown]);

  const filteredPayments = payments.filter((item) =>
    (item.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.month || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.utilityType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBills = bills.filter((item) =>
    (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.month || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-7 h-7 text-amber-400" />
            Utility Bills & Member Division
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin 
              ? 'Record total utility bills, divide equally per member, and log member utility payments.' 
              : 'Review total monthly utility bills, equal per-person division, and payment logs.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (users.length > 0) setSelectedUser(users[0]._id);
              setPayAmount(perPersonUtility);
              setShowPaymentModal(true);
            }}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all self-start sm:self-auto shadow-lg shadow-amber-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Record Member Utility Payment</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Total Utilities ({month})</span>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">৳{totalBillsThisMonth.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Sum of Electricity, Gas, Wi-Fi, Maid</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Utility Share Per Member</span>
          <p className="text-3xl font-extrabold text-teal-400 mt-2">৳{perPersonUtility.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">৳{totalBillsThisMonth.toLocaleString()} ÷ {membersCount} Members</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold uppercase text-slate-400">Total Collected ({month})</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">৳{totalCollectedUtilities.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-1">Member utility payments received</p>
        </div>
      </div>

      {/* Member Breakdown Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            Member Utility Division & Payment Status ({month})
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
                <th className="py-3 px-4">Refund / Extra</th>
                {isAdmin && <th className="py-3 px-4 text-right font-bold">Action</th>}
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
                  <td className="py-3.5 px-4 font-extrabold text-blue-400">
                    ৳{item.refund.toLocaleString()}
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedUser(item.userId);
                          setPayAmount(item.due > 0 ? item.due : perPersonUtility);
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-[11px] font-bold border border-amber-500/30 transition-all"
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

            {billMessage && <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs">{billMessage}</div>}

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
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-600/30"
              >
                Add Utility Bill
              </button>
            </form>
          </div>
        )}

        {/* Monthly Added Utility Bills Table */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} glass-card p-6 rounded-2xl border border-slate-800 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Monthly Added Utility Bills</h3>
              <p className="text-xs text-slate-400">List of all added utility bills</p>
            </div>
            
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search bill type or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {loadingBills ? (
            <div className="text-center py-12 text-slate-400 text-sm">Fetching bills...</div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No utility bills added.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">Bill Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Date Added</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredBills.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-white">{item.title}</td>
                      <td className="py-3.5 px-4 font-extrabold text-amber-400">৳{Number(item.amount).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700">{item.month}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditBillId(item._id);
                              setEditBillTitle(item.title);
                              setEditBillAmount(item.amount);
                              setMonth(item.month);
                              setShowEditBillModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg mr-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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
          )}
        </div>

        {/* Member Payments Log History Table */}
        <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-1'} glass-card p-6 rounded-2xl border border-slate-800 space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-lg">Member Utility Payment Logs</h3>
              <p className="text-xs text-slate-400">Log history of all member utility payments</p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search member or month..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {loadingPayments ? (
            <div className="text-center py-12 text-slate-400 text-sm">Fetching payment logs...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No utility payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Bill Type</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Date</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPayments.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-white">{item.username || 'Member'}</td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-400">৳{Number(item.amount).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-amber-400 font-semibold">{item.utilityType || 'General'}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700">{item.month}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{item.paymentMethod || 'Cash'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => deletePaymentMutation.mutate(item._id)}
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
          )}
        </div>
      </div>

      {/* RECORD MEMBER UTILITY PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Record Utility Payment</h3>
                  <p className="text-xs text-slate-400">Log member payment for monthly utilities</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payMessage && <div className="p-3 mb-4 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-semibold">{payMessage}</div>}
            {payError && <div className="p-3 mb-4 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-semibold">{payError}</div>}

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Member</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username ? u.username.charAt(0).toUpperCase() + u.username.slice(1) : u.email}
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
                    placeholder={`e.g. ${perPersonUtility}`}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Month & Year</label>
                <input
                  type="text"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Utility Type</label>
                <select
                  value={payUtilityType}
                  onChange={(e) => setPayUtilityType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="General Utility">General Utility ⚡💧🔥</option>
                  <option value="Electricity Bill">Electricity Bill ⚡</option>
                  <option value="Gas Bill">Gas Bill 🔥</option>
                  <option value="Water Bill">Water Bill 💧</option>
                  <option value="Wi-Fi Internet">Wi-Fi Internet 📶</option>
                  <option value="Maid / Cook Salary">Maid / Cook Salary 🧹</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Note / Txn ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via bKash"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addPaymentMutation.isPending}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-amber-600/30 flex items-center gap-2"
                >
                  {addPaymentMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT UTILITY BILL MODAL */}
      {showEditBillModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Edit Utility Bill</h3>
                  <p className="text-xs text-slate-400">Update the existing utility bill details</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditBillModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editBillError && <div className="p-3 mb-4 bg-rose-500/10 text-rose-400 rounded-xl text-xs font-semibold">{editBillError}</div>}

            <form onSubmit={handleUpdateBill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bill Type</label>
                <select
                  value={editBillTitle}
                  onChange={(e) => setEditBillTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Electricity Bill">Electricity Bill ⚡</option>
                  <option value="Gas Bill">Gas Bill 🔥</option>
                  <option value="Wi-Fi Internet">Wi-Fi Internet 📶</option>
                  <option value="Maid / Cook Salary">Maid / Cook Salary 🧹</option>
                  <option value="Water Bill">Water Bill 💧</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (৳)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="number"
                    required
                    min="1"
                    value={editBillAmount}
                    onChange={(e) => setEditBillAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Month & Year</label>
                <input
                  type="text"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBillModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBillMutation.isPending}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-amber-600/30 flex items-center gap-2"
                >
                  {updateBillMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Update Bill'
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
