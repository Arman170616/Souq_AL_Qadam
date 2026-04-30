'use client';
import { motion } from 'framer-motion';
import { DollarSign, Store, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi, ordersApi } from '@/lib/api';
import { useT } from '@/lib/i18n';

const STATUS_COLORS: Record<string, string> = {
  pending: 'badge-amber', confirmed: 'badge-purple', processing: 'badge-purple',
  shipped: 'badge-green', delivered: 'badge-green', cancelled: 'badge-red',
};

export default function AdminDashboard() {
  const t = useT();

  const { data: orderData } = useQuery({
    queryKey: ['admin-orders-recent'],
    queryFn: () => ordersApi.adminOrders({ ordering: '-created_at' }).then(r => r.data),
    refetchInterval: 30000,
  });
  const { data: allVendors } = useQuery({
    queryKey: ['admin-vendors-all'],
    queryFn: () => vendorsApi.adminList({}).then(r => r.data),
    refetchInterval: 30000,
  });

  const recentOrders  = orderData?.results?.slice(0, 5) || [];
  const allVendorList = allVendors?.results || [];

  const totalOrders   = orderData?.count ?? 0;
  const activeVendors = allVendorList.filter((v: { status: string }) => v.status === 'approved').length;
  const totalRevenue  = recentOrders.reduce((s: number, o: { total: string }) => s + parseFloat(o.total || '0'), 0);

  const STATS = [
    { label: t('adm.dash.totalOrders'),   value: String(totalOrders),      icon: ShoppingBag, color: 'from-pink-500/20 to-rose-500/20',    iconColor: 'text-pink-400' },
    { label: t('adm.dash.activeVendors'), value: String(activeVendors),    icon: Store,       color: 'from-amber-500/20 to-orange-500/20',  iconColor: 'text-amber-400' },
    { label: t('adm.dash.revenueRecent'), value: formatPrice(totalRevenue), icon: DollarSign,  color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">{t('adm.dash.title')}</h1>
        <p className="text-white/50 text-sm mt-1">{t('adm.dash.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`glass-card p-5 bg-linear-to-br ${s.color}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">{s.label}</p>
              <s.icon size={18} className={s.iconColor} />
            </div>
            <p className="text-2xl font-black text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <ShoppingBag size={16} className="text-indigo-400" /> {t('adm.dash.recentOrders')}
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">{t('adm.dash.noOrders')}</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o: { order_number: string; total: string; status: string; created_at: string }) => (
              <div key={o.order_number} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-semibold text-white font-mono">{o.order_number}</p>
                  <p className="text-xs text-white/40">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{formatPrice(parseFloat(o.total))}</span>
                  <span className={`badge ${STATUS_COLORS[o.status] || 'badge-purple'}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
