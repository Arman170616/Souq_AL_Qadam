'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Package, ShoppingBag, Store, LayoutList, Crown } from 'lucide-react';
import { ordersApi, productsApi, vendorsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useT } from '@/lib/i18n';

type Order   = { id:number; order_number:string; status:string; total:string; created_at:string; customer_name:string };
type Vendor  = { id:number; shop_name:string; slug:string; status:string; total_sales:number; rating:string; created_at?:string; is_premium?:boolean };
type Product = { id:number; name:string; price:string; is_active:boolean; created_at:string; vendor_name?:string };

const fadeUp  = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0} };
const stagger = { show:{ transition:{ staggerChildren:0.06 } } };

const STATUS_COLOR: Record<string,string> = {
  pending:'badge-amber', confirmed:'badge-purple', processing:'badge-purple',
  shipped:'badge-purple', delivered:'badge-green', cancelled:'badge-red',
  approved:'badge-green', rejected:'badge-red', suspended:'badge-red',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ActivityPage() {
  const t = useT();

  const TABS = [t('sa.activity.tabAll'), t('sa.activity.tabByShop')] as const;
  type Tab = typeof TABS[number];

  const [tab, setTab]           = useState<Tab>(TABS[0]);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);

  const { data: orderData }   = useQuery({ queryKey:['activity-orders'],   queryFn:()=>ordersApi.adminOrders({ limit:30 }).then(r=>r.data) });
  const { data: vendorData }  = useQuery({ queryKey:['activity-vendors'],  queryFn:()=>vendorsApi.adminList({ limit:50 }).then(r=>r.data) });
  const { data: productData } = useQuery({ queryKey:['activity-products'], queryFn:()=>productsApi.manage({ ordering:'-created_at', limit:30 }).then(r=>r.data) });

  const orders:   Order[]   = Array.isArray(orderData)   ? orderData   : orderData?.results   ?? [];
  const vendors:  Vendor[]  = Array.isArray(vendorData)  ? vendorData  : vendorData?.results  ?? [];
  const products: Product[] = Array.isArray(productData) ? productData : productData?.results ?? [];

  type FeedItem = { id:string; type:'order'|'vendor'|'product'; label:string; sub:string; status:string; time:string; icon:React.ElementType; color:string };
  const feed: FeedItem[] = [
    ...orders.map(o => ({
      id:`o-${o.id}`, type:'order' as const,
      label:`Order ${o.order_number}`,
      sub:`${o.customer_name} · ${formatPrice(parseFloat(o.total))}`,
      status:o.status, time:o.created_at, icon:ShoppingBag, color:'text-pink-400',
    })),
    ...vendors.map(v => ({
      id:`v-${v.id}`, type:'vendor' as const,
      label:`Shop: ${v.shop_name}`,
      sub:`${v.total_sales} sales · Rating ${Number(v.rating||0).toFixed(1)}`,
      status:v.status, time:v.created_at || new Date(0).toISOString(), icon:Store, color:'text-amber-400',
    })),
    ...products.map(p => ({
      id:`p-${p.id}`, type:'product' as const,
      label:`Product: ${p.name}`,
      sub:`${p.vendor_name || 'Vendor'} · ${formatPrice(parseFloat(p.price))}`,
      status:p.is_active ? 'active' : 'inactive',
      time:p.created_at, icon:Package, color:'text-indigo-400',
    })),
  ].sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0,50);

  const vendorProducts = (name: string) => products.filter(p => p.vendor_name === name);
  const activeVendor   = selectedVendor ? vendors.find(v => v.id === selectedVendor) : null;

  const summaryCounts = [
    { label: t('sa.activity.vendors'),  value: vendors.length,  icon: Store,       color: 'text-amber-400',  bg: 'from-amber-500/10 to-orange-500/10' },
    { label: t('sa.activity.orders'),   value: orders.length,   icon: ShoppingBag, color: 'text-pink-400',   bg: 'from-pink-500/10 to-rose-500/10' },
    { label: t('sa.activity.products'), value: products.length, icon: Package,     color: 'text-indigo-400', bg: 'from-indigo-500/10 to-purple-500/10' },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Activity size={22} className="text-green-400"/> {t('sa.activity.title')}</h1>
        <p className="text-white/40 text-sm mt-1">{t('sa.activity.subtitle')}</p>
      </motion.div>

      {/* Tab switcher */}
      <motion.div variants={fadeUp} className="flex gap-1 glass-dark rounded-xl p-1 w-fit">
        {TABS.map(tabLabel => (
          <button key={tabLabel} onClick={() => { setTab(tabLabel); setSelectedVendor(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab === tabLabel ? 'bg-green-500/80 text-white' : 'text-white/50 hover:text-white'}`}>
            {tabLabel === TABS[0] ? <LayoutList size={14}/> : <Store size={14}/>} {tabLabel}
          </button>
        ))}
      </motion.div>

      {tab === TABS[0] && (
        <>
          <motion.div variants={stagger} className="grid grid-cols-3 gap-4">
            {summaryCounts.map(s => (
              <motion.div key={s.label} variants={fadeUp} className={`glass-card p-4 bg-linear-to-br ${s.bg}`}>
                <div className="flex items-center gap-2 mb-1"><s.icon size={14} className={s.color}/><p className="text-xs text-white/50 uppercase tracking-wider">{s.label}</p></div>
                <p className="text-2xl font-black text-white">{s.value}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="glass-card divide-y divide-white/5">
            {feed.map(item => (
              <div key={item.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors">
                <div className={`mt-0.5 shrink-0 ${item.color}`}><item.icon size={16}/></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.label}</p>
                  <p className="text-xs text-white/40 truncate">{item.sub}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`badge ${STATUS_COLOR[item.status] || 'badge-purple'}`}>{item.status}</span>
                  <span className="text-xs text-white/30 whitespace-nowrap">{timeAgo(item.time)}</span>
                </div>
              </div>
            ))}
            {feed.length === 0 && <p className="text-white/40 text-sm text-center py-10">{t('sa.activity.noActivity')}</p>}
          </motion.div>
        </>
      )}

      {tab === TABS[1] && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Vendor list sidebar */}
          <motion.div variants={fadeUp} className="glass-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-bold text-white">{t('sa.activity.allShops')} ({vendors.length})</p>
            </div>
            <div className="divide-y divide-white/5 max-h-150 overflow-y-auto">
              {vendors.map(v => (
                <button key={v.id} onClick={() => setSelectedVendor(v.id === selectedVendor ? null : v.id)}
                  className={`w-full text-start px-4 py-3 flex items-center gap-3 transition-colors ${selectedVendor === v.id ? 'bg-green-500/10 border-s-2 border-green-500' : 'hover:bg-white/5'}`}>
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shrink-0">🏪</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">{v.shop_name}</p>
                      {v.is_premium && <Crown size={11} className="text-amber-400 shrink-0"/>}
                    </div>
                    <p className="text-xs text-white/40">{v.total_sales} sales</p>
                  </div>
                  <span className={`badge ${STATUS_COLOR[v.status] || 'badge-purple'} shrink-0`}>{v.status}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Vendor detail panel */}
          <motion.div variants={fadeUp} className="lg:col-span-2 space-y-4">
            {!activeVendor ? (
              <div className="glass-card p-12 text-center text-white/30">
                <Store size={32} className="mx-auto mb-3 opacity-30"/>
                <p>{t('sa.activity.selectShop')}</p>
              </div>
            ) : (
              <>
                <div className="glass-card p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">🏪</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg">{activeVendor.shop_name}</h3>
                      {activeVendor.is_premium && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                          <Crown size={10}/> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-sm">{activeVendor.total_sales} {t('sa.activity.totalSales')} · {t('sa.activity.rating')} {Number(activeVendor.rating||0).toFixed(1)}</p>
                  </div>
                  <span className={`badge ${STATUS_COLOR[activeVendor.status] || 'badge-purple'}`}>{activeVendor.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('sa.activity.products'),   value: vendorProducts(activeVendor.shop_name).length, color: 'text-indigo-400' },
                    { label: t('sa.activity.totalSales'), value: activeVendor.total_sales,                       color: 'text-green-400' },
                    { label: t('sa.activity.rating'),     value: `${Number(activeVendor.rating||0).toFixed(1)} ★`, color: 'text-amber-400' },
                  ].map(s => (
                    <div key={s.label} className="glass-card p-4 text-center">
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-white/40 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="glass-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <Package size={14} className="text-indigo-400"/>
                    <p className="text-sm font-bold text-white">{t('sa.activity.recentProd')}</p>
                  </div>
                  {vendorProducts(activeVendor.shop_name).length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-6">{t('sa.activity.noProducts')}</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {vendorProducts(activeVendor.shop_name).slice(0,10).map(p => (
                        <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{p.name}</p>
                            <p className="text-xs text-white/40">{formatPrice(parseFloat(p.price))}</p>
                          </div>
                          <span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'active' : 'inactive'}</span>
                          <span className="text-xs text-white/30 whitespace-nowrap">{timeAgo(p.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
