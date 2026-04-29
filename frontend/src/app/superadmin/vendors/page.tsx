'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, XCircle, PauseCircle, PlayCircle, Store, Clock, Crown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const STATUS_BADGE: Record<string,string> = { approved:'badge-green', pending:'badge-amber', suspended:'badge-red', rejected:'badge-red' };
const FILTER_KEYS = ['all','pending','approved','suspended','rejected'] as const;

interface Vendor {
  id: number; shop_name: string; slug: string; status: string;
  user: { email: string; first_name: string; last_name: string };
  rating: string; total_sales: number; created_at: string;
  description?: string; city?: string; phone?: string; is_premium?: boolean;
}

const fadeUp  = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0} };
const stagger = { show:{ transition:{ staggerChildren:0.06 } } };

export default function SuperAdminVendorsPage() {
  const t = useT();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sa-vendors', filter],
    queryFn: () => vendorsApi.adminList(filter !== 'all' ? { status: filter } : {}).then(r => r.data),
  });

  const vendors: Vendor[] = data?.results ?? (Array.isArray(data) ? data : []);
  const filtered = vendors.filter(v =>
    v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    v.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount   = vendors.filter(v => v.status === 'pending').length;
  const approvedCount  = vendors.filter(v => v.status === 'approved').length;
  const suspendedCount = vendors.filter(v => v.status === 'suspended').length;
  const premiumCount   = vendors.filter(v => v.is_premium).length;

  const statusMutation = useMutation({
    mutationFn: ({ id, st }: { id: number; st: string }) => vendorsApi.updateStatus(id, st),
    onSuccess: (_, { st }) => {
      toast.success(`Vendor ${st}`);
      qc.invalidateQueries({ queryKey: ['sa-vendors'] });
    },
    onError: () => toast.error('Action failed — only Super Admin can change vendor status'),
  });

  const premiumMutation = useMutation({
    mutationFn: (id: number) => vendorsApi.togglePremium(id),
    onSuccess: (res) => {
      const isPremium = res.data?.is_premium;
      toast.success(isPremium ? 'Shop marked as Premium ✨' : 'Premium status removed');
      qc.invalidateQueries({ queryKey: ['sa-vendors'] });
    },
    onError: () => toast.error('Failed to update premium status'),
  });

  const summaryCards = [
    { label: t('sa.vendors.pending'),   value: pendingCount,   icon: Clock,        color: 'text-amber-400', bg: 'from-amber-500/10 to-orange-500/10',  filter: 'pending' },
    { label: t('sa.vendors.active'),    value: approvedCount,  icon: CheckCircle2, color: 'text-green-400', bg: 'from-green-500/10 to-emerald-500/10',  filter: 'approved' },
    { label: t('sa.vendors.suspended'), value: suspendedCount, icon: PauseCircle,  color: 'text-red-400',   bg: 'from-red-500/10 to-rose-500/10',       filter: 'suspended' },
    { label: t('sa.vendors.premium'),   value: premiumCount,   icon: Crown,        color: 'text-amber-300', bg: 'from-yellow-500/10 to-amber-500/10',   filter: 'all' },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Store size={22} className="text-blue-400"/> {t('sa.vendors.title')}</h1>
        <p className="text-white/40 text-sm mt-1">{t('sa.vendors.subtitle')}</p>
      </motion.div>

      {/* Summary */}
      <motion.div variants={stagger} className="grid grid-cols-4 gap-4">
        {summaryCards.map(s => (
          <motion.div key={s.label} variants={fadeUp}>
            <button onClick={() => setFilter(s.filter)}
              className={`w-full glass-card p-4 bg-linear-to-br ${s.bg} text-start transition-all border ${filter === s.filter && s.filter !== 'all' ? 'border-indigo-500/50' : 'border-transparent hover:border-white/10'}`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={s.color}/>
                <p className="text-xs text-white/50 uppercase tracking-wider">{s.label}</p>
              </div>
              <p className="text-2xl font-black text-white">{s.value}</p>
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters + search */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('sa.vendors.searchPlh')} className="glass-input ps-8 text-sm py-2"/>
        </div>
        <div className="flex gap-1 glass-dark rounded-xl p-1">
          {FILTER_KEYS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f?'bg-purple-500/80 text-white':'text-white/50 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40">{t('sa.vendors.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            {filter === 'pending' ? t('sa.vendors.noPending') : t('sa.vendors.notFound')}
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t('sa.vendors.col.shop')}</th>
                <th>{t('sa.vendors.col.owner')}</th>
                <th>{t('sa.vendors.col.status')}</th>
                <th>{t('sa.vendors.col.rating')}</th>
                <th>{t('sa.vendors.col.sales')}</th>
                <th>{t('sa.vendors.col.joined')}</th>
                <th>{t('sa.vendors.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className={v.status === 'pending' ? 'bg-amber-500/5' : v.is_premium ? 'bg-amber-500/3' : ''}>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{v.shop_name}</p>
                      {v.is_premium && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                          <Crown size={9}/> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40">{v.slug}</p>
                    {v.city && <p className="text-xs text-white/30">{v.city}</p>}
                  </td>
                  <td>
                    <p className="text-sm text-white/80">{v.user?.first_name} {v.user?.last_name}</p>
                    <p className="text-xs text-white/40">{v.user?.email}</p>
                    {v.phone && <p className="text-xs text-white/30">{v.phone}</p>}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[v.status]||'badge-purple'}`}>{v.status}</span></td>
                  <td><span className="text-white/70">{Number(v.rating||0).toFixed(1)} ★</span></td>
                  <td><span className="text-white/70">{v.total_sales}</span></td>
                  <td><span className="text-white/50 text-xs">{new Date(v.created_at).toLocaleDateString()}</span></td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {v.status !== 'approved' && (
                        <button onClick={()=>statusMutation.mutate({id:v.id,st:'approved'})}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-xs font-semibold disabled:opacity-40">
                          <CheckCircle2 size={13}/> {t('sa.vendors.approve')}
                        </button>
                      )}
                      {v.status !== 'rejected' && v.status !== 'approved' && (
                        <button onClick={()=>statusMutation.mutate({id:v.id,st:'rejected'})}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-semibold disabled:opacity-40">
                          <XCircle size={13}/> {t('sa.vendors.reject')}
                        </button>
                      )}
                      {v.status === 'approved' && (
                        <button onClick={()=>statusMutation.mutate({id:v.id,st:'suspended'})}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors text-xs font-semibold disabled:opacity-40">
                          <PauseCircle size={13}/> {t('sa.vendors.suspend')}
                        </button>
                      )}
                      {v.status === 'suspended' && (
                        <button onClick={()=>statusMutation.mutate({id:v.id,st:'approved'})}
                          disabled={statusMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs font-semibold disabled:opacity-40">
                          <PlayCircle size={13}/> {t('sa.vendors.reinstate')}
                        </button>
                      )}
                      {v.status === 'approved' && (
                        <button onClick={()=>premiumMutation.mutate(v.id)}
                          disabled={premiumMutation.isPending}
                          title={v.is_premium ? 'Remove Premium' : 'Mark as Premium'}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-xs font-semibold disabled:opacity-40 ${v.is_premium ? 'bg-amber-500/30 text-amber-300 hover:bg-amber-500/20' : 'bg-white/10 text-white/50 hover:bg-amber-500/20 hover:text-amber-400'}`}>
                          <Crown size={13}/> {v.is_premium ? 'Premium ✓' : 'Premium'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </motion.div>
  );
}
