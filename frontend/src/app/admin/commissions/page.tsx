'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import { vendorsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface VendorRow {
  vendor_id: number;
  vendor_name: string;
  commission_rate: number;
  total: number;
  pending: number;
  settled: number;
  orders: number;
}

interface MonthlyPoint { month: string; amount: number; count: number; }

function RateEditor({ vendor, onDone }: { vendor: VendorRow; onDone: () => void }) {
  const qc = useQueryClient();
  const [rate, setRate] = useState(String(vendor.commission_rate));
  const mut = useMutation({
    mutationFn: () => vendorsApi.updateCommissionRate(vendor.vendor_id, parseFloat(rate)),
    onSuccess: () => { toast.success('Rate updated'); qc.invalidateQueries({ queryKey: ['admin-commissions'] }); onDone(); },
    onError: () => toast.error('Failed to update rate'),
  });
  return (
    <div className="flex items-center gap-1.5">
      <input type="number" min="0" max="100" step="0.5"
        value={rate} onChange={e => setRate(e.target.value)}
        className="glass-input py-1 px-2 text-sm w-20 text-center"/>
      <span className="text-white/50 text-xs">%</span>
      <button onClick={() => mut.mutate()} disabled={mut.isPending}
        className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
        <Check size={12}/>
      </button>
      <button onClick={onDone} className="p-1 rounded bg-white/10 text-white/40 hover:bg-white/20 transition-colors">
        <X size={12}/>
      </button>
    </div>
  );
}

export default function AdminCommissionsPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: () => vendorsApi.adminCommissions().then(r => r.data),
  });

  const settleMut = useMutation({
    mutationFn: (vendorId: number) => vendorsApi.settleCommissions(vendorId),
    onSuccess: (_, vendorId) => {
      toast.success('Commissions settled');
      qc.invalidateQueries({ queryKey: ['admin-commissions'] });
      const name = data?.vendors?.find((v: VendorRow) => v.vendor_id === vendorId)?.vendor_name ?? '';
      if (name) toast.success(`${name} marked as settled`);
    },
    onError: () => toast.error('Settlement failed'),
  });

  const summary = data?.summary ?? {};
  const monthly: MonthlyPoint[] = data?.monthly ?? [];
  const vendors: VendorRow[] = data?.vendors ?? [];

  const SUMMARY_CARDS = [
    { label: 'Total Earned',    value: formatPrice(summary.total_earned   ?? 0), icon: TrendingUp,    color: 'from-indigo-500/20 to-purple-500/20',  iconColor: 'text-indigo-400' },
    { label: 'Pending Payout',  value: formatPrice(summary.pending_amount ?? 0), icon: Clock,          color: 'from-amber-500/20 to-orange-500/20',   iconColor: 'text-amber-400' },
    { label: 'Settled',         value: formatPrice(summary.settled_amount ?? 0), icon: CheckCircle2,  color: 'from-emerald-500/20 to-green-500/20',  iconColor: 'text-emerald-400' },
    { label: 'Total Orders',    value: String(summary.total_count ?? 0),         icon: TrendingUp,    color: 'from-blue-500/20 to-cyan-500/20',      iconColor: 'text-blue-400' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-black text-white">Commission Report</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map(c => (
          <div key={c.label} className={`glass-card p-5 bg-linear-to-br ${c.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">{c.label}</p>
              <c.icon size={16} className={c.iconColor}/>
            </div>
            <p className="text-2xl font-black text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-5">Monthly Commissions</h3>
        {monthly.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No commission data yet. Commissions are generated when orders are delivered.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `৳${(v/1000).toFixed(0)}k`}/>
              <Tooltip
                contentStyle={{ background: 'rgba(15,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                formatter={(v: unknown) => [formatPrice(Number(v)), 'Commission']}/>
              <Bar dataKey="amount" fill="url(#commGrad)" radius={[6, 6, 0, 0]}/>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-vendor table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-bold text-white">Vendor Breakdown</h3>
        </div>
        {vendors.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-10">No vendor commissions yet.</p>
        ) : (
          <table className="glass-table w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-left">Rate</th>
                <th className="px-4 py-3 text-left">Total Earned</th>
                <th className="px-4 py-3 text-left">Pending</th>
                <th className="px-4 py-3 text-left">Settled</th>
                <th className="px-4 py-3 text-left">Orders</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.vendor_id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{v.vendor_name}</td>
                  <td className="px-4 py-3">
                    {editingId === v.vendor_id ? (
                      <RateEditor vendor={v} onDone={() => setEditingId(null)}/>
                    ) : (
                      <button onClick={() => setEditingId(v.vendor_id)}
                        className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors group">
                        <span className="font-mono">{v.commission_rate}%</span>
                        <Pencil size={11} className="opacity-0 group-hover:opacity-60 transition-opacity"/>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{formatPrice(v.total)}</td>
                  <td className="px-4 py-3">
                    <span className="text-amber-300 font-medium">{formatPrice(v.pending)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-400 font-medium">{formatPrice(v.settled)}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{v.orders}</td>
                  <td className="px-4 py-3">
                    {v.pending > 0 ? (
                      <button
                        onClick={() => { if (confirm(`Mark all pending commissions for ${v.vendor_name} as settled?`)) settleMut.mutate(v.vendor_id); }}
                        disabled={settleMut.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                        Settle
                      </button>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
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
