'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, ShieldCheck, Truck, RefreshCcw, Headphones, TrendingUp, ShoppingCart, Heart, MapPin, Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { productsApi, vendorsApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';
import JsonLd from '@/components/seo/JsonLd';
import { useT } from '@/lib/i18n';

const CAT_META: Record<string, { emoji: string; color: string }> = {
  default:        { emoji: '👟', color: 'from-indigo-500/20 to-purple-500/20' },
  shoes:          { emoji: '👟', color: 'from-blue-500/20 to-indigo-500/20' },
  bags:           { emoji: '👜', color: 'from-amber-500/20 to-orange-500/20' },
  'mobile-cover': { emoji: '📱', color: 'from-slate-500/20 to-gray-500/20' },
  men:            { emoji: '👟', color: 'from-blue-500/20 to-indigo-500/20' },
  women:          { emoji: '👠', color: 'from-pink-500/20 to-rose-500/20' },
  leather:        { emoji: '🥿', color: 'from-amber-500/20 to-orange-500/20' },
  sports:         { emoji: '⚽', color: 'from-green-500/20 to-emerald-500/20' },
  kids:           { emoji: '🎈', color: 'from-purple-500/20 to-violet-500/20' },
  formal:         { emoji: '👔', color: 'from-slate-500/20 to-gray-500/20' },
};

const EMOJI_POOL = ['👟','👠','🥿','👜','🎽','🧢','⚽','🎈','👔','🛍️','💼','🩴'];

const fadeUp   = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } };
const stagger  = { show: { transition: { staggerChildren: 0.08 } } };

interface Product {
  id: number; name: string; slug: string; price: string;
  discount_price?: string; rating: string; review_count: number;
  primary_image?: string; vendor_name: string; category_name?: string;
  is_featured: boolean;
}

interface Category {
  id: number; name: string; slug: string; product_count: number;
  parent: number | null; children?: Category[];
}

interface Vendor {
  id: number; shop_name: string; slug: string; description: string;
  city: string; rating: string; total_sales: number; logo?: string;
  phone?: string; address?: string;
}

interface StoreStats {
  total_products: number; total_vendors: number; total_customers: number;
  total_orders: number; total_categories: number;
}

function ProductCard({ p }: { p: Product }) {
  const { addItem }                              = useCartStore();
  const { toggle: toggleWish, has: isWishlisted } = useWishlistStore();
  const wished = isWishlisted(p.id);
  const t = useT();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id: p.id, productId: p.id, name: p.name, price: parseFloat(p.price), image: p.primary_image ?? '', size: '', color: '', vendorName: p.vendor_name, slug: p.slug });
    toast.success(t('home.prod.addToCart'));
  };

  return (
    <Link href={`/products/${p.slug}`} className="glass-card block group">
      <div className="relative bg-white/5 rounded-t-2xl flex items-center justify-center h-44 overflow-hidden">
        {p.primary_image
          ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <span className="text-6xl group-hover:scale-110 transition-transform inline-block">👟</span>
        }
        <button
          onClick={e => { e.preventDefault(); toggleWish({ productId: p.id, name: p.name, price: parseFloat(p.price), image: p.primary_image ?? '', slug: p.slug, vendorName: p.vendor_name }); }}
          className="absolute top-2 inset-e-2 p-1.5 rounded-full glass opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={13} className={wished ? 'fill-rose-400 text-rose-400' : 'text-white/60'}/>
        </button>
        <button onClick={handleAddToCart}
          className="absolute bottom-0 inset-s-0 inset-e-0 py-2.5 bg-indigo-600/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <ShoppingCart size={13}/> {t('home.prod.addToCart')}
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-white/40 mb-1">{p.vendor_name}</p>
        <p className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2">{p.name}</p>
        <div className="flex items-center gap-1 mb-3">
          <Star size={11} className="fill-amber-400 text-amber-400"/>
          <span className="text-xs text-white/60">{Number(p.rating).toFixed(1)} ({p.review_count})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-black gradient-text-blue text-base">{formatPrice(parseFloat(p.price))}</span>
          {p.discount_price && <span className="text-white/35 text-xs line-through">{formatPrice(parseFloat(p.discount_price))}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const t = useT();

  const { data: productData } = useQuery({
    queryKey: ['homepage-products'],
    queryFn: () => productsApi.list({ ordering: '-created_at', limit: 8 }).then(r => r.data),
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.categories().then(r => r.data),
  });

  const { data: vendorData } = useQuery({
    queryKey: ['homepage-vendors'],
    queryFn: () => vendorsApi.list({ ordering: '-total_sales', limit: 6 }).then(r => r.data),
  });

  const { data: statsData } = useQuery<StoreStats>({
    queryKey: ['store-stats'],
    queryFn: () => productsApi.storeStats().then(r => r.data),
  });

  const products: Product[] = (() => {
    const d = productData;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.results)) return d.results;
    return [];
  })();

  const apiCategories: Category[] = (() => {
    const d = catData;
    const raw: Category[] = !d ? [] : Array.isArray(d) ? d : Array.isArray(d.results) ? d.results : [];
    return raw
      .filter((c: Category) => c.parent === null)
      .map((c: Category) => ({
        ...c,
        product_count: c.product_count + (c.children ?? []).reduce((sum: number, s: Category) => sum + s.product_count, 0),
      }));
  })();

  const vendors: Vendor[] = (() => {
    const d = vendorData;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray((d as { results: Vendor[] }).results)) return (d as { results: Vendor[] }).results;
    return [];
  })();

  const stats = statsData ? [
    { label: t('home.stats.customers'), value: statsData.total_customers > 1000 ? `${Math.floor(statsData.total_customers / 1000)}K+` : `${statsData.total_customers}+` },
    { label: t('home.stats.vendors'),   value: `${statsData.total_vendors}+` },
    { label: t('home.stats.products'),  value: `${statsData.total_products}+` },
    { label: t('home.stats.orders'),    value: `${statsData.total_orders}+` },
  ] : [
    { label: t('home.stats.customers'), value: '—' },
    { label: t('home.stats.vendors'),   value: '—' },
    { label: t('home.stats.products'),  value: '—' },
    { label: t('home.stats.orders'),    value: '—' },
  ];

  const features = [
    { icon: Truck,       title: t('home.feat.delivery.title'), desc: t('home.feat.delivery.desc'), color: 'text-blue-400'   },
    { icon: RefreshCcw,  title: t('home.feat.returns.title'),  desc: t('home.feat.returns.desc'),  color: 'text-green-400'  },
    { icon: ShieldCheck, title: t('home.feat.payment.title'),  desc: t('home.feat.payment.desc'),  color: 'text-purple-400' },
    { icon: Headphones,  title: t('home.feat.support.title'),  desc: t('home.feat.support.desc'),  color: 'text-amber-400'  },
  ];

  return (
    <div className="overflow-hidden">
      <JsonLd type="Organization" />
      <JsonLd type="WebSite" />

      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-3xl">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-indigo-300 font-medium mb-8">
              <TrendingUp size={14}/>{t('home.badge')}
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
              {t('home.hero.title1')}{' '}
              <span className="gradient-text block">{t('home.hero.title2')}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/60 mb-10 max-w-xl leading-relaxed">
              {t('home.hero.desc')}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 rounded-xl">
                {t('home.hero.shopNow')} <ArrowRight size={18}/>
              </Link>
              <Link href="/vendor/register" className="btn-glass text-base px-8 py-3.5 rounded-xl">
                {t('home.hero.becomeVendor')}
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-6 mt-14">
              {stats.map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-black gradient-text">{s.value}</p>
                  <p className="text-sm text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
            <motion.div key={f.title} variants={fadeUp} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center ${f.color}`}>
                <f.icon size={20}/>
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{f.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Categories ───────────────────────────── */}
      {apiCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm text-indigo-400 font-semibold uppercase tracking-widest mb-2">{t('home.cat.label')}</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white">{t('home.cat.title')}</h2>
              </div>
              <Link href="/products" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                {t('home.cat.all')} <ArrowRight size={14}/>
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {apiCategories.slice(0, 6).map((cat, i) => {
                const meta = CAT_META[cat.slug] ?? CAT_META[cat.name.toLowerCase()] ?? { emoji: EMOJI_POOL[i % EMOJI_POOL.length], color: 'from-indigo-500/20 to-purple-500/20' };
                return (
                  <motion.div key={cat.id} variants={fadeUp}>
                    <Link href={`/products?category=${cat.id}`} className={`glass-card p-6 text-center group bg-linear-to-br ${meta.color} hover:scale-105 transition-all block`}>
                      <p className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{meta.emoji}</p>
                      <p className="font-bold text-white text-sm">{cat.name}</p>
                      <p className="text-xs text-white/40 mt-1">{cat.product_count} {t('home.cat.items')}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── Featured Vendors ─────────────────────── */}
      {vendors.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm text-amber-400 font-semibold uppercase tracking-widest mb-2">{t('home.ven.label')}</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white">{t('home.ven.title')}</h2>
              </div>
              <Link href="/vendors" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                {t('home.ven.all')} <ArrowRight size={14}/>
              </Link>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendors.map((v, i) => (
                <motion.div key={v.id} variants={fadeUp} transition={{ delay: i * 0.05 }}>
                  <Link href={`/vendors/${v.slug}`} className="glass-card block p-6 group hover:border-indigo-500/30 border border-transparent transition-all h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                        {v.logo ? <img src={v.logo} alt={v.shop_name} className="w-full h-full object-cover"/> : '🏪'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{v.shop_name}</h3>
                        {v.city && (
                          <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10}/> {v.city}</p>
                        )}
                        {v.phone && <p className="text-white/30 text-xs mt-0.5">{v.phone}</p>}
                      </div>
                    </div>

                    <p className="text-white/55 text-sm line-clamp-2 mb-4 leading-relaxed min-h-10">
                      {v.description || t('home.ven.defaultDesc')}
                    </p>

                    {v.address && (
                      <p className="text-white/30 text-xs mb-3 flex items-start gap-1">
                        <MapPin size={10} className="mt-0.5 shrink-0"/> <span className="line-clamp-1">{v.address}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400"/>
                          {Number(v.rating || 0).toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={11}/> {v.total_sales ?? 0} {t('home.ven.sales')}
                        </span>
                      </div>
                      <span className="text-indigo-400 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        {t('home.ven.visitShop')} <ArrowRight size={11}/>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm text-pink-400 font-semibold uppercase tracking-widest mb-2">{t('home.prod.label')}</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">{t('home.prod.title')}</h2>
            </div>
            <Link href="/products" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              {t('home.prod.viewAll')} <ArrowRight size={14}/>
            </Link>
          </motion.div>

          {products.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <p className="text-5xl mb-4">👟</p>
              <h3 className="text-xl font-bold text-white mb-2">{t('home.prod.emptyTitle')}</h3>
              <p className="text-white/50 text-sm mb-6">{t('home.prod.emptyDesc')}</p>
              <Link href="/products" className="btn-primary px-6 py-2.5 rounded-xl text-sm">{t('home.prod.emptyCta')}</Link>
            </div>
          ) : (
            <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(p => (
                <motion.div key={p.id} variants={fadeUp}>
                  <ProductCard p={p}/>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── Banner / CTA ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="relative glass-card overflow-hidden p-10 sm:p-16 text-center">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20 pointer-events-none"/>
          <div className="relative">
            <p className="text-sm text-indigo-300 font-semibold uppercase tracking-widest mb-4">{t('home.cta.label')}</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              {t('home.cta.title')}
            </h2>
            <p className="text-white/60 mb-8 max-w-xl mx-auto">
              {t('home.cta.desc')} <span className="text-amber-400 font-mono font-bold">BDSHOE10</span> {t('home.cta.at')}
            </p>
            <Link href="/register" className="btn-primary text-base px-10 py-3.5 rounded-xl inline-flex items-center gap-2">
              {t('home.cta.button')} <ArrowRight size={18}/>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Vendor CTA ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass-card p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-white mb-2">{t('home.sell.title')}</h3>
            <p className="text-white/50">
              {t('home.sell.desc').replace('{n}', String(statsData?.total_vendors ?? '…'))}
            </p>
          </div>
          <Link href="/vendor/register" className="btn-glass px-8 py-3.5 rounded-xl flex items-center gap-2 shrink-0">
            {t('home.sell.button')} <ArrowRight size={16}/>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
