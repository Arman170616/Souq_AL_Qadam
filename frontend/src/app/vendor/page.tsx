'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Package, ShoppingBag, DollarSign, Star, Plus, ArrowRight, TrendingUp, ChevronDown, Upload } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi, ordersApi, productsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';
import { useState, useRef, useEffect } from 'react';

function AddProductDropdown() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
        <Plus size={15}/> {t('ven.dash.addProduct')}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="absolute inset-e-0 top-full mt-2 w-64 glass-dark rounded-2xl overflow-hidden border border-white/10 z-30 shadow-2xl">
            <Link href="/vendor/products/new" onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Package size={15} className="text-indigo-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{t('ven.dash.singleProduct')}</p>
                <p className="text-xs text-white/40 mt-0.5">{t('ven.dash.singleProductDesc')}</p>
              </div>
            </Link>
            <div className="border-t border-white/8"/>
            <Link href="/vendor/products/bulk-upload" onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Upload size={15} className="text-emerald-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">{t('ven.dash.bulkUpload')}</p>
                <p className="text-xs text-white/40 mt-0.5">{t('ven.dash.bulkUploadDesc')}</p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_BADGE: Record<string,string> = { pending:'badge-amber', confirmed:'badge-purple', processing:'badge-purple', shipped:'badge-amber', delivered:'badge-green', cancelled:'badge-red' };
const fadeUp = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0} };
const stagger = { show:{ transition:{ staggerChildren:0.08 } } };

export default function VendorDashboard() {
  const t = useT();
  const { user } = useAuthStore();

  const { data: vendorMe, isError: noVendorProfile } = useQuery({
    queryKey: ['vendor-me'],
    queryFn: () => vendorsApi.me().then(r => r.data),
    retry: false,
  });
  const { data: orderData } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: () => ordersApi.vendorOrders().then(r => r.data),
  });
  const { data: commissionData } = useQuery({
    queryKey: ['vendor-commissions'],
    queryFn: () => vendorsApi.myCommissions().then(r => r.data),
    retry: false,
  });
  const { data: productData } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: () => productsApi.manage().then(r => r.data),
  });

  const orders   = orderData?.results || [];
  const products = productData?.results || [];
  const recentOrders = orders.slice(0, 4);

  const totalRevenue = orders
    .filter((o: { status: string }) => o.status === 'delivered')
    .reduce((s: number, o: { total: string }) => s + parseFloat(o.total || '0'), 0);

  const commissionSummary = commissionData?.summary;
  const pendingCommission  = commissionSummary?.pending_amount  ?? 0;
  const totalCommission    = commissionSummary?.total_earned    ?? 0;
  const commissionRate     = commissionSummary?.commission_rate ?? vendorMe?.commission_rate ?? 0;

  const STATS = [
    { label: t('ven.dash.totalRevenue'), value: formatPrice(totalRevenue),  icon: DollarSign,  color:'from-indigo-500/20 to-purple-500/20', iconColor:'text-indigo-400' },
    { label: t('ven.dash.totalOrders'),  value: String(orders.length),      icon: ShoppingBag, color:'from-pink-500/20 to-rose-500/20',    iconColor:'text-pink-400' },
    { label: t('ven.dash.products'),     value: String(products.length),    icon: Package,     color:'from-amber-500/20 to-orange-500/20', iconColor:'text-amber-400' },
    { label: t('ven.dash.avgRating'),    value: vendorMe ? `${Number(vendorMe.rating).toFixed(1)} ★` : '—', icon: Star, color:'from-green-500/20 to-emerald-500/20', iconColor:'text-green-400' },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6 p-6 lg:p-8">

      {noVendorProfile && user?.role !== 'admin' && (
        <motion.div variants={fadeUp} className="glass-card p-5 border border-amber-500/30 bg-amber-500/10">
          <p className="font-bold text-amber-400 text-sm mb-1">{t('ven.dash.noProfile')}</p>
          <p className="text-white/60 text-sm mb-3">{t('ven.dash.noProfileDesc')}</p>
          <Link href="/vendor/register" className="btn-primary text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5">
            <ArrowRight size={13}/> {t('ven.dash.createProfile')}
          </Link>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">
            {vendorMe ? vendorMe.shop_name : t('ven.nav.dashboard')}
          </h1>
          <p className="text-white/50 text-sm mt-0.5">
            {vendorMe
              ? t('ven.dash.statusLabel').replace('{s}', vendorMe.status)
              : noVendorProfile
                ? t('ven.dash.profileNotSetup')
                : '—'}
          </p>
        </div>
        <AddProductDropdown />
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <motion.div key={s.label} variants={fadeUp} className={`glass-card p-5 bg-linear-to-br ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">{s.label}</p>
              <s.icon size={16} className={s.iconColor}/>
            </div>
            <p className="text-2xl font-black text-white">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Commission Balance */}
      <motion.div variants={fadeUp} className="glass-card p-6 bg-linear-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400"/> {t('ven.dash.commissionBalance')}
          </h3>
          <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
            {t('ven.dash.rate').replace('{n}', String(commissionRate))}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{t('ven.dash.totalEarned')}</p>
            <p className="text-xl font-black text-white">{formatPrice(totalCommission)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">{t('ven.dash.pending')}</p>
            <p className="text-xl font-black text-amber-300">{formatPrice(pendingCommission)}</p>
            <p className="text-xs text-white/30 mt-0.5">{t('ven.dash.awaitingSettlement')}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">{t('ven.dash.settled')}</p>
            <p className="text-xl font-black text-emerald-300">{formatPrice((commissionSummary?.settled_amount ?? 0))}</p>
          </div>
        </div>
        {commissionData?.commissions?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">{t('ven.dash.recentCommissions')}</p>
            {commissionData.commissions.slice(0, 3).map((c: { id: number; order_number: string; amount: string; rate: string; status: string; created_at: string }) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-sm font-mono text-white/80">{c.order_number}</span>
                  <span className="text-xs text-white/30 ms-2">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{formatPrice(parseFloat(c.amount))}</span>
                  <span className={`badge ${c.status === 'settled' ? 'badge-green' : 'badge-amber'}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShoppingBag size={16} className="text-indigo-400"/> {t('ven.dash.recentOrders')}
            </h3>
            <Link href="/vendor/orders" className="text-xs text-indigo-400 hover:text-indigo-300">{t('ven.dash.viewAll')}</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-6">{t('ven.dash.noOrders')}</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o: { order_number: string; total: string; status: string; created_at: string; item_count: number }) => (
                <div key={o.order_number} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm font-semibold text-white font-mono">{o.order_number}</p>
                    <p className="text-xs text-white/40">{o.item_count} · {new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{formatPrice(parseFloat(o.total))}</span>
                    <span className={`badge ${STATUS_BADGE[o.status]||'badge-purple'}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Your Products */}
        <motion.div variants={fadeUp} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Package size={16} className="text-amber-400"/> {t('ven.dash.yourProducts')}
            </h3>
            <Link href="/vendor/products" className="text-xs text-indigo-400 hover:text-indigo-300">{t('ven.dash.manage')}</Link>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/40 text-sm mb-3">{t('ven.dash.noProducts')}</p>
              <Link href="/vendor/products/new" className="btn-primary text-xs px-4 py-2 rounded-lg">{t('ven.dash.addFirst')}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {products.slice(0,4).map((p: { id: number; name: string; price: string; stock: number; is_active: boolean }) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div>
                    <p className="text-sm font-semibold text-white line-clamp-1">{p.name}</p>
                    <p className="text-xs text-white/40">{t('ven.dash.stock').replace('{n}', String(p.stock))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{formatPrice(parseFloat(p.price))}</span>
                    <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>
                      {p.is_active ? t('ven.dash.active') : t('ven.dash.off')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
