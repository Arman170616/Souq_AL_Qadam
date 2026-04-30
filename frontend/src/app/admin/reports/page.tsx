'use client';
import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { useT } from '@/lib/i18n';

const PIE_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#8b5cf6','#06b6d4','#f97316'];

interface MonthlyRow { month: string; revenue: number; commission: number; orders: number; }
interface VendorRow  { name: string; revenue: number; orders: number; commission: number; }
interface CategoryRow{ name: string; value: number; orders: number; }
interface Analytics {
  summary: {
    total_revenue: number; total_commission: number; total_orders: number;
    delivered_revenue: number; active_vendors: number; pending_vendors: number;
    total_customers: number; total_products: number;
  };
  monthly:     MonthlyRow[];
  top_vendors: VendorRow[];
  categories:  CategoryRow[];
}

export default function AdminReportsPage() {
  const t = useT();

  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ['admin-analytics'],
    queryFn:  () => ordersApi.adminAnalytics().then(r => r.data),
  });

  const summary     = data?.summary;
  const monthly     = data?.monthly     ?? [];
  const topVendors  = data?.top_vendors ?? [];
  const categories  = data?.categories  ?? [];

  const maxRevenue = topVendors[0]?.revenue || 1;

  const exportCSV = () => {
    const rows = [
      ['Month','GMV','Commission','Orders'],
      ...monthly.map(m => [m.month, m.revenue, m.commission, m.orders]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'reports.csv';
    a.click();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-black text-white">{t('adm.reports.title')}</h2>
        <div className="flex gap-2">
          <button className="btn-glass px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm">
            <FileText size={15}/> PDF
          </button>
          <button onClick={exportCSV} className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm">
            <FileSpreadsheet size={15}/> Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="glass-card p-5 h-24 animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('adm.reports.totalRevenue'),      value: formatPrice(summary?.total_revenue    ?? 0), sub: t('adm.reports.allTimeGmv') },
            { label: t('adm.reports.commissionEarned'),  value: formatPrice(summary?.total_commission ?? 0), sub: t('adm.reports.avgCommission') },
            { label: t('adm.reports.totalOrders'),       value: (summary?.total_orders ?? 0).toLocaleString(),  sub: t('adm.reports.allTimeOrders') },
            { label: t('adm.reports.activeVendors'),     value: (summary?.active_vendors ?? 0).toString(),      sub: t('adm.reports.pendingApproval').replace('{n}', String(summary?.pending_vendors ?? 0)) },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <p className="text-2xl font-black text-white mb-1">{s.value}</p>
              <p className="text-sm font-semibold text-white/70">{s.label}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">{t('adm.reports.revenueCommission')}</h3>
          <div className="flex gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"/>{t('adm.reports.revenue')}</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"/>{t('adm.reports.commission')}</span>
          </div>
        </div>
        {isLoading || monthly.length === 0 ? (
          <div className="h-60 flex items-center justify-center text-white/30 text-sm">
            {isLoading ? t('adm.reports.loading') : t('adm.reports.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="month" tick={{fill:'rgba(255,255,255,0.4)',fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'rgba(255,255,255,0.4)',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip contentStyle={{background:'rgba(15,15,40,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'white'}}
                formatter={(v,n)=>[formatPrice(Number(v)), n==='revenue' ? t('adm.reports.revenue') : t('adm.reports.commission')]}/>
              <Bar dataKey="revenue"    fill="#6366f1" radius={[4,4,0,0]} opacity={0.8}/>
              <Bar dataKey="commission" fill="#f59e0b" radius={[4,4,0,0]} opacity={0.8}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-5">{t('adm.reports.byCategory')}</h3>
          {isLoading || categories.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-white/30 text-sm">
              {isLoading ? t('adm.reports.loading') : t('adm.reports.noData')}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categories.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'rgba(15,15,40,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'white'}} formatter={(v)=>[`${Number(v)}%`,'Share']}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {categories.map((c,i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{background: PIE_COLORS[i % PIE_COLORS.length]}}/>
                    <span className="text-sm text-white/70 flex-1 truncate">{c.name}</span>
                    <span className="text-sm font-bold text-white">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-white mb-5">{t('adm.reports.topVendors')}</h3>
          {isLoading || topVendors.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-white/30 text-sm">
              {isLoading ? t('adm.reports.loading') : t('adm.reports.noVendorData')}
            </div>
          ) : (
            <div className="space-y-3">
              {topVendors.map((v,i) => (
                <div key={v.name} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-indigo-400 w-5">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-white truncate">{v.name}</span>
                      <span className="text-xs text-white/60 ms-2 shrink-0">{formatPrice(v.revenue)}</span>
                    </div>
                    <div className="h-1.5 glass rounded-full overflow-hidden">
                      <motion.div
                        initial={{width:0}}
                        animate={{width:`${(v.revenue/maxRevenue)*100}%`}}
                        transition={{duration:0.8,delay:i*0.1}}
                        className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"/>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-xs text-white/40">{v.orders} {t('adm.reports.orders')}</span>
                      <span className="text-xs text-amber-400">{t('adm.reports.commissionLabel')} {formatPrice(v.commission)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white">{t('adm.reports.monthlySummary')}</h3>
          <button onClick={exportCSV} className="btn-glass text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Download size={12}/>CSV
          </button>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-white/40">{t('adm.reports.loading')}</div>
        ) : monthly.length === 0 ? (
          <div className="p-8 text-center text-white/40">{t('adm.reports.noOrders')}</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t('adm.reports.colMonth')}</th>
                <th>{t('adm.reports.colGmv')}</th>
                <th>{t('adm.reports.commission')}</th>
                <th>{t('adm.reports.colOrders')}</th>
                <th>{t('adm.reports.colAvgOrder')}</th>
                <th>{t('adm.reports.colGrowth')}</th>
              </tr>
            </thead>
            <tbody>
              {[...monthly].reverse().map((m,i,arr) => {
                const prev   = arr[i+1];
                const growth = prev ? (((m.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : null;
                return (
                  <tr key={m.month}>
                    <td className="font-semibold text-white">{m.month}</td>
                    <td className="text-green-400 font-semibold">{formatPrice(m.revenue)}</td>
                    <td className="text-amber-400">{formatPrice(m.commission)}</td>
                    <td>{m.orders}</td>
                    <td>{m.orders > 0 ? formatPrice(Math.round(m.revenue / m.orders)) : '—'}</td>
                    <td>
                      {growth
                        ? <span className={parseFloat(growth)>=0?'text-green-400':'text-red-400'}>{parseFloat(growth)>=0?'+':''}{growth}%</span>
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
