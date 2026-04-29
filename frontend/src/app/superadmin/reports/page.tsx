'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ShoppingBag, Store, Award, LayoutGrid } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const fadeUp  = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0} };
const stagger = { show:{ transition:{ staggerChildren:0.06 } } };

export default function ReportsPage() {
  const t = useT();

  const TABS = [t('sa.reports.tabOverview'), t('sa.reports.tabByShop')] as const;
  type Tab = typeof TABS[number];

  const [tab, setTab] = useState<Tab>(TABS[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => ordersApi.adminAnalytics().then(r => r.data),
  });

  if (isLoading) return (
    <div className="space-y-4">
      {Array.from({length:4}).map((_,i) => <div key={i} className="glass-card h-28 animate-pulse"/>)}
    </div>
  );

  const summary       = data?.summary       ?? {};
  const monthly       = data?.monthly       ?? [];
  const topVendors    = data?.top_vendors   ?? [];
  const categories    = data?.categories    ?? [];
  const vendorMonthly: { month: string; vendors: { id:number; name:string; revenue:number; orders:number }[] }[]
    = data?.vendor_monthly ?? [];

  const maxRevenue = Math.max(...monthly.map((m: {revenue:number}) => m.revenue), 1);

  const allShops = Array.from(
    new Set(vendorMonthly.flatMap(m => m.vendors.map(v => v.name)))
  ).sort();

  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><TrendingUp size={22} className="text-purple-400"/> {t('sa.reports.title')}</h1>
        <p className="text-white/40 text-sm mt-1">{t('sa.reports.subtitle')}</p>
      </motion.div>

      {/* Summary stats */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('sa.reports.totalRev'),    value: formatPrice(summary.total_revenue ?? 0),     icon:DollarSign, color:'from-green-500/20 to-emerald-500/20', ic:'text-green-400' },
          { label: t('sa.reports.delivRev'),    value: formatPrice(summary.delivered_revenue ?? 0),  icon:TrendingUp,  color:'from-indigo-500/20 to-purple-500/20',  ic:'text-indigo-400' },
          { label: t('sa.reports.totalOrders'), value: summary.total_orders ?? 0,                    icon:ShoppingBag, color:'from-pink-500/20 to-rose-500/20',      ic:'text-pink-400' },
          { label: t('sa.reports.activeVend'),  value: summary.active_vendors ?? 0,                  icon:Store,       color:'from-amber-500/20 to-orange-500/20',   ic:'text-amber-400' },
        ].map(s => (
          <motion.div key={s.label} variants={fadeUp} className={`glass-card p-5 bg-linear-to-br ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">{s.label}</p>
              <s.icon size={16} className={s.ic}/>
            </div>
            <p className="text-2xl font-black text-white">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tab switcher */}
      <motion.div variants={fadeUp} className="flex gap-1 glass-dark rounded-xl p-1 w-fit">
        {TABS.map(tabLabel => (
          <button key={tabLabel} onClick={() => setTab(tabLabel)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab === tabLabel ? 'bg-purple-500/80 text-white' : 'text-white/50 hover:text-white'}`}>
            {tabLabel === TABS[0] ? <TrendingUp size={14}/> : <LayoutGrid size={14}/>} {tabLabel}
          </button>
        ))}
      </motion.div>

      {tab === TABS[0] && (
        <>
          {/* Monthly revenue chart */}
          <motion.div variants={fadeUp} className="glass-card p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-400"/> {t('sa.reports.monthlyRev')}</h3>
            {monthly.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">{t('sa.reports.noMonthly')}</p>
            ) : (
              <>
                <div className="flex items-end gap-2 h-40 mb-4">
                  {monthly.map((m: {month:string; revenue:number; orders:number; commission:number}) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div className="w-full flex items-end justify-center" style={{height:120}}>
                        <motion.div
                          initial={{height:0}} animate={{height: `${(m.revenue / maxRevenue) * 100}%`}}
                          transition={{duration:0.6, delay:0.1}}
                          className="w-full bg-linear-to-t from-indigo-600 to-purple-500 rounded-t-md min-h-1"
                          title={formatPrice(m.revenue)}
                        />
                      </div>
                      <p className="text-xs text-white/40 truncate w-full text-center">{m.month.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                        <th className="text-start py-2 pe-4">{t('sa.reports.month')}</th>
                        <th className="text-end py-2 pe-4">{t('sa.reports.revenue')}</th>
                        <th className="text-end py-2 pe-4">{t('sa.reports.commission')}</th>
                        <th className="text-end py-2">{t('sa.reports.orders')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...monthly].reverse().map((m: {month:string; revenue:number; orders:number; commission:number}) => (
                        <tr key={m.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2.5 pe-4 text-white/80 font-medium">{m.month}</td>
                          <td className="py-2.5 pe-4 text-end text-green-400 font-semibold">{formatPrice(m.revenue)}</td>
                          <td className="py-2.5 pe-4 text-end text-indigo-400">{formatPrice(m.commission)}</td>
                          <td className="py-2.5 text-end text-white/60">{m.orders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Vendors */}
            <motion.div variants={fadeUp} className="glass-card p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Award size={16} className="text-amber-400"/> {t('sa.reports.topVendors')}</h3>
              {topVendors.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-6">{t('sa.reports.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {topVendors.map((v: {name:string; revenue:number; orders:number; commission:number}, i:number) => (
                    <div key={v.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <span className="text-lg font-black text-white/20 w-6 shrink-0">#{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{v.name}</p>
                        <p className="text-xs text-white/40">{v.orders} {t('sa.reports.orders')} · {t('sa.reports.commission')}: {formatPrice(v.commission)}</p>
                      </div>
                      <p className="text-sm font-bold text-green-400 shrink-0">{formatPrice(v.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Category Breakdown */}
            <motion.div variants={fadeUp} className="glass-card p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><ShoppingBag size={16} className="text-pink-400"/> {t('sa.reports.catBreak')}</h3>
              {categories.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-6">{t('sa.reports.noData')}</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((c: {name:string; value:number; orders:number}) => (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white/70">{c.name}</span>
                        <span className="text-white/50 text-xs">{c.orders} {t('sa.reports.orders')} · {c.value}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{width:0}} animate={{width:`${c.value}%`}}
                          transition={{duration:0.7}}
                          className="h-full rounded-full bg-green-500"/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}

      {tab === TABS[1] && (
        <motion.div variants={fadeUp} className="glass-card p-6 overflow-x-auto">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2"><LayoutGrid size={16} className="text-purple-400"/> {t('sa.reports.shopBreak')}</h3>
          {vendorMonthly.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">{t('sa.reports.noOrders')}</p>
          ) : (
            <table className="w-full text-sm min-w-150">
              <thead>
                <tr className="text-xs text-white/40 uppercase tracking-wider border-b border-white/10">
                  <th className="text-start py-2 pe-4 sticky inset-s-0 bg-transparent">{t('sa.reports.month')}</th>
                  {allShops.map(name => (
                    <th key={name} className="text-end py-2 px-3 whitespace-nowrap">{name}</th>
                  ))}
                  <th className="text-end py-2 ps-3">{t('sa.reports.total')}</th>
                </tr>
              </thead>
              <tbody>
                {[...vendorMonthly].reverse().map(row => {
                  const byShop: Record<string, number> = {};
                  row.vendors.forEach(v => { byShop[v.name] = v.revenue; });
                  const rowTotal = row.vendors.reduce((s, v) => s + v.revenue, 0);
                  return (
                    <tr key={row.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2.5 pe-4 text-white/80 font-medium sticky inset-s-0 whitespace-nowrap">{row.month}</td>
                      {allShops.map(name => (
                        <td key={name} className="py-2.5 px-3 text-end text-white/60 whitespace-nowrap">
                          {byShop[name] ? formatPrice(byShop[name]) : <span className="text-white/20">—</span>}
                        </td>
                      ))}
                      <td className="py-2.5 ps-3 text-end text-green-400 font-semibold whitespace-nowrap">{formatPrice(rowTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/20">
                  <td className="py-2.5 pe-4 text-white/60 font-bold text-xs uppercase">{t('sa.reports.total')}</td>
                  {allShops.map(name => {
                    const total = vendorMonthly.reduce((s, row) => {
                      const v = row.vendors.find(v => v.name === name);
                      return s + (v?.revenue ?? 0);
                    }, 0);
                    return <td key={name} className="py-2.5 px-3 text-end text-indigo-400 font-semibold whitespace-nowrap">{formatPrice(total)}</td>;
                  })}
                  <td className="py-2.5 ps-3 text-end text-green-400 font-bold whitespace-nowrap">
                    {formatPrice(vendorMonthly.reduce((s, row) => s + row.vendors.reduce((r, v) => r + v.revenue, 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
