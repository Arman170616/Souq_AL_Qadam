'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';

const STATUS_BADGE: Record<string,string> = { approved:'badge-green', pending:'badge-amber', suspended:'badge-red', rejected:'badge-red' };
const FILTERS = ['all','pending','approved','suspended','rejected'];

interface Vendor {
  id: number; shop_name: string; slug: string; status: string;
  user: { email: string; first_name: string; last_name: string };
  rating: string; total_sales: number; created_at: string;
}

export default function AdminVendorsPage() {
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
        <h2 className="text-2xl font-black text-white">Vendor Management</h2>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
          <ShieldAlert size={14}/> Approval managed by Super Admin
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendors…" className="glass-input pl-8 text-sm py-2"/>
        </div>
        <div className="flex gap-1 glass-dark rounded-xl p-1">
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===f?'bg-red-500/80 text-white':'text-white/50 hover:text-white'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40">Loading vendors…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40">No vendors found</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>Shop</th><th>Owner</th><th>Status</th>
                <th>Rating</th><th>Sales</th><th>Joined</th>
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
