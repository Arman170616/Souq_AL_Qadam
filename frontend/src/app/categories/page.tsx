'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package, ChevronRight } from 'lucide-react';
import { productsApi } from '@/lib/api';

const COLOR_POOL = [
  'from-blue-500/20 to-indigo-500/20',
  'from-pink-500/20 to-rose-500/20',
  'from-amber-500/20 to-orange-500/20',
  'from-green-500/20 to-emerald-500/20',
  'from-purple-500/20 to-violet-500/20',
  'from-slate-500/20 to-gray-500/20',
  'from-cyan-500/20 to-teal-500/20',
  'from-rose-500/20 to-pink-500/20',
];

interface Category {
  id: number;
  name: string;
  slug: string;
  product_count: number;
  parent: number | null;
  children?: Category[];
}

const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

export default function CategoriesPage() {
  const { data, isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => productsApi.categories().then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : d.results ?? [];
    }),
  });

  // Only top-level categories (parent === null), with product_count rolled up from children
  const topLevel: Category[] = (data ?? [])
    .filter(c => c.parent === null)
    .map(c => ({
      ...c,
      product_count: c.product_count + (c.children ?? []).reduce((sum, s) => sum + s.product_count, 0),
    }));

  // Total unique top-level count
  const totalCount = topLevel.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-4">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white/70">Categories</span>
        </nav>
        <p className="text-sm text-indigo-400 font-semibold uppercase tracking-widest mb-2">Browse by</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white">All Categories</h1>
        <p className="text-white/50 mt-2">{totalCount} categories available</p>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-40 animate-pulse"/>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Package size={40} className="text-white/20 mx-auto mb-4"/>
          <h2 className="text-xl font-bold text-white mb-2">No categories yet</h2>
          <p className="text-white/50 text-sm">Categories will appear here once added by an admin.</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {topLevel.map((cat, i) => {
            const subs: Category[] = cat.children ?? [];
            return (
              <motion.div key={cat.id} variants={fadeUp}
                className={`glass-card overflow-hidden bg-linear-to-br ${COLOR_POOL[i % COLOR_POOL.length]}`}>

                {/* Parent category link */}
                <Link href={`/categories/${cat.slug}`}
                  className="flex items-center justify-between p-6 group hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-bold text-white text-lg group-hover:text-indigo-200 transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-sm text-white/50 mt-0.5">{cat.product_count} items</p>
                  </div>
                  <ArrowRight size={18} className="text-white/30 group-hover:text-indigo-400 transition-colors shrink-0"/>
                </Link>

                {/* Sub-categories */}
                {subs.length > 0 && (
                  <div className="px-6 pb-5 border-t border-white/5 pt-3">
                    <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-2.5">
                      Sub-categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subs.map(sub => (
                        <Link key={sub.id} href={`/categories/${sub.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                            bg-white/10 text-white/70 hover:bg-indigo-500/30 hover:text-white transition-all">
                          <ChevronRight size={10}/>
                          {sub.name}
                          <span className="text-white/30">({sub.product_count})</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
