'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import { useT } from '@/lib/i18n';

const STATUS_BADGE: Record<string,string> = { approved:'badge-green', pending:'badge-amber', suspended:'badge-red', rejected:'badge-red' };
const FILTERS = ['all','pending','approved','suspended','rejected'];

interface Vendor {
  id: number; shop_name: string; slug: string; status: string;
  user: { email: string; first_name: string; last_name: string };
  rating: string; total_sales: number; created_at: string;
}

export default function AdminVendorsPage() {
  const t = useT();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', filter],
    queryFn: () => vendorsApi.adminList(filter !== 'all' ? { status: filter } : {}).then(r => r.data),
  });

  const vendors: Vendor[] = data?.results || [];
  const filtered = vendors.filter(v =>
    v.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    v.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-black text-white">{t('adm.vendors.title')}</h2>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
          <ShieldAlert size={14}/> {t('adm.vendors.superAdminNote')}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={t('adm.vendors.search')} className="glass-input ps-8 text-sm py-2"/>
        </div>
        <div className="flex gap-1 glass-dark rounded-xl p-1">
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f?'bg-red-500/80 text-white':'text-white/50 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40">{t('adm.vendors.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40">{t('adm.vendors.empty')}</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t('adm.vendors.colShop')}</th>
                <th>{t('adm.vendors.colOwner')}</th>
                <th>{t('adm.vendors.colStatus')}</th>
                <th>{t('adm.vendors.colRating')}</th>
                <th>{t('adm.vendors.colSales')}</th>
                <th>{t('adm.vendors.colJoined')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td>
                    <p className="font-semibold text-white">{v.shop_name}</p>
                    <p className="text-xs text-white/40">{v.slug}</p>
                  </td>
                  <td>
                    <p className="text-sm text-white/80">{v.user?.first_name} {v.user?.last_name}</p>
                    <p className="text-xs text-white/40">{v.user?.email}</p>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[v.status]||'badge-purple'}`}>{v.status}</span></td>
                  <td><span className="text-white/70">{Number(v.rating).toFixed(1)} ★</span></td>
                  <td><span className="text-white/70">{v.total_sales}</span></td>
                  <td><span className="text-white/50 text-xs">{new Date(v.created_at).toLocaleDateString()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
