'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ToggleLeft, ToggleRight, Star, Package, Loader2 } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface Product {
  id: number; name: string; slug: string; price: string; discount_price?: string;
  stock: number; is_active: boolean; is_featured: boolean;
  rating: string; review_count: number;
  vendor_name: string; category_name: string;
}

interface ProductPage { count: number; next: string | null; results: Product[]; }

export default function AdminProductsPage() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const queryParams = {
    search: search || undefined,
    is_active:   filter === 'active'   ? true  : filter === 'inactive' ? false : undefined,
    is_featured: filter === 'featured' ? true  : undefined,
  };

  const {
    data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage,
  } = useInfiniteQuery<ProductPage>({
    queryKey: ['admin-products', search, filter],
    queryFn: ({ pageParam = 1 }) =>
      productsApi.manage({ ...queryParams, page: pageParam as number }).then(r => r.data),
    getNextPageParam: (last, pages) => last.next ? pages.length + 1 : undefined,
    initialPageParam: 1,
  });

  const products: Product[] = data?.pages.flatMap(p => p.results) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [handleIntersect]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: number; field: string; value: boolean }) =>
      productsApi.update(id, { [field]: value }),
    onSuccess: () => { toast.success(t('adm.products.updated')); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error(t('adm.products.updateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => { toast.success(t('adm.products.deleted')); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error(t('adm.products.deleteFailed')),
  });

  const FILTERS = ['all', 'active', 'inactive', 'featured'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">{t('adm.products.title')}</h2>
          <p className="text-white/50 text-sm mt-0.5">
            {isLoading
              ? t('adm.products.loading')
              : t('adm.products.of').replace('{n}', String(products.length)).replace('{total}', String(totalCount))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('adm.products.search')} className="glass-input ps-8 text-sm py-2"/>
        </div>
        <div className="flex gap-1 glass-dark rounded-xl p-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-500/80 text-white' : 'text-white/50 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40">{t('adm.products.loading')}</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={32} className="text-white/20 mx-auto mb-3"/>
            <p className="text-white/40">{t('adm.products.empty')}</p>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>{t('adm.products.colProduct')}</th>
                <th>{t('adm.products.colVendor')}</th>
                <th>{t('adm.products.colCategory')}</th>
                <th>{t('adm.products.colPrice')}</th>
                <th>{t('adm.products.colStock')}</th>
                <th>{t('adm.products.colRating')}</th>
                <th>{t('adm.products.colActive')}</th>
                <th>{t('adm.products.colFeatured')}</th>
                <th>{t('adm.products.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <p className="font-semibold text-white line-clamp-1 max-w-45">{p.name}</p>
                    <p className="text-xs text-white/40">{p.slug}</p>
                  </td>
                  <td><span className="text-white/70 text-sm">{p.vendor_name}</span></td>
                  <td><span className="text-white/50 text-xs">{p.category_name || '—'}</span></td>
                  <td>
                    <p className="text-white font-semibold text-sm">{formatPrice(parseFloat(p.price))}</p>
                    {p.discount_price && <p className="text-xs text-white/40 line-through">{formatPrice(parseFloat(p.discount_price))}</p>}
                  </td>
                  <td>
                    <span className={`badge ${p.stock > 0 ? 'badge-green' : 'badge-red'}`}>{p.stock}</span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-white/70 text-sm">
                      <Star size={11} className="fill-amber-400 text-amber-400"/>
                      {Number(p.rating).toFixed(1)}
                      <span className="text-white/30 text-xs">({p.review_count})</span>
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleMutation.mutate({ id: p.id, field: 'is_active', value: !p.is_active })}
                      className="transition-colors">
                      {p.is_active
                        ? <ToggleRight size={20} className="text-green-400"/>
                        : <ToggleLeft size={20} className="text-white/30"/>}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => toggleMutation.mutate({ id: p.id, field: 'is_featured', value: !p.is_featured })}
                      className="transition-colors">
                      {p.is_featured
                        ? <ToggleRight size={20} className="text-amber-400"/>
                        : <ToggleLeft size={20} className="text-white/30"/>}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p.id); }}
                      className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors">
                      <Trash2 size={13}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 size={16} className="animate-spin"/> {t('adm.products.loadingMore')}
          </div>
        )}
        {!hasNextPage && products.length > 0 && !isLoading && (
          <p className="text-white/20 text-xs">
            {t('adm.products.allLoaded').replace('{n}', String(totalCount))}
          </p>
        )}
      </div>
    </motion.div>
  );
}
