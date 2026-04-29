'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, SlidersHorizontal, Package } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: '-created_at',      label: 'Newest First' },
  { value: 'effective_price',  label: 'Price: Low → High' },
  { value: '-effective_price', label: 'Price: High → Low' },
  { value: '-rating',          label: 'Top Rated' },
];

interface Product {
  id: number; name: string; slug: string; price: string;
  discount_price: string | null; effective_price: string;
  primary_image: string | null; vendor_name: string;
  rating: string; review_count: number; stock: number;
}
interface Category {
  id: number; name: string; slug: string; product_count: number;
  parent: number | null; children?: Category[];
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [ordering, setOrdering] = useState('-created_at');
  const { addItem } = useCartStore();

  /* fetch all categories to resolve slug → id + name */
  const { data: catList } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => productsApi.categories().then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : d.results ?? [];
    }),
  });

  // Flatten top-level + all children so sub-category slugs resolve
  const flatList: Category[] = catList
    ? catList.flatMap(c => [c, ...(c.children ?? [])])
    : [];

  const category = flatList.find(c => c.slug === slug);
  // If this is a sub-category, find its parent for breadcrumb
  const parentCat = category?.parent
    ? catList?.find(c => c.id === category.parent)
    : null;

  /* fetch products for this category */
  const { data, isLoading } = useQuery<{ results: Product[]; count: number }>({
    queryKey: ['products', 'cat', slug, ordering, category?.id],
    queryFn: () => productsApi.list({
      ...(category?.id ? { category: category.id } : {}),
      ordering,
    }).then(r => r.data),
    enabled: catList !== undefined,
  });

  const products: Product[] = data?.results ?? [];
  const count = data?.count ?? 0;
  const categoryName = category?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const handleQuickAdd = (p: Product) => {
    addItem({
      id: p.id, productId: p.id, name: p.name,
      price: parseFloat(p.effective_price),
      image: p.primary_image ?? '',
      size: '', color: '',
      vendorName: p.vendor_name, slug: p.slug,
    });
    toast.success(`${p.name} added to cart!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/" className="text-white/40 hover:text-white transition-colors">Home</Link>
        <span className="text-white/20">/</span>
        <Link href="/categories" className="text-white/40 hover:text-white transition-colors">Categories</Link>
        {parentCat && (
          <>
            <span className="text-white/20">/</span>
            <Link href={`/categories/${parentCat.slug}`} className="text-white/40 hover:text-white transition-colors">{parentCat.name}</Link>
          </>
        )}
        <span className="text-white/20">/</span>
        <span className="text-white/70">{categoryName}</span>
      </nav>

      {/* Category header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 sm:p-10 mb-8">
        <Link href="/categories" className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors mb-4">
          <ArrowLeft size={12}/> All Categories
        </Link>
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-1">{categoryName}</h1>
        <p className="text-white/40 text-sm">{count} products found</p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <p className="text-white/50 text-sm">
          Showing <span className="text-white font-semibold">{products.length}</span> of <span className="text-white font-semibold">{count}</span> products
        </p>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-white/40"/>
          <select value={ordering} onChange={e => setOrdering(e.target.value)} className="glass-input py-2 px-3 text-sm w-auto">
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="aspect-square animate-pulse bg-white/5"/>
              <div className="p-4 space-y-2">
                <div className="h-4 animate-pulse bg-white/5 rounded"/>
                <div className="h-3 animate-pulse bg-white/5 rounded w-2/3"/>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 text-center">
          <Package size={40} className="text-white/20 mx-auto mb-4"/>
          <h2 className="text-xl font-bold text-white mb-2">No products yet</h2>
          <p className="text-white/50 text-sm mb-6">No products in this category yet.</p>
          <Link href="/products" className="btn-primary px-6 py-2.5 rounded-xl text-sm">Browse All Products</Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p, i) => {
            const effective   = parseFloat(p.effective_price);
            const original    = parseFloat(p.price);
            const discountPct = p.discount_price ? Math.round((1 - effective / original) * 100) : null;
            const rating      = parseFloat(p.rating || '0');

            return (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card overflow-hidden group flex flex-col">
                <Link href={`/products/${p.slug}`} className="block relative aspect-square bg-white/5 overflow-hidden">
                  {p.primary_image
                    ? <img src={p.primary_image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    : <div className="w-full h-full flex items-center justify-center text-5xl text-white/20"><Package size={48}/></div>
                  }
                  {discountPct && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{discountPct}%</span>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white/80 text-xs font-semibold bg-black/60 px-3 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                </Link>
                <div className="p-3 sm:p-4 flex flex-col flex-1">
                  <Link href={`/products/${p.slug}`}>
                    <p className="font-semibold text-white text-sm line-clamp-2 leading-snug hover:text-indigo-300 transition-colors">{p.name}</p>
                  </Link>
                  <p className="text-white/40 text-xs mt-0.5 truncate">{p.vendor_name}</p>
                  {rating > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={11} className="fill-amber-400 text-amber-400"/>
                      <span className="text-xs text-white/60">{rating.toFixed(1)}</span>
                      <span className="text-xs text-white/30">({p.review_count})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <div>
                      <span className="font-bold text-white text-sm">{formatPrice(effective)}</span>
                      {discountPct && <span className="text-xs text-white/35 line-through ml-1.5">{formatPrice(original)}</span>}
                    </div>
                    <button onClick={() => handleQuickAdd(p)} disabled={p.stock === 0}
                      className="text-xs btn-primary px-2.5 py-1.5 rounded-lg disabled:opacity-40">
                      Add
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Other categories */}
      {flatList.length > 1 && (
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">Other Categories</h3>
          <div className="flex flex-wrap gap-3">
            {flatList.filter(c => c.slug !== slug).map(c => (
              <Link key={c.id} href={`/categories/${c.slug}`}
                className="px-4 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                {c.name}
                <span className="ml-1.5 text-white/30 text-xs">({c.product_count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
