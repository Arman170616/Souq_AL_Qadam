'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ShieldCheck, TrendingUp, Truck, Activity, Store,
  Menu, X, ChevronRight, LogOut, Bell, Crown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [sidebarOpen, setSidebar] = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const NAV = [
    { href: '/superadmin',           label: t('sa.nav.dashboard'), icon: LayoutDashboard },
    { href: '/superadmin/users',     label: t('sa.nav.users'),     icon: Users },
    { href: '/superadmin/admins',    label: t('sa.nav.admins'),    icon: ShieldCheck },
    { href: '/superadmin/vendors',   label: t('sa.nav.vendors'),   icon: Store },
    { href: '/superadmin/reports',   label: t('sa.nav.reports'),   icon: TrendingUp },
    { href: '/superadmin/delivery',  label: t('sa.nav.delivery'),  icon: Truck },
    { href: '/superadmin/activity',  label: t('sa.nav.activity'),  icon: Activity },
  ];

  const handleLogout = () => { logout(); router.push('/'); };

  useEffect(() => { setAuthReady(true); }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) { router.replace(`/login?next=${pathname}`); return; }
    if (user?.role !== 'superadmin') {
      toast.error('Super Admin access required.');
      router.replace('/');
    }
  }, [authReady, isAuthenticated, user, router, pathname]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    setSidebar(!mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      setSidebar(!e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { if (isMobile) setSidebar(false); }, [pathname, isMobile]);

  if (!authReady || !isAuthenticated || user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"/>
      </div>
    );
  }

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'SA';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="bg-white rounded-xl px-2 py-1 shrink-0 shadow-sm">
          <img src="/logo/logo.png" alt="Souq Al Qadam" className="h-12 w-auto"/>
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">{t('sa.superAdmin')}</p>
          <p className="text-xs text-purple-400 mt-0.5 flex items-center gap-1">
            <Crown size={10}/> {t('sa.fullAccess')}
          </p>
        </div>
        <button onClick={() => setSidebar(false)}
          className="ms-auto p-1 rounded-lg hover:bg-white/10 text-white/50 shrink-0 md:hidden">
          <X size={15}/>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = item.href === '/superadmin'
            ? pathname === '/superadmin'
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-white/60 hover:bg-white/10 hover:text-white',
              )}>
              <item.icon size={18} className="shrink-0"/>
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-60"/>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-2 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl glass mb-2">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">
              {user.first_name || user.email.split('@')[0]}
            </p>
            <p className="text-xs text-purple-400 flex items-center gap-1"><Crown size={9}/> {t('sa.superAdmin')}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
          <LogOut size={15} className="shrink-0"/> {t('sa.signOut')}
        </button>
      </div>
    </>
  );

  const pageTitle = NAV.find(n =>
    n.href === '/superadmin' ? pathname === '/superadmin' : pathname.startsWith(n.href)
  )?.label ?? t('sa.superAdmin');

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebar(false)}/>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ x: isMobile ? (sidebarOpen ? 0 : -260) : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'panel-sidebar flex flex-col h-screen overflow-hidden border-e border-white/10 z-50',
          isMobile ? 'fixed top-0 inset-s-0 w-64' : 'sticky top-0 w-60 shrink-0',
        )}>
        {sidebarContent}
      </motion.aside>

      <div className="flex-1 overflow-auto min-w-0">
        {/* Topbar */}
        <div className="panel-topbar sticky top-0 z-20 border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebar(!sidebarOpen)}
              className="p-2 rounded-lg glass hover:bg-white/10 text-white/60 hover:text-white transition-all md:hidden">
              <Menu size={16}/>
            </button>
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-purple-400"/>
              <h2 className="font-semibold text-white text-sm sm:text-base">{pageTitle}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="relative p-2 rounded-lg glass hover:bg-white/15 transition-all text-white/60 hover:text-white">
              <Bell size={16}/>
              <span className="absolute top-1 inset-e-1 w-2 h-2 bg-purple-500 rounded-full"/>
            </button>
            <Link href="/" className="btn-glass text-xs px-3 py-2 rounded-lg hidden sm:inline-flex">
              {t('sa.viewStore')}
            </Link>
          </div>
        </div>

        <main className="p-4 sm:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
