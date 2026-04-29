'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, Package, MapPin, ArrowRight } from 'lucide-react';
import { vendorsApi } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface Vendor {
  id: number; shop_name: string; slug: string; description: string;
  city: string; rating: string; total_sales: number;
  product_count?: number; logo?: string;
}

export default function VendorsPage() {
  const t = useT();
  const [search, setSearch]   = useState('');
  const [ordering, setOrdering] = useState('-rating');

  const { data, isLoading } = useQuery<{ results: Vendor[]; count: number } | Vendor[]>({
    queryKey: ['vendors', search, ordering],
    queryFn: () => vendorsApi.list({ search: search || undefined, ordering }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const vendors: Vendor[] = Array.isArray(data) ? data : (data as { results: Vendor[] })?.results ?? [];
  const count = Array.isArray(data) ? vendors.length : (data as { count: number })?.count ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-2">{t('vendors.badge')}</p>
        <h1 className="text-3xl font-black text-white mb-1">{t('vendors.title')}</h1>
        <p className="text-white/50">{t('vendors.subtitle').replace('{n}', String(count))}</p>
      </motion.div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('vendors.searchPlh')}
            className="glass-input ps-9"
          />
        </div>
        <select value={ordering} onChange={e => setOrdering(e.target.value)} className="glass-input sm:w-48">
          <option value="-rating"      className="bg-gray-900">{t('vendors.sort.rated')}</option>
          <option value="-total_sales" className="bg-gray-900">{t('vendors.sort.sales')}</option>
          <option value="-created_at"  className="bg-gray-900">{t('vendors.sort.newest')}</option>
          <option value="shop_name"    className="bg-gray-900">{t('vendors.sort.az')}</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-52 shimmer" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <p className="text-5xl mb-4">🏪</p>
          <h2 className="text-xl font-bold text-white mb-2">{t('vendors.notFound')}</h2>
          <p className="text-white/50 text-sm">{t('vendors.trySearch')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((v, i) => (
            <motion.div key={v.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <Link href={`/vendors/${v.slug}`} className="glass-card block p-6 group h-full">

                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {v.logo
                      ? <img src={v.logo} alt={v.shop_name} className="w-full h-full object-cover rounded-2xl" />
                      : '🏪'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {v.shop_name}
                    </h3>
                    {v.city && (
                      <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {v.city}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-white/55 text-sm line-clamp-2 mb-4 leading-relaxed">
                  {v.description || t('home.ven.defaultDesc')}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {Number(v.rating || 0).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package size={11} /> {v.total_sales ?? 0} {t('home.ven.sales')}
                    </span>
                  </div>
                  <span className="text-indigo-400 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t('vendors.visit')} <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
