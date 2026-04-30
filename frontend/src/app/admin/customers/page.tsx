'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, ShoppingBag, Store, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface Customer {
  id: number; email: string; first_name: string; last_name: string;
  username: string; role: string; is_verified: boolean; created_at: string;
}

const ROLE_BADGE: Record<string, string> = {
  customer: 'badge-purple', vendor: 'badge-amber', admin: 'badge-red',
};
const ROLE_ICON: Record<string, React.ReactNode> = {
  customer: <ShoppingBag size={12}/>,
  vendor:   <Store size={12}/>,
  admin:    <Shield size={12}/>,
};
const FILTERS = ['all', 'customer', 'vendor', 'admin'];

export default function AdminCustomersPage() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('all');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', role, search],
    queryFn: () => usersApi.adminCustomers({
      role: role !== 'all' ? role : undefined,
      search: search || undefined,
    }).then(r => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: number) => usersApi.verifyUser(id).then(r => r.data),
    onSuccess: (updated: Customer) => {
      toast.success(updated.is_verified ? t('adm.customers.userVerified') : t('adm.customers.verifyRemoved'));
      qc.invalidateQueries({ queryKey: ['admin-customers'] });
    },
    onError: () => toast.error(t('adm.customers.actionFailed')),
  });

  const customers: Customer[] = (() => {
    const d = data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.results)) return d.results;
    return [];
  })();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-black text-white">{t('adm.customers.title')}</h2>
        <p className="text-white/50 text-sm">{t('adm.customers.count').replace('{n}', String(customers.length))}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('adm.customers.search')} className="glass-input ps-8 text-sm py-2"/>
        </div>
        <div className="flex gap-1 glass-dark rounded-xl p-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setRole(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${role === f ? 'bg-red-500/80 text-white' : 'text-white/50 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40">{t('adm.customers.loading')}</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="text-white/20 mx-auto mb-3"/>
            <p className="text-white/40">{t('adm.customers.empty')}</p>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t('adm.customers.colName')}</th>
                <th>{t('adm.customers.colEmail')}</th>
                <th>{t('adm.customers.colRole')}</th>
                <th>{t('adm.customers.colVerified')}</th>
                <th>{t('adm.customers.colJoined')}</th>
                <th>{t('adm.customers.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const name = `${c.first_name} ${c.last_name}`.trim() || c.username;
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                          {(c.first_name?.[0] || c.email[0]).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{name}</span>
                      </div>
                    </td>
                    <td><span className="text-white/60 text-sm">{c.email}</span></td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[c.role] || 'badge-purple'} flex items-center gap-1 w-fit`}>
                        {ROLE_ICON[c.role]}{c.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.is_verified ? 'badge-green' : 'badge-red'}`}>
                        {c.is_verified ? t('adm.customers.verified') : t('adm.customers.unverified')}
                      </span>
                    </td>
                    <td>
                      <span className="text-white/50 text-xs">
                        {new Date(c.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => verifyMutation.mutate(c.id)}
                        disabled={verifyMutation.isPending}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.is_verified
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}>
                        {c.is_verified ? <XCircle size={14}/> : <CheckCircle2 size={14}/>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
