'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Trash2, Check, X, ChevronDown } from 'lucide-react';
import { superAdminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const ROLES = ['all', 'customer', 'vendor', 'admin', 'superadmin'];

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  admin:      'bg-red-500/20 text-red-300 border border-red-500/30',
  vendor:     'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  customer:   'bg-green-500/20 text-green-300 border border-green-500/30',
};

type User = {
  id: number; email: string; first_name: string; last_name: string;
  role: string; is_active: boolean; is_verified: boolean; created_at: string;
};

function RoleSelect({ userId, current, onSave }: { userId: number; current: string; onSave: (id: number, role: string) => void }) {
  const [open, setOpen] = useState(false);
  const opts = ['customer', 'vendor', 'admin', 'superadmin'];
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[current] ?? 'bg-white/10 text-white/50'}`}>
        {current} <ChevronDown size={10}/>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl min-w-32.5">
          {opts.map(r => (
            <button key={r} onClick={() => { onSave(userId, r); setOpen(false); }}
              className={`w-full text-start px-3 py-2 text-xs hover:bg-white/10 transition-colors ${r === current ? 'text-purple-400' : 'text-white/70'}`}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminUsersPage() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('all');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-users', search, role],
    queryFn: () => superAdminApi.users({
      ...(search ? { search } : {}),
      ...(role !== 'all' ? { role } : {}),
    }).then(r => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      superAdminApi.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-users'] }); toast.success('User updated'); },
    onError: (e: {response?: {data?: {detail?: string}}}) =>
      toast.error(e.response?.data?.detail ?? 'Update failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => superAdminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['superadmin-users'] }); toast.success('User deleted'); },
    onError: (e: {response?: {data?: {detail?: string}}}) =>
      toast.error(e.response?.data?.detail ?? 'Delete failed'),
  });

  const users: User[] = data?.results ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Users size={22} className="text-purple-400"/>
        <h1 className="text-2xl font-black text-white">{t('sa.users.title')}</h1>
        <span className="glass-card px-2 py-0.5 text-xs text-white/50">{data?.count ?? 0} {t('sa.users.total')}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('sa.users.searchPlh')}
            className="glass-input ps-9 w-full"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${role === r ? 'bg-purple-600 text-white' : 'glass-card text-white/60 hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"/>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-white/40">{t('sa.users.notFound')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="text-start px-4 py-3">{t('sa.users.col.user')}</th>
                  <th className="text-start px-4 py-3 hidden sm:table-cell">{t('sa.users.col.role')}</th>
                  <th className="text-start px-4 py-3 hidden md:table-cell">{t('sa.users.col.status')}</th>
                  <th className="text-start px-4 py-3 hidden lg:table-cell">{t('sa.users.col.joined')}</th>
                  <th className="text-end px-4 py-3">{t('sa.users.col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : '—'}
                          </p>
                          <p className="text-white/40 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <RoleSelect userId={u.id} current={u.role}
                        onSave={(id, newRole) => updateMut.mutate({ id, data: { role: newRole } })}/>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateMut.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                          title="Toggle active"
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${u.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {u.is_active ? <Check size={10}/> : <X size={10}/>}
                          {u.is_active ? t('sa.users.active') : t('sa.users.inactive')}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-white/40 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        disabled={u.role === 'superadmin'}
                        onClick={() => {
                          if (confirm(`Delete ${u.email}?`)) deleteMut.mutate(u.id);
                        }}
                        title="Delete user"
                        className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
