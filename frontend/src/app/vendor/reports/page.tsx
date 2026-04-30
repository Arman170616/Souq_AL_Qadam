'use client';
import { motion } from 'framer-motion';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, RefreshCw } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface MonthlyData  { month: string; month_year: string; revenue: number; orders: number; refunds: number; }
interface CategoryData { name: string; value: number; count: number; color: string; }
interface SizeData     { size: string; count: number; }
interface Summary {
  total_revenue: number; orders_this_month: number; revenue_this_month: number;
  avg_order_value: number; return_rate: number; total_orders: number;
}
interface Analytics {
  summary: Summary;
  monthly: MonthlyData[];
  categories: CategoryData[];
  top_sizes: SizeData[];
}

function exportCSV(monthly: MonthlyData[]) {
  const rows = [
    ['Month', 'Revenue', 'Orders', 'Refunds', 'Net'],
    ...monthly.map(m => [m.month_year, m.revenue, m.orders, m.refunds, (m.revenue - m.refunds).toFixed(2)]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `vendor-report-${new Date().toISOString().slice(0, 7)}.csv`;
  a.click();
}

export default function VendorReportsPage() {
  const t = useT();
  const { data, isLoading, isError, refetch } = useQuery<Analytics>({
    queryKey: ['vendor-analytics'],
    queryFn: () => ordersApi.vendorAnalytics().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const monthly    = data?.monthly    ?? [];
  const categories = data?.categories ?? [];
  const topSizes   = data?.top_sizes  ?? [];
  const summary    = data?.summary;
  const maxSize    = topSizes[0]?.count || 1;

  const SUMMARY_CARDS = summary ? [
    {
      label: t('ven.reports.totalRevenue'),
      value: formatPrice(summary.total_revenue),
      sub: t('ven.reports.ordersTotal').replace('{n}', String(summary.total_orders)),
      up: true,
      icon: DollarSign, color: 'text-indigo-400',
    },
    {
      label: t('ven.reports.ordersThisMonth'),
      value: summary.orders_this_month.toString(),
      sub: formatPrice(summary.revenue_this_month),
      up: summary.orders_this_month > 0,
      icon: ShoppingBag, color: 'text-pink-400',
    },
    {
      label: t('ven.reports.avgOrderValue'),
      value: formatPrice(summary.avg_order_value),
      sub: t('ven.reports.perOrder'),
      up: summary.avg_order_value > 0,
      icon: TrendingUp, color: 'text-amber-400',
    },
    {
      label: t('ven.reports.returnRate'),
      value: `${summary.return_rate.toFixed(1)}%`,
      sub: t('ven.reports.refundedOrders'),
      up: summary.return_rate < 5,
      icon: summary.return_rate < 5 ? TrendingUp : TrendingDown,
      color: summary.return_rate < 5 ? 'text-green-400' : 'text-red-400',
    },
  ] : [];

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 shimmer rounded-xl"/>
        <div className="h-9 w-24 shimmer rounded-xl"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({length:4}).map((_,i) => <div key={i} className="glass-card p-5 h-24 shimmer"/>)}
      </div>
      <div className="glass-card p-6 h-72 shimmer"/>
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Package size={40} className="text-white/20"/>
      <p className="text-white/40">{t('ven.reports.couldNotLoad')}</p>
      <button onClick={() => refetch()} className="btn-glass px-4 py-2 rounded-xl text-sm flex items-center gap-2">
        <RefreshCw size={14}/> {t('ven.reports.retry')}
      </button>
    </div>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white">{t('ven.reports.title')}</h2>
        <button onClick={() => exportCSV(monthly)} disabled={monthly.length === 0}
          className="btn-glass px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-40">
          <Download size={15}/> {t('ven.reports.export')}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map(s => (
          <div key={s.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl glass flex items-center justify-center ${s.color}`}>
                <s.icon size={16}/>
              </div>
            </div>
            <p className="text-xl font-black text-white">{s.value}</p>
            <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
            <p className="text-xs text-white/30 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-white">{t('ven.reports.revenueVsOrders')}</h3>
            <p className="text-xs text-white/40">{t('ven.reports.lastMonths').replace('{n}', String(monthly.length))}</p>
          </div>
          <div className="flex gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"/>{t('ven.reports.revenue')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-pink-500 inline-block"/>{t('ven.reports.orders')}</span>
          </div>
        </div>
        {monthly.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-white/30 text-sm">{t('ven.reports.noOrderData')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{fill:'rgba(255,255,255,0.4)',fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="left" tick={{fill:'rgba(255,255,255,0.4)',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <YAxis yAxisId="right" orientation="right" tick={{fill:'rgba(255,255,255,0.4)',fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{background:'rgba(15,15,40,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'white'}}
                formatter={(v: unknown, n: unknown) => [n==='revenue' ? formatPrice(Number(v)) : Number(v), n==='revenue' ? t('ven.reports.revenue') : t('ven.reports.orders')]}
              />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)"/>
              <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#ec4899" strokeWidth={2} fill="none" strokeDasharray="4 4"/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category pie */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-5">{t('ven.reports.byCategory')}</h3>
          {categories.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-white/30 text-sm">{t('ven.reports.noCategoryData')}</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categories.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip
                    contentStyle={{background:'rgba(15,15,40,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'white'}}
                    formatter={(v: unknown) => [`${Number(v)}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categories.map(c => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{background: c.color}}/>
                    <span className="text-sm text-white/70 flex-1">{c.name}</span>
                    <span className="text-sm font-bold text-white">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top sizes */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-5">{t('ven.reports.bestSizes')}</h3>
          {topSizes.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-white/30 text-sm">{t('ven.reports.noSizeData')}</div>
          ) : (
            <div className="space-y-3">
              {topSizes.map((s, i) => (
                <div key={s.size} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-indigo-400 w-6 text-end">{i+1}</span>
                  <span className="w-12 text-center text-sm font-semibold text-white glass rounded-lg py-1">{s.size}</span>
                  <div className="flex-1 h-2 glass rounded-full overflow-hidden">
                    <motion.div
                      initial={{width:0}}
                      animate={{width:`${(s.count / maxSize) * 100}%`}}
                      transition={{duration:0.8, delay:i*0.1}}
                      className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-white/60 w-16 text-end">{s.count} {t('ven.reports.sold')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white">{t('ven.reports.monthlyBreakdown')}</h3>
          <button onClick={() => exportCSV(monthly)} disabled={monthly.length === 0}
            className="btn-glass text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-40">
            <Download size={12}/> CSV
          </button>
        </div>
        {monthly.length === 0 ? (
          <div className="p-10 text-center text-white/30 text-sm">{t('ven.reports.noOrders')}</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t('ven.reports.month')}</th>
                <th>{t('ven.reports.revenue')}</th>
                <th>{t('ven.reports.orders')}</th>
                <th>{t('ven.reports.refunds')}</th>
                <th>{t('ven.reports.net')}</th>
              </tr>
            </thead>
            <tbody>
              {[...monthly].reverse().map(m => (
                <tr key={m.month_year}>
                  <td className="font-semibold text-white">{m.month_year}</td>
                  <td className="text-green-400 font-semibold">{formatPrice(m.revenue)}</td>
                  <td>{m.orders}</td>
                  <td className="text-red-400">{m.refunds > 0 ? `-${formatPrice(m.refunds)}` : '—'}</td>
                  <td className="font-bold text-white">{formatPrice(m.revenue - m.refunds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
