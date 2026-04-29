'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, User, Menu, X, ChevronDown,
  LogOut, Package, LayoutDashboard, Store, Sun, Moon,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface Vendor { id: number; shop_name: string; slug: string; city?: string; }

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobile]   = useState(false);
  const [shopOpen, setShopOpen]   = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const [searchOpen, setSearch]   = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [vendors, setVendors]     = useState<Vendor[]>([]);

  const pathname = usePathname();
  const { itemCount, openCart }            = useCartStore();
  const { user, isAuthenticated, logout }  = useAuthStore();
  const { theme, toggle: toggleTheme }     = useThemeStore();
  const isDark = theme === 'dark';
  const t = useT();

  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    fetch(`${BASE}/vendors/`)
      .then(r => r.json())
      .then((d: Vendor[] | { results: Vendor[] }) => {
        setVendors(Array.isArray(d) ? d : d.results ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobile(false); setShopOpen(false); setUserOpen(false); }, [pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'glass-dark border-b border-white/10 shadow-2xl' : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="bg-white rounded-2xl px-3 py-1.5 shadow-lg group-hover:scale-105 transition-transform">
                <img src="/logo/logo.png" alt="Souq Al Qadam" className="h-14 w-auto"/>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10', pathname === '/' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white')}>
                {t('nav.home')}
              </Link>

              {/* Shop dropdown */}
              <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
                <button className={cn('flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10', shopOpen ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white')}>
                  {t('nav.shop')} <ChevronDown size={14} className={cn('transition-transform', shopOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {shopOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full start-0 mt-1 w-56 glass-dark rounded-xl overflow-hidden"
                    >
                      {vendors.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-white/40">{t('nav.loadingVendors')}</div>
                      ) : (
                        vendors.map(v => (
                          <Link key={v.id} href={`/vendors/${v.slug}`}
                            className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                            <span className="font-medium">{v.shop_name}</span>
                            {v.city && <span className="text-white/40 text-xs ms-1">· {v.city}</span>}
                          </Link>
                        ))
                      )}
                      <Link href="/vendors" className="block px-4 py-2.5 text-sm text-indigo-400 hover:bg-white/10 border-t border-white/10 font-medium transition-colors">
                        {t('nav.allVendors')}
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/products" className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10', pathname.startsWith('/products') ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white')}>
                {t('nav.products')}
              </Link>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSearch(true)} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
                <Search size={18} />
              </button>

              <button onClick={toggleTheme} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all" aria-label="Toggle theme">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Language switcher */}
              <LanguageSwitcher />

              <button onClick={openCart} className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all">
                <ShoppingBag size={18} />
                {itemCount() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount()}
                  </motion.span>
                )}
              </button>

              {/* Desktop-only: user dropdown or sign in */}
              <div className="hidden md:block">
                {isAuthenticated ? (
                  <div className="relative">
                    <button onClick={() => setUserOpen(!userOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass hover:bg-white/10 transition-all">
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                      </div>
                      <ChevronDown size={12} className={cn('text-white/60 transition-transform', userOpen && 'rotate-180')} />
                    </button>
                    <AnimatePresence>
                      {userOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute end-0 top-full mt-1 w-52 glass-dark rounded-xl overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 border-b border-white/10">
                            <p className="text-sm font-semibold text-white">{user?.first_name || user?.username}</p>
                            <p className="text-xs text-white/50">{user?.email}</p>
                          </div>
                          <Link href="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"><User size={14}/> {t('nav.myAccount')}</Link>
                          <Link href="/account/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"><Package size={14}/> {t('nav.myOrders')}</Link>
                          {user?.role === 'vendor' && (
                            <Link href="/vendor" className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-400 hover:bg-white/10 transition-colors"><Store size={14}/> {t('nav.vendorDashboard')}</Link>
                          )}
                          {user?.role === 'admin' && (
                            <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-400 hover:bg-white/10 transition-colors"><LayoutDashboard size={14}/> {t('nav.adminPanel')}</Link>
                          )}
                          <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 w-full border-t border-white/10 transition-colors"><LogOut size={14}/> {t('nav.signOut')}</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/login" className="btn-primary text-sm px-4 py-2">{t('nav.signIn')}</Link>
                )}
              </div>

              {/* Mobile: hamburger */}
              <button className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/10 transition-all" onClick={() => setMobile(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-white/10 overflow-hidden"
              style={{ background: 'rgba(10,10,20,0.97)', backdropFilter: 'blur(20px)' }}
            >
              <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
                <Link href="/" className="block px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">{t('nav.home')}</Link>
                <Link href="/products" className="block px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">{t('nav.products')}</Link>

                {vendors.length > 0 && (
                  <>
                    <p className="px-3 pt-3 pb-1 text-xs text-white/40 font-semibold uppercase tracking-widest">{t('nav.shop')}</p>
                    {vendors.map(v => (
                      <Link key={v.id} href={`/vendors/${v.slug}`}
                        className="block px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
                        {v.shop_name}{v.city ? <span className="text-white/30 text-xs ms-1">· {v.city}</span> : ''}
                      </Link>
                    ))}
                    <Link href="/vendors" className="block px-3 py-2 rounded-lg text-sm text-indigo-400 hover:bg-white/10 transition-colors">{t('nav.allVendors')}</Link>
                  </>
                )}

                {isAuthenticated ? (
                  <>
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">{user?.first_name || user?.username}</p>
                          <p className="text-xs text-white/40">{user?.email}</p>
                        </div>
                      </div>
                      <Link href="/account" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"><User size={14}/> {t('nav.myAccount')}</Link>
                      <Link href="/account/orders" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"><Package size={14}/> {t('nav.myOrders')}</Link>
                      {user?.role === 'vendor' && (
                        <Link href="/vendor" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-indigo-400 hover:bg-white/10 transition-colors"><Store size={14}/> {t('nav.vendorDashboard')}</Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-indigo-400 hover:bg-white/10 transition-colors"><LayoutDashboard size={14}/> {t('nav.adminPanel')}</Link>
                      )}
                      <button onClick={logout} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/10 w-full transition-colors mt-1 border-t border-white/10">
                        <LogOut size={14}/> {t('nav.signOut')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pt-3 border-t border-white/10 flex gap-2">
                    <Link href="/login"    className="flex-1 btn-primary text-center text-sm py-2.5 rounded-xl">{t('nav.signIn')}</Link>
                    <Link href="/register" className="flex-1 btn-glass  text-center text-sm py-2.5 rounded-xl">{t('nav.register')}</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-start justify-center pt-20 px-4"
            onClick={() => setSearch(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ y: -20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.95 }}
              className="relative w-full max-w-xl glass-dark rounded-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <Search size={18} className="text-white/50 shrink-0" />
                <input
                  autoFocus
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder={t('nav.searchPlaceholder')}
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchVal.trim()) {
                      window.location.href = `/products?search=${encodeURIComponent(searchVal)}`;
                    }
                  }}
                />
                <button onClick={() => setSearch(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="mt-3 text-xs text-white/30 ps-7">{t('nav.searchHint')}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
