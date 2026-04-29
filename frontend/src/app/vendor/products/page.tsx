'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, Eye, ToggleLeft, ToggleRight, X,
  Package, Upload, ChevronDown, CheckSquare, Square, Trash, Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Product {
  id: number; name: string; slug: string; sku: string; price: string;
  stock: number; is_active: boolean; category_name: string; primary_image: string | null;
}

// ── Add Product dropdown ───────────────────────────────────────────────────
function AddProductDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
        <Plus size={15}/> Add Product
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="absolute right-0 top-full mt-2 w-64 glass-dark rounded-2xl overflow-hidden border border-white/10 z-30 shadow-2xl">
            <Link href="/vendor/products/new" onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Package size={15} className="text-indigo-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">Single Product</p>
                <p className="text-xs text-white/40 mt-0.5">Add one product with full details, images & variants</p>
              </div>
            </Link>
            <div className="border-t border-white/8"/>
            <Link href="/vendor/products/bulk-upload" onClick={() => setOpen(false)}
              className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Upload size={15} className="text-emerald-400"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">Bulk Upload</p>
                <p className="text-xs text-white/40 mt-0.5">Upload up to 200 products via CSV with auto SKU</p>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
interface ProductPage { count: number; next: string | null; results: Product[]; }

export default function VendorProductsPage() {
  const [search, setSearch]       = useState('');
  const [del, setDel]             = useState<number | null>(null);
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [bulkDelConfirm, setBulkDelConfirm] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const {
    data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage,
  } = useInfiniteQuery<ProductPage>({
    queryKey: ['vendor-products'],
    queryFn: ({ pageParam = 1 }) =>
      productsApi.manage({ page: pageParam as number }).then(r => r.data),
    getNextPageParam: (last, pages) => last.next ? pages.length + 1 : undefined,
    initialPageParam: 1,
  });

  const allProducts: Product[] = data?.pages.flatMap(p => p.results) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Selection helpers ────────────────────────────────────────────────────
  const allFilteredIds   = filtered.map(p => p.id);
  const allSelected      = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected     = allFilteredIds.some(id => selected.has(id));
  const selectedInView   = allFilteredIds.filter(id => selected.has(id));

  const toggleOne = (id: number) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(prev => {
      const s = new Set(prev);
      if (allSelected) allFilteredIds.forEach(id => s.delete(id));
      else             allFilteredIds.forEach(id => s.add(id));
      return s;
    });

  // ── Mutations ────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      productsApi.update(id, { is_active }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['vendor-products'] }); },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => { toast.success('Product deleted'); setDel(null); qc.invalidateQueries({ queryKey: ['vendor-products'] }); },
    onError: () => toast.error('Failed to delete'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(ids.map(id => productsApi.delete(id)));
      const failed  = results.filter(r => r.status === 'rejected').length;
      const done    = results.filter(r => r.status === 'fulfilled').length;
      return { done, failed };
    },
    onSuccess: ({ done, failed }) => {
      toast.success(`${done} product${done !== 1 ? 's' : ''} deleted`);
      if (failed > 0) toast.error(`${failed} failed to delete`);
      setSelected(new Set());
      setBulkDelConfirm(false);
      qc.invalidateQueries({ queryKey: ['vendor-products'] });
    },
    onError: () => toast.error('Bulk delete failed'),
  });

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">My Products</h2>
          <p className="text-sm text-white/50">{totalCount} total products</p>
        </div>
        <AddProductDropdown />
      </div>

      {/* Search + bulk action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" className="glass-input pl-8 text-sm py-2"/>
        </div>

        <AnimatePresence>
          {selectedInView.length > 0 && (
            <motion.div initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:8}}
              className="flex items-center gap-2">
              <span className="text-xs text-white/50 bg-white/10 px-3 py-1.5 rounded-lg font-medium">
                {selectedInView.length} selected
              </span>
              <button
                onClick={() => setBulkDelConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors text-xs font-semibold">
                <Trash size={13}/> Delete Selected
              </button>
              <button onClick={() => setSelected(new Set())}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                <X size={14}/>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/40">Loading products…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            <p className="mb-3">No products yet</p>
            <Link href="/vendor/products/new" className="btn-primary text-sm px-4 py-2 rounded-lg">Add your first product</Link>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                {/* Select All checkbox */}
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-white/50 hover:text-white transition-colors">
                    {allSelected
                      ? <CheckSquare size={16} className="text-indigo-400"/>
                      : someSelected
                        ? <CheckSquare size={16} className="text-white/30"/>
                        : <Square size={16}/>}
                  </button>
                </th>
                <th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Category</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isSelected = selected.has(p.id);
                return (
                  <tr key={p.id} className={`transition-colors ${isSelected ? 'bg-indigo-500/8' : ''}`}>
                    {/* Row checkbox */}
                    <td className="px-4 py-3">
                      <button onClick={() => toggleOne(p.id)} className="text-white/40 hover:text-white transition-colors">
                        {isSelected
                          ? <CheckSquare size={16} className="text-indigo-400"/>
                          : <Square size={16}/>}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {p.primary_image
                            ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover"/>
                            : <span className="text-lg">👟</span>}
                        </div>
                        <p className="font-semibold text-white text-sm line-clamp-1">{p.name}</p>
                      </div>
                    </td>
                    <td><span className="text-white/50 font-mono text-xs">{p.sku}</span></td>
                    <td><span className="font-semibold text-white">{formatPrice(parseFloat(p.price))}</span></td>
                    <td><span className={p.stock < 5 ? 'text-amber-400' : 'text-white/70'}>{p.stock}</span></td>
                    <td><span className="text-white/50 text-xs">{p.category_name || '—'}</span></td>
                    <td>
                      <button onClick={() => toggleMutation.mutate({ id: p.id, is_active: !p.is_active })}
                        className={`flex items-center gap-1 text-xs font-semibold transition-colors ${p.is_active ? 'text-green-400' : 'text-white/30'}`}>
                        {p.is_active ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                        {p.is_active ? 'Active' : 'Off'}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <Link href={`/products/${p.slug}`} className="p-1.5 rounded-lg glass hover:bg-white/10 text-white/50 hover:text-white transition-colors"><Eye size={13}/></Link>
                        <Link href={`/vendor/products/${p.id}/edit`} className="p-1.5 rounded-lg glass hover:bg-white/10 text-white/50 hover:text-white transition-colors"><Edit2 size={13}/></Link>
                        <button onClick={() => setDel(p.id)} className="p-1.5 rounded-lg glass hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 size={16} className="animate-spin"/> Loading more…
          </div>
        )}
        {!hasNextPage && allProducts.length > 0 && !isLoading && (
          <p className="text-white/20 text-xs">All {totalCount} products loaded</p>
        )}
      </div>

      {/* Single delete confirm */}
      <AnimatePresence>
        {del !== null && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={() => setDel(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              className="relative glass-dark rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-white text-lg mb-2">Delete Product?</h3>
              <p className="text-white/50 text-sm mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDel(null)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm">Cancel</button>
                <button onClick={() => del !== null && deleteMutation.mutate(del)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
              <button onClick={() => setDel(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/40"><X size={16}/></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk delete confirm */}
      <AnimatePresence>
        {bulkDelConfirm && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={() => setBulkDelConfirm(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              className="relative glass-dark rounded-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
                <Trash size={20} className="text-red-400"/>
              </div>
              <h3 className="font-bold text-white text-lg mb-1">Delete {selectedInView.length} Products?</h3>
              <p className="text-white/50 text-sm mb-5">This will permanently delete all selected products. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setBulkDelConfirm(false)} className="flex-1 btn-glass py-2.5 rounded-xl text-sm">Cancel</button>
                <button
                  onClick={() => bulkDeleteMutation.mutate(selectedInView)}
                  disabled={bulkDeleteMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {bulkDeleteMutation.isPending ? 'Deleting…' : `Delete ${selectedInView.length}`}
                </button>
              </div>
              <button onClick={() => setBulkDelConfirm(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/40"><X size={16}/></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
