'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<string,string> = { pending:'badge-amber', confirmed:'badge-purple', processing:'badge-purple', shipped:'badge-amber', delivered:'badge-green', cancelled:'badge-red' };
const NEXT: Record<string,string> = { pending:'confirmed', confirmed:'processing', processing:'shipped', shipped:'delivered' };
const FILTERS = ['all','pending','processing','shipped','delivered','cancelled'];

interface Order {
  order_number: string; status: string; total: string; subtotal: string;
  created_at: string; item_count: number;
  customer_email?: string; customer_name?: string;
}

export default function AdminOrdersPage() {
  const t = useT();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: () => ordersApi.adminOrders(filter !== 'all' ? { status: filter } : {}).then(r => r.data),
  });

  const orders: Order[] = data?.results || [];
  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase())
  );

  const statusMutation = useMutation({
    mutationFn: ({ orderNumber, status }: { orderNumber: string; status: string }) =>
      ordersApi.updateStatus(orderNumber, status),
    onSuccess: () => {
      toast.success(t('adm.orders.statusUpdated'));
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => toast.error(t('adm.orders.failedUpdate')),
  });

  const exportCSV = () => {
    const rows = [['Order #','Status','Total','Date'],...filtered.map(o=>[o.order_number,o.status,o.total,o.created_at])];
    const csv  = rows.map(r=>r.join(',')).join('\n');
    const a    = document.createElement('a');
    a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'orders.csv';
    a.click();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">{t('adm.orders.title')}</h2>
        <button onClick={exportCSV} className="btn-glass px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm">
          <Download size={15}/> {t('adm.orders.exportCsv')}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={t('adm.orders.search')} className="glass-input ps-8 text-sm py-2"/>
        </div>
        <div className="flex gap-1 glass-dark rounded-xl p-1 flex-wrap">
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
          <div className="p-8 text-center text-white/40">{t('adm.orders.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40">{t('adm.orders.noOrders')}</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t('adm.orders.colOrder')}</th>
                <th>{t('adm.orders.colCustomer')}</th>
                <th>{t('adm.orders.colItems')}</th>
                <th>{t('adm.orders.colTotal')}</th>
                <th>{t('adm.orders.colStatus')}</th>
                <th>{t('adm.orders.colDate')}</th>
                <th>{t('adm.orders.colAction')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.order_number}>
                  <td><span className="font-mono text-white font-semibold text-xs">{o.order_number}</span></td>
                  <td>
                    <p className="text-sm text-white font-medium">{o.customer_name || '—'}</p>
                    <p className="text-xs text-white/40">{o.customer_email || ''}</p>
                  </td>
                  <td><span className="text-white/70">{o.item_count} item{o.item_count !== 1 ? 's' : ''}</span></td>
                  <td><span className="font-semibold text-white">{formatPrice(parseFloat(o.total))}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[o.status]||'badge-purple'}`}>{o.status}</span></td>
                  <td><span className="text-white/50 text-xs">{formatDate(o.created_at)}</span></td>
                  <td>
                    {NEXT[o.status] && (
                      <button
                        onClick={()=>statusMutation.mutate({orderNumber:o.order_number, status:NEXT[o.status]})}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-semibold transition-colors capitalize">
                        → {NEXT[o.status]}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
