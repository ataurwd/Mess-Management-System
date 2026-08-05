import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Category } from '../types';
import { getCurrentUser } from '../utils/auth';
import { Tags, Plus, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const [name, setName] = useState('');
  const [categoryType, setCategoryType] = useState('expense');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. TanStack Query: Fetch Categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/v1/category/getCategory');
      const list = res.data?.data;
      return Array.isArray(list) ? list : [];
    },
  });

  // 2. TanStack Mutation: Add Category
  const addCategoryMutation = useMutation({
    mutationFn: async (payload: { name: string; categoryType: string }) => {
      const res = await api.post('/v1/category/addCategory', payload);
      if (!res.data.success && res.data.status === false) {
        throw new Error(res.data.message || 'Failed to add category');
      }
      return res.data;
    },
    onSuccess: () => {
      setMessage('Category created successfully!');
      setName('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Error creating category');
    },
  });

  // 3. TanStack Mutation: Delete Category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/v1/category/deleteCategory/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setMessage('');
    setError('');

    addCategoryMutation.mutate({
      name,
      categoryType,
    });
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this category?')) return;
    deleteCategoryMutation.mutate(id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Mess Categories</h1>
        <p className="text-sm text-slate-400 mt-1">
          {isAdmin ? 'Organize expenses and deposits with custom category tags.' : 'View category tags used across mess expenses and deposits.'}
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
        {/* Create Category Form (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-1 glass-card p-6 rounded-2xl border border-slate-800 self-start">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-2 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-lg">Add Category</h2>
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

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Grocery, Electricity Bill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category Type</label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="expense">Expense</option>
                  <option value="deposit">Deposit</option>
                  <option value="utility">Utility / Bill</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addCategoryMutation.isPending}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {addCategoryMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Real-time...</span>
                  </>
                ) : (
                  'Create Category'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-1'} glass-card p-6 rounded-2xl border border-slate-800`}>
          <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Tags className="w-5 h-5 text-purple-400" />
            Category Directory ({categories.length})
          </h3>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading categories...</div>
          ) : categories.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No custom categories created yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {categories.map((cat) => (
                <div key={cat._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{cat.name}</p>
                    <span className="text-xs text-slate-400 capitalize">{cat.categoryType || 'General'}</span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(cat._id)}
                      disabled={deleteCategoryMutation.isPending}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
