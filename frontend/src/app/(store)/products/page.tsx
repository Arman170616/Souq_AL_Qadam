'use client';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, SlidersHorizontal, Star, X, ShoppingBag, ChevronDown, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import GoogleAd from '@/components/ads/GoogleAd';
import { useT } from '@/lib/i18n';

interface Product {
  id: number; name: string; slug: string; price: string; discount_price: string | null;
  effective_price: string; rating: string; review_count: number; is_active: boolean;
  primary_image: string | null; vendor_name: string; vendor_slug: string; category_name: string;
}

interface ProductPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

const SIZES = ['35','36','37','38','39','40','41','42','43','44','45','46'];

export default function ProductsPage() {
  const t = useT();
  const [search, setSearch]       = useState('');
  const [selectedSizes, setSizes] = useState<string[]>([]);
  const [sort, setSort]           = useState('-created_at');
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [inStockOnly, setInStock] = useState(false);
  const [sidebarOpen, setSidebar] = useState(false);
  const [filtersOpen, setFilters] = useState(false);
  const { addItem } = useCartStore();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const SORT_OPTIONS = [
    { v: '-created_at',    l: t('prod.sort.newest') },
    { v: 'price',          l: t('prod.sort.priceLow') },
    { v: '-price',         l: t('prod.sort.priceHigh') },
    { v: '-rating',        l: t('prod.sort.topRated') },
    { v: '-review_count',  l: t('prod.sort.popular') },
  ];

  const params = useMemo(() => {
    const p: Record<string, unknown> = { ordering: sort };
    if (search)              p.search    = search;
    if (minPrice)            p.min_price = minPrice;
    if (maxPrice)            p.max_price = maxPrice;
    if (inStockOnly)         p.in_stock  = true;
    if (selectedSizes.length > 0) p.size = selectedSizes.join(',');
    return p;
  }, [search, sort, minPrice, maxPrice, inStockOnly, selectedSizes]);

  const {
    data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage,
  } = useInfiniteQuery<ProductPage>({
    queryKey: ['products-infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      productsApi.list({ ...params, page: pageParam as number }).then(r => r.data),
    getNextPageParam: (lastPage, pages) =>
      lastPage.next ? pages.length + 1 : undefined,
    initialPageParam: 1,
  });

  const products: Product[] = data?.pages.flatMap(p => p.results) ?? [];
  const totalCount: number  = data?.pages[0]?.count ?? 0;

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.categories().then(r => r.data),
  });
  const categories = catData || [];

  const toggleSize = (s: string) =>
    setSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleAddToCart = (p: Product) => {
    addItem({
      id: p.id, productId: p.id, name: p.name,
      price: parseFloat(p.effective_price),
      image: p.primary_image || '',
      size: '', color: '', vendorName: p.vendor_name, slug: p.slug,
    });
    toast.success(`${p.name} ${t('home.prod.addedToCart')}`);
  };

  const SidebarContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">{t('prod.sizeLabel')}</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <button key={s} onClick={() => toggleSize(s)}
              className={`w-12 h-10 rounded-lg text-sm font-medium transition-all border ${
                selectedSizes.includes(s)
                  ? 'bg-indigo-500 border-indigo-400 text-white'
                  : 'glass border-white/10 text-white/60 hover:border-indigo-400 hover:text-white'
              }`}>{s}</button>
          ))}
        </div>
      </div>
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{t('prod.catLabel')}</h3>
          <div className="space-y-1">
            {categories.map((c: { id: number; name: string; slug: string }) => (
              <button key={c.id} onClick={() => setSearch(c.name)}
                className="w-full text-start px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">{t('prod.priceLabel')}</h3>
        <div className="flex gap-2">
          <input value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" className="glass-input text-sm py-2" type="number"/>
          <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" className="glass-input text-sm py-2" type="number"/>
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => setInStock(!inStockOnly)}
          className={`w-10 h-5 rounded-full transition-all relative ${inStockOnly ? 'bg-indigo-500' : 'bg-white/20'}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${inStockOnly ? 'inset-e-0.5' : 'inset-s-0.5'}`}/>
        </div>
        <span className="text-sm text-white/70">{t('prod.inStock')}</span>
      </label>
      {(selectedSizes.length > 0 || minPrice || maxPrice || inStockOnly) && (
        <button onClick={() => { setSizes([]); setMinPrice(''); setMaxPrice(''); setInStock(false); }}
          className="w-full py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-all">
          {t('prod.clearFilters')}
        </button>
      )}
    </div>
  );

  const SkeletonCard = () => (
    <div className="glass-card overflow-hidden">
      <div className="h-40 shimmer"/>
      <div className="p-4 space-y-2">
        <div className="h-3 shimmer rounded"/>
        <div className="h-3 shimmer rounded w-2/3"/>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">{t('prod.pageTitle')}</h1>
          <p className="text-white/50 text-sm mt-1">
            {isLoading
              ? t('prod.loading')
              : t('prod.countOf').replace('{n}', String(products.length)).replace('{total}', String(totalCount))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('prod.searchPlh')}
              className="glass-input ps-9 py-2 text-sm"/>
          </div>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="glass-input py-2 text-sm pe-8 appearance-none cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.v} value={o.v} className="bg-gray-900">{o.l}</option>)}
            </select>
            <ChevronDown size={14} className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"/>
          </div>
          <button
            onClick={() => { if (window.innerWidth >= 1024) setFilters(f => !f); else setSidebar(true); }}
            className="btn-glass py-2 px-3 text-sm flex items-center gap-1">
            <SlidersHorizontal size={14}/> {t('prod.filters')}
            {(selectedSizes.length + (inStockOnly ? 1 : 0)) > 0 && (
              <span className="w-5 h-5 bg-indigo-500 rounded-full text-xs flex items-center justify-center text-white">
                {selectedSizes.length + (inStockOnly ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <GoogleAd slot={process.env.NEXT_PUBLIC_AD_SLOT_PRODUCTS ?? ''} format="horizontal" className="mb-6" />

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.aside key="desktop-filters"
              initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="hidden lg:block shrink-0 overflow-hidden">
              <div className="glass-card p-5 sticky top-24 w-60">
                <h2 className="font-bold text-white mb-5 flex items-center gap-2"><SlidersHorizontal size={16}/> {t('prod.filters')}</h2>
                <SidebarContent />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({length: 8}).map((_, i) => <SkeletonCard key={i}/>)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-white/40">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-30"/>
              <p className="text-lg font-semibold">{t('prod.notFound')}</p>
              <p className="text-sm mt-1">{t('prod.adjustFilters')}</p>
            </div>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map(p => (
                  <motion.div key={p.id} layout initial={{opacity:0}} animate={{opacity:1}}
                    className="glass-card group flex flex-col">
                    <Link href={`/products/${p.slug}`}
                      className="relative p-5 bg-linear-to-br from-white/5 to-white/0 rounded-t-2xl flex items-center justify-center h-40">
                      {p.primary_image
                        ? <img src={p.primary_image} alt={p.name} className="h-full object-contain group-hover:scale-105 transition-transform"/>
                        : <span className="text-5xl group-hover:scale-110 transition-transform">👟</span>}
                      {p.discount_price && <span className="absolute top-3 inset-s-3 badge badge-red">{t('prod.saleBadge')}</span>}
                    </Link>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-xs text-white/40 mb-1">{p.vendor_name}</p>
                      <Link href={`/products/${p.slug}`}
                        className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-2 hover:text-indigo-300 transition-colors">
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-1 mb-3">
                        <Star size={11} className="fill-amber-400 text-amber-400"/>
                        <span className="text-xs text-white/60">{Number(p.rating).toFixed(1)} ({p.review_count})</span>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <span className="font-black gradient-text-blue text-base">{formatPrice(parseFloat(p.effective_price))}</span>
                          {p.discount_price && <span className="text-xs text-white/30 line-through ms-1">{formatPrice(parseFloat(p.price))}</span>}
                        </div>
                        <button onClick={() => handleAddToCart(p)}
                          className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all text-lg font-bold">
                          +
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Lazy load sentinel */}
              <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-3 py-4">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <Loader2 size={18} className="animate-spin"/>
                    <span>{t('prod.loadingMore')}</span>
                  </div>
                )}
                {!hasNextPage && products.length > 0 && (
                  <p className="text-white/25 text-sm">
                    {t('prod.allLoaded').replace('{n}', String(totalCount))}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 lg:hidden" onClick={() => setSidebar(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:30}}
              className="absolute inset-e-0 top-0 h-full w-80 glass-dark p-6 overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-white text-lg">{t('prod.filters')}</h2>
                <button onClick={() => setSidebar(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"><X size={18}/></button>
              </div>
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
