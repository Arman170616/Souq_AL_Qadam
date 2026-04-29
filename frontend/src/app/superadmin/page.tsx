'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Crown, Users, ShieldCheck, Store, ShoppingBag, Package, UserCheck, Clock } from 'lucide-react';
import { superAdminApi } from '@/lib/api';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: React.ElementType; label: string; value: number | string; color: string; href?: string;
}) {
  const card = (
    <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white"/>
      </div>
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-white text-2xl font-black">{value}</p>
      </div>
    </motion.div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-purple-500/20 text-purple-300',
  admin:      'bg-red-500/20 text-red-300',
  vendor:     'bg-blue-500/20 text-blue-300',
  customer:   'bg-green-500/20 text-green-300',
};

export default function SuperAdminDashboard() {
  const t = useT();

  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-stats'],
    queryFn: () => superAdminApi.stats().then(r => r.data),
    retry: 1,
  });

  const { data: usersData } = useQuery({
    queryKey: ['superadmin-recent-users'],
    queryFn: () => superAdminApi.users({}).then(r => r.data),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  const stats = data ?? {};
  const recentUsers = (usersData?.results ?? usersData ?? []).slice(0, 6);

  const totalUsers     = stats.total_users     ?? 0;
  const totalCustomers = stats.total_customers ?? 0;
  const totalVendors   = stats.total_vendors   ?? 0;
  const totalAdmins    = stats.total_admins    ?? 0;
  const totalSuperAdmins = stats.total_superadmins ?? 0;
  const totalOrders    = stats.total_orders    ?? 0;
  const totalProducts  = stats.total_products  ?? 0;
  const pendingVendors = stats.pending_vendors ?? 0;

  const roleRows = [
    { role: 'superadmin', count: totalSuperAdmins, label: t('sa.role.superadmins'), bar: 'bg-purple-500' },
    { role: 'admin',      count: totalAdmins,      label: t('sa.role.admins'),      bar: 'bg-red-500' },
    { role: 'vendor',     count: totalVendors,     label: t('sa.role.vendors'),     bar: 'bg-blue-500' },
    { role: 'customer',   count: totalCustomers,   label: t('sa.role.customers'),   bar: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crown size={24} className="text-purple-400"/>
        <div>
          <h1 className="text-2xl font-black text-white">{t('sa.dash.title')}</h1>
          <p className="text-white/40 text-sm">{t('sa.dash.subtitle')}</p>
        </div>
      </div>

      {/* Pending vendor approval alert */}
      {pendingVendors > 0 && (
        <Link href="/superadmin/vendors">
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border border-amber-500/40 bg-linear-to-r from-amber-500/15 to-orange-500/10 cursor-pointer hover:border-amber-500/70 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-amber-400"/>
              </div>
              <div>
                <p className="text-amber-300 font-bold text-sm">
                  {t('sa.dash.pendingAlert').replace('{n}', String(pendingVendors))}
                </p>
                <p className="text-amber-400/60 text-xs">{t('sa.dash.approvalNote')}</p>
              </div>
            </div>
            <span className="text-amber-400 text-xs font-semibold shrink-0 flex items-center gap-1">
              {t('sa.dash.reviewNow')} →
            </span>
          </motion.div>
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users}       label={t('sa.dash.totalUsers')}    value={totalUsers}       color="bg-purple-600" href="/superadmin/users"/>
        <StatCard icon={UserCheck}   label={t('sa.dash.customers')}     value={totalCustomers}   color="bg-green-600"  href="/superadmin/users?role=customer"/>
        <StatCard icon={Store}       label={t('sa.dash.vendors')}       value={totalVendors}     color="bg-blue-600"   href="/superadmin/vendors"/>
        <StatCard icon={ShieldCheck} label={t('sa.dash.admins')}        value={totalAdmins}      color="bg-red-600"    href="/superadmin/admins"/>
        <StatCard icon={Crown}       label={t('sa.dash.superAdmins')}   value={totalSuperAdmins} color="bg-indigo-600"/>
        <StatCard icon={ShoppingBag} label={t('sa.dash.totalOrders')}   value={totalOrders}      color="bg-orange-600" href="/admin/orders"/>
        <StatCard icon={Package}     label={t('sa.dash.totalProducts')} value={totalProducts}    color="bg-teal-600"   href="/admin/products"/>
        <StatCard icon={Clock}       label={t('sa.dash.pendingVendors')}value={pendingVendors}   color={pendingVendors > 0 ? "bg-amber-500" : "bg-yellow-700"} href="/superadmin/vendors"/>
      </div>

      {/* Role distribution + Recent users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Role distribution */}
        <div className="glass-card p-5">
          <h2 className="font-bold text-white mb-4">{t('sa.dash.roleDist')}</h2>
          <div className="space-y-4">
            {roleRows.map(({ role, count, label, bar }) => {
              const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[role]}`}>{label}</span>
                    <span className="text-white/60">{count} &nbsp;<span className="text-white/30">({pct}%)</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-1.5 rounded-full ${bar}`}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent users */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">{t('sa.dash.recentUsers')}</h2>
            <Link href="/superadmin/users" className="text-purple-400 text-xs hover:underline">{t('sa.dash.viewAll')}</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-6">{t('sa.dash.noUsers')}</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((u: { id: number; email: string; first_name: string; last_name: string; role: string }) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.email}
                      </p>
                      <p className="text-white/40 text-xs truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className={`ms-2 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${ROLE_BADGE[u.role] ?? 'bg-white/10 text-white/50'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
