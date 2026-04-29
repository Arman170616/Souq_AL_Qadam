'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { items, remove } = useWishlistStore();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleAddToCart = (item: typeof items[0]) => {
    addItem({
      id: item.productId, productId: item.productId,
      name: item.name, price: item.price,
      image: item.image, size: 'One Size',
      color: '', vendorName: item.vendorName, slug: item.slug,
    });
    toast.success(`${item.name} added to cart!`);
  };

  if (!isAuthenticated) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <Heart size={56} className="text-white/10 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Sign in to view your wishlist</h2>
      <p className="text-white/40 text-sm mb-6">Your saved items will appear here once you sign in.</p>
      <Link href="/login" className="btn-primary px-8 py-3 rounded-xl inline-flex items-center gap-2">
        Sign In <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Heart size={20} className="text-pink-400 fill-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">My Wishlist</h1>
          <p className="text-white/40 text-sm">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-16 text-center">
          <Heart size={56} className="text-white/10 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h2>
          <p className="text-white/40 text-sm mb-6">Save items you love by clicking the heart icon on any product.</p>
          <Link href="/products" className="btn-primary px-8 py-3 rounded-xl inline-flex items-center gap-2">
            Browse Products <ArrowRight size={16} />
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div key={item.productId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="glass-card flex gap-4 p-4 items-center">
                  {/* Image */}
                  <Link href={`/products/${item.slug}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-xl bg-white/5 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">👟</div>
                      }
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.slug}`}>
                      <p className="font-semibold text-white text-sm line-clamp-2 hover:text-indigo-300 transition-colors">
                        {item.name}
                      </p>
                    </Link>
                    <p className="text-white/40 text-xs mt-0.5">{item.vendorName}</p>
                    <p className="text-white font-bold mt-1">{formatPrice(item.price)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => handleAddToCart(item)}
                      className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all"
                      title="Add to cart">
                      <ShoppingBag size={16} />
                    </button>
                    <button onClick={() => remove(item.productId)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-white/40 text-sm">{items.length} item{items.length !== 1 && 's'} saved</p>
            <Link href="/products" className="btn-glass px-5 py-2.5 rounded-xl text-sm">
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
