'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, CheckCircle } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useT } from '@/lib/i18n';

type Order = {
  id: number;
  order_number: string;
  status: string;
  total: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address?: { full_name?: string; address?: string; city?: string; phone?: string };
  item_count: number;
};

const fadeUp  = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0} };
const stagger = { show:{ transition:{ staggerChildren:0.06 } } };

export default function DeliveryReportsPage() {
  const t = useT();
  const [tab, setTab] = useState<'shipped'|'delivered'>('shipped');

  const TABS = [
    { label: t('sa.delivery.shipped'),   value: 'shipped'   as const, icon: Truck,       color: 'text-cyan-400',  bg: 'badge-purple' },
    { label: t('sa.delivery.delivered'), value: 'delivered' as const, icon: CheckCircle, color: 'text-green-400', bg: 'badge-green' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-delivery', tab],
    queryFn: () => ordersApi.adminOrders({ status: tab, limit: 100 }).then(r => r.data),
  });

  const orders: Order[] = Array.isArray(data) ? data : data?.results ?? [];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Truck size={22} className="text-cyan-400"/> {t('sa.delivery.title')}</h1>
        <p className="text-white/40 text-sm mt-1">{t('sa.delivery.subtitle')}</p>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4">
        {TABS.map(tabItem => (
          <motion.div key={tabItem.value} variants={fadeUp}>
            <button onClick={() => setTab(tabItem.value)}
              className={`w-full glass-card p-5 flex items-center gap-4 transition-all border ${tab === tabItem.value ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-transparent'}`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center glass">
                <tabItem.icon size={22} className={tabItem.color}/>
              </div>
              <div className="text-start">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{tabItem.label}</p>
                <p className="text-white text-2xl font-black">—</p>
              </div>
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Orders list */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          {TABS.map(tabItem => (
            <button key={tabItem.value} onClick={() => setTab(tabItem.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === tabItem.value ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-white/50 hover:text-white hover:bg-white/8'}`}>
              <tabItem.icon size={14} className={tabItem.color}/> {tabItem.label}
            </button>
          ))}
          <span className="ms-auto text-xs text-white/30">{orders.length} {t('sa.delivery.orders')}</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({length:5}).map((_,i) => <div key={i} className="h-20 glass rounded-xl animate-pulse"/>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={40} className="text-white/20 mx-auto mb-3"/>
            <p className="text-white/40 text-sm">{t('sa.delivery.noOrders').replace('{tab}', tab)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <span className="text-sm font-bold text-white font-mono">{o.order_number}</span>
                    <span className={`ms-2 badge ${tab === 'delivered' ? 'badge-green' : 'badge-purple'}`}>{o.status}</span>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-sm font-bold text-white">{formatPrice(parseFloat(o.total))}</p>
                    <p className="text-xs text-white/40">{o.item_count}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Package size={11}/> {o.customer_name} · {o.customer_email}
                  </span>
                  {o.shipping_address && (
                    <span className="flex items-center gap-1 sm:ms-auto">
                      <MapPin size={11}/>
                      {[o.shipping_address.full_name, o.shipping_address.address, o.shipping_address.city].filter(Boolean).join(', ')}
                      {o.shipping_address.phone && <span className="ms-1 text-white/30">· {o.shipping_address.phone}</span>}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/25 mt-1.5">{new Date(o.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
