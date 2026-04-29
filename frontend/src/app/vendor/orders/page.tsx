'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';

const STATUSES = ['all','pending','confirmed','processing','shipped','delivered','cancelled'];
const NEXT_STATUS: Record<string,string> = { pending:'confirmed', confirmed:'processing', processing:'shipped', shipped:'delivered' };
const STATUS_BADGE: Record<string,string> = { pending:'badge-amber', confirmed:'badge-purple', processing:'badge-purple', shipped:'badge-amber', delivered:'badge-green', cancelled:'badge-red' };

interface Order { order_number: string; status: string; total: string; created_at: string; item_count: number; shipping_address?: Record<string,string>; }

export default function VendorOrdersPage() {
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [expanded, setExpand] = useState<string|null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders', filter],
    queryFn: () => ordersApi.vendorOrders().then(r => r.data),
  });

  const orders: Order[] = data?.results || [];
  const filtered = orders.filter(o =>
    (filter === 'all' || o.status === filter) &&
    o.order_number.toLowerCase().includes(search.toLowerCase())
  );

  const statusMutation = useMutation({
    mutationFn: ({ orderNumber, status }: { orderNumber: string; status: string }) =>
      ordersApi.updateStatus(orderNumber, status),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['vendor-orders'] }); },
    onError: () => toast.error('Failed to update'),
  });

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
      <h2 className="text-2xl font-black text-white">Orders</h2>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Order number…" className="glass-input pl-8 text-sm py-2"/>
        </div>
        <div className="flex gap-1 glass-dark rounded-xl p-1 flex-wrap">
          {STATUSES.map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter===s?'bg-indigo-500 text-white':'text-white/50 hover:text-white'}`}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="glass-card h-16 shimmer"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/40">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o.order_number} className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/3 transition-colors"
                onClick={()=>setExpand(expanded===o.order_number?null:o.order_number)}>
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-white">{o.order_number}</span>
                  <span className={`badge ${STATUS_BADGE[o.status]||'badge-purple'}`}>{o.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">{formatPrice(parseFloat(o.total))}</span>
                  <span className="text-xs text-white/40">{formatDate(o.created_at)}</span>
                  {NEXT_STATUS[o.status] && (
                    <button onClick={e=>{e.stopPropagation();statusMutation.mutate({orderNumber:o.order_number,status:NEXT_STATUS[o.status]})}}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-semibold transition-colors capitalize">
                      → {NEXT_STATUS[o.status]}
                    </button>
                  )}
                  {expanded===o.order_number ? <ChevronUp size={14} className="text-white/40"/> : <ChevronDown size={14} className="text-white/40"/>}
                </div>
              </div>

              {expanded === o.order_number && o.shipping_address && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
                  className="border-t border-white/10 p-4 bg-white/3">
                  <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-2">Shipping Address</p>
                  <p className="text-sm text-white">{o.shipping_address.full_name} · {o.shipping_address.phone}</p>
                  <p className="text-sm text-white/60">{o.shipping_address.address}, {o.shipping_address.city}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
