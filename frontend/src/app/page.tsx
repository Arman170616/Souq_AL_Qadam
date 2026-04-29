'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/store/CartDrawer';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, ShieldCheck, Truck, RefreshCcw, Headphones, TrendingUp, ShoppingCart, Heart, MapPin, Package, Crown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { productsApi, vendorsApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const COLOR_POOL = ['from-blue-500/20 to-indigo-500/20','from-pink-500/20 to-rose-500/20','from-amber-500/20 to-orange-500/20','from-green-500/20 to-emerald-500/20','from-purple-500/20 to-violet-500/20','from-slate-500/20 to-gray-500/20'];

const fadeUp  = { hidden:{opacity:0,y:32}, show:{opacity:1,y:0} };
const stagger = { show:{ transition:{ staggerChildren:0.08 } } };

interface Product { id:number; name:string; slug:string; price:string; discount_price?:string; rating:string; review_count:number; primary_image?:string; vendor_name:string; is_featured:boolean; }
interface Category { id:number; name:string; slug:string; product_count:number; }
interface Vendor { id:number; shop_name:string; slug:string; description:string; city:string; rating:string; total_sales:number; logo?:string; phone?:string; address?:string; is_premium?:boolean; }
interface StoreStats { total_products:number; total_vendors:number; total_customers:number; total_orders:number; }

function ProductCard({ p }: { p: Product }) {
  const { addItem }                           = useCartStore();
  const { toggle: toggleWish, has: isWished } = useWishlistStore();
  const t     = useT();
  const wished = isWished(p.id);

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id:p.id, productId:p.id, name:p.name, price:parseFloat(p.price), image:p.primary_image??'', size:'', color:'', vendorName:p.vendor_name, slug:p.slug });
    toast.success(t('home.prod.addedToCart'));
  };

  return (
    <Link href={`/products/${p.slug}`} className="glass-card block group">
      <div className="relative bg-white/5 rounded-t-2xl flex items-center justify-center h-44 overflow-hidden">
        {p.primary_image
          ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
          : <span className="text-6xl group-hover:scale-110 transition-transform inline-block">👟</span>}
        <button
          onClick={e=>{e.preventDefault(); toggleWish({productId:p.id,name:p.name,price:parseFloat(p.price),image:p.primary_image??'',slug:p.slug,vendorName:p.vendor_name});}}
          className="absolute top-2 inset-e-2 p-1.5 rounded-full glass opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart size={13} className={wished?'fill-rose-400 text-rose-400':'text-white/60'}/>
        </button>
        <button onClick={addToCart}
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

function HeroCard({ product }: { product?: Product }) {
  const name   = product?.name        ?? '—';
  const vendor = product?.vendor_name ?? '—';
  const price  = product ? parseFloat(product.price) : 0;
  const img    = product?.primary_image;

  return (
    <motion.div animate={{y:[-12,12,-12]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}
      className="glass-card p-8 text-center" style={{width:280}}>
      <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden">
        {img ? <img src={img} alt={name} className="w-full h-full object-cover"/> : <span className="text-5xl">👟</span>}
      </div>
      <p className="font-bold text-white text-lg line-clamp-1">{name}</p>
      <p className="text-sm text-white/50 mb-3">{vendor}</p>
      <div className="flex items-center justify-center gap-1 mb-4">
        {[...Array(5)].map((_,i)=><Star key={i} size={12} className="fill-amber-400 text-amber-400"/>)}
      </div>
      {price > 0 && <p className="gradient-text font-black text-xl">{formatPrice(price)}</p>}
    </motion.div>
  );
}

function HScrollSection({ title, subtitle, color, items }: { title:string; subtitle:string; color:string; items:Product[] }) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="show" viewport={{once:true}} variants={stagger}>
          <motion.div variants={fadeUp} className="flex items-end justify-between mb-8">
            <div>
              <p className={`text-sm font-semibold uppercase tracking-widest mb-2 ${color}`}>{subtitle}</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">{title}</h2>
            </div>
            <Link href="/products" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors shrink-0">
              {t('home.prod.viewAll')} <ArrowRight size={14}/>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
            style={{scrollbarWidth:'none'}}>
            {items.map(p => (
              <div key={p.id} className="shrink-0 w-52 sm:w-60">
                <ProductCard p={p}/>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default function RootPage() {
  const t = useT();

  const { data: productData }    = useQuery({ queryKey:['hp-products'], queryFn:()=>productsApi.list({ordering:'-created_at',limit:12}).then(r=>r.data) });
  const { data: onSaleData }     = useQuery({ queryKey:['hp-on-sale'],  queryFn:()=>productsApi.list({has_discount:true,limit:12}).then(r=>r.data) });
  const { data: bestSellerData } = useQuery({ queryKey:['hp-best'],     queryFn:()=>productsApi.list({ordering:'-review_count',limit:12}).then(r=>r.data) });
  const { data: comfortData }    = useQuery({ queryKey:['hp-comfort'],  queryFn:()=>productsApi.list({ordering:'-rating',limit:12}).then(r=>r.data) });
  const { data: catData }        = useQuery({ queryKey:['hp-cats'],     queryFn:()=>productsApi.categories().then(r=>r.data) });
  const { data: vendorData }     = useQuery({ queryKey:['hp-vendors'],  queryFn:()=>vendorsApi.list({ordering:'-total_sales',limit:6}).then(r=>r.data) });
  const { data: statsData }      = useQuery<StoreStats>({ queryKey:['hp-stats'], queryFn:()=>productsApi.storeStats().then(r=>r.data) });

  const products:    Product[]  = Array.isArray(productData)    ? productData    : productData?.results    ?? [];
  const onSale:      Product[]  = Array.isArray(onSaleData)     ? onSaleData     : onSaleData?.results     ?? [];
  const bestSellers: Product[]  = Array.isArray(bestSellerData) ? bestSellerData : bestSellerData?.results ?? [];
  const comfort:     Product[]  = Array.isArray(comfortData)    ? comfortData    : comfortData?.results    ?? [];
  const categories:  Category[] = Array.isArray(catData)        ? catData        : catData?.results        ?? [];
  const vendors:     Vendor[]   = Array.isArray(vendorData)     ? vendorData     : vendorData?.results     ?? [];

  const features = [
    { icon:Truck,       title:t('home.feat.delivery.title'), desc:t('home.feat.delivery.desc'), color:'text-blue-400' },
    { icon:RefreshCcw,  title:t('home.feat.returns.title'),  desc:t('home.feat.returns.desc'),  color:'text-green-400' },
    { icon:ShieldCheck, title:t('home.feat.payment.title'),  desc:t('home.feat.payment.desc'),  color:'text-purple-400' },
    { icon:Headphones,  title:t('home.feat.support.title'),  desc:t('home.feat.support.desc'),  color:'text-amber-400' },
  ];

  const stats = [
    { label:t('home.stats.customers'), value: statsData ? `${statsData.total_customers}+` : '…' },
    { label:t('home.stats.vendors'),   value: statsData ? `${statsData.total_vendors}+`   : '…' },
    { label:t('home.stats.products'),  value: statsData ? `${statsData.total_products}+`  : '…' },
    { label:t('home.stats.orders'),    value: statsData ? `${statsData.total_orders}+`    : '…' },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen overflow-hidden">

        {/* ── Hero ── */}
        <section className="relative flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
            <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-3xl">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-indigo-300 font-medium mb-8">
                <TrendingUp size={14}/>{' '}{t('home.badge')}
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
                {t('home.hero.title1')}{' '}<span className="gradient-text block">{t('home.hero.title2')}</span>
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

            {/* Floating product card */}
            <motion.div initial={{opacity:0,x:80}} animate={{opacity:1,x:0}} transition={{duration:0.8,delay:0.3}}
              className="hidden lg:block absolute inset-e-8 top-1/2 -translate-y-1/2">
              <HeroCard product={products[0]}/>
            </motion.div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div initial="hidden" whileInView="show" viewport={{once:true}} variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(f => (
              <motion.div key={f.title} variants={fadeUp} className="glass-card p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl glass flex items-center justify-center ${f.color}`}><f.icon size={20}/></div>
                <div>
                  <p className="font-semibold text-white text-sm">{f.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Categories ── */}
        {categories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div initial="hidden" whileInView="show" viewport={{once:true}} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-sm text-indigo-400 font-semibold uppercase tracking-widest mb-2">{t('home.cat.label')}</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-white">{t('home.cat.title')}</h2>
                </div>
                <Link href="/categories" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  {t('home.cat.all')} <ArrowRight size={14}/>
                </Link>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.slice(0,6).map((cat,i) => (
                  <motion.div key={cat.id} variants={fadeUp}>
                    <Link href={`/categories/${cat.slug}`} className={`glass-card p-6 text-center group bg-linear-to-br ${COLOR_POOL[i % COLOR_POOL.length]} hover:scale-105 transition-all block`}>
                      <p className="font-bold text-white text-base">{cat.name}</p>
                      <p className="text-xs text-white/50 mt-2">{cat.product_count} {t('home.cat.items')}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* ── Featured Vendors ── */}
        {vendors.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div initial="hidden" whileInView="show" viewport={{once:true}} variants={stagger}>
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
                {vendors.map((v,i) => (
                  <motion.div key={v.id} variants={fadeUp} transition={{delay:i*0.05}}>
                    <Link href={`/vendors/${v.slug}`} className={`glass-card block p-6 group border transition-all h-full ${v.is_premium ? 'border-amber-500/40 bg-linear-to-br from-amber-500/5 to-orange-500/5' : 'border-transparent hover:border-indigo-500/30'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                          {v.logo ? <img src={v.logo} alt={v.shop_name} className="w-full h-full object-cover"/> : '🏪'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{v.shop_name}</h3>
                            {v.is_premium && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 shrink-0">
                                <Crown size={10}/> {t('home.ven.premium')}
                              </span>
                            )}
                          </div>
                          {v.city  && <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10}/> {v.city}</p>}
                          {v.phone && <p className="text-white/30 text-xs mt-0.5">{v.phone}</p>}
                        </div>
                      </div>
                      <p className="text-white/55 text-sm line-clamp-2 mb-4 leading-relaxed min-h-10">
                        {v.description || t('home.ven.defaultDesc')}
                      </p>
                      {v.address && (
                        <p className="text-white/30 text-xs mb-3 flex items-start gap-1">
                          <MapPin size={10} className="mt-0.5 shrink-0"/><span className="line-clamp-1">{v.address}</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-3 text-xs text-white/50">
                          <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400"/>{Number(v.rating||0).toFixed(1)}</span>
                          <span className="flex items-center gap-1"><Package size={11}/>{v.total_sales??0} {t('home.ven.sales')}</span>
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

        {/* ── Latest Products ── */}
        <HScrollSection
          title={t('home.prod.title')}
          subtitle={t('home.prod.label')}
          color="text-pink-400"
          items={products}
        />

        {/* ── Everyday Comfort ── */}
        <HScrollSection
          title={t('home.scroll.comfort.title')}
          subtitle={t('home.scroll.comfort.sub')}
          color="text-teal-400"
          items={comfort}
        />

        {/* ── On Sale ── */}
        <HScrollSection
          title={t('home.scroll.sale.title')}
          subtitle={t('home.scroll.sale.sub')}
          color="text-rose-400"
          items={onSale}
        />

        {/* ── Best Sellers ── */}
        <HScrollSection
          title={t('home.scroll.best.title')}
          subtitle={t('home.scroll.best.sub')}
          color="text-amber-400"
          items={bestSellers}
        />

        {/* ── Promo Banner ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{opacity:0,scale:0.97}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
            className="relative glass-card overflow-hidden p-10 sm:p-16 text-center">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20 pointer-events-none"/>
            <div className="relative">
              <p className="text-sm text-indigo-300 font-semibold uppercase tracking-widest mb-4">{t('home.cta.label')}</p>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">{t('home.cta.title')}</h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                {t('home.cta.desc')} <span className="text-amber-400 font-mono font-bold">BDSHOE10</span> {t('home.cta.at')}
              </p>
              <Link href="/register" className="btn-primary text-base px-10 py-3.5 rounded-xl inline-flex items-center gap-2">
                {t('home.cta.button')} <ArrowRight size={18}/>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── Vendor CTA ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="glass-card p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-white mb-2">{t('home.sell.title')}</h3>
              <p className="text-white/50">{t('home.sell.desc').replace('{n}', String(statsData?.total_vendors ?? '…'))}</p>
            </div>
            <Link href="/vendor/register" className="btn-glass px-8 py-3.5 rounded-xl flex items-center gap-2 shrink-0">
              {t('home.sell.button')} <ArrowRight size={16}/>
            </Link>
          </motion.div>
        </section>

      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
