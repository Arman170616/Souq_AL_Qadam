'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Star, Package, MapPin, Phone, ArrowLeft, ShoppingCart, Heart, Loader2 } from 'lucide-react';
import { vendorsApi, productsApi } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Vendor {
  id: number; shop_name: string; slug: string; description: string;
  city: string; rating: string; total_sales: number;
  product_count?: number; logo?: string; phone?: string; address?: string;
  status: string; created_at: string;
}

interface Product {
  id: number; name: string; slug: string; price: string;
  compare_price?: string; stock: number; is_active: boolean;
  thumbnail?: string; rating?: string; reviews_count?: number;
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

function ProductCard({ p }: { p: Product }) {
  const { addItem } = useCartStore();
  const { toggle: toggleWish, has: isWishlisted } = useWishlistStore();
  const wished = isWishlisted(p.id);
  const discount = p.compare_price
    ? Math.round((1 - parseFloat(p.price) / parseFloat(p.compare_price)) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id: p.id, productId: p.id, name: p.name, price: parseFloat(p.price), image: p.thumbnail ?? '', size: '', color: '', vendorName: '', slug: p.slug });
    toast.success('Added to cart!');
  };

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/products/${p.slug}`} className="glass-card block group overflow-hidden">
        <div className="relative aspect-square bg-white/5 overflow-hidden">
          {p.thumbnail
            ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            : <div className="w-full h-full flex items-center justify-center text-4xl">👟</div>
          }
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          <button onClick={(e) => { e.preventDefault(); toggleWish({ productId: p.id, name: p.name, price: parseFloat(p.price), image: p.thumbnail ?? '', slug: p.slug, vendorName: '' }); }}
            className="absolute top-2 right-2 p-1.5 rounded-full glass opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart size={13} className={wished ? 'fill-rose-400 text-rose-400' : 'text-white/60'}/>
          </button>
          <button onClick={handleAddToCart}
            className="absolute bottom-0 left-0 right-0 py-2.5 bg-indigo-600/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <ShoppingCart size={13}/> Add to Cart
          </button>
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1.5">{p.name}</p>
          <div className="flex items-center gap-2">
            <span className="text-indigo-300 font-bold text-sm">{formatPrice(parseFloat(p.price))}</span>
            {p.compare_price && <span className="text-white/35 text-xs line-through">{formatPrice(parseFloat(p.compare_price))}</span>}
          </div>
          {p.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={10} className="fill-amber-400 text-amber-400"/>
              <span className="text-white/40 text-xs">{Number(p.rating).toFixed(1)}</span>
              {p.reviews_count != null && <span className="text-white/30 text-xs">({p.reviews_count})</span>}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function VendorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] = useState('-created_at');

  const { data: vendor, isLoading: vendorLoading, isError } = useQuery<Vendor>({
    queryKey: ['vendor', slug],
    queryFn: () => vendorsApi.detail(slug).then(r => r.data),
    retry: false,
  });

  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products-public', slug, sort],
    queryFn: () => productsApi.list({ vendor: vendor?.id, ordering: sort }).then(r => r.data),
    enabled: !!vendor?.id,
  });

  const products: Product[] = (() => {
    const d = productData;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.results)) return d.results;
    return [];
  })();

  // People also buy — random from other products
  const { data: relatedData } = useQuery({
    queryKey: ['related-products', vendor?.id],
    queryFn: () => productsApi.list({ limit: 8 }).then(r => r.data),
    enabled: !!vendor?.id,
  });
  const related: Product[] = (() => {
    const d = relatedData;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d.results)) return d.results;
    return [];
  })().filter((p: Product) => !products.find(vp => vp.id === p.id)).slice(0, 6);

  if (vendorLoading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
      <Loader2 size={32} className="animate-spin text-indigo-400"/>
    </div>
  );

  if (isError || !vendor) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <p className="text-5xl mb-4">🏪</p>
      <h1 className="text-2xl font-black text-white mb-2">Vendor Not Found</h1>
      <p className="text-white/50 mb-6">This shop may no longer be available.</p>
      <Link href="/vendors" className="btn-primary px-5 py-2.5 rounded-xl text-sm">Browse All Vendors</Link>
    </div>
  );

  const memberSince = new Date(vendor.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Back */}
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={14}/> All Vendors
      </Link>

      {/* Vendor Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8 mb-8 relative overflow-hidden">
        {/* decorative gradient blob */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"/>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-4xl shrink-0 border border-white/10">
            {vendor.logo
              ? <img src={vendor.logo} alt={vendor.shop_name} className="w-full h-full object-cover rounded-2xl"/>
              : '🏪'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">{vendor.shop_name}</h1>
              <span className="badge badge-green text-xs">Verified</span>
            </div>
            {vendor.city && (
              <p className="text-white/50 text-sm flex items-center gap-1 mb-2">
                <MapPin size={13}/> {vendor.city}{vendor.address ? `, ${vendor.address}` : ''}
              </p>
            )}
            {vendor.phone && (
              <p className="text-white/50 text-sm flex items-center gap-1 mb-3">
                <Phone size={13}/> {vendor.phone}
              </p>
            )}
            <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
              {vendor.description || 'Quality shoes from a verified vendor.'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex sm:flex-col gap-4 sm:gap-3 shrink-0">
            <div className="text-center sm:text-right">
              <p className="text-xl font-black text-white flex items-center gap-1 justify-center sm:justify-end">
                <Star size={16} className="fill-amber-400 text-amber-400"/>
                {Number(vendor.rating || 0).toFixed(1)}
              </p>
              <p className="text-white/40 text-xs">Rating</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xl font-black text-white">{vendor.total_sales ?? 0}</p>
              <p className="text-white/40 text-xs">Total Sales</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xl font-black text-white">{products.length || vendor.product_count || 0}</p>
              <p className="text-white/40 text-xs">Products</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
          <Package size={13} className="text-white/30"/>
          <p className="text-white/35 text-xs">Member since {memberSince}</p>
        </div>
      </motion.div>

      {/* Products Section */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-xl font-bold text-white">
            Products <span className="text-white/40 font-normal text-base">({products.length})</span>
          </h2>
          <select value={sort} onChange={e => setSort(e.target.value)} className="glass-input sm:w-44">
            <option value="-created_at"  className="bg-gray-900">Newest First</option>
            <option value="price"        className="bg-gray-900">Price: Low → High</option>
            <option value="-price"       className="bg-gray-900">Price: High → Low</option>
            <option value="-rating"      className="bg-gray-900">Top Rated</option>
          </select>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card aspect-square shimmer rounded-2xl"/>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card p-14 text-center">
            <p className="text-4xl mb-3">📦</p>
            <h3 className="text-lg font-bold text-white mb-1">No products yet</h3>
            <p className="text-white/40 text-sm">This vendor hasn't listed any products.</p>
          </div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.id} p={p}/>)}
          </motion.div>
        )}
      </div>

      {/* People Also Buy */}
      {related.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">People Also Buy</h2>
            <Link href="/products" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              Browse all →
            </Link>
          </div>
          <motion.div initial="hidden" animate="show" variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {related.map(p => <ProductCard key={p.id} p={p}/>)}
          </motion.div>
        </div>
      )}
    </div>
  );
}
